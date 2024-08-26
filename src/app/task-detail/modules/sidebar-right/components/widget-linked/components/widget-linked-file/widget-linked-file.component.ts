import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { ConversationService } from '@/app/services/conversation.service';
import { FilesService } from '@/app/services/files.service';
import { TaskService } from '@/app/services/task.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { combineLatest, filter, Subject, takeUntil } from 'rxjs';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  listCalendarTypeDot
} from '@/app/services/constants';
import {
  FileCarousel,
  IFile,
  ModalPopupPosition,
  PreviewConversation,
  TaskType
} from '@/app/shared';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ASSIGN_TO_MESSAGE } from '@/app/services/messages.constants';
import { WidgetLinkedService } from '@/app/task-detail/modules/sidebar-right/services/widget-linked.service';

@Component({
  selector: 'widget-linked-file',
  templateUrl: './widget-linked-file.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WidgetLinkedFileComponent implements OnInit, OnDestroy {
  @Input() currentConversation: PreviewConversation;
  private readonly destroy$ = new Subject<void>();
  public arrayImageCarousel: FileCarousel[] | IFile[] = [];
  public initialIndex: number;
  public fileSelected;
  public contentText: string = '';
  public selectedFiles = [];
  public isShowCarousel: boolean = false;
  public isTaskType: boolean = false;
  public disabled: boolean = false;
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
    'inputs.isForwardDocument': false,
    'otherConfigs.isShowGreetingContent': false
  };

  readonly popupModalPosition = ModalPopupPosition;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly filesService: FilesService,
    private readonly messageFlowService: MessageFlowService,
    private readonly toastCustomService: ToastCustomService,
    private readonly widgetLinkedService: WidgetLinkedService,
    private readonly taskService: TaskService,
    public readonly inboxService: InboxService,
    public readonly conversationService: ConversationService
  ) {}

  ngOnInit() {
    this.loadFileConversationSummary();
    this.subscribeCurrentTask();
  }

  subscribeCurrentTask() {
    this.taskService.currentTask$
      .pipe(
        takeUntil(this.destroy$),
        filter((task) => Boolean(task))
      )
      .subscribe((currentTask) => {
        this.isTaskType = currentTask?.taskType !== TaskType.MESSAGE;
        this.createNewConversationConfigs['otherConfigs.isCreateMessageType'] =
          !this.isTaskType;
        this.createNewConversationConfigs['footer.buttons.sendType'] = !this
          .isTaskType
          ? ISendMsgType.BULK_EVENT
          : '';
        this.createNewConversationConfigs['otherConfigs.createMessageFrom'] =
          this.isTaskType
            ? ECreateMessageFrom.TASK_HEADER
            : ECreateMessageFrom.SCRATCH;
      });
  }

  loadFileConversationSummary() {
    this.widgetLinkedService.triggerLoadFile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { selectedFileId } = res;
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
            }
            this.cdr.markForCheck();
          });
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
    this.contentText = `Hi {receiver first name},\n\nPlease find the following file attached:\n\n •  ${fileName}\n\nIf you have any questions, please feel free to contact us.`;
    this.createNewConversationConfigs['inputs.rawMsg'] = this.contentText;
  }

  // Forward message
  setStateTrudiSendMsg(file = null) {
    this.handleGetSelectedTask(file);
    this.createNewConversationConfigs['inputs.isForwardDocument'] =
      file?.isForward;
    this.messageFlowService
      .openSendMsgModal(this.createNewConversationConfigs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs.type === ESendMessageModalOutput.MessageSent) {
          this.onSendMsg(rs.data);
        }
      });
  }

  async handleGetSelectedTask(file) {
    const currentTask = this.taskService.currentTask$.getValue();
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
        taskId: currentTask.id,
        propertyId: file?.propertyId || currentTask.property?.id
      }
    ];
    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      'inputs.rawMsg': this.contentText,
      'inputs.openFrom': !this.isTaskType ? TaskType.MESSAGE : '',
      'inputs.listOfFiles': this.selectedFiles,
      'inputs.selectedTasksForPrefill': tasks,
      'otherConfigs.isShowGreetingContent': !file
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
