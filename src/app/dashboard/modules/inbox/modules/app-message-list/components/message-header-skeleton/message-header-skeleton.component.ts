import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'message-header-skeleton',
  templateUrl: './message-header-skeleton.component.html',
  styleUrl: './message-header-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageHeaderSkeletonComponent {}
