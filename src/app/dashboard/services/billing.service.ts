import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import {
  IBillingInvoice,
  IBillingPlan,
  IBillings,
  IRequestPlan
} from '@/app/dashboard/modules/agency-settings/utils/billing.interface';
import { ApiService } from '@services/api.service';
import { conversations, users } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  constructor(private apiService: ApiService) {}

  getRetrieveBillingInfo() {
    return this.apiService.getAPI(users, 'retrieve-billing-info');
  }

  cancelAccount() {
    return this.apiService.postAPI(users, 'cancel-account', {});
  }

  editBillingEmail(email: string) {
    return this.apiService.postAPI(users, 'edit-billing-email-address', {
      email: email
    });
  }

  getBillingsSubscription(): Observable<IBillings> {
    return this.apiService.getAPI(conversations, `billings/lines`);
  }

  getBillingInvoices(): Observable<IBillingInvoice[]> {
    return this.apiService.getAPI(conversations, `billings/invoices`);
  }

  getBillingPlan(): Observable<IBillingPlan> {
    return this.apiService.getAPI(conversations, `billings/plan`);
  }

  requestPlan(payload: IRequestPlan): Observable<ConfigPlan> {
    return this.apiService.postAPI(
      conversations,
      'send-mail-request-plan',
      payload
    );
  }
}
