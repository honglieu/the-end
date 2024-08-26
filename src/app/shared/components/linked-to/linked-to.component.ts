import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IPortalConversation } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import {
  EConversationType,
  GroupType,
  TaskStatusType,
  TaskType
} from '@shared/enum';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { NavigatorService } from '@services/navigator.service';
import { Subject, takeUntil } from 'rxjs';

interface ITabType {
  tabName: string;
  status: TaskStatusType;
  conversationStatus?: EConversationType;
}

@Component({
  selector: 'linked-to',
  templateUrl: './linked-to.component.html',
  styleUrls: ['./linked-to.component.scss']
})
export class LinkedToComponent implements OnInit, OnDestroy {
  @Input() portalConversation: IPortalConversation;
  private listTab: ITabType[] = [
    {
      tabName: 'Open',
      status: TaskStatusType.inprogress,
      conversationStatus: EConversationType.open
    },
    {
      tabName: 'Draft',
      status: TaskStatusType.draft
    },
    {
      tabName: 'Resolved',
      status: TaskStatusType.completed,
      conversationStatus: EConversationType.resolved
    },
    {
      tabName: 'Deleted',
      status: TaskStatusType.deleted,
      conversationStatus: EConversationType.deleted
    }
  ];
  private currentTab: ITabType;
  private queryParams: Params;
  readonly taskType = TaskType;
  private destroy$ = new Subject<void>();
  readonly taskStatusType = TaskStatusType;
  constructor(
    private router: Router,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly navigatorService: NavigatorService,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.queryParams = params;
      });
  }

  ngOnInit(): void {
    this.getCurrentTab();
  }

  getCurrentTab() {
    const { portalConversation, listTab } = this;
    const findTab = (condition) => listTab.find((tab) => condition(tab));

    this.currentTab =
      portalConversation?.type === TaskType.TASK
        ? findTab(
            (tab) =>
              tab?.conversationStatus === portalConversation?.conversationStatus
          )
        : findTab((tab) => tab?.status === portalConversation?.status);
  }

  handleNavigate(type: TaskType) {
    if (type === TaskType.MESSAGE) {
      localStorage.setItem(`mailbox-focus`, 'false');
      const folderName =
        this.portalConversation?.status === TaskStatusType.inprogress
          ? 'all'
          : this.portalConversation?.status === TaskStatusType.completed
          ? 'resolved'
          : 'deleted';
      this.router.navigate(
        ['/dashboard', 'inbox', 'messages', `${folderName}`],
        {
          queryParams: {
            inboxType: GroupType.TEAM_TASK,
            status: this.portalConversation?.status,
            taskId: this.portalConversation?.taskId,
            conversationId: this.portalConversation?.id,
            mailBoxId: this.queryParams['mailBoxId']
          }
        }
      );
    } else {
      this.navigatorService.setReturnUrl(this.router.url);
      this.router.navigate(
        ['/dashboard', 'inbox', 'detail', `${this.portalConversation?.taskId}`],
        {
          queryParams: {
            inboxType: GroupType.TEAM_TASK,
            taskStatus: this.portalConversation?.status,
            taskTypeID: this.portalConversation?.topicId,
            taskId: this.portalConversation?.taskId,
            type: TaskType.TASK,
            conversationId: this.portalConversation?.id,
            mailBoxId: this.queryParams['mailBoxId']
          }
        }
      );
    }
    this.inboxToolbarService.triggerResetMessageDetail$.next();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
