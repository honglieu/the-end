import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subject, takeUntil, throttleTime } from 'rxjs';
import { WidgetNoteService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-note.service';
import { PtNote } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/note/sync-note-popup/note-sync.interface';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { PreventButtonService } from '@trudi-ui';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';

@Component({
  selector: 'select-update-note-pop-up',
  templateUrl: './select-update-note-pop-up.component.html',
  styleUrls: ['./select-update-note-pop-up.component.scss']
})
export class SelectUpdateNotePopUpComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = false;
  @Input() closable: boolean = true;
  @Input() type = 'default';
  @Output() onNext = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  public listSelect: PtNote[] = [];
  private unsubscribe = new Subject<void>();
  public selectLabel: string;
  public searchValue: BehaviorSubject<string> = new BehaviorSubject(null);
  public notFoundItemText = 'No results found';
  public selectNoteRequest: FormGroup;
  public loadingText = 'Loading...';
  public ptId: string;
  public loadingState = {
    listExistTask: false
  };
  public modalId = StepKey.propertyTree.notes;

  constructor(
    private widgetNoteService: WidgetNoteService,
    private widgetPTService: WidgetPTService,
    private preventButtonService: PreventButtonService
  ) {
    this.selectNoteRequest = new FormGroup({
      selectExistNote: new FormControl(null, [Validators.required])
    });
  }

  ngOnInit(): void {
    this.widgetPTService
      .getPTWidgetStateByType<PtNote[]>(PTWidgetDataField.NOTES)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.listSelect = res
            ?.filter((note) => note?.syncStatus === ESyncStatus.COMPLETED)
            ?.map((item) => ({
              ...item,
              label: `${item.entityType} Note - ${item.categoryName}${
                item.nameUserPropertyGroup
                  ? ` (${item.nameUserPropertyGroup}):`
                  : ':'
              } ${item.description}`
            }));

          this.setDefaultExistTask();
        }
      });

    this.widgetPTService
      .getUpdatePTWidget()
      .pipe(takeUntil(this.unsubscribe), throttleTime(200))
      .subscribe((data) => {
        if (!data) return;
        for (const key in data) {
          this.selectNoteRequest.get(key)?.setValue(data[key]);
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
    this.resetForm();
    this.onCancel.emit();
    this.widgetNoteService.reloadSyncStatus = false;
    this.widgetPTService.setUpdatePTWidget(null);
    this.preventButtonService.deleteProcess(
      EButtonStepKey.NOTES,
      EButtonType.STEP
    );
  }

  handleNext() {
    this.widgetNoteService.setDataUpdateModalResponse(true);
    const getExistNote =
      this.selectNoteRequest?.get('selectExistNote').value ||
      this.listSelect?.[0].id;
    const nextData = this.listSelect.find(
      (item) => item.ptId === getExistNote || item.id === getExistNote
    );

    if (getExistNote) {
      this.widgetNoteService.widgetNoteRequestResponse.next(nextData);
    }
    if (this.listSelect?.length !== 1 && this.selectNoteRequest?.invalid) {
      this.selectNoteRequest.markAllAsTouched();
      return;
    }
    this.onNext.emit(true);
    this.widgetPTService.setUpdatePTWidget({ ...this.selectNoteRequest.value });
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
