import { Injectable } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { EmailNotificationSettingApiResponse } from './email-notification-setting.interface';
import { auth } from 'src/environments/environment';

@Injectable({
  providedIn: null
})
export class EmailNotificationSettingService {
  public emailNotificationSettingForm: FormGroup;
  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder
  ) {}

  buildForm() {
    this.emailNotificationSettingForm = this.formBuilder.group({
      productUpdates: new FormControl(),
      pmBusinessInsights: new FormControl(),
      marketing: new FormControl(),
      unsubscribeAll: new FormControl()
    });
  }

  get productUpdateValue() {
    return this.emailNotificationSettingForm.get('productUpdates');
  }
  get monthlyInsightsValue() {
    return this.emailNotificationSettingForm.get('pmBusinessInsights');
  }
  get productMarketingValue() {
    return this.emailNotificationSettingForm.get('marketing');
  }
  get unsubscribeAllValue() {
    return this.emailNotificationSettingForm.get('unsubscribeAll');
  }

  getEmailNotificationSetting(
    userId: string
  ): Observable<EmailNotificationSettingApiResponse> {
    return this.apiService.getAPI(
      auth,
      `get-email-notification-setting/?userId=${userId}`
    );
  }

  getEmailNewFeatureNotificationSetting(
    email: string
  ): Observable<EmailNotificationSettingApiResponse> {
    return this.apiService.getAPI(
      auth,
      `get-notification-setting?email=${email}`
    );
  }

  updateEmailNotificationSetting(
    userId: string,
    agencyId: string,
    data: EmailNotificationSettingApiResponse
  ) {
    return this.apiService.postAPI(
      auth,
      `update-email-notification-setting/?agencyId=${agencyId}&userId=${userId}`,
      data
    );
  }

  updateNewFeatureNotificationSetting(
    email: string,
    data: EmailNotificationSettingApiResponse
  ) {
    return this.apiService.postAPI(
      auth,
      `update-notification-setting?email=${email}`,
      data
    );
  }

  getUnsubcribeMonthyInsight(userId: string) {
    return this.apiService.putAPI(
      auth,
      `unsubscribed-monthly-insights/${userId}`
    );
  }
}
