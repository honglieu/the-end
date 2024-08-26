import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import {
  IRentManagerIssue,
  ListUserResponse
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { conversations, users } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { PrefillUser } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { EUserPayloadType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { PropertiesService } from '@services/properties.service';
import {
  IInputToGetSupplier,
  ISupplierBasicInfo,
  IUsersSupplierBasicInfoProperty
} from '@shared/types/users-supplier.interface';

@Injectable({
  providedIn: 'root'
})
export class RentManagerIssueApiService {
  constructor(
    private apiService: ApiService,
    private propertyService: PropertiesService
  ) {}

  syncIssueToRM(body: IRentManagerIssue) {
    return this.apiService.postAPI(
      conversations,
      'widget/service-issue/sync-issue',
      body
    );
  }

  getRmIssueData() {
    return this.apiService.getAPI(
      conversations,
      'widget/service-issue/get-prefill-data'
    );
  }

  getRmBillDetailData(id: string) {
    return this.apiService.getAPI(
      conversations,
      `widget-get-bill?billId=${id}&propertyId=${this.propertyService.currentPropertyId.value}`
    );
  }

  syncBillDetailForm(body: object) {
    return this.apiService.postAPI(
      conversations,
      'widget-update-bill-rm',
      body
    );
  }

  getListUserApi(
    body: GetListUserPayload
  ): Observable<ListUserResponse | ISelectedReceivers[]> {
    return this.apiService.postAPI(users, 'get-list-user-group', body);
  }

  getListSuppliers(
    body: IInputToGetSupplier
  ): Observable<IUsersSupplierBasicInfoProperty | ISupplierBasicInfo[]> {
    return this.apiService.postAPI(users, 'v2/suppliers', body);
  }

  public getInvoiceDetail(id: string) {
    return this.apiService.getAPI(
      conversations,
      `widget-get-invoice/${id}
    `,
      null
    );
  }

  removeRmIssue(rmIssueId: string, taskId: string) {
    return this.apiService.getAPI(
      conversations,
      `widget/service-issue/${rmIssueId}/cancel`,
      { taskId }
    );
  }

  retryRmIssue(rmIssueId: string, taskId: string) {
    return this.apiService.getAPI(
      conversations,
      `widget/service-issue/${rmIssueId}/retry`,
      { taskId }
    );
  }

  syncRmIssueInvoice(payload) {
    return this.apiService.postAPI(
      conversations,
      `widget-update-invoice-rm`,
      payload
    );
  }
}

export interface GetListUserPayload {
  propertyId: string;
  search: string;
  page?: number;
  limit?: number;
  userDetails?: PrefillUser[];
  email_null?: boolean;
  userType?: EUserPayloadType[];
}

export interface GetListUserResponse {
  currentPage?: number;
  totalPage?: number;
  users?: ISelectedReceivers[];
}
