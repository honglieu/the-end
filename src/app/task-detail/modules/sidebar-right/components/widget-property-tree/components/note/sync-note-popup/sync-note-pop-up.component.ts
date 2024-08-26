import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil
} from 'rxjs';
import { AgencyService } from '@services/agency.service';
import { TIME_FORMAT } from '@services/constants';
import { PetRequestService } from '@services/pet-request.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { Personal } from '@shared/types/user.interface';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { DatePipe } from '@angular/common';
import { WidgetNoteService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-note.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { listCategoryInterface } from '@shared/types/property.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SharedService } from '@services/shared.service';
import { EPropertyStatus } from '@shared/enum/user.enum';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { AISummaryFacadeService } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary-facade.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
@Component({
  selector: 'sync-note-pop-up',
  templateUrl: './sync-note-pop-up.component.html',
  styleUrls: ['./sync-note-pop-up.component.scss']
})
export class SyncNotePopupComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = false;
  @Input() closable: boolean = true;
  @Input() type = 'default';
  @Input() showBackBtn = true;
  @Input() disable: boolean = null;
  @Input() isEditNote: boolean = false;
  @Output() onBack = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  public widgetNoteForm: FormGroup;
  public listCategory: listCategoryInterface[] = [];
  readonly MAX_TEXT_NOTE_LENGTH = 4000;
  private unsubscribe = new Subject<void>();
  public saveToLists = [
    {
      id: 'Tenancy',
      label: 'Tenancy Note'
    },
    {
      id: 'Ownership',
      label: 'Ownership Note'
    },
    {
      id: 'Property',
      label: 'Property Note'
    }
  ];
  readonly TIME_FORMAT = TIME_FORMAT;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => TIME_FORMAT + ' ' + format)
  );
  public TYPE_SYNC_WIDGET_NOTE = ESyncStatus;
  public syncStatus: string = '';
  public syncNoteStatus$ =
    this.widgetNoteService.widgetNoteFloatingDisplayStatus$.asObservable();
  public lastModified: string | Date;
  public isUnSyncedChanges: boolean = false;
  public listTenancy: Personal[] = [];
  public nameUserPropertyGroup: string;
  public categoryName: string;
  public ptId: string = null;
  public showCount = false;
  public isUpdateBreachNoticeModal: boolean = false;
  public isConsole: boolean;
  private categoryPetResponse: any;
  private widgetNoteResponse: any;
  private tenancyListResponse: any;
  public disabledFields = {
    saveTo: false,
    selectTenancy: false
  };
  isArchiveMailbox: boolean;
  public modalId = StepKey.propertyTree.notes;
  public buttonKey = EButtonStepKey.NOTES;

  constructor(
    private taskService: TaskService,
    private petService: PetRequestService,
    private agencyService: AgencyService,
    private propertyService: PropertiesService,
    private widgetNoteService: WidgetNoteService,
    private widgetPTService: WidgetPTService,
    private datePipe: DatePipe,
    private stepService: StepService,
    private inboxService: InboxService,
    private agencyDateFormatService: AgencyDateFormatService,
    private aiSummaryFacadeService: AISummaryFacadeService,
    private sharedService: SharedService,
    private showSidebarRightService: ShowSidebarRightService,
    private preventButtonService: PreventButtonService
  ) {
    this.initForm();
  }

  initForm() {
    this.widgetNoteForm = new FormGroup({
      noteType: new FormControl(null, [Validators.required]),
      saveTo: new FormControl(null, [Validators.required]),
      descriptionText: new FormControl('', [Validators.required]),
      selectTenancy: new FormControl(null, [Validators.required])
    });
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    if (this.isEditNote) {
      this.disabledFields.saveTo = true;
      this.disabledFields.selectTenancy = true;
    }
    this.subscribeStatusModal();
    this.subsribeValueFormChange();
    this.subscribeSaveToControlChange();
    this.subscribeCurrentPropertyId();
    this.subscribeGetCategoryPet();
    combineLatest([
      this.widgetNoteService.widgetNoteRequestResponse,
      this.propertyService.peopleListInSelectPeople$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([widgetNoteResponse, tenancyListResponse]) => {
        this.widgetNoteResponse = widgetNoteResponse;
        this.tenancyListResponse = tenancyListResponse;
        this.handleWidgetAndPeopleChange();
      });
  }

  subscribeStatusModal() {
    this.widgetNoteService
      .getDataUpdateModalResponse()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isUpdateBreachNoticeModal = res;
      });
  }

  subscribeSaveToControlChange() {
    this.saveToControl.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        if (this.saveToControl.value !== 'Tenancy') {
          this.widgetNoteForm.removeControl('selectTenancy');
        } else {
          this.widgetNoteForm.addControl(
            'selectTenancy',
            new FormControl(null, Validators.required)
          );
          this.setDefaultExistTenancy();
        }
      });
  }

  subsribeValueFormChange() {
    this.widgetNoteForm.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.isUnSyncedChanges =
          (this.isEditNote || this.isUpdateBreachNoticeModal) &&
          this.widgetNoteForm.dirty &&
          (this.syncStatus === this.TYPE_SYNC_WIDGET_NOTE.FAILED ||
            this.syncStatus === this.TYPE_SYNC_WIDGET_NOTE.COMPLETED);
      });
  }

  subscribeGetCategoryPet() {
    this.taskService.currentTask$
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged((pre, curr) => pre?.agencyId === curr?.agencyId),
        switchMap((currentTask) => {
          return this.petService.getCategoryPet(currentTask.agencyId);
        })
      )
      .subscribe((data) => {
        this.categoryPetResponse = data;
        if (this.categoryPetResponse) {
          this.listCategory = this.categoryPetResponse
            .sort((a, b) =>
              a.name.localeCompare(b.name, 'en', { numeric: true })
            )
            .map(this.mapDropdown);
          this.handleWidgetAndPeopleChange();
        }
      });
  }

  handleWidgetAndPeopleChange() {
    if (this.tenancyListResponse) {
      this.listTenancy = this.tenancyListResponse.tenancies.filter(
        (tenancy) =>
          tenancy?.status !== EPropertyStatus.archived &&
          tenancy?.status !== EPropertyStatus.deleted
      );
    }

    let cateName = null;
    let nameUserProperty = null;
    if (this.widgetNoteResponse) {
      const {
        syncStatus,
        description,
        entityType,
        nameUserPropertyGroup,
        ptId,
        categoryId,
        lastModified,
        categoryName
      } = this.widgetNoteResponse || {};
      cateName = categoryName;
      nameUserProperty = nameUserPropertyGroup;
      if (this.widgetNoteService.reloadSyncStatus) {
        this.syncStatus = '';
      } else {
        this.syncStatus = syncStatus;
      }
      this.lastModified = lastModified;
      this.noteTypeControl.setValue(categoryId);
      this.descriptionControl.setValue(description);
      this.saveToControl.setValue(entityType);
      this.ptId = ptId;
    }

    if (this.tenancyListResponse) {
      const selectedTenancy = this.tenancyListResponse.tenancies.find(
        (tenancy) => tenancy.name === nameUserProperty
      );
      if (selectedTenancy) {
        this.selectTenancyControl?.setValue(selectedTenancy.id);
      }
    }

    const selectedCategory = this.categoryPetResponse?.find(
      (category) => category.name === cateName
    );

    if (selectedCategory) {
      this.noteTypeControl.setValue(selectedCategory.id);
      this.saveToControl?.disable();
      this.selectTenancyControl?.disable();
    }

    if (!this.widgetNoteResponse) {
      this.saveToControl?.enable();
      this.selectTenancyControl?.enable();
    }
    this.handleDisableNoteSyncing();
  }

  setDefaultExistTenancy() {
    if (this.listTenancy.length !== 1) return;
    this.widgetNoteForm.get('selectTenancy').setValue(this.listTenancy[0].id);
  }

  subscribeCurrentPropertyId() {
    this.propertyService.currentPropertyId
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.propertyService.getPeopleInSelectPeople(res);
      });
  }

  handleSyncNotes() {
    if (this.isArchiveMailbox) return;
    if (!this.widgetNoteForm.valid) {
      this.validateAllFormFields(this.widgetNoteForm);
      return;
    }
    if (this.isEditNote || this.isUpdateBreachNoticeModal) {
      this.handUpdateSyncNote();
    } else {
      this.handCreateSyncNote();
    }
    this.showSidebarRightService.handleToggleSidebarRight(true);
  }

  handCreateSyncNote() {
    const currentStep = this.stepService.currentPTStep.getValue();
    const { id, agencyId } = this.taskService.currentTask$.value;
    const syncRequest = {
      taskId: id,
      description: this.descriptionControl.value,
      propertyId: this.propertyService.currentPropertyId.value,
      agencyId: agencyId,
      categoryId: this.noteTypeControl.value,
      ptNoteEntityType: this.saveToControl.value,
      idUserPropertyGroup: this.selectTenancyControl?.value,
      ptId: this.ptId,
      nameUserPropertyGroup: null,
      categoryName: null,
      entityType: null,
      stepId: currentStep?.id ?? null
    };
    const categoryName = this.listCategory.find(
      (item) => item.id === syncRequest.categoryId
    );
    const tenancyName = this.listTenancy.find(
      (item) => item.id === syncRequest?.idUserPropertyGroup
    );
    const entityType = this.saveToLists.find(
      (item) => item.id === syncRequest?.ptNoteEntityType
    )?.id;
    syncRequest.nameUserPropertyGroup = tenancyName?.name;
    syncRequest.categoryName = categoryName?.name;
    syncRequest.entityType = entityType;
    this.widgetNoteService.handleCreateNote(syncRequest);
    this.handleCloseModal();
  }

  handUpdateSyncNote() {
    const currentStep = this.stepService.currentPTStep.getValue();
    const syncRequest = {
      id: this.widgetNoteService.widgetNoteRequestResponse.value.id,
      description: this.descriptionControl.value,
      propertyId: this.propertyService.currentPropertyId.value,
      categoryId: this.noteTypeControl.value,
      agencyId: this.taskService.currentTask$.value?.agencyId,
      ptNoteEntityType: this.saveToControl.value,
      categoryName: null,
      tenancyName: null,
      stepId: currentStep
        ? currentStep?.id
        : this.widgetNoteService.widgetNoteRequestResponse.value?.stepId,
      taskId: this.taskService.currentTask$.value?.id
    };
    const categoryName = this.listCategory.find(
      (item) => item.id === syncRequest.categoryId
    );
    const tenancyName = this.listTenancy.find(
      (item) => item.id === this.selectTenancyControl?.value
    );
    syncRequest.categoryName = categoryName?.name;
    syncRequest.tenancyName = tenancyName?.name;
    const id = this.widgetNoteService.widgetNoteRequestResponse?.value?.id;
    const createdAt =
      this.widgetNoteService.widgetNoteRequestResponse?.value?.createdAt;
    this.widgetNoteService.updateListWidgetNote(
      {
        ...syncRequest,
        id,
        createdAt,
        syncStatus: ESyncStatus.INPROGRESS,
        nameUserPropertyGroup: tenancyName?.name,
        categoryName: categoryName.name,
        entityType: syncRequest.ptNoteEntityType
      },
      id
    );
    this.widgetNoteService.handleEditNote(
      syncRequest,
      id,
      this.isUpdateBreachNoticeModal
    );
    this.handleCloseModal();
  }

  handleDisableNoteSyncing() {
    if (this.syncStatus === this.TYPE_SYNC_WIDGET_NOTE.INPROGRESS) {
      this.descriptionControl.disable();
      this.noteTypeControl.disable();
      this.disabledFields.saveTo = true;
      this.disabledFields.selectTenancy = true;
    } else {
      this.descriptionControl.enable();
      this.noteTypeControl.enable();
    }
  }

  resetForm() {
    this.widgetNoteForm.reset();
    this.widgetNoteForm.markAsUntouched();
    this.widgetNoteForm.markAsPristine();
  }

  handleCloseModal() {
    this.ptId = null;
    this.widgetPTService.setPopupWidgetState(null);
    this.isUpdateBreachNoticeModal = false;
    this.resetForm();
    this.onCancel.emit();
    this.widgetNoteService.reloadSyncStatus = false;
    this.preventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }

  handleBack() {
    if (this.isUpdateBreachNoticeModal) {
      this.widgetPTService.setPopupWidgetState(EPropertyTreeType.UPDATE_NOTES);
      return;
    }
    this.resetForm();
    this.onBack.emit();
  }

  handleChangeTimeSync() {
    this.lastModified = this.datePipe.transform(
      new Date(),
      'yyyy-MM-dd HH:mm:ss'
    );
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      }
    });
  }

  mapDropdown(val): listCategoryInterface {
    return {
      id: val.id,
      name: val.name
    };
  }

  get noteTypeControl() {
    return this.widgetNoteForm.get('noteType');
  }

  get saveToControl() {
    return this.widgetNoteForm.get('saveTo');
  }

  get selectTenancyControl() {
    return this.widgetNoteForm.get('selectTenancy');
  }

  get descriptionControl() {
    return this.widgetNoteForm.get('descriptionText');
  }

  get disabled() {
    return this.syncStatus === ESyncStatus.INPROGRESS;
  }

  get disabledText() {
    return this.syncStatus === ESyncStatus.COMPLETED;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.widgetNoteService.widgetNoteFloatingDisplayStatus$.next(false);
  }
}
