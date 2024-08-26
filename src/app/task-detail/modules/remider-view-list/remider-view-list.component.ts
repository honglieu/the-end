import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import {
  ListReminderDay,
  listSelectRemiderSetting
} from '@shared/types/reminders.interface';
import {
  Subject,
  switchMap,
  finalize,
  takeUntil,
  of,
  combineLatest,
  filter,
  debounceTime,
  catchError,
  map,
  distinctUntilChanged,
  mergeMap,
  forkJoin
} from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import {
  EInboxFilterSelected,
  EMessageQueryType,
  EMessageType
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { GroupType } from '@shared/enum/user.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { PropertiesService } from '@services/properties.service';
import { SocketType, TaskStatusType, TaskType } from '@shared/enum';
import { TaskService } from '@services/task.service';
import {
  EReminderFilterParam,
  ReminderMessageType
} from '@/app/dashboard/modules/inbox/enum/reminder-message.enum';
import { ReminderMessageService } from '@/app/task-detail/services/reminder-message.service';
import { cloneDeep } from 'lodash-es';
import { defaultConfigsButtonAction } from '@/app/task-detail/modules/app-chat/components/button-action/utils/constant';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  IGetInfoTasksForPrefillDynamicBody,
  ITasksForPrefillDynamicData
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import {
  IMessageReminder,
  IReminderFilterParam
} from '@/app/dashboard/modules/inbox/interfaces/reminder-message.interface';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { CurrentUser } from '@shared/types/user.interface';
import { hasMessageFilter } from '@/app/dashboard/modules/inbox/utils/function';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { EMessageStatusFilter } from '@shared/components/filter-by-status/filter-status-box/filter-status-box.component';
import { DeliveryFailedMessageStorageService } from '@services/deliveryFailedMessageStorage.service';
import { TaskItem } from '@shared/types/task.interface';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { isEqual } from 'lodash-es';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { VirtualReminderListViewportComponent } from './components/virtual-reminder-list-viewport/virtual-reminder-list-viewport.component';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import {
  ASSIGN_TO_MESSAGE,
  ASSIGN_TO_TASK
} from '@services/messages.constants';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'remider-view-list',
  templateUrl: './remider-view-list.component.html',
  styleUrls: ['./remider-view-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [DeliveryFailedMessageStorageService]
})
export class RemiderViewListComponent implements OnInit, OnDestroy {
  @Input() taskDetailViewMode = EViewDetailMode.TASK;
  @Input() hasSelectedInbox: boolean = false;
  @Input() queryParamRemider: string;

  @ViewChild(VirtualReminderListViewportComponent)
  listView: VirtualReminderListViewportComponent;

  private readonly destroy$ = new Subject<void>();
  private currentMailboxId: string = null;
  public currentReminderType: ReminderMessageType =
    ReminderMessageType.UNANSWERED;
  public listReminderDay: ListReminderDay[] = listSelectRemiderSetting;
  public selectedDays = '30 minutes';
  public isIgnore: boolean = false;
  public queryParam: Params;
  public messageReminderSetting;
  public subMessage: string;
  readonly ReminderMessageType = ReminderMessageType;
  public reminderList: IMessageReminder[] = []; // does not filter item because it has some issues virtual scroll and animation, should be use isRemove = true
  public isLoading: boolean = true;
  public loadingMore: boolean = false;
  public isSkeleton: boolean = true;
  public isFocusView: boolean = false;
  public hasFilter: boolean = false;
  public selectedMinutes: number = 30;
  public sendMsgModalConfig = cloneDeep(defaultConfigsButtonAction);
  public isShowSendMsgModal: boolean = false;
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
  public messageReminder: IMessageReminder;
  public teamMembersInMailBox: number;
  public messageStatus: string[] = [];
  public taskDeliveryFailIds: string[] = [];
  public assignedTo: string[] = [];
  public propertyManagerId: string[] = [];
  readonly EReminderFilterParam = EReminderFilterParam;
  private timeoutRef: NodeJS.Timeout = null;
  private currentUser: CurrentUser;
  public messageId: string;
  public isRemoveAll: boolean = false;
  private messageRouteStatus: string = '';

