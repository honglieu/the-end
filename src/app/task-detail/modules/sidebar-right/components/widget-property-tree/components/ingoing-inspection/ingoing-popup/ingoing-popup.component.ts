import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PropertiesService } from '@services/properties.service';
import { IngoingInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/ingoing-inspection.service';
import {
  InspectionSyncData,
  RoutineInspectionData
} from '@shared/types/routine-inspection.interface';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';

@Component({
  selector: 'ingoing-popup',
  templateUrl: './ingoing-popup.component.html',
  styleUrls: ['./ingoing-popup.component.scss']
})
export class IngoingPopupComponent implements OnInit {
  public popupState = {
    showSelectInspectionPopup: false,
    showIngoingFormPopup: false
  };

  public modalId: string = StepKey.propertyTree.ingoingInspection;
  public buttonKey = EButtonStepKey.INGOING_INSPECTION;
  private unsubscribe = new Subject<void>();
  constructor(
    public ingoingInspectionSyncService: IngoingInspectionSyncService,
    public widgetPTService: WidgetPTService,
    public propertyService: PropertiesService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.ingoingInspectionSyncService
      .getSelectedIngoingInspection()
      .subscribe((inspection: InspectionSyncData | RoutineInspectionData) => {
        if (inspection?.id) {
          this.handlePopupState({ showIngoingFormPopup: true });
        } else {
          this.handlePopupState({ showSelectInspectionPopup: true });
        }
      });
  }

  handleCloseModal() {
    this.widgetPTService.setPopupWidgetState(null);
    this.ingoingInspectionSyncService.setSelectedIngoingInspection(null);
    this.resetPopupState();
    this.preventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }

  handleNextModal() {
    this.handlePopupState({
      showIngoingFormPopup: true,
      showSelectInspectionPopup: false
    });
  }

  handleBackModal() {
    this.handlePopupState({
      showIngoingFormPopup: false,
      showSelectInspectionPopup: true
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
