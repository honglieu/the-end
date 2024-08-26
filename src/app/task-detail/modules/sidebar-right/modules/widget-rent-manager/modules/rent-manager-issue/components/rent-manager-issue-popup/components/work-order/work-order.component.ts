import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {
  EBillType,
  ERentManagerIssuePopup,
  EWorkOrderActionType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import {
  IInventoryItemIssue,
  IJobIssue,
  IRentManagerIssueWorkOrder
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import { FormArray, FormGroup } from '@angular/forms';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UserService } from '@services/user.service';
import { BILL_TYPES } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/constant/rent-manager-issue.constants';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import {
  ISupplierBasicInfo,
  IUsersSupplierBasicInfoProperty,
  IInputToGetSupplier
} from '@shared/types/users-supplier.interface';
import { RentManagerIssueApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-api.service';
import { RentManagerIssueInvoiceDetailsService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/rent-manager-invoice-details-popup/services/rent-manager-issue-invoice-details.service';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/popup-management.service';
import { RentManagerIssueBillDetailsService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-bill-details.service';
import { PurchaseOrderService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/purchase-order-popup/services/purchase-order.service';
import { CURRENCYNUMBER } from '@services/constants';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'work-order',
  templateUrl: './work-order.component.html',
  styleUrls: ['./work-order.component.scss']
})
export class WorkOrderComponent implements OnInit {
  constructor(
    private rentManagerIssueFormService: RentManagerIssueFormService,
    private rentManagerIssueService: RentManagerIssueService,
    private agencyService: AgencyService,
    private userService: UserService,
    private rentManagerIssueApiService: RentManagerIssueApiService,
    private rentManagerIssueInvoiceDetailsService: RentManagerIssueInvoiceDetailsService,
    private rentManagerIssueBillDetailsService: RentManagerIssueBillDetailsService,
    private popupManagementService: PopupManagementService,
    private purchaseOrderService: PurchaseOrderService,
    private taskService: TaskService
  ) {}
  private destroy$ = new Subject<void>();
  @Output() openSelect = new EventEmitter();

  public ACTION_TYPES = [
    {
      title: 'View purchase order',
      type: EWorkOrderActionType.VIEW_PURCHASE_ORDER,
      typeBill: EBillType.PURCHASE_ORDER,
      isDisplay: false
    },
    {
      title: 'View invoice detail',
      type: EWorkOrderActionType.VIEW_INVOICE_DETAIL,
      typeBill: EBillType.INVOICE_DETAIL,
      isDisplay: false
    },
    {
      title: 'View vendor bill',
      type: EWorkOrderActionType.VIEW_VENDOR_BILL,
      typeBill: EBillType.VENDOR_BILL,
      isDisplay: false
    },
    {
      title: 'View owner bill',
      type: EWorkOrderActionType.VIEW_OWNER_BILL,
      typeBill: EBillType.OWNER_BILL,
      isDisplay: false
    },
    {
      title: 'Duplicate',
      type: EWorkOrderActionType.DUPLICATE,
      isDisplay: true
    },
    {
      title: 'Delete',
      type: EWorkOrderActionType.DELETE,
      isDisplay: true,
      className: 'action-delete',
      tooltip: 'Item can only be deleted directly from Rent Manager'
    }
  ];
  public trudiTableColumns = [
    {
      title: 'Detail'
    },
    {
      title: 'Description'
    },
    {
      title: 'Quantity'
    },
    {
      title: 'Cost'
    },
    {
      title: 'Sale price'
    },
    {
      title: 'Total'
    },
    {
      title: 'Bills'
    },
    {
      title: ''
    }
  ];
  public listWorkOrders: IRentManagerIssueWorkOrder[] = [];
  public issueForm: FormGroup;
  public EBillType = EBillType;
  public currentSupplierPage: number = 0;
  public itemsSupplierPerPage: number = 100;
  public isLoading: boolean = false;
  public BILL_TYPES = BILL_TYPES;
  public inventoryItems: IInventoryItemIssue[] = [];
  public jobItems: IJobIssue[] = [];
  public listSuppliers: ISupplierBasicInfo[] = [];
  public isSelectedBill: boolean = false;
  private timeoutId: NodeJS.Timeout;
  public dropdownPosition = {};
  public isRMSyncing: boolean = false;
  public EWorkOrderActionType = EWorkOrderActionType;
  public tenantIsSynced: string = '';
  public appendTo: string = null;
  public maskPattern = CURRENCYNUMBER;

  ngOnInit(): void {
    this.rentManagerIssueService.rmIssueData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && res.inventoryItem) {
          this.inventoryItems = res.inventoryItem || [];
        }
        if (res && res.job) {
          this.jobItems = res.job;
        }
      });
    this.issueForm = this.rentManagerIssueFormService.form;
    this.getListSupplier();
    this.isRMSyncing = this.rentManagerIssueFormService.disabled;
    this.configSyncInvoiceDetail();
  }
  get workOrderForm() {
    return this.rentManagerIssueFormService.form.get('workOrder') as FormArray;
  }
  get isSubmittedRentIssueForm() {
    return this.rentManagerIssueFormService.isSubmittedRentIssueForm;
  }
  configSyncInvoiceDetail() {
    this.tenantIsSynced =
      this.rentManagerIssueFormService.form.get('details').value.tenantId;
    const isHasDetailTenantId =
      this.tenantIsSynced &&
      (this.rentManagerIssueFormService.form.get('details').value
        ?.externalLinkedTenantId ||
        this.rentManagerIssueFormService.form.get('details').value
          ?.externalLinkedProspectId);
    this.setStatusForInvoiceDetailBill(isHasDetailTenantId);
    if (isHasDetailTenantId) {
      this.configSyncInvoiceDetailByDetailFormChanges();
    }
  }
  configSyncInvoiceDetailByDetailFormChanges() {
    this.rentManagerIssueFormService.form
      .get('details')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.setStatusForInvoiceDetailBill(rs.tenantId === this.tenantIsSynced);
      });
  }
  setStatusForInvoiceDetailBill(isHasDetailTenantId) {
    if (!isHasDetailTenantId) {
      this.BILL_TYPES[1].isDisabled = true;
      this.BILL_TYPES[1].tooltip =
        "You must sync 'Linked tenant/ tenant prospect' to RM before linking Invoice details";
    } else {
      this.BILL_TYPES[1].isDisabled = false;
      this.BILL_TYPES[1].tooltip =
        'You cannot create a bill for line items that have a linked PO or will create a linked PO.';
    }
  }
  isOpened() {
    document.querySelectorAll('.work-order-item').forEach((item, index) => {
      this.dropdownPosition[index] = this.getDropdownDirection(item, index);
    });
  }
  ngAfterViewInit(): void {
    this.handleScroll();
  }
  handleScroll() {
    const viewportTable = document
      ?.querySelector('.trudi-table-body')
      ?.getBoundingClientRect();
    if (!viewportTable) return null;
    let shouldShowScroll = viewportTable.height >= 100 % -600;
    if (shouldShowScroll) {
      this.appendTo = '.scrollable-box';
    } else {
      this.appendTo = '';
    }
  }
  public getDropdownDirection(element, index) {
    const elementRect = element.getBoundingClientRect().top;
    const viewportHeight = document
      .querySelector('.trudi-table-body')
      .getBoundingClientRect();
    const parentTop = viewportHeight.top;
    const parentHeight = viewportHeight.height;
    return elementRect < parentTop + parentHeight / 2 ? 'bottom' : 'top';
  }
  onAddWorkOrder() {
    this.rentManagerIssueFormService.addWorkOrderForm();
    this.handleScroll();
  }

  onSelectAction(actionType, indexItem, formItem) {
    switch (actionType) {
      case EWorkOrderActionType.VIEW_PURCHASE_ORDER: {
        let billInfo = this.getBillInfoToView(
          formItem.get('billInfo').value,
          EBillType.PURCHASE_ORDER
        );
        this.onViewBill(billInfo?.id, billInfo?.type);
        break;
      }
      case EWorkOrderActionType.VIEW_INVOICE_DETAIL: {
        let billInfo = this.getBillInfoToView(
          formItem.get('billInfo').value,
          EBillType.INVOICE_DETAIL
        );
        this.onViewBill(billInfo?.id, billInfo?.type);
        break;
      }
      case EWorkOrderActionType.VIEW_VENDOR_BILL: {
        let billInfo = this.getBillInfoToView(
          formItem.get('billInfo').value,
          EBillType.VENDOR_BILL
        );
        this.onViewBill(billInfo?.id, billInfo?.type);
        break;
      }
      case EWorkOrderActionType.VIEW_OWNER_BILL: {
        let billInfo = this.getBillInfoToView(
          formItem.get('billInfo').value,
          EBillType.OWNER_BILL
        );
        this.onViewBill(billInfo?.id, billInfo?.type);
        break;
      }
      case EWorkOrderActionType.DUPLICATE: {
        this.rentManagerIssueFormService.duplicateWorkItemWorkOrder(formItem);
        break;
      }
      case EWorkOrderActionType.DELETE: {
        this.rentManagerIssueFormService.removeWorkItemAtindex(indexItem);
        break;
      }
    }
  }
  getBillInfoToView(listBillInfo, typeBill) {
    return listBillInfo.filter((item) => item?.id && item.type === typeBill)[0];
  }
  onHandleViewBill(listBillInfo, typeBill) {
    const billInfo = this.getBillInfoToView(listBillInfo, typeBill);
    this.onViewBill(billInfo?.id, billInfo?.type);
  }
  onViewBill(id, typeBill) {
    switch (typeBill) {
      case EBillType.INVOICE_DETAIL:
        this.rentManagerIssueApiService.getInvoiceDetail(id).subscribe((rs) => {
          this.rentManagerIssueInvoiceDetailsService.setInvoiceDetails(rs);
          this.popupManagementService.setCurrentPopup(
            ERentManagerIssuePopup.RM_ISSUE_INVOICE_DETAILS_POPUP
          );
        });
        break;
      case EBillType.VENDOR_BILL:
      case EBillType.OWNER_BILL:
        this.rentManagerIssueApiService
          .getRmBillDetailData(id)
          .subscribe((rs) => {
            this.rentManagerIssueBillDetailsService.setBillDetails(rs);
            this.popupManagementService.setCurrentPopup(
              ERentManagerIssuePopup.RM_ISSUE_BILL_POPUP
            );
          });
        break;
      case EBillType.PURCHASE_ORDER:
        if (id) {
          this.purchaseOrderService.setPurchaseOrderId(id);
          this.popupManagementService.setCurrentPopup(
            ERentManagerIssuePopup.RM_ISSUE_PURCHASE_ORDER_POPUP
          );
        }
        break;
      default:
        break;
    }
  }
  calculateTotal(formGroup) {
    const quantity = formGroup.controls['quantity'].value
      ? parseFloat(
          formGroup.controls['quantity'].value.toString().replace(/,/g, '')
        )
      : 0;
    const price = formGroup.controls['salePrice'].value
      ? parseFloat(
          formGroup.controls['salePrice'].value.toString().replace(/,/g, '')
        )
      : 0;
    const total = quantity * price;
    formGroup.controls['totalPrice'].setValue(total);
  }
  onChangeDataTotal(formGroup) {
    this.calculateTotal(formGroup);
  }
  formatNumber(inputNumber) {
    return inputNumber.toFixed(2);
  }
  onInventoryItemChange(value, formItem) {
    let newPrice = null;
    if (value.isMarkupPercentage) {
      newPrice =
        Number(value.cost) + (Number(value.markup) * Number(value.cost)) / 100;
    } else {
      if (value?.cost) {
        newPrice += Number(value.cost);
      }
      if (value?.markup) {
        newPrice += Number(value.markup);
      }
    }

    formItem.controls['cost'].setValue(
      value.cost ? this.formatNumber(value.cost) : null
    );
    formItem.controls['description'].setValue(value.description ?? '');
    formItem.controls['quantity'].setValue(this.formatNumber(1));
    formItem.controls['salePrice'].setValue(
      newPrice ? this.formatNumber(newPrice) : null
    );
    this.calculateTotal(formItem);
  }

  getListSupplier() {
    this.rentManagerIssueApiService
      .getListSuppliers({
        page: this.currentSupplierPage,
        size: this.itemsSupplierPerPage,
        search: '',
        email_null: true,
        onlySyncData: true,
        userIds: [],
        propertyId: this.taskService.currentTask$.value?.property?.id || '',
        agencyId: this.taskService.currentTask$.value.agencyId
      } as IInputToGetSupplier)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.listSuppliers = (
            res as IUsersSupplierBasicInfoProperty
          ).suppliers;
        }
      });
  }
  onSelectBillType(form) {
    form.updateValueAndValidity();
  }
  onJobChange(form) {
    form.updateValueAndValidity();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
