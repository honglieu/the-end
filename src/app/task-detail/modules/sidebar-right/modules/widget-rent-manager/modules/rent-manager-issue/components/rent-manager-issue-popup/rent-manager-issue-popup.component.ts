import { Component, OnInit } from '@angular/core';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/popup-management.service';
import {
  ERentManagerIssueIndexTab,
  ERentManagerIssuePopup,
  ERentManagerIssueTab
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import {
  debounceTime,
  filter,
  map,
  merge,
  of,
  Subject,
  switchMap,
  takeUntil
} from 'rxjs';
import { RentManagerIssueApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-api.service';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import { TaskService } from '@services/task.service';
import { PropertiesService } from '@services/properties.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { isEmpty } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import { FormArray } from '@angular/forms';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@services/shared.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';

@Component({
  selector: 'rent-manager-issue-popup',
  templateUrl: './rent-manager-issue-popup.component.html',
  styleUrls: ['./rent-manager-issue-popup.component.scss']
})
export class RentManagerIssuePopupComponent implements OnInit {
  constructor(
    private taskService: TaskService,
    private toastrService: ToastrService,
    private agencyService: AgencyService,
    private propertyService: PropertiesService,
    private widgetRMService: WidgetRMService,
    private popupManagementService: PopupManagementService,
    private rentManagerIssueApiService: RentManagerIssueApiService,
    private rentManagerIssueFormService: RentManagerIssueFormService,
    private stepService: StepService,
    private inboxService: InboxService,
    private showSidebarRightService: ShowSidebarRightService,
    private sharedService: SharedService
  ) {}

  private destroy$ = new Subject<void>();
  public isShowModal: boolean = false;
  public isChangeForm: boolean = false;
  public ERentManagerIssueTab = ERentManagerIssueTab;
  public indexCurrentTab: ERentManagerIssueIndexTab;
  public isTabHistoryNotesOpen: boolean;
  public RENT_MANAGER_ISSUE_TABS = [
    {
      title: 'Details',
      value: ERentManagerIssueTab.DETAILS,
      warning: false,
      indexTab: ERentManagerIssueIndexTab.TAB_DETAILS
    },
    {
      title: 'Work order',
      value: ERentManagerIssueTab.WORK_ORDER,
      warning: false,
      indexTab: ERentManagerIssueIndexTab.TAB_WORK_ORDER
    },
    {
      title: 'Checklist',
      value: ERentManagerIssueTab.CHECKLIST,
      warning: false,
      indexTab: ERentManagerIssueIndexTab.TAB_CHECKLIST
    },
    {
      title: 'History notes',
      value: ERentManagerIssueTab.HISTORY_NOTES,
      warning: false,
      indexTab: ERentManagerIssueIndexTab.TAB_HISTORY_NOTES
    }
  ];
  public isUpdateIssueModal: boolean = false;
  public isLoading: boolean = false;
  public resetToInitialTab: number = ERentManagerIssueIndexTab.TAB_DETAILS;
  public syncStatus$;
  public currentPopup: ERentManagerIssuePopup;
  isArchiveMailbox: boolean;
  isConsole: boolean;

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.syncStatus$ = this.rentManagerIssueFormService.syncStatus$.pipe(
      map(({ syncStatus, syncDate }) => {
        if (
          syncStatus &&
          syncStatus !== ESyncStatus.INPROGRESS &&
          syncStatus !== ESyncStatus.NOT_SYNC &&
          this.isChangeForm
        ) {
          syncStatus = ESyncStatus.UN_SYNC;
        }

        return {
          status: syncStatus || ESyncStatus.NOT_SYNC,
          lastTimeSynced: syncDate
        };
      })
    );

    this.popupManagementService.currentPopup$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((res) => {
          if (res === null) {
            this.resetToInitialTab = ERentManagerIssueIndexTab.TAB_DETAILS;
          }
          this.currentPopup = res;
          this.isShowModal = res === ERentManagerIssuePopup.RM_ISSUE_POPUP;

          if (this.isShowModal) {
            return merge(
              this.rentManagerIssueForm.get('general').valueChanges,
              this.rentManagerIssueForm.get('details').valueChanges,
              this.rentManagerIssueForm.get('workOrder').valueChanges,
              this.rentManagerIssueForm.get('checklist').valueChanges,
              this.rentManagerIssueForm.get('historyNotes').valueChanges
            ).pipe(
              takeUntil(this.destroy$),
              debounceTime(200),
              filter((res) => res && !isEmpty(res))
            );
          }
          return of({});
        })
      )
      .subscribe((res) => {
        if (
          this.isShowModal &&
          this.rentManagerIssueFormService.isRMIssueFormChanged()
        ) {
          this.isChangeForm = true;
          this.rentManagerIssueFormService.setSyncStatusBS({
            syncDate: new Date()
          });
        }
      });
    this.widgetRMService
      .getModalUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isUpdateIssueModal = res;
      });
  }

  get rentManagerIssueForm() {
    return this.rentManagerIssueFormService.form;
  }

  get disabledForm() {
    return this.rentManagerIssueFormService.disabled;
  }

  trackByFn(index, item) {
    return item.warning;
  }

  handleAfterClose() {
    if (this.currentPopup === ERentManagerIssuePopup.RM_ISSUE_POPUP) {
      this.handleResetPopup();
      this.widgetRMService.setPopupWidgetState(null);
      this.stepService.setCurrentRMStep(null);
    }
  }

  handleBack() {
    if (this.isUpdateIssueModal) {
      this.widgetRMService.setPopupWidgetState(
        ERentManagerType.UPDATE_RM_POPUP
      );
      this.handleResetPopup();
      return;
    }
    this.rentManagerIssueFormService.setSelectRMIssue(null);
  }
  setValidatorForWorkOrderForm() {
    (this.rentManagerIssueForm.get('workOrder') as FormArray).controls.forEach(
      (control) => {
        control.patchValue({ isAllowValidate: true });
      }
    );
  }

  handleSyncRM() {
    if (this.isArchiveMailbox) return;
    this.rentManagerIssueFormService.isSubmittedRentIssueForm = true;
    this.setValidatorForWorkOrderForm();
    this.rentManagerIssueForm.markAllAsTouched();
    if (this.rentManagerIssueForm.invalid) {
      return;
    }
    const currentStep = this.stepService.currentRMStep.getValue();

    this.isLoading = true;
    const { id, agencyId } = this.taskService.currentTask$.value;
    const body = {
      agencyId: agencyId,
      taskId: id,
      propertyId: this.propertyService.currentPropertyId?.value,
      currentStepId: currentStep?.id,
      action: currentStep?.action,
      ...this.rentManagerIssueFormService.getValues()
    };
    let rmIssueId = this.rentManagerIssueFormService.getSelectRMIssue()?.id;
    if (rmIssueId) {
      body['id'] = rmIssueId;
    }

    this.rentManagerIssueApiService.syncIssueToRM(body).subscribe({
      next: (res) => {
        if (res) {
          const updatedRmIssues = rmIssueId
            ? this.widgetRMService.rmIssues.value.map((item) => {
                if (item.id === rmIssueId) {
                  return res;
                }
                return item;
              })
            : [res, ...this.widgetRMService.rmIssues.value];

          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.RM_ISSUES,
            'UPDATE',
            updatedRmIssues
          );
          this.isShowModal = false;
          this.stepService.setCurrentRMStep(null);
          this.showSidebarRightService.handleToggleSidebarRight(true);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastrService.error(error?.message);
        this.isLoading = false;
      }
    });
  }

  handleResetPopup() {
    this.isLoading = false;
    this.isChangeForm = false;
    this.rentManagerIssueFormService.clear();
    this.popupManagementService.setCurrentPopup(null);
  }

  onTabSelected(index: number): void {
    this.indexCurrentTab = index;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
