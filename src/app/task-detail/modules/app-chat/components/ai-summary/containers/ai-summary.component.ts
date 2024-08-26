import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  first,
  firstValueFrom,
  map,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import { EAgencyPlan } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { TaskService } from '@services/task.service';
import { TaskType } from '@shared/enum/task.enum';
import { IFile } from '@shared/types/file.interface';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ISendMsgType } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { AISummaryFacadeService } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary-facade.service';
import { Conversation } from '@/app/task-detail/modules/app-chat/components/ai-summary/models';
import { whiteListInAISummary } from '@shared/constants/outside-white-list.constant';
import { MessageFlowService } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';

@Component({
  selector: 'ai-summary',
  templateUrl: './ai-summary.component.html',
  styleUrls: ['./ai-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiSummaryComponent implements OnInit, OnDestroy, OnChanges {
  @Input() inputTaskType: TaskType;
  @Input() canUseAISummary: boolean;
  @Input() isConsoleUser: boolean;
  @Input() taskDetailViewMode: EViewDetailMode;
  @Input() isArchiveMailbox: boolean;
  @Input() noMessages: boolean;
  @Input() upSellAISummaryMessage;
  @Input() currentConversation;
  private readonly _destroy$ = new Subject<void>();
  private _currentMailBoxId: string;

  public conversations$: Observable<Conversation[]>;
  public files$: Observable<IFile[]>;
  public selectedFiles$: Observable<IFile[]>;
  public selectedConversation$: Observable<Conversation>;
  public selectedConversationId$: Observable<string>;
  public inboxType$: Observable<string>;
  public isGenerating$: Observable<boolean>;
  public isLoading$: Observable<boolean>;
  public isConsoleUser$: Observable<boolean>;
  public summaryContent$: Observable<string>;
  public agencyPlan: EAgencyPlan;
  public canUseAI$: Observable<boolean>;
  public noData$: Observable<boolean>;
  public upSellMessage: string;
  public prefillMessage$: Observable<string>;
  public prefillReciverId$: Observable<string>;
  public prefillFiles$: Observable<IFile[]>;
  public noMessages$: Observable<boolean>;
  public isArchiveMailbox$: Observable<boolean>;
  public taskType$: Observable<TaskType>;
  public taskType = TaskType;
  public readonly popupState = {
    sendMessage: false,
    selectFile: false,
    planSummary: false,
    requestUpgradeSent: false
  };
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
  public isFetchTaskData: boolean = false;
  private widgetAiSummaryConfigs = {
    'footer.buttons.showBackBtn': false,
    'header.title': null,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'otherConfigs.isCreateMessageType': false,
    'otherConfigs.isForwardConversation': true,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.TASK_HEADER,
    'otherConfigs.isShowGreetingContent': true,
    'inputs.openFrom': '',
    'inputs.listOfFiles': [],
    'inputs.rawMsg': '',
    'inputs.selectedTasksForPrefill': null
  };
  public EViewDetailMode = EViewDetailMode;
  public isCopy: boolean = false;
  public isActive: boolean = false;
  visibleAITemplate: boolean = false;
  public isHasModal: boolean = false;
  public textClipboard: string;
  public listFile;
  public isTooltipVisible: boolean = false;
  public whiteListInAISummary = [...whiteListInAISummary];
  public hasData: boolean = false;
  public readonly EButtonType = EButtonType;
  public readonly EButtonTask = EButtonTask;

  constructor(
    private aiSummaryFacade: AISummaryFacadeService,
    private inboxService: InboxService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastrService,
    private messageFlowService: MessageFlowService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(filter((mailBoxId) => !!mailBoxId))
      .subscribe((mailBoxId) => {
        this._currentMailBoxId = mailBoxId;
      });
    this._initData();
    this._loadDataConversations();
    this._loadDataByInboxType();
    this.aiSummaryFacade
      .updateDynamicFieldData()
      .pipe(takeUntil(this._destroy$))
      .subscribe();
    this.isArchiveMailbox$ = this.inboxService.isArchiveMailbox$;
  }

  ngOnChanges(): void {
    if (this.inputTaskType) {
      this.widgetAiSummaryConfigs['otherConfigs.createMessageFrom'] =
        this.inputTaskType === this.taskType.TASK
          ? ECreateMessageFrom.TASK_HEADER
          : ECreateMessageFrom.SCRATCH;
    }
  }

  ngOnDestroy(): void {
    this.aiSummaryFacade.resetData();
    this.aiSummaryFacade.setShowAITemplate(false);
    this._destroy$.next();
    this._destroy$.complete();
  }

  //#region public method
  public handlePopupState(state: Partial<typeof this.popupState>) {
    for (const stateKey of Object.keys(state)) {
      this.popupState[stateKey] = state[stateKey];
    }
  }

  shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      EButtonTask.SELECT_SUMMARY_ATTACHMENT,
      EButtonType.TASK
    );
  }

  public handleClickCardMedia() {
    if (!this.shouldHandleProcess()) return;
    this.openSelectFilePopup();
  }

  handleClickOutSide() {
    this.aiSummaryFacade.setShowAITemplate(false);
  }

  copyToClipboard(data) {
    if (!data) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(data).then(() => {
        this.isCopy = true;
        this.cdr.markForCheck();
      });
    } else {
      this.toastService.error('Browser does not support copy to clipboard');
    }
  }

  handleShowTooltip(event) {
    this.isTooltipVisible = event;
  }

  public openSelectFilePopup() {
    this.handlePopupState({ selectFile: true });
  }

  public closeSelectFilePopup() {
    this.handlePopupState({ selectFile: false });
  }

  public onConversationChanges(conversation: Conversation) {
    this.aiSummaryFacade.setSelectedConversation(conversation);
    if (!conversation) return;
    this.aiSummaryFacade
      .generateSummary(
        conversation.id,
        conversation.receiveUserId,
        null,
        this._currentMailBoxId
      )
      .pipe(takeUntil(this._destroy$))
      .subscribe();
  }

  handleClick(event: Event) {
    if (this.canUseAISummary && this.isConsoleUser && !this.hasData) {
      event.preventDefault();
      return;
    }
    this.aiSummaryFacade.setShowAITemplate(!this.visibleAITemplate);
    this.isTooltipVisible = false;
    this.aiSummaryFacade
      .getSummary(
        this.currentConversation?.userId,
        this._currentMailBoxId,
        true
      )
      .subscribe();
    this.cdr.markForCheck();
  }

  public generateSummaryByAI() {
    if (
      !this.canUseAISummary ||
      this.isConsoleUser ||
      this.noMessages ||
      this.isArchiveMailbox
    )
      return;
    this.isCopy = false;
    this.aiSummaryFacade
      .generateSummary(
        this.currentConversation?.id,
        this.currentConversation?.userId,
        true,
        this._currentMailBoxId
      )
      .subscribe();
  }

  public handleSelectedFiles(files) {
    this.aiSummaryFacade.setSelectedFiles(files);
    const fileIds = files?.map((file) => file.id);
    this.aiSummaryFacade.updateSummaryMedia(fileIds).subscribe();
  }

  public handleUnSelectFile(file) {
    this.aiSummaryFacade.removeSelectedFile(file?.id);
    this.selectedFiles$
      .pipe(
        map((files) =>
          files.map((file) => file.id).filter((id) => Boolean(id))
        ),
        filter((ids) => ids.length >= 0),
        take(1),
        takeUntil(this._destroy$)
      )
      .subscribe((fileIds) => {
        this.aiSummaryFacade.updateSummaryMedia(fileIds).subscribe();
      });
  }

  upgradeAIFeature() {
    this.aiSummaryFacade
      .getUpradeAction()
      .pipe(takeUntil(this._destroy$))
      .subscribe((action) => {
        if (action == 'request') {
          this.aiSummaryFacade.sendRequestUpgrade().subscribe();
        }

        if (action == 'upgrade') {
          this.handlePopupState({
            planSummary: true,
            requestUpgradeSent: false
          });
        }
      });
  }

  public async openPopupSendMessage(event: MouseEvent) {
    event.stopPropagation();

    const currentTask = this.taskService.currentTask$.getValue();
    const tasks = [
      {
        taskId: currentTask.id,
        propertyId: currentTask.property?.id
      }
    ];
    const files = (await firstValueFrom(this.prefillFiles$)) || [];
    this.widgetAiSummaryConfigs['inputs.listOfFiles'] = files;
    this.widgetAiSummaryConfigs['inputs.selectedTasksForPrefill'] = tasks;

    this.messageFlowService.openSendMsgModal(this.widgetAiSummaryConfigs);

    this.aiSummaryFacade.setShowAITemplate(false);
    this.cdr.markForCheck();
  }
  //#endregion

  //#region private method
  private _initData() {
    this.canUseAI$ = this.aiSummaryFacade.canUseAI();
    this.isConsoleUser$ = this.aiSummaryFacade.isConsoleUser();
    this.isLoading$ = this.aiSummaryFacade.isLoading();
    this.isGenerating$ = this.aiSummaryFacade.isGenerating();
    this.aiSummaryFacade
      .isShowAITemplate()
      .pipe(
        filter((res) => res !== null),
        takeUntil(this._destroy$)
      )
      .subscribe((visible) => {
        this.visibleAITemplate = visible;
        this.isActive = visible;
        this.cdr.markForCheck();
      });
    this.summaryContent$ = this.aiSummaryFacade.getSummaryContent();
    this._initPrefillMessage();
    this._prefillTitle();
    //file
    this.files$ = this.aiSummaryFacade.getFiles();
    this.selectedFiles$ = this.aiSummaryFacade.getSelectedFiles();
    this.prefillFiles$ = this.selectedFiles$.pipe(
      map((files) =>
        files?.filter((file) => Boolean(file.mediaLink || file.thumbMediaLink))
      )
    );
    // conversation
    this.conversations$ = this.aiSummaryFacade.getConversations();
    this.selectedConversation$ = this.aiSummaryFacade.getSelectedConverstion();
    this.selectedConversationId$ = this.selectedConversation$.pipe(
      map((conversation) => conversation?.id)
    );
    this.noData$ = this.aiSummaryFacade.noData();

    this.noData$.subscribe((data) => {
      this.hasData = !data;
    });

    this.noMessages$ = this.aiSummaryFacade.getCurrentConversation().pipe(
      filter(Boolean),
      distinctUntilChanged(),
      switchMap(({ id }) => {
        return this.aiSummaryFacade.checkNoMessageOnConversation(id);
      })
    );
    this.taskType$ = this.aiSummaryFacade.getCurrentTask().pipe(
      map((task) => task?.taskType),
      distinctUntilChanged(),
      tap((taskType) => {
        const isMessageType = taskType === TaskType.MESSAGE;
        this.widgetAiSummaryConfigs['otherConfigs.isCreateMessageType'] =
          isMessageType;
        this.widgetAiSummaryConfigs['inputs.openFrom'] = taskType;
        this.widgetAiSummaryConfigs['footer.buttons.sendType'] = isMessageType
          ? ISendMsgType.BULK_EVENT
          : '';
      })
    );

    this.aiSummaryFacade
      .getAgencyPlan()
      .pipe(takeUntil(this._destroy$))
      .subscribe((config) => {
        this.agencyPlan = config?.plan;
      });
  }

  private async _prefillTitle() {
    this.aiSummaryFacade
      .prefillTitleMsg()
      .pipe(takeUntil(this._destroy$))
      .subscribe((title) => {
        this.widgetAiSummaryConfigs['body.prefillTitle'] = title;
      });
  }

  private _initPrefillMessage() {
    combineLatest([this.summaryContent$, this.aiSummaryFacade.getAgencyName()])
      .pipe(
        takeUntil(this._destroy$),
        map(([summaryContent, agencyName]) => {
          const summaryContentTemplate = summaryContent
            ? `<strong>Summary:</strong> ${summaryContent}\n\n`
            : '';
          this.textClipboard = summaryContentTemplate;
          const messageTemplate =
            'Hi,\n\n' +
            'The following is a summary of the situation/conversation.\n\n' +
            `${summaryContentTemplate}` +
            'Additionally, we have attached any relevant photos to provide further context.\n\n' +
            'If you require additional clarification or have further questions, please feel free to reach out.';
          return messageTemplate;
        })
      )
      .subscribe((rs) => {
        if (rs) {
          this.widgetAiSummaryConfigs['inputs.rawMsg'] = rs;
        }
      });
  }

  private _loadDataConversations() {
    this.aiSummaryFacade
      .loadConversations()
      .pipe(takeUntil(this._destroy$))
      .subscribe();
  }

  private _loadDataByInboxType() {
    combineLatest([
      this.aiSummaryFacade.isGenerating(),
      this.aiSummaryFacade.getCurrentTask(),
      this.aiSummaryFacade
        .getCurrentConversation()
        .pipe(filter(Boolean), distinctUntilKeyChanged('id'))
    ])
      .pipe(
        takeUntil(this._destroy$),
        distinctUntilChanged((pre, cur) => pre[2]?.id === cur[2]?.id)
      )
      .subscribe(([isGenerating, currentTask]) => {
        if (!isGenerating) {
          const { taskType } = currentTask || {};
          if (taskType === TaskType.TASK) {
            this._loadSummaryDataForTask();
          }

          if (taskType === TaskType.MESSAGE) {
            this._loadSummaryDataForMessage();
          }
        }
      });
  }

  private _loadSummaryDataForMessage() {
    const conversation$ = this.conversations$.pipe(
      map((converstions) => converstions?.slice(0, 1)?.[0]),
      first(Boolean),
      takeUntil(this._destroy$)
    );

    conversation$.subscribe((conversation) => {
      this.aiSummaryFacade.setSelectedConversation(conversation);
    });

    this._loadSummaryData();
  }

  private _loadSummaryDataForTask() {
    this._loadSummaryData();
  }

  private _loadSummaryData() {
    this.aiSummaryFacade
      .getSummary(
        this.currentConversation?.userId,
        this._currentMailBoxId,
        false
      )
      .pipe(takeUntil(this._destroy$))
      .subscribe();
  }
  //#endregion
}
