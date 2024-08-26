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
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { ConversationService } from '@services/conversation.service';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/message-task-loading.service';
import { ActivatedRoute } from '@angular/router';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { HeaderConversationsModule } from '@/app/task-detail/modules/header-conversations/header-conversations.module';
import { SmsMessageDetailListModule } from '@/app/dashboard/modules/inbox/modules/sms-view/components/sms-message-detail-list/sms-message-detail-list.module';
import { CommonModule } from '@angular/common';
import { SmsMessageConversationIdSetService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message-id-set.service';

@Component({
  selector: 'sms-message-detail',
  templateUrl: './sms-message-detail.component.html',
  styleUrl: './sms-message-detail.component.scss',
  standalone: true,
  imports: [
    HeaderConversationsModule,
    SmsMessageDetailListModule,
    CommonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmsMessageDetailComponent implements OnInit, OnDestroy {
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
    public inboxService: InboxService,
    private readonly smsMessageConversationIdSetService: SmsMessageConversationIdSetService
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
        if (this.taskDetailViewMode === EViewDetailMode.MESSAGE) {
          const isDraftFolder = queryParams['status'] === TaskStatusType.draft;
          if (
            queryParams['taskId'] &&
            this.currentTaskId &&
            this.currentTaskId === queryParams['taskId'] &&
            (isDraftFolder
              ? queryParams['conversationId'] ===
                this.conversationService.currentConversationId.getValue()
              : true)
          ) {
            this.messageTaskLoadingService.stopLoading();
          }
          this.setCurrentTaskId(queryParams['taskId'], isDraftFolder);
        }
      });
  }

  setCurrentTaskId(taskId: string, isDraftFolder = false) {
    if ((this.currentTaskId === taskId && !isDraftFolder) || !taskId) return;
    this.currentTaskId = taskId;
    this.reloadCurrentTask(this.currentTaskId, false);
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
        this.taskService.triggerOpenMessageDetail.next(taskId);
        this.smsMessageConversationIdSetService.setIsMessageIdsEmpty(false);
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
