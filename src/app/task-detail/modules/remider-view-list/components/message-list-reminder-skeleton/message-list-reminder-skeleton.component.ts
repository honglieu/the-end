import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'message-list-reminder-skeleton',
  templateUrl: './message-list-reminder-skeleton.component.html',
  styleUrls: ['./message-list-reminder-skeleton.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageListReminderSkeletonComponent {}
