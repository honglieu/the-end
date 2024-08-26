import { distinctUntilChanged, debounceTime, takeUntil, Subject } from 'rxjs';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { DEBOUNCE_DASHBOARD_TIME } from '@/app/dashboard/utils/constants';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { Router } from '@angular/router';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';

@Component({
  selector: 'inbox-filter',
  templateUrl: './inbox-filter.component.html',
  styleUrls: ['./inbox-filter.component.scss']
})
export class InboxFilterComponent implements OnInit, OnDestroy {
  @Input() taskDetailViewMode = EViewDetailMode.TASK;
  @Input() isEnableTooltip: boolean = false;
  private destroy$ = new Subject();
  public searchText: string;
  public isTaskType: boolean = false;
  readonly EViewDetailMode = EViewDetailMode;

  constructor(
    private router: Router,
    public inboxFilterService: InboxFilterService,
    public inboxService: InboxService,
    public sharedMessageViewService: SharedMessageViewService
  ) {}

  ngOnInit(): void {
    this.isTaskType = this.router.url.includes('inbox/tasks');
    this.subscribeSearch();
  }

  subscribeSearch() {
    this.inboxFilterService.searchDashboard$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(DEBOUNCE_DASHBOARD_TIME),
        distinctUntilChanged((prev, current) => {
          return (prev || '').trim() === (current || '').trim();
        })
      )
      .subscribe((res) => {
        if (!this.searchText) {
          this.searchText = res;
        }
        this.router.navigate([], {
          queryParams: { search: res },
          queryParamsHandling: 'merge'
        });
      });
  }

  handleChangeSearchText(event: string) {
    // ignore the first event emit
    if (event !== undefined) this.inboxFilterService.setSearchDashboard(event);
  }

  searchBoxEventHandler(event: Event) {
    if (!event?.type) return;
    this.sharedMessageViewService.setIsSearchBoxFocused(
      event.type === 'focus' &&
        [
          EViewDetailMode.MESSAGE,
          EViewDetailMode.APP_MESSAGE,
          EViewDetailMode.SMS_MESSAGE
        ].includes(this.taskDetailViewMode)
    );
  }

  clearInputHandler() {
    this.resetSearchBox();
  }

  resetSearchBox() {
    this.searchText = '';
    this.router.navigate([], {
      queryParams: { search: '' },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
