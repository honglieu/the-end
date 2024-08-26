import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  distinctUntilChanged,
  filter,
  Subject,
  takeUntil,
  switchMap,
  of
} from 'rxjs';
import { SHORT_ISO_DATE } from '@services/constants';
import { HeaderService } from '@services/header.service';
import { NotificationService } from '@services/notification.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { NotificationTabEnum } from '@shared/enum/notification.enum';
import { NotificationStatusEnum } from '@shared/enum/notification.enum';
import dayjs from 'dayjs';
import { AgencyService } from '@services/agency.service';
import { UserService } from '@services/user.service';
import { SocketType } from '@shared/enum/socket.enum';
@Component({
  selector: 'list-notification',
  templateUrl: './list-notification.component.html',
  styleUrls: ['./list-notification.component.scss']
})
export class ListNotificationComponent implements OnInit, OnDestroy {
  public isOpen: boolean = false;
  public NotificationTab = NotificationTabEnum;
  public currentActiveTab = NotificationTabEnum.UNREAD;
  private unsubscribe = new Subject<void>();
  public today = dayjs().format(SHORT_ISO_DATE);
  public readonly FIRST_PAGE = 0;
  constructor(
    private headerService: HeaderService,
    public notificationService: NotificationService,
    public rxWebSocketService: RxWebsocketService,
    public agencyService: AgencyService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    this.subscribeToSocketNoti();
    this.headerService.isOpenNotificationList.subscribe((res) => {
      this.isOpen = res;
    });
    this.getAllNotification(this.FIRST_PAGE);
    this.getUnseenNotification(this.FIRST_PAGE);
    this.notificationService.activeTab$
      .pipe(takeUntil(this.unsubscribe))
      .pipe(distinctUntilChanged())
      .subscribe((res) => {
        this.currentActiveTab = res;
        if (this.currentActiveTab == NotificationTabEnum.UNREAD) {
          this.notificationService.currentNotiList$ =
            this.notificationService.unseenNotiList$;
        } else {
          this.notificationService.currentNotiList$ =
            this.notificationService.allNotiList$;
        }
      });
    this.subscribeReloadNotiList();
  }

  subscribeReloadNotiList() {
    this.notificationService.reloadNotiList
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((res) => {
          if (!res) return of(null);
          return this.notificationService.getListNotification(0, null);
        })
      )
      .subscribe((res) => {
        if (!res) return;
        this.notificationService.currentAllPage$.next(res.currentPage);
        this.notificationService.currentAllTotalPage$.next(res.totalPages);
        this.notificationService.reloadNotiList.next(false);
      });
  }

  switchTab(notificationTab: NotificationTabEnum) {
    this.notificationService.activeTab$.next(notificationTab);
  }

  getAllNotification(pageIndex: number) {
    this.notificationService
      .getListNotification(pageIndex, null)
      .subscribe((rs) => {
        this.notificationService.currentAllPage$.next(rs.currentPage);
        this.notificationService.currentAllTotalPage$.next(rs.totalPages);
      });
  }

  getUnseenNotification(pageIndex: number) {
    this.notificationService
      .getListNotification(pageIndex, NotificationStatusEnum.UN_SEEN)
      .subscribe((rs) => {
        this.notificationService.currentUnseenPage$.next(rs.currentPage);
        this.notificationService.currentUnseenTotalPages$.next(rs.totalPages);
        this.notificationService.isUnseen.next(!!rs.list.length);
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
  }

  markAllAsRead() {
    const userId = this.userService.userInfo$.getValue().id;
    this.notificationService.markAllAsRead(userId).subscribe((rs) => {
      this.notificationService.isUnseen.next(false);
      this.getAllNotification(this.FIRST_PAGE);
      this.getUnseenNotification(this.FIRST_PAGE);
    });
  }

  subscribeToSocketNoti() {
    this.rxWebSocketService.onSocketNotification
      .pipe(
        filter((x) => x.type !== SocketType.reloadNotification),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe((rs) => {
        this.notificationService.pushNewNotification(
          this.notificationService.unseenNotiList$,
          rs
        );
        this.notificationService.pushNewNotification(
          this.notificationService.allNotiList$,
          rs
        );
        this.notificationService.isUnseen.next(true);
      });
  }

  onScroll($event: Event) {
    const element = $event.target as HTMLElement;
    if (element.scrollHeight - element.scrollTop == element.clientHeight) {
      this.getNextPage();
    }
  }

  getNextPage() {
    let currentPage =
      this.currentActiveTab == NotificationTabEnum.ALL
        ? this.notificationService.currentAllPage$.getValue()
        : this.notificationService.currentUnseenPage$.getValue();
    const currentTotalPage =
      this.currentActiveTab == NotificationTabEnum.ALL
        ? this.notificationService.currentAllTotalPage$.getValue()
        : this.notificationService.currentUnseenTotalPages$.getValue();
    if (currentPage < currentTotalPage - 1) {
      currentPage++;
      if (this.currentActiveTab == NotificationTabEnum.ALL) {
        this.getAllNotification(currentPage);
      } else {
        this.getUnseenNotification(currentPage);
      }
    }
  }
}
