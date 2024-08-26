import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import {
  EInspectionStatus,
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { OutgoingInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/outgoing-inspection.service';
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
  selector: 'outgoing-widget',
  templateUrl: './outgoing-widget.component.html',
  styleUrls: ['./outgoing-widget.component.scss']
})
export class OutgoingWidgetComponent implements OnDestroy {
  @Input() outgoingInspection: InspectionSyncData;
  public typePropertyTree = EPropertyTreeType;
  private unsubscribe = new Subject<void>();
  readonly syncPropertyTree = ESyncStatus;
  public statusPropertyTree = EInspectionStatus;
  public readonly eTypeNote = ETypeNotesPropertyTreeWidget;
  readonly EButtonStepKey = EButtonStepKey;

  constructor(
    private agencyService: AgencyService,
    public outgoingInspectionSyncService: OutgoingInspectionSyncService,
    public widgetPTService: WidgetPTService,
    public calendarEventWidgetService: EventCalendarService,
    public taskService: TaskService,
    public stepService: StepService,
    public trudiService: TrudiService,
    public trudiDynamicParamater: TrudiDynamicParameterService
  ) {}

  handleEdit(item) {
    this.outgoingInspectionSyncService.isSyncOutgoingInSpection.next(true);
    this.outgoingInspectionSyncService.setSelectedOutgoingInspection(item);
    this.widgetPTService.setPopupWidgetState(
      this.typePropertyTree.OUTGOING_INSPECTION
    );
  }

  handleRetry(item) {
    const currentStep = this.stepService.currentPTStep.getValue();
    item.syncStatus = ESyncStatus.INPROGRESS;
    this.outgoingInspectionSyncService.updateListOutgoingInspection(
      item,
      item.id
    );
    const payload = {
      inspectionId: item.id,
      stepId: item?.stepId,
      agencyId: this.taskService.currentTask$.value.agencyId
    };
    this.outgoingInspectionSyncService
      .reTrySyncOutgoingInspection(payload)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.outgoingInspectionSyncService.updateListOutgoingInspection(
          {
            ...res.inspection,
            firstTimeSyncSuccess:
              res.inspection.syncStatus !== this.syncPropertyTree.FAILED
          },
          item.id
        );
        if (
          this.outgoingInspectionSyncService.isSyncOutgoingInSpection.getValue() &&
          this.outgoingInspectionSyncService.selectedOutgoingInspections$.getValue()
            ?.id === res.inspection?.id
        ) {
          this.outgoingInspectionSyncService.setSelectedOutgoingInspection(
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
              EPropertyTreeButtonComponent.OUTGOING_INSPECTION,
              EButtonAction.PT_NEW_COMPONENT
            );
          } else {
            this.outgoingInspectionSyncService.updateStatusBtn();
          }
        }
      });
  }

  handleRemove(item) {
    const selectedDeleteId = item.id;
    this.outgoingInspectionSyncService
      .removeOutgoingInspection(selectedDeleteId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.outgoingInspectionSyncService.updateListOutgoingInspection(
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
