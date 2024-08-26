import { TaskDateCasePipe } from '@/app/dashboard/modules/task-page/modules/task-preview/pipe/task-date-case.pipe';
import { TIME_NOW } from '@/app/dashboard/utils/constants';
import { DateCasePipe } from '@shared/pipes/date-pipe';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import isBefore from 'date-fns/isBefore';
import dayjs from 'dayjs';
import { Subject, debounceTime, map, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { TaskStatusType, TaskStatusTypeLC } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  SearchTask,
  TaskItem,
  TaskList,
  TopicItem
} from '@shared/types/task.interface';
import { isSupplierOrOtherOrExternal } from '@/app/user/utils/user.type';
import { Property } from '@/app/shared/types';

@Component({
  selector: 'dropdown-group',
  templateUrl: './dropdown-group.component.html',
  styleUrls: ['./dropdown-group.component.scss'],
  providers: [TaskDateCasePipe, DateCasePipe]
})
export class DropdownGroupComponent implements OnInit {
  @Input() items: TaskList;
  @Input() placeholder: string = 'Select task';
  @Input() show: boolean;
  @Input() isMissingRequiredField: boolean = false;
  @Input() isMoveTaskConfirmed: boolean = false;
  @Input() userType: string = '';
  @Input() isShowAddress: boolean = false;
  @Input() isUnHappyPath: boolean;
  @Input() selectedTaskId: string;
  @Input() isLoading: boolean = false;
  @Input() isCheckTopicName: boolean = false;
  @Input() isShowRegionName: boolean = true;

  @Output() onClose = new EventEmitter<boolean>();
  @Output() onOpen = new EventEmitter<boolean>();
  @Output() onChange = new EventEmitter<TaskItem>();
  @Output() onNewPage = new EventEmitter();
  @Output() onChangeSearchTask = new EventEmitter<SearchTask>();
  @Output() onClear = new EventEmitter();
  @ViewChild('inputElm') inputElm;

  public taskStatusType = TaskStatusType;
  public taskStatusTypeLC = TaskStatusTypeLC;
  public checkLengthItems: boolean;
  public eConfirmContactType = EConfirmContactType;
  private unsubscribe = new Subject<void>();
  includeCompletedState = false;
  currentProperty: Property = null;
  currentTask: TaskItem = null;
  topicMap: TopicItem[] = [];
  currentTaskId = '';
  isOutOfItems = false;
  LAZY_LOAD_TASK = 50;
  public isSearching = false;
  public listAllStatusTask: TaskItem[] = [];
  public listTaskItem: TaskItem[] = [];
  public listTaskItemFiltered: TaskItem[] = [];
  public isSupplierOrOtherOrExternal: boolean;
  public isRmEnvironment: boolean = false;
  taskItem: TaskList;
  searchTerms = new Subject<string>();
  searchTask: SearchTask = {
    term: '',
    onlyMyTasks: true,
    onlyInprogress: true
  };
  itemSkeleton = { disabled: true } as TaskItem;
  preventBlur = false;

  searchFn = (searchText: string, item: TaskItem) => {
    if (Object.entries(item).length === 1) return true;
    return (
      !this.isSearching ||
      item.title.toLowerCase().includes(searchText?.trim().toLowerCase()) ||
      item?.property?.streetline
        .toLowerCase()
        .includes(searchText?.trim().toLowerCase())
    );
  };

  constructor(
    private taskService: TaskService,
    private propertiesService: PropertiesService,
    private conversationService: ConversationService,
    private agencyService: AgencyService,
    private companyService: CompanyService,
    private taskDateCasePipe: TaskDateCasePipe,
    private dateCasePipe: DateCasePipe
  ) {}

  ngOnChanges() {
    this.checkOutOfItems();
    this.getExistingTaskList();
  }

  ngOnInit(): void {
    this.addSkeletonItems();
    this.checkLengthItems =
      this.items?.my_task?.length > 0 ||
      this.items?.team_task?.length > 0 ||
      this.items?.completed?.length > 0;
    this.searchTerms
      .pipe(debounceTime(300), takeUntil(this.unsubscribe))
      .subscribe((term) => {
        this.searchTask.term = term;
        this.onChangeSearchTask.emit(this.searchTask);
      });

    this.agencyService.topicList$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.topicMap = (res?.taskTopics ?? []).sort(
          (a, b) => a.order - b.order
        );
        this.getExistingTaskList();
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
  }

