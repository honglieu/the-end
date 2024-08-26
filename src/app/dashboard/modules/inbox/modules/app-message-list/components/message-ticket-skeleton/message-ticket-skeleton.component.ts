import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'message-ticket-skeleton',
  templateUrl: './message-ticket-skeleton.component.html',
  styleUrl: './message-ticket-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageTicketSkeletonComponent {}
