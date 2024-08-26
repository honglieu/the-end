import { EventsTabApiService } from '@shared/components/property-profile/components/events-tab/events-tab-service/events-tab-api.service';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { NgModel } from '@angular/forms';
import { BehaviorSubject, Subject, switchMap, takeUntil } from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { PropertiesService } from '@services/properties.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { EEventType } from '@shared/enum/calendar.enum';
import { TaskNameId } from '@shared/enum/task.enum';
import { GroupType } from '@shared/enum/user.enum';
import {
  ListTaskOptions,
  SearchTask,
  TaskItem,
  TaskItemDropdown,
  TaskList
} from '@shared/types/task.interface';
import { UserPropInSelectPeople } from '@shared/types/user.interface';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { CalendarEventService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-list-view/services/calendar-event.service';
import { LinkTaskService } from '@/app/dashboard/modules/calendar-dashboard/modules/link-task/services/link-task.service';

export enum ELinkTaskDecision {
  CREATE_NEW_TASK,
  EXIST_TASK
}

@Component({
  selector: 'link-task',
  templateUrl: './link-task.component.html',
  styleUrls: ['./link-task.component.scss']
})
export class LinkTaskComponent implements OnInit, OnDestroy {
  @Input() taskNameList: TaskItemDropdown[] = [];
  @Input() showLinkTaskPopup = false;
  @Output() stopProcess = new EventEmitter();
  @ViewChild('selectTaskNameModel') selectTaskNameModel: NgModel;
  @ViewChild('selectExistTaskModel') selectExistTaskModel: NgModel;
  @ViewChild('dropdown') dropdown: ElementRef;
  public popupState = {
    showCreateNewTask: false
  };
  //Link task decision radio props
  public linkTaskDecision: ELinkTaskDecision;
  public ELinkTaskDecision = ELinkTaskDecision;
  public linkTaskDecisionList = [
    {
      value: ELinkTaskDecision.CREATE_NEW_TASK,
      label: 'Create new task'
    },
    {
      value: ELinkTaskDecision.EXIST_TASK,
      label: 'Select existing task'
    }
  ];
  public configs: IConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      showDropdown: true
    }
  };
  //Create new task props
  public selectedEvent: ICalendarEvent;
  public newTaskNameId: string;
  public activeProperty: UserPropInSelectPeople[] = [];
  public taskNamesForCreateModal: TaskItemDropdown[] = [];
  public disableLinkTaskButton: boolean = false;
  public selectedTenancyId: string;
  //List exist tasks props
  public existTaskId: string;
  public currentExistTaskPage = 0;
  public isMissingRequiredField = false;
  private searchTask: SearchTask = {
    term: '',
    onlyMyTasks: true,
    onlyInprogress: true
  };
  private unsubscribe = new Subject();
  public createTaskByCateType = CreateTaskByCateOpenFrom;
  public listTask: TaskList;
  //Get list task v2 payload
  private refreshTaskListBS = new BehaviorSubject<ListTaskOptions>({
    search: '',
    type: this.searchTask.onlyMyTasks
      ? GroupType.MY_TASK
      : GroupType.MY_TASK_AND_TEAM_TASK,
    assignedTo: '',
    topic: '',
    manager: '',
    propertyId: '',
    excludeUnHappyPath: true,
    excludeConversation: true,
    limit: 100,
    page: this.currentExistTaskPage,
    onlyTask: true,
    includeCompletedTask: this.searchTask.onlyInprogress ? false : true
  });
  public showPopover: boolean = false;
  public selectedComplianceId: string;
  public currentSelectedTask;
  public isArchiveAllMail: boolean = false;
  public isConsole: boolean = false;
  public isBackButtonClicked: boolean = false;

  constructor(
    private taskService: TaskService,
    private linkTaskService: LinkTaskService,
    private propertiesService: PropertiesService,
    private calendarEventService: CalendarEventService,
    public inboxService: InboxService,
    private sharedService: SharedService,
    private readonly eventsTabApiService: EventsTabApiService
  ) {}

  ngOnInit(): void {
    this.getListAgent();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.subscribeActiveProperties();

    this.linkTaskDecision = ELinkTaskDecision.CREATE_NEW_TASK;
    this.taskService.calendarEventSelected$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.showLinkTaskPopup = true;
        this.selectedEvent = rs;
        if (rs) {
          this.refreshTaskList({
            propertyId: this.selectedEvent.propertyId,
            calendarEventId: this.selectedEvent.id
          });
        }
      });
  }

  getListAgent() {
    this.refreshTaskListBS
      .pipe(switchMap((payload) => this.taskService.getListTaskToMove(payload)))
      .subscribe((rs) => {
        if (rs) {
          this.listTask = this.linkTaskService.mergeListTaskData(
            this.listTask,
            rs
          );
        }
      });
  }

  refreshTaskList(payload: Partial<ListTaskOptions>) {
    this.refreshTaskListBS.next({
      ...this.refreshTaskListBS.value,
      ...payload,
      type: this.searchTask.onlyMyTasks
        ? GroupType.MY_TASK
        : GroupType.MY_TASK_AND_TEAM_TASK,
      includeCompletedTask: this.searchTask.onlyInprogress ? false : true
    });
  }

  subscribeActiveProperties() {
    this.propertiesService.listofActiveProp
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) this.activeProperty = res;
      });
  }

  closeLinkTaskModal() {
    if (this.isBackButtonClicked) return;
    this.showLinkTaskPopup = false;
    this.newTaskNameId = null;
    this.existTaskId = null;
    this.stopProcess.emit();
  }

  searchTasks(searchText: string, item) {
    return item.title.toLowerCase().includes(searchText.toLowerCase());
  }

  changeLinkTaskDecision(value) {
    this.resetSelectValue();
    if (value === ELinkTaskDecision.CREATE_NEW_TASK) {
      const searchTask = {
        onlyInprogress: true,
        onlyMyTasks: true,
        term: ''
      };
      this.handleChangeSearchTask(searchTask);
    }
  }

  onTaskSelectChanged(value) {
    this.currentSelectedTask = value;
  }

  resetSelectValue() {
    this.newTaskNameId = null;
    this.existTaskId = null;
    this.isMissingRequiredField = false;
    this.onTaskSelectChanged(null);
  }

  linkTask() {
    this.isBackButtonClicked = false;
    if (!this.validateDecision() || this.isArchiveAllMail) return;
    if (this.linkTaskDecision === ELinkTaskDecision.CREATE_NEW_TASK) {
      this.createNewTask();
    } else {
      this.linkTaskToEvent();
    }
  }

  createNewTask() {
    this.showLinkTaskPopup = false;
    this.handlePopupState({ showCreateNewTask: true });
    this.taskNamesForCreateModal = this.taskNameList.filter(
      (item) => item.id === this.newTaskNameId
    );
    this.taskService.tasknameSelectedCalander$.next(this.currentSelectedTask);
    switch (this.taskNamesForCreateModal[0]?.id) {
      case TaskNameId.tenantVacate:
        if (this.selectedEvent.eventType === EEventType.OUTGOING_INSPECTION) {
          this.taskService
            .getTenancyIdByInspectionId(this.selectedEvent?.subEventId)
            .subscribe((res) => {
              res && (this.selectedTenancyId = res.tenancyId);
            });
        }
        break;
      case TaskNameId.generalCompliance:
      case TaskNameId.smokeAlarms:
        this.selectedComplianceId = this.selectedEvent?.subEventId;
        break;
      default:
        break;
    }
  }

  linkTaskToEvent() {
    this.disableLinkTaskButton = true;
    this.linkTaskService
      .linkTaskToEvent({
        taskId: this.existTaskId,
        calendarEventIds: [this.selectedEvent.id]
      })
      .subscribe({
        next: (res) => {
          let eventData = res.find((x) => (x.id = this.selectedEvent.id));
          let newData = {
            ...this.selectedEvent,
            latestLinkedTask: eventData.latestLinkedTask,
            totalLinkedTask: eventData.totalLinkedTask
          };
          this.calendarEventService.linkedCalendarEvent.next(newData);
        },
        complete: () => {
          this.eventsTabApiService.refetchEventDetail$.next();
          this.disableLinkTaskButton = false;
          this.calendarEventService.linkedCalendarEvent.next(null);
          this.closeLinkTaskModal();
        }
      });
  }

  validateDecision() {
    if (this.linkTaskDecision === ELinkTaskDecision.CREATE_NEW_TASK) {
      this.selectTaskNameModel.control.markAsTouched();
      return this.selectTaskNameModel.valid;
    } else {
      this.isMissingRequiredField = !this.existTaskId;
      return !this.isMissingRequiredField;
    }
  }

  quitCreateNewTask() {
    this.showLinkTaskPopup = false;
    this.handlePopupState({ showCreateNewTask: false });
  }

  handlePopupState(value: Partial<typeof this.popupState>) {
    this.popupState = { ...this.popupState, ...value };
  }

  closeCreateNewTask() {
    this.showLinkTaskPopup = true;
    this.handlePopupState({
      showCreateNewTask: false
    });
  }
  getNextPage() {
    this.currentExistTaskPage += 1;
    this.refreshTaskList({ page: this.currentExistTaskPage });
  }

  handleChangeSearchTask(searchTask: SearchTask) {
    this.searchTask = searchTask;
    this.currentExistTaskPage = 0;
    this.listTask = null;
    this.refreshTaskList({ page: this.currentExistTaskPage });
  }

  onItemChange(event: TaskItem) {
    this.existTaskId = event?.id;
    this.isMissingRequiredField = false;
  }

  togglePopover(): void {
    this.showPopover = !this.showPopover;
  }

  onBackLinkTask(): void {
    this.isBackButtonClicked = true;
    this.handlePopupState({ showCreateNewTask: false });
    this.showLinkTaskPopup = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.dropdown?.nativeElement?.contains(event.target)) {
      this.showPopover = false;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next(true);
  }
}
