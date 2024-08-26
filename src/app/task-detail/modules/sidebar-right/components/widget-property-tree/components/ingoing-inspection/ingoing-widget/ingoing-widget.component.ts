import { Component, Input, OnDestroy } from '@angular/core';
import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import {
  EInspectionStatus,
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { IngoingInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/ingoing-inspection.service';
import { AgencyService } from '@services/agency.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { Subject, takeUntil } from 'rxjs';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { TaskService } from '@services/task.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiService } from '@services/trudi.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { ETypeNotesPropertyTreeWidget } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/notes/type-notes-property-tree-widget.enum';
import { EButtonStepKey } from '@trudi-ui';

@Component({
  selector: 'ingoing-widget',
  templateUrl: './ingoing-widget.component.html',
  styleUrls: ['./ingoing-widget.component.scss']
})
export class IngoingWidgetComponent implements OnDestroy {
  @Input() ingoingInspection: InspectionSyncData;
  public typePropertyTree = EPropertyTreeType;
  private unsubscribe = new Subject<void>();
  readonly syncPropertyTree = ESyncStatus;
  public statusPropertyTree = EInspectionStatus;
  public readonly eTypeNote = ETypeNotesPropertyTreeWidget;
  readonly EButtonStepKey = EButtonStepKey;

  constructor(
    public ingoingInspectionSyncService: IngoingInspectionSyncService,
    public widgetPTService: WidgetPTService,
    public calendarEventWidgetService: EventCalendarService,
    public taskService: TaskService,
    public stepService: StepService,
    public trudiService: TrudiService,
    public trudiDynamicParamater: TrudiDynamicParameterService
  ) {}

  handleEdit(item) {
    this.ingoingInspectionSyncService.isSyncIngoingInSpection.next(true);
    this.ingoingInspectionSyncService.setSelectedIngoingInspection(item);
    this.widgetPTService.setPopupWidgetState(
      this.typePropertyTree.INGOING_INSPECTION
    );
  }

  handleRetry(item) {
    const currentStep = this.stepService.currentPTStep.getValue();
    item.syncStatus = ESyncStatus.INPROGRESS;
    this.ingoingInspectionSyncService.updateListIngoingInspection(
      item,
      item.id
    );
    const payload = {
      inspectionId: item.id,
      stepId: item?.stepId,
      agencyId: this.taskService.currentTask$.value?.agencyId
    };
    this.ingoingInspectionSyncService
      .reTrySyncIngoingInspection(payload)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.ingoingInspectionSyncService.updateListIngoingInspection(
          {
            ...res.inspection,
            firstTimeSyncSuccess:
              res.inspection.syncStatus !== this.syncPropertyTree.FAILED
          },
          item.id
        );
        if (
          this.ingoingInspectionSyncService.isSyncIngoingInSpection.getValue() &&
          this.ingoingInspectionSyncService.selectedIngoingInspections$.getValue()
            ?.id === res.inspection?.id
        ) {
          this.ingoingInspectionSyncService.setSelectedIngoingInspection(
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
              res?.inspection?.stepId,
              EPropertyTreeButtonComponent.INGOING_INSPECTION,
              EButtonAction.PT_NEW_COMPONENT,
              res?.inspection?.id
            );
          } else {
            this.ingoingInspectionSyncService.updateStatusBtn();
          }
        }
      });
  }

  handleRemove(item) {
    const selectedDeleteId = item.id;
    this.ingoingInspectionSyncService
      .removeIngoingInspection(selectedDeleteId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.ingoingInspectionSyncService.updateListIngoingInspection(
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
