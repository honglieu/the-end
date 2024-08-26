import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  takeUntil
} from 'rxjs';
import { SharedService } from '@services/shared.service';
import { ActivatedRoute } from '@angular/router';
import { NzResizeEvent } from 'ng-zorro-antd/resizable';
import { TaskType } from '@shared/enum/task.enum';
import { SummaryMessageDialogService } from './services/summary-message-dialog.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SocketType } from '@shared/enum/socket.enum';
import {
  EGenerateSummaryStatus,
  ILoadFile,
  IMessageSummary
} from './interface/message-summary.interface';
import { ConversationService } from '@services/conversation.service';
import { UserConversation } from '@shared/types/conversation.interface';
import { isEqual } from 'lodash-es';
import { FileCarousel, IFile } from '@shared/types/file.interface';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  listCalendarTypeDot
} from '@services/constants';
import { FilesService } from '@services/files.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { TaskService } from '@services/task.service';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { ToastrService } from 'ngx-toastr';
import { AnimationOptions } from 'ngx-lottie';
import { EPage } from '@shared/enum';
import {
  ModalPopupPosition,
  whiteListClickOutsideSelectReceiver,
  whiteListInHeader,
  whiteListInMessage,
  whiteListInMsgDetail
} from '@/app/shared';

@Component({
  selector: 'summary-message-dialog',
  templateUrl: './summary-message-dialog.component.html',
  styleUrls: ['./summary-message-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('collapseModal', [
      state('expanded', style({ height: '*' })),
      state('collapsed', style({ height: 32, maxWidth: 400 })),
      transition('collapsed => expanded', animate('0.25s ease-in-out')),
      transition('expanded => collapsed', animate('0.25s ease-in-out'))
    ])
  ]
})
export class SummaryMessageDialogComponent
  implements OnInit, OnDestroy, OnChanges
{
  @ViewChild('bodyMsgSummary') bodyMsgSummary: ElementRef;
  @ViewChild('attachmentsListTemp') attachmentsListTemp: ElementRef;
  @ViewChild('infiniteScrollRequest')
  infiniteScrollRequest: ElementRef<HTMLElement>;
  @Input() heightMessageEmailDetail: number;
  @Input() inputTaskType: TaskType;
  @Input() currentConversation: UserConversation;
  @Input() isNoMessage: boolean = false;
  private readonly destroy$ = new Subject<void>();
  public readonly EPage = EPage;
  public previewMsgSummary: boolean = false;
  private scrollTimeOut: NodeJS.Timeout = null;
  public isConsole: boolean = false;
  public listSummaryMessage: IMessageSummary[];
  public isGeneratingMsg: boolean = false;
  public contentHeight: number;
  public isDisalbeResize: boolean;
  public isResized: boolean;
  public minHeight: number;
  public maxHeight: number;
  public heightContentSummary: number;
  public id: number;
  public lastSummaryUpdatedAt: string;
  public isSummaryGenerating = false;
  public isMessagesSocket: boolean = false;
  public isShowCarousel = false;
  public arrayImageCarousel: FileCarousel[] | IFile[] = [];
  public initialIndex: number;
  popupModalPosition = ModalPopupPosition;
  public fileSelected;
  public contentText: string = '';
  public selectedFiles = [];
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
  public isTaskType = false;
  public currentMailboxId: string;
  public options: AnimationOptions = {
    path: '/assets/animations/ai_loading.json'
  };
  public maxContentHight: number;
  public attachmentsTemp: IFile[] | FileCarousel[];
  public readonly whiteListMsgDetail = [
    ...whiteListInMsgDetail,
    ...whiteListInHeader,
    ...whiteListClickOutsideSelectReceiver,
    ...whiteListInMessage
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private sharedService: SharedService,
    public elementRef: ElementRef,
    private summaryMessageDialogService: SummaryMessageDialogService,
    private websocketService: RxWebsocketService,
    public conversationService: ConversationService,
    private filesService: FilesService,
    public inboxService: InboxService,
    private taskService: TaskService,
    private messageFlowService: MessageFlowService,
    private toastCustomService: ToastCustomService,
    private activatedRoute: ActivatedRoute,
    private toastService: ToastrService
  ) {}

  get disableGenerateMsgSummary() {
    return (
      this.isNoMessage ||
      (this.currentConversation.lastSummaryUpdatedAt === null && this.isConsole)
    );
  }

  get titleMsgSummary() {
    return this.isNoMessage
      ? 'There are no messages to summarize'
      : 'Summarize conversation';
  }

  ngOnInit(): void {
    this.summaryMessageDialogService.loadingMessageSummary$.next(true);
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.currentMailboxId = res;
      });
    this.websocketService.onSocketGenerateMessageSummary
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (data) =>
            data.type === SocketType.generateMessageSummary &&
            data?.conversationId === this.currentConversation?.id
        ),
        distinctUntilChanged((pre, curr) => isEqual(pre, curr))
      )
      .subscribe((data) => {
        if (!this.isGeneratingMsg) {
          this.previewMsgSummary = false;
          this.summaryMessageDialogService.triggerExpandMessageSummary$.next(
            false
          );
        }
        if (!data) return;
        if (data?.status === EGenerateSummaryStatus.FAILED) {
          this.toastService.error('Fail to summarize. Please try again.');
          this.isGeneratingMsg = false;
          this.cdr.markForCheck();
          return;
        }
        this.lastSummaryUpdatedAt = data?.lastSummaryUpdatedAt;
        this.conversationService.reloadConversationList.next(true);
        this.isMessagesSocket = true;
        this._initData();
      });

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.contentHeight = 50;
        this.isResized = false;
        this.previewMsgSummary = false;
        this.summaryMessageDialogService.triggerExpandMessageSummary$.next(
          false
        );
        this.maxContentHight = null;
        this.isMessagesSocket = false;
        this.lastSummaryUpdatedAt = null;
        this.summaryMessageDialogService.loadingMessageSummary$.next(true);
        this.cdr.detectChanges();
      });
    this.loadFileMsgSummary();
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
    this.subscribeCurrentTask();
  }

  subscribeCurrentTask() {
    this.taskService.currentTask$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res) {
          this.isTaskType = res.taskType !== TaskType.MESSAGE;
          this.createNewConversationConfigs[
            'otherConfigs.isCreateMessageType'
          ] = !this.isTaskType;
          this.createNewConversationConfigs['footer.buttons.sendType'] = !this
            .isTaskType
            ? ISendMsgType.BULK_EVENT
            : '';
          this.createNewConversationConfigs['otherConfigs.createMessageFrom'] =
            this.isTaskType
              ? ECreateMessageFrom.TASK_HEADER
              : ECreateMessageFrom.SCRATCH;
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentConversation']?.currentValue) {
      if (
        this.currentConversation?.lastSummaryUpdatedAt !== null &&
        !isEqual(
          changes['currentConversation'].currentValue,
          changes['currentConversation'].previousValue
        ) &&
        !this.isMessagesSocket
      ) {
        this._initData();
      }
      if (
        !this.currentConversation?.lastSummaryUpdatedAt &&
        !isEqual(
          changes['currentConversation'].currentValue,
          changes['currentConversation'].previousValue
        )
      ) {
        this.listSummaryMessage = [];
      }
    }
  }

  scrollToBottom(): void {
    const scrollElement = this.infiniteScrollRequest.nativeElement;
    scrollElement.scrollTop = scrollElement.scrollHeight;
  }

  _initData() {
    if (this.currentConversation?.id) {
      this.summaryMessageDialogService
        .getMessageSummary(this.currentConversation?.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.summaryMessageDialogService.loadingMessageSummary$.next(false);
          this.listSummaryMessage = res;
          const orderBy = ['photo', 'audio', 'video', 'file'];
          this.listSummaryMessage.sort(
            (a, b) =>
              new Date(a?.createdAt).getTime() -
              new Date(b?.createdAt).getTime()
          );

          this.listSummaryMessage.forEach((item) => {
            // Sort by createdAt date
            item.attachments.sort(
              (a, b) =>
                new Date(b?.createdAt).getTime() -
                new Date(a?.createdAt).getTime()
            );

            // Sort by fileType, then by size
            item.attachments.sort((a, b) => {
              const aType = this.filesService.getFileTypeSlash(
                a?.fileType?.name
              );
              const bType = this.filesService.getFileTypeSlash(
                b?.fileType?.name
              );

              const typeComparison =
                orderBy.indexOf(aType) - orderBy.indexOf(bType);

              if (typeComparison !== 0) {
                return typeComparison;
              }

              if (aType === 'file' && bType === 'file') {
                const aSize = parseInt(a?.size, 10);
                const bSize = parseInt(b?.size, 10);

                return bSize - aSize;
              }

              return 0;
            });
          });
          this.handleExpandDialog();
          this.isGeneratingMsg = false;
          this.isSummaryGenerating = false;
          this.cdr.detectChanges();
          this.scrollToBottom();
        });
    }
  }

  handleExpandDialog() {
    if (this.isSummaryGenerating && this.listSummaryMessage) {
      this.previewMsgSummary = !this.previewMsgSummary;
      this.summaryMessageDialogService.triggerExpandMessageSummary$.next(
        this.previewMsgSummary
      );
    } else {
      if (!this.previewMsgSummary) {
        this.previewMsgSummary = false;
      }
      this.summaryMessageDialogService.triggerExpandMessageSummary$.next(false);
    }
  }

  setHeightMessageDialog() {
    this.minHeight = (this.heightMessageEmailDetail / 100) * 20;
    this.maxHeight = (this.heightMessageEmailDetail / 100) * 80;
    this.contentHeight = (this.heightMessageEmailDetail / 100) * 40;
    if (this.contentHeight > this.maxHeight) {
      this.contentHeight = this.maxHeight;
    }

    this.contentHeight = this.contentHeight;
  }

  scrollToElement(
    position: number,
    block: ScrollLogicalPosition = 'center',
    inline: ScrollLogicalPosition = 'nearest'
  ): void {
    this.scrollTimeOut = setTimeout(() => {
      const scrollElement = this.infiniteScrollRequest?.nativeElement;
      const targetElement = scrollElement?.children?.[position];

      if (!targetElement) {
        return;
      }

      targetElement.scrollIntoView({
        block,
        inline,
        behavior: 'smooth'
      });
    }, 100);
  }

  loadFileMsgSummary() {
    this.summaryMessageDialogService.triggerLoadFileMsgSummary$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: ILoadFile) => {
        const { file, selectedFileId, ignore } = res;
        if (
          !listCalendarTypeDot
            .map((item) => item?.replace(/\./g, ''))
            .includes(file?.extension)
        ) {
          this.filesService
            .getFileListInConversation(this.currentConversation.id)
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

  // forward message
  setStateTrudiSendMsg(file = null) {
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
      'body.prefillTitle':
        'Fwd: ' + (this.currentConversation?.categoryName || '')
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
      'inputs.openFrom': this.determineTaskType(this.isTaskType, file),
      'inputs.listOfFiles': this.selectedFiles,
      'inputs.selectedTasksForPrefill': tasks,
      'otherConfigs.isShowGreetingContent': !file
    };
  }

  determineTaskType(isTaskType, file) {
    if (!isTaskType) {
      return TaskType.MESSAGE;
    }
    if (file) {
      return TaskType.SEND_FILES;
    }
    return '';
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
    const fileName = this.selectedFiles[0]?.name?.split('.')[0];
    this.contentText = `Hi,\n\nPlease find the following file attached:\n\n •  ${fileName}\n\nIf you have any questions, please feel free to contact us.`;
    this.createNewConversationConfigs['inputs.rawMsg'] = this.contentText;
  }

  handleShowAttachment(isShow) {
    if (this.isResized) return;
    const attachmentsListTemp = this.attachmentsListTemp
      ?.nativeElement as HTMLElement;
    const attachmentsListTempHeight = attachmentsListTemp?.offsetHeight + 4;
    this.calculateContentHeight(
      isShow ? attachmentsListTempHeight : -attachmentsListTempHeight
    );
  }

  handleHoverAttachment(message) {
    if (!message && !message?.attachments?.length) {
      this.attachmentsTemp = [];
      return;
    }
    this.attachmentsTemp = message.attachments;
  }

  onOutsideClick() {
    if (this.previewMsgSummary) {
      this.previewMsgSummary = false;
    }
    this.cdr.detectChanges();
  }

  onAnimationEnd(event: AnimationEvent) {
    if (this.maxContentHight) {
      this.contentHeight = this.maxContentHight;
    }
    if ((event as any).toState === 'expanded') {
      this.calculateContentHeight();
      this.maxContentHight = this.contentHeight;
    } else {
      this.isResized = false;
    }
    this.scrollToBottom();
  }

  calculateContentHeight(attachmentsListTempHeight: number = 0) {
    const minHeight = (this.heightMessageEmailDetail / 100) * 20;
    const contentHeightDefault = (this.heightMessageEmailDetail / 100) * 40;
    const bodyMsgSummaryEl = this.bodyMsgSummary?.nativeElement as HTMLElement;
    let bodyMsgSummaryHeight = bodyMsgSummaryEl?.offsetHeight + 1;
    if (attachmentsListTempHeight) {
      bodyMsgSummaryHeight += attachmentsListTempHeight;
    }
    if (bodyMsgSummaryHeight < contentHeightDefault - 46) {
      if (bodyMsgSummaryHeight > minHeight - 46) {
        this.isDisalbeResize = false;
        this.contentHeight = this.maxHeight = bodyMsgSummaryHeight + 46;
        this.minHeight = minHeight;
        return;
      }
      this.isDisalbeResize = true;
      this.contentHeight = bodyMsgSummaryHeight + 46;
    } else {
      this.isDisalbeResize = false;
      this.setHeightMessageDialog();
    }
    this.cdr.markForCheck();
  }

  handleGenerateSummaryMsg() {
    if (
      (this.currentConversation.lastSummaryUpdatedAt !== null ||
        this.lastSummaryUpdatedAt !== null) &&
      this.listSummaryMessage?.length
    ) {
      this.previewMsgSummary = !this.previewMsgSummary;
      this.summaryMessageDialogService.triggerExpandMessageSummary$.next(
        this.previewMsgSummary
      );
      this.isSummaryGenerating = false;
      this.isGeneratingMsg = false;
    } else {
      if (this.isSummaryGenerating || this.lastSummaryUpdatedAt !== null) {
        return;
      }
      this.isSummaryGenerating = true;
      this.isGeneratingMsg = true;
      this.summaryMessageDialogService
        .generateMessageSummary({
          conversationId: this.currentConversation?.id,
          mailBoxId: this.currentMailboxId
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  onResizable({ height, mouseEvent }: NzResizeEvent): void {
    cancelAnimationFrame(this.id);
    this.id = requestAnimationFrame(() => {
      this.contentHeight = height!;
      this.isResized = true;
    });
  }

  trackTaskItem(_, item) {
    return item.id;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.scrollTimeOut);
  }
}
