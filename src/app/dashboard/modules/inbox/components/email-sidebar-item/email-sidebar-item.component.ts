import { Component, Input } from '@angular/core';
import { IEmailRoute } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';

@Component({
  selector: 'email-sidebar-item',
  templateUrl: './email-sidebar-item.component.html',
  styleUrls: ['./email-sidebar-item.component.scss']
})
export class EmailSidebarItemComponent {
  @Input() item: IEmailRoute;
  constructor() {}
}
