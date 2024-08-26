import { Injectable } from '@angular/core';
import { GetListUserPayload } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { UserService } from '@services/user.service';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  IJobDetail,
  IPurchaseOrderSync,
  IPurchaseOrderSyncPayload,
  IPurchaseOrderSyncRes
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/purchase-order.interface';
import { EUserPayloadType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { IInputToGetSupplier } from '@shared/types/users-supplier.interface';
import { cloneDeep } from 'lodash-es';
import { isEqual } from 'lodash-es';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

export interface ISyncType {
  syncStatus: ESyncStatus;
  lastTimeSynced: string;
}

export enum EUserType {
  TENANT_PROSPECT = 'TENANT_PROSPECT',
  TENANT_PROPERTY = 'TENANT_PROPERTY',
  TENANT_UNIT = 'TENANT_UNIT',
  LANDLORD_PROSPECT = 'LANDLORD_PROSPECT'
}

interface IListUserPayload extends GetListUserPayload {
  userType: EUserPayloadType[];
}

export interface IPurchaseOrderFormatType {
  billing: IJobDetail[];
  detail: IPurchaseOrderSync;
}

@Injectable()
export class PurchaseOrderService {
  private refreshListUserPayload = new BehaviorSubject<IListUserPayload>(null);
  public getListUserPayload$ = this.refreshListUserPayload.asObservable();
  private refreshGetSuppliers = new BehaviorSubject<IInputToGetSupplier>(null);
  public getLisSuppliers$ = this.refreshGetSuppliers.asObservable();
  private purchaseOrderId = new BehaviorSubject<string>('');
  public purchaseOrderId$ = this.purchaseOrderId.asObservable();
  public isLoadingPurchase = false;
  public isSubmittedPurchaseOrderForm = false;
  private originPurchaseOrder;
  private changedPurchaseOrder;
  private syncStatus: ISyncType = {
    syncStatus: ESyncStatus.NOT_SYNC,
    lastTimeSynced: null
  };
  constructor(
    private userService: UserService,
    private apiService: ApiService
  ) {}

  setPurchaseOrderId(id: string) {
    this.purchaseOrderId.next(id);
  }

  setListUserPayload(payload: IListUserPayload) {
    this.refreshListUserPayload.next({
      ...this.refreshListUserPayload.value,
      ...payload
    });
  }

  setListSupplierPayload(payload: IInputToGetSupplier) {
    this.refreshGetSuppliers.next({
      ...this.refreshGetSuppliers.value,
      ...payload
    });
  }

  syncPurchaseOrder(
    body: IPurchaseOrderSyncPayload
  ): Observable<IPurchaseOrderSyncRes> {
    return this.apiService.postAPI(
      conversations,
      'widget/service-issue/purchase-order/sync',
      body
    );
  }

  getPurchaseOrderById(
    purchaseOrderId: string
  ): Observable<IPurchaseOrderSync> {
    return this.apiService.getAPI(
      conversations,
      `widget/service-issue/purchase-order/${purchaseOrderId}`
    );
  }

  get syncStatusData() {
    return this.syncStatus;
  }

  setSyncStatus(value) {
    this.syncStatus = {
      ...this.syncStatus,
      ...value
    };
  }

  get originPurchaseOrderData() {
    return this.originPurchaseOrder;
  }

  setOriginPurchaseOrderData(value: IPurchaseOrderFormatType) {
    this.originPurchaseOrder = cloneDeep(this.formatPurchaseOrderData(value));
  }

  get changedPurchaseOrderData() {
    return this.changedPurchaseOrder;
  }

  setChangedPurchaseOrderData(value: IPurchaseOrderFormatType) {
    this.changedPurchaseOrder = cloneDeep(this.formatPurchaseOrderData(value));
  }

  isChanged() {
    return !isEqual(this.originPurchaseOrder, this.changedPurchaseOrder);
  }

  private formatPurchaseOrderData(value) {
    const billList = value?.billsPO ? value?.billsPO : value?.billing;
    const mapBillings = billList?.map((it) => ({
      cost: it?.cost || null,
      item: it?.inventoryItemId || null,
      job: it?.jobId || null,
      memo: it?.comment || null,
      quantity: it?.quantity || null,
      total: it?.total || null
    }));
    return {
      detail: {
        issueDate: value?.detailPO?.issueDate || '',
        description: value?.detailPO?.description || '',
        workFlow: value?.detailPO?.workflowId || '',
        accountType: value?.detailPO?.userType || '',
        tenant: value?.detailPO?.userId || '',
        isInvoiced: value?.detailPO?.isInvoiceRequired || false,
        vendor: value?.detailPO?.vendorId || '',
        billingAddress: value?.detailPO?.billingAddress || '',
        shippingAddress: value?.detailPO?.shippingAddress || ''
      },
      billing: mapBillings
    };
  }
}
