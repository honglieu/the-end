import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  distinctUntilChanged,
  Subject,
  takeUntil,
  debounceTime,
  switchMap,
  of,
  BehaviorSubject,
  forkJoin,
  tap
} from 'rxjs';
import { PropertiesService } from '@/app/services/properties.service';

import {
  SearchTask,
  TaskItem,
  TaskListMove
} from '@shared/types/task.interface';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import {
  FormGroup,
  Validators,
  FormBuilder,
  ReactiveFormsModule
} from '@angular/forms';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import { DateCasePipe } from '@shared/pipes/date-pipe';
import { TaskDateCasePipe } from '@/app/dashboard/modules/task-page/modules/task-preview/pipe/task-date-case.pipe';
import { CommonModule } from '@angular/common';
import { SelectModule, TrudiUiModule } from '@trudi-ui';
import { CompanyService } from '@/app/services/company.service';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { TaskGroupDropdownService } from '@/app/dashboard/modules/inbox/components/add-item-to-task/components/service/task-group-dropdown.service';
import { TaskGroupDropdownApiService } from '@/app/dashboard/modules/inbox/components/add-item-to-task/components/service/task-group-dropdown-api.service';
import { EMessageComeFromType } from '@/app/shared';
@Component({
  selector: 'dropdown-list-task-group',
  templateUrl: './dropdown-list-task-group.component.html',
  styleUrls: ['./dropdown-list-task-group.component.scss'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    TrudiUiModule,
    SelectModule,
    NzSkeletonModule
  ],
  providers: [
    TaskDateCasePipe,
    DateCasePipe,
    TaskGroupDropdownApiService,
    TaskGroupDropdownService
  ],
  standalone: true
})
export class DropdownListTaskGroupComponent implements OnInit, OnDestroy {
  @Input() taskIds: string[];
  @Input() isFromTrudiApp: boolean = false;
  @Input() isFromVoiceMail = false;
  @Input() propertyIds: string[] = [];
  @Output() taskItem = new EventEmitter<TaskItem>();
  private unsubscribe = new Subject<void>();
  public searchTask: SearchTask = {
    term: '',
    onlyInprogress: true,
    onlyMyTasks: true,
    pageIndex: 0,
    taskFolderId: ''
  };
  public skeletonTask = [{ disabled: true }, { disabled: true }];
  public isLoading: boolean = false;
  public taskList;
  public isRmEnvironment: boolean = false;
  public taskTypeAction: FormGroup;
  private taskCompleTedSubject$ = new BehaviorSubject<SearchTask>(null);
  private completedTasksTemp: TaskListMove[] = [];
  private statusScrollInfinite: boolean = false;
  public currentSearchText = '';
  public searchText$ = new Subject<string>();
  public readonly EViewDetailMode = EViewDetailMode;
  public isSkeletonTask = false;

