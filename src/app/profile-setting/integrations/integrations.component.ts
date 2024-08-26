import { Component, NgZone, OnInit } from '@angular/core';
import { Subject, skip, takeUntil } from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { IntegrationsService } from '@/app/profile-setting/services/integrations.service';
import { LoadingService } from '@services/loading.service';
import {
  EIntegrationPopUp,
  EIntegrationsLabel
} from '@/app/profile-setting/utils/integrations.interface';
import { EmailProvider } from '@shared/enum/inbox.enum';
import {
  configGoogleCalendar,
  outlookCalendarAuthUrl
} from 'src/environments/environment';
import { ResponseAuth } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { ToastrService } from 'ngx-toastr';
import { MAIL_BOX_DISCONNECT } from '@services/messages.constants';
import { SharedService } from '@services/shared.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { SharedWorkerService } from '@/app/shared-worker.service';
import { EMAIL_SYNC_TYPE } from '@/app/mailbox-setting/utils/constant';
import { EIntegrationsStatus } from '@/app/profile-setting/utils/integrations.interface';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'integrations',
  templateUrl: './integrations.component.html',
  styleUrls: ['./integrations.component.scss']
})
export class IntegrationsComponent implements OnInit {
  private destroy$ = new Subject<void>();
  public integrationsList = [];
  public ECRMSystem = ECRMSystem;
  public currentCompanyCRMSystemName$ =
    this.companyService.currentCompanyCRMSystemName;
  public isLoading: boolean = true;
  public provider: EmailProvider;
  public label: string;
  public userCalendarSettingId: string;
  public config: {};
  private newWindow: Window | null;
  public isShowConnected: boolean = false;
  public isRmEnvironment: boolean = false;

