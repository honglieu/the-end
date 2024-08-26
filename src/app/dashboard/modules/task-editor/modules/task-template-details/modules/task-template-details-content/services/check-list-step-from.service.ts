import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ShareValidators } from '@shared/validators/share-validator';
import { ICheckListStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';

@Injectable({
  providedIn: 'root'
})
export class CheckListStepFromService {
  private checkListStepFrom: FormGroup;
  private currentStepData: BehaviorSubject<ICheckListStep> =
    new BehaviorSubject(null);
  public currentStepData$ = this.currentStepData.asObservable();
  constructor(private formBuilder: FormBuilder) {}

  private validators = [
    Validators.required,
    ShareValidators.trimValidator,
    Validators.maxLength(100)
  ];

  public buildForm(data?: ICheckListStep) {
    let currentStepData = this.currentStepData.getValue();

    if (currentStepData) {
      this.checkListStepFrom = this.formBuilder.group({
        stepName: [currentStepData?.title, this.validators],
        stepContent: ['']
      });
    } else {
      if (data) {
        this.checkListStepFrom = this.formBuilder.group({
          stepName: [data?.title, this.validators],
          stepContent: [data?.fields?.stepContent]
        });
      } else {
        this.checkListStepFrom = this.formBuilder.group({
          stepName: [null, this.validators],
          stepContent: ['']
        });
      }
    }
    return this.checkListStepFrom;
  }

  public setCurrentStepData(data: ICheckListStep) {
    this.currentStepData.next(data);
  }

  get checkListFrom() {
    return this.checkListStepFrom;
  }
}