  constructor(
    private formBuilder: FormBuilder,
    private dashboardAgencyService: DashboardAgencyService,
    public propertiesService: PropertiesService,
    private taskGroupDropdownService: TaskGroupDropdownService,
    private taskGroupDropdownApiService: TaskGroupDropdownApiService,
    private companyService: CompanyService,
    public taskDetailService: TaskDetailService
  ) {
    this.taskTypeAction = this.formBuilder.group({
      selectedTask: [null, Validators.required],
      onlyMyTasks: [true],
      onlyInprogress: [true]
    });
  }
  ngOnInit(): void {
    this.searchText$
      .pipe(
        distinctUntilChanged((prev, current) => {
          if (!prev) return false;
          return prev?.trim() === current?.trim();
        }),
        debounceTime(300),
        takeUntil(this.unsubscribe)
      )
      .subscribe((rs) => {
        this.handleChangeSearchTask({ term: rs });
      });
    this.taskCompleTedSubject$
      .pipe(
        debounceTime(300),
        tap(() => {
          this.isLoading = true;
        }),
        switchMap((payload) => {
          const dataPayload = {
            taskFolderId: null,
            isIgnoreTaskLinkedAction: true,
            propertyIds:
              this.isFromVoiceMail || this.isFromTrudiApp ? null : [],
            taskIds: this.taskIds,
            conversationType: this.isFromVoiceMail
              ? EMessageComeFromType.VOICE_MAIL
              : this.isFromTrudiApp
              ? EMessageComeFromType.APP
              : null
          };

          let payloadListTask = {
            ...payload,
            ...dataPayload,
            onlyInprogress: true
          };

          let payloadListTaskCompleted = {
            ...payload,
            ...dataPayload,
            onlyInprogress: false
          };

          return forkJoin([
            this.taskGroupDropdownApiService.prepareMoveToTaskData(
              payloadListTask,
              null
            ),
            !this.searchTask.onlyInprogress
              ? this.taskGroupDropdownApiService.prepareMoveToTaskData(
                  payloadListTaskCompleted,
                  null
                )
              : of(null)
          ]);
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe(([listTask, taskCompleted]) => {
        listTask = listTask?.filter((task) => task.tasks?.length);

        if (this.isFromTrudiApp) {
          const filterTasks = listTask.filter((topic) => {
            topic.tasks = this.taskGroupDropdownService.sortTasks(
              topic?.tasks.filter((task) =>
                this.propertyIds.includes(task?.propertyId)
              )
            );
            return topic.tasks.length > 0;
          });

          this.taskList =
            this.taskGroupDropdownService.mapToGetStatusBadge(filterTasks);
          this.isLoading = false;

          return;
        }

        if (taskCompleted) {
          this.statusScrollInfinite = taskCompleted.length > 0 ? true : false;

          this.completedTasksTemp = [
            ...this.completedTasksTemp,
            ...taskCompleted
          ];

          this.taskList = [
            ...listTask,
            ...(taskCompleted.length === 0 && this.searchTask.pageIndex === 0
              ? []
              : [
                  {
                    topicName: 'COMPLETED TASKS',
                    tasks: [...this.completedTasksTemp]
                  }
                ])
          ];
        } else {
          this.taskList = listTask;
        }

        if (this.taskList?.length) {
          const listTaskSuggested = this.taskList?.flatMap((topic) =>
            topic?.tasks.filter((task) =>
              this.propertyIds.includes(task?.propertyId)
            )
          );
          const topicSuggested = {
            topicName: 'SUGGESTED',
            tasks: this.taskGroupDropdownService.sortTasks(listTaskSuggested)
          };
          const listIdTaskSuggested = listTaskSuggested?.map(
            (item) => item?.propertyId
          );
          this.taskList = this.taskList.sort((a, b) => a.order - b.order);
          this.taskList = this.taskList.map((topic) => ({
            ...topic,
            tasks: this.taskGroupDropdownService.sortTasks(
              topic.tasks.filter(
                (item) => !listIdTaskSuggested.includes(item.propertyId)
              )
            )
          }));
          listTaskSuggested.length && this.taskList.unshift(topicSuggested);
          this.taskList = this.taskGroupDropdownService.mapToGetStatusBadge(
            this.taskList
          );
        }

        this.isLoading = false;
      });

    this.taskTypeAction.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        this.searchTask = {
          ...this.searchTask,
          pageIndex: 0,
          onlyInprogress: value.onlyInprogress,
          onlyMyTasks: value.onlyMyTasks
        };
        this.isLoading = true;
        this.completedTasksTemp = [];
        this.taskCompleTedSubject$.next(this.searchTask);
      });
  }

  subscribeCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment =
          this.dashboardAgencyService.isRentManagerCRM(company);
      });
  }

  handleOpenSelectListTask() {
    this.isLoading = true;
    this.searchTask = {
      ...this.searchTask,
      pageIndex: 0
    };
    this.completedTasksTemp = [];
    this.taskCompleTedSubject$.next(this.searchTask);
  }

  handleBlurSelectListTask() {
    this.isLoading = false;
    this.searchTask = {
      ...this.searchTask,
      pageIndex: 0
    };
    this.completedTasksTemp = [];
  }

  onItemChange(event: TaskItem) {
    this.taskTypeAction.get('selectedTask').setValue(event?.id);
    this.taskItem.emit(event);
  }

  getNextPage() {
    if (this.isLoading) return;
    this.searchTask = {
      ...this.searchTask,
      pageIndex: this.searchTask.pageIndex + 1
    };

    if (this.statusScrollInfinite) {
      this.taskCompleTedSubject$.next(this.searchTask);
    }
  }

  handleClearValue() {
    this.isLoading = true;
    this.searchTask.term = '';
    this.taskCompleTedSubject$.next(this.searchTask);
  }

  handleChangeSearchTask(search) {
    this.searchTask = {
      ...this.searchTask,
      term: search.term,
      pageIndex: 0
    };
    this.completedTasksTemp = [];
    this.taskCompleTedSubject$.next(this.searchTask);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
