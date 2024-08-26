import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { EInvoiceType } from '@shared/enum/creditor-invoicing.enum';
import { conversations } from 'src/environments/environment';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { TaskStatusType } from '@shared/enum/task.enum';
import { RegionInfo } from '@shared/types/agency.interface';
import { Agent, InviteStatus } from '@shared/types/agent.interface';
import {
  IListConversationConfirmProperties,
  IListConvertMultipleTask,
  PreviewConversation,
  TypeNote,
  UserConversation
} from '@shared/types/conversation.interface';
import {
  AssignToAgent,
  BulkTasksCreate,
  ICreateBulkTaskResponse,
  IDefaultObject,
  IListConversationTask,
  IUpdateTaskBody,
  IUpdateTaskResponse,
  ListTaskOptions,
  NewTaskOptions,
  PayloadGetListTaskNameRegionId,
  QueryParamsGetListMessage,
  TaskDataPayloadChangeStatus,
  TaskItem,
  TaskItemDropdown,
  TaskList,
  TaskName,
  TaskRegionItem,
  UpdateTaskItems
} from '@shared/types/task.interface';
import { TaskType } from './../shared/enum/task.enum';
import { ApiService } from './api.service';
import { SharedService } from './shared.service';
import { UserService } from './user.service';
import { ETaskTemplateStatus } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { ISocketSyncTaskActivityToPT } from '@shared/types/socket.interface';

interface MovingTaskData {
  task: TaskItem;
  source: string;
  destination: string;
}

interface ScrollToTaskItemActiveData {
  isActive: boolean;
  isArchived: boolean;
}

interface FilterTaskState {
  type: string;
  status: string;
  search: string;
  topic?: any;
  portfolio: any;
  assignee: any;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  public taskJustCreated$: BehaviorSubject<TaskItem> = new BehaviorSubject(
    null
  );
  public currentTaskId$: BehaviorSubject<string> = new BehaviorSubject(null);
  public currentTask$: BehaviorSubject<TaskItem> = new BehaviorSubject(null);
  public listOfConversations$: BehaviorSubject<Partial<UserConversation>[]> =
    new BehaviorSubject(null);
  public onResetTrudiResPet$: BehaviorSubject<TaskItem> = new BehaviorSubject(
    null
  );
  public readTask$: BehaviorSubject<TaskItem> = new BehaviorSubject(null);
  public currentStatusTask$: BehaviorSubject<string> = new BehaviorSubject(
    null
  );
  public currenTaskTrudiResponse$: BehaviorSubject<TaskItem> =
    new BehaviorSubject(null);
  public isCompleteTask$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public isResetFilter: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public previousRouter: BehaviorSubject<string> = new BehaviorSubject<string>(
    null
  );
  public selectedConversationList: BehaviorSubject<
    (PreviewConversation | UserConversation)[]
  > = new BehaviorSubject<(PreviewConversation | UserConversation)[]>([]);
  public activeTaskAssignId$: BehaviorSubject<string> = new BehaviorSubject(
    null
  );
  public filterTaskState$: BehaviorSubject<FilterTaskState> =
    new BehaviorSubject({
      type: '',
      status: '',
      search: '',
      topic: null,
      portfolio: null,
      assignee: null
    });
  public filterAssigned$: BehaviorSubject<any> = new BehaviorSubject(null);
  public filterTopic$: BehaviorSubject<any> = new BehaviorSubject(null);
  public filterPortfolio$: BehaviorSubject<any> = new BehaviorSubject(null);

  public resetTaskList$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public reloadTaskList$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public reloadTaskArea$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public moveTaskItem$: BehaviorSubject<MovingTaskData> =
    new BehaviorSubject<MovingTaskData>(null);
  public totalTask$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public markTaskAsRead$ = new BehaviorSubject<{
    taskId: string;
    taskStatus: TaskStatusType;
    isRead: boolean;
  }>(null);
  public scrollToTaskItemActive$ =
    new BehaviorSubject<ScrollToTaskItemActiveData>(null);
  public updateTaskItems$: BehaviorSubject<UpdateTaskItems> =
    new BehaviorSubject(null);
  public removeTasks$: BehaviorSubject<string[]> = new BehaviorSubject(null);
  public messageAttachmentUpdateIds: BehaviorSubject<string[]> =
    new BehaviorSubject(null);
  public statisticTask$: BehaviorSubject<any> = new BehaviorSubject(null);
  public controlButton$: BehaviorSubject<any> = new BehaviorSubject(null);
  public listStatusTopic$: BehaviorSubject<Map<string, boolean>> =
    new BehaviorSubject(new Map());
  public clickSendTask$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public openTaskFromNotification$: BehaviorSubject<any> = new BehaviorSubject(
    null
  );
  public reloadTaskDetail: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public reloadTrudiResponse: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public reloadTrudiResponseReschedule: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public dataMoveTask$: BehaviorSubject<any> = new BehaviorSubject(null);
  public calendarEventSelected$: BehaviorSubject<ICalendarEvent> =
    new BehaviorSubject<ICalendarEvent>(null);
  public listInviteStatus: typeof InviteStatus = InviteStatus;
  public totalTaskByAgents: BehaviorSubject<Map<string, number>> =
    new BehaviorSubject(new Map());
  public onFilterChangeAssign: BehaviorSubject<string> = new BehaviorSubject(
    null
  );
  private listRegion: BehaviorSubject<RegionInfo[]> = new BehaviorSubject(null);

