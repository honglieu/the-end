import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { AISummaryFacadeService } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary-facade.service';
import { FilesService } from '@/app/services/files.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { PreviewConversation } from '@/app/shared/types/conversation.interface';
import {
  ESentMsgEvent,
  ISendMsgSchedule,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { EMailBoxStatus, EPage, SocketType, TaskType } from '@/app/shared/enum';
import {
  EButtonTask,
  EButtonType,
  PreventButtonService,
  TaskStatusType
} from '@trudi-ui';
import { collapseMotion } from '@core/animation/collapse';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  listThumbnailExtension
} from '@/app/services/constants';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';
import { IConversationSummaryItem } from '@/app/dashboard/modules/inbox/components/conversation-summary/interface/conversation-summary';
import { TaskService } from '@/app/services';
import { IFile } from '@/app/shared';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { ToastrService } from 'ngx-toastr';
import { EConversationType } from '@shared/enum';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'conversation-summary-item',
  templateUrl: './conversation-summary-item.component.html',
  styleUrl: './conversation-summary-item.component.scss',
  animations: [collapseMotion],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationSummaryItemComponent
  implements OnInit, OnChanges, OnDestroy
{
  @ViewChildren('requestDetail') requestDetails: QueryList<ElementRef>;
  @ViewChild('scrollContainer') scrollContainer: ElementRef;
  @ViewChild('attachmentsListTemp') attachmentsListTemp: ElementRef;
  @ViewChild('conversationSummary') conversationSummary: ElementRef;

  @Input() message: IConversationSummaryItem;
  @Input() inputTaskType: TaskType;
  @Input() currentConversation: PreviewConversation;
  @Input() isExpandConversationSummary: boolean;
  @Input() selectedTicketId: string;
  @Input() showAttachment: boolean = false;
  @Input() emailVerified: string = '';

  private readonly destroy$ = new Subject<void>();
  private widgetAiSummaryConfigs = {
    'footer.buttons.showBackBtn': false,
    'header.title': null,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'otherConfigs.isCreateMessageType': false,
    'otherConfigs.isForwardConversation': true,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.TASK_HEADER,
    'inputs.openFrom': '',
    'inputs.listOfFiles': [],
    'inputs.rawMsg': '',
    'inputs.selectedTasksForPrefill': null
  };
  public linkMp4: string;
  public userInfoSession: string;
  public timeOut: NodeJS.Timeout;
  public timeOut1: NodeJS.Timeout = null;
  public timeoutToggle: NodeJS.Timeout;
  public objectNameAudioMP3: {
    firstPart: string;
    secondPart: string;
  } = {
    firstPart: 'REC',
    secondPart: '.mp3'
  };
  public isCopy: boolean = false;
  public prefillFiles$: IFile[];

  readonly taskType = TaskType;
  readonly EButtonType = EButtonType;
  readonly EButtonTask = EButtonTask;
  readonly EMailBoxStatus = EMailBoxStatus;
  readonly EPage = EPage;
  readonly EConversationType = EConversationType;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly aiSummaryFacade: AISummaryFacadeService,
    private readonly filesService: FilesService,
    private readonly preventButtonService: PreventButtonService,
    private readonly converationSummaryService: ConverationSummaryService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly taskService: TaskService,
    private readonly messageFlowService: MessageFlowService,
    private readonly toastService: ToastrService,
    private toastCustomService: ToastCustomService
  ) {}

  ngOnInit(): void {
    this.prefillTitle();
    this.initPrefillMessage();
    this.subscribeToQueryParams();
    this.triggerSelectedRequestId();
    this.triggerExpandConversationSummary();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inputTaskType']) {
      this.updateWidgetConfigs();
    }
    this.setFileType();

    if (
      changes['isExpandConversationSummary'] &&
      !this.isExpandConversationSummary
    ) {
      this.message.isOpen = false;
    }

    if (changes['message'] && changes['message'].currentValue) {
      if (this.message.audioFile?.fileName) {
        this.splitMP3FileName(this.message.audioFile?.fileName);
      }
    }
  }

  loadFile(file, selectedFileId) {
    this.converationSummaryService.triggerLoadFileMsgSummary$.next({
      file: file,
      selectedFileId: selectedFileId
    });
  }

  private splitMP3FileName(fileName: string) {
    const parts = fileName.split(/\.mp3$/);
    this.objectNameAudioMP3 = {
      ...this.objectNameAudioMP3,
      firstPart: parts[0]
    };
  }

  private triggerSelectedRequestId() {
    this.converationSummaryService.selectedTicketId$
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((res) => {
        if (!res) return;
        this.scrollToActionItem(res);
      });
  }

  processMessageReload(data: any): void {
    if (!data) return;

    const isEmailConversation =
      this.currentConversation.conversationType === EConversationType.EMAIL;
    const messageRequest = isEmailConversation
      ? data.find((item) => item?.messageId === this.message?.messageId)
      : data.summaries?.find(
          (item) => item?.sessionId === this.message?.sessionId
        );

    if (messageRequest) {
      this.message.messageRequest = messageRequest.messageRequest;
      this.cdr.markForCheck();
    }
  }

  toggleConversationSummary(): void {
    this.message.isOpen = !this.message?.isOpen;
  }

  handleShowAttachment(): void {
    this.showAttachment = !this.showAttachment;
  }

  triggerExpandConversationSummary() {
    this.converationSummaryService.triggerExpandConversationSummary$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showAttachment = false;
        this.cdr.markForCheck();
      });
  }

  scrollToActionItem(actionItemId: string): void {
    const containerElement = this.scrollContainer?.nativeElement;
    const actionItemElement = containerElement?.querySelector(
      `#${'item_' + actionItemId}`
    );

    if (actionItemElement) {
      this.timeOut1 = setTimeout(() => {
        actionItemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        this.cdr.markForCheck();
      }, 300);
    }
  }

  shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      EButtonTask.TASK_CREATE_MESSAGE,
      EButtonType.TASK
    );
  }

  private prefillTitle(): void {
    this.aiSummaryFacade
      .prefillTitleMsg()
      .pipe(takeUntil(this.destroy$))
      .subscribe((title) => {
        this.widgetAiSummaryConfigs['body.prefillTitle'] = title;
      });
  }

  private initPrefillMessage(): void {
    const summaryContentTemplate = this.message?.summary
      ? `<strong>Summary:</strong> ${
          this.message?.summary === '[NO_MESSAGE_SUMMARY]'
            ? 'No message'
            : this.message?.summary
        }\n\n`
      : '';
    const messageTemplate =
      '<br>The following is a summary of the situation/conversation.\n\n' +
      `${summaryContentTemplate}` +
      'Additionally, we have attached any relevant photos to provide further context.\n\n' +
      'If you require additional clarification or have further questions, please feel free to reach out.';
    this.widgetAiSummaryConfigs['inputs.rawMsg'] = messageTemplate;
  }

  private setFileType(): void {
    this.message?.attachments?.forEach((file) => {
      const fileTypeDot = this.filesService.getFileTypeDot(file.name);
      file.fileType =
        this.filesService.getFileTypeSlash(file.fileType?.name) || fileTypeDot;
      file.fileName = file?.name;
      if (listThumbnailExtension.includes(fileTypeDot)) {
        file.fileType = fileTypeDot;
      }
      file.fileIcon = this.filesService.getFileIcon(file.name);
      file.extension = this.filesService.getFileExtensionWithoutDot(file.name);
      this.getThumbnailMP4(file.mediaLink);
      file.isUnsupportedFile = !ACCEPT_ONLY_SUPPORTED_FILE.includes(
        this.filesService.getFileExtensionWithoutDot(
          file?.fileName || file?.name
        )
      );
    });
  }

  private getThumbnailMP4(link: string): void {
    this.linkMp4 = `${link}#t=5`;
  }

  private updateWidgetConfigs(): void {
    const isTask = this.inputTaskType === TaskType.TASK;
    this.widgetAiSummaryConfigs['otherConfigs.createMessageFrom'] = isTask
      ? ECreateMessageFrom.TASK_HEADER
      : ECreateMessageFrom.SCRATCH;

    const isMessageType = this.inputTaskType === TaskType.MESSAGE;
    this.widgetAiSummaryConfigs['otherConfigs.isCreateMessageType'] =
      isMessageType;
    this.widgetAiSummaryConfigs['inputs.openFrom'] = this.inputTaskType;
    this.widgetAiSummaryConfigs['footer.buttons.sendType'] = isMessageType
      ? ISendMsgType.BULK_EVENT
      : '';
  }

  private subscribeToQueryParams(): void {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['ticketId']) {
          this.timeoutToggle = setTimeout(() => {
            this.scrollToActionItem(params['ticketId']);
          }, 300);
        }
      });
  }

  handleClickMessageSummaryItem(value) {
    this.converationSummaryService.triggerMessageSummary$.next(value);
  }

  openPopupSendMessage(event: MouseEvent, selectedFiles) {
    event.stopPropagation();
    if (!this.shouldHandleProcess()) return;

    const currentTask = this.taskService.currentTask$.getValue();
    const tasks = [
      {
        taskId: currentTask.id,
        propertyId: currentTask.property?.id
      }
    ];
    this.prefillFiles$ = selectedFiles?.filter((file) =>
      Boolean(file.mediaLink || file.thumbMediaLink)
    );

    const config = {
      ...this.widgetAiSummaryConfigs,
      'header.title':
        this.inputTaskType === TaskType.MESSAGE
          ? ''
          : currentTask?.property?.streetline,
      'header.hideSelectProperty':
        !currentTask?.property?.isTemporary &&
        this.inputTaskType !== TaskType.MESSAGE,
      'inputs.listOfFiles': this.prefillFiles$,
      'inputs.selectedTasksForPrefill': tasks,
      'otherConfigs.filterSenderForReply':
        this.inputTaskType === TaskType.MESSAGE ? true : false,
      'otherConfigs.isShowGreetingContent': true
    };

    this.messageFlowService
      .openSendMsgModal(config)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs.type === ESendMessageModalOutput.MessageSent) {
          this.onSendMsg(rs.data);
        }
      });
    this.cdr.markForCheck();
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        if (!event.isDraft && event?.type !== ISendMsgType.SCHEDULE_MSG) {
          const dataForToast = {
            conversationId: event.data?.['conversation']?.id,
            taskId: event.data?.['task']?.id,
            isShowToast: true,
            type: SocketType.newTask,
            mailBoxId: event.mailBoxId,
            taskType: TaskType.MESSAGE,
            pushToAssignedUserIds: [],
            status:
              event.data?.['conversation']?.status || TaskStatusType.inprogress
          };
          const typeForToast =
            this.inputTaskType === TaskType.TASK
              ? EToastCustomType.SUCCESS_WITHOUT_VIEW_BTN
              : EToastCustomType.SUCCESS_WITH_VIEW_BTN;
          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            typeForToast
          );
        }
        if (event?.type === ISendMsgType.SCHEDULE_MSG) {
          this.toastCustomService.handleShowToastForScheduleMgsSend(
            event,
            (event?.data as ISendMsgSchedule)?.jobReminders[0]?.taskType,
            true
          );
        }
        break;
      default:
        break;
    }
  }

  copyToClipboard(data) {
    if (!data) return;
    const dataCopy = data === '[NO_MESSAGE_SUMMARY]' ? 'No message' : data;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(dataCopy).then(() => {
        this.isCopy = true;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.isCopy = false;
        }, 3000);
      });
    } else {
      this.toastService.error('Browser does not support copy to clipboard');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.timeOut);
    clearTimeout(this.timeOut1);
    clearTimeout(this.timeoutToggle);
  }
}
