import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreateTaskFormService {
  private taskForm: FormGroup;
  private selectedMailBoxIdBS = new BehaviorSubject(null);
  public selectedMailBoxId$ = this.selectedMailBoxIdBS.asObservable();

  constructor(private formBuilder: FormBuilder) {}

  public buildForm() {
    this.taskForm = this.formBuilder.group({
      task: new FormControl({ value: null, disabled: true }, [
        Validators.required
      ]),
      property: new FormControl(null),
      title: new FormControl(null, [Validators.required]),
      taskGroup: new FormControl(null, [Validators.required]),
      assign: new FormControl([], [Validators.required]),
      taskNameTitle: new FormControl(null, [
        Validators.required,
        Validators.pattern(/^(?!^\s+$)^[\s\S]*$/)
      ]),
      folder: new FormControl(null, [Validators.required]),
      addNewFolder: new FormControl(null),
      isRemember: new FormControl(false, [Validators.required])
    });

    return this.taskForm;
  }

  public get form() {
    return this.taskForm;
  }

  public setSelectedMailBoxId(id: string) {
    this.selectedMailBoxIdBS.next(id);
  }

  public getSelectedMailBoxId() {
    return this.selectedMailBoxIdBS.getValue();
  }

  public clear() {
    this.selectedMailBoxIdBS.next(null);
    this.taskForm = null;
  }
}
