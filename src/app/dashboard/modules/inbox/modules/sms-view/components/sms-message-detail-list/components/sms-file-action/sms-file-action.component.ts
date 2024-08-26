import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { CompanyService } from '@/app/services/company.service';
import { listThumbnailExtension } from '@/app/services/constants';
import { ConversationService } from '@/app/services/conversation.service';
import { FilesService } from '@/app/services/files.service';
import { RxWebsocketService } from '@/app/services/rx-websocket.service';
import { SharedService } from '@/app/services/shared.service';
import { TaskService } from '@/app/services/task.service';
import {
  FileMessage,
  IPropertyDocument,
  IPeopleFromViaEmail,
  SyncPropertyDocumentStatus,
  UserConversation
} from '@/app/shared';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  lastValueFrom,
  map,
  Subject,
  takeUntil
} from 'rxjs';

@Component({
  selector: 'sms-file-action',
  templateUrl: './sms-file-action.component.html',
  styleUrl: './sms-file-action.component.scss'
})
export class SmsFileActionComponent implements OnInit {
  @Input() message;
  @Output() showSelectPeople = new EventEmitter<IPeopleFromViaEmail>();
  @Output() fileEmit = new EventEmitter();

  private destroy$ = new Subject<void>();
  readonly ECRMSystem = ECRMSystem;
  public isSyncing: boolean = false;
  public isArchiveMailbox: boolean = false;
  public syncText: string;
  public currentConversation: UserConversation;
  public isConsole: boolean = false;
  public isDisConnectedMailbox: boolean = false;
  public fileType: string;
  public fileIcon: string;
  public linkMp4: string;
  public currentCompanyName: ECRMSystem;
  public showFileActionMenu: boolean = false;

  constructor(
    public filesService: FilesService,
    private taskService: TaskService,
    private companyService: CompanyService,
    private conversationService: ConversationService,
    private sharedService: SharedService,
    private inboxService: InboxService,
    private websocketService: RxWebsocketService
  ) {}
  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.subscribeCompanyCRMSystemName();
    this.subscribeCurrentConversation();
    this.subscribeMailboxStatus();
    this.setFileType();
    this.onSync();
  }

  setFileType() {
    if (!this.message?.file) return;
    const { name, fileType, mediaLink } = this.message.file;
    const fileTypeDot = this.filesService.getFileTypeDot(name);
    if (!fileType?.name && !fileTypeDot) return;
    this.fileType =
      this.filesService.getFileTypeSlash(fileType.name) || fileTypeDot;
    if (listThumbnailExtension.includes(fileTypeDot)) {
      this.fileType = fileTypeDot;
    }
    this.fileIcon = this.filesService.getFileIcon(name);
    this.linkMp4 = mediaLink + '#t=5';
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
          (dataSync) => this.message.file?.id == dataSync?.propertyDocumentId
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((dataSync) => {
        this.message.file.syncPTStatus = dataSync?.status;
        this.message.file.name = dataSync?.fileName || this.message?.file?.name;
        this.isSyncing = false;
        this.filesService.setSyncedWidget(null);
      });
  }

  subscribeMailboxStatus() {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isDisConnect: boolean) => (this.isDisConnectedMailbox = isDisConnect)
      );
  }

  subscribeCurrentConversation() {
    this.conversationService.currentConversation
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversation) => {
        this.currentConversation = conversation;
      });
  }

  subscribeCompanyCRMSystemName() {
    this.companyService.currentCompanyCRMSystemName
      .pipe(filter(Boolean), takeUntil(this.destroy$))
      .subscribe((CRMSystemName) => {
        this.currentCompanyName = CRMSystemName;
        switch (CRMSystemName) {
          case ECRMSystem.PROPERTY_TREE:
            this.syncText = 'Sync to Property Tree';
            break;
          case ECRMSystem.RENT_MANAGER:
            this.syncText = 'Sync to Rent Manager';
            break;
        }
      });
  }

  subscribeSyncedWidget() {
    this.filesService.getSyncedWidget
      .pipe(takeUntil(this.destroy$))
      .subscribe((fileId) => {
        const selectedFileId = this.message.file?.id === fileId;
        if (selectedFileId) {
          this.isSyncing = true;
        }
      });
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
    if (this.disableSync) return;
    try {
      this.isSyncing = true;
      this.filesService.setSyncedWidget(file.id);
      file.syncPTStatus = SyncPropertyDocumentStatus.PENDING;
      let response;
      const payload = {
        conversationId: file.conversationId || this.message.conversationId,
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
        response.status !== SyncPropertyDocumentStatus.PENDING
      ) {
        file.syncPTStatus = response.syncPTStatus;
        this.filesService.setSyncedWidget(null);
      }
    } catch (error) {
      console.error(error);
    }
  }

  fileActionMenuVisibleChange(visible: boolean) {
    this.showFileActionMenu = visible;
  }

  get disableSync() {
    return (
      this.isArchiveMailbox ||
      this.isDisConnectedMailbox ||
      this.currentConversation?.isTemporaryProperty ||
      this.isSyncing ||
      this.isConsole
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
