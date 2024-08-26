import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ERentManagerAction } from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { IPropertyTreeStepForm } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/property-tree-step/property-tree-step-form/property-tree-step-form.component';
import { IRentManagerStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { TreeNodeOptions } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import { IRentManagerTreeStepForm } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/rent-manager-step/rent-manager-step-form/rent-manager-step-form.component';

@Injectable({
  providedIn: 'root'
})
export class RentManagerStepFormService {
  public rmStepForm: FormGroup;
  public initialValue: BehaviorSubject<IRentManagerStep> = new BehaviorSubject(
    null
  );
  public initialValue$ = this.initialValue.asObservable();

  defaultData: IRentManagerTreeStepForm = {
    stepName: null,
    actionType: ERentManagerAction.RM_NEW_COMPONENT,
    componentType: null,
    isRequired: true
  };

  constructor(private formBuilder: FormBuilder) {}

  resetForm() {
    this.rmStepForm.markAsPristine();
    this.rmStepForm.markAsUntouched();
    this.rmStepForm.reset(this.defaultData);
    this.resetField('stepName');

    this.initialValue.next(null);
  }

  resetField(field: keyof IPropertyTreeStepForm) {
    this.rmStepForm.get(field).reset(this.defaultData[field]);
    this.rmStepForm.get(field).markAsPristine();
    this.rmStepForm.get(field).markAsUntouched();
  }

  buildForm() {
    this.rmStepForm = this.formBuilder.group({
      stepName: new FormControl(null, Validators.required),
      actionType: new FormControl(
        ERentManagerAction.RM_NEW_COMPONENT,
        Validators.required
      ),
      componentType: new FormControl(null, Validators.required),
      isRequired: new FormControl(true)
    });
  }

  setInitialValue(data: TreeNodeOptions) {
    const step = data as IRentManagerStep;
    this.initialValue.next(step);

    this.rmStepForm.patchValue({
      stepName: step.title,
      actionType: step.action,
      componentType: step.componentType,
      isRequired: step.isRequired
    });
  }
}
