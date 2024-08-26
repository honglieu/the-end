import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import {
  HISTORY_NOTES_FILE_VALID_TYPE,
  MAX_TEXT_NOTE_LENGTH
} from '@services/constants';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { SyncMaintenanceType } from '@shared/enum';
import {
  listCategoryInterface,
  listPropertyNoteInterface
} from '@shared/types/property.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { DatePipe } from '@angular/common';
import { FilesService } from '@services/files.service';
import { IFile } from '@shared/types/file.interface';
import uuid4 from 'uuid4';

@Component({
  selector: 'add-edit-note-popup',
  templateUrl: './add-edit-note-popup.component.html',
  styleUrls: ['./add-edit-note-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditNotePopupComponent
  implements OnInit, OnChanges, AfterViewChecked, OnDestroy
{
  @ViewChildren('fileName') fileNames: QueryList<ElementRef>;

  @Output() handleCloseModalAddNote = new EventEmitter<boolean>();
  @Output() handleSubmit = new EventEmitter();
  @Input() isShow: boolean = false;
  @Input() propertyId: string = '';
  @Input() agencyId: string = '';
  @Input() isUpdate: boolean = false;
  @Input() updateItem?: listPropertyNoteInterface;
  @Input() isConsole: boolean;
  @Input() crmSystemId: string = '';
  @Input() listCategory: listCategoryInterface[] = [];

  public updateItemClone?: listPropertyNoteInterface;
  public selectedCategory = '';
  public contentText = '';
  public addNoteForm: FormGroup;
  public disableSubmit: boolean = true;
  private unsubscribe = new Subject<void>();
  readonly MAX_TEXT_NOTE_LENGTH = MAX_TEXT_NOTE_LENGTH;
  public TYPE_SYNC_MAINTENANCE = SyncMaintenanceType;
  public isDisableSyncButton: boolean = false;
  public idTemp = '';
  public isSearching = false;
  public ECrmSystemId = ECrmSystemId;
  public HISTORY_NOTES_FILE_VALID_TYPE = HISTORY_NOTES_FILE_VALID_TYPE;
  public listFile: IFile[] = [];
  public disableTooltipText = '';
  public initFile: boolean = false;
  public tooltipTriggers: Map<number, string> = new Map();
  public isInvalidFile: boolean = false;
  public isFileLoading: boolean = false;
  public timeoutIdSecond: NodeJS.Timeout = null;
  public timeoutIdFirst: NodeJS.Timeout = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly propertyService: PropertiesService,
    private readonly userAgentService: UserAgentService,
    private readonly taskService: TaskService,
    public readonly inboxService: InboxService,
    private readonly datePipe: DatePipe,
    private readonly filesService: FilesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get getTextDescription() {
    return this.addNoteForm?.get('textDescription');
  }

  get getCategory() {
    return this.addNoteForm?.get('category');
  }

  get lastModified() {
    return this.addNoteForm?.get('lastModified');
  }

  get syncStatus() {
    return this.addNoteForm?.get('syncStatus');
  }

  get isDirty() {
    return this.addNoteForm?.dirty;
  }

  get getUpdateItemClone() {
    return this.updateItemClone;
  }

  ngOnInit(): void {
    if (this.isUpdate) {
      this.initForm(this.updateItem);
    } else {
      //create
      this.initForm();
    }
  }

  ngAfterViewChecked() {
    let needsChangeDetection = false;

    this.fileNames.forEach((fileName, index) => {
      const el = fileName.nativeElement;
      const trigger = el.offsetWidth < el.scrollWidth ? 'hover' : null;

      if (this.tooltipTriggers.get(index) !== trigger) {
        this.tooltipTriggers.set(index, trigger);
        needsChangeDetection = true;
      }
    });

    if (needsChangeDetection) {
      this.cdr.detectChanges();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['updateItem'] && changes['updateItem'].currentValue) {
      this.updateItemClone = { ...this.updateItem };

      if (
        this.updateItem.syncStatus === this.TYPE_SYNC_MAINTENANCE.INPROGRESS
      ) {
        this.isDisableSyncButton = true;
      }

      //reclick when syncing case
      if (this.addNoteForm) {
        if (this.crmSystemId === this.ECrmSystemId.RENT_MANAGER)
          if (this.isFileLoading) {
            //if upload new file after reclick
            const filesAreUploading = this.listFile.filter(
              (file) => !file?.FileID
            );

            this.listFile = [...this.updateItem?.files, ...filesAreUploading];
          } else {
            this.listFile = [...this.updateItem?.files];
          }

        this.syncStatus?.setValue(this.updateItem.syncStatus);
        this.lastModified?.setValue(this.updateItem.updatedAt);

        //if edit form after reclick
        if (
          this.updateItem.description ===
            this.getTextDescription.getRawValue() &&
          this.updateItem.categoryId === this.getCategory.getRawValue()
        ) {
          this.addNoteForm?.markAsPristine();
        }
      }
    }
  }

  handleSearch(e) {
    this.isSearching = !!e.term;
  }

  initForm(initData?: listPropertyNoteInterface): void {
    if (initData) {
      this.addNoteForm = this.formBuilder.group({
        category: [
          {
            value: initData.categoryId,
            disabled: initData.syncStatus === SyncMaintenanceType.INPROGRESS
          },
          [Validators.required]
        ],
        textDescription: [
          {
            value: initData.description,
            disabled: initData.syncStatus === SyncMaintenanceType.INPROGRESS
          },
          Validators.required
        ],
        lastModified: [initData.lastModified],
        syncStatus: [initData.syncStatus]
      });

      this.initFile = true;
      this.listFile = initData.files;

      this.addNoteForm.valueChanges.subscribe((value) => {
        this.handleChangeTimeSync();
      });

      this.addNoteForm.get('syncStatus')?.valueChanges.subscribe((value) => {
        if (value === this.TYPE_SYNC_MAINTENANCE.INPROGRESS) {
          this.isDisableSyncButton = true;
          this.getTextDescription.disable();
          this.getCategory.disable();
        } else {
          this.isDisableSyncButton = false;
          this.getTextDescription.enable();
          this.getCategory.enable();
        }
      });
    } else {
      this.addNoteForm = this.formBuilder.group({
        category: [null, [Validators.required]],
        textDescription: ['', Validators.required]
      });
    }

    this.addNoteForm.get('category')?.valueChanges.subscribe((value) => {
      if (!value) {
        this.addNoteForm.get('category').markAsTouched();
      }
    });
  }

  closeModal() {
    this.handleCloseModalAddNote.emit(true);
  }

  submitHandler() {
    if (this.addNoteForm.invalid) {
      this.addNoteForm.markAllAsTouched();
      return;
    }

    if (
      this.isDisableSyncButton ||
      this.isConsole ||
      ((this.isInvalidFile || this.isFileLoading) &&
        this.crmSystemId === ECrmSystemId.RENT_MANAGER)
    ) {
      return;
    }

    if (this.isUpdate) {
      this.editNote({
        ...this.updateItem,
        categoryId: this.addNoteForm?.get('category')?.value,
        description: this.addNoteForm?.get('textDescription')?.value,
        files: this.listFile
      });
    } else {
      this.addNote();
    }
  }

  findCategoryById(categoryId: string) {
    return this.listCategory.find((item) => item.id === categoryId);
  }

  updateCurrentList(
    newNote: listPropertyNoteInterface,
    idToRemove: string | null
  ) {
    const currentList = this.userAgentService.getListNoteOfUser
      .map((note) => {
        if (note.syncStatus === this.TYPE_SYNC_MAINTENANCE.FAILED) {
          return {
            ...note
          };
        }

        return {
          ...note,
          syncStatus: null
        };
      })
      .filter((item) => item.id !== idToRemove);
    return [newNote, ...currentList];
  }

  addNote() {
    const newNode = this.getNewNode();

    this.userAgentService.setListNoteOfUser(
      this.updateCurrentList(newNode, this.idTemp)
    );
    this.handleSubmit.emit();
    const payload = this.getPayloadSync(newNode);

    this.propertyService.createPropertyNote(payload).subscribe({
      next: (rs) => {
        if (rs) {
          const newNote = {
            ...rs,
            lastModified: rs.createdAt,
            files: rs.files ?? []
          };
          this.userAgentService.setListNoteOfUser(
            this.updateCurrentList(newNote, this.idTemp)
          );

          if (newNote.syncStatus === ESyncStatus.FAILED) {
            this.updateSyncStatus(newNote.id, ESyncStatus.FAILED);
          } else
            this.timeoutIdFirst = setTimeout(
              () => this.updateSyncStatus(newNote.id, undefined, rs.createdAt),
              3000
            );
        }
      },
      error: () => {
        this.updateSyncStatus(newNode.id, ESyncStatus.FAILED);
      }
    });
  }

  getPayloadUpdateNote(item: listPropertyNoteInterface) {
    const { id, categoryId, description, files } = item || {};
    const propertyId = this.propertyId;
    return {
      propertyId,
      categoryId,
      description,
      id,
      crmId: this.crmSystemId,
      files: files?.map((file) => ({ ...file, localThumb: '' }))
    };
  }

  updateLocalList(
    idToUpdate: string,
    categoryId: string,
    categoryName: string,
    updatedDescription: string,
    lastModified: string,
    files: IFile[],
    syncStatus: SyncMaintenanceType
  ) {
    return this.userAgentService.getListNoteOfUser.map((item) => {
      if (item.id === idToUpdate) {
        return {
          ...item,
          categoryId: categoryId,
          categoryName: categoryName ?? item.categoryName,
          description: updatedDescription,
          lastModified,
          files,
          syncStatus
        };
      }

      return item;
    });
  }

  editNote(item: listPropertyNoteInterface) {
    this.handleSubmit.emit();
    const { id, categoryId, description, lastModified, files } = item;

    this.userAgentService.setListNoteOfUser(
      this.updateLocalList(
        id,
        categoryId,
        this.findCategoryById(categoryId)?.name,
        description,
        lastModified,
        files,
        SyncMaintenanceType.INPROGRESS
      )
    );

    this.syncStatus.setValue(SyncMaintenanceType.INPROGRESS);

    const payload = this.getPayloadUpdateNote(item);
    this.propertyService.updatePropertyNote(payload).subscribe({
      next: (note) => {
        if (!note) return;
        this.userAgentService.setListNoteOfUser(
          this.updateLocalList(
            id,
            note.categoryId,
            note.categoryName,
            note.description,
            note.lastModified,
            note.files,
            note.syncStatus
          )
        );

        if (note.syncStatus === ESyncStatus.FAILED) {
          this.updateSyncStatus(id, ESyncStatus.FAILED);
        } else {
          this.timeoutIdSecond = setTimeout(() => {
            this.updateSyncStatus(id, undefined, note.lastModified);
          }, 3000);
        }
      },
      error: () => {
        this.updateSyncStatus(id, ESyncStatus.FAILED);
      }
    });
  }

  updateSyncStatus(
    id: string,
    status: ESyncStatus | null = null,
    lastModified?: number
  ) {
    const currentList = this.userAgentService.getListNoteOfUser;

    const updatedList = currentList.map((note) => {
      if (note.id === id) {
        //prevent duplicate turn off success status
        if (
          !status &&
          (note.syncStatus === ESyncStatus.INPROGRESS ||
            (note.syncStatus === ESyncStatus.COMPLETED &&
              Number(note.lastModified) !== lastModified))
        ) {
          return note;
        }

        return { ...note, syncStatus: status };
      }

      return note;
    });
    this.userAgentService.setListNoteOfUser(updatedList);
  }

  getPayloadSync(data) {
    const { categoryId, crmId, description, propertyId, taskId, files } =
      data || {};
    return {
      propertyId,
      description,
      categoryId,
      taskId,
      crmId,
      files:
        this.crmSystemId === ECrmSystemId.RENT_MANAGER && files
          ? files.map((file) => ({ ...file, localThumb: '' }))
          : []
    };
  }

  handleChangeTimeSync() {
    if (!this.isUpdate) return;

    const modifiedTime = this.datePipe.transform(
      new Date(),
      'yyyy-MM-dd HH:mm:ss'
    );
    this.updateItemClone.lastModified = modifiedTime;
    this.lastModified.setValue(modifiedTime, { emitEvent: false });
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
      isNewNote: true,
      syncStatus: SyncMaintenanceType.INPROGRESS,
      taskId: this.taskService.currentTask$.value?.id,
      crmId: this.crmSystemId,
      files: this.listFile,
      categoryName: categoryName
    };
    return newNote;
  }

  getListFile(files: IFile[]) {
    let countInvalidFiles = 0;

    if (this.listFile.length !== files.length) this.handleChangeTimeSync();

    this.listFile = files.map((file) => {
      if (file.error) countInvalidFiles++;

      return file;
    });

    if (countInvalidFiles > 0) this.isInvalidFile = true;
    else this.isInvalidFile = false;

    if (!this.initFile) {
      this.addNoteForm.markAsDirty();
    } else {
      this.initFile = false;
    }
  }

  isVideoFileLogo(file: IFile): boolean {
    return (
      file?.fileType?.name?.includes('video') ||
      (typeof file?.fileType === 'string' &&
        (file?.fileType as string).includes('video'))
    );
  }

  removeFile(index: number) {
    if (!(this.syncStatus?.value === SyncMaintenanceType.INPROGRESS)) {
      this.listFile.splice(index, 1);
      this.filesService.updateListFileUpload = this.listFile;
      this.getListFile(this.listFile);
    }
  }

  fileLoadingChange(isLoading: boolean) {
    this.isFileLoading = isLoading;
  }

  fileTrackByFn(index: number) {
    return index;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    clearTimeout(this.timeoutIdFirst);
    clearTimeout(this.timeoutIdSecond);
  }
}
