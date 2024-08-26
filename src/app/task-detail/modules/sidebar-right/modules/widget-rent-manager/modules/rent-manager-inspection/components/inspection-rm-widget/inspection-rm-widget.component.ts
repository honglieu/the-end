import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  filter
} from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { DEBOUNCE_SOCKET_TIME } from '@/app/dashboard/utils/constants';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import {
  IRentManagerInspection,
  ISyncRmInspection
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/interfaces/rent-manager-inspection.interface';
import { RentManagerInspectionApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/services/rent-manager-inspection-api.service';
import { RentManagerInspectionFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/services/rent-manager-inspection-form.service';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

@Component({
  selector: 'inspection-rm-widget',
  templateUrl: './inspection-rm-widget.component.html',
  styleUrls: ['./inspection-rm-widget.component.scss']
})
export class InspectionRmWidgetComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject<void>();
  public rmInspection = [];
  constructor(
    private toastService: ToastrService,
    private stepService: StepService,
    private trudiService: TrudiService,
    private widgetRMService: WidgetRMService,
    private agencyService: AgencyService,
    private rentManagerInspectionFormService: RentManagerInspectionFormService,
    private rentMangerInspectionApiService: RentManagerInspectionApiService,
    private rxWebsocketService: RxWebsocketService,
    private eventCalendarService: EventCalendarService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.subscribeSocketRmInspection();

    this.widgetRMService
      .getRMWidgetStateByType(RMWidgetDataField.RM_INSPECTIONS)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          this.rmInspection = res.sort((a, b) => {
            try {
              const timeA = new Date(a.createdAt);
              const timeB = new Date(b.createdAt);
              return timeB.getTime() - timeA.getTime();
            } catch {
              return 0;
            }
          });
        }
      });
  }

  handleClickRmInspection(data: IRentManagerInspection) {
    this.rentManagerInspectionFormService.setSyncStatusInspectionPopup({
      syncStatus: data.syncStatus,
      syncDate: data.syncDate
    });
    this.rentManagerInspectionFormService.initData(data).buildForm();
    this.widgetRMService.setPopupWidgetState(ERentManagerType.INSPECTION);
    this.rentManagerInspectionFormService.isSyncing =
      data.syncStatus === ESyncStatus.INPROGRESS;
  }

  handleRetrySyncRmInspection(data: IRentManagerInspection) {
    const updateRmInspection = this.widgetRMService.rmInspections.value.map(
      (inspection) => {
        if (inspection.id === data.id) {
          return {
            ...inspection,
            syncStatus: ESyncStatus.INPROGRESS,
            syncDate: new Date()
          };
        }
        return inspection;
      }
    );
    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.RM_INSPECTIONS,
      'UPDATE',
      updateRmInspection
    );
    const body: ISyncRmInspection = {
      ...data,
      agencyId: this.taskService.currentTask$.value?.agencyId,
      concurrencyId: data?.concurrencyId,
      inspectionTypeID: data?.inspectionType?.id,
      inspectionStatusID: data?.inspectionStatus?.id
    };

    this.rentMangerInspectionApiService.syncRmInspection(body).subscribe({
      next: (res) => {
        const updateRmInspection = this.widgetRMService.rmInspections.value.map(
          (data) => {
            if (res.id === data.id) {
              res.syncState = 'UPDATE';
              return {
                ...res
              };
            }
            return data;
          }
        );
        this.widgetRMService.setRMWidgetStateByType(
          RMWidgetDataField.RM_INSPECTIONS,
          'UPDATE',
          updateRmInspection
        );
        if (res.syncStatus === ESyncStatus.FAILED && res?.errorMessSync) {
          this.toastService.error(res.errorMessSync);
        }
      },
      error: (error) => {
        const errMsg = error?.error?.message || error?.message;
        this.toastService.error(errMsg);
      }
    });
  }

  handleRemoveRmInspection(data: IRentManagerInspection) {
    this.rentMangerInspectionApiService
      .deleteSyncInspection(data.id, data.taskId)
      .subscribe({
        next: (res) => {
          if (!data?.concurrencyId) {
            const updateRmInspection =
              this.widgetRMService.rmInspections.value.filter(
                (inspection) => inspection?.id !== data?.id
              );
            this.widgetRMService.setRMWidgetStateByType(
              RMWidgetDataField.RM_INSPECTIONS,
              'UPDATE',
              updateRmInspection
            );
          }
        },
        error: (error) => {
          const errMsg = error?.error?.message || error?.message;
          this.toastService.error(errMsg);
        }
      });
  }

  handleCancelRmIssue(data: IRentManagerInspection) {
    const updateRmInspection = this.widgetRMService.rmInspections.value.map(
      (inspection) => {
        if (inspection.id === data?.id) {
          return {
            ...data,
            syncDate: new Date(),
            syncStatus: ESyncStatus.INPROGRESS
          };
        }
        return inspection;
      }
    );
    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.RM_INSPECTIONS,
      'UPDATE',
      updateRmInspection
    );
    this.rentMangerInspectionApiService
      .deleteSyncInspection(data.id, data.taskId)
      .subscribe({
        next: (res) => {
          if (data?.externalInspectionId) {
            const updateRmInspection =
              this.widgetRMService.rmInspections.value.map((inspection) => {
                if (inspection.id === res?.id) {
                  return {
                    ...res
                  };
                }
                return inspection;
              });
            this.widgetRMService.setRMWidgetStateByType(
              RMWidgetDataField.RM_INSPECTIONS,
              'UPDATE',
              updateRmInspection
            );
            if (res?.syncStatus === ESyncStatus.FAILED && res?.errorMessSync) {
              this.toastService.error(res?.errorMessSync);
            }
          }
        },
        error: (error) => {
          const errMsg = error?.error?.message || error?.message;
          this.toastService.error(errMsg);
        }
      });
  }

  private updateStepStatus(inspectionRes: IRentManagerInspection) {
    // Mark the step complete if the widget was opened from a step
    const trudiResponseTemplate =
      this.trudiService.getTrudiResponse?.getValue();
    if (
      inspectionRes?.stepId &&
      trudiResponseTemplate?.isTemplate &&
      inspectionRes.syncStatus === ESyncStatus.COMPLETED
    ) {
      this.stepService
        .updateStep(
          inspectionRes.taskId,
          inspectionRes.stepId,
          null,
          TrudiButtonEnumStatus.COMPLETED,
          ECRMSystem.RENT_MANAGER,
          ERentManagerType.INSPECTION
        )
        .subscribe((data) => {
          this.stepService.updateTrudiResponse(data, EActionType.UPDATE_RM);
          this.stepService.setChangeBtnStatusFromRMWidget(false);
        });
    }
  }

  private subscribeSocketRmInspection() {
    this.rxWebsocketService.onSocketSyncRmInspection
      .pipe(
        takeUntil(this.unsubscribe),
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
      .subscribe({
        next: (res) => {
          const { data } = res || {};
          const updateRmInspection =
            this.widgetRMService.rmInspections.value.map((value) => {
              if (data?.id === value?.id) {
                data.syncState = 'UPDATE';
                return {
                  ...data
                };
              }
              return value;
            });
          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.RM_INSPECTIONS,
            'UPDATE',
            updateRmInspection
          );

          if (data.syncStatus === ESyncStatus.FAILED && data?.errorMessSync) {
            this.toastService.error(data.errorMessSync);
          }
          this.updateStepStatus(data);
          this.eventCalendarService.onRefreshListCalendarEvent();
        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
