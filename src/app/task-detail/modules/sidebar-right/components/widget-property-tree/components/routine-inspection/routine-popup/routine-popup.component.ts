import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PropertiesService } from '@services/properties.service';
import { RoutineInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/routine-inspection.service';
import { PreventButtonService } from '@trudi-ui';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';

@Component({
  selector: 'routine-popup',
  templateUrl: './routine-popup.component.html',
  styleUrls: ['./routine-popup.component.scss']
})
export class RoutinePopupComponent implements OnInit, OnDestroy {
  public popupState = {
    showSelectTypePopup: false,
    showRoutineFormPopup: false
  };
  private unsubscribe = new Subject<void>();
  public modalId: string = StepKey.propertyTree.routineInspection;
  public buttonKey = EButtonStepKey.ROUTINE_INSPECTION;
  constructor(
    public widgetPTService: WidgetPTService,
    public propertyService: PropertiesService,
    public routineInspectionSyncService: RoutineInspectionSyncService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.routineInspectionSyncService
      .getSelectedRoutineInspection()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((inspection) => {
        if (inspection?.id) {
          this.handleNextModal();
        } else {
          this.handleBackModal();
        }
      });
  }

  handleCloseModal() {
    this.widgetPTService.setPopupWidgetState(null);
    this.routineInspectionSyncService.setSelectedRoutineInspection(null);
    this.resetPopupState();
    this.preventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }

  handleNextModal() {
    this.handlePopupState({
      showRoutineFormPopup: true,
      showSelectTypePopup: false
    });
  }

  handleBackModal() {
    this.handlePopupState({
      showRoutineFormPopup: false,
      showSelectTypePopup: true
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  resetPopupState() {
    for (const key in this.popupState) {
      if (Object.prototype.hasOwnProperty.call(this.popupState, key)) {
        this.popupState[key] = false;
      }
    }
  }
}
