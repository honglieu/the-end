import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { TitleCasePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import dayjs from 'dayjs';
import { Subject, combineLatest, lastValueFrom } from 'rxjs';
import {
  delay,
  distinctUntilChanged,
  filter,
  switchMap,
  takeUntil
} from 'rxjs/operators';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { firstCapitalizeWords } from '@core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { CompanyService } from '@services/company.service';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  listCalendarTypeDot,
  SUPPORTED_FILE_CAROUSEL,
  TIME_FORMAT
} from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { DragDropFilesService } from '@services/drag-drop.service';
import { FileTabTypes, FileTypes, FilesService } from '@services/files.service';
import { MessageService } from '@services/message.service';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { PopupService, PopupState } from '@services/popup.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { WidgetType } from '@shared/enum/widget.enum';
import { FormatDatePipe } from '@shared/pipes/format-date';
import { ICompany } from '@shared/types/company.interface';
import { EFileOrigin, FileCarousel, IFile } from '@shared/types/file.interface';
import { FileMessage } from '@shared/types/message.interface';
import { Property } from '@shared/types/property.interface';
import { SyncPropertyDocumentStatus } from '@shared/types/socket.interface';
import { TaskItem } from '@shared/types/task.interface';
import { AgentFileProp } from '@shared/types/user-file.interface';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';

export interface ConversationDocument {
  userId?: string;
  propertyName: string;
  propertyType?: EUserPropertyType;
  userType?: EUserPropertyType;
  userName: string;
  documents: Document[];
}

interface Document {
  createdAt: string;
  fileType: { icon: string; name: string };
  id: string;
  isUserUpload: boolean;
  mediaLink: string;
  name: string;
  size: string;
  canUpload?: boolean;
  uploaded?: boolean;
  thumbMediaLink: string;
  user: { id: string; firstName: string; lastName: string };
  syncPTStatus?: SyncPropertyDocumentStatus;
}

