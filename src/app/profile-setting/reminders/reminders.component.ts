import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, filter, switchMap, takeUntil, tap } from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { IntegrationContentOptions } from '@/app/dashboard/utils/constants';
import { ConversationService } from '@services/conversation.service';
import { LoadingService } from '@services/loading.service';
import { UserService } from '@services/user.service';
import { NotificationSettingType } from '@shared/enum/user.enum';
import { IIntegrations } from '@shared/types/agency.interface';
import {
  KindOfNoti,
  ListReminder,
  ListReminderDay,
  ReminderGroupName,
  listNameReminderSettingShow,
  listSelectReminderDay
} from '@shared/types/reminders.interface';
import {
  NotificationSettingApiResponse,
  PlatformSettings
} from '@shared/types/user.interface';
import { PORTAL_PORTFOLIO_REMINDERS } from '@/app/profile-setting/constants/constant';
import { NotificationSettingsToggle } from '@/app/profile-setting/notification/notification.component';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'reminders',
  templateUrl: './reminders.component.html',
  styleUrls: ['./reminders.component.scss']
})
export class RemindersComponent implements OnInit {
  private isAgencyRM: boolean = false;
  private crmId: string = '';
  public currentAgencyId: string = '';
  private listReminderDay: ListReminderDay[] = listSelectReminderDay;
  public listReminder: ListReminder[] = [];
  private unsub = new Subject<void>();
  public kindOfNoti: KindOfNoti = {
    email: 'email',
    desktop: 'desktop'
  };
  public integartionContent: IIntegrations;
  public portalReminders: NotificationSettingsToggle[] =
    PORTAL_PORTFOLIO_REMINDERS;
  private notificationSetting: NotificationSettingApiResponse;
  private ELabelNotification = {
    [ECrmSystemId.PROPERTY_TREE]: 'Property Tree',
    [ECrmSystemId.RENT_MANAGER]: 'Rent Manager'
  };

  constructor(
    private conversationService: ConversationService,
    private loadingService: LoadingService,
    private agencyService: AgencyService,
    private toastService: ToastrService,
    private userService: UserService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.getSetting();
  }

  getSetting() {
    this.loadingService.onMultiLoading();
    this.companyService
      .getCurrentCompany()
      .pipe(
        filter((res) => !!res),
        takeUntil(this.unsub),
        tap((company) => {
          this.crmId = company?.CRM;
          this.userService.getUsersEmailNotification().subscribe((res) => {
            if (res) {
              const crmLabel = this.ELabelNotification[company?.CRM];
              this.portalReminders.forEach((portal) => {
                if (
                  portal?.type ===
                  NotificationSettingType.changesToDatesOrStatuses
                ) {
                  portal.label = `Changes to dates or statuses in ${crmLabel} for my tasks`;
                }
                portal.settings.forEach((item) => {
                  item.checked =
                    res[`${item.platform}Settings`]?.[
                      item.type as NotificationSettingType
                    ];
                });
              });
              this.notificationSetting = res;
            }
          });
        }),
        switchMap((agency) => {
          this.currentAgencyId = agency.id;
          this.isAgencyRM = this.agencyService.isRentManagerCRM(agency);
          const environmentName = this.isAgencyRM
            ? ECRMSystem.RENT_MANAGER
            : ECRMSystem.PROPERTY_TREE;
          this.integartionContent = IntegrationContentOptions[environmentName];
          return this.conversationService.getReminderSetting();
        })
      )
      .subscribe({
        next: (data) => {
          const listNameSettingShow = listNameReminderSettingShow[this.crmId];
          this.listReminder = data
            .filter((item) => {
              if (this.isAgencyRM) {
                return true;
              } else {
                return item.groupName !== ReminderGroupName.INVOICES;
              }
            })
            .map((item) => {
              let listDate: ListReminderDay[] = [];
              if (this.isAgencyRM) {
                listDate = this.listReminderDay.slice(0, 9);
              } else {
                switch (item.groupName) {
                  case ReminderGroupName.COMPLIANCE:
                    listDate = this.listReminderDay.slice(2, 9);
                    break;
                  case ReminderGroupName.INSPECTIONS:
                  case ReminderGroupName.NEW_TENANCIES:
                  case ReminderGroupName.VACATES:
                  case ReminderGroupName.ARREARS:
                  case ReminderGroupName.TENANT_NOTICES:
                  case ReminderGroupName.LEASE_RENEWALS:
                    listDate = this.listReminderDay.slice(0, 9);
                    break;
                  default:
                    listDate = this.listReminderDay;
                }
              }
              return {
                ...item,
                listDays: listDate,
                values: item.values
                  .filter((v) => listNameSettingShow.includes(v.name))
                  .map((v) => {
                    const valueKey = v.valueKey;
                    return {
                      ...v,
                      enableDesktop: v.enableDesktop,
                      key: valueKey,
                      valueString: `${v[valueKey]} day${
                        v[valueKey] !== 1 && v[valueKey] !== Number(-1)
                          ? 's'
                          : ''
                      }`
                    };
                  })
              };
            });
          this.loadingService.offMultiLoading();
        },
        error: () => {}
      });
  }

  public handleEventChanges(event) {
    if (!event.value) return;
    this.portalReminders
      .find((portal) =>
        portal.settings.find((item) => item.type === event.value.type)
      )
      .settings.find((item) => item.platform === event.value.platform).checked =
      event.event;
    this._saveNotificationSetting();
  }

  private _saveNotificationSetting() {
    const body: NotificationSettingApiResponse = {
      desktopSettings: {
        id: this.notificationSetting.desktopSettings.id
      } as PlatformSettings
    } as NotificationSettingApiResponse;
    this.portalReminders.forEach((portal) => {
      portal.settings.forEach((item) => {
        body[`${item.platform}Settings`][item.type as NotificationSettingType] =
          item.checked;
      });
    });
    this.userService.updateEmailNotificationSetting(body).subscribe();
  }

  onCheckboxChange(
    status: boolean,
    index: number,
    key: string,
    kindOfNoti: string
  ) {
    if (kindOfNoti === this.kindOfNoti.desktop) {
      const item = this.listReminder[index].values.find(
        (item) => item['key'] === key
      );
      item.enableDesktop = status;
    }
    this.saveReminderSetting();
  }

  changeReminder(event, index: number, key: string) {
    const item = this.listReminder[index].values.find(
      (item) => item['key'] === key
    );
    item[key] = Number(
      event.value.replace(
        event.value != '1 day' && event.value != '-1 day' ? / days/ : / day/,
        ''
      )
    );
    this.saveReminderSetting();
  }

  saveReminderSetting() {
    const body = this.listReminder
      .flatMap((item) => item.values)
      .map((item) => ({
        enableDesktop: item.enableDesktop ?? false,
        [item['key']]:
          item[item['key']] || item[item['key']] === 0 ? item[item['key']] : 1
      }));
    this.conversationService.saveReminderSetting(body).subscribe();
  }

  ngOnDestroy() {
    this.unsub.next();
    this.unsub.complete();
  }
}
