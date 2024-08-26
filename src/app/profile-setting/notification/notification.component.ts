import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest, filter, switchMap, takeUntil } from 'rxjs';
import { LoadingService } from '@services/loading.service';
import { UserService } from '@services/user.service';
import {
  NotificationSettingPlatform,
  NotificationSettingType
} from '@shared/enum/user.enum';
import {
  NotificationSettingApiResponse,
  PlatformSettings
} from '@shared/types/user.interface';
import { PORTAL_ACTIVITY_NOTIFICATION } from '@/app/profile-setting/constants/constant';
import { CompanyService } from '@services/company.service';
import { ERole } from '@/app/auth/auth.interface';

interface NotificationSettings {
  type: NotificationSettingType | NotificationSettingType[];
  platform: NotificationSettingPlatform;
  checked: boolean;
}

export interface NotificationSettingsToggle {
  label: string;
  settings: NotificationSettings[];
  type?: NotificationSettingType;
}

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  providers: [LoadingService]
})
export class NotificationComponent implements OnInit, OnDestroy {
  public emailNoti: string = 'emailNotifications';
  public desktopNoti: string = 'desktopNotifycations';
  public notificationSetting: NotificationSettingApiResponse;
  public portalActivity: NotificationSettingsToggle[] =
    PORTAL_ACTIVITY_NOTIFICATION;

  private unsub = new Subject<void>();
  public crmSystem: string;

  constructor(
    private userService: UserService,
    public loadingService: LoadingService,
    private companyService: CompanyService
  ) {}

  ngOnInit() {
    this.loadingService.onMultiLoading();
    this.companyService
      .getCurrentCompany()
      .pipe(
        filter((res) => !!res),
        takeUntil(this.unsub),
        switchMap((company) => {
          this.crmSystem = company?.CRM;
          return combineLatest([
            this.userService.getUsersEmailNotification(),
            this.userService.userInfo$
          ]);
        }),
        takeUntil(this.unsub)
      )
      .subscribe(([res, userInfor]) => {
        if (res && userInfor) {
          let isRoleOwnerAdmin = userInfor.companyAgents.some(
            (agent) => agent.role === ERole.ADMIN || agent.role === ERole.OWNER
          );

          if (!isRoleOwnerAdmin) {
            this.portalActivity = this.portalActivity
              .map((portal) => ({
                ...portal,
                settings: portal.settings.filter(
                  (setting) =>
                    setting.type !== NotificationSettingType.companyPolicy
                )
              }))
              .filter((portal) =>
                portal.settings.some(
                  (setting) =>
                    setting.type !== NotificationSettingType.companyPolicy
                )
              );
          }

          this.portalActivity.forEach((portal) => {
            portal.settings.forEach((item) => {
              if (Array.isArray(item.type)) {
                item.checked = item.type.every(
                  (type) => res[`${item.platform}Settings`]?.[type] === true
                );
              } else {
                item.checked = res[`${item.platform}Settings`]?.[item.type];
              }
            });
          });
          this.notificationSetting = res;
        }
        this.loadingService.offMultiLoading();
      });
  }

  onCheckboxChange(event) {
    if (!event.value) return;
    this.portalActivity
      .find((portal) =>
        portal.settings.find((item) => item.type === event.value.type)
      )
      .settings.find((item) => item.platform === event.value.platform).checked =
      event.event;
    this.saveNotificationSetting();
  }

  saveNotificationSetting() {
    const body: NotificationSettingApiResponse = {
      desktopSettings: {
        id: this.notificationSetting.desktopSettings.id
      } as PlatformSettings
    } as NotificationSettingApiResponse;
    this.portalActivity.forEach((portal) => {
      portal.settings.forEach((item) => {
        if (Array.isArray(item.type)) {
          item.type.forEach((type) => {
            body[`${item.platform}Settings`][type] = item.checked;
          });
        } else {
          body[`${item.platform}Settings`][item.type] = item.checked;
        }
      });
    });
    this.userService.updateEmailNotificationSetting(body).subscribe();
  }

  ngOnDestroy() {
    this.unsub.next();
    this.unsub.complete();
  }
}