@Component({
  selector: 'file-panel',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('doneList', { static: true }) doneList:
    | string
    | CdkDropList
    | (string | CdkDropList);
  connectedParent: string | CdkDropList | (string | CdkDropList)[];
  @Output() isLoading: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() filesCount: EventEmitter<number> = new EventEmitter<number>();
  @Output() filesCallCount: EventEmitter<number> = new EventEmitter<number>();

  @Input() widgetType: WidgetType;
  @Input() isStopAudio: boolean;
  @Input() e2eData: string = '';

  public widgetTypeEnum = WidgetType;
  public fileOriginEnum = EFileOrigin;

  private unsubscribe = new Subject<void>();
  public currentProperty: Property;
  public tabList = FileTabTypes;
  public fileTypes = FileTypes;

  public listofActiveFiles: any;
  public listofUserFiles: Array<any> = [];
  public listofAgentFiles: Array<any> = [];
  public listAgentFile: AgentFileProp[] = [];
  public isShowSendMessageModal = false;
  public resetSendMessageModal = false;
  public isSendFile = false;
  public currentConversation: any;
  public emptyContent = false;
  public interval: any;

  public selectedFileToEdit: any;
  public popupModalPosition = ModalPopupPosition;
  public fileIdDropdown: string;
  public isShowAddFileModal = false;
  public selectedFile: any;
  public selectedFiles: IFile[] = [];
  public selectedUsersFromPopup = [];
  public fileSelected: any;
  public isShowModal = false;
  public isShowQuitConfirmModal = false;
  public isShowModalDeleteFile = false;
  public isShowSuccessMessageModal = false;
  private indexFileDelete: number;
  public isShowCarousel = false;
  public initialIndex: number;
  public arrayImageCarousel: FileCarousel[] = [];
  public showTooltip = true;
  public isResetFile = false;
  public agentFileID = '';
  public currentTaskDeleted: boolean = false;
  public conversationId: string = '';
  public callFiles: Array<Document> = [];
  public taskType: TaskType;
  public taskFilesGroupByConversation: ConversationDocument[] = [];
  SyncPropertyDocumentStatus = SyncPropertyDocumentStatus;
  public isCarousel: boolean = false;
  public isForward: boolean = false;
  public reversePopup: boolean = false;
  public contentText: string = '';
  public sendFileConfigs = {
    'header.title': 'Send File',
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'body.prefillReceivers': true,
    'body.tinyEditor.attachBtn.disabled': false
  };

  fileListTemp: AgentFileProp[] = [];
  TIME_FORMAT = TIME_FORMAT;
  TaskType = TaskType;

  public currentCompany: ICompany;
  public isFileFocused: boolean;
  titleCasePipe = new TitleCasePipe();
  readonly CRMSystemName = ECRMSystem;
  public currentAgencyName: ECRMSystem;
  public isArchiveMailbox: boolean = false;
  public isConsole: boolean;
  public isDisConnectedMailbox: boolean = false;
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
  get selectedFileId() {
    return this.messageService.selectedFileIdBS.value;
  }
  createNewConversationConfigs = {
    'header.hideSelectProperty': true,
    'header.title': null,
    'header.showDropdown': false,
    'body.prefillReceivers': false,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'footer.buttons.disableSendBtn': false,
    'otherConfigs.isCreateMessageType': false,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.SCRATCH,
    'otherConfigs.isShowGreetingContent': false,
    'inputs.appendBody': true,
    'inputs.listOfFiles': [],
    'inputs.selectedTasksForPrefill': [],
    'inputs.rawMsg': '',
    'inputs.openFrom': '',
    'inputs.isForwardDocument': false
  };
  currentTask: TaskItem;
  isPTEnvironment: boolean = false;
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;

  constructor(
    public filesService: FilesService,
    private router: Router,
    private popupService: PopupService,
    private activatedRoute: ActivatedRoute,
    private ref: ChangeDetectorRef,
    public conversationService: ConversationService,
    public agentUserService: AgentUserService,
    public userService: UserService,
    public dropService: DragDropFilesService,
    public taskService: TaskService,
    private toastCustomService: ToastCustomService,
    private websocketService: RxWebsocketService,
    private messageService: MessageService,
    private formatDate: FormatDatePipe,
    public inboxService: InboxService,
    private sharedService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService,
    private taskApiService: TaskApiService,
    private companyService: CompanyService,
    private inboxToolbarService: InboxToolbarService,
    private messageFlowService: MessageFlowService,
    private PreventButtonService: PreventButtonService
  ) {}

  ngOnDestroy() {
    this.dropService.setChildRendered(false);
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['isStopAudio']?.currentValue) {
      this.onCloseAudioControl();
    }
  }

  async handleGetSelectedTask(file) {
    const currentTask = this.taskService.currentTask$.getValue();
    const isTaskType = this.taskType === TaskType.TASK;
    const extraConfigs = {
      'header.title': isTaskType
        ? currentTask?.property?.streetline || 'No property'
        : null,
      'header.hideSelectProperty': isTaskType,
      'otherConfigs.isCreateMessageType': !isTaskType
    };
    if (file) {
      extraConfigs['header.title'] = file.propertyStreetline || null;
      extraConfigs['header.isPrefillProperty'] = true;
      extraConfigs['header.hideSelectProperty'] = !file.isTemporaryProperty;
      extraConfigs['otherConfigs.conversationPropertyId'] =
        file.propertyId || null;
    }

    const tasks = [
      {
        taskId: currentTask.id,
        propertyId: file.propertyId || currentTask?.property?.id
      }
    ];
    console.log('file', file);

    console.log('!file', !file);

    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      ...extraConfigs,
      'inputs.openFrom':
        this.taskType === TaskType.MESSAGE
          ? this.taskType
          : TaskType.SEND_FILES,
      'inputs.rawMsg': this.contentText,
      'inputs.listOfFiles': [file],
      'inputs.selectedTasksForPrefill': tasks,
      'otherConfigs.isShowGreetingContent': !file
    };
  }

  handleConnectDragDropFile() {
    this.dropService.setChildRendered(true);
    this.dropService.allRendered
      .pipe(takeUntil(this.unsubscribe), delay(100))
      .subscribe({
        next: (allRendered) => {
          if (!allRendered) return;
          this.dropService.setChildConnector(this.doneList);
          this.connectedParent = [this.dropService.parentConnector];
        },
        complete: () => {
          this.dropService.setChildRendered(false);
        }
      });
  }

  ngOnInit() {
    this.handleConnectDragDropFile();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (isDisConnect: boolean) => (this.isDisConnectedMailbox = isDisConnect)
      );
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.isLoading.emit(true);
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((param) => {
        if (!param) return;
        this.taskType = param.get('type') as TaskType;
        this.conversationId = param.get('conversationId');
      });

    this.subscribeFiles();

    this.taskService.currentTask$
      .pipe(
        filter((res) => !!res),
        takeUntil(this.unsubscribe)
      )
      .subscribe((value) => {
        this.currentTask = value;
        const isMessageType = value?.taskType === TaskType.MESSAGE;
        this.sendFileConfigs['otherConfigs.isCreateMessageType'] =
          isMessageType;
        this.sendFileConfigs['footer.buttons.sendType'] = isMessageType
          ? ISendMsgType.BULK_EVENT
          : '';
        if (!this.taskType) {
          this.taskType = value?.taskType;
        }
      });

    this.messageService.isActiveCallMessage.subscribe(() => {
      this.messageService.selectedFileIdBS.next('');
    });
    this.subscribeSocketUploadFile();
    this.subscribeSocketSyncFile();
    this.companyService.currentCompanyCRMSystemName
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.currentAgencyName = res;
        }
      });

    this.popupService.isResetFile$.subscribe((data) => {
      if (data) {
        this.filesService.setSyncedWidget(null);
      }
    });

    this.filesService.getSyncedWidget
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((idSelected) => {
        if (this.taskFilesGroupByConversation) {
          this.taskFilesGroupByConversation.forEach((fileConversation) => {
            if (fileConversation.documents) {
              fileConversation.documents = fileConversation?.documents?.map(
                (file) => {
                  if (file?.id === idSelected) {
                    return {
                      ...file,
                      syncPTStatus: SyncPropertyDocumentStatus.PENDING
                    };
                  }
                  return file;
                }
              );
            }
          });
        }
      });
    this.createNewConversationConfigs['otherConfigs.createMessageFrom'] =
      this.taskType === TaskType.TASK
        ? ECreateMessageFrom.TASK_HEADER
        : ECreateMessageFrom.SCRATCH;

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentCompany) => {
        this.isPTEnvironment =
          this.companyService.isPropertyTreeCRM(currentCompany);
      });
  }

  subscribeFiles() {
    const taskId$ = this.taskService.currentTaskId$.pipe(
      takeUntil(this.unsubscribe),
      filter(Boolean),
      distinctUntilChanged()
    );

    // Reload attachments
    if (this.widgetType === WidgetType.Attachment) {
      combineLatest([taskId$, this.filesService.reloadAttachments])
        .pipe(takeUntil(this.unsubscribe), filter(Boolean))
        .subscribe(() => {
          this.getDocumentByWidget(this.widgetType);
        });
    }
  }

  async getDocumentByWidget(widgetType: WidgetType) {
    const taskId = this.taskService.currentTaskId$.getValue();
    if (!taskId) return;

    try {
      switch (widgetType) {
        case WidgetType.Call:
          const files = await lastValueFrom(
            this.filesService.getConversationCallDocuments(taskId)
          );
          if (Array.isArray(files)) {
            this.callFiles = files
              .map((file) => {
                file.propertyId = file.property.id;
                file.propertyStreetline = file.property.streetline;
                file.isTemporaryProperty = file.property.isTemporary;
                file.fileTypeDot = this.filesService.getFileTypeDot(file.name);
                file.thumbnail = this.filesService.getThumbnail(file);
                file.syncPTStatus ||= SyncPropertyDocumentStatus.FAILED;
                if (file.fileOrigin === EFileOrigin.voice_mail) {
                  file.name = `Voicemail - ${this.formatDate.transform(
                    file.createdAt
                  )}`;
                }
                return file;
              })
              .sort(
                (firstFile, secondFile) =>
                  new Date(secondFile?.createdAt).getTime() -
                  new Date(firstFile?.createdAt).getTime()
              );
          }
          this.isLoading.emit(false);
          this.filesCallCount.emit(this.callFiles.length);
          this.filesService.setCallFiles(this.callFiles);
          break;
        case WidgetType.Attachment:
          const _ = await this.getAttachmentsByTask(taskId);
          const totalDocuments = this.taskFilesGroupByConversation.reduce(
            (total, item) => total + item.documents.length,
            0
          );
          this.isLoading.emit(false);
          this.filesCount.emit(totalDocuments);
          break;
        default:
          this.callFiles = [];
          this.taskFilesGroupByConversation = [];
          break;
      }
    } catch (error) {
      throw error;
    }
  }

  private subscribeSocketSyncFile() {
    const companyId$ = this.companyService
      .getCurrentCompanyId()
      .pipe(distinctUntilChanged());
    const dataSync$ =
      this.websocketService.onSocketNotifySyncPropertyDocumentToPT;

    combineLatest([companyId$, dataSync$])
      .pipe(
        filter(([companyId, dataSync]) => companyId === dataSync?.companyId),
        takeUntil(this.unsubscribe)
      )
      .subscribe(([_, dataSync]) => {
        const findFileChanges = () => {
          const finder = (file: { id: string }) =>
            file?.id === dataSync?.propertyDocumentId;

          const fileCall = this.callFiles.find(finder);
          if (fileCall) return fileCall;

          const attachments = this.taskFilesGroupByConversation
            ?.map((group) => group?.documents)
            ?.flat();
          return attachments?.find(finder);
        };

        const fileChange = findFileChanges();
        if (fileChange) {
          fileChange.syncPTStatus = dataSync.status;
          fileChange.name = dataSync?.fileName || fileChange.name;
        }
      });
  }

  private subscribeSocketUploadFile() {
    switch (this.widgetType) {
      case WidgetType.Attachment:
        this.websocketService.onSocketFileUpload
          .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
          .subscribe((res) => {
            const taskId = this.taskService.currentTaskId$.getValue();
            if (res?.taskIds?.length > 0 && res?.taskIds?.includes(taskId)) {
              this.isLoading.emit(false);
              this.getDocumentByWidget(WidgetType.Attachment);
            }
          });
        break;
      case WidgetType.Call:
        this.websocketService.onSocketFileCall
          .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
          .subscribe((res) => {
            const taskId = this.taskService.currentTaskId$.getValue();
            if (res?.taskIds?.length > 0 && res?.taskIds?.includes(taskId)) {
              this.isLoading.emit(false);
              this.getDocumentByWidget(WidgetType.Call);
            }
          });
        break;
      default:
        break;
    }
  }

  async getAttachmentsByTask(taskId: string) {
    const response = await lastValueFrom(
      this.filesService.getAttacmentsByTask(taskId)
    );
    this.filesService.setAttachmentFilesDocument(response);
    this.taskFilesGroupByConversation = this.sortDocument(
      this.getDocumentFormatted(response.documents)
    );

    this.taskFilesGroupByConversation =
      this.taskFilesGroupByConversation.filter(
        (item) => item.documents?.length
      );
    if (response.docusignDocuments?.length) {
      const docusignDocs: ConversationDocument[] = [
        {
          propertyName: 'DocuSign',
          userName: '',
          documents: response.docusignDocuments.map((item) => {
            item.fileTypeDot = this.filesService.getFileTypeDot(item.name);
            item.thumbnail = this.filesService.getThumbnail(item);
            return item;
          })
        }
      ];

      this.taskFilesGroupByConversation = [
        ...this.taskFilesGroupByConversation,
        ...docusignDocs
      ];
    }
  }

  getPropertyName(docGroup) {
    let propertyName = '';
    let isFirstCapitalize = true;
    if (docGroup.userType === EUserPropertyType.LEAD) {
      propertyName = 'PM';
      isFirstCapitalize = false;
    }
    if (docGroup.userType === EUserPropertyType.SUPPLIER) {
      propertyName = 'Supplier';
    } else if (docGroup.userType === EUserPropertyType.OTHER) {
      propertyName = docGroup?.contactType || '';
    } else if (docGroup.propertyType === EUserPropertyType.TENANT) {
      propertyName = 'Tenant';
    } else if (docGroup.propertyType === EUserPropertyType.EXTERNAL) {
      propertyName = 'External';
    } else if (USER_TYPE_IN_RM[docGroup.propertyType]) {
      propertyName = USER_TYPE_IN_RM[docGroup.propertyType];
    } else {
      propertyName = 'PM';
    }
    return isFirstCapitalize
      ? firstCapitalizeWords(propertyName)
      : propertyName;
  }

  getDocumentFormatted(documents) {
    return documents.map((docGroup) => {
      return {
        propertyName: this.getPropertyName(docGroup),
        userName: this.getUserName(docGroup.firstName, docGroup.lastName),
        userPropertyContactType: docGroup?.userPropertyContactType,
        userType: docGroup.userType,
        propertyType: docGroup.propertyType,
        isPrimary: docGroup.isPrimary,
        userId: docGroup.userId,
        documents: docGroup.propertyDocuments
          .map((item) => {
            item.uploaded = item.uploaded ?? true;
            item.fileTypeDot = this.filesService.getFileTypeDot(item.name);
            item.thumbnail = this.filesService.getThumbnail(item);
            item.conversationId = docGroup.conversationId;
            item.fileIcon = this.filesService.getFileIcon(item?.name);
            item.isFromAttachmentWidget = true;
            item.propertyId = docGroup.propertyId;
            item.propertyStreetline = docGroup.streetline;
            item.isTemporaryProperty = docGroup.isTemporary;
            return item;
          })
          .sort(
            (a, b) =>
              new Date(a?.createdAt).getTime() -
              new Date(b?.createdAt).getTime()
          )
      };
    });
  }

  addAttachmentsToTask(files) {
    const currentUser = this.userService.getUserInfo();
    files = files.map((file) => {
      const fileTypeDot = this.filesService.getFileTypeDot(file.name);
      const thumbnail = this.filesService.getThumbnail({
        ...file,
        fileTypeDot
      });
      const conversationId = null;
      const fileIcon = this.filesService.getFileIcon(file?.name);
      const isFromAttachmentWidget = true;
      const propertyId = file.propertyId;
      const propertyStreetline = currentUser.streetline;
      const isTemporaryProperty = currentUser.isTemporary;
      return {
        mediaLink: file.mediaLink,
        thumbMediaLink: null,
        userId: null,
        canUpload: file.canUpload,
        uploaded: file.uploaded,
        id: file.id,
        name: file.name,
        overFileSize: file.overFileSize,
        invalidFile: file.invalidFile,
        size: file.size,
        localThumb: file.localThumb,
        createdAt: new Date().toISOString(),
        syncPTStatus: 'NOT_SYNC',
        fileTypeDot,
        thumbnail,
        conversationId,
        fileIcon,
        isFromAttachmentWidget,
        propertyId,
        propertyStreetline,
        isTemporaryProperty,
        fileType: {
          icon: this.filesService.getFileIcon(file.name),
          name: file.type
        },
        user: null
      };
    });

    const tmp = {
      userId: currentUser.id,
      userName: this.getUserName(currentUser.firstName, currentUser.lastName),
      propertyType: null,
      userType: currentUser.type,
      propertyName: this.getPropertyName({
        userType: currentUser.type,
        propertyType: null,
        contactType: null
      }),
      userPropertyContactType: null,
      isPrimary: null,
      documents: files
    };
    const fileGroup = this.taskFilesGroupByConversation.find(
      (item) => item.userId === tmp.userId
    );
    if (fileGroup) {
      const newList = this.taskFilesGroupByConversation.map((group) => {
        if (fileGroup.userId === group.userId)
          return {
            ...group,
            documents: [...group.documents, ...files]
          };
        return group;
      });
      this.taskFilesGroupByConversation = this.sortDocument(newList);
    } else {
      this.taskFilesGroupByConversation = this.sortDocument([
        ...this.taskFilesGroupByConversation,
        tmp as ConversationDocument
      ]);
    }
    this.updateFileCounts();
  }

  updateFileCounts() {
    const totalDocuments = this.taskFilesGroupByConversation.reduce(
      (total, item) => total + item.documents.length,
      0
    );
    this.filesCount.emit(totalDocuments);
  }

  sortDocument(documentData: ConversationDocument[]) {
    return documentData.sort((x, y) => {
      const sortType =
        this.findTypeIndex(x.propertyType || x.userType) -
        this.findTypeIndex(y.propertyType || y.userType);
      if (sortType === 0) {
        const nameX = `${x.userName}`.toUpperCase();
        const nameY = `${y.userName}`.toUpperCase();
        if (nameX < nameY) return -1;
        if (nameX > nameY) return 1;
      }
      return sortType;
    });
  }

  findTypeIndex(type: EUserPropertyType) {
    const orderType = [
      EUserPropertyType.LANDLORD,
      EUserPropertyType.TENANT,
      EUserPropertyType.SUPPLIER,
      EUserPropertyType.OTHER,
      EUserPropertyType.EXTERNAL,
      EUserPropertyType.UNIDENTIFIED,
      EUserPropertyType.TENANT_PROSPECT,
      EUserPropertyType.LANDLORD_PROSPECT,
      EUserPropertyType.TENANT_PROPERTY,
      EUserPropertyType.TENANT_UNIT,
      EUserPropertyType.LEAD
    ];
    const index = orderType.findIndex((item) => item === type);
    return index < 0 ? orderType.length : index;
  }

  drop(_event: CdkDragDrop<AgentFileProp[]>) {
    this.dropService.detectDropEnded(true);
  }

  onDragging(item: AgentFileProp) {
    let listRole: string[] = [];
    if (item.userPropertyFilePermissions?.length > 0) {
      item.userPropertyFilePermissions.forEach((permission) => {
        listRole = [...listRole, permission.userProperty.userId];
      });
    } else {
      listRole = [''];
    }
    this.filesService.onFileDragging(listRole);
  }

  onMouseOver(item: AgentFileProp) {
    this.agentFileID === item.id
      ? this.agentFileID
      : (this.agentFileID = item.id);
    this.showTooltip = true;
  }

  changeTab(tab) {
    this.filesService.changeTab(tab);
  }

  addFile() {
    this.router.navigate([`add-document/${this.currentProperty.id}`]);
  }

  formatData(data) {
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.getValue();
    return dayjs(data).format(DATE_FORMAT_DAYJS);
  }

  openAddFile(status: boolean) {
    this.selectedFileToEdit = null;
    this.popupService.isShowAddFileArea.next({
      display: status,
      resetField: true
    });
    this.isShowAddFileModal = status;
  }

  goToDetails(id: string) {
    this.router.navigate([`show-document/${this.currentProperty.id}/${id}`]);
  }

  getThumbnailOnError(event, file) {
    event.target.src = file.fileType
      ? 'assets/images/icons/' + file.fileType?.icon
      : '/assets/icon/question-mark.svg';
  }

  onViewFile(file) {
    window.open(file.mediaLink, '_blank');
  }

  onCloseAudioControl() {
    this.messageService.selectedFileIdBS.next('');
  }

  shouldHandleProcess(buttonKey: EButtonTask): boolean {
    return this.PreventButtonService.shouldHandleProcess(
      buttonKey,
      EButtonType.TASK
    );
  }
  manageCarouselState(event: boolean, files?: any, selectedFileId?: string) {
    if (!this.shouldHandleProcess(EButtonTask.VIEW_FILE)) return;
    if (!event) {
      this.isShowCarousel = event;
      this.isCarousel = event;
      this.initialIndex = null;
      this.arrayImageCarousel = [];
      return;
    }

    const selectedFile = files.find((file) => file.id === selectedFileId);

    if (!selectedFile) {
      return;
    }

    if (selectedFile.fileTypeDot == 'audio') {
      if (this.selectedFileId === selectedFileId) {
        this.messageService.selectedFileIdBS.next('');
      } else {
        this.messageService.selectedFileIdBS.next(selectedFileId);
      }
      return;
    }
    this.arrayImageCarousel = files
      .map((file) => ({
        ...file,
        propertyId: file.propertyId,
        propertyStreetline: file.propertyStreetline,
        isTemporaryProperty: file.isTemporaryProperty,
        propertyDocumentId: file.id,
        fileTypeName: file.fileType?.name,
        fileName: file.title || file.name,
        fileType: file.fileTypeDot,
        extension: this.filesService.getFileExtensionWithoutDot(
          file.fileName || file.name
        ),
        isUnsupportedFile: !SUPPORTED_FILE_CAROUSEL.includes(
          this.filesService.getFileExtensionWithoutDot(
            file?.fileName || file?.name
          )
        )
      }))
      .filter((el) => {
        return !listCalendarTypeDot
          .map((item) => item?.replace(/\./g, ''))
          .includes(el?.extension);
      });

    this.initialIndex = this.arrayImageCarousel.findIndex(
      (file) => file.propertyDocumentId === selectedFileId
    );

    if (this.initialIndex === -1) {
      this.filesService.downloadResource(
        selectedFile?.mediaLink,
        selectedFile?.fileName || selectedFile?.name
      );
    } else {
      this.isShowCarousel = event;
      this.isCarousel = event;
    }
  }

  handleAction(e: MouseEvent) {
    e?.stopPropagation();
  }

  handleSendMsgFlow() {
    this.messageFlowService
      .openSendMsgModal(this.createNewConversationConfigs)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs.type === ESendMessageModalOutput.MessageSent) {
          this.onSendMsg(rs.data);
        }
      });
  }

  onSendFile(file) {
    if (!this.shouldHandleProcess(EButtonTask.TASK_CREATE_MESSAGE)) return;
    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      'inputs.isForwardDocument': true,
      'header.title':
        this.taskService.currentTask$?.getValue()?.property?.streetline ||
        this.taskService.currentTask$?.getValue()?.property
          ?.shortenStreetline ||
        null
    };
    this.popupService.isResetFile$.next(false);
    this.selectedFiles = [];
    this.fileSelected = {
      ...file,
      icon: file.fileType?.icon,
      isHideRemoveIcon: true
    };
    if (file.fileOrigin === EFileOrigin.voice_mail && file.fileType?.name) {
      this.fileSelected.name = `${this.fileSelected.name}.${file.fileType.name
        .split('/')
        ?.pop()}`;
    }

    this.selectedFiles.push(this.fileSelected);
    this.inboxToolbarService.setInboxItem([]);
    this.replaceMessageFile();
    this.handleGetSelectedTask(file);
    this.handleSendMsgFlow();
  }

  showSelectPeople(status: boolean, message = this.selectedFile) {
    if (status) {
      this.handleGetSelectedTask(this.selectedFile);
      this.isShowSendMessageModal = false;
    } else {
      this.isSendFile = false;
      this.selectedUsersFromPopup = [];
      if (this.isCarousel) this.isShowCarousel = true;
    }
  }

  showBackAppSend(status: PopupState) {
    if (status.resetField) {
      this.selectedFiles = [];
      this.resetSendMessageModal = true;
    }
    if (status.display) {
      this.isShowSendMessageModal = true;
      this.userService.getUserInfo();
      this.resetSendMessageModal = status.resetField;
      this.isShowQuitConfirmModal = false;
      this.isSendFile = false;
    } else {
      this.fileSelected = null;
      this.selectedFiles = [];
      this.isShowSendMessageModal = false;
    }
  }

  async handleSync(arrayFile?: FileMessage[], selectId?: string) {
    if (this.isArchiveMailbox) return;
    try {
      const selectItem = arrayFile.find((file) => file.id === selectId);
      if (selectItem) {
        selectItem.syncPTStatus = SyncPropertyDocumentStatus.PENDING;
        this.filesService.setSyncedWidget(selectItem.id);
        let response;
        const payload = {
          conversationId: !selectItem.isUserUpload
            ? selectItem.conversationId || this.conversationId
            : null,
          propertyDocumentId: selectItem.id,
          agencyId: this.taskService.currentTask$?.getValue()?.agencyId,
          taskId: this.taskService.currentTask$?.getValue()?.id
        };
        if (this.currentAgencyName === ECRMSystem.PROPERTY_TREE) {
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
          selectItem.syncPTStatus = response.syncPTStatus;
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  showAppSendMessage(status: PopupState) {
    this.isResetFile = this.popupService.isResetFile$.getValue();
    if (status.resetField) {
      this.selectedFiles = [];
      this.resetSendMessageModal = true;
    }
    if (status.display) {
      this.isShowSendMessageModal = true;
      this.userService.getUserInfo();
      this.resetSendMessageModal = status.resetField;
      this.isShowQuitConfirmModal = false;
      this.isSendFile = false;
      if (
        (!this.isResetFile || status.fileTabNotReset) &&
        !this.selectedFiles.some((el) => el.id === this.fileSelected.id)
      ) {
        this.selectedFiles.push(this.fileSelected);
      }
    } else {
      this.fileSelected = null;
      this.selectedFiles = [];
      this.isShowSendMessageModal = false;
    }
  }

  getSelectedUser(event) {
    this.selectedUsersFromPopup = event;
  }

  removeFile(item) {
    this.taskFilesGroupByConversation = this.taskFilesGroupByConversation
      .map((group) => {
        const newDoc = group.documents.filter((doc) => doc.id !== item.id);
        return {
          ...group,
          documents: newDoc
        };
      })
      .filter((group) => group.documents.length);
    this.updateFileCounts();
  }

  handleRemoveFileItem(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  openDeleteFile(status: boolean) {
    if (status) {
      this.isShowModalDeleteFile = true;
    } else {
      this.isShowModalDeleteFile = false;
    }
  }

  onOpenPopupDelete(index: number, item: AgentFileProp) {
    if (index > -1) {
      this.isShowModalDeleteFile = true;
      this.indexFileDelete = index;
    }
  }

  onDeleteFile(status: boolean) {
    this.isShowModalDeleteFile = false;
    if (status) {
      this.filesService
        .deleteDocument(this.callFiles[this.indexFileDelete].id)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(() => {
          this.callFiles.splice(this.indexFileDelete, 1);
          this.ref.markForCheck();
          this.indexFileDelete = null;
        });
    }
  }

  showQuitConfirm(status: boolean) {
    if (status) {
      this.resetSendMessageModal = false;
      this.isSendFile = false;
      this.isShowSendMessageModal = false;
      this.isShowQuitConfirmModal = true;
    } else {
      this.isShowQuitConfirmModal = false;
      this.agentUserService.setIsCloseAllModal(true);
      this.selectedFile = [];
    }
  }

  showSuccessMessageModal(status: boolean) {
    if (status) {
      this.isShowSendMessageModal = true;
      this.userService.getUserInfo();
      this.resetSendMessageModal = true;
    } else {
      this.isShowSendMessageModal = false;
      this.isShowSuccessMessageModal = true;
      setTimeout(() => {
        this.isShowSuccessMessageModal = false;
      }, 3000);
    }
  }

  replaceMessageFile() {
    const fileName =
      this.selectedFiles[0]?.name?.split('.')[0] ??
      this.fileSelected?.name?.split('.')[0];
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentCompany) => {
        let rawMessage = `Hi,\n\nPlease find the following file attached:\n\n •  ${fileName}\n\nIf you have any questions, please feel free to contact us.`;
        this.contentText = rawMessage;
      });
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.isSendFile = false;
        if (event.isDraft) {
          return;
        }
        this.toastCustomService.handleShowToastMessSend(event);
        if (this.taskType === TaskType.MESSAGE) {
          this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE);
        }
        break;
      default:
        break;
    }
  }

  getUserName(firstName: string, lastName: string) {
    if (!firstName) return lastName;
    if (!lastName) return firstName;
    return `${firstName} ${lastName}`;
  }

  handleFileEmit(file) {
    this.fileSelected = file.file;
    this.isForward = file.file.isForward;
    this.replaceMessageFile();
    this.handleGetSelectedTask(this.fileSelected);
    this.handleSendMsgFlow();
  }
  handleShowSelecPeoplePopup(event) {
    this.isSendFile = event;
    this.isShowCarousel = false;
    this.inboxToolbarService.setInboxItem([]);
  }

  fileTrackBy(_: number, file) {
    return file.id;
  }

  handleMenuVisibleChange(event: boolean, file) {
    this.fileIdDropdown = event ? file.id : null;
  }
}
