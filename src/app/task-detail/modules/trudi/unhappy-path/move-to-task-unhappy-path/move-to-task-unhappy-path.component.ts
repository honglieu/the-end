import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { AppRoute } from '@/app/app.route';
import { stringFormat } from '@core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ConversationService } from '@services/conversation.service';
import { MESSAGE_MOVED_TO_TASK } from '@services/messages.constants';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { GroupType } from '@shared/enum/user.enum';
import { handleFormatDataListTaskMove } from '@shared/feature/function.feature';
import {
  ListTaskOptions,
  SearchTask,
  TaskItem,
  TaskList
} from '@shared/types/task.interface';

@Component({
  selector: 'move-to-task-unhappy-path',
  templateUrl: './move-to-task-unhappy-path.component.html',
  styleUrls: ['./move-to-task-unhappy-path.component.scss']
})
export class MoveToTaskUnhappyPathComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();
  public selectedTaskId: string;
  public isDisabledButton: boolean = false;
  public isMissingRequiredField: boolean = false;
  private LAZY_LOAD_TASK = 50;
  private currentPage = 0;
  private searchTask: SearchTask = {
    term: '',
    onlyMyTasks: true,
    onlyInprogress: true
  };
  public taskList: TaskList;
  private currentAgencyId: string;
  public isConsole: boolean;
  public isDisconnected: boolean = false;
  public currentMailBoxId: string;

  constructor(
    public conversationService: ConversationService,
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
    private agencyService: AgencyService,
    private toastService: ToastrService,
    private inboxService: InboxService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.currentMailBoxId = res;
      });
    this.getTaskList();
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isDisconnected) => {
        this.isDisconnected = isDisconnected;
      });

    this.inboxService.isArchiveMailbox$.subscribe((isArchive) => {
      this.isDisabledButton = isArchive;
    });
  }

  getTaskList() {
    const paramGetTask: ListTaskOptions = {
      search: this.searchTask.term,
      type: this.searchTask.onlyMyTasks
        ? GroupType.MY_TASK
        : GroupType.MY_TASK_AND_TEAM_TASK,
      excludeUnHappyPath: false,
      limit: this.LAZY_LOAD_TASK,
      page: this.currentPage,
      includeCompletedTask: this.searchTask.onlyInprogress ? false : true,
      mailBoxId: this.currentMailBoxId
    };
    this.taskService
      .getListTaskToMove(paramGetTask, this.currentAgencyId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (data) {
          const dataFormat: TaskList = handleFormatDataListTaskMove(data.data);
          if (this.currentPage === 0) this.taskList = dataFormat;
          else {
            this.taskList = {
              my_task: this.taskList.my_task.concat(dataFormat.my_task),
              team_task: this.taskList.team_task.concat(dataFormat.team_task),
              completed: this.taskList.completed.concat(dataFormat.completed),
              deleted: this.taskList.deleted.concat(dataFormat.deleted),
              my_task_and_team_task:
                this.taskList.hasOwnProperty('my_task_and_team_task') &&
                dataFormat.hasOwnProperty('my_task_and_team_task')
                  ? this.taskList.my_task_and_team_task.concat(
                      dataFormat.my_task_and_team_task
                    )
                  : []
            };
          }
        }
      });
  }

  selectTask(task: TaskItem) {
    this.selectedTaskId = task?.id;
  }

  moveMessage() {
    if (this.selectedTaskId) {
      this.isDisabledButton = true;
      this.isMissingRequiredField = false;
      this.taskService
        .moveMessToDifferentTask(
          this.taskService.currentTaskId$.getValue(),
          this.selectedTaskId,
          this.conversationService.currentConversation.getValue().id,
          true
        )
        .subscribe((res) => {
          if (res) {
            this.isDisabledButton = false;
            this.taskService.updateTaskItems$.next({
              listTaskId: [
                this.taskService.currentTaskId$.getValue(),
                this.selectedTaskId
              ]
            });
            this.router.navigate(
              [stringFormat(AppRoute.TASK_DETAIL, this.selectedTaskId)],
              {
                queryParams: { type: 'TASK' },
                replaceUrl: true
              }
            );
            this.toastService.success(MESSAGE_MOVED_TO_TASK);
          }
        });
    } else {
      this.isMissingRequiredField = true;
    }
  }

  getNextPage() {
    this.currentPage += 1;
    this.getTaskList();
  }

  handleChangeSearchTask(searchTask: SearchTask) {
    this.searchTask = searchTask;
    this.currentPage = 0;
    this.taskList = undefined;
    this.getTaskList();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
