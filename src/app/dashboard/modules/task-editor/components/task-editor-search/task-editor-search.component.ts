import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { DEBOUNCE_DASHBOARD_TIME } from '@/app/dashboard/utils/constants';
import { PortalTaskEditorFilterService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/portal/task-editor-filter.portal.service';

@Component({
  selector: 'task-editor-search',
  templateUrl: './task-editor-search.component.html',
  styleUrls: ['./task-editor-search.component.scss']
})
export class TaskEditorSearchComponent implements OnInit {
  private unsubscribe = new Subject();
  public searchText: string;
  constructor(
    private router: Router,
    private taskEditorFilterService: PortalTaskEditorFilterService
  ) {}

  ngOnInit(): void {
    this.subscribeSearch();
  }
  subscribeSearch() {
    this.taskEditorFilterService
      .getSearchTitleTask()
      .pipe(
        distinctUntilChanged((previous, current) => {
          if (!previous) return false;
          return previous.trim() === current.trim();
        }),
        takeUntil(this.unsubscribe),
        debounceTime(DEBOUNCE_DASHBOARD_TIME)
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
    if (event !== undefined)
      this.taskEditorFilterService.setSearchTitleTask(event);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }
}
