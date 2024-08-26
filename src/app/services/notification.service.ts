import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  of,
  switchMap,
  tap
} from 'rxjs';
import { conversations } from 'src/environments/environment';
import {
  Notification,
  NotificationApiResponse,
  NotificationByDate,
  NotificationCountApiResponse
} from '@shared/types/notification.interface';
import {
  NotificationStatusEnum,
  NotificationTabEnum
} from '@shared/enum/notification.enum';
import { ApiService } from './api.service';
import { SocketNotificationData } from '@shared/types/socket.interface';
import dayjs from 'dayjs';
import { SHORT_ISO_DATE } from './constants';
import { ComponentPortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { NotificationComponent } from '@/app/dashboard/modules/notification/notification.component';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SocketType } from '../shared';
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public activeTab$: BehaviorSubject<any> = new BehaviorSubject<any>(
    NotificationTabEnum.UNREAD
  );
  public currentNotiList$: BehaviorSubject<NotificationByDate[]> =
    new BehaviorSubject<NotificationByDate[]>([]);
  public unseenNotiList$: BehaviorSubject<NotificationByDate[]> =
    new BehaviorSubject<NotificationByDate[]>([]);
  public allNotiList$: BehaviorSubject<NotificationByDate[]> =
    new BehaviorSubject<NotificationByDate[]>([]);
  public isUnseen: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public unreadCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public currentUnseenPage$: BehaviorSubject<number> =
    new BehaviorSubject<number>(0);
  public currentUnseenTotalPages$: BehaviorSubject<number> =
    new BehaviorSubject<number>(0);
  public currentAllPage$: BehaviorSubject<number> = new BehaviorSubject<number>(
    0
  );
  public currentAllTotalPage$: BehaviorSubject<number> =
    new BehaviorSubject<number>(0);
  public reloadNotiList: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public markAsReadNoti: BehaviorSubject<string> = new BehaviorSubject(null);
  private isShowNotiWarningBS: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public isShowNotiWarning$ = this.isShowNotiWarningBS.asObservable();
  private overlayRef: OverlayRef;
  private isShowNotification: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  private openModalWarningFromNoti: BehaviorSubject<boolean> =
    new BehaviorSubject(false);

  get openModalWarningFromNoti$() {
    return this.openModalWarningFromNoti.asObservable();
  }

  setOpenModalWarningFromNoti(value) {
    this.openModalWarningFromNoti.next(value);
  }
  public setIsShowNotiWarning(isShow: boolean) {
    this.isShowNotiWarningBS.next(isShow);
  }

  constructor(
    private apiService: ApiService,
    private overlay: Overlay,
    private agencyDateFormatService: AgencyDateFormatService
  ) {
    this.markAsReadNoti
      .pipe(
        distinctUntilChanged(),
        switchMap((res) => {
          if (res) {
            return this.markNotificationAsRead(res);
          } else {
            return of(null);
          }
        })
      )
      .subscribe((res) => {
        if (!res) return;
        this.reloadNotiList.next(true);
        this.removeNotiFromUnseenList(this.markAsReadNoti.value);
        this.markAsReadNoti.next(null);
      });
  }

  public getListNotification(
    pageIndex: number = 0,
    status?: NotificationStatusEnum
  ): Observable<NotificationApiResponse> {
    return this.apiService
      .getAPI(
        conversations,
        'notification',
        status ? { status, pageIndex } : { pageIndex }
      )
      .pipe(
        tap((value: NotificationApiResponse) => {
          const groupArray = this.groupNotificationByDate(value.list);
          if (status == NotificationStatusEnum.UN_SEEN) {
            if (pageIndex > 0)
              this.concatNotiList(this.unseenNotiList$, value.list);
            else this.unseenNotiList$.next(groupArray);
          }
          if (!status) {
            if (pageIndex > 0)
              this.concatNotiList(this.allNotiList$, value.list);
            else this.allNotiList$.next(groupArray);
          }
          this.isUnseen.next(value.isEnableRedDot);
          this.unreadCount.next(value.unreadCount);
        })
      );
  }

  public getNotificationById(notificationId: string) {
    return this.apiService.getAPI(
      conversations,
      `notification/${notificationId}`
    );
  }

  public getNotificationUnreadCount(): Observable<NotificationCountApiResponse> {
    return this.apiService
      .getAPI(conversations, `notification/count/unread`)
      .pipe(
        tap((value: NotificationCountApiResponse) => {
          this.isUnseen.next(value.isEnableRedDot);
          this.unreadCount.next(value.unreadCount);
        })
      );
  }

  public markAllAsRead(userId: string) {
    return this.apiService.postAPI(
      conversations,
      `notification/mark-all-as-read?userId=${userId}`,
      {}
    );
  }

  public markNotificationAsRead(
    notiId: string
  ): Observable<{ message: string }> {
    return this.apiService.postAPI(conversations, 'notification/mark-read', {
      notiId
    });
  }
  public markNotificationUnRead(
    notiId: string
  ): Observable<{ message: string }> {
    return this.apiService.postAPI(conversations, 'notification/mark-unread', {
      notiId
    });
  }

  private getTimezone() {
    return (
      this.agencyDateFormatService.getCurrentTimezone()?.value ||
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  }

  groupNotificationByDate(list: Notification[]) {
    list.sort((a, b) => {
      const timeLeft = new Date(a.createdAt).getTime();
      const timeRight = new Date(b.createdAt).getTime();
      return timeRight - timeLeft;
    });

    const timezone = this.getTimezone();
    const groups = list.reduce((groups, noti) => {
      const date = dayjs(noti.createdAt).tz(timezone).format(SHORT_ISO_DATE);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(noti);
      return groups;
    }, {});
    const groupArrays = Object.keys(groups).map((date) => {
      return {
        date,
        notificationList: groups[date]
      };
    });
    return groupArrays;
  }

  public pushNewNotification(
    notificationGroup: BehaviorSubject<NotificationByDate[]>,
    noti: SocketNotificationData
  ) {
    let currentArrayGroup = notificationGroup.getValue();
    const timezone = this.getTimezone();
    const notiDate = dayjs(noti.createdAt).tz(timezone).format(SHORT_ISO_DATE);
    const group = currentArrayGroup.find((obj) => obj.date === notiDate);

    if (group) {
      const exist = group.notificationList.find(
        (x) => x.socketTrackId === noti.socketTrackId
      );
      if (!exist)
        group.notificationList = [
          noti as Notification,
          ...group.notificationList
        ];
    } else {
      const newGroup = {
        date: notiDate,
        notificationList: [noti as Notification]
      };
      currentArrayGroup = [newGroup, ...currentArrayGroup];
    }
    currentArrayGroup = this.filterNotificationsInternalNote(
      currentArrayGroup,
      noti
    );
    notificationGroup.next(currentArrayGroup);
  }

  filterNotificationsInternalNote(
    currentArrayGroup: NotificationByDate[],
    noti: SocketNotificationData
  ): NotificationByDate[] {
    currentArrayGroup.forEach((group) => {
      group.notificationList = group.notificationList
        .map((item) => {
          if (
            noti.type === SocketType.updateNotification &&
            item.id === noti.id
          ) {
            return {
              ...item,
              options: noti.options
            };
          }
          return item;
        })
        .filter((item) => {
          if (noti.type === SocketType.deleteNotification) {
            return item.id !== noti.id;
          }
          return !(
            item.id === noti.id && item.type === SocketType.updateNotification
          );
        });
    });
    return currentArrayGroup;
  }

  public concatNotiList(
    currentNotificationGroup: BehaviorSubject<NotificationByDate[]>,
    notiList: Notification[]
  ) {
    let currentNotiList = currentNotificationGroup
      .getValue()
      .map((item) => {
        return item.notificationList;
      })
      .flatMap((item) => [...item]);
    currentNotiList = [...currentNotiList, ...notiList];
    const group = this.groupNotificationByDate(currentNotiList);
    currentNotificationGroup.next(group);
  }

  public removeNotiFromUnseenList(notiId: string) {
    let list = this.unseenNotiList$
      .getValue()
      .flatMap((item) => item.notificationList);
    list = list.filter((noti) => noti.id !== notiId);
    let group = this.groupNotificationByDate(list);
    this.unseenNotiList$.next(group);
    const allListNoti = this.allNotiList$
      .getValue()
      .flatMap((item) => item.notificationList);
    const noti = allListNoti.find((item) => item.id === notiId);
    if (noti) {
      noti.status = NotificationStatusEnum.SEEN;
    }
    group = this.groupNotificationByDate([...allListNoti]);
    this.allNotiList$.next(group);
    if (!list.length) {
      this.isUnseen.next(false);
    }
  }

  addNotificationToUnseenList(noti) {
    let list = this.unseenNotiList$
      .getValue()
      .flatMap((item) => item.notificationList);
    const group = this.groupNotificationByDate([...list, noti]);
    this.unseenNotiList$.next(group);
  }

  public getIsShowNotification() {
    return this.isShowNotification.asObservable();
  }

  public getValueIsShowNotification() {
    return this.isShowNotification.getValue();
  }

  public setIsShowNotification(value: boolean) {
    this.isShowNotification.next(value);
  }

  public handleOpenNotification(): void {
    let isShow = true;

    if (!this.isShowNotification.value) {
      this.attachComponentToBody();
    } else {
      isShow = false;
    }

    this.isShowNotification.next(isShow);
  }

  public handleCloseNotification(): void {
    this.isShowNotification.next(false);
    this.activeTab$.next(NotificationTabEnum.UNREAD);
  }

  private attachComponentToBody(): void {
    this.destroyComponent();
    this.overlayRef = this.overlay.create();
    const componentPortal = new ComponentPortal(NotificationComponent);
    const componentRef = this.overlayRef.attach(componentPortal);
    componentRef.instance.isShowNotificationBS = this.isShowNotification;
    componentRef.instance.destroyRef = () => {
      if (this.overlayRef) {
        this.overlayRef.detach();
      }
      this.isShowNotification.next(!this.isShowNotification);
    };
    this.overlayRef.outsidePointerEvents().subscribe(() => {
      if (!this.overlayRef) return;
      this.activeTab$.next(NotificationTabEnum.UNREAD);
      this.isShowNotification.next(false);
    });
  }

  public destroyComponent(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
    }
  }
}
