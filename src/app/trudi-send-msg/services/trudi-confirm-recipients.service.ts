import { ITaskInfoToGetDataPrefill } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import {
  IContactInfoPrefill,
  ISelectedReceivers
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable()
export class TrudiConfirmRecipientService {
  public listContactGroup: FormArray;
  public triggerRemoveConfirmRecipient$ = new Subject<
    ISelectedReceivers | ISelectedReceivers[]
  >();
  private isTaskLoading = new BehaviorSubject(false);
  private isContactLoading = new BehaviorSubject(false);
  public isTaskLoading$ = this.isTaskLoading.asObservable();
  public isContactLoading$ = this.isContactLoading.asObservable();
  constructor(private formBuilder: FormBuilder) {}

  public buildFormArray(
    taskProperties:
      | ITaskInfoToGetDataPrefill[]
      | IContactInfoPrefill[]
      | (ITaskInfoToGetDataPrefill & IContactInfoPrefill)[]
  ) {
    this.listContactGroup = this.formBuilder.array(
      taskProperties.map((task) => {
        return this.formBuilder.group({
          taskId: task.taskId,
          propertyId: task.propertyId,
          streetLine: task.streetLine,
          recipients: new FormControl([])
        });
      })
    );
  }

  get contactFormArray() {
    return this.listContactGroup;
  }

  setTaskLoading(value: boolean) {
    this.isTaskLoading.next(value);
  }

  setContactLoading(value: boolean) {
    this.isContactLoading.next(value);
  }
}
