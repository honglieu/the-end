import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { EButtonAction } from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { IPropertyTreeStepForm } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/property-tree-step/property-tree-step-form/property-tree-step-form.component';
import { IPropertyTreeStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { TreeNodeOptions } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';

@Injectable({
  providedIn: 'root'
})
export class PropertyTreeStepFormService {
  public ptStepForm: FormGroup;
  public initialValue: BehaviorSubject<IPropertyTreeStep> = new BehaviorSubject(
    null
  );
  public initialValue$ = this.initialValue.asObservable();

  defaultData: IPropertyTreeStepForm = {
    stepName: null,
    actionType: EButtonAction.PT_NEW_COMPONENT,
    componentType: null,
    isRequired: true
  };

  constructor(private formBuilder: FormBuilder) {}

  resetForm() {
    this.ptStepForm.markAsPristine();
    this.ptStepForm.markAsUntouched();
    this.ptStepForm.reset(this.defaultData);
    this.resetField('stepName');

    this.initialValue.next(null);
  }

  resetField(field: keyof IPropertyTreeStepForm) {
    this.ptStepForm.get(field).reset(this.defaultData[field]);
    this.ptStepForm.get(field).markAsPristine();
    this.ptStepForm.get(field).markAsUntouched();
  }

  buildForm(data?: TreeNodeOptions) {
    if (!data) {
      this.ptStepForm = this.formBuilder.group({
        stepName: new FormControl(null, Validators.required),
        actionType: new FormControl(
          EButtonAction.PT_NEW_COMPONENT,
          Validators.required
        ),
        componentType: new FormControl(null, Validators.required),
        isRequired: new FormControl(true)
      });
    } else {
      const step = data as IPropertyTreeStep;
      this.ptStepForm = this.formBuilder.group({
        stepName: new FormControl(step.title, Validators.required),
        actionType: new FormControl(step.action, Validators.required),
        componentType: new FormControl(step.componentType, Validators.required),
        isRequired: new FormControl(step.isRequired)
      });
    }
  }

  setInitialValue(data: TreeNodeOptions) {
    const step = data as IPropertyTreeStep;
    this.initialValue.next(step);
  }
}
