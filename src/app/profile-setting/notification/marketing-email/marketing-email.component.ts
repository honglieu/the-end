import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '@services/loading.service';
import { CHANGE_SUCCESSFULLY_SAVED } from '@services/messages.constants';
import { Subject, filter, takeUntil } from 'rxjs';
import {
  MarketingEmailSettingType,
  NotificationSettingPlatform
} from '@shared/enum/user.enum';
import { EmailNotificationSettingApiResponse } from '@/app/public-page/email-notification-settings/email-notification-setting.interface';
import { EmailNotificationSettingService } from '@/app/public-page/email-notification-settings/email-notification-setting.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
interface MarketingEmailSetting {
  type: MarketingEmailSettingType;
  platform: NotificationSettingPlatform;
  checked: boolean;
}
interface MarketingEmailToggle {
  label: string;
  settings: MarketingEmailSetting[];
}

@Component({
  selector: 'marketing-email',
  templateUrl: './marketing-email.component.html',
  styleUrls: ['./marketing-email.component.scss']
})
export class MarketingEmailComponent implements OnInit, OnDestroy {
  public emailNoti: string = 'marketingEmailNotifications';
  private unsub = new Subject<void>();
  public currentAgencyId: string = '';
  public marketingEmail: MarketingEmailToggle[] = [
    {
      label: 'Product updates',
      settings: [
        {
          type: MarketingEmailSettingType.productUpdate,
          platform: NotificationSettingPlatform.EMAIL,
          checked: true
        }
      ]
    },
    {
      label: 'Monthly insights',
      settings: [
        {
          type: MarketingEmailSettingType.monthlyInsights,
          platform: NotificationSettingPlatform.EMAIL,
          checked: true
        }
      ]
    },
    {
      label: 'Product marketing',
      settings: [
        {
          type: MarketingEmailSettingType.productMarketing,
          platform: NotificationSettingPlatform.DESKTOP,
          checked: true
        }
      ]
    }
  ];

  public notificationSetting: EmailNotificationSettingApiResponse;

  public userId = localStorage.getItem('userId') || '';

  constructor(
    private emailNotificationSettingService: EmailNotificationSettingService,
    public loadingService: LoadingService,
    private agencyService: AgencyService,
    private toastService: ToastrService,
    private companyService: CompanyService
  ) {}

  ngOnInit() {
    this.loadingService.onMultiLoading();
    this.getStatus();
  }

  getStatus() {
    this.emailNotificationSettingService
      .getEmailNotificationSetting(this.userId)
      .pipe(
        filter((res) => !!res),
        takeUntil(this.unsub),
        takeUntil(this.unsub)
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          this.marketingEmail.forEach((portal) => {
            portal.settings.forEach((item) => {
              item.checked = res[`emailFromTeamTrudi`]?.[item.type];
            });
          });
          this.notificationSetting = res;
          this.loadingService.offMultiLoading();
        },
        error: () => {
          this.loadingService.stopLoading();
        }
      });
  }

  onCheckboxChange(event) {
    if (!event.value) return;
    this.marketingEmail
      .find((portal) =>
        portal.settings.find((item) => item.type === event.value.type)
      )
      .settings.find((item) => item.platform === event.value.platform).checked =
      event.event;
    this.saveNotificationSetting();
  }

  saveNotificationSetting() {
    const body = {
      emailFromTeamTrudi: {}
    } as EmailNotificationSettingApiResponse;

    this.marketingEmail.forEach((portal) => {
      portal.settings.forEach((item) => {
        body[`emailFromTeamTrudi`][item.type] = item.checked;
      });
    });

    this.emailNotificationSettingService
      .updateEmailNotificationSetting(this.userId, this.currentAgencyId, body)
      .pipe(takeUntil(this.unsub))
      .subscribe({
        next: () => {
          this.toastService.success(CHANGE_SUCCESSFULLY_SAVED);
        }
      });
  }

  ngOnDestroy() {
    this.unsub.next();
    this.unsub.complete();
  }
}
