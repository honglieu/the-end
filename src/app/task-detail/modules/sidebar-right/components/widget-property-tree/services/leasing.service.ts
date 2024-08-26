import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ISyncPropertyTree } from '@/app/leasing/utils/leasingType';
import { ApiService } from '@services/api.service';
import { LeasingService } from '@services/leasing.service ';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { LeasingWidgetRequestTrudiResponse } from '@shared/types/trudi.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { conversations } from 'src/environments/environment';
import { PropertiesService } from '@services/properties.service';
import { LeaseRenewalSyncStatus } from '@shared/enum';

@Injectable({
  providedIn: 'root'
})
export class LeasingWidgetService {
  public syncLeasingStatus$: BehaviorSubject<string> =
    new BehaviorSubject<string>(null);
  public leaseId$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public isShowAddTenantContactPopup$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public isShowConfirmTenantContactPopup$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public isEditTenantContact$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public tenantContactIndex$: BehaviorSubject<number> = new BehaviorSubject(0);
  private syncLeasingData$: BehaviorSubject<LeasingWidgetRequestTrudiResponse> =
    new BehaviorSubject(null);
  public syncPTStatus: Subject<LeaseRenewalSyncStatus> = new Subject();
  constructor(
    private apiService: ApiService,
    public leasingService: LeasingService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    public propertyService: PropertiesService
  ) {}

  setSyncLeasingData(value: LeasingWidgetRequestTrudiResponse) {
    this.syncLeasingData$.next(value);
  }

  getSyncLeasingData() {
    return this.syncLeasingData$.asObservable();
  }

  setSyncLeasingStatus(value: ESyncStatus) {
    this.syncLeasingStatus$.next(value);
  }

  getSyncLeasingStatus() {
    return this.syncLeasingStatus$.asObservable();
  }

  getLeaseId() {
    return this.leaseId$.asObservable();
  }

  setShowAddTenantContactPopup(value: boolean) {
    this.isShowAddTenantContactPopup$.next(value);
  }

  setShowConfirmTenantContactPopup(value: boolean) {
    this.isShowConfirmTenantContactPopup$.next(value);
  }

  syncLeasingToPT(body: ISyncPropertyTree) {
    return this.apiService.postAPI(
      conversations,
      'widget/leasing/sync-tenancy-to-property-tree',
      body
    );
  }

  getLeasingToPT(taskId: string) {
    return this.apiService.getAPI(
      conversations,
      'widget/leasing/getListByTaskId/' + taskId
    );
  }

  retryLeasingToPT(leaseId: string) {
    return this.apiService.postAPI(conversations, 'widget/leasing/retry', {
      leaseId
    });
  }

  removeLeasingToPT(leaseId: string) {
    return this.apiService.deleteAPI(
      conversations,
      'widget/leasing/' + leaseId
    );
  }

  resyncLeasingToPT(leaseId: string, body: ISyncPropertyTree) {
    return this.apiService.putAPI(
      conversations,
      'widget/leasing/' + leaseId,
      body
    );
  }

  cancelLeasingToPT(leaseId: string) {
    return this.apiService.postAPI(conversations, 'widget/leasing/cancel', {
      leaseId
    });
  }

  updateLeasingTrudiResponse(tenancyId?: string) {
    const trudiBtnResponse =
      this.leasingService.leasingRequestResponse.getValue();
    if (
      trudiBtnResponse?.data?.[0]?.body?.leasingStep?.[1]?.button?.[3]
        ?.isCompleted === false
    ) {
      trudiBtnResponse.data[0].body.leasingStep[1].button[3].isCompleted = true;
      trudiBtnResponse.data[0].body.leasingStep[1].button[3].status =
        TrudiButtonEnumStatus.COMPLETED;
      trudiBtnResponse.variable.tenancyId = tenancyId;
      this.leasingService.leasingRequestResponse.next(trudiBtnResponse);
    }
  }

  handleRefreshListUserProperty() {
    this.propertyService.getPeople(
      this.propertyService.currentPropertyId.getValue()
    );
  }
}
