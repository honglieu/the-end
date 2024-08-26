import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { UserService } from '@/app/dashboard/services/user.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { Agent } from '@shared/types/agent.interface';
import { AssignToAgent, TaskItem } from '@shared/types/task.interface';
import { CurrentUser } from '@shared/types/user.interface';
import { PopoverService } from './../../../../services/popover.service';
import {
  ASSIGN_TO_MESSAGE,
  ASSIGN_TO_TASK
} from '@services/messages.constants';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { trudiUserId } from '@services/constants';
import { EPlacement } from '@shared/types';
import { trudiAgent } from '@/app/shared/components/assign-attach-box';

export interface IAssignedAgentValue {
  task: TaskItem;
  isRemove: boolean;
}

interface Assignee {
  id: string;
  fullName: string;
  status: TaskStatusType;
}

@DestroyDecorator
@Component({
  selector: 'assign-to-agents',
  templateUrl: './assign-to-agents.component.html',
  styleUrls: ['./assign-to-agents.component.scss']
})
export class AssignToAgentsComponent implements OnInit, OnChanges {
  @Input() displayText = 'Assign This Task';
  @Input() task: TaskItem;
  @Input() titleMode: 'button' | 'avatar' = 'button';
  @Input() isDetailSection: boolean;
  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.TASK;
  @Input() avatarSize: number = 20;
  @Input() maxDisplayAssignees: number = 2;
  @Input() isCustom = false;
  @Input() isReadOnly = false;
  @Input() isShowParticipantDrawer: boolean = false;
  @Input() isShowTooltip: boolean = true;
  @Input() showTrudiAgent: boolean = false;
  @Output() onAssignToAgentsClick = new EventEmitter<boolean>();
  @Output() onAssignAgentsSelectedClick =
    new EventEmitter<IAssignedAgentValue>();
  @Output() onAssignUpdate = new EventEmitter<boolean>();

  private unsubscribe = new Subject<void>();
  public displayAssignedAgents: AssignToAgent[] = [];
  public nonDisplayAssignedAgents: AssignToAgent[] = [];
  public selectingUserIdListInTask: string[] = [];

  public assignAttachBoxState: boolean = false;
  public assignBoxOnTop: boolean = true;
  public assignBoxLeft: boolean = true;
  public propertyId: string = '';
  public popoverName: string;
  public POPOVER_NAME: string = 'TASK_ASSIGNED';
  public currentTaskId: string = '';
  public activeTaskAssignId$ = '';
  public currentPM: CurrentUser;
  public assignBoxPlacement = EPlacement.BOTTOM_LEFT;
  public isAssigning: boolean;
  public isArchiveMailbox: boolean;
  EViewDetailMode = EViewDetailMode;

  private assignees: Array<Assignee> = [];
  private currentAgencyId: string;

  public visibleDropdown: boolean;
  readonly trudiUserId = trudiUserId;

