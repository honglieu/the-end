import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FilesService } from '@services/files.service';
import { ECRMId } from '@shared/enum/share.enum';
import { EFileType } from '@/app/task-detail/modules/internal-note/utils/internal-note.enum';
import { InternalNoteService } from '@/app/task-detail/modules/internal-note/services/internal-note.service';
import { INoteDocument } from '@/app/task-detail/modules/internal-note/utils/internal-note.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { InternalNoteApiService } from '@/app/task-detail/modules/internal-note/services/internal-note-api.service';
import { TaskService } from '@services/task.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  takeUntil
} from 'rxjs';
import { SyncPropertyDocumentStatus } from '@shared/types/socket.interface';
import { ToastrService } from 'ngx-toastr';
import { SYNC_PT_FAIL, SYNC_PT_SUCCESSFULLY } from '@services/constants';
import { SharedService } from '@services/shared.service';
import { TaskItem } from '@shared/types/task.interface';
import { CompanyService } from '@services/company.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';

@Component({
  selector: 'document-note',
  templateUrl: './document-note.component.html',
  styleUrls: ['./document-note.component.scss']
})
export class DocumentNoteComponent implements OnInit, OnChanges {
  @Input() isShowFile: boolean = true;
  @Input() noteFile!: INoteDocument;
  @Input() size?: number;
  @Input() crmSystemId: string;
  @Output() fileEmit = new EventEmitter<any>();
  @Output() fileOnClicked = new EventEmitter<{
    state: boolean;
    imageId: string;
  }>();
  @Output() isVideoLoaded = new EventEmitter<boolean>();
  public fileIdDropdown: string;
  public fileType: string;
  public isShowActionButton: boolean = false;
  public visibleDropdownMenu = false;
  public isSyncing: boolean;
  public fileIcon;
  public isArchiveMailbox: boolean = false;
  readonly ECRMId = ECRMId;
  public EFileType = EFileType;
  public isShowAudioControl: boolean = false;
  public syncFileText: string = '';
  private destroy$ = new Subject<void>();
  readonly ESyncStatus = SyncPropertyDocumentStatus;
  public isConsole: boolean;
  public currentTask: TaskItem;
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;

  get selectedFileId() {
    return this.internalNoteService.selectedFileValue;
  }
  constructor(
    private filesService: FilesService,
    private internalNoteService: InternalNoteService,
    private agencyService: AgencyService,
    private internalNoteApiService: InternalNoteApiService,
    private taskService: TaskService,
    private websocketService: RxWebsocketService,
    private toastService: ToastrService,
    private sharedService: SharedService,
    private companyService: CompanyService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this._getTextSyncFile();
    this._subscriberSocketSyncDocument();
    this.subscribeCurrentTask();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['noteFile']?.currentValue) {
      this.isSyncing =
        this.noteFile?.syncPTStatus === SyncPropertyDocumentStatus.PENDING;
      const { mediaLink, name } = this.noteFile || {};
      this.noteFile = {
        ...this.noteFile,
        fileTypeString: this.filesService.getFileTypeDot(name),
        fileIcon: this.filesService.getFileIcon(name),
        linkVideo: this.filesService.generateThumbnailVideo(mediaLink)
      };
    }
  }

  subscribeCurrentTask() {
    this.taskService.currentTask$
      .pipe(
        takeUntil(this.destroy$),
        filter((task) => !!task)
      )
      .subscribe((task) => {
        this.currentTask = task;
      });
  }

  private _subscriberSocketSyncDocument() {
    const companyId$ = this.companyService
      .getCurrentCompanyId()
      .pipe(distinctUntilChanged());

    const dataSync$ =
      this.websocketService.onSocketNotifySyncPropertyDocumentToPT;

    combineLatest([companyId$, dataSync$])
      .pipe(
        filter(([companyId, dataSync]) => companyId === dataSync?.companyId),
        map(([_, dataSync]) => dataSync),
        filter((dataSync) => this.noteFile?.id == dataSync?.propertyDocumentId),
        takeUntil(this.destroy$)
      )
      .subscribe((dataSync) => {
        this.noteFile.syncPTStatus = dataSync?.status;
        this.noteFile.name = dataSync?.fileName || this.noteFile.name;
        this.isSyncing = false;
        if (dataSync?.status === SyncPropertyDocumentStatus.SUCCESS) {
          this.toastService.success(SYNC_PT_SUCCESSFULLY);
        } else {
          this.toastService.error(SYNC_PT_FAIL);
        }
      });
  }

  loadFile(fileId?: string) {
    if (
      this.filesService.getFileTypeSlash(this.noteFile.fileType?.name) ===
        'audio' &&
      this.filesService.getFileTypeDot(this.noteFile.name) === 'audio'
    ) {
      if (!this.isShowAudioControl && fileId)
        this.internalNoteService.setSelectedFile(fileId + '_');

      this.isShowAudioControl = !this.isShowAudioControl;
      return;
    }
    this.fileOnClicked.emit({ state: true, imageId: this.noteFile.id });
  }
  private _getTextSyncFile() {
    this.syncFileText =
      this.crmSystemId === ECRMId.PROPERTY_TREE
        ? 'Sync to Property Tree'
        : 'Sync to Rent Manager';
  }

  onVideoLoaded() {
    this.isVideoLoaded.emit(true);
  }

  shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      EButtonTask.TASK_CREATE_MESSAGE,
      EButtonType.TASK
    );
  }

  onForward(file) {
    if (!this.shouldHandleProcess()) return;
    this.fileEmit.emit(file);
  }

  onDownloadFile(mediaLink: string, name: string) {
    this.filesService.downloadResource(mediaLink, name);
  }

  handleSync(file) {
    if (this.currentTask.property?.isTemporary || this.isConsole) return;
    const payload = this.getPayloadToSyncDocument(file);
    this.isSyncing = true;
    this.internalNoteApiService.syncDocumentInternalNote(payload).subscribe();
  }

  getPayloadToSyncDocument(file) {
    const taskId = this.taskService.currentTask$.getValue().id;
    const agencyId = this.taskService.currentTask$.getValue().agencyId;
    return {
      taskId,
      syncDocumentInput: {
        internalFileId: file.id,
        agencyId,
        syncPTType: 'Property'
      }
    };
  }

  onDropdownVisibleChanged(event: boolean) {
    const _ = event
      ? (this.fileIdDropdown = this.noteFile?.id)
      : (this.fileIdDropdown = null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
