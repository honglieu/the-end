import { Component, NgZone, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { LoadingService } from '@services/loading.service';
import {
  CALENDAR_CONNECT_SUCCESSFULLY,
  CALENDAR_CONNECT_DESCRIPTION,
  CALENDAR_CONNECT_TITLE,
  CALENDAR_DISCONNECT_DESCRIPTION,
  CALENDAR_FAILED_CONNECT_DESCRIPTION,
  MAIL_BOX_DISCONNECT,
  GET_CALENDAR_DISCONNECT_TITLE,
  GET_CALENDAR_FAILED_CONNECT_TITLE,
  CHANGE_SUCCESSFULLY_ERROR
} from '@services/messages.constants';
import { SharedService } from '@services/shared.service';
import {
  configGoogleCalendar,
  outlookCalendarAuthUrl
} from 'src/environments/environment';
import { ResponseAuth } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { EmailProvider } from '@shared/enum/inbox.enum';
import { EIntegrationsStatus } from '@/app/profile-setting/utils/integrations.interface';
import { EMAIL_SYNC_TYPE } from '@/app/mailbox-setting/utils/constant';
import { SharedWorkerService } from '@/app/shared-worker.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { IntegrationsService } from '@/app/profile-setting/services/integrations.service';
@Component({
  selector: 'calendar-connect-popup',
  templateUrl: './calendar-connect-popup.component.html',
  styleUrls: ['./calendar-connect-popup.component.scss']
})
export class CalendarConnectPopupComponent implements OnInit {
  readonly TIME_OPEN_POPUP = 30 * 24 * 60 * 60 * 1000;
  public isOpenPopup: boolean;
  public isAutoOpenPopup: boolean;
  public title: string;
  public description: string;
  public isConsole: boolean;
  public selectedCalendarProvider: EmailProvider;
  public readonly emailProvider = EmailProvider;
  public readonly EIntegrationsStatus = EIntegrationsStatus;
  private destroy$ = new Subject<void>();
  public userCalendarSettingId: string;
  public status: string;
  private isFailStatus: boolean;
  private isDisconnectStatus: boolean;
  public isReconnect: boolean;
  public isSyncing: boolean;
  private newWindow: Window | null;
  private lastCloseBannerCalendar: string;
  public codeClientConfigInit: {
    client_id: string;
    scope: string;
    ux_mode: string;
    select_account: boolean;
    redirect_uri: string;
    error_callback: (error: any) => void;
  };
  public configEventsList: {};
  constructor(
    private agencyService: AgencyService,
    public loadingService: LoadingService,
    private dashboardApiService: DashboardApiService,
    private toastService: ToastrService,
    private inboxSidebarService: InboxSidebarService,
    private sharedService: SharedService,
    private sharedWorkerService: SharedWorkerService,
    private websocketService: RxWebsocketService,
    private ngZone: NgZone,
    private integrationsService: IntegrationsService
  ) {
    this.isAutoOpenPopup = true;
    this.codeClientConfigInit = {
      client_id: configGoogleCalendar.CLIENT_ID,
      scope: configGoogleCalendar.SCOPE_CALENDAR,
      ux_mode: 'popup',
      select_account: true,
      redirect_uri: configGoogleCalendar.REDIRECT_URI,
      error_callback: (error) => {
        console.log('error', error);
      }
    };
    this.sharedWorkerService.messages
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (!data) return;
        if (!data.payload && !data.type) {
          this.newWindow.close();
          return;
        }
        this.ngZone.run(() => {
          this.newWindow.close();
          this.handleSharedWorkerEvent(data);
          localStorage.removeItem('integrateType');
        });
      });
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.websocketService.onSocketSyncCalendar
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        switch (res?.status) {
          case EIntegrationsStatus.SYNCING:
            this.toastService.clear();
            this.toastService.show(
              'Events syncing',
              '',
              {
                disableTimeOut: false
              },
              'toast-syncing-custom'
            );
            break;
          case EIntegrationsStatus.CONNECTED:
            this.toastService.clear();
            if (this.status === EIntegrationsStatus.DISCONNECTED) {
              this.toastService.success(CALENDAR_CONNECT_SUCCESSFULLY);
            }
            this.toastService.success('Events synced');
            this.getData();
            break;
          case EIntegrationsStatus.FAILED:
          case EIntegrationsStatus.DISCONNECTED:
            this.toastService.clear();
            this.toastService.error('Events failed');
            break;
          default:
            break;
        }
      });
    this.getData();
  }

  handleSharedWorkerEvent(event) {
    switch (event?.type) {
      case EMAIL_SYNC_TYPE.INTEGRATE_CALENDAR:
        this.handleIntegrateCalendarSuccess(event);
        break;
      case EMAIL_SYNC_TYPE.RECONNECT_CALENDAR:
        this.handleReconnectCalendarSuccess(event);
        break;
      default:
        break;
    }
  }

  handleIntegrateCalendarSuccess = (event) => {
    if (event.isSuccess) {
      if (event.payload.status === EIntegrationsStatus.CONNECTED) {
        const config = event?.payload?.config;
        this.configEventsList = config;
        this.toastService.success(CALENDAR_CONNECT_SUCCESSFULLY);
        this.integrationsService.setPopupState({
          showPopupSelectEvents: true
        });
      }
      this.getData();
    } else {
      this.toastService.show(
        event?.payload?.message,
        '',
        {
          disableTimeOut: false
        },
        'toast-error-custom'
      );
    }
  };

  handleReconnectCalendarSuccess = (event) => {
    if (event.isSuccess) {
      if (event.payload.status === EIntegrationsStatus.CONNECTED) {
        this.toastService.success(CALENDAR_CONNECT_SUCCESSFULLY);
      }
      localStorage.removeItem('userCalendarSettingId');
      this.getData();
    } else {
      this.toastService.error(MAIL_BOX_DISCONNECT);
    }
  };

  getData(): void {
    //TODO REMOVE SOON
    // this.getCalendarData();
  }

  getCalendarData(): void {
    this.dashboardApiService.getCalendarDataApi().subscribe({
      next: (res) => {
        this.isSyncing = res?.status === EIntegrationsStatus.SYNCING;
        if (this.isSyncing) {
          return;
        }
        this.status = res?.status;
        this.isFailStatus = this.status === EIntegrationsStatus.FAILED;
        this.isDisconnectStatus =
          this.status === EIntegrationsStatus.DISCONNECTED;
        this.isReconnect = this.isFailStatus || this.isDisconnectStatus;
        this.lastCloseBannerCalendar = res?.lastCloseBannerCalendar;
        this.userCalendarSettingId = res?.id;
        switch (res?.provider) {
          case this.emailProvider.GOOGLE:
            this.selectedCalendarProvider = this.emailProvider.GOOGLE;
            break;
          case this.emailProvider.OUTLOOK:
            this.selectedCalendarProvider = this.emailProvider.OUTLOOK;
            break;
        }
        this.handleAutoOpenPopup();
        this.updateTitleAndDescription();
      },
      error: ({ error }) => {
        this.toastService.error(error?.message);
      }
    });
  }

  updateTitleAndDescription(): void {
    const status = this.status;
    if (status === EIntegrationsStatus.CONNECTED) {
      this.isOpenPopup = false;
      return;
    }
    this.isOpenPopup = !this.lastCloseBannerCalendar && this.isAutoOpenPopup;
    this.title = this.isDisconnectStatus
      ? GET_CALENDAR_DISCONNECT_TITLE(this.selectedCalendarProvider)
      : this.isFailStatus
      ? GET_CALENDAR_FAILED_CONNECT_TITLE(this.selectedCalendarProvider)
      : CALENDAR_CONNECT_TITLE;
    this.description = this.isDisconnectStatus
      ? CALENDAR_DISCONNECT_DESCRIPTION
      : this.isFailStatus
      ? CALENDAR_FAILED_CONNECT_DESCRIPTION
      : CALENDAR_CONNECT_DESCRIPTION;
  }

  public async integrateCalendar() {
    if (this.isConsole && !this.inboxSidebarService.isAccountAdded.value)
      return;
    const client = window.google.accounts.oauth2.initCodeClient({
      ...this.codeClientConfigInit,
      callback: ({ code }: ResponseAuth) => {
        if (!code) return;
        const type = this.selectedCalendarProvider;
        this.dashboardApiService
          .integrateCalendarProvider({ code, type })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              this.configEventsList = res?.config;
              this.isOpenPopup = false;
              this.getCalendarData();
              this.toastService.success(CALENDAR_CONNECT_SUCCESSFULLY);
              this.integrationsService.setPopupState({
                showPopupSelectEvents: true
              });
            },
            error: ({ error }) => {
              this.toastService.show(
                error?.message,
                '',
                {
                  disableTimeOut: false
                },
                'toast-error-custom'
              );
            }
          });
      }
    });
    return client.requestCode();
  }

  public async integrateReconnectCalendar() {
    if (this.isConsole && !this.inboxSidebarService.isAccountAdded.value)
      return;
    const client = window.google.accounts.oauth2.initCodeClient({
      ...this.codeClientConfigInit,
      callback: ({ code }: ResponseAuth) => {
        if (!code) return;
        let userCalendarSettingId = this.userCalendarSettingId;
        let type = this.selectedCalendarProvider;
        this.dashboardApiService
          .connectAgainCalendar({
            code,
            type,
            userCalendarSettingId
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              if (res?.status === EIntegrationsStatus.CONNECTED) {
                this.toastService.success(CALENDAR_CONNECT_SUCCESSFULLY);
              }
              this.getCalendarData();
            },
            error: () => {
              this.toastService.error(MAIL_BOX_DISCONNECT);
            }
          });
      }
    });
    return client.requestCode();
  }

  handleIntegrateOutLook(connectType: string) {
    localStorage.setItem('integrateType', connectType);
    localStorage.setItem('userCalendarSettingId', this.userCalendarSettingId);
    this.newWindow = window.open(
      outlookCalendarAuthUrl,
      'popup',
      `width=600,height=600,left=${(window.innerWidth - 600) / 2},top=${
        (window.innerHeight - 600) / 2
      }
  `
    );
  }

  async handleActive(provider: EmailProvider) {
    if (this.isConsole) return;
    this.selectedCalendarProvider = provider;
    switch (this.selectedCalendarProvider) {
      case EmailProvider.GOOGLE:
        await this.integrateCalendar();
        break;
      case EmailProvider.OUTLOOK:
        this.handleIntegrateOutLook(EMAIL_SYNC_TYPE.INTEGRATE_CALENDAR);
        break;
    }
  }

  async handleReconnect() {
    if (this.isFailStatus) {
      this.handleRetryCalendar();
    } else if (this.isDisconnectStatus) {
      switch (this.selectedCalendarProvider) {
        case EmailProvider.GOOGLE:
          this.integrateReconnectCalendar();
          break;
        case EmailProvider.OUTLOOK:
          this.handleIntegrateOutLook(EMAIL_SYNC_TYPE.RECONNECT_CALENDAR);
          break;
      }
    }
  }

  handleRetryCalendar() {
    this.dashboardApiService
      .retryCalendar(this.userCalendarSettingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res?.status === EIntegrationsStatus.CONNECTED) {
            this.toastService.success(CALENDAR_CONNECT_SUCCESSFULLY);
          }
          this.getData();
        },
        error: () => {
          this.toastService.error(MAIL_BOX_DISCONNECT);
        }
      });
  }

  handleClosePopup() {
    this.dashboardApiService
      .closePopupCalendar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isOpenPopup = false;
          this.isAutoOpenPopup = false;
        },
        error: () => {
          this.toastService.error(CHANGE_SUCCESSFULLY_ERROR);
        }
      });
  }

  handleAutoOpenPopup() {
    const closedDate = this.getClosedDate();
    if (closedDate) {
      const now = new Date();
      if (
        (this.isReconnect && !this.lastCloseBannerCalendar) ||
        this.isTimeElapsed(now, closedDate, this.TIME_OPEN_POPUP)
      ) {
        this.clearPopupStatus();
      }
    }
  }

  getClosedDate(): Date | null {
    if (this.lastCloseBannerCalendar) {
      return new Date(this.lastCloseBannerCalendar);
    }
    return null;
  }

  isTimeElapsed(now: Date, closedDate: Date, time: number): boolean {
    return (
      now.getTime() - closedDate.getTime() >= time &&
      this.status !== EIntegrationsStatus.CONNECTED
    );
  }

  clearPopupStatus(): void {
    this.lastCloseBannerCalendar = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
