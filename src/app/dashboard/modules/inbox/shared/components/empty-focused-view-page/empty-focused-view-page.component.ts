import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReminderMessageService } from '@/app/task-detail/services/reminder-message.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';

@Component({
  selector: 'empty-focused-view-page',
  templateUrl: './empty-focused-view-page.component.html',
  styleUrls: ['./empty-focused-view-page.component.scss']
})
export class EmptyFocusedViewPageComponent {
  @Input() message: string;
  @Input() subMessage: string;
  @Input() noFocusView: boolean = false;
  @Input() remiderSetting: boolean = false;
  @Input() isMessageReminder: boolean = false;

  public currentUser;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dashboardApiService: DashboardApiService,
    private userService: UserService,
    private reminderMessageService: ReminderMessageService,
    private inboxFilterService: InboxFilterService
  ) {
    this.userService.getUserDetail().subscribe((res) => {
      this.currentUser = res;
    });
  }

  handleRemiderSetting() {
    this.reminderMessageService.isShowReminderSetting$.next(true);
  }

  handleTurnOffFocusView() {
    this.inboxFilterService.triggerTurnOffFocusView$.next(true);
  }
}
