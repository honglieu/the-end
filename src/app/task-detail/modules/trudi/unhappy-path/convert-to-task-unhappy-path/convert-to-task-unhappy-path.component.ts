import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { TaskType } from '@shared/enum/task.enum';
import { TaskItemDropdown, TaskName } from '@shared/types/task.interface';
import { Task } from '@shared/types/trudi.interface';
import { UserPropInSelectPeople } from '@shared/types/user.interface';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';

@Component({
  selector: 'convert-to-task-unhappy-path',
  templateUrl: './convert-to-task-unhappy-path.component.html',
  styleUrls: ['./convert-to-task-unhappy-path.component.scss']
})
export class ConvertToTaskUnhappyPathComponent implements OnInit, OnDestroy {
  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.TASK;
  @Input() showConvertToTask: boolean = false;
  @Output() showConvertToTaskChange = new EventEmitter<boolean>();
  private unsubscribe = new Subject<void>();
  readonly TaskType = TaskType;
  readonly CreateTaskByCateOpenFrom = CreateTaskByCateOpenFrom;

  public listTaskName: TaskItemDropdown[] = [];
  public isShowCreateTaskModal: boolean = false;
  public selectedTaskToConvert: Task;
  public activeProperty: UserPropInSelectPeople[] = [];
  public isError: boolean = false;
  public isArchiveMailbox: boolean = false;
  public listConvertToTask: TaskName[] = [];
  public configs: IConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      showDropdown: false
    }
  };
  readonly EViewDetailMode = EViewDetailMode;

  constructor(
    private taskService: TaskService,
    private conversationService: ConversationService,
    private propertyService: PropertiesService,
    private agencyService: AgencyService,
    public inboxService: InboxService
  ) {}

  ngOnInit(): void {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));
    this.subscribeGetTopicsList();
    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        if (!res && !res?.isUnHappyPath) return;
        this.getPropertyList(
          res?.isUnindentifiedEmail,
          res.conversations[0]?.email
        );
      });
  }

  getTaskList() {
    this.listTaskName = this.taskService.createTaskNameList();
    this.listConvertToTask = this.taskService
      .filterTasksByRegion(this.listTaskName, null, true)
      .filter((e) => !e?.disabled);
  }

  getPropertyList(isUnindentifiedEmail: boolean, email: string) {
    // if (isUnindentifiedEmail) {
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
    // } else {
    //   this.userService
    //     .getListContactByEmail(this.agencyService.currentAgencyId.value, email)
    //     .subscribe(res => {
    //       if (!res || !res.length) return;
    //       this.activeProperty = res;
    //     })
    // }
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

  getSelectedTask(task) {
    this.selectedTaskToConvert = task;
  }

  onOpenCreateNewTaskPopUp() {
    if (this.isArchiveMailbox) return;
    if (this.selectedTaskToConvert) {
      this.isShowCreateTaskModal = true;
    } else {
      this.isError = true;
    }
  }

  handleStopProcessCreateNewTask() {
    this.isShowCreateTaskModal = false;
    this.showConvertToTaskChange.emit(false);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
