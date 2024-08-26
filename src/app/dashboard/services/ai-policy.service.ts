import { ApiService } from '@services/api.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  IAddPolicyPayload,
  IEditPolicyPayload,
  IPayloadGetPolicy,
  IPolicyDetail
} from '@/app/dashboard/modules/agency-settings/utils/enum';
import { agencies, aiApiEndpoint } from '@/environments/environment';
import { PermissionService } from '@/app/services/permission.service';
import { SharedService } from '@/app/services/shared.service';
import { Params } from '@angular/router';
import {
  EPolicyTableColumnName,
  ESortOrder
} from '@/app/dashboard/modules/agency-settings/enum/account-setting.enum';
import { ITag } from '@/app/dashboard/modules/agency-settings/utils/interface';

@Injectable({
  providedIn: 'root'
})
export class AiPolicyService {
  private aiReplyPolicySearchValue: BehaviorSubject<string> =
    new BehaviorSubject('');
  private sortEventBS = new BehaviorSubject({
    columnName: EPolicyTableColumnName.updatedAt,
    sortOrder: ESortOrder.descending
  });
  private savedPolicy = new BehaviorSubject<IPolicyDetail>(null);

  private tags = new BehaviorSubject<ITag[]>(null);

  constructor(
    private apiService: ApiService,
    private permissionService: PermissionService,
    private sharedService: SharedService
  ) {}

  public setSavedPolicy(value) {
    this.savedPolicy.next(value);
  }

  get savedPolicy$() {
    return this.savedPolicy.asObservable();
  }

  get hasPermissionToEdit() {
    return Boolean(
      !this.sharedService.isConsoleUsers() ||
        this.permissionService.hasFunction('ACCOUNT_SETTINGS.POLICIES.EDIT')
    );
  }

  get aiReplyPolicySearchValue$() {
    return this.aiReplyPolicySearchValue.asObservable();
  }

  getTags() {
    return this.tags.asObservable();
  }

  setTags(tags: ITag[]) {
    return this.tags.next(tags);
  }

  setAIReplyPolicySearchValue(value: string) {
    return this.aiReplyPolicySearchValue.next(value);
  }

  setSortEvent$(value) {
    return this.sortEventBS.next(value);
  }
  get sortEvent$() {
    return this.sortEventBS.asObservable();
  }

  public toQueryParams(): Params {
    return {
      search: this.aiReplyPolicySearchValue.value || '',
      columnName:
        this.sortEventBS.value.columnName || EPolicyTableColumnName.updatedAt,
      sortOrder: this.sortEventBS.value.sortOrder || ESortOrder.descending
    };
  }
  public getListAiRepliesPolicy(payload: IPayloadGetPolicy) {
    return this.apiService.postAPI(agencies, 'get-policies', payload);
  }

  deletePolicy(id: string) {
    return this.apiService.deleteAPI(agencies, 'policies/' + id);
  }

  addPolicy(payload: IAddPolicyPayload) {
    return this.apiService.postAPI(agencies, `policies`, payload);
  }

  getPolicyDetail(id: string) {
    return this.apiService.getAPI(agencies, `policies/${id}`);
  }

  updatePolicy(payload: IEditPolicyPayload) {
    return this.apiService.putAPI(agencies, `policies`, payload);
  }

  getAllTag() {
    return this.apiService.getAPI(agencies, 'tags');
  }

  getPolicyAiGenerated(payload) {
    return this.apiService.postAPI(
      aiApiEndpoint,
      `/realtime/policy/create-policy`,
      payload
    );
  }
}
