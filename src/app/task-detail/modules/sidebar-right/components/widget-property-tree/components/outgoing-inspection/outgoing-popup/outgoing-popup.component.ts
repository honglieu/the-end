import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PropertiesService } from '@services/properties.service';
import { OutgoingInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/outgoing-inspection.service';
import {
  InspectionSyncData,
  RoutineInspectionData
} from '@shared/types/routine-inspection.interface';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';

@Component({
  selector: 'outgoing-popup',
  templateUrl: './outgoing-popup.component.html',
  styleUrls: ['./outgoing-popup.component.scss']
})
export class OutgoingPopupComponent implements OnInit, OnDestroy {
  public popupState = {
    showSelectInspectionPopup: false,
    showOutgoingFormPopup: false
  };

  private unsubscribe = new Subject<void>();
  public modalId: string = StepKey.propertyTree.outgoingInspection;
  public buttonKey = EButtonStepKey.OUTGOING_INSPECTION;
  constructor(
    public outgoingInspectionSyncService: OutgoingInspectionSyncService,
    public widgetPTService: WidgetPTService,
    public propertyService: PropertiesService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.outgoingInspectionSyncService
      .getSelectedOutgoingInspection()
      .subscribe((inspection: InspectionSyncData | RoutineInspectionData) => {
        if (inspection?.id) {
          this.handlePopupState({ showOutgoingFormPopup: true });
        } else {
          this.handlePopupState({ showSelectInspectionPopup: true });
        }
      });
  }

  handleCloseModal() {
    this.widgetPTService.setPopupWidgetState(null);
    this.outgoingInspectionSyncService.setSelectedOutgoingInspection(null);
    this.resetPopupState();
    this.preventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }

  handleNextModal() {
    this.handlePopupState({
      showOutgoingFormPopup: true,
      showSelectInspectionPopup: false
    });
  }

  handleBackModal() {
    this.handlePopupState({
      showOutgoingFormPopup: false,
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