  public popupState: EIntegrationPopUp;
  readonly EPoupState = EIntegrationPopUp;
  private selectedCalendarProvider: EmailProvider;
  public isConsole: boolean;
  public status: EIntegrationsStatus;
  constructor(
    private agencyService: AgencyService,
    public loadingService: LoadingService,
    private integrationsService: IntegrationsService,
    private dashboardApiService: DashboardApiService,
    private toastService: ToastrService,
    private sharedService: SharedService,
    private inboxSidebarService: InboxSidebarService,
    private sharedWorkerService: SharedWorkerService,
    private ngZone: NgZone,
    private companyService: CompanyService
  ) {
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
          switch (data?.type) {
            case EMAIL_SYNC_TYPE.INTEGRATE_CALENDAR:
              if (data.isSuccess) {
                if (data?.payload?.status === EIntegrationsStatus.CONNECTED) {
                  this.isShowConnected = false;
                  this.toastService.success('Calendar connected');
                  this.config = data?.payload?.config;
                  this.integrationsService.setPopupState({
                    showPopupSelectEvents: true
                  });
                }
                this.setIntegrationsDataAfterConnect();
              } else {
                this.toastService.show(
                  data?.payload?.message,
                  '',
                  {
                    disableTimeOut: false
                  },
                  'toast-error-custom'
                );
              }
              break;
            case EMAIL_SYNC_TYPE.RECONNECT_CALENDAR:
              if (data.isSuccess) {
                this.isShowConnected = true;
                localStorage.removeItem('userCalendarSettingId');
                this.setIntegrationsDataAfterConnect();
              } else {
                this.toastService.error(MAIL_BOX_DISCONNECT);
              }
              break;
            default:
              break;
          }
          localStorage.removeItem('integrateType');
        });
      });
  }

  ngOnInit() {
    this.isConsole = this.sharedService.isConsoleUsers();

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (company) =>
          (this.isRmEnvironment = this.agencyService.isRentManagerCRM(company))
      );

    this.integrationsService
      .getPopupIntegration()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.popupState = res;
      });
    this.loadingService.onLoading();
    this.getData();
    this.getIntegrationsList();
    this.loadingService.isLoading$
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.isLoading = loading;
      });
  }
  getData() {
    this.integrationsService.getIntegrationsData();
  }

  getIntegrationsList() {
    this.loadingService.onLoading();
    this.integrationsService.getIntegrationsList().subscribe({
      next: (data) => {
        //TODO: hide in TDI-9453
        this.integrationsList = data?.filter(
          (item) => item.label != EIntegrationsLabel.CALENDAR
        );
        this.getCalendarSetting();
        this.loadingService.stopLoading();
      },
      error: () => {
        this.loadingService.stopLoading();
      },
      complete: () => {
        this.loadingService.stopLoading();
      }
    });
  }

  getCalendarSetting() {
    const calendarSettingData = this.integrationsList.find(
      (item) => item.label === EIntegrationsLabel.CALENDAR
    )?.items?.[0]?.data;
    if (calendarSettingData) {
      this.provider = calendarSettingData.provider;
      this.userCalendarSettingId = calendarSettingData.id;
      this.config = calendarSettingData.config;
      this.status = calendarSettingData.status;
    }
  }

  handleIntegrateOutLook(connectType) {
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

  public onNextCalendarProvider(provider: EmailProvider) {
    if (this.isConsole) return;
    this.selectedCalendarProvider = provider;
    this.integrationsService.setPopupIntegration(null);
    switch (this.selectedCalendarProvider) {
      case EmailProvider.GOOGLE:
        this.integrateCalendar(EMAIL_SYNC_TYPE.INTEGRATE_CALENDAR);
        break;
      case EmailProvider.OUTLOOK:
        this.handleIntegrateOutLook(EMAIL_SYNC_TYPE.INTEGRATE_CALENDAR);
        break;
    }
  }

  public connectAgain() {
    if (this.provider) {
      switch (this.provider) {
        case EmailProvider.GOOGLE:
          this.integrateCalendar(EMAIL_SYNC_TYPE.RECONNECT_CALENDAR);
          break;
        case EmailProvider.OUTLOOK:
          this.handleIntegrateOutLook(EMAIL_SYNC_TYPE.RECONNECT_CALENDAR);
          break;
      }
    }
  }

  public handleDisconnectCalendar() {
    this.dashboardApiService
      .disconnectCalendar(this.userCalendarSettingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res?.status === EIntegrationsStatus.ARCHIVE) {
            this.toastService.success('Calendar disconnected');
          }
          this.setIntegrationsDataAfterConnect();
        },
        error: () => {
          console.log('error');
        }
      });
  }

  public async integrateCalendar(syncType: string) {
    if (this.isConsole && !this.inboxSidebarService.isAccountAdded.value)
      return;
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: configGoogleCalendar.CLIENT_ID,
      scope: configGoogleCalendar.SCOPE_CALENDAR,
      ux_mode: 'popup',
      select_account: true,
      redirect_uri: configGoogleCalendar.REDIRECT_URI,
      callback: ({ code }: ResponseAuth) => {
        if (!code) return;
        const type = this.selectedCalendarProvider;
        if (syncType === EMAIL_SYNC_TYPE.INTEGRATE_CALENDAR) {
          this.isShowConnected = false;
          this.dashboardApiService
            .integrateCalendarProvider({ code, type })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (res) => {
                if (res?.status === EIntegrationsStatus.CONNECTED) {
                  this.config = res?.config;
                  this.toastService.success('Calendar connected');
                  this.integrationsService.setPopupState({
                    showPopupSelectEvents: true
                  });
                }
                this.setIntegrationsDataAfterConnect();
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
        } else if (syncType === EMAIL_SYNC_TYPE.RECONNECT_CALENDAR) {
          let userCalendarSettingId = this.userCalendarSettingId;
          let type = this.provider;
          this.dashboardApiService
            .connectAgainCalendar({
              code,
              type,
              userCalendarSettingId
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.isShowConnected = true;
                this.setIntegrationsDataAfterConnect();
              },
              error: () => {
                this.toastService.error(MAIL_BOX_DISCONNECT);
              }
            });
        }
      },
      error_callback: (error) => {
        console.log('error', error);
      }
    });
    return client.requestCode();
  }

  setIntegrationsDataAfterConnect() {
    this.integrationsService.getIntegrationsDataApi().subscribe((res) => {
      this.integrationsService.setIntegrationsList(res);
    });
  }
  trackById(index: number, item): string {
    return item.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
