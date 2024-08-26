import { IFile } from '@/app/shared/types';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'notification-item-attachment',
  templateUrl: './notification-item-attachment.component.html',
  styleUrl: './notification-item-attachment.component.scss'
})
export class NotificationItemAttachmentComponent {
  @Input() file: IFile = {} as IFile;
}
