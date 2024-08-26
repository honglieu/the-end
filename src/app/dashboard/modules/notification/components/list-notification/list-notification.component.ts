import { Component, OnDestroy, OnInit } from '@angular/core';
import dayjs from 'dayjs';
import {
  Subject,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { SHORT_ISO_DATE } from '@services/constants';
import { NotificationService } from '@services/notification.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { UserService } from '@services/user.service';
import {
  NotificationStatusEnum,
  NotificationTabEnum
} from '@shared/enum/notification.enum';
import { SocketType } from '@shared/enum/socket.enum';

interface ImageEmpty {
  id: number;
  title: string;
  sub: string;
  icon: string;
}

@Component({
  selector: 'list-notification',
  templateUrl: './list-notification.component.html',
  styleUrls: ['./list-notification.component.scss']
})
export class ListNotificationComponent implements OnInit, OnDestroy {
  public NotificationTab = NotificationTabEnum;
  public currentActiveTab = NotificationTabEnum.UNREAD;
  private unsubscribe = new Subject<void>();
  public todayStr: string = '';
  public readonly FIRST_PAGE = 0;
  public readonly LAZY_LOAD_NOTIFICATION = 50;
  public scrolledToBottom = false;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;

  private _listImageEmpty: ImageEmpty[] = [
    {
      id: 1,
      title: 'You’re up to date.',
      sub: 'Off to the kitchen – you deserve a fresh brew.',
      icon: 'glassNoti'
    },
    {
      id: 2,
      title: 'Look at you ticking boxes.',
      sub: 'Perfect time for a little water-cooler chat.',
      icon: 'chatNoti'
    },
    {
      id: 3,
      title: 'You’re all caught up!',
      sub: 'Is there a better feeling than an empty inbox?',
      icon: 'boxNoti'
    },
    {
      id: 4,
      title: 'Empty inbox, fresh coffee.',
      sub: 'Name a better duo – we’ll wait.',
      icon: 'coffeeNoti'
    }
  ];
  public currentImage: ImageEmpty;
  public previousImage: ImageEmpty;

  constructor(
    public notificationService: NotificationService,
    public rxWebSocketService: RxWebsocketService,
    public agencyService: AgencyService,
    public userService: UserService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {
    this.subscribeToSocketNoti();
    this.getAllNotification(this.FIRST_PAGE);
    this.getUnseenNotification(this.FIRST_PAGE);
    this.notificationService.activeTab$
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
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
    this.notificationService.currentNotiList$
      .pipe(
        takeUntil(this.unsubscribe),
        map((res) => res.length),
        distinctUntilChanged(),
        filter((length) => !length)
      )
      .subscribe(() => this._randomImage());
    this.subscribeReloadNotiList();

    this.agencyDateFormatService.timezone$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((timezoneObj) => {
        this.todayStr = dayjs().tz(timezoneObj.value).format(SHORT_ISO_DATE);
      });
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

  private generateIndex() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const normalized = array[0] / (0xffffffff + 1);
    const decimal = normalized * 0.9 + 0.1;
    return Math.floor(decimal * this._listImageEmpty.length);
  }

  private _randomImage() {
    let randomIndex = this.generateIndex();
    this.previousImage = this.currentImage;
    while (this._listImageEmpty[randomIndex]?.id === this.previousImage?.id) {
      randomIndex = this.generateIndex();
    }
    this.currentImage = this._listImageEmpty[randomIndex];
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
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  markAllAsRead() {
    const userId = this.userService.userInfo$.value?.id;
    this.notificationService.markAllAsRead(userId).subscribe((rs) => {
      this.notificationService.isUnseen.next(false);
      this.notificationService.unreadCount.next(0);
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
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (
      distanceFromBottom <= this.LAZY_LOAD_NOTIFICATION &&
      !this.scrolledToBottom
    ) {
      this.getNextPage();
      this.scrolledToBottom = true;
    } else if (
      distanceFromBottom >= this.LAZY_LOAD_NOTIFICATION &&
      this.scrolledToBottom
    ) {
      this.scrolledToBottom = false;
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
