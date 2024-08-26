import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { Observable, Subject, takeUntil, map } from 'rxjs';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { SharedService } from '@/app/services';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { GroupType } from '@/app/shared';

@Component({
  selector: 'sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit, OnDestroy {
  public isUnreadInbox$: Observable<boolean>;
  public isUnreadTask$: Observable<boolean>;
  private destroy$ = new Subject();

  constructor(
    private statisticService: StatisticService,
    private sharedService: SharedService,
    private inboxFilterService: InboxFilterService
  ) {}

  ngOnInit(): void {
    this.isUnreadInbox$ = this.statisticService.getStatisticUnreadInbox().pipe(
      takeUntil(this.destroy$),
      map((res) => (res ? Object.values(res).some((value) => !!value) : false))
    );

    this.inboxFilterService.selectedInboxType$
      .pipe(
        map((inboxType) =>
          this.sharedService.isConsoleUsers() ? GroupType.TEAM_TASK : inboxType
        )
      )
      .subscribe((focusViewType) => {
        this.isUnreadTask$ = this.statisticService.hasUnreadTask(
          focusViewType === GroupType.MY_TASK
        );
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
