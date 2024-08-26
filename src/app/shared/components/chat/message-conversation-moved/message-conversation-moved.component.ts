import { EMessageType } from '@/app/shared/enum';
import { Component, Input } from '@angular/core';
import { EPage } from '@shared/enum/trudi';

@Component({
  selector: 'app-message-conversation-moved',
  templateUrl: './message-conversation-moved.component.html',
  styleUrls: ['./message-conversation-moved.component.scss']
})
export class MessageConversationMovedComponent {
  @Input() message: any | null = null;
  public readonly EMessageType = EMessageType;
  public readonly EPage = EPage;
  constructor() {}
}