  public currentAgencyId: string;
  public currentMailBoxId: string;
  private unsubscribe$ = new Subject<void>();
  public tasknameSelectedCalander$: BehaviorSubject<TaskRegionItem> =
    new BehaviorSubject(null);
  private hasRescheduleRequest = new BehaviorSubject(false);
  public hasRescheduleRequest$ = this.hasRescheduleRequest;
  public listConfirmProperies$: BehaviorSubject<IListConvertMultipleTask> =
    new BehaviorSubject(null);
  public currentDataTaskActivity$: BehaviorSubject<ISocketSyncTaskActivityToPT> =
    new BehaviorSubject(null);

  public listconversationId: BehaviorSubject<string[]> = new BehaviorSubject<
    []
  >(null);
  public conversationsTaskConfirmProperties$: BehaviorSubject<IListConversationTask> =
    new BehaviorSubject(null);
  public selectedTaskToMove: BehaviorSubject<string> = new BehaviorSubject(
    null
  );
  public triggerReloadHistoryAfterSync: Subject<{
    key: string;
    status: boolean;
    threadIds?: string[];
  }> = new Subject();
  public triggerSyncAttachment: Subject<string[]> = new Subject();
  public triggerOpenMessageDetail: Subject<string> = new Subject();
  private headerLeftHeight: BehaviorSubject<number> =
    new BehaviorSubject<number>(0);
  public triggerToggleMoveConversationSate: BehaviorSubject<{
    singleMessage: boolean;
    multipleMessages: boolean;
    isTaskDetail?: boolean;
    isOpenByDragDrop?: boolean;
  }> = new BehaviorSubject(null);

  constructor(
    private apiService: ApiService,
    private sharedService: SharedService,
    private userService: UserService,
    private router: Router,
    private agencyService: AgencyService,
    private inboxService: InboxService
  ) {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(filter((mailBoxId) => !!mailBoxId))
      .subscribe((mailBoxId) => {
        this.currentMailBoxId = mailBoxId;
      });
  }

  getTaskById(taskId: string) {
    return this.apiService
      .getData<TaskItem>(`${conversations}task?taskId=${taskId}`)
      .pipe(map((response) => response.body));
  }

  readTask(taskId: string) {
    return this.apiService.postAPI(
      conversations,
      'reset-unread-task?taskId=' + taskId,
      {}
    );
  }

  convertArrayToQueryParams(arrValues: any, parmName: string): any {
    if (Array.isArray(arrValues) && arrValues.length > 0) {
      return arrValues
        .map((value) => {
          return value.id;
        })
        .join(`&${parmName}=`);
    }
    return arrValues;
  }

  getListTask(
    search = '',
    status = '',
    assignedTo: any = '',
    topic: any = '',
    manager: any = '',
    propertyId = '',
    excludeUnHappyPath = false,
    excludeConversation = false,
    limit = '50',
    page = '0',
    onlyTask = false
  ) {
    return this.apiService
      .getData<TaskList>(
        `${conversations}v1/task?search=${search}&status=${status}&assignedTo=${this.convertArrayToQueryParams(
          assignedTo,
          'assignedTo'
        )}&propertyManagerId=${this.convertArrayToQueryParams(
          manager,
          'propertyManagerId'
        )}&topicId=${this.convertArrayToQueryParams(
          topic,
          'topicId'
        )}&propertyId=${propertyId}&excludeUnHappyPath=${excludeUnHappyPath}&excludeConversation=${excludeConversation}&limit=${limit}&page=${page}&onlyTask=${onlyTask}`
      )
      .pipe(map((response) => response.body));
  }

