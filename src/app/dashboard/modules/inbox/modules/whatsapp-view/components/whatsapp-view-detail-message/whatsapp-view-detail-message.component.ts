import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  listCalendarTypeDot
} from '@/app/services/constants';
import { FilesService } from '@/app/services/files.service';
import { PropertiesService } from '@/app/services/properties.service';
import { EMessageType, EUserPropertyType, TaskType } from '@/app/shared/enum';
import { FileCarousel } from '@/app/shared/types/file.interface';
import { FileMessage } from '@/app/shared/types/message.interface';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ASSIGN_TO_MESSAGE } from '@/app/services/messages.constants';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import {
  ModalPopupPosition,
  PreviewConversation,
  TaskItem
} from '@/app/shared';
import { IWhatsappMessage } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import {
  EUserSendType,
  EFileEventEmitType
} from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.enum';

@Component({
  selector: 'whatsapp-view-detail-message',
  templateUrl: './whatsapp-view-detail-message.component.html',
  styleUrl: './whatsapp-view-detail-message.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhatsappViewDetailMessageComponent implements OnChanges {
  @Input() message: IWhatsappMessage;
  @Input() isHighlighted: boolean = true;
  @Input() currentConversation: PreviewConversation;
  @Input() currentTask: TaskItem;
  @Input() isUserVerified: boolean = false;
  @Output() reSendMessage = new EventEmitter();
  readonly EMessageType = EMessageType;
  arrayImageCarousel: FileCarousel[] = [];
  isShowCarousel: boolean = false;
  isCarousel: boolean = false;
  isShowTrudiSendMsg: boolean = false;
  initialIndex: number;
  contentText: string = '';
  fileSelected;
  selectedFiles = [];
  fileMessage: FileMessage;
  isForward: boolean = false;
  popupModalPosition = ModalPopupPosition;

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
    'otherConfigs.createMessageFrom': ECreateMessageFrom.APP_MESSAGE,
    'inputs.rawMsg': '',
    'inputs.openFrom': '',
    'inputs.listOfFiles': [],
    'inputs.selectedTasksForPrefill': null,
    'inputs.isForwardDocument': false,
    'inputs.isAppMessage': true
  };
  private destroy$ = new Subject<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']?.currentValue) {
      if (this.message.messageType === EMessageType.agentJoin) {
        this.message.firstName =
          this.message.type === EUserSendType.PAGE
            ? 'A property manager'
            : this.message?.firstName === 'Trudi'
            ? 'Trudi®, AI Assistant'
            : this.message?.firstName;
      }
      if (
        this.message.messageType === EMessageType.reopened &&
        this.message.userType !== EUserPropertyType.LEAD
      ) {
        this.message.firstName = this.message.channelUserName;
        this.message.lastName = null;
      }

      if (
        this.message.files.fileList.length ||
        this.message.files.mediaList.length ||
        this.message.files.unSupportedList.length
      ) {
        this.fileMessage =
          this.message.files.fileList?.[0] ||
          this.message.files.mediaList?.[0] ||
          this.message.files.unSupportedList?.[0];
      }
    }
  }

  constructor(
    public readonly propertiesService: PropertiesService,
    private readonly filesService: FilesService,
    private readonly messageFlowService: MessageFlowService,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly toastCustomService: ToastCustomService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  manageCarouselState(event) {
    if (event.state) {
      this.filesService
        .getFileListInConversation(this.currentConversation.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: FileCarousel[]) => {
          if (res && res.length) {
            this.arrayImageCarousel = res
              .map((el) => ({
                ...el,
                propertyId: this.currentConversation?.propertyId,
                propertyStreetline: this.currentConversation?.streetline,
                isTemporaryProperty:
                  this.currentConversation?.isTemporaryProperty,
                fileType: this.filesService.getFileTypeDot(el.fileName),
                extension: this.filesService.getFileExtensionWithoutDot(
                  el.fileName || el.name
                ),
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
              (el) => el.propertyDocumentId === event.imageId
            );
            if (this.initialIndex === -1) {
              const fileDownload = res?.find(
                (item) => item?.propertyDocumentId === event?.imageId
              );
              this.filesService.downloadResource(
                fileDownload?.mediaLink,
                fileDownload?.fileName || fileDownload?.name
              );
            } else {
              this.isShowCarousel = event.state;
              this.isCarousel = event.state;
            }
            this.cdr.markForCheck();
          }
        });
    } else {
      this.isShowCarousel = event.state;
      this.isCarousel = event.state;
      this.initialIndex = null;
    }
  }

  openForwardMessageModal(data: { file: FileMessage; type: string }) {
    this.setStateTrudiSendMsg(data?.file);
  }

  setStateTrudiSendMsg(file = null) {
    this.isShowTrudiSendMsg = true;
    this.inboxToolbarService.setInboxItem([]);
    this.handleGetSelectedTask(file);
    const configs = {
      ...this.createNewConversationConfigs,
      'header.isPrefillProperty': true,
      'header.title': '',
      'inputs.isForwardDocument': file?.isForward,
      'inputs.isAppMessage': false,
      'otherConfigs.isCreateMessageType': true,
      'otherConfigs.createMessageFrom': ECreateMessageFrom.SCRATCH,
      'otherConfigs.isValidSigContentMsg': false,
      'otherConfigs.conversationPropertyId': null,
      'body.autoGenerateMessage': null,
      'body.isFromInlineMsg': false,
      'header.hideSelectProperty': false,
      'body.prefillTitle': 'Fwd: ' + 'File'
    };
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
    const extraConfigs = {
      'header.title': null,
      'header.hideSelectProperty': false
    };
    if (file) {
      extraConfigs['header.title'] = file.propertyStreetline || null;
      extraConfigs['header.isPrefillProperty'] = true;
      extraConfigs['header.hideSelectProperty'] = !file.isTemporaryProperty;
      extraConfigs['otherConfigs.conversationPropertyId'] =
        file.propertyId || null;
      if (file.isForward) {
        extraConfigs['header.title'] = '';
        extraConfigs['body.prefillTitle'] = 'Fwd: ' + 'File';
        extraConfigs['header.hideSelectProperty'] = false;
        extraConfigs['otherConfigs.conversationPropertyId'] = null;
      }
    }

    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      ...extraConfigs
    };
    const tasks = [
      {
        taskId: this.currentTask?.id,
        propertyId: file?.propertyId || this.currentTask?.property?.id
      }
    ];
    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      'inputs.rawMsg': this.contentText,
      'inputs.openFrom': TaskType.MESSAGE,
      'inputs.listOfFiles': this.selectedFiles,
      'inputs.selectedTasksForPrefill': tasks
    };
  }

  handleFileEmit(file) {
    this.fileSelected = file;
    this.selectedFiles = [];
    this.isForward = file.file.isForward;
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
    const fileName = this.selectedFiles[0]?.name?.split('.')[0];
    this.contentText = `Please find the following file attached:\n\n •  ${fileName}\n\nIf you have any questions, please feel free to contact us.`;
    this.createNewConversationConfigs['inputs.rawMsg'] = this.contentText;
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.isShowTrudiSendMsg = false;
        this.toastCustomService.handleShowToastMessSend(event);
        this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE);
        break;
      default:
        break;
    }
  }

  handleFileEvent($event) {
    switch ($event.type) {
      case EFileEventEmitType.MANAGE_CAROUSEL:
        this.manageCarouselState($event.event);
        break;
      case EFileEventEmitType.FORWARD_ATTACHMENT:
        this.openForwardMessageModal($event.event);
        break;
      case EFileEventEmitType.FILE_EMIT:
        this.handleFileEmit($event.event);
        break;
      default:
        break;
    }
  }

  onResendTheMessage(event: Event, id: string): void {
    event?.stopPropagation();
    this.reSendMessage.emit(id);
  }

  handleShowTrudiSendMsg(event) {
    this.setStateTrudiSendMsg(this.fileSelected?.file);
    this.inboxToolbarService.setInboxItem([]);
    this.isShowCarousel = false;
  }
}
