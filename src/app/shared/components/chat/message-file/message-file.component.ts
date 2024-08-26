import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  lastValueFrom,
  map,
  takeUntil
} from 'rxjs';
import { ALLOWED_MEDIA, listThumbnailExtension } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { DragDropFilesService } from '@services/drag-drop.service';
import { FilesService } from '@services/files.service';
import { TaskService } from '@services/task.service';
import {
  FileMessage,
  IPeopleFromViaEmail,
  IPropertyDocument
} from '@shared/types/message.interface';
import { SyncPropertyDocumentStatus } from '@shared/types/socket.interface';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { MessageService } from '@services/message.service';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { SharedService } from '@services/shared.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { CompanyService } from '@services/company.service';
import { UserConversation } from '@shared/types/conversation.interface';
import { EButtonTask, EButtonType } from '@trudi-ui';
import {
  EReactionStatus,
  EUserSendType
} from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.enum';
@Component({
  selector: 'app-message-file',
  templateUrl: './message-file.component.html',
  styleUrls: ['./message-file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageFileComponent implements OnInit, OnDestroy, OnChanges {
  @Input() dropdownPlacement: string = 'bottomRight';
  @Input() message: any | null = null;
  @Input() messageFile!: FileMessage | IPropertyDocument;
  @Input() isShowFile = true;
  @Input() widthInPercent?: number = 100;
  @Input() grayBorder? = false;
  @Input() showBoxShadow? = true;
  @Input() size?: number;
  @Input() isShowActionButton: boolean = false;
  @Input() isShowActionButtonInside: boolean = false;
  @Input() isSending: boolean = false;
  @Input() isFileFromFolder: boolean = false;
  @Input() canReply: boolean = false;
  @Input() isAppMessage: boolean = false;
  @Input() isLoadingFile: boolean = false;
  @Input() isSms = false;
  @Input() isTicketRequest = false;
  @Input() isShowReaction = true;
  @Output() isVideoLoaded = new EventEmitter<boolean>();
  @Output() fileEmit = new EventEmitter<any>();
  @Output() loadFileFromFolder = new EventEmitter();
  @Output() fileOnClicked = new EventEmitter<{
    state: boolean;
    imageId: string;
  }>();
  readonly EUserSendType = EUserSendType;
  readonly EReactionStatus = EReactionStatus;
  @Output() showSelectPeople = new EventEmitter<IPeopleFromViaEmail>();
  public isSyncing: boolean;
  public fileIdDropdown: string;
  public date: string;
  public fileType: string;
  public fileIcon: string;
  public linkMp4: string;
  public fileSelected: any;
  public visibleDropdownMenu = false;
  public isShowAudioControl: boolean = false;
  SyncPropertyDocumentStatus = SyncPropertyDocumentStatus;
  readonly CRMSystemName = ECRMSystem;
  public currentCompanyName: ECRMSystem;
  public isConsole: boolean;
  public isArchiveMailbox: boolean = false;
  public isDisConnectedMailbox: boolean = false;
  public fileRegex = /\.(ics)$/;
  public currentConversation: UserConversation;
  public fileExtension: string;
  private destroy$ = new Subject<void>();
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;
  get selectedFileId() {
    return this.messageService.selectedFileIdBS.value;
  }

  constructor(
    public filesService: FilesService,
    public conversationService: ConversationService,
    public agentUserService: AgentUserService,
    public dropService: DragDropFilesService,
    public taskService: TaskService,
    private websocketService: RxWebsocketService,
    private messageService: MessageService,
    private sharedService: SharedService,
    private inboxService: InboxService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['messageFile']?.currentValue) {
      const file = changes['messageFile'].currentValue;
      this.isSyncing = file?.syncPTStatus == SyncPropertyDocumentStatus.PENDING;
      if (!this.messageFile?.fileType && !this.messageFile?.name) {
        this.isShowFile = false;
      }
      if (this.isShowFile) {
        this.date = file?.fileType?.updatedAt || file.createdAt;
      }
      this.setFileType();
      this.fileExtension = this.filesService.getFileExtensionWithoutDot(
        this.messageFile?.name
      );
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isDisConnect: boolean) => (this.isDisConnectedMailbox = isDisConnect)
      );
    this.setFileType();
    this.onSync();
    this.companyService.currentCompanyCRMSystemName
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.currentCompanyName = res;
        }
      });
    this.conversationService.currentConversation
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversation) => {
        this.currentConversation = conversation;
      });

    this.filesService.getSyncedWidget
      .pipe(takeUntil(this.destroy$))
      .subscribe((fileId) => {
        const selectedFileId = this.messageFile?.id === fileId;
        if (selectedFileId) {
          this.isSyncing = true;
        }
      });
  }

  private onSync() {
    const company$ = this.companyService
      .getCurrentCompanyId()
      .pipe(distinctUntilChanged());

    const dataSync$ =
      this.websocketService.onSocketNotifySyncPropertyDocumentToPT;

    combineLatest([company$, dataSync$])
      .pipe(
        filter(([companyId, dataSync]) => companyId === dataSync?.companyId),
        map(([_, dataSync]) => dataSync),
        filter(
          (dataSync) => this.messageFile?.id == dataSync?.propertyDocumentId
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((dataSync) => {
        this.messageFile.syncPTStatus = dataSync?.status;
        this.messageFile.name = dataSync?.fileName || this.messageFile.name;
        this.isSyncing = false;
        this.filesService.setSyncedWidget(null);
      });
  }

  setFileType() {
    const fileTypeDot = this.filesService.getFileTypeDot(this.messageFile.name);
    if (!this.messageFile?.fileType?.name && !fileTypeDot) return;
    this.fileType =
      this.filesService.getFileTypeSlash(this.messageFile.fileType?.name) ||
      fileTypeDot;
    if (listThumbnailExtension.includes(fileTypeDot)) {
      this.fileType = fileTypeDot;
    }
    this.fileIcon = this.filesService.getFileIcon(this.messageFile.name);
    this.getThumbnailMP4(this.messageFile.mediaLink);
  }

  loadFile(fileId?: string) {
    if (this.isLoadingFile) return;
    if (this.isFileFromFolder) {
      this.loadFileFromFolder.emit();
      return;
    }
    if (
      this.filesService.getFileTypeSlash(this.messageFile.fileType?.name) ===
        'audio' &&
      this.filesService.getFileTypeDot(this.messageFile.name) === 'audio'
    ) {
      if (!this.isShowAudioControl && fileId)
        this.messageService.selectedFileIdBS.next(fileId + '_');

      this.isShowAudioControl = !this.isShowAudioControl;
      return;
    } else if (
      this.fileRegex.test(this.messageFile.name) ||
      this.unSupportVideoFile()
    ) {
      this.filesService.downloadResource(
        this.messageFile.mediaLink,
        this.messageFile.name
      );
      return;
    }
    this.fileOnClicked.emit({ state: true, imageId: this.messageFile.id });
  }

  unSupportVideoFile() {
    return (
      this.isSms &&
      this.filesService.getFileTypeSlash(this.messageFile.fileType?.name) ===
        'video' &&
      !this.isAllowedMedia('video')
    );
  }

  getThumbnailMP4(link: string) {
    this.linkMp4 = link + '#t=5';
  }

  onVideoLoaded() {
    this.isVideoLoaded.emit(true);
  }

  onForward(item: FileMessage | IPropertyDocument) {
    let type: IPeopleFromViaEmail['type'] = 'SEND_LANDLORD';
    if (item.documentTypeId === '34db2b6c-5f88-4323-8dad-f0682838e5f4') {
      type = 'SEND_INVOICE';
    }
    this.message.file = { ...this.message.file, isForward: true };
    this.fileEmit.emit(this.message);
    this.showSelectPeople.emit({
      file: { ...item, isForward: true } as FileMessage,
      type
    });
  }

  async handleSync(file) {
    if (this.isArchiveMailbox) return;
    try {
      this.isSyncing = true;
      this.filesService.setSyncedWidget(file.id);
      file.syncPTStatus = SyncPropertyDocumentStatus.PENDING;
      let response;
      const payload = {
        conversationId: !file.isUserUpload
          ? file.conversationId || this.message.conversationId
          : null,
        propertyDocumentId: file.id,
        agencyId: this.taskService.currentTask$?.getValue()?.agencyId,
        taskId: this.taskService.currentTask$?.getValue()?.id
      };
      if (this.currentCompanyName === ECRMSystem.PROPERTY_TREE) {
        response = await lastValueFrom(
          this.filesService.syncToPropertyTree(payload)
        );
      } else {
        response = await lastValueFrom(
          this.filesService.syncToRentManager(payload)
        );
      }

      if (
        response?.status in SyncPropertyDocumentStatus &&
        response.status != SyncPropertyDocumentStatus.PENDING
      ) {
        file.syncPTStatus = response.syncPTStatus;
        this.filesService.setSyncedWidget(null);
      }
    } catch (error) {
      console.error(error);
    }
  }

  onDropdownVisibleChanged(event: boolean) {
    const _ = event
      ? (this.fileIdDropdown = this.messageFile?.id)
      : (this.fileIdDropdown = null);
  }

  handleImgError($event: Event) {
    ($event.target as HTMLImageElement).src =
      '/assets/icon/icon-loading-image.svg';
  }

  onInsideActionButtonClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  private isAllowedMedia(mediaType: 'audio' | 'video') {
    if (!this.messageFile?.name || !mediaType) return false;

    const allowedMedia = ALLOWED_MEDIA[mediaType].types;

    return allowedMedia.some((type) =>
      this.messageFile.name.toLowerCase().endsWith(type)
    );
  }
}