  getListTaskMessage(query: QueryParamsGetListMessage) {
    const {
      type = '',
      search = '',
      status = '',
      assignedTo = '',
      topic = '',
      manager = '',
      propertyId = '',
      excludeUnHappyPath = false,
      excludeConversation = false,
      limit = '50',
      page = '0',
      onlyTask = false
    } = query;
    return this.apiService
      .getData<TaskList>(
        `${conversations}/v2/message/${
          this.currentAgencyId || this.agencyIdFromLocalStorage
        }?search=${search}&type=${type}&assignedTo=${this.convertArrayToQueryParams(
          assignedTo,
          'assignedTo'
        )}&propertyManagerId=${this.convertArrayToQueryParams(
          manager,
          'propertyManagerId'
        )}&topicId=${this.convertArrayToQueryParams(
          topic,
          'topicId'
        )}&propertyId=${propertyId}&excludeUnHappyPath=${excludeUnHappyPath}&excludeConversation=${excludeConversation}&limit=${limit}&page=${page}&onlyTask=${onlyTask}&status=`
      )
      .pipe(map((response) => response.body));
  }

  getListTaskFolder(payload: ListTaskOptions) {
    return this.apiService.postAPI(
      conversations,
      'tasks/v2/get-list-tasks',
      payload
    );
  }

  getListTaskToMove(
    options: ListTaskOptions,
    agencyId?: string
  ): Observable<TaskList> {
    const defaultOptions = {
      onlyTask: false,
      includeCompletedTask: false,
      excludeUnHappyPath: false,
      excludeConversation: true,
      limit: 50,
      page: 0
    };

    const queryParams = {
      ...defaultOptions,
      ...options
    } as ListTaskOptions;

    if (agencyId) {
      queryParams['agencyId'] = agencyId;
    }

    if (options.assignedTo?.length > 0) {
      queryParams.assignedTo = this.convertArrayToQueryParams(
        options.assignedTo,
        'assignedTo'
      );
    }
    if (options.manager?.length > 0) {
      queryParams.propertyManagerId = this.convertArrayToQueryParams(
        options.manager,
        'propertyManagerId'
      );
    }
    if (options.topic?.length > 0) {
      queryParams.topicId = this.convertArrayToQueryParams(
        options.topic,
        'topicId'
      );
    }

    const url = `${conversations}v3/task`;
    return this.apiService
      .getData<TaskList>(url, queryParams)
      .pipe(map((response) => response.body));
  }

  getListTaskToMoveV2(
    options: ListTaskOptions,
    agencyId?: string
  ): Observable<TaskList> {
    const defaultOptions = {
      onlyTask: false,
      includeCompletedTask: false,
      excludeUnHappyPath: false,
      excludeConversation: true,
      limit: 50,
      page: 0
    };
    const url = `v3/task/move-conversations`;

    return this.apiService.postAPI(conversations, url, {
      ...defaultOptions,
      ...options
    });
  }

  getTaskCount(): Observable<any> {
    return this.apiService
      .getAPI(
        conversations,
        `v3/statistic-task?agencyId=${
          this.currentAgencyId || this.agencyIdFromLocalStorage
        }`
      )
      .pipe(
        tap((data) => {
          this.statisticTask$.next(data);
        })
      );
  }

  getListDefaultObject(): Observable<IDefaultObject> {
    return this.apiService.getAPI(conversations, 'get-list-default-object');
  }

  checkIfTaskAssignedToAgent(task: TaskItem, agentId: string) {
    if (
      task?.status === TaskStatusType.unassigned ||
      task?.status === TaskStatusType.deleted
    ) {
      return false;
    }
    return (
      task?.assignToAgents.some(
        (el) => el.id === (agentId || localStorage.getItem('userId'))
      ) &&
      (task?.status === TaskStatusType.inprogress ||
        task?.status === TaskStatusType.completed) &&
      !!this.totalTask$.getValue()
    );
  }

  checkIfCurrentTaskDeleted(): boolean {
    return this.currentTask$.getValue()?.status === TaskStatusType.deleted;
  }

  getCurrentTask(): TaskItem {
    return this.currentTask$.getValue();
  }

  assignTaskToAgent(
    taskId: string,
    userId: string,
    status: string,
    clearAll = false
  ) {
    const body = {
      taskId,
      userId,
      status,
      clearAll
    };
    return this.apiService.postAPI(
      conversations,
      'task/assign-agent-task',
      body
    );
  }

