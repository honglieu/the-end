import { SCROLL_THRESHOLD } from './../../../../../../../../../../../dashboard/utils/constants';
import {
  Component,
  OnInit,
  ViewChild,
  Input,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  Subject,
  switchMap,
  takeUntil,
  forkJoin,
  distinctUntilChanged,
  of,
  debounceTime,
  Subscription
} from 'rxjs';
import { TaskService } from '@services/task.service';
import { numStr } from '@shared/feature/function.feature';
import {
  ISupplierBasicInfo,
  IUsersSupplierBasicInfoProperty
} from '@shared/types/users-supplier.interface';
import { PurchaseOrderBillListComponent } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/purchase-order-popup/components/purchase-order-bill-list/purchase-order-bill-list.component';
import { PurchaseOrderService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/purchase-order-popup/services/purchase-order.service';
import { IPurchaseOrderSync } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/purchase-order.interface';
import {
  IPurchaseOrderWorkflowItem,
  IRentManagerIssueSyncStatus
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { GetListUserResponse } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  EAccountType,
  EUserPayloadType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { RentManagerIssueApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-api.service';
import { isEmpty } from 'lodash-es';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
interface IBillItemValue {
  job: string;
  item: string;
  quantity: string;
  cost: string;
  memo: string;
  total: string;
}

@Component({
  selector: 'purchase-order-detail',
  templateUrl: './purchase-order-detail.component.html',
  styleUrls: ['./purchase-order-detail.component.scss']
})
export class PurchaseOrderDetailComponent implements OnInit, OnChanges {
  @ViewChild('billList') billList: PurchaseOrderBillListComponent;
  @Input() purchaseOrderData: IPurchaseOrderSync;
  private destroy$ = new Subject<void>();
  public purchaseOrderForm: FormGroup;
  public accountTypes = [
    {
      value: EAccountType.TENANT,
      label: 'Tenant'
    },
    {
      value: EAccountType.PROSPECT,
      label: 'Tenant prospect'
    },
    {
      value: EAccountType.OWNER,
      label: 'Owner'
    }
  ];
  public readonly renderLabelByType = {
    [EAccountType.TENANT]: {
      invoiceLabel: 'Tenant will be invoiced',
      userTypeLabel: 'Tenant'
    },
    [EAccountType.PROSPECT]: {
      invoiceLabel: 'Tenant prospect will be invoiced',
      userTypeLabel: 'Tenant prospect'
    },
    [EAccountType.OWNER]: {
      invoiceLabel: 'Owner will be invoiced',
      userTypeLabel: 'Owner'
    }
  };
  public readonly purchaseOrderTitles = [
    'Job',
    'Item',
    'Quantity',
    'Cost',
    'Memo',
    'Total'
  ];
  public hasBills = false;
  public tenantList: GetListUserResponse | ISelectedReceivers[] = [];
  public supplierList: IUsersSupplierBasicInfoProperty | ISupplierBasicInfo[] =
    [];
  public workFlowList: IPurchaseOrderWorkflowItem[] = [];
  public totalPO: string | number = 0;
  public totalQuantity: string | number = 0;
  public agencyId = '';
  public propertyId = '';
  public loadingListUser = false;
  public loadingListSupplier = false;
  private subscription: Subscription;
  private issueSyncStatus: IRentManagerIssueSyncStatus;

  constructor(
    private taskService: TaskService,
    private purchaseOrderService: PurchaseOrderService,
    private rentManagerIssueService: RentManagerIssueService,
    private rentManagerIssueApiService: RentManagerIssueApiService,
    private rentManagerIssueFormService: RentManagerIssueFormService
  ) {}

  ngOnInit(): void {
    this.rentManagerIssueFormService.syncStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.issueSyncStatus = rs;
      });

    this.rentManagerIssueService.rmIssueData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.workFlowList = res.purchaseOrderWorkflow;
        }
      });

    this.taskService.currentTask$
      .asObservable()
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        switchMap((currentTask) => {
          this.propertyId = currentTask.property.id;
          this.agencyId = currentTask.agencyId;
          return forkJoin([
            this.rentManagerIssueApiService.getListSuppliers({
              search: '',
              email_null: true,
              onlySyncData: true,
              userIds: [],
              propertyId:
                this.taskService.currentTask$.value?.property?.id || '',
              agencyId: this.agencyId
            }),
            this.rentManagerIssueApiService.getListUserApi({
              propertyId: this.propertyId,
              search: '',
              email_null: true,
              userType: [
                EUserPayloadType.TENANT_UNIT,
                EUserPayloadType.TENANT_PROPERTY
              ]
            })
          ]);
        })
      )
      .subscribe((res) => {
        if (res) {
          const [suppliers, tenants] = res || [];
          this.supplierList =
            (suppliers as IUsersSupplierBasicInfoProperty).suppliers ||
            suppliers;
          this.tenantList = (tenants as GetListUserResponse).users || tenants;
        }
      });

    this.purchaseOrderService.getListUserPayload$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(SCROLL_THRESHOLD),
        switchMap((payload) => {
          this.loadingListUser = true;
          if (payload && !isEmpty(payload)) {
            return this.rentManagerIssueApiService.getListUserApi(payload);
          } else {
            return of(null);
          }
        })
      )
      .subscribe({
        next: (listUser) => {
          this.loadingListUser = false;
          if (listUser) {
            this.tenantList =
              listUser || (listUser as GetListUserResponse)?.users;
          }
        },
        error: (error) => {
          this.loadingListUser = false;
          this.tenantList = [];
        },
        complete: () => {
          this.loadingListUser = false;
        }
      });

    this.purchaseOrderService.getLisSuppliers$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(SCROLL_THRESHOLD),
        switchMap((payload) => {
          this.loadingListSupplier = true;
          if (payload && !isEmpty(payload)) {
            return this.rentManagerIssueApiService.getListSuppliers({
              ...payload,
              propertyId:
                this.taskService.currentTask$.value?.property?.id || '',
              agencyId: this.taskService.currentTask$.value.agencyId
            });
          } else {
            return of(null);
          }
        })
      )
      .subscribe({
        next: (suppliers) => {
          this.loadingListSupplier = false;
          if (suppliers) {
            this.supplierList =
              (suppliers as IUsersSupplierBasicInfoProperty).suppliers ||
              suppliers;
          }
        },
        error: (error) => {
          this.loadingListSupplier = false;
          this.supplierList = [];
        },
        complete: () => {
          this.loadingListSupplier = false;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.purchaseOrderForm = this.buildForm(this.purchaseOrderData);

    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    this.subscription = this.purchaseOrderForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(SCROLL_THRESHOLD),
        distinctUntilChanged()
      )
      .subscribe((res) => {
        this.purchaseOrderService.setChangedPurchaseOrderData({
          billing: [
            ...this.purchaseOrderService.changedPurchaseOrderData.billing
          ],
          detail: {
            ...res
          }
        });
        if (this.purchaseOrderService.isChanged()) {
          const syncStatus =
            this.issueSyncStatus.syncStatus === ESyncStatus.NOT_SYNC
              ? ESyncStatus.NOT_SYNC
              : ESyncStatus.UN_SYNC;
          this.purchaseOrderService.setSyncStatus({
            syncStatus: syncStatus,
            lastTimeSynced: new Date()
          });
        }
      });

    this.purchaseOrderService.setListUserPayload({
      userType: this.getUserType(
        this.purchaseOrderData.userType as EAccountType
      ),
      propertyId: this.propertyId,
      search: ''
    });
  }

  handleChange(event) {
    this.userTypeControl.setValue(null);
    this.purchaseOrderService.setListUserPayload({
      userType: this.getUserType(event),
      propertyId: this.propertyId,
      search: ''
    });
  }

  private getUserType(type: EAccountType) {
    switch (type) {
      case EAccountType.OWNER:
        return [EUserPayloadType.LANDLORD];
      case EAccountType.PROSPECT:
        return [EUserPayloadType.TENANT_PROSPECT];
      case EAccountType.TENANT:
      default:
        return [EUserPayloadType.TENANT_PROPERTY, EUserPayloadType.TENANT_UNIT];
    }
  }

  private buildForm(formData?) {
    return new FormGroup({
      issueDate: new FormControl(
        formData?.issueDate ? new Date(formData?.issueDate) : null
      ),
      description: new FormControl(formData?.description ?? null),
      workFlow: new FormControl(formData?.workflowId ?? null),
      accountType: new FormControl(formData?.userType ?? EAccountType.TENANT),
      tenant: new FormControl(formData?.userId ?? null),
      isInvoiced: new FormControl(formData?.isInvoiceRequired ?? null),
      vendor: new FormControl(formData?.vendorId ?? null, Validators.required),
      billingAddress: new FormControl(formData?.billingAddress ?? null),
      shippingAddress: new FormControl(formData?.shippingAddress ?? null)
    });
  }

  public handleSubmitForm() {
    if (this.billList) {
      this.billList.bills.markAllAsTouched();
      this.purchaseOrderForm.markAllAsTouched();
    }
  }

  public get getBills() {
    return this.billList.bills;
  }

  public handleAddBill() {
    this.hasBills = true;
    this.billList && this.billList.addBill();
  }

  public calculateTotal() {
    if (this.billList) {
      const billListValue = this.billList.bills.value as IBillItemValue[];
      let totalValue = 0;
      let quantityValue = 0;
      billListValue?.forEach((data) => {
        totalValue +=
          Number(data?.cost?.replace(/,/g, '') || 0) *
          Number(data?.quantity?.replace(/,/g, '') || 0);
        quantityValue += Number(data?.quantity?.replace(/,/g, '') || 0);
      });
      this.totalPO = Number.isInteger(totalValue)
        ? numStr(totalValue.toString()) + '.00'
        : numStr(totalValue.toFixed(2).toString());
      this.totalQuantity = Number.isInteger(quantityValue)
        ? numStr(quantityValue.toString()) + '.00'
        : numStr(quantityValue.toFixed(2).toString());
    }
  }

  public resetValue() {
    this.purchaseOrderForm.reset();
    this.purchaseOrderForm.markAsPristine();
    this.purchaseOrderForm.markAsUntouched();
    this.purchaseOrderForm.updateValueAndValidity();
  }

  handleSearchListSuppliers($event) {
    const searchPayload = $event.term ?? $event ?? '';
    this.purchaseOrderService.setListSupplierPayload({
      search: searchPayload,
      email_null: true,
      onlySyncData: true,
      userIds: [],
      agencyId: this.taskService.currentTask$.value.agencyId
    });
  }

  handleSearchListUser($event) {
    const searchPayload = $event.term ?? $event ?? '';
    this.purchaseOrderService.setListUserPayload({
      userType: this.getUserType(this.accountTypeControl.value),
      propertyId: this.propertyId,
      search: searchPayload
    });
  }

  customSearchFn(term: string, item) {
    const valueSearch = item.firstName?.trim() + ' ' + item.lastName?.trim();
    const searchByName =
      valueSearch.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    return searchByName;
  }

  customSupplierSearchFn(term: string, item) {
    return (
      item.lastName?.trim().toLowerCase().indexOf(term.trim().toLowerCase()) >
      -1
    );
  }

  get accountTypeControl() {
    return this.purchaseOrderForm?.get('accountType');
  }

  get issueDateControl() {
    return this.purchaseOrderForm?.get('issueDate');
  }

  get descriptionControl() {
    return this.purchaseOrderForm?.get('description');
  }

  get workFlowControl() {
    return this.purchaseOrderForm?.get('workFlow');
  }

  get userTypeControl() {
    return this.purchaseOrderForm?.get('tenant');
  }

  get isInvoicedControl() {
    return this.purchaseOrderForm?.get('isInvoiced');
  }

  get vendorControl() {
    return this.purchaseOrderForm?.get('vendor');
  }

  get billingAddressControl() {
    return this.purchaseOrderForm?.get('billingAddress');
  }

  get shippingAddressControl() {
    return this.purchaseOrderForm?.get('shippingAddress');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