  getDataMoveTaskWhenConfirm(taskList: TaskList) {
    if (!taskList) return;
    this.listAllStatusTask = [];
    for (const [key, value] of Object.entries(taskList)) {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item) {
            let topicName = this.getTopicName(item.topicId);
            if (
              this.isCheckTopicName &&
              item?.status === TaskStatusType.completed
            )
              topicName = 'COMPLETED TASKS';
            if (topicName !== '')
              this.listAllStatusTask.push({ ...item, topicName });
          }
        });
        this.listAllStatusTask = this.listAllStatusTask.filter(
          (item) => item.status !== TaskStatusType.deleted
        );
      }
    }

    this.listTaskItem = this.listAllStatusTask.map((task) => ({
      ...task,
      statusBadge: this.getStatusBadge(
        task.status,
        task.createdAt,
        task.updatedAt
      )
    }));
    this.sortByTopicOrder();
  }

  getStatusBadge(status: TaskStatusType, createdAt: string, updatedAt: string) {
    const taskDateCase =
      this.taskDateCasePipe.transform(status, createdAt, updatedAt) + ' ';
    switch (status) {
      case TaskStatusType.completed:
        return this.dateCasePipe
          .transform(updatedAt)
          .pipe(map((date) => taskDateCase + (date === TIME_NOW ? '' : date)));
      case TaskStatusType.inprogress:
      default:
        return this.dateCasePipe
          .transform(createdAt)
          .pipe(map((date) => taskDateCase + (date === TIME_NOW ? '' : date)));
    }
  }

  getTopicName(topicId: string) {
    const topic = this.topicMap.find((t) => t.id === topicId);
    if (topic) return topic.name;
    return '';
  }

  sortByTopicOrder() {
    this.listTaskItem.sort((a, b) => {
      if (a.topicId !== b.topicId) return a.topicOrder - b.topicOrder;
      else {
        const dateA =
          a.status === TaskStatusType.completed && a.updatedAt
            ? a.updatedAt
            : a.createdAt;
        const dateB =
          b.status === TaskStatusType.completed && b.updatedAt
            ? b.updatedAt
            : b.createdAt;

        const dateComparison = dayjs(dateB).diff(dayjs(dateA));
        if (dateComparison !== 0) {
          return dateComparison;
        } else {
          return a.title.localeCompare(b.title);
        }
      }
    });
  }

  handleSearch(event) {
    this.isSearching = true;
    this.isOutOfItems = false;
    this.listTaskItem = [];
    this.addSkeletonItems();
    this.searchTerms.next(event.term?.trim());
  }

  handleFilterData(task: TaskItem[], isFilterTaskFromCurrentProperty) {
    return task
      ?.filter(
        (item) =>
          !item.isUnindentifiedProperty &&
          item?.id !== this.currentTask?.id &&
          (!isFilterTaskFromCurrentProperty ||
            item?.property?.id === this.currentProperty?.id)
      )
      .sort((x: TaskItem, y: TaskItem) =>
        isBefore(new Date(x.createdAt), new Date(y.createdAt)) ? 1 : -1
      );
  }

  onCheckboxMyTasksChange(event: boolean) {
    this.isOutOfItems = false;
    this.listTaskItem = [];
    this.addSkeletonItems();
    this.searchTask.onlyMyTasks = event;
    this.onChangeSearchTask.emit(this.searchTask);
  }

  onCheckboxInprogressTasksChange(event: boolean) {
    this.isOutOfItems = false;
    this.listTaskItem = [];
    this.addSkeletonItems();
    this.searchTask.onlyInprogress = event;
    this.onChangeSearchTask.emit(this.searchTask);
  }

  onItemClick(event: TaskItem) {
    this.isSearching = false;
    this.preventBlur = true;
    this.inputElm.blur();
    this.selectedTaskId = event?.id;
    this.isMissingRequiredField = !Boolean(this.selectedTaskId);
    this.searchTask.term = '';
    this.onChangeSearchTask.emit(this.searchTask);
    this.onChange.emit(event);
  }

  getNextPage() {
    if (!this.isOutOfItems && !this.checkIsLoading()) {
      this.addSkeletonItems();
      this.onNewPage.emit();
    }
  }

  addSkeletonItems() {
    this.listTaskItem = [
      ...this.listTaskItem,
      this.itemSkeleton,
      this.itemSkeleton
    ];
  }

  checkOutOfItems() {
    if (!this.items) this.isOutOfItems = false;
    else {
      let quantity = 0;
      Object.values(this.items).forEach((arr) => {
        if (Array.isArray(arr)) {
          quantity += arr.filter((item) => typeof item !== 'undefined').length;
        }
      });
      if (quantity % this.LAZY_LOAD_TASK !== 0) this.isOutOfItems = true;
    }
  }

  checkIsLoading() {
    return (
      this.listTaskItem.length === 2 &&
      this.listTaskItem[0] === this.itemSkeleton &&
      this.listTaskItem[1] === this.itemSkeleton
    );
  }

  onBlur() {
    if (this.preventBlur) {
      this.preventBlur = false;
      return;
    }
    this.isSearching = false;
    this.isOutOfItems = false;
    this.listTaskItem = [];
    this.addSkeletonItems();
    this.searchTask.term = '';
    this.onChangeSearchTask.emit(this.searchTask);
  }

  handleClear() {
    this.onClear.emit();
  }

  getExistingTaskList() {
    this.isLoading = true;
    if (this.show && this.items && this.topicMap.length !== 0) {
      this.isLoading = false;
      this.currentProperty =
        this.propertiesService.newCurrentProperty.getValue();
      this.currentTaskId = this.taskService.currentTaskId$.getValue();
      this.currentTask = this.taskService.currentTask$.getValue();
      const currentConversation =
        this.conversationService.currentConversation.getValue();
      const isOwnerNoProperty =
        !this.currentTask?.property.streetline &&
        this.currentTask?.conversations[0]?.startMessageBy ===
          EUserPropertyType.LANDLORD;
      this.isSupplierOrOtherOrExternal =
        isSupplierOrOtherOrExternal(currentConversation?.propertyType) ||
        (this.isRmEnvironment && isOwnerNoProperty);
      const unHappyPath = this.currentTask?.isUnHappyPath || this.isUnHappyPath;
      this.taskItem = {
        my_task: this.handleFilterData(
          this.items?.my_task,
          unHappyPath ? false : !this.isSupplierOrOtherOrExternal
        ),
        team_task: this.handleFilterData(
          this.items?.team_task,
          unHappyPath ? false : !this.isSupplierOrOtherOrExternal
        ),
        completed: this.handleFilterData(
          this.items?.completed,
          unHappyPath ? false : !this.isSupplierOrOtherOrExternal
        ),
        my_task_and_team_task: this.handleFilterData(
          this.items?.my_task_and_team_task,
          unHappyPath ? false : !this.isSupplierOrOtherOrExternal
        ),
        deleted: []
      };
      if (this.taskItem || this.items) {
        this.getDataMoveTaskWhenConfirm(
          unHappyPath ? this.taskItem : this.items
        );
      }
      this.includeCompletedState = false;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