  assignTaskToAgents(
    taskId: string,
    userIds: Array<string>,
    agencyId: string
  ): Observable<TaskItem> {
    return this.apiService.postAPI(conversations, 'task/assign-agents-task', {
      taskId,
      userIds,
      agencyId
    });
  }

  getTaskNameList(search = '', type: TaskType) {
    return this.apiService
      .getData<TaskName[]>(
        `${conversations}taskName?search=${search}&type=${type}`
      )
      .pipe(
        map((response) => {
          const result = response.body.map((task) => ({
            ...task,
            name:
              task.name.charAt(0).toUpperCase() +
              task.name.slice(1).toLowerCase()
          }));
          return result;
        })
      );
  }

  createTaskName(name: string, topicId: string) {
    return this.apiService.postAPI(conversations, 'taskName', {
      name,
      topicId
    });
  }

  convertMessageToTask(
    taskId: string,
    taskNameId: string,
    propertyId: string,
    assignedUserIds: string[],
    options?: NewTaskOptions,
    taskNameTitle?: string,
    eventId?: string,
    isCreateBlankTask?: boolean,
    taskTitle: string = '',
    indexTitle: string = '',
    notificationId?: string,
    mailBoxId?: string,
    taskFolderId?: string,
    taskGroupId?: string,
    agencyId?: string
  ) {
    const body = {
      taskId,
      taskNameId,
      propertyId,
      assignedUserIds,
      options,
      ...(taskNameTitle ? { taskNameTitle } : {}),
      ...(eventId ? { eventId } : {}),
      isCreateBlankTask,
      taskTitle,
      indexTitle,
      notificationId,
      mailBoxId,
      taskFolderId,
      taskGroupId,
      agencyId
    };
    return this.apiService.postAPI(conversations, 'v2/create-task', body);
  }

  public bulkCreateTasksFromCalendarEvents(
    data: BulkTasksCreate
  ): Observable<ICreateBulkTaskResponse> {
    return this.apiService.postAPI(conversations, 'bulk-create-task', data);
  }

  public getListtaskNameRegionIds(data: PayloadGetListTaskNameRegionId) {
    return this.apiService.postAPI(
      conversations,
      'task/get-list-task-name-region',
      data
    );
  }

  updateTaskTitle(taskId: string, title: string, indexTitle: string = '') {
    const body = { title, indexTitle };
    return this.apiService.putAPI(
      conversations,
      'update-task?taskId=' + taskId,
      body
    );
  }

  getListSupplier(agencyId: string) {
    return this.apiService.getAPI(
      conversations,
      'get-pt-account/' + `?requiredSupplier=${EInvoiceType.CREDITOR_INVOICE}`,
      { agencyId }
    );
  }

  editTaskTitle(taskId: string, name: string) {
    const body = { name };
    return this.apiService.putAPI(conversations, 'taskName/' + taskId, body);
  }

  createTaskNameList(listTask?): TaskItemDropdown[] {
    const topicTaskList =
      listTask?.PUBLISHED ||
      (this.agencyService.listTask$.getValue()?.[
        ETaskTemplateStatus.PUBLISHED
      ] ??
        []);

    const taskItemDropdown = topicTaskList
      .map((t) => {
        return {
          defaultTaskFolder: t?.defaultTaskFolder,
          label: t?.name,
          id: t.id,
          disabled: false,
          aiSummary: t.aiSummary,
          value: {
            titleName: t.name,
            topicId: null,
            aiSummary: t.aiSummary
          },
          taskNameRegions: t.taskNameRegions?.map((r) => ({
            ...r,
            taskNameRegionId: r.id,
            regionName: r.region.name
          })),
          parentTemplateId: t.parentTemplateId,
          updatedAt: t?.updatedAt,
          isAllRegion: t.taskNameRegions?.length === 8
        };
      })
      .sort((a, b) => {
        return a.label.localeCompare(b.label);
      });
    return taskItemDropdown;
  }

  createAgentNameList(list: Agent[]) {
    return list?.map((item) => ({
      id: item?.id,
      label: `${item.firstName} ${item.lastName || ''}`.trim(),
      value: {
        ...item
      },
      isCurrentPM: item?.id === this.userService.userInfo$.value?.id,
      disabled:
        item?.inviteStatus === this.listInviteStatus.DEACTIVATED ? true : false
    }));
  }

  deleteTaskName(taskId: string) {
    return this.apiService.deleteAPI(conversations, 'taskName/' + taskId);
  }

