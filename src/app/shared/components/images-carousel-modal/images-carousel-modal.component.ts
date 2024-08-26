import { ImageFileMetadata } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  listCalendarTypeDot
} from '@/app/services/constants';
import { ConversationService } from '@/app/services/conversation.service';
import { FilesService } from '@/app/services/files.service';
import { ASSIGN_TO_MESSAGE } from '@/app/services/messages.constants';
import { TaskService } from '@/app/services/task.service';
import {
  FileCarousel,
  IFile,
  ModalPopupPosition,
  PreviewConversation,
  TaskType
} from '@/app/shared';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { BehaviorSubject, combineLatest, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-images-carousel-modal',
  templateUrl: './images-carousel-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImagesCarouselModalComponent implements OnInit, OnDestroy {
  private _files: FileCarousel[];
  @Input() set files(val: ImageFileMetadata[]) {
    this._files = val.map((file) => ({
      ...file,
      propertyDocumentId: file.id,
      fileName: file.name,
      fileType: file.fileType.name
    }));
  }
  get files(): FileCarousel[] {
    return this._files;
  }

  @Input() currentConversation: PreviewConversation;
  @Input() file: ImageFileMetadata;
  @Input() ignore: boolean = false;
  @Output() afterClose = new EventEmitter();

  private readonly destroy$ = new Subject<void>();
  public isShowCarousel$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public imageCarousels: FileCarousel[] | IFile[] = [];
  public initialIndex: number;
  readonly popupModalPosition = ModalPopupPosition;
  public fileSelected;
  public contentText: string = '';
  public selectedFiles = [];
  public isTaskType = false;
  private createNewConversationConfigs = {
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
    'inputs.rawMsg': '',
    'inputs.openFrom': '',
    'inputs.listOfFiles': [],
    'inputs.selectedTasksForPrefill': null,
    'inputs.isForwardDocument': false
  };

  constructor(
    private cdr: ChangeDetectorRef,
    public conversationService: ConversationService,
    private filesService: FilesService,
    public inboxService: InboxService,
    private taskService: TaskService,
    private messageFlowService: MessageFlowService,
    private toastCustomService: ToastCustomService
  ) {}

  ngOnInit() {
    this.getDisconnectArchivedMailBox();
    this.loadFileConversationSummary();
    this.isShowCarousel$.subscribe((val) => !val && this.afterClose.emit());
  }

  getDisconnectArchivedMailBox() {
    combineLatest([
      this.inboxService.getIsDisconnectedMailbox(),
      this.inboxService.isArchiveMailbox$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
        this.createNewConversationConfigs['footer.buttons.disableSendBtn'] = [
          isArchiveMailbox,
          isDisconnectedMailbox
        ].includes(true);
      });
  }
  mapToImageCarouselItem = (file) => {
    const extension = this.filesService.getFileExtensionWithoutDot(
      file.fileName || file.name
    );
    const propertyId = this.currentConversation?.propertyId;
    const propertyStreetline = this.currentConversation?.streetline;
    const fileType = this.filesService.getFileTypeDot(file.fileName);
    const isTemporaryProperty = this.currentConversation?.isTemporaryProperty;
    const isUnsupportedFile = !ACCEPT_ONLY_SUPPORTED_FILE.includes(
      this.filesService.getFileExtensionWithoutDot(file.name)
    );

    return {
      ...file,
      extension,
      propertyId,
      propertyStreetline,
      fileType,
      isTemporaryProperty,
      isUnsupportedFile
    };
  };

  // Function to filter supported carousel files
  filterSupportedCarouselFiles(item): boolean {
    return !listCalendarTypeDot?.includes(item?.extension);
  }

  getFileListInConversation(selectedFileId) {
    this.imageCarousels = this.files
      ?.map(this.mapToImageCarouselItem)
      ?.filter(this.filterSupportedCarouselFiles);

    this.initialIndex = this.imageCarousels.findIndex(
      (file) => file?.propertyDocumentId === selectedFileId
    );
  }

  loadFileConversationSummary() {
    if (this.filterSupportedCarouselFiles(this.file)) {
      this.getFileListInConversation(this.file.id);
      this.isShowCarousel$.next(true);
    } else {
      this.isShowCarousel$.next(false);
      this.initialIndex = null;
      this.filesService.downloadResource(this.file.mediaLink, this.file.name);
    }
  }

  manageCarouselState(event) {
    this.isShowCarousel$.next(event);
    this.initialIndex = null;
    this.filesService.setSyncedWidget(null);
  }

  handleShowTrudiSendMsg(event) {
    this.setStateTrudiSendMsg(this.fileSelected?.file);
    this.isShowCarousel$.next(false);
  }

  handleFileEmit(file) {
    this.fileSelected = file;
    this.selectedFiles = [];
    const newFile = this.mapSelectedFileData(file);
    this.selectedFiles.push({
      ...newFile,
      isHideRemoveIcon: true
    });
    this.replaceMessageFile();
  }

  mapSelectedFileData(file) {
    const {
      createdAt,
      fileType,
      id,
      isUserUpload,
      mediaLink,
      name,
      size,
      thumbMediaLink,
      propertyId,
      isTemporaryProperty,
      propertyStreetline,
      isForward
    } = file.file;
    return {
      createdAt,
      fileType,
      icon: fileType?.icon,
      id,
      isUserUpload,
      mediaLink,
      name,
      size,
      thumbMediaLink,
      propertyId,
      isTemporaryProperty,
      propertyStreetline,
      isForward
    };
  }

  replaceMessageFile() {
    const fileName = this.selectedFiles?.[0]?.name?.split('.')?.[0];
    this.contentText = `Hi,\n\nPlease find the following file attached:\n\n •  ${fileName}\n\nIf you have any questions, please feel free to contact us.`;
    this.createNewConversationConfigs['inputs.rawMsg'] = this.contentText;
  }

  getConfigSendMsg(file) {
    return {
      ...this.createNewConversationConfigs,
      'inputs.openFrom': file ? TaskType.SEND_FILES : '',
      'header.isPrefillProperty': true,
      'header.title': '',
      'inputs.isForwardDocument': file?.isForward,
      'inputs.isAppMessage': false,
      'otherConfigs.isCreateMessageType': true,
      'otherConfigs.createMessageFrom': ECreateMessageFrom.SCRATCH,
      'otherConfigs.isValidSigContentMsg': false,
      'otherConfigs.conversationPropertyId': null,
      'otherConfigs.isShowGreetingContent': !file,
      'body.autoGenerateMessage': null,
      'body.isFromInlineMsg': false,
      'header.hideSelectProperty': false,
      'body.prefillTitle':
        'Fwd: ' + (this.currentConversation?.categoryName || '')
    };
  }

  // Forward message
  setStateTrudiSendMsg(file = null) {
    this.handleGetSelectedTask(file);
    this.createNewConversationConfigs['inputs.isForwardDocument'] =
      file?.isForward;
    const configs = this.getConfigSendMsg(file);
    this.messageFlowService
      .openSendMsgModal(configs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs.type === ESendMessageModalOutput.MessageSent) {
          this.onSendMsg(rs.data);
        }
      });
  }

  getInitExtraConfigs(currentTask) {
    const streetline = currentTask?.property?.streetline || 'No property';
    const title = this.isTaskType ? streetline : null;
    return {
      'header.title': title,
      'header.hideSelectProperty': this.isTaskType
    };
  }

  updateExtraConfig(extraConfigs, file, currentTask) {
    extraConfigs['header.title'] = file.propertyStreetline || null;
    extraConfigs['header.isPrefillProperty'] = true;
    extraConfigs['header.hideSelectProperty'] = !file.isTemporaryProperty;
    extraConfigs['otherConfigs.conversationPropertyId'] =
      file.propertyId || null;

    if (file.isForward) {
      extraConfigs['header.title'] =
        this.isTaskType && !currentTask?.property?.isTemporary
          ? currentTask?.property?.streetline
          : '';

      extraConfigs['body.prefillTitle'] = `Fwd: ${
        this.currentConversation?.categoryName || ''
      }`;

      extraConfigs['header.hideSelectProperty'] = this.isTaskType
        ? !currentTask?.property?.isTemporary
        : false;

      extraConfigs['otherConfigs.conversationPropertyId'] = this.isTaskType
        ? this.currentConversation?.propertyId
        : null;
    }
  }

  updateCreateNewConversationConfigs(extraConfigs, file, currentTask) {
    const tasks = [
      {
        taskId: currentTask.id,
        propertyId: file?.propertyId || currentTask.property?.id
      }
    ];

    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      ...extraConfigs,
      'inputs.rawMsg': this.contentText,
      'inputs.openFrom': this.isTaskType ? '' : TaskType.MESSAGE,
      'inputs.listOfFiles': this.selectedFiles,
      'inputs.selectedTasksForPrefill': tasks
    };
  }

  async handleGetSelectedTask(file) {
    const currentTask = this.taskService.currentTask$.getValue();
    const extraConfigs = this.getInitExtraConfigs(currentTask);

    if (file) {
      this.updateExtraConfig(extraConfigs, file, currentTask);
    }

    this.updateCreateNewConversationConfigs(extraConfigs, file, currentTask);
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    if (event.event !== ESentMsgEvent.SUCCESS) return;
    this.toastCustomService.handleShowToastMessSend(event);
    !this.isTaskType &&
      this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
