import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import { TenantOptionsStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-options-state.service';
import { TenantFormBase } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-base';
import { TenantNameForm } from './tenant-info-form';

@Component({
  selector: 'info-form',
  templateUrl: './info-form.component.html',
  styleUrls: ['./info-form.component.scss']
})
export class InfoFormComponent extends TenantFormBase<TenantNameForm> {
  @Input() checkSubmit: boolean = true;
  public tabs;
  public currentTab;
  public optionList;

  get controls() {
    return this.form.controls;
  }
  get getForm() {
    return this.form;
  }

  get addressesForm() {
    return this.form.get('address') as FormArray;
  }

  get addressesControls() {
    return this.addressesForm.controls;
  }

  get nameForm() {
    return this.form.get('name') as FormGroup;
  }
  constructor(
    private formBuilder: FormBuilder,
    private tenantOptionsStateService: TenantOptionsStateService
  ) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  handleBlurCheckAllWhitespace(field: AbstractControl) {
    const value = field?.value;
    if (value && !value?.trim()) {
      field?.setValue('');
    }
  }

  onSelectDefault(index) {
    if (this.addressesForm.at(index).get('isPrimary').value) {
      this.addressesForm.controls.forEach((control, i) => {
        if (i !== index) {
          control.get('isPrimary').setValue(false);
        }
      });
    }
  }
}

@Pipe({ name: 'labelAddress' })
export class FormatLabelAddressPipe implements PipeTransform {
  constructor() {}
  transform(label: string): string {
    if (label) {
      return `${label} address`;
    }
    return '';
  }
}
