import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, of, switchMap, takeUntil } from 'rxjs';
import { MAX_TEXT_MESS_LENGTH } from '@services/constants';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  listCategoryInterface,
  listPropertyNoteInterface
} from '@shared/types/property.interface';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { PetRequestService } from '@services/pet-request.service';
import { WidgetNoteService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-note.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { CompanyService } from '@services/company.service';
import uuid4 from 'uuid4';

@Component({
  selector: 'add-note-property',
  templateUrl: './add-note-property.component.html',
  styleUrls: ['./add-note-property.component.scss']
})
export class AddNotePropertyComponent implements OnInit {
  @Output() onCloseModalAddNote = new EventEmitter<boolean>();
  @Output() onSubmit = new EventEmitter<any>();
  @Output() onBack = new EventEmitter<any>();
  @Output() statusExpandProperty = new EventEmitter<any>();
  @Input() isExpandProperty: boolean;
  @Input() isShow: boolean = false;
  @Input() propertyId: string = '';
  @Input() agencyId: string = '';
  public selectedCategory = '';
  public contentText = '';
  public addNoteForm: FormGroup;
  public disableSubmit: boolean = true;
  private unsubscribe = new Subject<void>();
  readonly MAX_TEXT_MESS_LENGTH = MAX_TEXT_MESS_LENGTH;
  public isArchiveMailbox: boolean = false;
  public idTemp = '';
  public crmSystemId = '';
  public listCategory: listCategoryInterface[] = [];
  public isSearching = false;

  constructor(
    private formBuilder: FormBuilder,
    private propertyService: PropertiesService,
    private userAgentService: UserAgentService,
    private agencyService: AgencyService,
    private taskService: TaskService,
    public inboxService: InboxService,
    private petRequest: PetRequestService,
    private widgetNoteservice: WidgetNoteService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));
    this.initForm();
    this.getListCategory();
  }

  handleSearch(e) {
    this.isSearching = !!e.term;
  }

  getListCategory() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((company) => {
          if (!company) {
            return of([]);
          }

          this.crmSystemId = company.CRM;

          switch (this.crmSystemId) {
            case ECrmSystemId.PROPERTY_TREE:
              return this.petRequest.getCategoryPet(this.agencyId);

            case ECrmSystemId.RENT_MANAGER:
              return this.widgetNoteservice.getListPropertyNote(
                this.propertyId
              );

            default:
              return of([]);
          }
        })
      )
      .subscribe((res) => {
        if (!res) {
          this.listCategory = [];
          return;
        }

        switch (this.crmSystemId) {
          case ECrmSystemId.PROPERTY_TREE:
            this.listCategory = res;
            break;

          case ECrmSystemId.RENT_MANAGER:
            this.listCategory = res.ptListCategory || [];
            break;

          default:
            this.listCategory = [];
            break;
        }
      });
  }

  handleBack() {
    this.onBack.emit(false);
    this.statusExpandProperty.emit(this.isExpandProperty);
  }

  initForm(): FormGroup {
    return (this.addNoteForm = this.formBuilder.group({
      category: [null, [Validators.required]],
      textDescription: ['', Validators.required]
    }));
  }

  closeModal() {
    this.onCloseModalAddNote.emit(true);
    this.statusExpandProperty.emit(this.isExpandProperty);
  }

  addNote() {
    if (this.addNoteForm.invalid) {
      this.addNoteForm.markAllAsTouched();
      return;
    }
    const newNode = this.getNewNode();
    const updateCurrentList = (
      newNote: listPropertyNoteInterface,
      idToRemove: string | null
    ) => {
      const currentList = this.userAgentService.getListNoteOfUser
        .map((note) => ({
          ...note,
          syncStatus: null
        }))
        .filter((item) => item.id !== idToRemove);
      return [newNote, ...currentList];
    };

    this.userAgentService.setListNoteOfUser(
      updateCurrentList(newNode, this.idTemp)
    );
    this.onSubmit.emit();
    const payload = this.getPayloadSync(newNode);
    this.propertyService.createPropertyNote(payload).subscribe(
      (rs) => {
        if (rs) {
          const newNote = {
            ...rs,
            lastModified: rs.createdAt
          };
          this.userAgentService.setListNoteOfUser(
            updateCurrentList(newNote, this.idTemp)
          );
        }
      },
      (error) => {
        const currentList = this.userAgentService.getListNoteOfUser.map(
          (note) =>
            note.id === this.idTemp
              ? { ...note, syncStatus: ESyncStatus.FAILED }
              : note
        );
        this.userAgentService.setListNoteOfUser(currentList);
      }
    );
  }

  getPayloadSync(data) {
    const { categoryId, crmId, description, propertyId, taskId } = data || {};
    return {
      propertyId,
      description,
      categoryId,
      taskId,
      crmId
    };
  }

  getNewNode() {
    const { category, textDescription } = this.addNoteForm.value;
    this.idTemp = uuid4();
    const categoryName = this.listCategory.find(
      (item) => item.id === category
    )?.name;

    const newNote = {
      propertyId: this.propertyId,
      categoryId: category,
      description: textDescription,
      lastModified: new Date().toISOString(),
      id: this.idTemp,
      syncStatus: SyncMaintenanceType.INPROGRESS,
      taskId: this.taskService.currentTask$.value?.id,
      crmId: this.crmSystemId,
      categoryName: categoryName
    };
    return newNote;
  }

  get getTextDescription() {
    return this.addNoteForm?.get('textDescription');
  }

  get getCategory() {
    return this.addNoteForm?.get('category');
  }
}
