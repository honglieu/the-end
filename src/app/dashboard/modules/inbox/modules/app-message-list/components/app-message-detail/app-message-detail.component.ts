import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EPopupMoveMessToTaskState } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { IAddToTaskConfig } from '@/app/task-detail/interfaces/task-detail.interface';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { TaskType } from '@shared/enum/task.enum';
import { ConversationService } from '@services/conversation.service';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/message-task-loading.service';
import { ActivatedRoute } from '@angular/router';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';

@Component({
  selector: 'app-message-detail',
  templateUrl: './app-message-detail.component.html',
  styleUrls: ['./app-message-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppMessageDetailComponent implements OnInit, OnDestroy {
  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.MESSAGE;
  @Input() isBlockSetMailbox: boolean = false;
  @Input() activeMobileApp: boolean;

  public currentProperty;
  private unsubscribe = new Subject<void>();
  public popupState: EPopupMoveMessToTaskState;
  public EPopupState = EPopupMoveMessToTaskState;
  public addToTaskConfig: IAddToTaskConfig;

  public currentTaskId: string = '';

  public taskType: string = '';
  public TaskTypeEnum = TaskType;

  constructor(
    public taskService: TaskService,
    public taskDetailService: TaskDetailService,
    private propertyService: PropertiesService,
    private inboxFilterService: InboxFilterService,
    private conversationService: ConversationService,
    private messageTaskLoadingService: MessageTaskLoadingService,
    private route: ActivatedRoute,
    public inboxService: InboxService
  ) {}

  ngOnInit(): void {
    this.propertyService.newCurrentProperty
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.currentProperty = res;
        } else {
          this.currentProperty = null;
        }
      });

    this.taskDetailService.addToTaskConfig$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.addToTaskConfig = res;
        }
      });
    this.prefillInboxFilterWhenReload();
  }

  private prefillInboxFilterWhenReload() {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((queryParams) => {
        const { messageStatus, search, inboxType } = queryParams || {};
        if (inboxType) {
          this.inboxFilterService.setSelectedInboxType(inboxType);
        }
        if (messageStatus) {
          this.inboxFilterService.setSelectedStatus(messageStatus);
        }
        if (search) {
          this.inboxFilterService.setSearchDashboard(search);
        }
        if (
          this.taskDetailViewMode === EViewDetailMode.MESSAGE ||
          this.taskDetailViewMode === EViewDetailMode.REMINDER
        ) {
          if (
            queryParams['taskId'] &&
            this.currentTaskId &&
            this.currentTaskId === queryParams['taskId']
          ) {
            this.messageTaskLoadingService.stopLoading();
          }
          this.setCurrentTaskId(queryParams['taskId']);
        }
      });
  }

  setCurrentTaskId(taskId: string) {
    if (this.currentTaskId === taskId) return;
    this.currentTaskId = taskId;
    if (!!this.currentTaskId) {
      this.reloadCurrentTask(this.currentTaskId, false);
    }
  }

  reloadCurrentTask(taskId: string, reloadConversations: boolean = true) {
    this.taskService
      .getTaskById(taskId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;

        if (!this.isBlockSetMailbox) {
          const currentMailboxId = this.route.snapshot.queryParams['mailBoxId'];
          if (res?.mailBoxId !== currentMailboxId) {
            res?.mailBoxId &&
              this.inboxService.setCurrentMailBoxId(res?.mailBoxId);
          }
        }
        this.taskType = res.taskType;
        this.propertyService.currentPropertyId.next(res?.property?.id);
        this.propertyService.currentProperty.next(res?.property);
        this.taskService.currenTaskTrudiResponse$.next(res);
        this.taskService.currentTask$.next(res);
        reloadConversations &&
          this.conversationService.reloadConversationList.next(true);
        // handle trudi response template
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
