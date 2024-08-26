import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { EInspectionStatus } from '@/app/task-detail/utils/functions';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'inspection-popup-title',
  templateUrl: './inspection-popup-title.component.html',
  styleUrl: './inspection-popup-title.component.scss'
})
export class InspectionPopupTitleComponent implements OnInit {
  @Input() status: EInspectionStatus;
  @Input() inspectionData: InspectionSyncData;
  @Input() disabled: boolean = false;
  @Output() closeInspection: EventEmitter<boolean> = new EventEmitter();
  @Output() cancelInspection: EventEmitter<void> = new EventEmitter();
  public EInspectionStatus = EInspectionStatus;
  public visibleDropdown: boolean = false;
  public defaultChargeFee: boolean = false;

  constructor() {}
  ngOnInit(): void {
    this.defaultChargeFee = this.inspectionData?.defaultChargeFee;
  }

  handleCloseInspection(): void {
    this.visibleDropdown = false;
    this.closeInspection.emit(this.defaultChargeFee);
  }

  handleCancelInspection(): void {
    this.cancelInspection.emit();
  }

  handleResetDefaultChargeFee() {
    // reset after animation
    setTimeout(() => {
      this.defaultChargeFee = this.inspectionData?.defaultChargeFee;
    }, 300);
  }
}
