import { AppMessageApiService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-api.service';
import { AppMessageMenuService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-menu.service';
import { SMS_TAB } from '@/app/dashboard/modules/inbox/modules/sms-view/constants/sms.constants';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { LoadingService } from '@/app/services/loading.service';
import { SharedMessageViewService } from '@/app/services/shared-message-view.service';
import { SharedService } from '@/app/services/shared.service';
import { TaskStatusType } from '@/app/shared/enum';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { TrudiTab } from '@trudi-ui';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, distinctUntilChanged, filter, skip, takeUntil } from 'rxjs';

@Component({
  selector: 'sms-message-index',
  templateUrl: './sms-message-index.component.html',
  styleUrl: './sms-message-index.component.scss',
  providers: [AppMessageApiService, AppMessageMenuService]
})
export class SmsMessageIndexComponent implements OnInit, OnDestroy {
  public EViewDetailMode = EViewDetailMode;
  public isConsole: boolean = false;
  public params: Params;
  private readonly destroy$ = new Subject<void>();
  public isSelecting: boolean = false;
  public isLoading: boolean = false;
  public currentMailboxId: string;
  public TaskStatusType = TaskStatusType;
  public messageTabs: TrudiTab<unknown>[] = SMS_TAB;
  public isSmsMessageEnabledForUserConsole: boolean = false;

  constructor(
    public sharedMessageViewService: SharedMessageViewService,
    private sharedService: SharedService,
    private inboxToolbarService: InboxToolbarService,
    public loadingService: LoadingService,
    public inboxService: InboxService,
    private inboxSidebarService: InboxSidebarService,
    private activatedRoute: ActivatedRoute,
    public inboxFilterService: InboxFilterService,
    public dashboardApiService: DashboardApiService,
    private cdr: ChangeDetectorRef,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.sharedMessageViewService.isSelectingMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isEditing) => {
        this.isSelecting = isEditing;
      });
    this.loadingService.isLoading$
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.isLoading = value;
      });

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.params = params;
      });

    this.onCurrentMailboxIdChange();
    this.subscribeStatisticsAppMessage();

    // Check if SMS messaging is enabled for the user console
    this.isSmsMessageEnabledForUserConsole =
      localStorage.getItem('isSmsMessageEnabled').toLowerCase() === 'true' &&
      this.isConsole;
  }

  private onCurrentMailboxIdChange() {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$), filter(Boolean), distinctUntilChanged())
      .subscribe((mailBoxId) => {
        this.currentMailboxId = mailBoxId;
        this.inboxSidebarService.refreshStatisticsUnreadTask(
          this.currentMailboxId
        );
      });
  }

  setIsSelectingMode(isSelecting: boolean) {
    this.sharedMessageViewService.setIsSelectingMode(isSelecting);
    if (!isSelecting) {
      this.inboxToolbarService.setInboxItem([]);
      this.inboxToolbarService.setFilterInboxList(false);
    }
  }

  subscribeStatisticsAppMessage() {
    this.inboxSidebarService.statisticsSmsMessage$
      .pipe(takeUntil(this.destroy$), filter(Boolean))
      .subscribe((statistics) => {
        this.messageTabs = this.messageTabs.map((tab) => {
          const status =
            tab.queryParam['status'] === TaskStatusType.completed
              ? TaskStatusType.resolved
              : tab.queryParam['status'];
          const matchingStatistic = statistics.find(
            (stat) => stat.status === status
          );
          const unreadCount = Number(matchingStatistic?.unread || 0);
          return {
            ...tab,
            unread: unreadCount > 0,
            mailBoxId: this.currentMailboxId
          };
        });
        this.cdr.markForCheck();
      });
  }

  onNavigate(item) {
    this.router
      .navigate([], {
        queryParams: item.queryParam,
        queryParamsHandling: 'merge'
      })
      .then(() => {
        this.setIsSelectingMode(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
