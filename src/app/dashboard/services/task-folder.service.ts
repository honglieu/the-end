import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITaskFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { ShareValidators } from '@shared/validators/share-validator';

@Injectable({
  providedIn: 'root'
})
export class TaskFolderService {
  private taskFolderForm: FormGroup;
  private selectedTaskFolder = new BehaviorSubject<ITaskFolder>(null);
  constructor(private fb: FormBuilder) {}

  // NOTE: build form and prefill data
  public initFolderForm(prefillData?: ITaskFolder) {
    this.taskFolderForm = this.fb.group({
      name: [
        prefillData?.name ?? null,
        [Validators.required, ShareValidators.trimValidator]
      ],
      icon: [null],
      labelId: [prefillData?.labelId ?? null]
    });
  }

  get selectedTaskFolderBS() {
    return this.selectedTaskFolder.asObservable();
  }

  setSelectedTaskFolder(value: ITaskFolder) {
    this.selectedTaskFolder.next(value);
  }

  get form() {
    return this.taskFolderForm;
  }
}
