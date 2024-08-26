import { EConversationType, TaskType } from '@shared/enum';
import { TaskItem } from '@shared/types/task.interface';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { Router } from '@angular/router';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import { NavigatorService } from '@services/navigator.service';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';

@Component({
  selector: 'linked-task',
  templateUrl: './linked-task.component.html',
  styleUrl: './linked-task.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkedTaskComponent implements OnChanges {
  @Input() taskItem: TaskItem;
  @Input() currentConversationId: string;
  public TaskType = TaskType;
  public linkedTaskItem = null;

  constructor(
    private router: Router,
    private inboxService: InboxService,
    private cdr: ChangeDetectorRef,
    public taskDetailService: TaskDetailService,
    private readonly navigatorService: NavigatorService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['taskItem']?.currentValue ||
      changes['currentConversationId']?.currentValue
    ) {
      this.setLinkedTaskItem();
    }
  }

  setLinkedTaskItem() {
    if (this.taskItem?.taskType === TaskType.MESSAGE) {
      const currentConversation = this.taskItem.conversations.find(
        (convesation) => convesation.id === this.currentConversationId
      );
      this.linkedTaskItem = currentConversation?.linkedTask;
      this.cdr.markForCheck();
    } else {
      this.linkedTaskItem = null;
    }
  }

  handleMoveToTask() {
    const conversation =
      this.taskItem?.conversations?.find(
        (one) => one.id === this.currentConversationId
      ) || this.taskItem?.conversations?.[0];
    let taskId = this.taskItem.id;
    let conversationId = this.currentConversationId;
    if (this.taskItem.taskType === TaskType.MESSAGE) {
      taskId = this.linkedTaskItem.id;
      conversationId = conversation.parentConversationId;
    }
    const tabStatus =
      conversation?.isLastMessageDraft &&
      conversation?.status === EConversationType.agent_expectation &&
      this.router.url.includes(ERouterLinkInbox.APP_MESSAGES)
        ? TaskType.DRAFT
        : conversation?.status;
    this.inboxService.setChangeUnreadData(null);
    this.navigatorService.setReturnUrl(this.router.url);
    this.router.navigate(['dashboard', 'inbox', 'detail', taskId], {
      queryParams: {
        type: 'TASK',
        conversationType: conversation?.conversationType,
        conversationId,
        tab: tabStatus
      },
      queryParamsHandling: 'merge'
    });
  }
}
