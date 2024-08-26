import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import {
  FilterItem,
  VoiceMailType
} from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { TaskStatusType } from '@shared/enum';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { omit } from 'lodash-es';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'voice-mail-filter',
  templateUrl: './voice-mail-filter.component.html',
  styleUrls: ['./voice-mail-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoiceMailFilterComponent implements OnInit, OnDestroy {
  @Input() isHidden: boolean = true;
  readonly EViewDetailMode = EViewDetailMode;
  public currentQueryParam: Params;
  public isSelecting: boolean = false;
  public listNavigate: FilterItem[] = [
    {
      name: 'OPEN',
      status: 'all',
      queryParams: {
        status: TaskStatusType.inprogress,
        inboxType: VoiceMailType.MY_MESSAGES
      },
      notification: false
    },
    {
      name: 'RESOLVED',
      status: 'resolved',
      queryParams: {
        status: TaskStatusType.completed,
        inboxType: VoiceMailType.MY_MESSAGES
      },
      notification: false
    }
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly activeRouter: ActivatedRoute,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly cdr: ChangeDetectorRef,
    private readonly inboxSidebarService: InboxSidebarService,
    private readonly voiceMailService: VoiceMailService,
    public readonly sharedMessageViewService: SharedMessageViewService,
    private readonly taskService: TaskService,
    public readonly inboxService: InboxService
  ) {}

  onChangeMode() {
    this.isSelecting = !this.isSelecting;
    this.sharedMessageViewService.setIsSelectingMode(this.isSelecting);

    if (!this.isSelecting) {
      this.inboxToolbarService.setInboxItem([]);
      this.inboxToolbarService.setFilterInboxList(false);
      this.taskService.setSelectedConversationList([]);
      this.taskService.setSelectedListConversationId([]);
    }
  }

  ngOnInit(): void {
    this.activeRouter.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((queryParam) => {
        this.currentQueryParam = queryParam;
        this.listNavigate = this.listNavigate.map((item) => ({
          ...item,
          queryParams: {
            ...item.queryParams,
            ...omit(queryParam, ['status']),
            taskId: null,
            conversationId: null
          }
        }));
      });

    this.sharedMessageViewService.isSelectingMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.isSelecting = state;
        this.cdr.markForCheck();
      });

    this.subscribeStatisticsVoiceMailMessage();
  }

  subscribeStatisticsVoiceMailMessage() {
    this.inboxSidebarService.statisticsVoiceMailMessage$
      .pipe(takeUntil(this.destroy$), filter(Boolean))
      .subscribe((statistics) => {
        this.listNavigate = this.listNavigate.map((tab) => {
          const status =
            tab.queryParams['status'] === TaskStatusType.completed
              ? TaskStatusType.resolved
              : tab.queryParams['status'];
          const matchingStatistic = statistics.find(
            (stat) => stat.status === status
          );
          const unreadCount = Number(matchingStatistic?.unread || 0);
          return {
            ...tab,
            unread: unreadCount > 0
          };
        });
        this.cdr.markForCheck();
      });
  }

  onNavigate(item: FilterItem) {
    this.router
      .navigate([], {
        queryParams: item.queryParams,
        queryParamsHandling: 'merge'
      })
      .then(() => {
        this.sharedMessageViewService.setIsSelectingMode(false);
        this.inboxToolbarService.setInboxItem([]);
        this.inboxToolbarService.setFilterInboxList(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