  private readonly reminderTimePeriods = [
    [1, 2],
    [30, 32],
    [60, 62],
    [360, 362],
    [720, 722],
    [1440, 1442],
    [2880, 2882],
    [4320, 4322],
    [10080, 10082]
  ];

  get isStopLoading() {
    return !this.isLoading && !this.isSkeleton;
  }

  private filter: IReminderFilterParam = {
    page: 0,
    limit: 20,
    search: '',
    reminderType: ReminderMessageType.UNANSWERED,
    type: EMessageType.MY_MESSAGES,
    mailBoxId: '',
    assignedTo: [],
    propertyManagerId: [],
    messageStatus: [],
    taskDeliveryFailIds: [],
    status: '',
    isShowIgnore: false,
    reminderTime: 0
  };

  private isMaxItem: boolean = false;

  get isConsole() {
    return this.sharedService.isConsoleUsers();
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    public inboxService: InboxService,
    public mailboxSettingService: MailboxSettingService,
    public propertiesService: PropertiesService,
    private reminderMessageService: ReminderMessageService,
    public taskService: TaskService,
    private websocketService: RxWebsocketService,
    private sharedService: SharedService,
    private readonly userService: UserService,
    private readonly inboxFilterService: InboxFilterService,
    private readonly deliveryFailedMessageStorageService: DeliveryFailedMessageStorageService,
    private messageFlowService: MessageFlowService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private toastCustomService: ToastCustomService
  ) {}

  ngOnInit(): void {
    this.subscribeQueryParams();
    this.triggerMessageItemReminder();
    this.subscribeIgnoreMessageReminder();
    this.subscribeCurrentUser();
    this.subscribeReminderWS();
    this.triggerTotalMessageReminder();
    this.subscribeMailboxSettings();
    this.subscribeMessageSocket();
    this.subscribeAssignToAgentMessage();
    this.subscriptionRemoveMessageWS();
    this.onSaveDraftMsg();
  }

