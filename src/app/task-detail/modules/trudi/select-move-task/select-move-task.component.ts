import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { AppRoute } from '@/app/app.route';
import { stringFormat } from '@core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { ConversationService } from '@services/conversation.service';
import { MESSAGE_MOVED_TO_TASK } from '@services/messages.constants';
import { PropertiesService } from '@services/properties.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { TaskStatusType } from '@shared/enum/task.enum';
import { EUserPropertyType, GroupType } from '@shared/enum/user.enum';
import { handleFormatDataListTaskMove } from '@shared/feature/function.feature';
import {
  ListTaskOptions,
  SearchTask,
  TaskItem,
  TaskList
} from '@shared/types/task.interface';
import { isSupplierOrOtherOrExternal } from '@/app/user/utils/user.type';

@Component({
  selector: 'select-move-task',
  templateUrl: './select-move-task.component.html',
  styleUrls: ['./select-move-task.component.scss']
})
export class SelectMoveTaskComponent implements OnInit, OnDestroy {
  @Input() title: string;
  @Input() taskStatus: TaskStatusType;

  public listTask: TaskList;
  public selectedTask: string;
  private LAZY_LOAD_TASK = 50;
  private currentPage = 0;
  private searchTask: SearchTask = {
    term: '',
    onlyMyTasks: true,
    onlyInprogress: true
  };
  private unsubscribe = new Subject<void>();
  public disabledMoveToTaskBtn: boolean = false;
  public isMissingRequiredField: boolean = false;
  public propertyId: string = '';
  public userType: string = '';
  public isRmEnvironment: boolean = false;
  private currentAgencyId: string;
  public isArchiveMailbox: boolean = false;
  public isConsole: boolean;
  private getListTaskToMove$ = new Subject<{
    paramGetTask: ListTaskOptions;
    currentAgencyId: string;
  }>();
  public isDisconnected: boolean = false;
  public currentMailBoxId: string;
  readonly TaskStatusType = TaskStatusType;

  constructor(
    public conversationService: ConversationService,
    public propertyService: PropertiesService,
    public taskService: TaskService,
    private router: Router,
    private route: ActivatedRoute,
    private agencyService: AgencyService,
    private toastService: ToastrService,
    public inboxService: InboxService,
    private sharedService: SharedService,
    private companyService: CompanyService
  ) {
    this.getListTaskToMove();
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.currentMailBoxId = res;
      });

    this.taskService.dataMoveTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((taskData) => {
        this.userType = taskData?.unhappyStatus?.confirmContactType;
        this.getListTaskMove();
      });
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isDisconnected) => {
        this.isDisconnected = isDisconnected;
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  getListTaskMove() {
    const currentConversation =
      this.conversationService.currentConversation.getValue();
    const excludeUnHappyPath = true;
    const isOwnerNoProperty =
      !currentConversation?.streetline &&
      currentConversation?.startMessageBy === EUserPropertyType.LANDLORD;
    const isNoProperty =
      isSupplierOrOtherOrExternal(this.userType as EUserPropertyType) ||
      isSupplierOrOtherOrExternal(currentConversation?.propertyType) ||
      (this.isRmEnvironment && isOwnerNoProperty);
    const propertyIdPayload = isNoProperty
      ? ''
      : this.taskService.dataMoveTask$.value?.property?.id;
    const paramGetTask: ListTaskOptions = {
      search: this.searchTask.term,
      type: this.searchTask.onlyMyTasks
        ? GroupType.MY_TASK
        : GroupType.MY_TASK_AND_TEAM_TASK,
      propertyId: propertyIdPayload,
      excludeUnHappyPath,
      limit: this.LAZY_LOAD_TASK,
      page: this.currentPage,
      includeCompletedTask: this.searchTask.onlyInprogress ? false : true,
      mailBoxId: this.currentMailBoxId
    };
    this.getListTaskToMove$.next({
      paramGetTask: paramGetTask,
      currentAgencyId: this.currentAgencyId
    });
  }

  getListTaskToMove() {
    this.getListTaskToMove$
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        switchMap(({ paramGetTask, currentAgencyId }) => {
          return this.taskService.getListTaskToMove(
            paramGetTask,
            currentAgencyId
          );
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            const dataFormat: TaskList = handleFormatDataListTaskMove(
              data.data
            );
            if (this.currentPage === 0) this.listTask = dataFormat;
            else {
              this.listTask = {
                my_task: this.listTask.my_task.concat(dataFormat.my_task),
                team_task: this.listTask.team_task.concat(dataFormat.team_task),
                completed: this.listTask.completed.concat(dataFormat.completed),
                deleted: this.listTask.deleted.concat(dataFormat.deleted),
                my_task_and_team_task:
                  this.listTask.hasOwnProperty('my_task_and_team_task') &&
                  dataFormat.hasOwnProperty('my_task_and_team_task')
                    ? this.listTask.my_task_and_team_task.concat(
                        dataFormat.my_task_and_team_task
                      )
                    : []
              };
            }
          }
        },
        error: () => {}
      });
  }

  getNextPage() {
    this.currentPage += 1;
    this.getListTaskMove();
  }

  handleChangeSearchTask(searchTask: SearchTask) {
    if (
      JSON.stringify(this.searchTask) === JSON.stringify(searchTask) &&
      this.currentPage === 0
    ) {
      this.listTask = { ...this.listTask };
    } else {
      this.searchTask = { ...searchTask };
      this.currentPage = 0;
      this.listTask = undefined;
      this.getListTaskMove();
    }
  }

  onItemChange(event: TaskItem) {
    this.selectedTask = event?.id;
  }

  onSubmit() {
    if (
      this.isArchiveMailbox ||
      this.isConsole ||
      this.taskStatus === TaskStatusType.deleted
    )
      return;
    const isUnHappyPath = true;
    if (this.selectedTask) {
      this.disabledMoveToTaskBtn = true;
      this.isMissingRequiredField = false;
      this.taskService
        .moveMessToDifferentTask(
          this.taskService.currentTaskId$.getValue(),
          this.selectedTask,
          this.conversationService.currentConversation.getValue().id,
          isUnHappyPath
        )
        .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res) {
            this.disabledMoveToTaskBtn = false;
            this.taskService.updateTaskItems$.next({
              listTaskId: [
                this.taskService.currentTaskId$.getValue(),
                this.selectedTask
              ]
            });
            this.taskService.reloadTrudiResponse.next(true);
            this.router.navigate(
              [stringFormat(AppRoute.TASK_DETAIL, this.selectedTask)],
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
}
