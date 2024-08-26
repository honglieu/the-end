import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil
} from 'rxjs';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import {
  ECategoryType,
  EEntityType,
  ENoteSaveToType,
  ERentManagerNotesPopup,
  ERentManagerNotesType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { RentManagerNotesFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes-form.service';
import { IPersonalInTab, Personal } from '@shared/types/user.interface';
import { PropertiesService } from '@services/properties.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TaskService } from '@services/task.service';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { ToastrService } from 'ngx-toastr';
import { isEmpty } from 'lodash-es';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { IRentManagerHistoryCategories } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { RentManagerNoteApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-note-api.service';
import { RentManagerNotesService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes.service';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/popup-management.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { filterOutUnwantedKeys } from '@shared/feature/function.feature';
import { SharedService } from '@services/shared.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { AISummaryFacadeService } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary-facade.service';
@Component({
  selector: 'sync-notes-popup',
  templateUrl: './sync-notes-popup.component.html',
  styleUrls: ['./sync-notes-popup.component.scss']
})
export class SyncNotesPopupComponent implements OnInit {
  constructor(
    private inboxService: InboxService,
    private popupManagementService: PopupManagementService,
    private agencyService: AgencyService,
    private rentManagerNoteApiService: RentManagerNoteApiService,
    private rentManagerNotesFormService: RentManagerNotesFormService,
    private propertyService: PropertiesService,
    private stepService: StepService,
    private taskService: TaskService,
    private widgetRMService: WidgetRMService,
    private toastrService: ToastrService,
    private rentManagerIssueService: RentManagerIssueService,
    private rentManagerNotesService: RentManagerNotesService,
    private fb: FormBuilder,
    private aiSummaryFacadeService: AISummaryFacadeService,
    private showSidebarRightService: ShowSidebarRightService,
    private sharedService: SharedService
  ) {}

  private destroy$ = new Subject<void>();
  public rmNoteForm: FormGroup;
  public currentPopup: ERentManagerNotesPopup;
  public isShowModal: boolean = true;
  public isShowBackBtn: boolean = false;
  public widgetNoteForm: FormGroup;
  public listHistoryCategories: IRentManagerHistoryCategories[] = [];
  public listHistoryCategoriesByType: IRentManagerHistoryCategories[] = [];
  public isUpdateNoteModal: boolean = false;
  public currentSaveToValue = ENoteSaveToType;
  public listEntities: Personal[] = [];
  public entityData = {} as IPersonalInTab;
  public isLoading: boolean = false;
  public SAVE_TO_OPTIONS = [
    {
      label: 'Tenant Note',
      value: ENoteSaveToType.TENANT
    },
    {
      label: 'Owner Note',
      value: ENoteSaveToType.OWNERSHIP
    },
    {
      label: 'Property Note',
      value: ENoteSaveToType.PROPERTY
    }
  ];
  public syncStatus$ = {};
  public isSubmittedRentNoteForm: boolean = false;
  public listFileAttached = [];
  public isRMSyncing: boolean = false;
  public disabledFields = {
    entityType: false,
    entityId: false
  };
  public currentPropertyType: string = '';
  public MAX_NUMBER_FILES = 5;
  public isInvalidNumberFiles: boolean = false;
  public isChangeFileNote: boolean = false;
  isArchiveMailbox: boolean;
  isConsole: boolean;

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.rmNoteForm = this.rentManagerNotesFormService.form;
    this.listFileAttached = this.rmNoteForm.get('file').value;
    this.subscribeStatusModal();
    this.subscribeCurrentPopup();
    this.getAllListHistoryCategories();
    this.getEntityData();
    this.getStatusBackBtn();
    this.isRMSyncing = this.rentManagerNotesFormService.disabled;
    this.rmNoteForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(200),
        filter((res) => res && !isEmpty(res))
      )
      .subscribe((res) => {
        const syncStatus =
          this.rentManagerNotesFormService.getSyncStatus().syncStatus;
        if (
          syncStatus &&
          syncStatus !== ESyncStatus.NOT_SYNC &&
          syncStatus !== ESyncStatus.INPROGRESS
        ) {
          this.rentManagerNotesFormService.setSyncStatusBS({
            syncStatus: ESyncStatus.UN_SYNC,
            syncDate: new Date()
          });
        } else {
          this.rentManagerNotesFormService.setSyncStatusBS({
            syncDate: new Date()
          });
        }
      });
    this.syncStatus$ = this.rentManagerNotesFormService.syncStatus$.pipe(
      map(({ syncStatus, syncDate }) => {
        return {
          status: syncStatus || ESyncStatus.NOT_SYNC,
          lastTimeSynced: syncDate
        };
      })
    );
    if (
      this.rentManagerNotesFormService.formSelectNoteRequest?.get(
        'createNoteType'
      ).value == ERentManagerNotesType.SELECT_EXISTING
    ) {
      this.disabledFields.entityType = true;
      this.disabledFields.entityId = true;
    }
  }

  subscribeStatusModal() {
    this.widgetRMService
      .getModalUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isUpdateNoteModal = res;
      });
  }

  private subscribeCurrentPopup() {
    this.popupManagementService.currentPopup$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentPopup = res;
      });
  }

  getAllListHistoryCategories() {
    this.currentPropertyType =
      this.propertyService.currentProperty.value?.propertyType;
    this.rentManagerIssueService.rmIssueData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.listHistoryCategories = res.historyNoteCategories;
          this.getListHistoryCategoriesByType(res.historyNoteCategories);
        }
      });
  }
  getListHistoryCategoriesByType(data) {
    let entityTypeValue = this.rmNoteForm.get('entityType').value;
    switch (entityTypeValue) {
      case ENoteSaveToType.TENANT: {
        this.listHistoryCategoriesByType = data.filter(
          (i) =>
            i.types.includes(ECategoryType.ALL) ||
            i.types.includes(ECategoryType.TENANT)
        );
        break;
      }
      case ENoteSaveToType.OWNERSHIP: {
        this.listHistoryCategoriesByType = data.filter(
          (i) =>
            i.types.includes(ECategoryType.ALL) ||
            i.types.includes(ECategoryType.OWNER)
        );
        break;
      }
      case ENoteSaveToType.PROPERTY: {
        this.listHistoryCategoriesByType = data.filter(
          (i) =>
            i.types.includes(ECategoryType.ALL) ||
            i.types.includes(
              this.currentPropertyType == 'Property'
                ? ECategoryType.PROPERTY
                : ECategoryType.UNIT
            )
        );
        break;
      }
    }
  }

  getAllListEntities() {
    this.propertyService.currentPropertyId
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.propertyService.getPeopleInSelectPeople(res);
      });
  }

  getListEntitiesByType(data) {
    let entityTypeValue = this.rmNoteForm.get('entityType').value;
    const statusesToIgnore = [EEntityType.DELETED, EEntityType.PROSPECT];
    switch (entityTypeValue) {
      case ENoteSaveToType.TENANT: {
        this.listEntities = data.tenancies?.filter(
          (i) =>
            i.type === ENoteSaveToType.TENANT.toUpperCase() &&
            !statusesToIgnore.includes(i.status)
        );
        break;
      }
      case ENoteSaveToType.OWNERSHIP: {
        this.listEntities = data.ownerships?.filter(
          (i) =>
            i.type === ENoteSaveToType.OWNERSHIP.toUpperCase() &&
            !statusesToIgnore.includes(i.status)
        );
        break;
      }
    }
  }
  getEntityData() {
    this.propertyService.peopleList$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.entityData = res;
          this.getListEntitiesByType(res);
        }
      });
  }

  handleChangeEntityType() {
    this.getListEntitiesByType(this.entityData);
    this.getListHistoryCategoriesByType(this.listHistoryCategories);
    if (this.rmNoteForm.get('entityType').value === ENoteSaveToType.PROPERTY) {
      this.rmNoteForm
        .get('entityId')
        .setValue(this.propertyService.currentPropertyId?.value);
    } else {
      if (this.listEntities.length === 1) {
        this.rmNoteForm.get('entityId').setValue(this.listEntities[0].id);
      } else {
        this.rmNoteForm.get('entityId').setValue(null);
        this.rmNoteForm.get('entityId').markAsUntouched();
      }
    }
    this.rmNoteForm.get('categoryId').setValue(null);
    this.rmNoteForm.get('categoryId').markAsUntouched();
  }
  getStatusBackBtn() {
    this.rentManagerNotesService.isShowBackBtn$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        this.isShowBackBtn = res;
        this.disabledFields.entityType = !res;
        this.disabledFields.entityId = !res;
      });
  }
  updateListFileAttached(listFile) {
    const fileControl = this.rmNoteForm.get('file') as FormArray;
    fileControl.clear();
    listFile.forEach((file) => {
      fileControl.push(
        this.fb.control(
          filterOutUnwantedKeys(
            {
              fileName: file.fileName,
              fileSize: file.fileSize,
              fileType: file.fileType,
              mediaLink: file.mediaLink,
              metaTag: file.metaTag,
              icon: file.icon,
              fileId: file.id || null,
              historyAttachmentId: file.historyAttachmentId || null,
              historyId: file.historyId || null,
              isDisabled: file.isDisabled || null
            },
            [null, undefined, NaN]
          )
        )
      );
    });
  }

  handleAfterClose() {
    if (this.currentPopup === ERentManagerNotesPopup.SYNC_NOTES) {
      this.popupManagementService.setCurrentPopup(null);
      this.rentManagerNotesService.setIsShowBackBtnBS(false);
      this.isSubmittedRentNoteForm = false;
      this.rentManagerNotesFormService.initData(null);
      this.rentManagerNotesFormService.initDataSelectNoteRequestForm(null);
    }
  }

  handleBack() {
    if (this.isUpdateNoteModal) {
      this.popupManagementService.setCurrentPopup(null);
      this.widgetRMService.setPopupWidgetState(
        ERentManagerType.UPDATE_RM_POPUP
      );
      return;
    }
    this.popupManagementService.setCurrentPopup(
      ERentManagerNotesPopup.SELECT_NOTES
    );
    this.isSubmittedRentNoteForm = false;
  }

  handleSyncRM() {
    if (this.isArchiveMailbox) return;
    const currentStep = this.stepService.currentRMStep.getValue();
    this.isSubmittedRentNoteForm = true;
    this.rmNoteForm.markAllAsTouched();
    if (!this.rmNoteForm.get('entityType').value) {
      this.rmNoteForm.get('categoryId').markAsUntouched();
    }
    if (this.rmNoteForm.get('file').value.length > this.MAX_NUMBER_FILES) {
      this.isInvalidNumberFiles = true;
      return;
    } else {
      this.isInvalidNumberFiles = false;
    }
    if (this.rmNoteForm.invalid) {
      return;
    }
    this.isLoading = true;
    const body = {
      agencyId: this.taskService.currentTask$.value?.agencyId,
      taskId: this.taskService.currentTaskId$?.value,
      stepId: currentStep?.id,
      ...this.rentManagerNotesFormService.getValues()
    };
    let rmNoteId = this.rentManagerNotesFormService.getSelectRMNote()?.id;
    if (rmNoteId) {
      body['id'] = rmNoteId;
    }
    this.rentManagerNoteApiService.syncNoteToRM(body).subscribe({
      next: (res) => {
        if (res) {
          const updatedRmNotes = rmNoteId
            ? this.widgetRMService.notes.value.map((item) => {
                if (item.id === rmNoteId) {
                  return res;
                }
                return item;
              })
            : [res, ...this.widgetRMService.notes.value];
          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.RM_NOTES,
            'UPDATE',
            updatedRmNotes
          );
          this.isShowModal = false;
          this.stepService.setCurrentRMStep(null);
          this.handleAfterClose();
          this.showSidebarRightService.handleToggleSidebarRight(true);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastrService.error(error?.message);
        this.isLoading = false;
      }
    });
  }
}