  constructor(
    public taskService: TaskService,
    public sharedService: SharedService,
    private readonly elr: ElementRef,
    private readonly rd2: Renderer2,
    private popoverService: PopoverService,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private toastCustomService: ToastCustomService,
    public inboxService: InboxService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task']) {
      this.onTaskChanged(changes['task']?.currentValue);
      this.handlerShowToastAutoAssign(changes);
    }
    if (changes['showTrudiAgent']) {
      this.onTaskChanged(this.task);
    }
  }

  compareArrays(arr1, arr2) {
    const areObjectsEqual = (obj1, obj2) =>
      JSON.stringify(obj1) === JSON.stringify(obj2);
    return (
      arr1.length === arr2.length &&
      arr1.every((item, index) => areObjectsEqual(item, arr2[index]))
    );
  }

  handlerShowToastAutoAssign(changes: SimpleChanges) {
    const { task } = changes;
    const previousTask = task.previousValue;
    const currentTask = task.currentValue;
    const taskType = this.taskService.currentTask$.getValue()?.taskType;
    const isAssignedByUpdate = currentTask?.newAssignedIds?.some(
      (id) => id === this.currentPM?.id
    );
    if (
      (taskType === TaskType.TASK || taskType === TaskType.MESSAGE) &&
      previousTask?.id === currentTask?.id &&
      !isAssignedByUpdate
    ) {
      const previousAssignments = previousTask?.assignToAgents;
      const currentAssignments = currentTask?.assignToAgents;
      if (!this.compareArrays(previousAssignments, currentAssignments)) {
        this.handleCheckAssigned(
          previousAssignments,
          currentAssignments,
          taskType
        );
      }
    }
  }

  handleCheckAssigned(
    previousAssignments: AssignToAgent[],
    currentAssignments: AssignToAgent[],
    taskType: TaskType
  ) {
    const isAssigned = previousAssignments?.find(
      (agent) => agent.id === this.currentPM?.id
    );
    const isCurrentUser = currentAssignments?.some(
      (agent) => agent.id === this.currentPM?.id
    );
    if (!isAssigned && isCurrentUser) {
      this.toastCustomService.handleShowToastByMailBox(
        taskType === TaskType.TASK ? ASSIGN_TO_TASK : ASSIGN_TO_MESSAGE
      );
    }
  }

  onTaskChanged(task: TaskItem) {
    let taskCopy = { ...task };
    if (taskCopy?.assignToAgents) {
      let currentTaskCopy = { ...this.task };
      if (this.showTrudiAgent) {
        const agents = [
          trudiAgent,
          ...taskCopy.assignToAgents.filter((agent) => agent.id !== trudiUserId)
        ];
        taskCopy.assignToAgents = agents;
        this.task.assignToAgents = agents;
      }
      currentTaskCopy.assignToAgents = taskCopy.assignToAgents
        .map((agent) => ({
          ...(agent || {}),
          fullName:
            agent.fullName ||
            this.sharedService.displayName(agent.firstName, agent.lastName)
        }))
        .filter((agent) => this.showTrudiAgent || agent.id !== trudiUserId);
      this.selectingUserIdListInTask =
        this.taskService.getListOfUserIdAssignedTask(
          currentTaskCopy.assignToAgents
        );

      let maxDisplayAssignedAgents =
        currentTaskCopy?.assignToAgents?.length === 1 ? 2 : 3;
      if (this.titleMode === 'avatar') {
        maxDisplayAssignedAgents = Math.min(
          currentTaskCopy?.assignToAgents?.length,
          this.maxDisplayAssignees
        );
      }
      this.displayAssignedAgents = currentTaskCopy?.assignToAgents?.slice(
        0,
        maxDisplayAssignedAgents
      );
      this.nonDisplayAssignedAgents = currentTaskCopy?.assignToAgents?.slice(
        maxDisplayAssignedAgents
      );
    }
  }

  ngOnInit(): void {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));

    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.currentTaskId = res?.id;
        this.currentAgencyId = res?.agencyId;
      });

    this.taskService?.activeTaskAssignId$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.activeTaskAssignId$ = res || '';
      });
    this.handleGetPopoverName();
    this.userService
      .getSelectedUser()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) this.currentPM = res;
      });
  }

  handleGetPopoverName() {
    this.popoverService.name$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        if (value !== this.POPOVER_NAME) {
          this.assignAttachBoxState = false;
        }
        this.popoverName = value;
      });
  }

  onShowPopupAssign(event: MouseEvent) {
    const { type } = this.activatedRoute.snapshot.queryParams || {};
    const hostPosition = this.elr.nativeElement.getBoundingClientRect();
    const bodyElement = document.querySelector('body');
    this.assignBoxOnTop = hostPosition.top < bodyElement.clientHeight / 2;
    if (
      !this.assignBoxOnTop &&
      ![TaskType.TASK, TaskType.MESSAGE].includes(type)
    ) {
      this.assignBoxPlacement = EPlacement.TOP_RIGHT;
    } else {
      this.assignBoxPlacement = EPlacement.BOTTOM_LEFT;
    }
    this.propertyId = this.task?.property?.id;
    this.assignAttachBoxState = !this.assignAttachBoxState;
    this.taskService.activeTaskAssignId$.next(
      this.assignAttachBoxState ? this.task?.id : null
    );
    this.selectingUserIdListInTask =
      this.taskService.getListOfUserIdAssignedTask(this.task?.assignToAgents);
    this.popoverService.name$.next(this.POPOVER_NAME);
  }

  onItemsSelected(agent: Agent) {
    const agentIndex = this.assignees.findIndex(
      (assignee) => assignee.id == agent.id
    );
    const assignee = {
      id: agent.id,
      fullName: `${agent.firstName} ${agent.lastName}`,
      status: agent.selected
        ? TaskStatusType.assigned
        : TaskStatusType.unassigned
    };

    if (agentIndex > -1) {
      this.assignees[agentIndex] = assignee;
    } else {
      this.assignees.push(assignee);
    }

    if (!agent.selected) {
      this.taskService.onFilterChangeAssign.next(agent.id);
    }
  }

  onDropdownMenuVisibleChange(visible: boolean) {
    const originAssignees = this.task?.assignToAgents?.map((agent) => ({
      id: agent.id,
      fullName: agent.fullName,
      status: TaskStatusType.assigned
    }));
    this.visibleDropdown = visible;
    if (visible) {
      this.assignees = [...originAssignees];
      return;
    } else {
      this.assignAttachBoxState = false;
    }

    const changedAssignees = this.getChangedAssignees(
      this.assignees,
      originAssignees
    );
    if (changedAssignees?.length == 0) {
      return;
    }

    const userIds = this.assignees
      .filter((assignee) => assignee.status == TaskStatusType.assigned)
      .map((assignee) => assignee.id);
    const taskId = this.task.id;
    const { inboxType } = this.activatedRoute.snapshot.queryParams;

    this.isAssigning = true;
    this.onAssignUpdate.emit(true);
    this.taskService
      .assignTaskToAgents(taskId, userIds, this.currentAgencyId)
      .pipe(
        takeUntil(this.unsubscribe),
        finalize(() => {
          this.isAssigning = false;
          this.onAssignUpdate.emit(true);
        })
      )
      .subscribe({
        next: (task) => {
          const isUnassignedToCurrentPM = this.assignees.some(
            (assignee) =>
              assignee.id === this.currentPM?.id &&
              assignee.status == TaskStatusType.unassigned
          );
          const isUnassignedStatus = [inboxType, task?.status].includes(
            TaskStatusType.unassigned
          );
          const noAssignToAgents = !task?.assignToAgents?.length;
          const isMoveTaskToUnassigned =
            isUnassignedToCurrentPM || isUnassignedStatus || noAssignToAgents;
          this.onTaskChanged(task);
          this.onAssignAgentsSelectedClick.next({
            task,
            isRemove: isMoveTaskToUnassigned
          });
        }
      });
  }

  getChangedAssignees(newValue: Assignee[], oldValue: Assignee[]): Assignee[] {
    const idMap = oldValue.reduce<{ [key: string]: Assignee }>(
      (idMap, assignee) => {
        idMap[assignee.id] = assignee;
        return idMap;
      },
      {}
    );

    const changes = [];

    for (const assignee of newValue) {
      const oldStatus = idMap[assignee.id]?.status || TaskStatusType.unassigned;
      const newStatus = assignee.status;
      if (newStatus != oldStatus) {
        changes.push(assignee);
      }
    }

    return changes;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
