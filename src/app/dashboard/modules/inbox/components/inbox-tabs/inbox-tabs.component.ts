import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { Subject, takeUntil } from 'rxjs';
import { TrudiTab } from '@trudi-ui';
import { InboxQueryParams } from '@/app/dashboard/modules/inbox/inbox.component';
import { SharedMessageViewService } from '@/app/services';

@Component({
  selector: 'inbox-tabs',
  templateUrl: './inbox-tabs.component.html',
  styleUrls: ['./inbox-tabs.component.scss']
})
export class InboxTabsComponent implements OnInit, OnDestroy {
  @Input() tabs: TrudiTab<InboxQueryParams>[] = [];
  public isAccountAdded: boolean;
  private unsubcribe = new Subject<void>();
  constructor(
    private inboxSidebarService: InboxSidebarService,
    private sharedMessageViewService: SharedMessageViewService
  ) {}

  ngOnInit() {
    this.checkVisibleTab();
  }

  handleChangeTab() {
    this.sharedMessageViewService.setIsSelectingMode(false);
  }

  checkVisibleTab() {
    this.inboxSidebarService
      .getAccountAdded()
      .pipe(takeUntil(this.unsubcribe))
      .subscribe((res) => {
        this.isAccountAdded = res;
      });
  }

  ngOnDestroy() {
    this.unsubcribe.next();
    this.unsubcribe.complete();
  }
}
