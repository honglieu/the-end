import { Component, Input, OnDestroy } from '@angular/core';
import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { RoutineInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/routine-inspection.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import {
  EInspectionStatus,
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { Subject, takeUntil } from 'rxjs';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { ETypeNotesPropertyTreeWidget } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/notes/type-notes-property-tree-widget.enum';
import { EButtonStepKey } from '@trudi-ui';

@Component({
  selector: 'routine-widget',
  templateUrl: './routine-widget.component.html',
  styleUrls: ['./routine-widget.component.scss']
})
export class RoutineWidgetComponent implements OnDestroy {
  @Input() routineInspection: InspectionSyncData;
  public typePropertyTree = EPropertyTreeType;
  public syncPropertyTree = ESyncStatus;
  private unsubscribe = new Subject<void>();
  public statusPropertyTree = EInspectionStatus;
  public readonly eTypeNote = ETypeNotesPropertyTreeWidget;
  readonly EButtonStepKey = EButtonStepKey;
  constructor(
    public routineInspectionSyncService: RoutineInspectionSyncService,
    public widgetPTService: WidgetPTService,
    public calendarEventWidgetService: EventCalendarService,
    public taskService: TaskService,
    public trudiService: TrudiService,
    public stepService: StepService,
    public trudiDynamicParamater: TrudiDynamicParameterService
  ) {}

  handleEdit(item) {
    this.routineInspectionSyncService.isSyncRoutineInSpection.next(true);
    this.routineInspectionSyncService.setSelectedRoutineInspection(item);
    this.widgetPTService.setPopupWidgetState(
      this.typePropertyTree.ROUTINE_INSPECTION
    );
  }

  handleRetry(item) {
    const currentStep = this.stepService.currentPTStep.getValue();
    item.syncStatus = ESyncStatus.INPROGRESS;
    this.routineInspectionSyncService.updateListRoutineInspection(
      item,
      item.id
    );
    this.routineInspectionSyncService
      .reTrySyncRoutineInspection({
        inspectionId: item.id,
        stepId: item?.stepId,
        agencyId: this.taskService.currentTask$.value.agencyId
      })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.routineInspectionSyncService.updateListRoutineInspection(
          {
            ...res.inspection,
            firstTimeSyncSuccess:
              res.inspection.syncStatus !== this.syncPropertyTree.FAILED
          },
          item.id
        );
        if (
          this.routineInspectionSyncService.isSyncRoutineInSpection.getValue() &&
          this.routineInspectionSyncService.selectedRoutineInspections$.getValue()
            ?.id === res.inspection?.id
        ) {
          this.routineInspectionSyncService.setSelectedRoutineInspection(
            res.inspection
          );
        }
        const trudiResponeTemplate =
          this.trudiService.getTrudiResponse?.getValue();
        if (res.inspection.syncStatus === this.syncPropertyTree.COMPLETED) {
          this.calendarEventWidgetService.refreshListEventCalendarWidget(
            this.taskService.currentTaskId$.getValue()
          );
          if (trudiResponeTemplate?.isTemplate) {
            this.stepService.updateButtonStatusTemplate(
              res.inspection?.stepId,
              EPropertyTreeButtonComponent.ROUTINE_INSPECTION,
              EButtonAction.PT_NEW_COMPONENT
            );
          } else {
            this.routineInspectionSyncService.updateStatusBtn();
          }
        }
      });
  }

  handleRemove(item) {
    const selectedDeleteId = item.id;
    this.routineInspectionSyncService
      .removeRoutineInspection(selectedDeleteId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.routineInspectionSyncService.updateListRoutineInspection(
          res.inspection?.isSuccessful ? res.inspection : null,
          selectedDeleteId
        );
      });
  }

  trackById(_index: number, item: InspectionSyncData) {
    return item.id;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
