import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subject, of, switchMap, takeUntil } from 'rxjs';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { WidgetNoteService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-note.service';
import { PtNote } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/note/sync-note-popup/note-sync.interface';
import { TaskService } from '@services/task.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';

enum SelectNoteType {
  CREATE_NEW = 'CREATE_NEW',
  SELECT_EXISTING = 'SELECT_EXISTING'
}

@Component({
  selector: 'select-note-pop-up',
  templateUrl: './select-note-pop-up.component.html',
  styleUrls: ['./select-note-pop-up.component.scss']
})
export class SelectNotePopUpComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = false;
  @Input() closable: boolean = true;
  @Input() type = 'default';
  @Output() onNext = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  @Input() bindLabel: PtNote[];
  private unsubscribe = new Subject<void>();
  public loading: boolean = false;
  readonly selectNoteType = SelectNoteType;

  public checkboxList = [
    {
      value: this.selectNoteType.CREATE_NEW,
      label: 'Create new note'
    },
    {
      value: this.selectNoteType.SELECT_EXISTING,
      label: 'Select existing note'
    }
  ];

  public listSelect: PtNote[] = [];
  public selectedOption = this.selectNoteType.CREATE_NEW;
  public searchValue: BehaviorSubject<string> = new BehaviorSubject(null);
  public notFoundItemText = 'No results found';
  public selectNoteRequest: FormGroup;
  public ptId: string;
  public formValidate = {
    note: false
  };

  public loadingState = {
    listExistTask: false
  };
  public modalId = StepKey.propertyTree.notes;

  constructor(
    private widgetNoteService: WidgetNoteService,
    private widgetPTService: WidgetPTService,
    private taskservice: TaskService,
    private preventButtonService: PreventButtonService
  ) {
    this.selectNoteRequest = new FormGroup({
      selectExistNote: new FormControl(null, [Validators.required])
    });
  }

  ngOnInit(): void {
    this.subscribeCurrentTaskId();
  }

  subscribeCurrentTaskId() {
    this.taskservice.currentTaskId$
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((res) => {
          if (res) {
            this.loadingState.listExistTask = true;
            return this.widgetNoteService.getNoteExisting(res);
          } else {
            return of(null);
          }
        })
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.listSelect = res.map((item) => ({
              ...item,
              label: `${item.entityType} Note - ${item.categoryName}${
                item.nameUserPropertyGroup
                  ? ` (${item.nameUserPropertyGroup}):`
                  : ':'
              } ${item.description}`
            }));
            this.setDefaultExistTask();
          }
          this.loadingState.listExistTask = false;
        },
        error: () => {
          this.loadingState.listExistTask = false;
        }
      });
  }

  setDefaultExistTask() {
    if (this.listSelect.length !== 1) return;
    this.selectNoteRequest
      .get('selectExistNote')
      .setValue(this.listSelect[0].id);
  }

  handleCloseModal() {
    this.widgetPTService.setPopupWidgetState(null);
    this.selectedOption = SelectNoteType.CREATE_NEW;
    this.resetForm();
    this.onCancel.emit();
    this.widgetNoteService.reloadSyncStatus = false;
    this.preventButtonService.deleteProcess(
      EButtonStepKey.NOTES,
      EButtonType.STEP
    );
  }

  handleNext() {
    this.widgetNoteService.setDataUpdateModalResponse(false);
    const getExistNote = this.selectNoteRequest.get('selectExistNote').value;
    const nextData = this.listSelect.find(
      (item) => item.ptId === getExistNote || item.id === getExistNote
    );

    if (this.selectedOption === SelectNoteType.CREATE_NEW) {
      this.widgetNoteService.widgetNoteRequestResponse.next(null);
    } else {
      this.widgetNoteService.widgetNoteRequestResponse.next(nextData);
      this.widgetNoteService.reloadSyncStatus = true;
    }
    if (
      this.selectNoteRequest.invalid &&
      this.selectedOption === SelectNoteType.SELECT_EXISTING
    ) {
      this.selectNoteRequest.markAllAsTouched();
      return;
    }
    this.selectedOption = SelectNoteType.CREATE_NEW;
    this.onNext.emit();
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      }
    });
  }

  get selectExistControl() {
    return this.selectNoteRequest.get('selectExistNote');
  }

  customSearchFn(term: string, item: any) {
    const entityType = item?.entityType.toLowerCase() + ' note';
    const searchLabel =
      item?.label?.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    const searchByDescription =
      item?.description?.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    const searchByCategoryName =
      item?.categoryName?.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    const searchEntityType = entityType.indexOf(term.trim().toLowerCase()) > -1;
    return (
      searchByDescription ||
      searchByCategoryName ||
      searchEntityType ||
      searchLabel
    );
  }

  resetForm() {
    this.selectNoteRequest?.reset();
  }

  ngBlur() {
    if (this.searchValue.value) this.searchValue.next('');
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
