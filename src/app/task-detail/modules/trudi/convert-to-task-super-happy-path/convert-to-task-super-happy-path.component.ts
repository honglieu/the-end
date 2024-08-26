import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { TaskItemDropdown, TaskName } from '@shared/types/task.interface';
import { UserPropInSelectPeople } from '@shared/types/user.interface';

@Component({
  selector: 'convert-to-task-super-happy-path',
  templateUrl: './convert-to-task-super-happy-path.component.html',
  styleUrls: ['./convert-to-task-super-happy-path.component.scss']
})
export class ConvertToTaskSuperHappyPathComponent implements OnInit {
  @Input() listConvertSuggestTask: TaskName[] = [];
  @Input() isShowCreateTaskBtn: boolean = true;
  @Input() noPrefill: boolean = true;
  @Input() selectedTaskToConvert: TaskName;
  @Input() taskStatus: TaskStatusType;
  @Output() selectedTask = new EventEmitter();

  private unsubscribe = new Subject<void>();
  readonly TaskType = TaskType;
  readonly TaskStatusType = TaskStatusType;
  public isConsole: boolean;
  readonly CreateTaskByCateOpenFrom = CreateTaskByCateOpenFrom;

  public listTaskName: TaskItemDropdown[] = [];
  public isShowCreateTaskModal: boolean = false;
  public activeProperty: UserPropInSelectPeople[] = [];
  public isError: boolean = false;
  public isArchiveMailbox: boolean = false;
  public configs: IConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      showDropdown: false
    }
  };
  constructor(
    private taskService: TaskService,
    private conversationService: ConversationService,
    private propertyService: PropertiesService,
    private agencyService: AgencyService,
    public inboxService: InboxService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));
    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        if (!res && !res?.isUnHappyPath) return;
        this.getPropertyList(
          res?.isUnindentifiedEmail,
          res.conversations[0]?.email
        );
      });
    this.subscribeGetTopicsList();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['listConvertSuggestTask']?.currentValue &&
      !this.listConvertSuggestTask.length
    ) {
      this.getTaskList();
    }
  }

  getTaskList() {
    const tasks = this.taskService.createTaskNameList();
    this.listTaskName = tasks;
  }

  subscribeGetTopicsList() {
    this.agencyService.listTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.getTaskList();
        }
      });
  }

  getPropertyList(isUnindentifiedEmail: boolean, email: string) {
    this.propertyService
      .getAgencyProperty(
        this.conversationService.currentConversation?.value?.userId,
        ''
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res && !res.length) return;
        this.activeProperty = res;
      });
  }

  getSelectedTask(task) {
    this.selectedTask.emit(task);
  }

  onOpenCreateNewTaskPopUp() {
    if (this.isArchiveMailbox || this.taskStatus === TaskStatusType.deleted)
      return;
    if (this.selectedTaskToConvert) {
      this.isShowCreateTaskModal = true;
    } else {
      this.isError = true;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