  moveMessToDifferentTask(
    taskId: string,
    newTaskId: string,
    conversationId: string,
    isUnHappy: boolean
  ) {
    const body = { taskId, newTaskId, conversationId, isUnHappy };
    return this.apiService.postAPI(
      conversations,
      'task/move-conversation',
      body
    );
  }

  moveConversations(body: {
    newTaskId: string;
    conversationIds: string[];
    mailboxId: string;
  }) {
    return this.apiService.postAPI(
      conversations,
      'task/move-conversations',
      body
    );
  }

  checkMoveConversations(body: {
    newTaskId: string;
    conversationIds: string[];
  }) {
    return this.apiService.postAPI(
      conversations,
      'task/check-move-conversations',
      body
    );
  }

  sortListDescByConversation(list: TaskItem[], isDraftFolder = false) {
    const dateField = 'messageDate';
    return list.sort((a, b) => {
      const messageDateA = new Date(
        a.conversations?.[0]?.[dateField]
      ).getTime();
      const messageDateB = new Date(
        b.conversations?.[0]?.[dateField]
      ).getTime();
      return messageDateB - messageDateA;
    });
  }

  changeTaskStatus(taskId: string, status: TaskStatusType) {
    return this.apiService.postAPI(
      conversations,
      'task/change-status/' + taskId,
      { status: status }
    );
  }

  reopenDeletedConversation(conversationId: string) {
    return this.apiService.postAPI(conversations, 'reopen-conversation/', {
      conversationId
    });
  }

  changeTaskStatusMultiple(
    tasksData: TaskDataPayloadChangeStatus[],
    status: TaskStatusType
  ) {
    return this.apiService.postAPI(
      conversations,
      'task/change-status-multiple',
      {
        tasks: tasksData,
        status,
        mailBoxId: this.currentMailBoxId
      }
    );
  }

  checkAllConversationsInTaskIsRead(
    taskId: string,
    taskStatus: TaskStatusType,
    list: UserConversation[]
  ) {
    if (!(taskId && taskStatus && Array.isArray(list))) {
      return;
    }
    this.markTaskAsRead$.next({
      taskId,
      taskStatus,
      isRead: !list?.some(
        (el) => !el.isRead || el.status === EConversationType.agent_expectation
      )
    });
  }

  formatInProgressName(name: string) {
    if (!name) {
      return '';
    }

    if (name === TaskStatusType.inprogress) {
      return TaskStatusType.inprogressspace;
    }

    return name;
  }

  getListOfUserIdAssignedTask(assignToAgents: AssignToAgent[]): string[] {
    return assignToAgents.map((el) => el.id);
  }

  getNameMultipleAssignment(assignToAgents: AssignToAgent[]) {
    if (!assignToAgents || !assignToAgents.length) {
      return '';
    }
    return (
      this.sharedService.displayName(
        assignToAgents[0].firstName,
        assignToAgents[0].lastName
      ) + this.getRemainingPerson(assignToAgents)
    );
  }

  getRemainingPerson(assignToAgents: AssignToAgent[]) {
    const remainNumber = assignToAgents.length - 1;
    if (!remainNumber) {
      return '';
    }
    if (remainNumber === 1) {
      return (
        ' and ' +
        this.sharedService.displayName(
          assignToAgents[1].firstName,
          assignToAgents[1].lastName
        )
      );
    } else {
      return ' and ' + remainNumber + ' people';
    }
  }

  resetAllFilter() {
    this.filterTaskState$.next({
      type: '',
      status: '',
      search: '',
      topic: null,
      portfolio: null,
      assignee: null
    });
  }

  isMessageRoute(): boolean {
    return this.router.url.includes('/messages/');
  }

  filterTasksByRegion(
    taskNames: (TaskItemDropdown | TaskName)[],
    currentRegionId?: string,
    isGroup?: boolean,
    regionName?: string,
    listCalendarEvents:
      | ICalendarEvent[]
      | IListConversationConfirmProperties[] = [],
    filterRegion: boolean = true
  ) {
    let tasks = !!taskNames ? [...taskNames] : [];
    let propertyRegionIds = new Set<string>();
    if (currentRegionId) {
      propertyRegionIds.add(currentRegionId);
    }
    if (listCalendarEvents.length > 0) {
      listCalendarEvents.forEach((event) => {
        let regionId: string = event?.regionId ?? event.region?.id;
        if (regionId) {
          propertyRegionIds.add(regionId);
        }
      });
    }
    if (propertyRegionIds.size > 0 && filterRegion) {
      tasks = tasks
        .map((task) => ({
          ...task,
          taskNameRegions: task.taskNameRegions.filter((region) =>
            propertyRegionIds.has(region.regionId)
          )
        }))
        .filter(
          (task) => task.taskNameRegions.length === propertyRegionIds.size
        );
    }
    if (listCalendarEvents.length > 1) {
      tasks = tasks.map((task) => ({
        ...task,
        taskNameRegions: task.taskNameRegions.slice(0, 1)
      }));
    }

    return this.splitTaskByRegion(tasks, isGroup);
  }

