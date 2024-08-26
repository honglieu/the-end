import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, switchMap, takeUntil, of, distinctUntilChanged } from 'rxjs';
import { PurchaseOrderDetailComponent } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/purchase-order-popup/components/purchase-order-detail/purchase-order-detail.component';
import { ERentManagerIssuePopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/popup-management.service';
import { RMWidgetDataField } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { PurchaseOrderService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/purchase-order-popup/services/purchase-order.service';
import { TaskService } from '@services/task.service';
import {
  IPurchaseOrderSync,
  IPurchaseOrderSyncPayload
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/purchase-order.interface';
import { ToastrService } from 'ngx-toastr';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { IRentManagerIssueSyncStatus } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { SharedService } from '@services/shared.service';

@Component({
  selector: 'purchase-order-popup',
  templateUrl: './purchase-order-popup.component.html',
  styleUrls: ['./purchase-order-popup.component.scss']
})
export class PurchaseOrderPopupComponent implements OnInit, OnDestroy {
  @ViewChild('purchaseOrder') purchaseOrder: PurchaseOrderDetailComponent;
  private destroy$ = new Subject<void>();
  public isShowModal = false;
  public isDisabledSyncBtn = false;
  public purchaseOrderData: IPurchaseOrderSync;
  public agencyId: string;
  isArchiveMailbox: boolean;
  issueSyncStatus: IRentManagerIssueSyncStatus;
  isConsole: boolean;

  constructor(
    private inboxService: InboxService,
    private popupManagementService: PopupManagementService,
    private purchaseOrderService: PurchaseOrderService,
    private toastrService: ToastrService,
    private taskService: TaskService,
    private rentManagerIssueFormService: RentManagerIssueFormService,
    private widgetRMService: WidgetRMService,
    private agencyService: AgencyService,
    private stepService: StepService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.rentManagerIssueFormService.syncStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.issueSyncStatus = rs;
      });
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.popupManagementService.currentPopup$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isShowModal =
          res === ERentManagerIssuePopup.RM_ISSUE_PURCHASE_ORDER_POPUP;
        if (res === ERentManagerIssuePopup.RM_ISSUE_PURCHASE_ORDER_POPUP) {
          this.getPurchaseOrder();
        } else {
          this.purchaseOrder && this.purchaseOrder.resetValue();
          this.purchaseOrderService.setListUserPayload(null);
          this.purchaseOrderService.setListSupplierPayload(null);
          this.purchaseOrderService.isLoadingPurchase = false;
          this.purchaseOrderService.isSubmittedPurchaseOrderForm = false;
        }
      });
  }

  getPurchaseOrder() {
    this.purchaseOrderService.purchaseOrderId$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => prev === curr),
        switchMap((id) => {
          this.purchaseOrderService.isLoadingPurchase = true;
          if (id) {
            return this.purchaseOrderService.getPurchaseOrderById(id);
          } else {
            return of(null);
          }
        })
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          this.purchaseOrderData = res;
          this.purchaseOrderService.setOriginPurchaseOrderData({
            detail: res,
            billing: res?.details
          });
          this.purchaseOrderService.setChangedPurchaseOrderData({
            detail: res,
            billing: res?.details
          });
          this.purchaseOrderService.isLoadingPurchase = false;
          const syncStatusValue =
            this.issueSyncStatus.syncStatus === ESyncStatus.NOT_SYNC
              ? {
                  syncStatus: ESyncStatus.NOT_SYNC,
                  lastTimeSynced: null
                }
              : {
                  syncStatus: res?.syncStatus,
                  lastTimeSynced: res?.syncDate
                };
          this.purchaseOrderService.setSyncStatus(syncStatusValue);
        },
        error: (error) => {
          this.purchaseOrderService.isLoadingPurchase = false;
        },
        complete: () => {
          this.purchaseOrderService.isLoadingPurchase = false;
        }
      });
  }

  handleAfterClose() {
    if (this.isShowModal) {
      this.purchaseOrder && this.purchaseOrder.resetValue();
      this.popupManagementService.setCurrentPopup(null);
      this.purchaseOrderService.isSubmittedPurchaseOrderForm = false;
    }
  }

  handleBack() {
    this.purchaseOrder && this.purchaseOrder.resetValue();
    this.popupManagementService.setCurrentPopup(
      ERentManagerIssuePopup.RM_ISSUE_POPUP
    );
    this.purchaseOrderService.isSubmittedPurchaseOrderForm = false;
  }

  handleSyncPT() {
    if (this.isArchiveMailbox) return;
    this.purchaseOrderService.isSubmittedPurchaseOrderForm = true;
    if (this.purchaseOrder) {
      this.purchaseOrder.handleSubmitForm();
      const billValue = this.purchaseOrder.getBills.value as Array<any>;
      if (
        this.purchaseOrder.purchaseOrderForm.invalid ||
        this.purchaseOrder.getBills.invalid ||
        !billValue.length
      ) {
        return;
      }
    }
    this.isDisabledSyncBtn = true;
    this.purchaseOrderService.setSyncStatus({
      ...this.syncStatus,
      syncStatus: ESyncStatus.INPROGRESS
    });
    let rmIssueId = this.rentManagerIssueFormService.getSelectRMIssue()?.id;
    const billDetails = (this.purchaseOrder.getBills.value as Array<any>).map(
      (data) => {
        const formattedCost = parseFloat(
          data?.cost?.toString()?.replace(/,/g, '')
        );
        const formattedQuantity = parseFloat(
          data?.quantity?.toString()?.replace(/,/g, '')
        );
        if (data?.id) {
          return {
            externalId: data?.externalId,
            id: data?.id,
            inventoryItemId: data?.item,
            jobId: data?.job,
            comment: data?.memo,
            quantity: formattedQuantity,
            cost: formattedCost,
            total: formattedCost * formattedQuantity
          };
        } else {
          return {
            inventoryItemId: data?.item,
            jobId: data?.job,
            comment: data?.memo,
            quantity: formattedQuantity,
            cost: formattedCost,
            total: formattedCost * formattedQuantity
          };
        }
      }
    );
    const currentStep = this.stepService.currentRMStep.getValue();

    const payload: IPurchaseOrderSyncPayload = {
      id: this.purchaseOrderData.id,
      propertyId: this.taskService.currentTask$.value.property.id,
      issueDate: this.purchaseOrder.issueDateControl.value,
      vendorId: this.purchaseOrder.vendorControl.value,
      externalId: this.purchaseOrderData.externalId,
      purchaseOrderNumber: this.purchaseOrderData.purchaseOrderNumber,
      description: this.purchaseOrder.descriptionControl.value,
      details: billDetails,
      userId: this.purchaseOrder.userTypeControl.value,
      billingAddress: this.purchaseOrder.billingAddressControl.value,
      shippingAddress: this.purchaseOrder.shippingAddressControl.value,
      isInvoiceRequired: this.purchaseOrder.isInvoicedControl.value,
      userType: this.purchaseOrder.accountTypeControl.value,
      workflowId: this.purchaseOrder.workFlowControl.value,
      workOrderId: this.purchaseOrderData.workOrderId,
      taskId: this.taskService.currentTask$.value.id,
      agencyId: this.agencyId,
      currentStepId: currentStep?.id,
      rmIssueId: rmIssueId
    };
    this.purchaseOrderService.syncPurchaseOrder(payload).subscribe({
      next: (res) => {
        if (res) {
          this.isDisabledSyncBtn = false;
          const updatedRmIssues = this.widgetRMService.rmIssues.value.map(
            (item) => {
              if (item.id === rmIssueId) {
                const newWorkOrder = item.workOrder.map((it) => {
                  if (it.id === this.purchaseOrderData.workOrderId) {
                    const newBills = it.bills.map((bill) => {
                      if (bill.id === res.id) {
                        return {
                          ...bill,
                          syncStatus: ESyncStatus.INPROGRESS,
                          syncDate: new Date()
                        };
                      }
                      return bill;
                    });
                    return {
                      ...it,
                      bills: newBills
                    };
                  }
                  return it;
                });
                return {
                  ...item,
                  workOrder: newWorkOrder,
                  syncStatus: ESyncStatus.INPROGRESS,
                  syncDate: new Date()
                };
              }
              return item;
            }
          );

          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.RM_ISSUES,
            'UPDATE',
            updatedRmIssues
          );
          this.purchaseOrderService.setSyncStatus({
            syncStatus: res?.syncStatus,
            lastTimeSynced: res?.syncDate
          });
          if (res?.syncStatus === ESyncStatus.FAILED && res?.errorMessSync) {
            this.toastrService.error(res?.errorMessSync);
            this.isDisabledSyncBtn = false;
          }
          this.popupManagementService.setCurrentPopup(null);
        }
      },
      error: (error) => {
        this.isDisabledSyncBtn = false;
      },
      complete: () => {
        this.isDisabledSyncBtn = false;
      }
    });
  }

  get syncStatus() {
    return this.purchaseOrderService.syncStatusData;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
