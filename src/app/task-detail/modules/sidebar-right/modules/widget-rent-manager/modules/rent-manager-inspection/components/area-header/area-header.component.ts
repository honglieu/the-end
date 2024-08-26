import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ShareValidators } from '@shared/validators/share-validator';
import { RentManagerInspectionFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/services/rent-manager-inspection-form.service';
import { TrudiTextFieldComponent } from '@trudi-ui';
enum EOption {
  EDIT = 'edit',
  DELETE = 'delete'
}
@Component({
  selector: 'area-header',
  templateUrl: './area-header.component.html',
  styleUrls: ['./area-header.component.scss']
})
export class AreaHeaderComponent implements OnInit {
  @ViewChild('trudiTextField') areaNameInputEl: TrudiTextFieldComponent;
  @Input() inspectionArea: FormGroup;
  @Input() areasIdx: number = 0;
  @Input() isDisabled: boolean = false;
  public isEdittingAreaName: boolean = false;
  public areaNameControl = new FormControl(null, [
    Validators.required,
    ShareValidators.trimValidator
  ]);
  public optionsList = [
    {
      text: 'Edit area name',
      type: EOption.EDIT
    },
    {
      text: 'Delete area',
      type: EOption.DELETE
    }
  ];
  public EOption = EOption;
  constructor(
    private rentManagerInspectionFormService: RentManagerInspectionFormService
  ) {}

  ngOnInit(): void {
    this.areaNameControl.setValue(this.inspectionArea.value.name, {
      emitEvent: false
    });
    if (!this.isSyncedToRm()) {
      this.handleEditTaskName();
    }
  }

  public isSyncedToRm() {
    return this.inspectionArea.get('externalId').value;
  }

  handleEditTaskName() {
    if (this.isDisabled) return;
    this.isEdittingAreaName = !this.isEdittingAreaName;
    this.handleFocus();
  }

  public handleBlurAreaName() {
    this.isEdittingAreaName = false;
    if (this.areaNameControl.invalid) {
      if (this.isSyncedToRm()) {
        this.areaNameControl.setValue(this.inspectionArea.value.name);
      } else {
        this.rentManagerInspectionFormService.deleteAreas(this.areasIdx);
      }
      return;
    }
    this.inspectionArea.get('name').setValue(this.areaNameControl.value);
  }

  public handleFocus() {
    setTimeout(() => {
      this.areaNameInputEl.inputElem.nativeElement.focus();
    }, 0);
  }

  public handleOption(type: EOption) {
    if (type === EOption.DELETE) {
      if (this.isSyncedToRm()) return;
      this.rentManagerInspectionFormService.deleteAreas(this.areasIdx);
    } else {
      this.handleEditTaskName();
    }
  }
}
