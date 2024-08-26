import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Subject, concatMap, debounceTime, takeUntil } from 'rxjs';
import { RMWidgetDataField } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { ERentManagerIssuePopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { IRMIssueInvoice } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue-invoice-details.interface';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/popup-management.service';
import { RentManagerIssueInvoiceDetailsFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/rent-manager-invoice-details-popup/services/rent-manager-issue-invoice-details-form.service';
import { RentManagerIssueInvoiceDetailsService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/rent-manager-invoice-details-popup/services/rent-manager-issue-invoice-details.service';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import { RentManagerIssueApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-api.service';
import { TaskService } from '@services/task.service';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { ToastrService } from 'ngx-toastr';
import { isEqual } from 'lodash-es';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { IRentManagerIssueSyncStatus } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { SharedService } from '@services/shared.service';
@Component({
  selector: 'rent-manager-invoice-details-popup',
  templateUrl: './rent-manager-invoice-details-popup.component.html',
  styleUrls: ['./rent-manager-invoice-details-popup.component.scss']
})
export class RentManagerInvoiceDetailsPopupComponent
  implements OnInit, OnDestroy
{
  @Input() show = false;
  public formGroup: FormGroup;
  private currentPopup: ERentManagerIssuePopup;
  public syncDate: Date;
  public syncStatus: ESyncStatus = ESyncStatus.UN_SYNC;
  public submitted: boolean;
  public destroy$ = new Subject();
  private invoiceDetails: IRMIssueInvoice;
  public disableSyncBtn: boolean;
  isArchiveMailbox: boolean;
  isConsole: boolean;
  issueSyncStatus: IRentManagerIssueSyncStatus;

  constructor(
    private inboxService: InboxService,
    private rmIssueInvoiceDetailsService: RentManagerIssueInvoiceDetailsService,
    private rmIssueService: RentManagerIssueService,
    private rmIssueApiService: RentManagerIssueApiService,
    private popupManagementService: PopupManagementService,
    private rmIssueFormService: RentManagerIssueFormService,
    private rmIssueInvoiceDetailsFormService: RentManagerIssueInvoiceDetailsFormService,
    private taskService: TaskService,
    private widgetRMService: WidgetRMService,
    private toastrService: ToastrService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.rmIssueFormService.syncStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.issueSyncStatus = rs;
      });
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.rmIssueService.rmIssueData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.rmIssueInvoiceDetailsFormService.setPrefillData(rs);
      });

    this.rmIssueInvoiceDetailsService.currentInvoiceDetails$
      .pipe(takeUntil(this.destroy$))
      .pipe(
        concatMap((value) => {
          this.invoiceDetails = value;
          const workOrder = this.rmIssueFormService
            .getSelectRMIssue()
            ?.workOrder?.find((order) =>
              order.bills.some((bill) => bill.id === value.id)
            );
          this.rmIssueInvoiceDetailsFormService.setWorkOrderData(workOrder);
          this.syncDate = value.syncDate;
          this.syncStatus =
            this.issueSyncStatus.syncStatus === ESyncStatus.NOT_SYNC
              ? ESyncStatus.NOT_SYNC
              : (value.syncStatus as ESyncStatus);
          return (this.formGroup =
            this.rmIssueInvoiceDetailsFormService.buildForm(
              this.invoiceDetails
            )).valueChanges;
        }),
        debounceTime(200)
      )
      .subscribe((rs) => {
        if (rs) {
          const formattedOrigin =
            this.rmIssueInvoiceDetailsService.formatInvoice(
              this.invoiceDetails
            );
          const formValue = this.rmIssueInvoiceDetailsFormService.getValue();
          if (!isEqual(formValue, formattedOrigin))
            this.syncStatus =
              this.issueSyncStatus.syncStatus === ESyncStatus.NOT_SYNC
                ? ESyncStatus.NOT_SYNC
                : ESyncStatus.UN_SYNC;
        }
      });

    this.popupManagementService.currentPopup$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.currentPopup = rs;
        this.show =
          rs === ERentManagerIssuePopup.RM_ISSUE_INVOICE_DETAILS_POPUP;
      });
  }

  handleAfterClose() {
    if (
      this.currentPopup ===
      ERentManagerIssuePopup.RM_ISSUE_INVOICE_DETAILS_POPUP
    ) {
      this.popupManagementService.setCurrentPopup(null);
    }
  }

  back() {
    this.popupManagementService.setCurrentPopup(
      ERentManagerIssuePopup.RM_ISSUE_POPUP
    );
  }

  get invoiceDetailsFormArray() {
    return this.formGroup?.get('invoiceDetails') as FormArray;
  }

  public get totalAmount() {
    return this.formGroup?.get('totalAmount')?.value;
  }

  public get chargeAmount() {
    return this.formGroup?.get('chargeAmount')?.value;
  }

  public get chargeAmountPaid() {
    return this.formGroup?.get('chargeAmountPaid')?.value;
  }

  public get balanceDue() {
    return this.formGroup?.get('balanceDue')?.value;
  }

  public get tax() {
    return this.formGroup?.get('tax')?.value;
  }

  public get accountIdControl() {
    return this.formGroup?.get('accountId');
  }

  syncToRM() {
    if (this.isArchiveMailbox) return;
    this.rmIssueInvoiceDetailsFormService.submitted = true;
    this.formGroup.markAsDirty();
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) return;
    this.disableSyncBtn = true;
    this.syncStatus = ESyncStatus.INPROGRESS;
    let rmIssueId = this.rmIssueFormService.getSelectRMIssue()?.id;
    this.updateRmIssue(ESyncStatus.INPROGRESS, rmIssueId);
    this.rmIssueApiService
      .syncRmIssueInvoice({
        ...this.rmIssueInvoiceDetailsFormService.getValue(),
        taskId: this.taskService.currentTaskId$.value,
        propertyId: this.taskService.currentTask$.value?.property?.id
      })
      .subscribe({
        next: (rs) => {
          const updatedRmIssues = this.widgetRMService.rmIssues.value.map(
            (issue) => {
              if (issue.id === rmIssueId) {
                const newWorkOrders = issue.workOrder.map((workOrder) => {
                  const bills = workOrder.bills?.map((bill) => {
                    if (bill.id === rs.id) {
                      return {
                        ...bill,
                        syncStatus: rs?.syncStatus,
                        syncDate: new Date()
                      };
                    }
                    return bill;
                  });
                  return {
                    ...workOrder,
                    bills
                  };
                });
                return {
                  ...issue,
                  workOrder: newWorkOrders,
                  orkOrder: newWorkOrders,
                  syncStatus: rs?.syncStatus
                };
              }
              return issue;
            }
          );
          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.RM_ISSUES,
            'UPDATE',
            updatedRmIssues
          );
          this.popupManagementService.setCurrentPopup(null);
          if (rs?.syncStatus === ESyncStatus.FAILED && rs?.errorMessage) {
            this.toastrService.error(rs?.errorMessage);
          }
        },
        error: (err) => {
          if (err?.message) this.toastrService.error(err?.message);
          this.updateRmIssue(ESyncStatus.FAILED, rmIssueId);
        },
        complete: () => {
          this.disableSyncBtn = false;
        }
      });
  }

  updateRmIssue(syncStatus: ESyncStatus, issueId: string) {
    const updatedRmIssues = this.widgetRMService.rmIssues.value.map((issue) => {
      if (issue.id === issueId) {
        const newIssue = {
          ...issue,
          syncStatus: syncStatus,
          syncDate: new Date()
        };
        return newIssue;
      }
      return issue;
    });

    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.RM_ISSUES,
      'UPDATE',
      updatedRmIssues
    );
  }

  ngOnDestroy() {
    this.rmIssueInvoiceDetailsFormService.submitted = false;
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
