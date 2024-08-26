import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { isEqual } from 'lodash-es';
import {
  IRentManagerNote,
  ISelectCreateNoteByType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/interfaces/rent-manager-notes.interface';
import { BehaviorSubject } from 'rxjs';
import { cloneDeep } from 'lodash-es';
import { ERentManagerNotesType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

@Injectable()
export class RentManagerNotesFormService {
  private originalFormValue;
  private rentManagerNotesForm;
  public selectNoteRequestForm: FormGroup;
  private selectedNoteRequestForm: ISelectCreateNoteByType = null;
  public selectedRentManagerNote: IRentManagerNote = null;
  private syncStatusBS = new BehaviorSubject({
    syncStatus: ESyncStatus.NOT_SYNC,
    syncDate: new Date()
  });
  public syncStatus$ = this.syncStatusBS.asObservable();

  public getSyncStatus() {
    return this.syncStatusBS.value;
  }

  constructor(private formBuilder: FormBuilder) {}

  public getValues() {
    const payload = this.rentManagerNotesForm.value;
    const modifiedFiles = payload.file.map((i) => {
      const { propertyIds, propertyId, isDisabled, ...otherData } = i;
      return otherData;
    });
    payload.file = modifiedFiles;
    return cloneDeep(payload);
  }

  public get isEditing(): boolean {
    return Boolean(this.selectedRentManagerNote);
  }

  public get form() {
    return this.rentManagerNotesForm;
  }

  public get formSelectNoteRequest() {
    return this.selectNoteRequestForm;
  }

  public get disabled() {
    return this.selectedRentManagerNote?.syncStatus === ESyncStatus.INPROGRESS;
  }

  public initData(data) {
    this.selectedRentManagerNote = data;
    return this;
  }

  public initDataSelectNoteRequestForm(data) {
    this.selectedNoteRequestForm = data;
    return this;
  }

  public setSelectRMIssue(value: IRentManagerNote) {
    this.selectedRentManagerNote = value;
  }
  public setSyncStatusBS(value) {
    this.syncStatusBS.next({
      ...this.syncStatusBS.value,
      ...value
    });
  }

  public getSelectRMNote() {
    return this.selectedRentManagerNote;
  }

  public buildForm() {
    const data = this.selectedRentManagerNote || ({} as IRentManagerNote);
    let noteFiles =
      data?.file?.map((item) => {
        if (item?.fileId) {
          item['isDisabled'] = true;
        }
        return item;
      }) || [];
    this.rentManagerNotesForm = this.formBuilder.group({
      entityType: new FormControl(data.entityType, [Validators.required]),
      categoryId: new FormControl(data.categoryId, [Validators.required]),
      entityId: new FormControl(data.entityId, [Validators.required]),
      description: new FormControl(data.description, [Validators.required]),
      file: this.formBuilder.array(noteFiles),
      externalId: new FormControl(data?.externalId || null)
    });
    if (this.disabled) {
      this.rentManagerNotesForm.disable();
    }
  }
  public buildSelectNoteRequestForm() {
    const data =
      this.selectedNoteRequestForm || ({} as ISelectCreateNoteByType);
    this.selectNoteRequestForm = this.formBuilder.group({
      createNoteType: new FormControl(
        data.createNoteType || ERentManagerNotesType.CREATE_NEW,
        [Validators.required]
      ),
      existNote: new FormControl(data.existNote || null, [Validators.required])
    });
    return this.selectNoteRequestForm;
  }
  public clear() {
    this.syncStatusBS.next({
      syncStatus: ESyncStatus.NOT_SYNC,
      syncDate: new Date()
    });
    this.rentManagerNotesForm = null;
    this.selectedRentManagerNote = null;
    this.selectNoteRequestForm = null;
  }

  public isFormChanged() {
    const isChanged = !isEqual(this.originalFormValue, this.getValues());
    return isChanged;
  }
}
