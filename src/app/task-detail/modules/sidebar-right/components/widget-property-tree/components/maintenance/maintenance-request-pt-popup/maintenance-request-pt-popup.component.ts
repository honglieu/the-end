import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import { filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EmergencyMaintenanceAPIService } from '@/app/emergency-maintenance/services/emergency-maintenance-api.service';
import { EEmergencyButtonAction } from '@/app/emergency-maintenance/utils/emergencyType';
import { ConversationService } from '@/app/services/conversation.service';
import { MaintenanceRequestService } from '@/app/services/maintenance-request.service';
import { SharedService } from '@/app/services/shared.service';
import { TaskService } from '@/app/services/task.service';
import { TrudiService } from '@/app/services/trudi.service';
import { IOptionPill } from '@shared/components/dropdown-pill/dropdown-pill';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import {
  SendMaintenanceType,
  SyncMaintenanceType
} from '@shared/enum/sendMaintenance.enum';
import { TaskNameId } from '@shared/enum/task.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { FormHelper } from '@trudi-ui';
import { IMaintenanceRequest } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-request.interface';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { MaintenanceSyncPtApiService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-sync-pt-api.service';
import { MaintenanceSyncPtService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-sync-pt.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { WidgetLinkedService } from '@/app/task-detail/modules/sidebar-right/services/widget-linked.service';
import { ERequestType, truncateSentence } from '@/app/shared';

@Component({
  selector: 'maintenance-request-pt-popup',
  templateUrl: './maintenance-request-pt-popup.component.html',
  styleUrls: ['./maintenance-request-pt-popup.component.scss']
})
export class MaintenanceRequestPtPopupComponent implements OnInit, OnDestroy {
  private $destroyed: Subject<void> = new Subject<void>();
  private currentState$: IMaintenanceRequest;
  public ESyncPropertyTree = ESyncStatus;
  public EMaintenanceStatusType = SendMaintenanceType;
  public lastTimeSynced: string = null;
  public popupState: boolean = false;
  private isDataChanged: boolean = false;
  public isProcessing: boolean = false;
  public optionsSendMaintenanceStatus: IOptionPill[] = [
    {
      label: SendMaintenanceType.OPEN,
      value: SendMaintenanceType.OPEN
    },
    {
      label: SendMaintenanceType.COMPLETE,
      value: SendMaintenanceType.COMPLETE
    },
    {
      label: SendMaintenanceType.CANCELLED,
      value: SendMaintenanceType.CANCELLED
    }
  ];
  public statusValue: string;
  public isArchiveMailbox: boolean = false;
  public isSubmitted: boolean = false;
  public isConsole: boolean;
  public modalId = StepKey.propertyTree.maintainaceRequest;
  public readonly summaryMaxLength = 100;

  constructor(
    private maintenanceSyncPTService: MaintenanceSyncPtService,
    private maintenanceSyncPTAPIService: MaintenanceSyncPtApiService,
    private maintenanceService: MaintenanceRequestService,
    private emergencyMaintenanceAPIService: EmergencyMaintenanceAPIService,
    private widgetPTService: WidgetPTService,
    private trudiService: TrudiService,
    private taskService: TaskService,
    private conversationService: ConversationService,
    public stepService: StepService,
    public sharedService: SharedService,
    public inboxService: InboxService,
    private showSidebarRightService: ShowSidebarRightService,
    private preventButtonService: PreventButtonService,
    private widgetLinkedService: WidgetLinkedService
  ) {
    this.maintenanceSyncPTService.initMaintenanceForm();
  }

  get MaintenanceRequestForm(): FormGroup {
    return this.maintenanceSyncPTService.getMaintenanceForm();
  }

  get summaryControl(): AbstractControl {
    return this.MaintenanceRequestForm.get('summary');
  }

  get statusControl(): AbstractControl {
    return this.MaintenanceRequestForm.get('status');
  }

  get syncStatusControl(): AbstractControl {
    return this.MaintenanceRequestForm.get('syncStatus');
  }

  get updatedAtControl(): AbstractControl {
    return this.MaintenanceRequestForm.get('updatedAt');
  }

  get isShowStatus(): boolean {
    if (
      this.syncStatusControl.value === ESyncStatus.COMPLETED ||
      (this.syncStatusControl.value === ESyncStatus.UN_SYNC &&
        this.isDataChanged) ||
      [
        this.EMaintenanceStatusType.CANCELLED,
        this.EMaintenanceStatusType.COMPLETE
      ].includes(this.statusControl.value)
    ) {
      return true;
    }
    return false;
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.$destroyed))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));
    this.handleStatusPopup();
  }

  private patchMaintenanceForm(maintenanceRequest: IMaintenanceRequest): void {
    FormHelper.resetFormGroup(this.MaintenanceRequestForm);
    this.maintenanceSyncPTService.patchMaintenanceForm({
      status: maintenanceRequest?.status,
      syncStatus: maintenanceRequest?.syncStatus,
      summary: maintenanceRequest?.summary,
      updatedAt: maintenanceRequest?.updatedAt
    });
  }

  private setPopupStatus(status: boolean): void {
    this.popupState = status;
  }

  public onChangeStatusControl(value: string) {
    this.statusValue = value;
    this.updateMaintenanceFormSyncStatus();
  }

  public updateMaintenanceFormSyncStatus() {
    this.isDataChanged =
      ESyncStatus.COMPLETED === this.currentState$.syncStatus;
    this.maintenanceSyncPTService.patchMaintenanceForm({
      syncStatus: ESyncStatus.UN_SYNC,
      updatedAt: new Date().toString()
    });
  }

  public getBadgeType(status): string {
    switch (status) {
      case SendMaintenanceType.OPEN: {
        return 'inProgress';
      }
      case SendMaintenanceType.CANCELLED: {
        return 'error';
      }
      case SendMaintenanceType.COMPLETE: {
        return 'success';
      }
      default: {
        return 'inProgress';
      }
    }
  }

  private handleStatusPopup(): void {
    this.widgetPTService.popupWidgetState$
      .pipe(
        filter(
          (type: EPropertyTreeType) =>
            type === EPropertyTreeType.MAINTENANCE_REQUEST
        ),
        tap(() => this.setPopupStatus(true)),
        takeUntil(this.$destroyed),
        switchMap(() =>
          combineLatest([
            this.widgetPTService.getPTWidgetStateByType<IMaintenanceRequest[]>(
              PTWidgetDataField.MAINTENANCE_REQUEST
            ),
            this.widgetLinkedService.linkedAction$
          ])
        )
      )
      .subscribe(([maintenanceRequest, linkedAction]) => {
        let maintenanceSummary = '';
        if (!!linkedAction?.length) {
          const actionResponse = linkedAction[0]?.options?.response;
          const isMaintenance =
            actionResponse?.type === ERequestType.MAINTENANCE_REQUEST;
          const { request_summary, maintenance_object } =
            actionResponse?.payload?.ticket || {};
          maintenanceSummary = isMaintenance
            ? request_summary || maintenance_object || ''
            : '';
        } else {
          maintenanceSummary = '';
        }
        if (maintenanceRequest.length === 0) {
          maintenanceRequest = [
            {
              status: SendMaintenanceType.OPEN,
              syncStatus: ESyncStatus.NOT_SYNC,
              summary: truncateSentence(
                maintenanceSummary,
                this.summaryMaxLength
              )
            }
          ];
        }
        this.currentState$ = maintenanceRequest[0];
        this.patchMaintenanceForm(this.currentState$);
      });
  }

  public onChangeSummary(): void {
    if (
      [ESyncStatus.COMPLETED, ESyncStatus.FAILED].includes(
        this.currentState$.syncStatus
      )
    ) {
      this.updateMaintenanceFormSyncStatus();
    }
  }

  private buildPayload(): IMaintenanceRequest {
    return {
      summary: this.summaryControl.value.trim()
    };
  }

  public syncToPT(): void {
    this.isSubmitted = true;
    if (this.isArchiveMailbox) return;
    const currentStep = this.stepService.currentPTStep.getValue();
    if (currentStep) {
      this.stepService.socketStep = currentStep;
    } else {
      this.stepService.socketStep = null;
    }
    if (this.MaintenanceRequestForm.invalid) {
      this.MaintenanceRequestForm.markAllAsTouched();
      return;
    }
    const payload = this.buildPayload();
    this.isProcessing = true;
    if (this.syncStatusControl.value === ESyncStatus.NOT_SYNC) {
      this.createMaintenanceRequest(payload);
    }
    if (this.syncStatusControl.value === ESyncStatus.FAILED) {
      this.retryMaintenanceRequest();
    }
    if (
      [ESyncStatus.UN_SYNC, ESyncStatus.COMPLETED].includes(
        this.syncStatusControl.value
      )
    ) {
      this.updateMaintenanceRequest(payload);
    }
  }

  private createMaintenanceRequest(payload: IMaintenanceRequest): void {
    this.maintenanceSyncPTAPIService
      .syncToPT(payload)
      .pipe(
        tap(
          (result) => {
            this.widgetPTService.setPTWidgetStateByType(
              PTWidgetDataField.MAINTENANCE_REQUEST,
              'UPDATE',
              [result]
            );
            this.isProcessing = false;
          },
          () => {
            this.isProcessing = false;
          }
        ),
        takeUntil(this.$destroyed)
      )
      .subscribe((result) => {
        this.closeModel();
        this.showSidebarRightService.handleToggleSidebarRight(true);
      });
  }

  private updateMaintenanceRequest(payload: IMaintenanceRequest): void {
    if (
      SendMaintenanceType.OPEN !==
      (this.statusValue || this.statusControl.value)
    ) {
      this.conversationService.sendStatusSync.next(
        SyncMaintenanceType.INPROGRESS
      );
      const { id, agencyId } = this.taskService.currentTask$.value || {};
      this.conversationService
        .changeMaintenanceJobPT(
          id,
          this.statusValue || this.statusControl.value,
          agencyId
        )
        .pipe(map((x) => x.data))
        .subscribe((res) => {
          if (res) {
            this.sharedService.maintenanceBottom.next(false);
            this.conversationService.sendStatusSync.next(res.syncStatus);
            this.widgetPTService.setPTWidgetStateByType(
              PTWidgetDataField.MAINTENANCE_REQUEST,
              'UPDATE',
              [res]
            );
          }
          this.isProcessing = false;
        });
      this.closeModel();
      this.showSidebarRightService.handleToggleSidebarRight(true);
      return;
    }

    this.maintenanceSyncPTAPIService
      .updateSyncToPT({
        ...payload,
        action: this.widgetPTService.openPopupFrom.getValue()
      })
      .pipe(
        tap(
          (result) => {
            this.widgetPTService.setPTWidgetStateByType(
              PTWidgetDataField.MAINTENANCE_REQUEST,
              'UPDATE',
              [result]
            );
            this.isProcessing = false;
          },
          () => {
            this.isProcessing = false;
          }
        ),
        takeUntil(this.$destroyed)
      )
      .subscribe((result) => {
        this.closeModel();
        this.showSidebarRightService.handleToggleSidebarRight(true);
      });
  }

  private retryMaintenanceRequest(): void {
    this.maintenanceSyncPTAPIService
      .retrySync()
      .pipe(
        tap(
          () => {
            this.isProcessing = false;
          },
          () => {
            this.isProcessing = false;
          }
        ),
        takeUntil(this.$destroyed)
      )
      .subscribe((data) => {
        if (data && data?.syncStatus) {
          if (data?.syncStatus === ESyncStatus.COMPLETED) {
            this.maintenanceSyncPTService.handleSuccessMaintenanceCard(data);
            const taskNameId =
              this.taskService.currentTask$.value?.trudiResponse?.setting
                ?.taskNameId;
            switch (taskNameId) {
              case TaskNameId.routineMaintenance:
                this.maintenanceService
                  .changeButtonStatus(
                    this.taskService.currentTask$.value?.id,
                    ForwardButtonAction.sendJobPt,
                    0,
                    TrudiButtonEnumStatus.COMPLETED
                  )
                  .subscribe((res) => {
                    this.maintenanceService.maintenanceRequestResponse.next(
                      res
                    );
                  });
                break;
              case TaskNameId.emergencyMaintenance:
                this.emergencyMaintenanceAPIService
                  .updateButtonStatus(
                    this.taskService.currentTask$.value?.id,
                    EEmergencyButtonAction.createJobInPT,
                    TrudiButtonEnumStatus.COMPLETED
                  )
                  .subscribe((res) => {
                    this.trudiService.updateTrudiResponse = res;
                  });
                break;
            }
          }
        }
      });
  }

  public closeModel(): void {
    this.isSubmitted = false;
    this.patchMaintenanceForm(this.currentState$);
    this.setPopupStatus(false);
    this.statusValue = '';
    this.widgetPTService.setPopupWidgetState(null);
    this.widgetPTService.openPopupFrom.next(null);
    this.preventButtonService.deleteProcess(
      EButtonStepKey.MAINTENANCE_REQUEST,
      EButtonType.STEP
    );
  }

  ngOnDestroy() {
    this.stepService.setCurrentPTStep(null);
    this.$destroyed.next();
    this.$destroyed.complete();
  }
}
