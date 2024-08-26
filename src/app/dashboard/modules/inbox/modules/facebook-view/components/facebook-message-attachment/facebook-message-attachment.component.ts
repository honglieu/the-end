import {
  FileMessage,
  IPeopleFromViaEmail,
  IPropertyDocument,
  PreviewConversation,
  SyncPropertyDocumentStatus
} from '@/app/shared';
import {
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
import { IFacebookMessage } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import {
  EReactionStatus,
  EUserSendType
} from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.enum';
import {
  FilesService,
  RxWebsocketService,
  SharedService,
  TaskService
} from '@/app/services';
import { CompanyService } from '@services/company.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  lastValueFrom,
  map,
  Subject,
  takeUntil
} from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';

@Component({
  selector: 'facebook-message-attachment',
  templateUrl: './facebook-message-attachment.component.html',
  styleUrl: './facebook-message-attachment.component.scss'
})
export class FacebookMessageAttachmentComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() listFileMessage: FileMessage[];
  @Input() message: IFacebookMessage;
  @Input() currentConversation: PreviewConversation;
  @Input() isSending: boolean = false;
  @Input() isUserVerified: boolean = false;
  @Input() isLoadingFile: boolean = false;
  @Input() dropdownPlacement: string = 'bottomRight';
  @Input() isFileFromFolder: boolean = false;
  @Output() fileOnClicked = new EventEmitter<{
    state: boolean;
    imageId: string;
  }>();
  @Output() fileEmit = new EventEmitter<FileMessage[]>();
  @Output() showSelectPeople = new EventEmitter<{
    files: FileMessage[];
    type: 'SEND_INVOICE' | 'SEND_LANDLORD';
  }>();
  readonly EReactionStatus = EReactionStatus;
  readonly EButtonType = EButtonType;
  readonly EButtonTask = EButtonTask;
  readonly CRMSystemName = ECRMSystem;
  readonly EUserSendType = EUserSendType;
  SyncPropertyDocumentStatus = SyncPropertyDocumentStatus;
  public currentCompanyName: ECRMSystem;
  public fileIdDropdown: string;
  public visibleDropdownMenu = false;
  public isConsole: boolean;
  public isDisConnectedMailbox: boolean = false;
  public isArchiveMailbox: boolean = false;
  public isSyncing: boolean;
  private destroy$ = new Subject<void>();
  constructor(
    private filesService: FilesService,
    private companyService: CompanyService,
    private sharedService: SharedService,
    private inboxService: InboxService,
    public taskService: TaskService,
    private websocketService: RxWebsocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['listFileMessage']?.currentValue) {
      const files = changes['listFileMessage'].currentValue;
      this.isSyncing = files.some(
        (file) => file.syncPTStatus == SyncPropertyDocumentStatus.PENDING
      );
    }
  }

  ngOnInit(): void {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.isConsole = this.sharedService.isConsoleUsers();
    this.companyService.currentCompanyCRMSystemName
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.currentCompanyName = res;
        }
      });
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isDisConnect: boolean) => (this.isDisConnectedMailbox = isDisConnect)
      );
    this.onSync();
  }

  onInsideActionButtonClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  handleClickDownloadFile(): void {
    this.listFileMessage.forEach((file) => {
      this.filesService.downloadResource(file.mediaLink, file.name);
    });
  }

  async handleSyncAll(): Promise<void> {
    this.isSyncing = true;
    this.filesService.setSyncedWidget(null);
    for (const file of this.listFileMessage) {
      await this.handleSync(file);
    }
  }

  async handleSync(file) {
    if (this.isArchiveMailbox) return;
    try {
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
        takeUntil(this.destroy$)
      )
      .subscribe((dataSync) => {
        const index = this.listFileMessage.findIndex(
          (file) => file.id == dataSync?.propertyDocumentId
        );
        const file = this.listFileMessage[index];
        if (index !== -1) {
          file.syncPTStatus = dataSync?.status;
          file.name = dataSync?.fileName || file.name;
        }
        this.listFileMessage[index] = { ...file };
        if (this.isSyncedAll()) {
          this.isSyncing = false;
          this.filesService.setSyncedWidget(null);
        }
        this.cdr.detectChanges();
      });
  }

  isSyncedAll(): boolean {
    return this.listFileMessage.every(
      (file) => file.syncPTStatus !== SyncPropertyDocumentStatus.PENDING
    );
  }

  onForward() {
    let type: IPeopleFromViaEmail['type'] = 'SEND_LANDLORD';
    const isHaveInvoice = this.listFileMessage.some(
      (file) => file.documentTypeId === '34db2b6c-5f88-4323-8dad-f0682838e5f4'
    );
    if (isHaveInvoice) {
      type = 'SEND_INVOICE';
    }

    this.message.files.fileList.forEach((file) => {
      file.isForward = true;
    });

    this.message.files.mediaList.forEach((file) => {
      file.isForward = true;
    });
    this.message.files.unSupportedList.forEach((file) => {
      file.isForward = true;
    });
    this.listFileMessage.forEach((file) => {
      file.isForward = true;
    });
    this.fileEmit.emit(this.listFileMessage);
    this.showSelectPeople.emit({
      files: this.listFileMessage,
      type
    });
  }

  handleFileClick(event): void {
    this.fileOnClicked.emit(event);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
