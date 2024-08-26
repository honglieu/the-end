import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { SharedService } from '@services/shared.service';
import { SyncMaintenanceType } from '@shared/enum';
import {
  Property,
  listCategoryInterface,
  listPropertyNoteInterface
} from '@shared/types/property.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { takeUntil, filter, Subject, combineLatest, finalize } from 'rxjs';
import { PropertyProfileService } from '@shared/components/property-profile/services/property-profile.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { FileCarousel, FileType, IFile } from '@shared/types/file.interface';
import { FilesService } from '@services/files.service';
import { SUPPORTED_FILE_CAROUSEL } from '@services/constants';
import { PropertiesService } from '@services/properties.service';
import { GetThumbOfFilePipe } from '@shared/pipes/get-thumb-of-file.pipe';
import { PetRequestService } from '@services/pet-request.service';

@Component({
  selector: 'notes-tab',
  templateUrl: './notes-tab.component.html',
  styleUrls: ['./notes-tab.component.scss']
})
export class NotesTabComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChildren('fileName') fileNames: QueryList<ElementRef>;
  public currentProperty: Property = null;
  public isShowModalAddEditNote: boolean = false;
  public listPropertyNote: listPropertyNoteInterface[] = [];
  public listFileCarousel: FileCarousel[] = [];
  public crmSystemId?: string;
  public isConsole: boolean = false;
  private subscribers = new Subject<void>();
  readonly ECrmSystemId = ECrmSystemId;
  private hideSyncTimeout: NodeJS.Timeout;
  public isLoading = false;
  public isUpdateModal = false;
  public updateItem: listPropertyNoteInterface = null;
  public isShowCarousel: boolean = false;
  public popupModalPosition = ModalPopupPosition;
  public initialIndex: number = 0;
  public tooltipTriggers: Map<number, string> = new Map();
  public isUnitType: boolean = false;
  public listCategory: listCategoryInterface[] = [];
  public ptListCategory = [];
  public TYPE_SYNC_MAINTENANCE = SyncMaintenanceType;
  public timeoutId: NodeJS.Timeout = null;

  constructor(
    private readonly userAgentService: UserAgentService,
    private readonly sharedService: SharedService,
    private readonly propertyProfileService: PropertyProfileService,
    public readonly filesService: FilesService,
    private readonly propertiesService: PropertiesService,
    private readonly getThumbOfFilePipe: GetThumbOfFilePipe,
    private readonly petRequest: PetRequestService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.subscribeCurrentPropertyAndCurrentCompany();
    this.loadListNoteOfUser();
    this.subscribeListNoteOfUser();
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

  public loadListNoteOfUser(isLoading = true) {
    this.isLoading = isLoading;
    this.propertiesService
      .getListPropertyNote(this.currentProperty.id)
      .pipe(
        takeUntil(this.subscribers),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((notes) => {
        let newNote;
        switch (this.crmSystemId) {
          case ECrmSystemId.PROPERTY_TREE:
            newNote = notes;
            break;
          case ECrmSystemId.RENT_MANAGER:
            newNote = notes.notes;
            this.ptListCategory = notes.ptListCategory || [];
            break;
          default:
            break;
        }
        const data = newNote?.map((note) => {
          if (note.syncStatus === this.TYPE_SYNC_MAINTENANCE.FAILED) {
            return note;
          }

          return {
            ...note,
            syncStatus: null
          };
        });
        this.userAgentService.setListNoteOfUser(data);
        this.getListCategory();
      });
  }

  subscribeListNoteOfUser(): void {
    this.userAgentService.getListNoteOfUser$
      .pipe(
        takeUntil(this.subscribers),
        filter((notes) => !!notes)
      )
      .subscribe((notes) => {
        this.listPropertyNote = notes?.sort(
          (a, b) =>
            new Date(b.lastModified).getTime() -
            new Date(a.lastModified).getTime()
        );

        const foundItem = notes.find((item, index) => {
          return (
            (index === 0 && this.updateItem?.isNewNote) ||
            (item.id === this.updateItem?.id &&
              item.syncStatus !== this.updateItem?.syncStatus)
          );
        });

        if (foundItem) {
          this.updateItem = foundItem;
        }
        this.cdr.markForCheck();
      });
  }

  subscribeCurrentPropertyAndCurrentCompany() {
    combineLatest([
      this.propertyProfileService.currentPropertyData$,
      this.propertyProfileService.currentCompany$
    ])
      .pipe(takeUntil(this.subscribers))
      .subscribe((rs) => {
        if (rs) {
          this.currentProperty = rs[0];

          this.isUnitType =
            this.currentProperty.sourceProperty.type &&
            this.currentProperty.sourceProperty.type === 'Unit';
          this.crmSystemId = rs[1]?.CRM;
        }
      });
  }

  getListCategory() {
    switch (this.crmSystemId) {
      case ECrmSystemId.PROPERTY_TREE:
        this.petRequest
          .getCategoryPet(this.currentProperty.agencyId)
          .pipe(takeUntil(this.subscribers))
          .subscribe((res) => {
            this.listCategory = res;
          });
        break;

      case ECrmSystemId.RENT_MANAGER:
        this.listCategory = this.ptListCategory;

        break;

      default:
        this.listCategory = [];
        break;
    }
  }

  handleOpenModalEditNote(item: listPropertyNoteInterface) {
    this.updateItem = item;
    this.isShowModalAddEditNote = true;
    this.isUpdateModal = true;
  }

  handleOpenModalAddNote() {
    this.isShowModalAddEditNote = true;
  }

  handleCloseModalAddNote() {
    this.isShowModalAddEditNote = false;
    this.isUpdateModal = false;
    this.updateItem = null;
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

  getPayloadUpdateNote(item: listPropertyNoteInterface) {
    const { id, categoryId, description, files } = item || {};
    const propertyId = this.currentProperty.id;
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

  handleRetryNote(event: Event, item: listPropertyNoteInterface) {
    if (this.isConsole) return;

    event.stopPropagation();

    const { id, categoryId, description, categoryName, lastModified, files } =
      item;

    this.userAgentService.setListNoteOfUser(
      this.updateLocalList(
        id,
        categoryId,
        categoryName,
        description,
        lastModified,
        files,
        SyncMaintenanceType.INPROGRESS
      )
    );

    const payload = this.getPayloadUpdateNote(item);
    this.propertiesService.updatePropertyNote(payload).subscribe({
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
        } else
          this.timeoutId = setTimeout(() => this.updateSyncStatus(id), 3000);
      },
      error: () => {
        this.updateSyncStatus(id, ESyncStatus.FAILED);
      }
    });
  }

  updateSyncStatus(id: string, status: ESyncStatus | null = null) {
    const currentList = this.userAgentService.getListNoteOfUser;

    const updatedList = currentList.map((note) =>
      note.id === id ? { ...note, syncStatus: status } : note
    );
    this.userAgentService.setListNoteOfUser(updatedList);
  }

  handleRemoveSyncFailedNote(
    event: Event,
    deletedNote: listPropertyNoteInterface
  ) {
    event.stopPropagation();
    if (this.isConsole) return;
    if (deletedNote?.ptId || deletedNote?.source?.externalId) {
      //cancel
      this.cancelSyncFailedNote(deletedNote.id);
    } else {
      //remove
      this.removeSyncFailedNote(deletedNote.id);
    }
  }

  cancelSyncFailedNote(noteId: string) {
    this.propertiesService
      .cancelPropertyNote(noteId)
      .pipe(takeUntil(this.subscribers))
      .subscribe({
        next: (res) => {
          this.loadListNoteOfUser(false);
        },
        error: () => {}
      });
  }

  removeSyncFailedNote(noteId: string) {
    this.propertiesService
      .removePropertyNote(noteId)
      .pipe(takeUntil(this.subscribers))
      .subscribe({
        next: (res) => {
          const currentList = this.userAgentService.getListNoteOfUser.filter(
            (note) => note.id !== noteId
          );
          this.userAgentService.setListNoteOfUser(currentList);
        },
        error: () => {}
      });
  }

  handleRemoveOrCancelSyncFailedNote(
    event: Event,
    deletedNote: listPropertyNoteInterface
  ) {
    event.stopPropagation();
    if (deletedNote?.dataFailed) {
      const currentList = this.userAgentService.getListNoteOfUser.filter(
        (note) => note.id !== deletedNote.id
      );
      this.userAgentService.setListNoteOfUser(currentList);
    } else {
      this.loadListNoteOfUser(false);
    }
  }

  previewFile(
    event: Event,
    note: listPropertyNoteInterface,
    clickedFile: IFile,
    index: number
  ) {
    event.stopPropagation();

    const clickedFileExtension = this.filesService.getFileExtensionWithoutDot(
      note.files[index].fileName
    );

    if (SUPPORTED_FILE_CAROUSEL.includes(clickedFileExtension)) {
      this.isShowCarousel = true;
      this.listFileCarousel = (
        note.files.map((el) => {
          const fileExtension = this.filesService.getFileExtensionWithoutDot(
            el.fileName
          );

          if (SUPPORTED_FILE_CAROUSEL.includes(fileExtension)) {
            return {
              ...el,
              fileType: this.filesService.getFileTypeDot(el.fileName),
              extension: fileExtension,
              size: el.fileSize,
              fileTypeName: el.fileType.name,
              thumbMediaLink: this.getThumbOfFilePipe.transform(el)
            };
          } else return undefined;
        }) as unknown as FileCarousel[]
      ).filter((note) => note);

      this.initialIndex = this.listFileCarousel.findIndex(
        (file) => file.FileID === clickedFile.FileID
      );
    } else {
      this.isShowCarousel = false;
      this.initialIndex = null;
      this.filesService.downloadResource(
        note.files[index]?.mediaLink,
        note.files[index]?.fileName
      );
    }
  }

  manageCarouselState(event) {
    this.isShowCarousel = false;
    this.initialIndex = null;
    this.listFileCarousel = [];
  }

  getPreviewIcon(fileType: FileType) {
    if (!fileType) return 'TrudiDocument';

    if (typeof fileType === 'string') {
      var fileTypeString = fileType as string;
    } else if (typeof fileType.name !== 'string') {
      return 'TrudiDocument';
    } else {
      fileTypeString = fileType.name;
    }

    switch (this.filesService.getFileType(fileTypeString)) {
      case 'pdf':
        return 'TrudiDocument';
      case 'mp4':
        return 'playVideoIcon';
      case 'image':
        return 'imageAttachIcon';
      case 'video':
        return 'playVideoIcon';

      default:
        return 'TrudiDocument';
    }
  }

  noteTrackByFn(_: number, note: listPropertyNoteInterface) {
    return note.id;
  }

  fileTrackByFn(_: number, file: IFile) {
    return file.FileID;
  }

  ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
    this.userAgentService.setListNoteOfUser([]);
    clearTimeout(this.hideSyncTimeout);
    clearTimeout(this.timeoutId);
  }
}
