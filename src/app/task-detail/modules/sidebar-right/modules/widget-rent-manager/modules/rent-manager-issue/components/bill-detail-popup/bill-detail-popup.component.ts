import { Component, OnInit, OnDestroy } from '@angular/core';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/popup-management.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ERentManagerIssuePopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { BillDetailPopupFormService } from './services/bill-detail-popup-form.service';
import { RentManagerIssueApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-api.service';
import { RentManagerIssueBillDetailsService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-bill-details.service';
import { TaskService } from '@services/task.service';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { ToastrService } from 'ngx-toastr';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { isEqual } from 'lodash-es';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiService } from '@services/trudi.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { IRentManagerIssueSyncStatus } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { SharedService } from '@services/shared.service';

@Component({
  selector: 'bill-detail-popup',
  templateUrl: './bill-detail-popup.component.html',
  styleUrls: ['./bill-detail-popup.component.scss']
})
export class BillDetailPopupComponent implements OnInit, OnDestroy {
  public billId = '';
  public syncStatus: ESyncStatus;
  public syncDate;
  public destroy$ = new Subject<void>();
  public isShowModal: boolean = false;
  public propertyId = '';
  public originBillForm;
  isArchiveMailbox: boolean;
  issueSyncStatus: IRentManagerIssueSyncStatus;
  isConsole: boolean;

  constructor(
    private inboxService: InboxService,
    private popupManagementService: PopupManagementService,
    private billDetailPopupFormService: BillDetailPopupFormService,
    private rentManagerIssueApiService: RentManagerIssueApiService,
    private renManagerIssueBillService: RentManagerIssueBillDetailsService,
    private rentManagerIssueFormService: RentManagerIssueFormService,
    private widgetRMService: WidgetRMService,
    private toastrService: ToastrService,
    private taskService: TaskService,
    private stepService: StepService,
    private trudiService: TrudiService,
    private sharedService: SharedService
  ) {}

  get billForm() {
    return this.billDetailPopupFormService.getBillForm;
  }

  get detailForm() {
    return this.billDetailPopupFormService.billDetailForm;
  }

  get tableForm() {
    return this.billDetailPopupFormService.billTableForm;
  }

  get amount() {
    return this.detailForm?.get('amount');
  }

  changeFormat(res) {
    return {
      billDetail: {
        ...res.billDetail,
        amount: Math.round(Number(this.amount.value))
      },
      billTable: [
        ...res.billTable.map((e) => ({
          ...e,
          amount: Math.round(Number(e.amount)),
          markup: Math.round(Number(e.markup)),
          billableTo: e.billableTo?.id || null
        }))
      ]
    };
  }

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
    this.taskService.currentTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.propertyId = res?.property?.id;
      });
    this.renManagerIssueBillService.currentBillDetails$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.billDetailPopupFormService.buildBillForm(res);
        this.originBillForm = this.changeFormat(this.billForm.value);

        this.billForm.valueChanges
          .pipe(takeUntil(this.destroy$), debounceTime(200))
          .subscribe((res) => {
            const value = this.changeFormat(res);

            if (!isEqual(this.originBillForm, value)) {
              this.syncStatus =
                this.issueSyncStatus.syncStatus === ESyncStatus.NOT_SYNC
                  ? ESyncStatus.NOT_SYNC
                  : ESyncStatus.UN_SYNC;
              this.syncDate = new Date();
            }
          });
        this.billId = res.id;
        this.syncStatus =
          this.issueSyncStatus.syncStatus === ESyncStatus.NOT_SYNC
            ? ESyncStatus.NOT_SYNC
            : res.syncStatus;
        this.syncDate = res.syncDate;
      });
    this.popupManagementService.currentPopup$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isShowModal = res === ERentManagerIssuePopup.RM_ISSUE_BILL_POPUP;
      });
  }

  handleSyncRM() {
    if (this.isArchiveMailbox) return;
    this.billDetailPopupFormService.isSubmittedBill = true;
    this.billForm.markAllAsTouched();
    let rmIssueId = this.rentManagerIssueFormService.getSelectRMIssue()?.id;

    if (this.billForm.invalid || !this.tableForm?.controls?.length) return;
    const section = this.detailForm;
    const currentStep = this.stepService.currentRMStep.getValue();
    const payload = {
      data: {
        concurrencyId: section.get('concurrencyId')?.value,
        billId: this.billId,
        accountType: section.get('accountType')?.value,
        accountId: section.get('account')?.value,
        comment: section.get('memo')?.value,
        invoice: section.get('invoice')?.value,
        termId: section.get('term')?.value,
        amount: Number(
          section.get('amount')?.value.toString().replace(/,/g, '')
        ),
        billDate: section.get('billDate')?.value,
        postDate: section.get('postDate')?.value,
        dueDate: section.get('dueDate')?.value,
        billDetails: [],
        currentStepId: currentStep?.id,
        rmIssueId: rmIssueId
      },
      propertyId: this.propertyId,
      taskId: this.taskService.currentTask$.value.id
    };
    const table = this.tableForm?.controls.map((table, index) => {
      return {
        concurrencyId: table.get('concurrencyId').value,
        billDetailId: table.get('billDetailId').value,
        amount: Number(table.get('amount').value.toString().replace(/,/g, '')),
        accountType: table.get('billableTo').value
          ? table.get('accountType').value
          : null,
        gLAccountId: table.get('expenseAccount').value,
        jobId: table.get('job').value,
        comment: table.get('memo').value,
        markup: Number(
          table.get('markup').value?.toString()?.replace(/,/g, '')
        ),
        isBillable: table.get('billable').value,
        accountId: table.get('billableTo').value || null,
        is1099: table.get('is1099').value,
        isPrimaryOwner: false
      };
    });
    payload.data.billDetails = table;

    this.popupManagementService.setCurrentPopup(null);

    this.updateDataRmIssue(rmIssueId, ESyncStatus.INPROGRESS);

    this.rentManagerIssueApiService.syncBillDetailForm(payload).subscribe({
      next: (res) => {
        const billId = res?.billId || res?.bill?.id;
        const syncStatus = res?.syncStatus || res?.bill?.syncStatus;
        const updatedRmIssues = this.widgetRMService.rmIssues.value.map(
          (item) => {
            if (item.id === rmIssueId) {
              const newWorkOrder = item.workOrder.map((it) => {
                const newBills = it.bills.map((bill) => {
                  if (bill.id === billId) {
                    return {
                      ...bill,
                      syncStatus: syncStatus,
                      syncDate: new Date()
                    };
                  }
                  return bill;
                });
                return {
                  ...it,
                  bills: newBills
                };
              });

              return {
                ...item,
                workOrder: newWorkOrder,
                syncStatus: syncStatus,
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

        if (res?.syncStatus === ESyncStatus.FAILED && res?.errorMessage) {
          this.toastrService.error(res?.errorMessage);
        }
        const trudiResponeTemplate =
          this.trudiService.getTrudiResponse?.getValue();
        if (
          trudiResponeTemplate?.isTemplate &&
          res.syncStatus === ESyncStatus.COMPLETED &&
          res.currentStepId
        ) {
          this.updateButton(
            res?.currentStepId,
            res?.taskId,
            TrudiButtonEnumStatus.COMPLETED,
            ECRMSystem.RENT_MANAGER,
            ERentManagerType.ISSUE
          );
        }
      },
      error: (err) => {
        if (err?.message) this.toastrService.error(err?.message);
        this.updateDataRmIssue(rmIssueId, ESyncStatus.FAILED);
      },
      complete: () => {}
    });
  }

  updateButton(id, taskId, status, stepType, componentType) {
    this.stepService
      .updateStep(taskId, id, null, status, stepType, componentType)
      .subscribe((data) => {
        this.stepService.updateTrudiResponse(data, EActionType.UPDATE_RM);
        this.stepService.setChangeBtnStatusFromRMWidget(false);
      });
  }

  updateDataRmIssue(rmIssueId: string, status: string) {
    const updatedRmIssues = this.widgetRMService.rmIssues.value.map((item) => {
      if (item.id === rmIssueId) {
        return {
          ...item,
          syncStatus: status,
          syncDate: new Date()
        };
      }
      return item;
    });
    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.RM_ISSUES,
      'UPDATE',
      updatedRmIssues
    );
  }

  resetForm() {
    this.billForm?.reset();
    this.billForm?.markAsPristine();
    this.billForm?.markAsUntouched();
    this.billForm?.updateValueAndValidity();
  }

  handleBack() {
    if (this.isShowModal) {
      this.popupManagementService.setCurrentPopup(
        ERentManagerIssuePopup.RM_ISSUE_POPUP
      );
    }
  }

  handleAfterClose() {
    if (this.isShowModal) {
      this.popupManagementService.setCurrentPopup(null);
    }
  }

  ngOnDestroy() {
    this.resetForm();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
