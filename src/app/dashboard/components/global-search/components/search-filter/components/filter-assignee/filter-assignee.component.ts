import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, filter, map, takeUntil, tap } from 'rxjs';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { GlobalSearchService } from '@/app/dashboard/components/global-search/services/global-search.service';
import { InviteStatus } from '@shared/types/agent.interface';
import { isEqual } from 'lodash-es';
import { TrudiSelectDropdownV2Component } from '@trudi-ui';
@Component({
  selector: 'filter-assignee',
  templateUrl: './filter-assignee.component.html',
  styleUrls: ['./filter-assignee.component.scss']
})
export class FilterAssigneeComponent implements OnInit, OnDestroy {
  @ViewChild('dropdown') selectDropdown: TrudiSelectDropdownV2Component;
  public assigneeList = [];
  private unsubscribe = new Subject<void>();
  public selectedList = [];

  constructor(
    private inboxFilterService: InboxFilterService,
    private globalSearchService: GlobalSearchService
  ) {}

  ngOnInit(): void {
    this.globalSearchService.globalSearchPayload$
      .pipe(
        takeUntil(this.unsubscribe),
        tap((payload) => {
          if (!payload?.search && this.selectDropdown) {
            this.selectDropdown.handleVisibleChange(false);
          }
        }),
        filter((payload) => !isEqual(payload.assigneeIds, this.selectedList))
      )
      .subscribe((payload) => {
        this.selectedList = payload.assigneeIds;
      });

    this.inboxFilterService
      .getListDataFilter()
      .pipe(
        map((assignees) => {
          return {
            assignees: assignees.filter((r) => {
              return r.inviteStatus === InviteStatus.ACTIVE;
            })
          };
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe(({ assignees }) => {
        this.assigneeList = [
          ...assignees
            .map((item) => {
              return {
                ...item,
                label: `${item.firstName} ${item.lastName || ''}`.trim(),
                selected: false
              };
            })
            .sort((a, b) => a.label[0].localeCompare(b.label[0]))
        ];
      });
  }

  handleChangeSelectedList(value) {
    this.globalSearchService.setGlobalSearchPayload({ assigneeIds: value });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
