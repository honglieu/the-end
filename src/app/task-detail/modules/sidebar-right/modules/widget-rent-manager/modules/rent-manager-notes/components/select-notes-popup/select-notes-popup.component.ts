import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, map, takeUntil } from 'rxjs';
import {
  ENoteSaveToType,
  ERentManagerNotesPopup,
  ERentManagerNotesType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';
import { IRentManagerNote } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/interfaces/rent-manager-notes.interface';
import { FormGroup } from '@angular/forms';
import { RentManagerNotesFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes-form.service';
import { RentManagerNotesService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes.service';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/popup-management.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
@Component({
  selector: 'select-notes-popup',
  templateUrl: './select-notes-popup.component.html',
  styleUrls: ['./select-notes-popup.component.scss']
})
export class SelectNotesPopupComponent implements OnInit, OnDestroy {
  constructor(
    private popupManagementService: PopupManagementService,
    private rentManagerNotesFormService: RentManagerNotesFormService,
    private rentManagerNotesService: RentManagerNotesService
  ) {}

  private destroy$ = new Subject<void>();
  public selectNoteForm: FormGroup;
  public currentPopup: ERentManagerNotesPopup;
  public ERentManagerNotesType = ERentManagerNotesType;
  public selectedOption = ERentManagerNotesType.CREATE_NEW;
  public listExistedNotes: IRentManagerNote[] = [];
  public listNoteTypes = [
    {
      value: ERentManagerNotesType.CREATE_NEW,
      label: 'Create new note'
    },
    {
      value: ERentManagerNotesType.SELECT_EXISTING,
      label: 'Select existing note'
    }
  ];
  public loadingState = {
    listExistTask: false
  };
  customSearchFn(term: string, item: any) {
    const entityType = item?.entityTypeName.toLowerCase() + ' note';
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
  public ENTITY_NAME_MAP = {
    [ENoteSaveToType.TENANT]: 'Tenant',
    [ENoteSaveToType.OWNERSHIP]: 'Owner',
    [ENoteSaveToType.PROPERTY]: 'Property'
  };
  ngOnInit(): void {
    this.selectNoteForm =
      this.rentManagerNotesFormService.buildSelectNoteRequestForm();
    this.subscribeCurrentPopup();
    this.getListNotes();
  }

  private subscribeCurrentPopup() {
    this.popupManagementService.currentPopup$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentPopup = res;
      });
  }

  getListNotes() {
    this.rentManagerNotesService.listExistedNotes$
      .pipe(
        takeUntil(this.destroy$),
        map((res) => {
          if (res) {
            return res.map((item) => ({
              ...item,
              entityTypeName:
                this.ENTITY_NAME_MAP[item.entityType] || item.entityType,
              label: `${
                this.ENTITY_NAME_MAP[item.entityType] || item.entityType
              } note - ${item.categoryName}${
                item.entityName ? ` (${item.entityName}):` : ':'
              } ${item.description}`
            }));
          }
          return [];
        })
      )
      .subscribe((mappedRes) => {
        if (mappedRes) {
          this.listExistedNotes = mappedRes;
        }
      });
  }

  handleChangeSelectOption(e) {
    this.selectNoteForm.get('existNote').setValue(null);
    this.selectNoteForm.get('existNote').markAsUntouched();
  }

  handleAfterClose() {
    if (this.currentPopup === ERentManagerNotesPopup.SELECT_NOTES) {
      this.popupManagementService.setCurrentPopup(null);
      this.rentManagerNotesService.setIsShowBackBtnBS(false);
      this.rentManagerNotesFormService.initData(null);
      this.rentManagerNotesFormService.initDataSelectNoteRequestForm(null);
    }
  }

  handleNext() {
    const selectedOption = this.selectNoteForm.get('createNoteType').value;
    this.selectNoteForm.markAllAsTouched();
    if (
      this.selectNoteForm.invalid &&
      selectedOption === ERentManagerNotesType.SELECT_EXISTING
    ) {
      return;
    }
    this.rentManagerNotesFormService.initDataSelectNoteRequestForm(
      this.selectNoteForm.value
    );
    this.rentManagerNotesService.setIsShowBackBtnBS(true);
    if (selectedOption === ERentManagerNotesType.SELECT_EXISTING) {
      const noteData = this.getSelectedNoteDataModified();
      this.rentManagerNotesFormService.initData(noteData);
    } else {
      this.rentManagerNotesFormService.initData(null);
    }
    this.rentManagerNotesFormService.setSyncStatusBS({
      syncStatus: ESyncStatus.NOT_SYNC,
      syncDate: new Date()
    });
    this.rentManagerNotesFormService.buildForm();
    this.popupManagementService.setCurrentPopup(
      ERentManagerNotesPopup.SYNC_NOTES
    );
  }

  getSelectedNoteDataModified() {
    const noteDataId = this.selectNoteForm.get('existNote').value;
    const noteData = this.listExistedNotes.find((i) => i.id === noteDataId);

    noteData.file =
      noteData?.file?.map(
        ({ fileId, historyAttachmentId, historyId, ...otherFileData }) =>
          otherFileData
      ) || [];

    const { id, syncStatus, externalId, ...otherInfoNoteData } = noteData;

    return otherInfoNoteData;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
