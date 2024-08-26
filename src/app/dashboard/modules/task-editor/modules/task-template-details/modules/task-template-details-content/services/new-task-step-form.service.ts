import { Injectable } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators
} from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { INewTaskStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { TreeNodeOptions } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import { INewTaskStepForm } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/new-task-step/new-task-step-form/new-task-step-form.component';

@Injectable({
  providedIn: 'root'
})
export class NewTaskStepFormService {
  public newTaskStepForm: FormGroup;
  public initialValue: BehaviorSubject<INewTaskStep> = new BehaviorSubject(
    null
  );
  public initialValue$ = this.initialValue.asObservable();

  defaultData: INewTaskStepForm = {
    stepName: null,
    newTaskTemplateId: null
  };

  constructor(private formBuilder: FormBuilder) {}

  resetForm() {
    this.newTaskStepForm.markAsPristine();
    this.newTaskStepForm.markAsUntouched();
    this.newTaskStepForm.reset(this.defaultData);
    this.resetField('stepName');

    this.initialValue.next(null);
  }

  resetField(field: keyof INewTaskStepForm) {
    this.newTaskStepForm.get(field).reset(this.defaultData[field]);
    this.newTaskStepForm.get(field).markAsPristine();
    this.newTaskStepForm.get(field).markAsUntouched();
  }

  buildForm(data?: TreeNodeOptions) {
    if (!data) {
      this.newTaskStepForm = this.formBuilder.group({
        stepName: new FormControl(null, Validators.required),
        newTaskTemplateId: new FormControl(null)
      });
    } else {
      const step = data as INewTaskStep;
      this.newTaskStepForm = this.formBuilder.group({
        key: new FormControl(step.key),
        stepName: new FormControl(step.title, Validators.required),
        type: new FormControl(step.type),
        newTaskTemplateId: new FormControl(step.newTaskTemplateId)
      });
    }
  }

  setInitialValue(data: TreeNodeOptions) {
    const step = data as INewTaskStep;
    this.initialValue.next(step);
  }
}
