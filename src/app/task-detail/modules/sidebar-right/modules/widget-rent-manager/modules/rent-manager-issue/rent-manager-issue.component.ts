import { Component, OnInit } from '@angular/core';
import { RentManagerIssueApiService } from './services/rent-manager-issue-api.service';
import { RentManagerIssueService } from './services/rent-manager-issue.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  takeUntil
} from 'rxjs';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiService } from '@services/trudi.service';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { ToastrService } from 'ngx-toastr';
import { TaskService } from '@services/task.service';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import {
  EBillType,
  ERentManagerIssuePopup
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/popup-management.service';
import { DEBOUNCE_SOCKET_TIME } from '@/app/dashboard/utils/constants';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

@Component({
  selector: 'rent-manager-issue',
  templateUrl: './rent-manager-issue.component.html',
  styleUrls: ['./rent-manager-issue.component.scss']
})
export class RentManagerIssueComponent implements OnInit {
  constructor(
    private stepService: StepService,
    private trudiService: TrudiService,
    private widgetRMService: WidgetRMService,
    private rxWebsocketService: RxWebsocketService,
    private rentManagerIssueService: RentManagerIssueService,
    private rentManagerIssueApiService: RentManagerIssueApiService,
    private toastService: ToastrService,
    private taskService: TaskService,
    private rentManagerIssueFormService: RentManagerIssueFormService,
    public popupManagementService: PopupManagementService
  ) {}

  private destroy$ = new Subject<void>();
  public currentPopup: ERentManagerIssuePopup = null;
  public readonly ERentManagerIssuePopup = ERentManagerIssuePopup;

  ngOnInit(): void {
    this.subscribeData();
    this.subscribePopupState();
    this.subscribeSocketUpdateStatusWidget();
    this.subscribeSocketPurchaseOrderUpdateStatusWidget();
    this.subscribeSocketInvoiceDetailUpdateStatusWidget();
  }

  subscribePopupState() {
    // handle reset data when close rm issue modal
    this.popupManagementService.currentPopup$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        this.currentPopup = res;
        if (!res) {
          this.rentManagerIssueFormService.clear();
        }
      });
  }

  subscribeData() {
    this.rentManagerIssueApiService.getRmIssueData().subscribe({
      next: (res) => {
        if (res) {
          //TODO: tester demo US
          if (res?.inventoryItem) {
            res.inventoryItem = res?.inventoryItem?.filter(
              (e) => e.name !== 'note name'
            );
          }
          this.rentManagerIssueService.setRmIssueData(res);
        }
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  subscribeSocketUpdateStatusWidget() {
    this.rxWebsocketService.onSocketServiceIssue
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        filter((res) => {
          return (
            res &&
            res.data &&
            res.data.taskId === this.taskService.currentTaskId$.value
          );
        })
      )
      .subscribe((res) => {
        this.widgetRMService.setRMWidgetStateByType(
          RMWidgetDataField.RM_ISSUES,
          'UPDATE',
          this.widgetRMService.rmIssues.value.map((rmIssue) => {
            if (rmIssue.id === res.data.id) {
              res.data['syncState'] = 'UPDATE';
              return res.data;
            }
            return rmIssue;
          })
        );

        if (
          res.data.syncStatus === ESyncStatus.FAILED &&
          res.data?.errorMessSync
        ) {
          this.toastService.error(res.data?.errorMessSync);
        }
        const trudiResponeTemplate =
          this.trudiService.getTrudiResponse?.getValue();
        if (
          trudiResponeTemplate?.isTemplate &&
          res.data.syncStatus === ESyncStatus.COMPLETED &&
          res.data?.currentStepId
        ) {
          this.updateButton(
            res?.data?.currentStepId,
            res?.data?.action,
            res?.data?.taskId,
            TrudiButtonEnumStatus.COMPLETED,
            ECRMSystem.RENT_MANAGER,
            ERentManagerType.ISSUE
          );
        }
      });
  }

  updateButton(id, action, taskId, status, stepType, componentType) {
    this.stepService
      .updateStep(taskId, id, action, status, stepType, componentType)
      .subscribe((data) => {
        this.stepService.updateTrudiResponse(data, EActionType.UPDATE_RM);
        this.stepService.setChangeBtnStatusFromRMWidget(false);
      });
  }

  subscribeSocketPurchaseOrderUpdateStatusWidget() {
    this.rxWebsocketService.onSocketPurchaseOrder
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        filter((res) => {
          return (
            res &&
            res.data &&
            res.data.taskId === this.taskService.currentTaskId$.value
          );
        })
      )
      .subscribe((res) => {
        if (res) {
          const rmIssuesData = this.widgetRMService.rmIssues.value;
          const updatedRmIssues = rmIssuesData.map((item) => {
            if (item?.id === res?.data?.serviceIssueId) {
              item['syncState'] = 'UPDATE';
              const newWorkOrder = item?.workOrder?.map((it) => {
                if (it?.id === res?.data?.workOrderId) {
                  const newBills = it.bills.map((bill) => {
                    if (bill.type === EBillType.PURCHASE_ORDER) {
                      return {
                        ...bill,
                        syncStatus: res.data?.purchaseOrder?.syncStatus,
                        syncDate: res.data?.purchaseOrder?.syncDate
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
                syncStatus: res?.data?.syncStatus,
                syncDate: res?.data?.syncDate
              };
            }
            return item;
          });
          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.RM_ISSUES,
            'UPDATE',
            updatedRmIssues
          );
          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();
          if (
            trudiResponeTemplate?.isTemplate &&
            res.data.syncStatus === ESyncStatus.COMPLETED &&
            res.data?.currentStepId
          ) {
            this.updateButton(
              res?.data?.currentStepId,
              res?.data?.action,
              res?.data?.taskId,
              TrudiButtonEnumStatus.COMPLETED,
              ECRMSystem.RENT_MANAGER,
              ERentManagerType.ISSUE
            );
          }
          if (
            res.data.syncStatus === ESyncStatus.FAILED &&
            res.data?.errorMessSync
          ) {
            this.toastService.error(res.data?.errorMessSync);
          }
        }
      });
  }

  subscribeSocketInvoiceDetailUpdateStatusWidget() {
    this.rxWebsocketService.onSocketIssueInvoiceDetail
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        filter((res) => {
          return (
            res &&
            res.data &&
            res.data.taskId === this.taskService.currentTaskId$.value
          );
        })
      )
      .subscribe((res) => {
        if (res) {
          const rmIssuesData = this.widgetRMService.rmIssues.value;
          const updatedRmIssues = rmIssuesData.map((item) => {
            if (item?.id === res?.data?.serviceIssueId) {
              item['syncState'] = 'UPDATE';
              const newWorkOrder = item?.workOrder?.map((it) => {
                if (it?.id === res?.data?.workOrderId) {
                  const newBills = it.bills.map((bill) => {
                    if (bill.type === EBillType.INVOICE_DETAIL) {
                      return {
                        ...bill,
                        syncStatus: res.data?.invoiceDetail?.syncStatus,
                        syncDate: res.data?.invoiceDetail?.syncDate
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
                syncStatus: res?.data?.syncStatus,
                syncDate: res?.data?.syncDate
              };
            }
            return item;
          });
          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.RM_ISSUES,
            'UPDATE',
            updatedRmIssues
          );
          if (
            res.data?.invoiceDetail?.syncStatus === ESyncStatus.FAILED &&
            res.data?.invoiceDetail?.errorMessage
          ) {
            this.toastService.error(res.data?.invoiceDetail?.errorMessage);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
