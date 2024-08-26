import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  Subject,
  takeUntil
} from 'rxjs';
import { SCROLL_THRESHOLD } from '@/app/dashboard/utils/constants';
import { TaskService } from '@services/task.service';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { ISyncRmInspection } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/interfaces/rent-manager-inspection.interface';
import { RentManagerInspectionApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/services/rent-manager-inspection-api.service';
import { RentManagerInspectionFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/services/rent-manager-inspection-form.service';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { isEmpty } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { FormArray } from '@angular/forms';
import { SharedService } from '@services/shared.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';

enum EInspectionPopupState {
  INSPECTION_RM_POPUP = 'INSPECTION_RM_POPUP',
  AREA_POPUP = 'AREA_POPUP'
}

@Component({
  selector: 'rent-manager-inspection',
  templateUrl: './rent-manager-inspection.component.html',
  styleUrls: ['./rent-manager-inspection.component.scss']
})
export class RentManagerInspectionComponent implements OnInit, OnDestroy {
  constructor(
    private inboxService: InboxService,
    private toastService: ToastrService,
    private stepService: StepService,
    private taskService: TaskService,
    private widgetRMService: WidgetRMService,
    private rentManagerInspectionFormService: RentManagerInspectionFormService,
    private rentManagerInspectionApiService: RentManagerInspectionApiService,
    private showSidebarRightService: ShowSidebarRightService,
    private sharedService: SharedService
  ) {}
  private destroy$ = new Subject<void>();
  public isChangeForm: boolean = false;
  public syncStatus$: Observable<{
    syncStatus: ESyncStatus;
    syncDate: Date;
  }>;
  public isOpenFormUpdateStep: boolean = false;
  private currentPopupWidgetState: ERentManagerType;
  public isArchiveMailbox: boolean;
  public inspectionPopupState: EInspectionPopupState =
    EInspectionPopupState.INSPECTION_RM_POPUP;
  public readonly EInspectionPopupState = EInspectionPopupState;
  public isLoading: boolean = false;
  public isConsole: boolean;

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.syncStatus$ = this.rentManagerInspectionFormService.syncStatus$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
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
          syncStatus: syncStatus || ESyncStatus.NOT_SYNC,
          syncDate: syncDate
        };
      })
    );
    this.rentManagerInspectionFormService.buildForm();

    this.inspectionRmForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        debounceTime(SCROLL_THRESHOLD),
        filter((res) => res && !isEmpty(res))
      )
      .subscribe((res) => {
        if (
          this.inspectionPopupState ===
            EInspectionPopupState.INSPECTION_RM_POPUP &&
          this.rentManagerInspectionFormService.isFormChanged()
        ) {
          this.isChangeForm = true;
          this.rentManagerInspectionFormService.setSyncStatusInspectionPopup({
            syncDate: new Date()
          });
        }
      });

    this.widgetRMService
      .getModalUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isOpenFormUpdateStep = res;
      });

    this.widgetRMService
      .getPopupWidgetState()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res === ERentManagerType.INSPECTION) {
          this.inspectionPopupState = EInspectionPopupState.INSPECTION_RM_POPUP;
        }
        this.currentPopupWidgetState = res as ERentManagerType;
      });
  }

  public handleAfterClose() {
    if (this.currentPopupWidgetState === ERentManagerType.INSPECTION) {
      this.widgetRMService.setPopupWidgetState(null);
    }
    this.handleResetPopup();
  }

  private handleSyncInspection(body: ISyncRmInspection) {
    const id = this.rentManagerInspectionFormService.getSelectRmInspection?.id;

    this.rentManagerInspectionApiService.syncRmInspection(body).subscribe({
      next: (res) => {
        this.inspectionPopupState = null;
        this.widgetRMService.setPopupWidgetState(null);
        const updateRmInspection = id
          ? this.widgetRMService.rmInspections.value.map((data) => {
              if (id === data.id) {
                res.syncState = 'UPDATE';
                return {
                  ...res
                };
              }
              return data;
            })
          : [res, ...this.widgetRMService.rmInspections.value];
        this.widgetRMService.setRMWidgetStateByType(
          RMWidgetDataField.RM_INSPECTIONS,
          'UPDATE',
          updateRmInspection
        );
        this.rentManagerInspectionFormService.setSyncStatusInspectionPopup({
          syncStatus: res.syncStatus,
          syncDate: res.syncDate
        });
        if (res.syncStatus === ESyncStatus.FAILED && res?.errorMessSync) {
          this.toastService.error(res.errorMessSync);
        }
        this.isLoading = false;
        this.showSidebarRightService.handleToggleSidebarRight(true);
      },
      error: (error) => {
        this.isLoading = false;
        const errMsg = error?.error?.message || error?.message;
        this.toastService.error(errMsg);
        this.rentManagerInspectionFormService.isSyncing = false;
        this.inspectionRmForm.enable();
      }
    });
  }

  public handleSyncRM() {
    this.rentManagerInspectionFormService.checkSubmitted = false;
    if (this.isArchiveMailbox) return;
    this.inspectionRmForm.markAllAsTouched();
    if (this.inspectionRmForm.invalid) {
      return;
    }
    const currentStep = this.stepService.currentRMStep.getValue();
    const idRmInspection =
      this.rentManagerInspectionFormService.getSelectRmInspection?.id;
    const { id, agencyId } = this.taskService.currentTask$.value;
    const body: ISyncRmInspection = {
      agencyId: agencyId,
      id: idRmInspection,
      currentStepId: currentStep?.id,
      taskId: id,
      propertyId: this.taskService.currentTask$.value?.property?.id,
      ...this.rentManagerInspectionFormService.getPayloadRmInspection()
    };
    this.inspectionRmForm.disable();
    this.rentManagerInspectionFormService.isSyncing = true;
    this.isLoading = true;
    this.handleSyncInspection(body);
  }

  handleResetPopup() {
    this.isChangeForm = false;
    this.rentManagerInspectionFormService.clear();
  }

  handleBack() {
    this.widgetRMService.setPopupWidgetState(ERentManagerType.UPDATE_RM_POPUP);
  }

  public get inspectionAreas() {
    return this.rentManagerInspectionFormService.areas as FormArray;
  }

  public get isDisabled() {
    return this.rentManagerInspectionFormService.isSyncing;
  }

  get inspectionRmForm() {
    return this.rentManagerInspectionFormService.form;
  }

  get description() {
    return this.inspectionRmForm.get('description');
  }

  get notes() {
    return this.inspectionRmForm.get('notes');
  }

  get inspectionDate() {
    return this.inspectionRmForm.get('inspectionDate');
  }

  get scheduledDate() {
    return this.inspectionRmForm.get('scheduledDate');
  }

  get idUserPropertyGroup() {
    return this.inspectionRmForm.get('idUserPropertyGroup');
  }

  get inspectionStatusID() {
    return this.inspectionRmForm.get('inspectionStatusID');
  }

  get inspectionTypeID() {
    return this.inspectionRmForm.get('inspectionTypeID');
  }

  ngOnDestroy(): void {
    this.isChangeForm = false;
    this.destroy$.next();
    this.destroy$.unsubscribe();
    this.rentManagerInspectionFormService.isSyncing = false;
    this.rentManagerInspectionFormService.checkSubmitted = true;
    this.rentManagerInspectionFormService.setSelectRmInspection(null);
    this.rentManagerInspectionFormService.setSyncStatusInspectionPopup({
      syncStatus: ESyncStatus.NOT_SYNC,
      syncDate: null
    });
  }
}
