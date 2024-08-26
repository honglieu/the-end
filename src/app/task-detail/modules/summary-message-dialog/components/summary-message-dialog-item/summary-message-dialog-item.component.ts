import { MessageFlowService } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { TaskService } from '@services/task.service';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AISummaryFacadeService } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary-facade.service';
import { TaskType } from '@shared/enum/task.enum';
import { Subject, takeUntil } from 'rxjs';
import { IFile } from '@shared/types/file.interface';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ISendMsgType } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { listThumbnailExtension } from '@services/constants';
import { FilesService } from '@services/files.service';
import { IMessageSummary } from '@/app/task-detail/modules/summary-message-dialog/interface/message-summary.interface';
import { UserConversation } from '@shared/types/conversation.interface';
import { SummaryMessageDialogService } from '@/app/task-detail/modules/summary-message-dialog/services/summary-message-dialog.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';

@Component({
  selector: 'summary-message-dialog-item',
  templateUrl: './summary-message-dialog-item.component.html',
  styleUrls: ['./summary-message-dialog-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryMessageDialogItemComponent implements OnInit, OnChanges {
  @Input() message: IMessageSummary;
  @Input() inputTaskType: TaskType;
  @Input() currentConversation: UserConversation;
  @Output() onHoverAttachment = new EventEmitter<string>();
  @Output() onShowAttachment = new EventEmitter<boolean>();
  private readonly destroy$ = new Subject<void>();
  public showAttachment: boolean;
  public isCopy: boolean = false;
  public prefillFiles$: IFile[];
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
  public taskType = TaskType;
  public linkMp4: string;
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;
  constructor(
    private cdr: ChangeDetectorRef,
    private toastService: ToastrService,
    private taskService: TaskService,
    private messageFlowService: MessageFlowService,
    private aiSummaryFacade: AISummaryFacadeService,
    private filesService: FilesService,
    private summaryMessageDialogService: SummaryMessageDialogService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this._prefillTitle();
    this._initPrefillMessage();
    this.triggerExpandMessageSummary();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inputTaskType']) {
      this.widgetAiSummaryConfigs['otherConfigs.createMessageFrom'] =
        this.inputTaskType === this.taskType.TASK
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
    this.setFileType();
  }

  setFileType() {
    this.message?.attachments?.forEach((file) => {
      const fileTypeDot = this.filesService.getFileTypeDot(file.name);
      if (!file?.fileType?.name && !fileTypeDot) return;
      file.fileType =
        this.filesService.getFileTypeSlash(file.fileType?.name) || fileTypeDot;
      file.fileType == file.fileType?.name;
      file.fileName = file?.name;
      if (listThumbnailExtension.includes(fileTypeDot)) {
        file.fileType = fileTypeDot;
      }
      file.fileIcon = this.filesService.getFileIcon(file.name);
      file.extension = this.filesService.getFileExtensionWithoutDot(file.name);
      this.getThumbnailMP4(file.mediaLink);
    });
  }

  getThumbnailMP4(link: string) {
    this.linkMp4 = link + '#t=5';
  }

  private async _prefillTitle() {
    this.aiSummaryFacade
      .prefillTitleMsg()
      .pipe(takeUntil(this.destroy$))
      .subscribe((title) => {
        this.widgetAiSummaryConfigs['body.prefillTitle'] = title;
      });
  }

  private _initPrefillMessage() {
    const summaryContentTemplate = this.message?.messageSummaryTimeLine
      ? `<strong>Summary:</strong> ${
          this.message?.messageSummaryTimeLine === '[NO_MESSAGE_SUMMARY]'
            ? 'No message'
            : this.message?.messageSummaryTimeLine
        }\n\n`
      : '';
    const messageTemplate =
      '<br>The following is a summary of the situation/conversation.\n\n' +
      `${summaryContentTemplate}` +
      'Additionally, we have attached any relevant photos to provide further context.\n\n' +
      'If you require additional clarification or have further questions, please feel free to reach out.';
    this.widgetAiSummaryConfigs['inputs.rawMsg'] = messageTemplate;
  }

  handleHoverAttachment(message) {
    this.onHoverAttachment.emit(message);
  }

  handleLeaveAttachment() {
    this.onHoverAttachment.emit();
  }

  handleShowAttachment() {
    this.showAttachment = !this.showAttachment;
    this.onShowAttachment.emit(this.showAttachment);
  }

  triggerExpandMessageSummary() {
    this.summaryMessageDialogService.triggerExpandMessageSummary$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showAttachment = false;
        this.cdr.markForCheck();
      });
  }

  shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      EButtonTask.TASK_CREATE_MESSAGE,
      EButtonType.TASK
    );
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
    this.widgetAiSummaryConfigs['inputs.listOfFiles'] = this.prefillFiles$;

    this.widgetAiSummaryConfigs['inputs.selectedTasksForPrefill'] = tasks;
    this.widgetAiSummaryConfigs['otherConfigs.isShowGreetingContent'] = true;
    this.widgetAiSummaryConfigs['header.hideSelectProperty'] =
      !currentTask?.property?.isTemporary &&
      this.inputTaskType !== TaskType.MESSAGE;
    this.widgetAiSummaryConfigs['header.title'] =
      this.inputTaskType === TaskType.MESSAGE
        ? ''
        : currentTask?.property?.streetline;

    this.messageFlowService.openSendMsgModal(this.widgetAiSummaryConfigs);
    this.cdr.markForCheck();
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

  handleClickMessageSummaryItem(value: IMessageSummary) {
    this.summaryMessageDialogService.triggerMessageSummary$.next(value);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
