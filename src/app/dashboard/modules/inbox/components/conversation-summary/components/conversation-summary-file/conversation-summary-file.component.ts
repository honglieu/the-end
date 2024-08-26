import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { ConversationService } from '@/app/services/conversation.service';
import { FilesService } from '@/app/services/files.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  listCalendarTypeDot
} from '@/app/services/constants';
import {
  EConversationType,
  FileCarousel,
  IFile,
  ModalPopupPosition,
  PreviewConversation,
  TaskItem,
  TaskType
} from '@/app/shared';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ASSIGN_TO_MESSAGE } from '@/app/services/messages.constants';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';
import {
  EPageMessengerConnectStatus,
  PageFacebookMessengerType
} from '@/app/dashboard/shared/types/facebook-account.interface';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';
import { WhatsappService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp.service';
import { WhatsappAccountService } from '@/app/dashboard/services/whatsapp-account.service';
import { FacebookAccountService } from '@/app/dashboard/services/facebook-account.service';
import {
  PageWhatsAppType,
  WhatsAppConnectStatus
} from '@/app/dashboard/shared/types/whatsapp-account.interface';
import { FeaturesConfigPlan } from '@/app/console-setting/agencies/utils/console.type';

@Component({
  selector: 'conversation-summary-file',
  templateUrl: './conversation-summary-file.component.html',
  styleUrl: './conversation-summary-file.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationSummaryFileComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() listAudioFile: IFile[] | FileCarousel[] = [];
  @Input() currentConversation: PreviewConversation;
  @Input() currentTask: TaskItem;

  private readonly destroy$ = new Subject<void>();
  public arrayImageCarousel: FileCarousel[] | IFile[] = [];
  public initialIndex: number;
  public fileSelected;
  public contentText: string = '';
  public selectedFiles = [];
  public isShowCarousel: boolean = false;
  public isTaskType: boolean = false;
  public disabled: boolean = false;
  public isDisconnectedMailbox: boolean = false;
  public selectedFacebookMessenger: PageFacebookMessengerType;
  public selectedWhatsapp: PageWhatsAppType;
  public isArchiveMailbox: boolean = false;
  private features: FeaturesConfigPlan;
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

  readonly popupModalPosition = ModalPopupPosition;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly filesService: FilesService,
    private readonly messageFlowService: MessageFlowService,
    private readonly toastCustomService: ToastCustomService,
    private readonly converationSummaryService: ConverationSummaryService,
    public readonly inboxService: InboxService,
    public readonly conversationService: ConversationService,
    private readonly facebookService: FacebookService,
    private readonly whatsappService: WhatsappService,
    public readonly whatsappAccountService: WhatsappAccountService,
    public readonly facebookAccountService: FacebookAccountService
  ) {}

  ngOnInit() {
    this.getDisconnectArchivedMailBox();
    this.loadFileConversationSummary();

    this.facebookService.facebookMessengerSelected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.selectedFacebookMessenger = res;
      });

    this.whatsappService.whatsappSelected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.selectedWhatsapp = res;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentTask'] && changes['currentTask'].currentValue) {
      this.onChangeCurrentTask();
    }
    if (
      changes['listAudioFile'] &&
      changes['listAudioFile'].currentValue?.length
    ) {
      this.listAudioFile = this.listAudioFile.map((el) => ({
        ...el,
        extension: this.filesService.getFileExtensionWithoutDot(
          el.fileName || el.name
        ),
        propertyId: this.currentConversation?.propertyId,
        propertyStreetline: this.currentConversation?.streetline,
        fileType: this.filesService.getFileTypeDot(el.fileName || el.name),
        isTemporaryProperty: this.currentConversation?.isTemporaryProperty
      }));

      this.arrayImageCarousel = this.uniqueByPropertyDocumentId([
        ...this.arrayImageCarousel,
        ...this.listAudioFile
      ]);
    }
  }

  uniqueByPropertyDocumentId(arr) {
    const seen = new Set();
    return arr.filter((item) => {
      const duplicate = seen.has(item.propertyDocumentId);
      seen.add(item.propertyDocumentId);
      return !duplicate;
    });
  }

  onChangeCurrentTask() {
    this.isTaskType = this.currentTask?.taskType !== TaskType.MESSAGE;
    this.createNewConversationConfigs['otherConfigs.isCreateMessageType'] =
      !this.isTaskType;
    this.createNewConversationConfigs['footer.buttons.sendType'] = !this
      .isTaskType
      ? ISendMsgType.BULK_EVENT
      : '';
    this.createNewConversationConfigs['otherConfigs.createMessageFrom'] = this
      .isTaskType
      ? ECreateMessageFrom.TASK_HEADER
      : ECreateMessageFrom.SCRATCH;
  }

  getDisconnectArchivedMailBox() {
    combineLatest([
      this.inboxService.getIsDisconnectedMailbox(),
      this.inboxService.isArchiveMailbox$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
        this.isDisconnectedMailbox = isDisconnectedMailbox;
        if (
          [
            EConversationType.APP,
            EConversationType.VOICE_MAIL,
            EConversationType.EMAIL
          ].includes(this.currentConversation?.conversationType)
        ) {
          this.createNewConversationConfigs['footer.buttons.disableSendBtn'] = [
            isArchiveMailbox,
            isDisconnectedMailbox
          ].includes(true);
        }
      });
  }

  loadFileConversationSummary() {
    this.converationSummaryService.triggerLoadFileMsgSummary$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { file, selectedFileId } = res;
        const fileExtension =
          file?.extension ||
          this.filesService.getFileExtensionWithoutDot(
            file?.fileName || file.name
          );
        if (
          !listCalendarTypeDot
            .map((item) => item?.replace(/\./g, ''))
            .includes(fileExtension)
        ) {
          this.filesService
            .getFileListInConversation(this.currentConversation?.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe((res: FileCarousel[]) => {
              if (res && res.length) {
                this.isShowCarousel = true;
                this.arrayImageCarousel = res
                  .map((el) => ({
                    ...el,
                    extension: this.filesService.getFileExtensionWithoutDot(
                      el.fileName || el.name
                    ),
                    propertyId: this.currentConversation?.propertyId,
                    propertyStreetline: this.currentConversation?.streetline,
                    fileType: this.filesService.getFileTypeDot(el.fileName),
                    isTemporaryProperty:
                      this.currentConversation?.isTemporaryProperty,
                    isUnsupportedFile: !ACCEPT_ONLY_SUPPORTED_FILE.includes(
                      this.filesService.getFileExtensionWithoutDot(
                        el.fileName || el.name
                      )
                    )
                  }))
                  .filter((el) => {
                    return !listCalendarTypeDot
                      .map((item) => item?.replace(/\./g, ''))
                      .includes(el?.extension);
                  });

                this.initialIndex = this.arrayImageCarousel.findIndex(
                  (file) => file?.propertyDocumentId === selectedFileId
                );
              } else if (this.arrayImageCarousel.length) {
                this.isShowCarousel = true;
                this.initialIndex = this.arrayImageCarousel.findIndex(
                  (file) => file?.propertyDocumentId === selectedFileId
                );
              }
              this.cdr.markForCheck();
            });
        } else {
          this.isShowCarousel = false;
          this.initialIndex = null;
          this.filesService.downloadResource(
            file.mediaLink,
            file.fileName || file.name
          );
        }
      });
  }

  manageCarouselState(event) {
    this.isShowCarousel = event;
    this.initialIndex = null;
    this.filesService.setSyncedWidget(null);
  }

  handleShowTrudiSendMsg(event) {
    this.setStateTrudiSendMsg(this.fileSelected?.file);
    this.isShowCarousel = false;
  }

  handleFileEmit(file) {
    this.fileSelected = file;
    this.selectedFiles = [];
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
    const newFiles = {
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
    this.selectedFiles.push({ ...newFiles, isHideRemoveIcon: true });
    this.replaceMessageFile();
  }

  replaceMessageFile() {
    const fileName = this.selectedFiles?.[0]?.name?.split('.')?.[0];
    this.contentText = `Hi,\n\nPlease find the following file attached:\n\n •  ${fileName}\n\nIf you have any questions, please feel free to contact us.`;
    this.createNewConversationConfigs['inputs.rawMsg'] = this.contentText;
  }

  get isDisableSendBtn() {
    const isSelectedWhatsappArchived =
      this.selectedWhatsapp?.status === WhatsAppConnectStatus.ARCHIVED;
    const isSelectedWhatsappDisconnected =
      this.selectedWhatsapp?.status === WhatsAppConnectStatus.DISCONNECTED &&
      this.isDisconnectedMailbox;

    const isSelectedMessengerArchived =
      this.selectedFacebookMessenger?.status ===
      EPageMessengerConnectStatus.ARCHIVED;
    const isSelectedMessengerDisconnected =
      this.selectedFacebookMessenger?.status ===
        EPageMessengerConnectStatus.DISCONNECTED && this.isDisconnectedMailbox;

    return (
      isSelectedWhatsappArchived ||
      isSelectedWhatsappDisconnected ||
      isSelectedMessengerArchived ||
      isSelectedMessengerDisconnected
    );
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
      'body.prefillTitle': !this.currentConversation?.categoryName
        ? 'Fwd: File'
        : 'Fwd: ' + (this.currentConversation?.categoryName || ''),
      'footer.buttons.disableSendBtn': this.isDisableSendBtn
    };
  }

  // Forward message
  setStateTrudiSendMsg(file = null) {
    this.handleGetSelectedTask(file);
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

  async handleGetSelectedTask(file) {
    const currentTask = this.currentTask;
    const extraConfigs = {
      'header.title': this.isTaskType
        ? currentTask?.property?.streetline || 'No property'
        : null,
      'header.hideSelectProperty': this.isTaskType
    };
    if (file) {
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
        extraConfigs['body.prefillTitle'] =
          'Fwd: ' + (this.currentConversation?.categoryName || '');
        extraConfigs['header.hideSelectProperty'] = this.isTaskType
          ? !currentTask?.property?.isTemporary
          : false;
        extraConfigs['otherConfigs.conversationPropertyId'] = this.isTaskType
          ? this.currentConversation?.propertyId
          : null;
      }
    }

    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      ...extraConfigs
    };
    const tasks = [
      {
        taskId: currentTask?.id,
        propertyId: file?.propertyId || currentTask.property?.id
      }
    ];
    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      'inputs.rawMsg': this.contentText,
      'inputs.openFrom': !this.isTaskType ? TaskType.MESSAGE : '',
      'inputs.listOfFiles': this.selectedFiles,
      'inputs.selectedTasksForPrefill': tasks
    };
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.toastCustomService.handleShowToastMessSend(event);
        !this.isTaskType &&
          this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE);
        break;
      default:
        break;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
