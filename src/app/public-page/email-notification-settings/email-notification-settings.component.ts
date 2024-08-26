import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoadingService } from '@services/loading.service';
import { MarketingEmailSettingType } from '@shared/enum/user.enum';
import { EmailNotificationSettingService } from './email-notification-setting.service';
import {
  EmailNotificationSettingApiResponse,
  ListEmailNotificationSettings
} from './email-notification-setting.interface';

@Component({
  selector: 'email-notification-settings',
  templateUrl: './email-notification-settings.component.html',
  styleUrls: ['./email-notification-settings.component.scss']
})
export class EmailNotificationSettingsComponent implements OnInit {
  private unsubcribe = new Subject<void>();
  private agencyId: string;
  private userId: string;
  private email: string;
  private unsubcribeFromEmail: string;

  public listEmailNotificationSettings: ListEmailNotificationSettings[] = [
    {
      groupName: 'Emails From Team Trudi:',
      values: [
        {
          name: 'Product Updates',
          description:
            'Relevant product updates, tips and resources from Trudi.',
          type: MarketingEmailSettingType.productUpdate
        },
        {
          name: 'Monthly Insights',
          description:
            'Monthly insights on your new property management super powers',
          type: MarketingEmailSettingType.monthlyInsights
        },
        {
          name: 'Marketing',
          description:
            'The Trudi team may occasionally send you emails containing promotional content.',
          type: MarketingEmailSettingType.productMarketing
        }
      ]
    }
  ];

  constructor(
    private router: Router,
    public loadingService: LoadingService,
    private emailNotificationSettingService: EmailNotificationSettingService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.emailNotificationSettingService.buildForm();
    this.userId = this.route.snapshot.queryParams['userId'];
    this.agencyId = this.route.snapshot.queryParams['agencyId'];
    this.email = this.route.snapshot.queryParams['email'];
    this.unsubcribeFromEmail = this.route.snapshot.queryParams['unsubcribe'];
    this.getStatus();
  }

  getStatus() {
    this.loadingService.onLoading();
    if (this.email) {
      this.emailNotificationSettingService
        .getEmailNewFeatureNotificationSetting(this.email)
        .pipe(takeUntil(this.unsubcribe))
        .subscribe({
          next: (res) => {
            if (res) {
              if (this.unsubcribeFromEmail) {
                this.emailNotificationSettingForm
                  .get('unsubscribeAll')
                  .setValue(true);
              } else {
                const settingObj = {
                  ...res.emailFromTeamTrudi
                };

                this.emailNotificationSettingForm.patchValue(settingObj);
                if (Object.entries(settingObj).every(([_, value]) => !value)) {
                  this.emailNotificationSettingForm
                    .get('unsubscribeAll')
                    .setValue(true);
                }
              }
              this.loadingService.stopLoading();
            }
          },
          error: () => {
            this.loadingService.stopLoading();
          }
        });
    } else {
      this.emailNotificationSettingService
        .getEmailNotificationSetting(this.userId)
        .pipe(takeUntil(this.unsubcribe))
        .subscribe({
          next: (res) => {
            if (res) {
              const settingObj = {
                ...res.emailFromTeamTrudi
              };

              this.emailNotificationSettingForm.patchValue(settingObj);
              if (Object.entries(settingObj).every(([_, value]) => !value)) {
                this.emailNotificationSettingForm
                  .get('unsubscribeAll')
                  .setValue(true);
              }

              this.loadingService.stopLoading();
            }
          },
          error: () => {
            this.loadingService.stopLoading();
          }
        });
    }
  }

  get emailNotificationSettingForm() {
    return this.emailNotificationSettingService.emailNotificationSettingForm;
  }

  onChangeNotificationEmail(event) {
    if (event?.target?.checked) {
      this.emailNotificationSettingService.unsubscribeAllValue.setValue(false);
    } else {
      if (
        !this.emailNotificationSettingService.monthlyInsightsValue.value &&
        !this.emailNotificationSettingService.productMarketingValue.value &&
        !this.emailNotificationSettingService.productUpdateValue.value
      ) {
        this.emailNotificationSettingService.unsubscribeAllValue.setValue(true);
      }
    }
  }

  onCheckboxUnsubscribeAll(event) {
    if (event?.target?.checked) {
      this.emailNotificationSettingService.emailNotificationSettingForm.patchValue(
        {
          productUpdates: false,
          pmBusinessInsights: false,
          marketing: false
        }
      );
    }
  }

  savePreferences() {
    const body: EmailNotificationSettingApiResponse = {
      emailFromTeamTrudi: {
        productUpdates:
          this.emailNotificationSettingService.productUpdateValue.value,
        pmBusinessInsights:
          this.emailNotificationSettingService.monthlyInsightsValue.value,
        marketing:
          this.emailNotificationSettingService.productMarketingValue.value
      }
    };
    this.loadingService.onLoading();
    if (this.email) {
      this.emailNotificationSettingService
        .updateNewFeatureNotificationSetting(this.email, body)
        .pipe(takeUntil(this.unsubcribe))
        .subscribe({
          next: () => {
            this.loadingService.stopLoading();
            if (this.unsubcribeFromEmail) {
              const queryParamsWithoutUnsubscribe = {
                ...this.route.snapshot.queryParams
              };
              delete queryParamsWithoutUnsubscribe['unsubcribe'];
              this.router.navigate(
                ['/email-notification-setting/verify-email'],
                {
                  queryParams: {
                    email: this.email,
                    ...queryParamsWithoutUnsubscribe
                  },
                  replaceUrl: true
                }
              );
            } else {
              this.router.navigate(
                [`/email-notification-setting/verify-email`],
                {
                  queryParams: {
                    email: this.email
                  }
                }
              );
            }
          },
          error: () => {
            this.loadingService.stopLoading();
          }
        });
    } else {
      this.emailNotificationSettingService
        .updateEmailNotificationSetting(this.userId, this.agencyId, body)
        .pipe(takeUntil(this.unsubcribe))
        .subscribe({
          next: () => {
            this.loadingService.stopLoading();
            this.router.navigate([`/email-notification-setting/verify-email`]);
          },
          error: () => {
            this.loadingService.stopLoading();
          }
        });
    }
  }

  ngOnDestroy() {
    this.unsubcribe.next();
    this.unsubcribe.complete();
  }
}
