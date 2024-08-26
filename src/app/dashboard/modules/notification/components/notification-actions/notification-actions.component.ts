import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NotificationService } from '@services/notification.service';
import { NotificationTabEnum } from '@shared/enum/notification.enum';

@Component({
  selector: 'notification-actions',
  templateUrl: './notification-actions.component.html',
  styleUrls: ['./notification-actions.component.scss']
})
export class NotificationActionsComponent implements OnInit {
  @Input() currentActiveTab;
  @Output() markAllAsReadClick = new EventEmitter();
  public NotificationTab = NotificationTabEnum;
  sizeBtn = 'medium';
  constructor(public notificationService: NotificationService) {}

  ngOnInit() {}

  handleChangeCheckbox(event: boolean) {
    if (event === true) {
      this.notificationService.activeTab$.next(this.NotificationTab.UNREAD);
    } else {
      this.notificationService.activeTab$.next(this.NotificationTab.ALL);
    }
  }
}
