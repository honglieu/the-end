import { EAiAssistantAction } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'message-end-session',
  templateUrl: './message-end-session.component.html',
  styleUrls: ['./message-end-session.component.scss']
})
export class MessageEndSessionComponent {
  @Input() message;
  readonly EAiAssistantAction = EAiAssistantAction;
}
