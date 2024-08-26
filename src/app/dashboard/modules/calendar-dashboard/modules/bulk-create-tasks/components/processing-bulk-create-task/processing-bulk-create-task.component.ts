import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import {
  Observable,
  Subject,
  combineLatest,
  filter,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import {
  ICalendarEvent,
  PopUpBulkCreateTasks
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { SocketBulkCreateTask } from '@shared/types/socket.interface';
import { RxWebsocketService } from '@services/rx-websocket.service';
import {
  BulkTasksCreate,
  CalendarEventBulkCreateTaskSuccess,
  CalendarEventBulkTasksCreated,
  ICreateBulkTaskResponse,
  PayloadGetListTaskNameRegionId,
  ResponseGetTaskNameRegionId,
  StatusResultBulkCreateTask,
  TaskCreate,
  TaskTemplate
} from '@shared/types/task.interface';
import { TaskService } from '@services/task.service';
import { ToastrService } from 'ngx-toastr';
import { CreateNewTaskPopUpService } from '@/app/share-pop-up/create-new-task-pop-up/services/create-new-task-pop-up.service';
import { CalendarEventService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-list-view/services/calendar-event.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';

@Component({
  selector: 'processing-bulk-create-task',
  templateUrl: './processing-bulk-create-task.component.html',
  styleUrls: ['./processing-bulk-create-task.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProcessingBulkCreateTaskComponent implements OnInit, OnDestroy {
  @Input() listEvents: ICalendarEvent[] = [];
  @Input() sessionId: string;
  @Input() dataFormCreateTask: TaskCreate;
  @Input() agencyId: string;
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onComplete: EventEmitter<CalendarEventBulkCreateTaskSuccess> =
    new EventEmitter<CalendarEventBulkCreateTaskSuccess>();
  public readonly typePopup = PopUpBulkCreateTasks;
  private destroy$: Subject<void> = new Subject<void>();
  public displayPopup: PopUpBulkCreateTasks;
  public totalTask: number = 0;
  public completeTask: number = 0;
  public listEventFailedCreateTask: ICalendarEvent[] = [];
  private listResultBulkCreateTasks: SocketBulkCreateTask[] = [];
  private waitToDisplayFail: NodeJS.Timeout;
  private waitToComplete: NodeJS.Timeout;
  public taskTemplate: TaskTemplate;
  private tasksCreated: CalendarEventBulkTasksCreated[] = [];
  private listTaskNameRegionIds: ResponseGetTaskNameRegionId[] = [];

  constructor(
    private _calendarService: CalendarService,
    private _rxWebsocketService: RxWebsocketService,
    private _taskService: TaskService,
    private _toastService: ToastrService,
    private createNewTaskPopUpService: CreateNewTaskPopUpService,
    private agencyService: AgencyService,
    private calendarEventService: CalendarEventService
  ) {}

  ngOnInit(): void {
    this.totalTask = this.listEvents.length;
    this._calendarService
      .getPopupBulkCreateTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.displayPopup = res;
      });
    this.createTasks(this.listEvents);
  }

  get percentProgressComplete(): number {
    if (this.totalTask > 0) {
      return (this.completeTask / this.totalTask) * 100;
    } else {
      return 0;
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

  private getPayloadForBulkCreateTasks(
    listEvents: ICalendarEvent[]
  ): BulkTasksCreate {
    return {
      sessionCreateTaskId: this.sessionId,
      tasks: listEvents.map((event) => ({
        eventId: event.id,
        taskId: this.dataFormCreateTask.taskId,
        taskNameId: this.dataFormCreateTask?.taskNameId,
        propertyId: event.propertyId,
        assignedUserIds: this.dataFormCreateTask.assignedUserIds,
        taskNameTitle: this.dataFormCreateTask.taskNameTitle,
        taskTitle: this.dataFormCreateTask.taskTitle,
        indexTitle: this.dataFormCreateTask.indexTitle,
        notificationId: this.dataFormCreateTask.notificationId,
        mailBoxId: this.dataFormCreateTask.mailBoxId,
        taskFolderId: this.dataFormCreateTask.taskFolderId
      }))
    };
  }

  private createTasks(listEvents: ICalendarEvent[]) {
    let createTasks$: Observable<ICreateBulkTaskResponse>;
    let listEventHasRegion: ICalendarEvent[] = this.listEvents.filter(
      (event) => event.region
    );
    if (
      this.listTaskNameRegionIds.length === 0 &&
      listEventHasRegion.length > 0
    ) {
      let payloadGetListTaskNameRegionId: PayloadGetListTaskNameRegionId = {
        taskNameId: this.dataFormCreateTask.taskNameId,
        regionIds: listEventHasRegion.map((event) => event.region?.id)
      };
      createTasks$ = this._taskService
        .getListtaskNameRegionIds(payloadGetListTaskNameRegionId)
        .pipe(
          switchMap((res) => {
            this.listTaskNameRegionIds = res;
            return this._taskService.bulkCreateTasksFromCalendarEvents(
              this.getPayloadForBulkCreateTasks(listEvents)
            );
          })
        );
    } else {
      createTasks$ = this._taskService.bulkCreateTasksFromCalendarEvents(
        this.getPayloadForBulkCreateTasks(listEvents)
      );
    }

    combineLatest([
      createTasks$.pipe(
        takeUntil(this.destroy$),
        tap(() => this.updateRememberFolder(this.dataFormCreateTask))
      ),
      this._rxWebsocketService.onSocketBulkCreateTasks.pipe(
        takeUntil(this.destroy$),
        filter((res) => res && res.sessionCreateTaskId === this.sessionId),
        tap((res) => {
          const index: number = this.listResultBulkCreateTasks.findIndex(
            (item) => item.data.eventId === res.data.eventId
          );
          if (index >= 0) {
            this.listResultBulkCreateTasks[index] = res;
          } else {
            this.listResultBulkCreateTasks.push(res);
          }
          this.completeTask = this.listResultBulkCreateTasks.length;
        }),
        filter(() => this.completeTask === this.totalTask)
      )
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([createdTasks, _]) => {
        createdTasks.successfullys.forEach((item) => {
          this.tasksCreated.push({
            taskId: item.id,
            propertyId: item.property?.id
          });
        });
        let totalSuccess: number = createdTasks.successfullys.length;
        if (totalSuccess > 0) {
          this._toastService.success(
            `${totalSuccess} task${totalSuccess >= 2 ? 's' : ''} created`
          );
          createdTasks.successfullys.forEach((item) => {
            let eventIndex = listEvents.findIndex(
              (event) => event.id === item.eventId
            );
            if (eventIndex !== -1) {
              let newListEvents = [...listEvents];
              newListEvents[eventIndex] = {
                ...newListEvents[eventIndex],
                id: item.eventId,
                latestLinkedTask: {
                  taskId: item.id,
                  task: {
                    id: item.id,
                    title: item.title,
                    createdAt: item.createdAt
                  }
                }
              };

              this.calendarEventService.setNewTaskAfterCreatedMulti(
                newListEvents
              );
            }
          });
        }
        this.taskTemplate = createdTasks.successfullys[0].trudiResponse
          .data as unknown as TaskTemplate;

        const eventIdsFailed: string[] = this.listResultBulkCreateTasks
          .filter((item) => item.status === StatusResultBulkCreateTask.ERROR)
          .map((item) => item.data.eventId);
        if (eventIdsFailed.length > 0) {
          this.listEventFailedCreateTask = this.listEvents.filter((item) =>
            eventIdsFailed.some((id) => id === item.id)
          );
          this._calendarService.setPopupBulkCreateTasks(
            PopUpBulkCreateTasks.FAILED_TO_CREATE_TASK
          );
        } else {
          this.onComplete.emit(this.getDataComplete());
          this._calendarService.setPopupBulkCreateTasks(
            PopUpBulkCreateTasks.SELECT_OPTION_FOR_SEND_MESSAGE
          );
        }
      });
  }

  public onSkip() {
    if (this.tasksCreated.length > 0) {
      this.onComplete.emit(this.getDataComplete());
      this._calendarService.setPopupBulkCreateTasks(
        PopUpBulkCreateTasks.SELECT_OPTION_FOR_SEND_MESSAGE
      );
    } else {
      this.onComplete.emit(null);
      this.onCancel.emit();
    }
  }

  private getDataComplete(): CalendarEventBulkCreateTaskSuccess {
    return {
      template: this.taskTemplate,
      events: this.listEvents.filter(
        (item) => !this.listEventFailedCreateTask.includes(item)
      ),
      tasks: this.tasksCreated
    };
  }

  public onTryAgain() {
    this.completeTask = this.totalTask - this.listEventFailedCreateTask.length;
    this.listResultBulkCreateTasks = this.listResultBulkCreateTasks.filter(
      (item) => item.status !== StatusResultBulkCreateTask.ERROR
    );
    this._calendarService.setPopupBulkCreateTasks(
      PopUpBulkCreateTasks.BULK_TASKS_IS_CREATING
    );
    this.createTasks(this.listEventFailedCreateTask);
  }

  public handleCancel() {
    this.onCancel.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.waitToDisplayFail);
    clearTimeout(this.waitToComplete);
  }
}