  splitTaskByRegion(tasks: (TaskItemDropdown | TaskName)[], isGroup?: boolean) {
    return tasks.reduce((acc, cur) => {
      const arr = [];
      const { taskNameRegions, ...withoutRegion } = cur;
      taskNameRegions
        ?.sort((a, b) => (a.regionName == null ? 1 : -1))
        ?.forEach((region) =>
          !isGroup
            ? arr.push({ ...withoutRegion, ...region })
            : arr.push({ ...withoutRegion, taskNameRegion: region })
        );
      return acc.concat(arr);
    }, []);
  }

  getComplianceList(
    type: string,
    propertyId: string,
    agencyId: string,
    onlyTriggered?: boolean,
    taskId?: string
  ) {
    return this.apiService.getAPI(
      conversations,
      `compliances/compliance-categories?type=${type}&propertyId=${propertyId}&taskId=${taskId}${
        onlyTriggered ? `&onlyTriggered=${onlyTriggered}` : ''
      }`,
      { agencyId }
    );
  }

  getLastComplianceData(taskId: string) {
    return this.apiService.getAPI(conversations, `last-compliance/${taskId}`);
  }

  getSelectedConversationList() {
    return this.selectedConversationList.asObservable();
  }

  setSelectedConversationList(
    value: (PreviewConversation | UserConversation)[]
  ) {
    this.selectedConversationList.next(value);
  }

  getHeaderLeftHeight() {
    return this.headerLeftHeight.asObservable();
  }

  setHeaderLeftHeight(height: number) {
    this.headerLeftHeight.next(height);
  }

  getShortPropertyAddress() {
    const { shortenStreetline } = this.currentTask$.value?.property || {};
    return shortenStreetline;
  }

  getTenancyIdByInspectionId(inspectionId: string) {
    return this.apiService.postAPI(conversations, 'get-tenancy-id', {
      inspectionId
    });
  }

  getNoteByTaskId(taskId: string, type: string): Observable<TypeNote> {
    return this.apiService.getAPI(
      conversations,
      `get-task-note/${taskId}?type=${type}`
    );
  }

  checkNotificationHasTask(notificationId: string) {
    return this.apiService.getAPI(
      conversations,
      `notification/check-notification-has-task/${notificationId}`
    );
  }

  checkUserAssignedToTask(taskId: string) {
    return this.apiService.getAPI(
      conversations,
      `check-user-assigned-task/${taskId}`
    );
  }

  get agencyIdFromLocalStorage() {
    return localStorage.getItem('agencyId') || null;
  }

  getListRegion(): Observable<RegionInfo[]> {
    return this.listRegion.asObservable();
  }

  setListRegion(value: RegionInfo[]) {
    this.listRegion.next(value);
  }

  getCurrentTaskActivity(): Observable<ISocketSyncTaskActivityToPT> {
    return this.currentDataTaskActivity$.asObservable();
  }

  setCurrentTaskActivity(data: ISocketSyncTaskActivityToPT) {
    this.currentDataTaskActivity$.next(data);
  }

  getListConfirmProperties(): Observable<IListConvertMultipleTask> {
    return this.listConfirmProperies$.asObservable();
  }

  setListConfirmProperties(value: IListConvertMultipleTask) {
    this.listConfirmProperies$.next(value);
  }

  getConversationsTaskConfirmProperties() {
    return this.conversationsTaskConfirmProperties$.asObservable();
  }

  setConversationsTaskConfirmProperties(value: IListConversationTask) {
    this.conversationsTaskConfirmProperties$.next(value);
  }

  getSelectedListConversationId(): Observable<string[]> {
    return this.listconversationId.asObservable();
  }

  setSelectedListConversationId(value: string[]) {
    this.listconversationId.next(value);
  }

  updateTask(body: IUpdateTaskBody): Observable<IUpdateTaskResponse> {
    return this.apiService.postAPI(conversations, 'tasks/v2/update-task', body);
  }
}
