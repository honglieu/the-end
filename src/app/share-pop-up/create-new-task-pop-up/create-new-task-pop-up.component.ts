import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  OnChanges,
  Output,
  SimpleChanges,
  OnDestroy,
  NgZone
} from '@angular/core';
import { Router } from '@angular/router';
import { cloneDeep } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Subject,
  distinctUntilChanged,
  filter,
  takeUntil,
  tap
} from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { ChatGptService } from '@services/chatGpt.service';
import { ConversationService } from '@services/conversation.service';
import { CreditorInvoicingService } from '@services/creditor-invoicing.service';
import { HeaderService } from '@services/header.service';
import {
  CONVERT_TO_TASK,
  CREATE_TASK_SUCCESSFULLY
} from '@services/messages.constants';
import { NavigatorService } from '@services/navigator.service';
import { NotificationService } from '@services/notification.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { EMessageType } from '@shared/enum/messageType.enum';
import { EOptionType } from '@shared/enum/optionType.enum';
import { TaskNameId, TaskType } from '@shared/enum/task.enum';
import { UserStatus, UserTypeEnum } from '@shared/enum/user.enum';
import {
  IConvertMultipleToTaskResponse,
  TaskCreate,
  TaskItemDropdown,
  TaskName,
  TaskRegionItem
} from '@shared/types/task.interface';
import { TrudiResponse } from '@shared/types/trudi.interface';
import { IMailBox, Personal } from '@shared/types/user.interface';
import {
  CreateTaskByCateOpenFrom,
  InjectFrom
} from './components/create-task-by-category/create-task-by-category.component';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { IListConversationConfirmProperties } from '@shared/types/conversation.interface';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { ITaskFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { IListTaskTemplate } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { CreateTaskFormService } from '@/app/share-pop-up/create-new-task-pop-up/services/create-task-form.service';
import { CreateNewTaskPopUpService } from './services/create-new-task-pop-up.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { stringFormat } from '@core';
import { AppRoute } from '@/app/app.route';
import { Store } from '@ngrx/store';
import uuidv4 from 'uuid4';
import { EConversationType } from '@shared/enum';
import { EventsTabApiService } from '@shared/components/property-profile/components/events-tab/events-tab-service/events-tab-api.service';

export interface ICreateNewTaskPopUpState {
  selectTaskAndProperty: boolean;
  createTaskByCategory: boolean;
  requestLandlordTenant: boolean;
}
export enum EPopupShow {
  CREATE_TASK_POPUP = 'CREATE_TASK_POPUP',
  CREATE_FOLDER_POPUP = 'CREATE_FOLDER_POPUP'
}

@Component({
  selector: 'create-new-task-pop-up',
  templateUrl: './create-new-task-pop-up.component.html',
  styleUrls: ['./create-new-task-pop-up.component.scss']
})
export class CreateNewTaskPopUpComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() defaultMailBoxId: string;
  @Input() taskNameList: TaskItemDropdown[] = [];
  @Input() selectedTaskNameRegionId: string = '';
  @Input() selectedTaskNameId: TaskNameId;
  @Input() isProcessingCreateNewTask: boolean = false;
  @Input() hiddenSelectProperty: boolean = false;
  @Input() selectedFolderId: string;
  @Input() openFrom: CreateTaskByCateOpenFrom;
  @Input() injectFrom: InjectFrom;
  @Input() isBackButtonVisible: boolean;
  @Input() isCreateBlankTask: boolean = false;
  @Input() selectedTenancyId: string;
  @Input() selectedComplianceId: string;
  @Input() selectedTaskToConvert: TaskName;
  @Input() configs: IConfigs = cloneDeep(defaultConfigs);
  @Input() listEventBulkCreateTask: ICalendarEvent[] = [];
  @Input() showBackBtn: boolean = false;
  @Input() disableSelectProperty: boolean = false;
  /* NOTE: pass categoryID when task created in message index page */
  @Input() categoryID?: string;
  @Input() dataConvert?: IListConversationConfirmProperties[];
  @Input() propertyId: string;
  @Input() set selectedTaskGroupId(taskGroupId: string) {
    this.taskGroupId = taskGroupId;
  }
  @Input() isFromTrudiApp: boolean = false;
  @Input() isFromVoiceMail: boolean = false;
  @Input() openByModalExistingTask: boolean;
  @Input() isStepPrescreen: boolean = false;
  @Input() conversationType: EConversationType;
  @Input() conversationId: string;
  @Output() stopProcessCreateNewTask = new EventEmitter();
  @Output() onCloseModal = new EventEmitter<boolean>(null);
  @Output() onBack: EventEmitter<void> = new EventEmitter<void>();
  @Output() onNext: EventEmitter<TaskCreate> = new EventEmitter<TaskCreate>();
  @Output() onQuit = new EventEmitter();
  @Output() onSendBulkMsg = new EventEmitter();

  public currentSelectedTask;
  public taskGroupId: string;
  private destroy$ = new Subject<void>();
  public popupState: ICreateNewTaskPopUpState = {
    selectTaskAndProperty: false,
    createTaskByCategory: false,
    requestLandlordTenant: false
  };
  public showPopup = EPopupShow.CREATE_TASK_POPUP;
  public requestTitle = '';
  public popupModalPosition = ModalPopupPosition;
  public TaskType = TaskType;
  public taskNameId: TaskNameId;
  public assignedUserIds: string[];
  public selectedPropertyId: string;
  public trudiResponse: TrudiResponse;
  public taskNameRegionId: string;
  public mediaFilesInConversation: number = 0;
  public currentAgencyId: string;
  public newMessage = new Subject();
  public TaskNameId = TaskNameId;
  public returnRouterUrl: string;
  public listTenancy: Personal[];
  public chatGptGenerate = {
    emailTitle: '',
    emailSummary: '',
    subcategory: ''
  };
  public taskNameTitle: string;
  public dataCreateTask;
  public hasUserInMessage: boolean = true;
  public eventId: string;
  public listMailbox: IMailBox[];
  public isSending: boolean;
  public currentEvent: number = 0;
  public totalEvents: number;
  public isShowTaskFailed: boolean = false;
  public conversationIds: string[];
  public templateDatas: IListTaskTemplate;
  public conversationFaileds: IListConversationConfirmProperties[];
  public conversationSuccess: IListConversationConfirmProperties[];
  public createMultiple: boolean = false;
  private waitToCreate: NodeJS.Timeout;
  selectedMessageIds: string[];
  public selectedMailBoxId: string;
  public resConvertMultipleTask: IConvertMultipleToTaskResponse;
  public isModalTaskV2 = false;
  public sessionId: string = uuidv4();
  public statusSending = new BehaviorSubject({
    statusSocket: false,
    statusApi: false
  });
  public isCreateMultipleTasks: boolean = false;

  public readonly EPopupShow = EPopupShow;
  public readonly InjectFrom = InjectFrom;

  constructor(
    private readonly router: Router,
    private conversationService: ConversationService,
    private toastService: ToastrService,
    private taskService: TaskService,
    private headerService: HeaderService,
    private navigatorService: NavigatorService,
    public creditorInvoicingService: CreditorInvoicingService,
    public userService: UserService,
    public notificationService: NotificationService,
    private agencyService: AgencyService,
    private chatGptService: ChatGptService,
    private inboxService: InboxService,
    private websocketService: RxWebsocketService,
    private cdr: ChangeDetectorRef,
    private createTaskFormService: CreateTaskFormService,
    private createNewTaskPopUpService: CreateNewTaskPopUpService,
    private sharedMessageViewService: SharedMessageViewService,
    private inboxToolbarService: InboxToolbarService,
    private store: Store,
    private ngZone: NgZone,
    private readonly eventsTabApiService: EventsTabApiService
  ) {}

  ngOnInit() {
    this.totalEvents = this.dataConvert?.length;
    this.statusSending.pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res.statusSocket && res.statusApi) this.sendingTask();
    });

    this.selectedPropertyId =
      this.dataConvert?.length && this.checkSamePropertyId(this.dataConvert)
        ? this.dataConvert[0].propertyId
        : this.propertyId || null;

    this.isModalTaskV2 = [
      CreateTaskByCateOpenFrom.CALENDAR,
      CreateTaskByCateOpenFrom.TASK,
      CreateTaskByCateOpenFrom.MESSAGE,
      CreateTaskByCateOpenFrom.CONVERT_TO_TASK,
      CreateTaskByCateOpenFrom.CREATE_BULK_MULTIPLE_TASK,
      CreateTaskByCateOpenFrom.CREATE_MULTIPLE_TASK,
      CreateTaskByCateOpenFrom.TASK_DETAIL
    ].includes(this.openFrom);

    this.isCreateMultipleTasks = [
      CreateTaskByCateOpenFrom.CREATE_BULK_MULTIPLE_TASK,
      CreateTaskByCateOpenFrom.CALENDAR_EVENT_BULK_CREATE_TASKS
    ].includes(this.openFrom);

    this.handlePopupState({ ...this.popupState, selectTaskAndProperty: true });

    const isCreateTask = [
      CreateTaskByCateOpenFrom.TASK,
      CreateTaskByCateOpenFrom.CALENDAR
    ].includes(this.openFrom);

    if (this.openFrom === CreateTaskByCateOpenFrom.MESSAGE) {
      this.assignedUserIds =
        this.sharedMessageViewService.prefillCreateTaskDataValue?.assignToAgents?.map(
          (agent) => agent.id
        ) || [];
    } else {
      this.assignedUserIds = isCreateTask
        ? []
        : this.taskService.currentTask$.value?.assignToAgents?.map(
            (agent) => agent.id
          ) || [];
    }

    if (
      [
        CreateTaskByCateOpenFrom.CONVERT_TO_TASK,
        CreateTaskByCateOpenFrom.MESSAGE
      ].includes(this.openFrom)
    ) {
      this.chatGptGenerateTitleAndSummary();
    }

    if (this.openFrom !== CreateTaskByCateOpenFrom.CALENDAR) {
      this.subscribeGetTopicsList();
    }

    this.inboxService.listMailBoxs$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => !!res)
      )
      .subscribe((res) => (this.listMailbox = res));

    this.subscribeSocketCreateMultipleTask();
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && res.length > 0) {
          const isIndexApp = this.router.url.includes('inbox/app-messages');
          const isIndexEmail = this.router.url.includes('inbox/messages');
          const isIndexVoiceMail = this.router.url.includes(
            'inbox/voicemail-messages'
          );
          if (isIndexApp || isIndexEmail || isIndexVoiceMail) {
            this.selectedMessageIds = res.map((item) => item?.conversationId);
          } else {
            this.selectedMessageIds = res.map((item) => item.id);
          }
        }
      });
    this.subscribeSelectMailBoxId();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['dataConvert']?.currentValue ||
      changes['listEventBulkCreateTask']?.currentValue
    ) {
      this.createMultiple = true;
    }
  }

  subscribeSelectMailBoxId() {
    this.createTaskFormService.selectedMailBoxId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.selectedMailBoxId = res;
      });
  }

  subscribeSocketCreateMultipleTask() {
    this.websocketService.onSocketConvertMultipleTask
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        filter((res) => res && res.sessionId === this.sessionId)
      )
      .subscribe((res) => {
        this.ngZone.run(() => {
          this.currentEvent++;
        });
        if (this.currentEvent === this.totalEvents) {
          this.statusSending.next({
            statusSocket: true,
            statusApi: this.statusSending.value.statusApi
          });
        }
        this.cdr.markForCheck();
      });
  }

  sendingTask() {
    this.waitToCreate = setTimeout(() => {
      this.isSending = false;
      this.resetPopupState();
      if (this.conversationFaileds?.length) {
        this.isShowTaskFailed = true;
      } else {
        this.taskService.setSelectedConversationList([]);
        if (!this.conversationFaileds.length) {
          this.conversationSuccess.concat(this.conversationSuccess);
          this.onSendBulkMsg.emit(this.conversationSuccess);
        }
      }
    }, 300);
  }

  subscribeGetTopicsList() {
    this.agencyService.listTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.taskNameList = this.taskService.createTaskNameList();
        }
      });
  }

  checkSamePropertyId(array) {
    if (array.length < 2) {
      return true;
    }

    const [firstItem] = array;
    const { propertyId: firstPropertyId } = firstItem;

    return array.every(({ propertyId }) => propertyId === firstPropertyId);
  }

  onTryAgainToTask(value) {
    this.currentEvent = this.totalEvents - this.conversationFaileds?.length;
    this.isShowTaskFailed = value;
    this.isSending = true;
    const conversationIdsToFilter = this.conversationFaileds.map(
      (task: IListConversationConfirmProperties) => task.id
    );

    const dataConvert = this.dataConvert.filter(
      (task: IListConversationConfirmProperties) =>
        conversationIdsToFilter.includes(task.id)
    );

    this.conversationService
      .convertMultipleToTask({
        sessionId: this.sessionId,
        propertyId: this.propertyId,
        listConversation: dataConvert,
        taskNameId: this.currentSelectedTask?.taskNameId,
        assignedUserIds: this.currentSelectedTask?.assignedUserIds || [],
        options: this.currentSelectedTask?.options,
        taskTitle: this.currentSelectedTask?.taskTitle,
        indexTitle: this.currentSelectedTask?.indexTitle,
        taskFolderId: this.currentSelectedTask?.taskFolderId,
        totalAgain: this.dataConvert?.length
      })
      .subscribe((res: IConvertMultipleToTaskResponse) => {
        if (res) {
          this.resConvertMultipleTask = res;
          this.templateDatas = res?.template?.data;
          this.conversationFaileds = res.conversationFaileds;
          if (res.conversationSuccess.length) {
            this.headerService.setConversationAction({
              option: EMessageMenuOption.CONVERT_MULTIPLE_TO_TASK,
              taskId: null,
              isTriggeredFromRightPanel: false,
              isTriggeredFromToolbar: true,
              messageIds: res.conversationSuccess.map((item) => item.taskId)
            });
            this.inboxService.setConversationSuccess(res.conversationSuccess);
            this.statusSending.next({
              statusSocket: this.statusSending.value.statusSocket,
              statusApi: true
            });
          }
          this.inboxService.setTaskTemplate(res?.template?.data);
          this.totalEvents = res.total;
        }
      });
  }

  onSkipToTask(value) {
    this.isShowTaskFailed = value;
    this.onSendBulkMsg.emit(this.conversationSuccess);
    if (this.conversationSuccess?.length) {
      this.inboxService.setConversationSuccess(this.conversationSuccess);
    }
    this.inboxService.setTaskTemplate(this.templateDatas);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
    this.taskService.setSelectedConversationList([]);
  }

  stopProcess(createTask?: boolean) {
    this.showPopup = null;
    this.taskNameList = [];
    this.assignedUserIds = [];
    this.resetPopupState();
    this.stopProcessCreateNewTask.emit(createTask);
    this.onQuit.emit();
    this.createTaskFormService.clear();
    this.openByModalExistingTask = false;
    this.taskService.triggerToggleMoveConversationSate.next({
      singleMessage: false,
      multipleMessages: false
    });
  }

  handleValueSummary() {
    if (this.chatGptGenerate) {
      this.chatGptGenerate.emailSummary = '';
    }
  }

  updateRememberFolder(data) {
    const {
      defaultTaskFolderMailBoxId,
      taskNameId,
      mailBoxId,
      taskFolderId,
      isRemember
    } = data;
    this.createNewTaskPopUpService
      .saveRememberFolder({
        defaultTaskFolderMailBoxId,
        taskNameId,
        mailBoxId,
        taskFolderId,
        isRemember
      })
      .pipe(
        tap((res) => {
          this.agencyService.updateRememberTaskTemplate(res);
        })
      )
      .subscribe(() => {});
  }

  createTask(data) {
    const taskNameIdValues = Object.values(TaskNameId);
    if (!taskNameIdValues.includes(data.taskNameId)) {
      this.taskNameId = TaskNameId.taskTemplate;
    } else {
      this.taskNameId = data?.taskNameId as TaskNameId;
    }
    this.eventId = data?.eventId;
    this.taskNameRegionId = data?.taskNameRegionId;
    this.propertyId = data?.propertyId;
    this.assignedUserIds = data?.assignedUserIds;
    this.taskNameTitle = data?.taskNameTitle;
    this.defaultNextCreateNewTask(data);
  }

  createNewTask(data) {
    this.taskService
      .convertMessageToTask(
        '',
        data?.taskNameId,
        data?.propertyId,
        data?.assignedUserIds || [],
        data?.options,
        data?.taskNameTitle,
        data?.eventId,
        data?.isCreateBlankTask,
        data?.taskTitle,
        data?.indexTitle,
        data?.notificationId,
        null,
        data?.taskFolderId,
        data?.taskFolderId === this.selectedFolderId ? this.taskGroupId : null,
        data?.agencyId
      )
      .pipe(tap(() => this.updateRememberFolder(data)))
      .subscribe({
        next: (res) => {
          if (res) {
            if (data.successCallBack) {
              data.successCallBack();
            }
            this.setLogWorkflowExecution();
            this.toastService.success(CREATE_TASK_SUCCESSFULLY);
            this.taskService.openTaskFromNotification$.next(null);
            this.taskService.taskJustCreated$.next(res);
            this.headerService.headerState$.next({
              ...this.headerService.headerState$.getValue(),
              currentTask: res
            });
            if (
              this.openFrom === CreateTaskByCateOpenFrom.TASK_DETAIL ||
              this.openFrom === CreateTaskByCateOpenFrom.CALENDAR
            ) {
              this.returnRouterUrl = this.router.url;
            } else {
              this.returnRouterUrl = '';
            }
            this.updateCurrentMailbox(data?.mailBoxId);

            this.stopProcess(true);
            this.taskService.currentTaskId$.next(res.id);
            this.taskService.currentTask$.next(res);
            this.taskService.reloadTrudiResponse.next(true);
            this.conversationService.currentConversation.next(null);
            this.navigatorService.setReturnUrl(this.returnRouterUrl);
            setTimeout(() => {
              this.router.navigate(
                [stringFormat(AppRoute.TASK_DETAIL, res.id)],
                {
                  replaceUrl: true,
                  queryParams: {
                    type: 'TASK',
                    mailBoxId: data?.mailBoxId,
                    createFromCalendar:
                      this.openFrom === CreateTaskByCateOpenFrom.CALENDAR
                  }
                }
              );
            }, 400);
            this.eventsTabApiService.refetchEventDetail$.next();
          }
        },
        error: () => this.stopProcess()
      });
  }

  convertMessageToTask(data) {
    if (!this.conversationId) {
      this.conversationId =
        this.createNewTaskPopUpService.getFocusedConversation()?.id ||
        this.conversationService.currentConversation.value?.id;
    }
    const currentCategoryID =
      this.categoryID ||
      this.conversationService.selectedCategoryId.value ||
      this.createNewTaskPopUpService.getFocusedConversation()?.categoryId ||
      this.taskService.currentTask$.value?.conversations?.[0]?.categoryId;
    this.conversationService
      .convertToTask(
        this.createNewTaskPopUpService.getFocusedConversation()?.id ||
          this.conversationService.currentConversation.value?.id,
        currentCategoryID,
        data?.taskNameId,
        data?.propertyId,
        data?.assignedUserIds || [],
        data?.options,
        data?.isCreateBlankTask,
        data?.taskNameTitle,
        data?.taskFolderId,
        data?.indexTitle,
        data?.taskTitle
      )
      .pipe(tap(() => this.updateRememberFolder(data)))
      .subscribe((res) => {
        if (res) {
          this.navigateTaskDetail(res);
        }
      });
  }

  convertMultipleToTask(data) {
    this.currentSelectedTask = data;
    this.inboxService.setPopupMoveToTaskState(null);
    this.resetPopupState();
    this.showPopup = null;
    this.inboxToolbarService.setListToolbarConfig([]);

    if (this.openFrom === CreateTaskByCateOpenFrom.CREATE_BULK_MULTIPLE_TASK) {
      this.isSending = true;
    }

    this.conversationService
      .convertMultipleToTask({
        sessionId: this.sessionId,
        propertyId: data?.propertyId,
        listConversation: this.dataConvert,
        taskNameId: data?.taskNameId,
        assignedUserIds: data?.assignedUserIds || [],
        options: data?.options,
        taskTitle: data?.taskTitle,
        indexTitle: data?.indexTitle,
        taskFolderId: data?.taskFolderId,
        isConvertToMultipleTask:
          this.openFrom === CreateTaskByCateOpenFrom.CREATE_BULK_MULTIPLE_TASK
      })
      .pipe(tap(() => this.updateRememberFolder(data)))
      .subscribe((res) => {
        if (!res) return;

        if (this.openFrom === CreateTaskByCateOpenFrom.CREATE_MULTIPLE_TASK) {
          this.navigateTaskDetail(res);
        }
        this.convertBulkToTask(res);
      });
  }

  convertBulkToTask(res) {
    this.resConvertMultipleTask = res;
    this.templateDatas = res?.template?.data;
    this.conversationFaileds = res.conversationFaileds;
    this.conversationSuccess = res.conversationSuccess;
    if (this.conversationSuccess?.length) {
      this.headerService.setConversationAction({
        option: EMessageMenuOption.CONVERT_MULTIPLE_TO_TASK,
        taskId: null,
        isTriggeredFromRightPanel: false,
        isTriggeredFromToolbar: true,
        messageIds: this.selectedMessageIds
      });
      this.inboxService.setConversationSuccess(res.conversationSuccess);
      this.statusSending.next({
        statusSocket: this.statusSending.value.statusSocket,
        statusApi: true
      });
    }
    this.inboxService.setTaskTemplate(res?.template?.data);
    this.totalEvents = res.total;
  }

  navigateTaskDetail(res) {
    this.showPopup = null;
    this.toastService.success(CONVERT_TO_TASK);
    const taskId =
      res?.taskId ||
      this.createNewTaskPopUpService.getFocusedConversation()?.taskId ||
      this.conversationService.currentConversation.value?.taskId ||
      this.taskService.reloadTaskArea$.next(true);
    this.conversationService.reloadConversationList.next(true);
    this.taskService.currenTaskTrudiResponse$.next(res);
    this.taskService.reloadTrudiResponse.next(true);
    this.taskService.reloadTaskDetail.next(true);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
    // this logic must run after stack is empty (modal is close completely)
    setTimeout(() => {
      this.stopProcess(true);
    });
    this.router.navigate([stringFormat(AppRoute.TASK_DETAIL, taskId)], {
      queryParams: {
        type: 'TASK',
        conversationType: this.conversationType,
        conversationId:
          this.conversationId ||
          this.conversationService.currentConversation?.value?.id,
        createFromCalendar: this.openFrom === CreateTaskByCateOpenFrom.CALENDAR,
        tab: this.conversationService.currentConversation.value?.status
      },
      replaceUrl: true
    });
  }

  updateCurrentMailbox(mailBoxId) {
    if (!mailBoxId) return;
    const currentMailBox = this.listMailbox?.find(
      (mail) => mail.id === mailBoxId
    );
    this.inboxService.setCurrentMailBox(currentMailBox);
    this.inboxService.setIsArchiveMailbox(false);
    this.inboxService.setCurrentMailBoxId(mailBoxId);
    this.inboxService.setSyncMailBoxStatus(EMailBoxStatus.ACTIVE);
  }

  onTaskNameChange(e: TaskItemDropdown) {
    this.chatGptGenerate = {
      ...this.chatGptGenerate,
      emailTitle: this.handleTaskNameTitleChange(e),
      subcategory: e?.label
    };
  }

  handleTaskNameTitleChange(
    task: TaskRegionItem | TaskName | TaskItemDropdown
  ): string {
    return task?.label;
  }

  createFolder(e) {
    this.showPopup = e;
  }

  backPopupCreateTask(e) {
    this.showPopup = EPopupShow.CREATE_TASK_POPUP;
  }

  closePopupCreateFolder(e) {
    if (this.showPopup === EPopupShow.CREATE_FOLDER_POPUP) {
      this.onQuit.emit();
      this.stopProcessCreateNewTask.emit();
      this.createTaskFormService.clear();
    }
  }

  addNewFolderConfirm(taskFolder: ITaskFolder) {
    this.createNewTaskPopUpService.setTriggerAddNewFolder(taskFolder);
  }

  defaultNextCreateNewTask(data) {
    switch (this.openFrom) {
      case CreateTaskByCateOpenFrom.CONVERT_TO_TASK:
      case CreateTaskByCateOpenFrom.MESSAGE:
        this.convertMessageToTask(data);
        break;
      case CreateTaskByCateOpenFrom.CALENDAR_EVENT_BULK_CREATE_TASKS:
        this.onNext.emit(data);
        break;
      case CreateTaskByCateOpenFrom.CREATE_BULK_MULTIPLE_TASK:
      case CreateTaskByCateOpenFrom.CREATE_MULTIPLE_TASK:
        this.convertMultipleToTask(data);
        break;
      case CreateTaskByCateOpenFrom.ADD_ITEM_TO_TASK:
        this.onNext.emit(data);
        break;
      default:
        this.createNewTask(data);
    }
  }

  chatGptGenerateTitleAndSummary() {
    let conversation =
      this.sharedMessageViewService.prefillCreateTaskDataValue.conversations[0];
    const pattern = /^\s*\S+\s*/;

    const body = {
      conversationId: conversation?.id,
      receiveUserId: conversation?.userId,
      currentUserId: this.userService.userInfo$.getValue()?.id,
      toneOfVoice: 'Professional',
      message: ''
    };

    this.conversationService
      .getHistoryOfConversationV2(conversation?.id, false)
      .subscribe((data) => {
        const lastMessageByUser = data.list.find((item) => {
          if (item.messageType?.toUpperCase() === EMessageType.ticket) {
            return (
              item?.options?.response?.type ===
                EOptionType.RESCHEDULE_INSPECTION_REQUEST ||
              item.options?.type === EOptionType.RESCHEDULE_REQUEST ||
              item?.options?.response?.type === EOptionType.VACATE_REQUEST ||
              item.options?.response?.type ===
                EOptionType.MAINTENANCE_REQUEST ||
              item.options?.response?.type === EOptionType.GENERAL_ENQUIRY
            );
          }
          if (conversation?.inviteStatus === UserStatus.ACTIVE) {
            return (
              item.userType === UserTypeEnum.USER &&
              ![
                'yes',
                'no',
                'submit',
                'yes please',
                'yes, please',
                'cancel'
              ].includes((item.message as string).toLocaleLowerCase()) &&
              item.messageType?.toUpperCase() === EMessageType.defaultText
            );
          }
          return (
            [
              UserTypeEnum.USER,
              null,
              UserTypeEnum.SUPPLIER,
              UserTypeEnum.OTHER
            ].includes(item.userType) &&
            item.messageType?.toUpperCase() === EMessageType.defaultText
          );
        });

        this.hasUserInMessage = !!lastMessageByUser;
        const messageContent =
          lastMessageByUser?.messageType?.toUpperCase() === EMessageType.ticket
            ? this.chatGptService.getMessageContentOfTicketMessage(
                lastMessageByUser
              )
            : lastMessageByUser?.message;

        if (pattern.test(messageContent)) {
          this.newMessage.next(
            messageContent?.split("<div id='email-signature'>")[0]
          );
        } else {
          if (pattern.test(lastMessageByUser?.conversationTitle)) {
            this.newMessage.next(lastMessageByUser?.conversationTitle);
          }
        }
      });

    this.newMessage.pipe(takeUntil(this.destroy$)).subscribe((data: string) => {
      if (data && pattern.test(data)) {
        this.chatGptService
          .generateTaskTitle({ ...body, message: data }, this.currentAgencyId)
          .subscribe({
            next: (res) => {
              if (!res) return;
              if (res) {
                this.chatGptGenerate = {
                  emailTitle: res.content?.emailTitle?.trim(),
                  emailSummary: res.content?.emailSummary,
                  subcategory: res.content?.subcategory
                };
              }
              if (!res.content?.emailTitle?.trim()) {
                this.chatGptGenerate = {
                  ...this.chatGptGenerate,
                  emailTitle: this.taskService.currentTask$
                    ?.getValue()
                    ?.title?.trim()
                };
              }
            },
            error: (error) => {
              this.chatGptGenerate = {
                emailTitle: this.taskService.currentTask$
                  ?.getValue()
                  ?.title?.trim(),
                emailSummary: '',
                subcategory: ''
              };
            }
          });
      }
    });
  }

  handlePopupState(state: ICreateNewTaskPopUpState) {
    this.popupState = { ...this.popupState, ...state };
  }

  resetPopupState() {
    if (!this.openByModalExistingTask)
      this.inboxService.setPopupMoveToTaskState(null);
    for (const key in this.popupState) {
      if (Object.prototype.hasOwnProperty.call(this.popupState, key)) {
        this.popupState[key] = false;
      }
    }
  }

  setLogWorkflowExecution() {
    if (
      ![
        CreateTaskByCateOpenFrom.TASK_DETAIL,
        CreateTaskByCateOpenFrom.EMERGENCY_MAINTENANCE_TASK
      ].includes(this.openFrom)
    )
      return;
  }

  onCloseCreateTaskByCate(event?: boolean) {
    this.stopProcess(event);
  }

  onBackCreateTaskByCate() {
    this.handlePopupState({
      ...this.popupState,
      selectTaskAndProperty: true,
      createTaskByCategory: false
    });
  }

  public handleBack() {
    if (this.openByModalExistingTask) {
      this.taskService.triggerToggleMoveConversationSate.next({
        singleMessage: false,
        multipleMessages: true
      });
    } else this.onBack.emit();
  }

  ngOnDestroy() {
    this.stopProcess();
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.waitToCreate);
    this.createTaskFormService.clear();
  }

  @HostListener('click', ['$event'])
  onClick($event) {
    $event.stopPropagation();
  }
}