  subscribeAssignToAgentMessage() {
    this.reminderMessageService.assignToAgentMessageReminder$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.handleAssignMessage(res);
      });
  }

  subscribeMessageSocket() {
    this.websocketService.onSocketMessage
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res && res.mailBoxId === this.currentMailboxId)
      )
      .subscribe((res) => {
        if (res.type === SocketType.assignTask) this.handleAssignMessage(res);
      });
  }

  onSaveDraftMsg() {
    this.trudiSaveDraftService.triggerDraftBody$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => !!res?.emailMessage?.taskId),
        map((res) => {
          const taskIndex = this.reminderList.findIndex(
            (item) => item.taskId === res.emailMessage.taskId
          );
          return taskIndex;
        }),
        filter((taskIndex) => taskIndex !== -1)
      )
      .subscribe((taskIndex) => {
        if (this.reminderList[taskIndex].hasDraftMessage) return;
        this.reminderList[taskIndex] = {
          ...this.reminderList[taskIndex],
          hasDraftMessage: true
        };
        this.reminderList = [...this.reminderList];
        this.cdr.markForCheck();
      });
  }

  handleAssignMessage(res) {
    const message = res as TaskItem;
    const isUnassignedPM =
      this.isFocusView &&
      message?.assignToAgents?.every(
        (agent) => agent?.id !== this.currentUser?.id
      ) &&
      this.reminderList.some((item) => item?.taskId === message?.id);

    const hasReminder = this.reminderList?.some(
      (item) => item?.taskId === message?.id
    );

    if (!hasReminder) {
      return;
    }

    if (isUnassignedPM) {
      this.removeMultipleReminderFromList(message.id, true);
      this.reminderMessageService.triggerDataMessageReminder$.next(true);
    } else {
      this.reminderList = this.reminderList.map((item) => {
        if (item?.taskId === message?.id) {
          return { ...item, assignToAgents: message?.assignToAgents };
        }
        return item;
      });
    }
    this.cdr.markForCheck();
  }

  handleNewMessage(res) {
    //handle case add new message draft
    if (!res.isDraft || !res.taskIds?.length) return;
    const taskIndex = this.reminderList.findIndex((item) =>
      res.taskIds.includes(item.taskId)
    );
    if (taskIndex === -1) return;
    if (this.reminderList[taskIndex].hasDraftMessage) return;
    this.reminderList[taskIndex] = {
      ...this.reminderList[taskIndex],
      hasDraftMessage: true
    };
    this.reminderList = [...this.reminderList];
    this.cdr.detectChanges();
  }

  triggerTotalMessageReminder() {
    this.reminderMessageService.triggerDataMessageReminder$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          return this.applyFilter();
        })
      )
      .subscribe((data) => {
        this.cdr.markForCheck();
        this.reminderMessageService.totalMessageReminderByType.next(
          data?.totalMessage
        );
      });
  }

  subscribeCurrentUser() {
    this.userService
      .getUserDetail()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
      });
  }

  subscribeReminderWS() {
    this.websocketService.onSocketReminderMessage
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => !res?.data?.messagesRemoved),
        filter(
          (res) =>
            res?.data?.messages?.length > 0 &&
            res.mailBoxId === this.currentMailboxId
        ),
        mergeMap((res) => {
          const currentTimeSetting =
            this.currentReminderType === ReminderMessageType.UNANSWERED
              ? this.messageReminderSetting?.unanswered?.reminderTime
              : this.messageReminderSetting?.follow_up?.reminderTime;
          const currentPeriod = this.reminderTimePeriods.find(
            (period) =>
              period[0] >= currentTimeSetting || currentTimeSetting <= period[1]
          );

          let listMessageId = res.data.messages
            .filter((item) => {
              if (res?.isUnIgnoreForTime || res?.isResolveOrReopenMessage) {
                return item.reminderType === this.currentReminderType;
              } else {
                return (
                  item.reminderType === this.currentReminderType &&
                  currentPeriod[0] <= Number(item.reminderTime) &&
                  Number(item.reminderTime) <= currentPeriod[1] &&
                  (this.currentReminderType === ReminderMessageType.FOLLOW_UP
                    ? item.userType === 'MAILBOX' ||
                      (item.userType === 'LEAD' &&
                        item.createdUserId === this.currentUser.id)
                    : true)
                );
              }
            })
            .map((item) => item.id);

          let refreshView = false;
          let applyApi = false;
          if (listMessageId?.length) {
            listMessageId.forEach((id, index) => {
              const item = this.reminderList.find(
                (item) => item.messageId === id
              );
              if (!item) return;
              item['isRemove'] = false;
              refreshView = true;
            });
            listMessageId = listMessageId.filter((item) => item);
            applyApi = !!listMessageId.length;
            if (refreshView && !applyApi) {
              this.reminderList = [...this.reminderList];
              this.reminderMessageService.triggerDataMessageReminder$.next(
                true
              );
              this.isRemoveAll = false;
              this.cdr.markForCheck();
            }
          }

          if (!applyApi) return of();
          return forkJoin(
            listMessageId.map((id) =>
              this.applyFilter({ messageIds: [id] }).pipe(
                catchError(() => of(null))
              )
            )
          );
        })
      )
      .subscribe((dataArray) => {
        if (!Array.isArray(dataArray)) {
          return;
        }

        const updatedReminderList = new Map(
          this.reminderList.map((item) => [item.messageId, item])
        );
        dataArray.forEach((data) => {
          if (data && Array.isArray(data.messagesResult)) {
            data.messagesResult.forEach((item) => {
              updatedReminderList.set(item.messageId, item);
            });
          }
        });
        this.reminderList = this.sortByTime(
          Array.from(updatedReminderList.values())
        );
        this.isRemoveAll = false;
        this.reminderMessageService.triggerDataMessageReminder$.next(true);
        this.cdr.markForCheck();
      });
  }

  subscriptionRemoveMessageWS() {
    this.websocketService.onSocketReminderMessage
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => !res?.data?.messages),
        filter(
          (res) =>
            res?.data?.messagesRemoved.length > 0 &&
            res.mailBoxId === this.currentMailboxId
        ),
        switchMap((res) => {
          if (res.data.messagesRemoved) {
            res.data.messagesRemoved.forEach((removedItem) => {
              const messageId = this.reminderList.find(
                (item) =>
                  item.messageId === removedItem?.id &&
                  removedItem?.reminderType === this.currentReminderType
              ).messageId;
              this.removeReminderFromList(messageId);
              this.cdr.markForCheck();
            });
          }
          return this.applyFilter();
        })
      )
      .subscribe((data) => {
        this.reminderMessageService.totalMessageReminderByType.next(
          data?.totalMessage
        );
      });
  }

  subscribeIgnoreMessageReminder() {
    this.reminderMessageService.triggerIgnoreMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        const { messageItem } = res;
        const isUndoMessage = !!res.undoMessage;
        const isIgnoreMessage = !!messageItem?.isIgnoreMessage;
        const messageId = messageItem?.messageId;
        if (!this.isIgnore) {
          if (!isUndoMessage && !isIgnoreMessage) {
            this.removeReminderFromList(messageId);
          }
          if (isUndoMessage && !isIgnoreMessage) {
            const removeItem = this.reminderList.find(
              (item) => item.messageId === messageId
            );
            removeItem['isRemove'] = false;
            this.reminderList = [...this.reminderList];
          }
        } else {
          if (
            (!isUndoMessage && !isIgnoreMessage) ||
            (isUndoMessage && isIgnoreMessage)
          ) {
            this.updateReminderList(messageId, true);
          }

          if (
            (!isUndoMessage && isIgnoreMessage) ||
            (isUndoMessage && !isIgnoreMessage)
          ) {
            const isUndoMessage = messageItem?.group_data_index === 1;
            this.updateReminderList(messageId, false, isUndoMessage);
          }
        }
        this.reminderMessageService.triggerDataMessageReminder$.next(true);
        this.isRemoveAll = this.reminderList.every((item) => item?.isRemove);
        this.cdr.markForCheck();
        const reminderItems = (
          this.listView?.viewport?.elementRef?.nativeElement as HTMLDivElement
        ).querySelectorAll('message-reminder');
        let ignoreList = [];
        reminderItems?.forEach((item) => {
          ignoreList.push(item.getAttribute('data-ignore'));
        });
        const ignoreCount = ignoreList.filter((item) => item).length;
        if (ignoreCount < ignoreList.length - 1) return;
        this.reminderList = [];
        this.isLoading = true;
        this.cdr.markForCheck();
        this.applyFilter({
          page: 0
        }).subscribe((data) => {
          if (Array.isArray(data?.messagesResult)) {
            this.reminderList = data.messagesResult;
            this.isRemoveAll = this.reminderList.every(
              (item) => item?.isRemove
            );
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      });
  }

  updateReminderList(
    messageId: string,
    isIgnore: boolean,
    isUndoMessage?: boolean
  ) {
    this.reminderList = this.sortByTime(
      this.reminderList.map((item) => {
        if (item?.messageId === messageId) {
          return {
            ...item,
            isIgnoreMessage: isIgnore,
            group_data_index: !isIgnore && isUndoMessage ? 1 : 2
          };
        }
        return item;
      })
    );
  }

  sortByTime(data) {
    return data?.sort((a, b) => {
      if (a.group_data_index === 1 && b.group_data_index !== 1) {
        return -1;
      } else if (a.group_data_index !== 1 && b.group_data_index === 1) {
        return 1;
      } else {
        if (a.group_data_index === 1) {
          return (
            new Date(b.sort_time).getTime() - new Date(a.sort_time).getTime()
          );
        } else {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
      }
    });
  }

  removeReminderFromList(id: string, isTask = false) {
    const property = isTask ? 'taskId' : 'messageId';
    const removeItem = this.reminderList.find((item) => item[property] === id);
    if (!removeItem) return false;
    removeItem['isRemove'] = true;
    this.reminderList = [...this.reminderList];
    this.isRemoveAll = this.reminderList.every((item) => item?.isRemove);
    return true;
  }

  removeMultipleReminderFromList(id: string, isTask = false) {
    const property = isTask ? 'taskId' : 'messageId';

    this.reminderList.forEach((item) => {
      if (item[property] === id) {
        item['isHidden'] = true;
      }
    });

    this.isRemoveAll = this.reminderList.every((item) => item?.isHidden);
  }

  triggerMessageItemReminder() {
    this.reminderMessageService.triggerMessageItemReminder$
      .pipe(takeUntil(this.destroy$))
      .pipe(
        map((res) => {
          if (res) {
            const tasks = {
              tasks: [
                {
                  taskId: res.messageReminder.taskId,
                  propertyId: res.messageReminder.property?.id
                }
              ]
            } as IGetInfoTasksForPrefillDynamicBody;
            this.sendMsgModalConfig['inputs.selectedTasksForPrefill'] = tasks;
            this.isShowSendMsgModal = true;
            this.messageReminder = res?.messageReminder;
            this.sendMsgModalConfig = res?.sendMsgModalConfig;
            return res;
          } else return null;
        }),
        switchMap((messageData) => {
          if (!messageData) return of(null);
          return this.messageFlowService.openSendMsgModal(
            this.sendMsgModalConfig
          );
        })
      )
      .subscribe((res) => {
        if (res) {
          switch (res.type) {
            case ESendMessageModalOutput.MessageSent:
              this.onSendMsg(res.data);
              break;
            case ESendMessageModalOutput.Quit:
              this.resetConfig();
              break;
          }
        }
      });
  }

  initParam(queryParam: Params) {
    this.subMessage =
      queryParam[EReminderFilterParam.REMINDER_TYPE] ===
      ReminderMessageType.UNANSWERED
        ? 'To view reminders assigned to other team members,'
        : 'To see reminders for the rest of the team,';

    this.queryParam = queryParam;
  }

  resetState(queryParam: Params) {
    if (
      queryParam[EReminderFilterParam.REMINDER_TYPE] &&
      this.currentReminderType !==
        queryParam[EReminderFilterParam.REMINDER_TYPE]
    ) {
      this.currentReminderType = queryParam[EReminderFilterParam.REMINDER_TYPE];
      this.reminderList = [];
      this.isMaxItem = false;
      this.isLoading = true;
      this.isSkeleton = true;
      this.loadingMore = true;
      this.cdr.markForCheck();
    }
  }

  subscribeMailboxSettings() {
    combineLatest([
      this.mailboxSettingService.mailBoxId$,
      this.websocketService.onSocketUpdatePermissionMailBox
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([mailBoxId, socket]) => {
        if (socket.data?.id === mailBoxId) {
          this.teamMembersInMailBox = socket.data?.teamMembers;
        }
      });
  }

  subscribeQueryParams() {
    combineLatest([
      this.activatedRoute.queryParams.pipe(
        distinctUntilChanged((prev, cur) => {
          if (!this.messageRouteStatus || !cur) {
            this.messageRouteStatus = cur?.['status'];
            return false;
          }
          if (this.messageRouteStatus !== cur['status']) {
            // handle case change status list message
            this.messageRouteStatus = cur['status'];
            return true;
          }
          for (const key in prev) {
            if (prev[key] !== cur[key]) {
              return false;
            }
          }
          return false;
        })
      ),
      this.inboxService.getCurrentMailBoxId(),
      this.reminderMessageService.getMessReminderSetting(),
      this.mailboxSettingService.mailboxSetting$,
      this.inboxFilterService.selectedStatus$,
      this.inboxFilterService.selectedAgency$,
      this.inboxFilterService.selectedInboxType$,
      this.inboxFilterService.selectedPortfolio$
    ])
      .pipe(
        distinctUntilChanged((previous, current) => isEqual(previous, current)),
        takeUntil(this.destroy$),
        debounceTime(50),
        switchMap(
          ([
            queryParam,
            mailboxId,
            messageReminderSetting,
            mailboxSetting,
            selectedStatus,
            selectedAgency,
            selectedInboxType,
            selectedPortfolio
          ]) => {
            if (!mailboxId || !queryParam || !messageReminderSetting)
              return of(null);
            const queryMessageStatus =
              selectedStatus?.length > 0
                ? selectedStatus
                : queryParam[EInboxFilterSelected.MESSAGE_STATUS];
            this.messageStatus = Array.isArray(queryMessageStatus)
              ? queryMessageStatus
              : queryMessageStatus
              ? [queryMessageStatus]
              : [];
            const type = this.isConsole
              ? TaskStatusType.team_task
              : selectedInboxType || queryParam[EMessageQueryType.INBOX_TYPE];

            this.assignedTo =
              !(this.teamMembersInMailBox <= 1) && type === GroupType.TEAM_TASK
                ? selectedAgency?.length > 0
                  ? selectedAgency
                  : queryParam[EInboxFilterSelected.ASSIGNED_TO] || ''
                : [];

            this.propertyManagerId =
              selectedPortfolio?.length > 0
                ? selectedPortfolio
                : queryParam[EInboxFilterSelected.PROPERTY_MANAGER_ID];

            this.taskDeliveryFailIds = (
              this.messageStatus.includes(EMessageStatusFilter.DELIVERY_FAILED)
                ? this.deliveryFailedMessageStorageService.getDeliveryFailedMessageTaskIds()
                : []
            ) as string[];
            this.messageReminderSetting = messageReminderSetting;
            this.isFocusView =
              queryParam[EMessageQueryType.INBOX_TYPE] === GroupType.MY_TASK;
            this.teamMembersInMailBox = mailboxSetting.teamMembers;
            this.currentMailboxId = mailboxId;
            this.resetState(queryParam);
            this.initParam(queryParam);
            this.hasFilter = hasMessageFilter(queryParam);
            this.isIgnore =
              this.queryParam[EReminderFilterParam.REMINDER_TYPE] ===
              ReminderMessageType.UNANSWERED
                ? messageReminderSetting?.unanswered?.isIgnore
                : messageReminderSetting?.follow_up?.isIgnore;
            this.selectedMinutes =
              this.queryParam[EReminderFilterParam.REMINDER_TYPE] ===
              ReminderMessageType.UNANSWERED
                ? messageReminderSetting?.unanswered?.reminderTime
                : messageReminderSetting?.follow_up?.reminderTime;
            const selectedReminderDay = this.listReminderDay.find(
              (reminderTime) => reminderTime?.minutes === this.selectedMinutes
            );
            this.selectedDays = selectedReminderDay?.value;
            this.isLoading = true;
            this.isSkeleton = true;
            this.cdr.markForCheck();
            return this.applyFilter({
              isShowIgnore:
                this.queryParam[EReminderFilterParam.REMINDER_TYPE] ===
                ReminderMessageType.UNANSWERED
                  ? messageReminderSetting?.unanswered?.isIgnore
                  : messageReminderSetting?.follow_up?.isIgnore,
              reminderTime:
                this.queryParam[EReminderFilterParam.REMINDER_TYPE] ===
                ReminderMessageType.UNANSWERED
                  ? messageReminderSetting?.unanswered?.reminderTime
                  : messageReminderSetting?.follow_up?.reminderTime
            });
          }
        )
      )
      .subscribe((data) => {
        this.reminderMessageService.totalMessageReminderByType.next(
          data?.totalMessage
        );

        if (Array.isArray(data?.messagesResult)) {
          this.reminderList = this.sortByTime(data?.messagesResult) || [];
          this.isRemoveAll = this.reminderList.every((item) => item?.isRemove);
        }
      });
  }

  private getMessageType(queryParamType) {
    switch (queryParamType) {
      case TaskStatusType.my_task:
        return EMessageType.MY_MESSAGES;
      case TaskStatusType.team_task:
        return EMessageType.TEAM_MESSAGES;
      default:
        return EMessageType.MY_MESSAGES;
    }
  }

  buildFilter(newPram = {}) {
    this.filter = {
      mailBoxId: this.currentMailboxId,
      search: this.queryParam[EReminderFilterParam.SEARCH],
      type: this.isConsole
        ? EMessageType.TEAM_MESSAGES
        : this.getMessageType(this.queryParam['inboxType']),
      assignedTo: this.assignedTo || [],
      propertyManagerId: this.propertyManagerId || [],
      messageStatus: this.messageStatus || [],
      taskDeliveryFailIds: this.taskDeliveryFailIds,
      limit: 20,
      page: 0,
      status: TaskStatusType.inprogress,
      reminderType: this.queryParam[EReminderFilterParam.REMINDER_TYPE],
      isShowIgnore: this.isIgnore,
      reminderTime: this.selectedMinutes,
      ...newPram
    };
  }

  applyFilter(newPram = {}) {
    if (!this.queryParam[EReminderFilterParam.REMINDER_TYPE]) return of();
    this.buildFilter(newPram);
    return this.reminderMessageService.getListMessageApi(this.filter).pipe(
      finalize(() => {
        this.isLoading = false;
        this.isSkeleton = false;
        this.loadingMore = false;
        this.cdr.markForCheck();
      }),
      catchError(() => {
        return of();
      })
    );
  }

  handleChangePage(page: number) {
    if (
      !this.queryParam[EReminderFilterParam.REMINDER_TYPE] ||
      this.isMaxItem ||
      this.loadingMore
    )
      return;
    this.loadingMore = true;
    // update use detectChanges because change page event emit form with cdk-virtual-scroll-viewport run outside angular
    // change detection not run
    this.cdr.detectChanges();
    this.applyFilter({ page }).subscribe((data) => {
      if (Array.isArray(data?.messagesResult)) {
        if (data.messagesResult.length === 0) {
          this.isMaxItem = true;
        } else {
          this.reminderList = [...this.reminderList, ...data.messagesResult];
          this.reminderMessageService.totalMessageReminderByType.next(
            data?.totalMessage
          );
        }
      }
      this.cdr.detectChanges();
    });
  }

  handleChangeReminderTime(selectedDay) {
    const selectedDayReminder =
      this.queryParam[EReminderFilterParam.REMINDER_TYPE] ===
      ReminderMessageType.UNANSWERED
        ? selectedDay?.unanswered
        : selectedDay?.followUp;
    this.listReminderDay.forEach((remiderTime) => {
      if (remiderTime?.value === selectedDayReminder) {
        this.selectedMinutes = remiderTime?.minutes;
      }
    });
    this.updateMessageReminderSetting();
  }

  updateMessageReminderSetting() {
    this.isMaxItem = false;
    const payload = {
      reminderTime: this.selectedMinutes,
      mailBoxId: this.currentMailboxId,
      isIgnore: this.isIgnore,
      reminderType: this.queryParam[EReminderFilterParam.REMINDER_TYPE]
    };
    this.reminderMessageService
      .updateMessageReminderSetting(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const reminderType =
          this.queryParam[EReminderFilterParam.REMINDER_TYPE];
        const unansweredSetting = this.messageReminderSetting.unanswered;
        const followUpSetting = this.messageReminderSetting.follow_up;

        const updatedSettings = {
          unanswered: {
            reminderTime:
              reminderType === ReminderMessageType.UNANSWERED
                ? this.selectedMinutes
                : unansweredSetting.reminderTime,
            isIgnore:
              reminderType === ReminderMessageType.UNANSWERED
                ? this.isIgnore
                : unansweredSetting.isIgnore
          },
          follow_up: {
            reminderTime:
              reminderType === ReminderMessageType.FOLLOW_UP
                ? this.selectedMinutes
                : followUpSetting.reminderTime,
            isIgnore:
              reminderType === ReminderMessageType.FOLLOW_UP
                ? this.isIgnore
                : followUpSetting.isIgnore
          }
        };

        this.reminderMessageService.setMessReminderSetting(updatedSettings);
      });
  }

  handleToggleIgnore(value) {
    this.isIgnore =
      this.queryParam[EReminderFilterParam.REMINDER_TYPE] ===
      ReminderMessageType.UNANSWERED
        ? value?.unanswered
        : value?.followUp;
    this.updateMessageReminderSetting();
  }

  onSendMsg(e: ISendMsgTriggerEvent) {
    const event = {
      ...e,
      ...(e.data?.['task']?.type === TaskType.TASK && {
        reminderType: this.queryParam[EReminderFilterParam.REMINDER_TYPE]
      })
    };
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.isShowSendMsgModal = false;
        if (!event?.isDraft) {
          this.removeReminderFromList(this.messageReminder?.messageId);
          this.cdr.markForCheck();
          this.reminderMessageService.triggerDataMessageReminder$.next(true);
        }
        this.toastCustomService.openToastCustom(
          this.toastCustomService.getToastConfig(
            event,
            event.data?.['task']?.type === TaskType.MESSAGE
          ),
          true,
          EToastCustomType.SUCCESS_WITH_VIEW_BTN
        );
        const { taskType, assignToAgents } = this.messageReminder;
        if (!assignToAgents.some((user) => user.id === this.currentUser.id)) {
          this.toastCustomService.handleShowToastByMailBox(
            taskType === TaskType.MESSAGE ? ASSIGN_TO_MESSAGE : ASSIGN_TO_TASK,
            {
              enableHtml: true
            }
          );
        }
        break;
      default:
        break;
    }
  }

  handleQuit() {
    this.isShowSendMsgModal = false;
  }

  resetConfig() {
    this.sendMsgModalConfig = cloneDeep(defaultConfigsButtonAction);
  }

  ngOnDestroy(): void {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
