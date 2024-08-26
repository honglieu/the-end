import {
  TaskStatusType,
  TaskStatusTypeLC
} from './../../../shared/enum/task.enum';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { TaskItem, TaskList } from '@shared/types/task.interface';
import { TaskService } from '@services/task.service';
import { PropertiesService } from '@services/properties.service';
import { ConversationService } from '@services/conversation.service';
import { EConfirmContactType } from '@shared/enum/contact-type';
import isBefore from 'date-fns/isBefore';
import { isSupplierOrOtherOrExternal } from '@/app/user/utils/user.type';
import { Property } from '@/app/shared/types';

@Component({
  selector: 'dropdown-group',
  templateUrl: './dropdown-group.component.html',
  styleUrls: ['./dropdown-group.component.scss']
})
export class DropdownGroupComponent implements OnInit {
  @Input() items: TaskList;
  @Input() placeholder: string;
  @Input() show: boolean;
  @Input() isMissingRequiredField: boolean = false;
  @Input() isMoveTaskConfirmed: boolean = false;
  @Input() userType: string = '';
  @Input() isShowAddress: boolean = false;
  @Input() isUnHappyPath: boolean;

  @Output() onClose = new EventEmitter<boolean>();
  @Output() onOpen = new EventEmitter<boolean>();
  @Output() onChange = new EventEmitter<TaskItem>();
  @ViewChild('inputElm') inputElm;

  public hasResult = true;
  public taskStatusType = TaskStatusType;
  public taskStatusTypeLC = TaskStatusTypeLC;
  public checkLengthItems: boolean;
  public eConfirmContactType = EConfirmContactType;

  includeCompetedState = false;
  valueSelected: TaskItem;
  currentSearch = '';
  currentProperty: Property = null;
  currentTask: TaskItem = null;
  currentTaskId = '';
  public listAllStatusTask: TaskItem[] = [];
  public listTaskItem: TaskItem[] = [];
  public isSearching: boolean = false;
  public isSupplierOrOtherOrExternal: boolean;
  taskItem: TaskList;

  constructor(
    private taskService: TaskService,
    private propertiesService: PropertiesService,
    private conversationService: ConversationService
  ) {}

  ngOnChanges() {
    if (this.show) {
      this.currentProperty =
        this.propertiesService.newCurrentProperty.getValue();
      this.currentTaskId = this.taskService.currentTaskId$.getValue();
      this.currentTask = this.taskService.currentTask$.getValue();
      const currentConversation =
        this.conversationService.currentConversation.getValue();
      this.isSupplierOrOtherOrExternal = isSupplierOrOtherOrExternal(
        currentConversation?.propertyType
      );
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
        deleted: []
      };
      if (this.taskItem || this.items) {
        this.getDataMoveTaskWhenConfirm(
          unHappyPath ? this.taskItem : this.items
        );
      }
      this.valueSelected = null;
      this.includeCompetedState = false;
    }
  }

  ngOnInit(): void {
    this.checkLengthItems =
      this.items?.my_task?.length > 0 ||
      this.items?.team_task?.length > 0 ||
      this.items?.completed?.length > 0;
  }

  getDataMoveTaskWhenConfirm(taskList: TaskList) {
    if (!taskList) return;
    this.listAllStatusTask = [];
    for (const [key, value] of Object.entries(taskList)) {
      const title = this.getTitleGroup(key);
      if (Array.isArray(value)) {
        this.listAllStatusTask.push(
          ...value.map((item) => ({
            ...item,
            groupTitle: title
          }))
        );
        this.listAllStatusTask = this.listAllStatusTask.filter(
          (item) => item.status !== TaskStatusType.deleted
        );
      }
    }
    this.getTaskByStatus();
  }

  getTitleGroup(key: string) {
    let title: string;
    switch (key) {
      case this.taskStatusTypeLC.teamTask:
        title = this.taskStatusType.team_task_space;
        break;
      case this.taskStatusTypeLC.myTask:
        title = this.taskStatusType.my_task_space;
        break;
      case this.taskStatusTypeLC.completed:
        title = this.taskStatusType.completed;
        break;
      default:
        title = this.taskStatusType.deleted;
        break;
    }
    return title;
  }

  getTaskByStatus() {
    const listTaskItem = this.listAllStatusTask.filter(
      (item) =>
        this.includeCompetedState || item.status !== TaskStatusType.completed
    );
    listTaskItem.sort((x: TaskItem, y: TaskItem) => {
      if (x.groupType === y.groupType) {
        if (x.createdAt === y.createdAt) {
          return 0;
        }
        return isBefore(new Date(x.createdAt), new Date(y.createdAt)) ? 1 : -1;
      }
      if (x.groupType === TaskStatusType.completed) {
        return 1;
      }
      if (y.groupType === TaskStatusType.completed) {
        return -1;
      }
      return x.groupType > y.groupType ? 1 : -1;
    });

    this.listTaskItem = listTaskItem;
    this.hasResult = this.listTaskItem?.length > 0;
  }

  searchTasks(searchText: string, item: TaskItem) {
    return (
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item?.property?.streetline
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
  }

  handleSearch(event) {
    this.isSearching = true;
    this.hasResult = event.items?.length > 0;
  }

  handleFilterData(task: TaskItem[], isFilterTaskFromCurrentProperty) {
    return task
      ?.filter(
        (item) =>
          !item.isUnindentifiedProperty &&
          item.id !== this.currentTask.id &&
          (!isFilterTaskFromCurrentProperty ||
            item.property.id === this.currentProperty?.id)
      )
      .sort((x: TaskItem, y: TaskItem) =>
        isBefore(new Date(x.createdAt), new Date(y.createdAt)) ? 1 : -1
      );
  }

  onCheckboxChange(event: boolean) {
    this.includeCompetedState = event;
    this.getTaskByStatus();
    this.hasResult = this.listTaskItem.some(
      (item) =>
        (this.includeCompetedState &&
          item.groupType === TaskStatusType.completed) ||
        item.groupType !== TaskStatusType.completed
    );
  }

  onItemClick(event: TaskItem) {
    this.isSearching = true;
    this.valueSelected = event;
    this.isMissingRequiredField = this.valueSelected ? false : true;
    this.onChange.emit(event);
  }
}
