import { Component, Input } from '@angular/core';
import { FormProps } from '@shared/types/action-link.interface';

@Component({
  selector: 'app-message-action-link',
  templateUrl: './message-action-link.component.html',
  styleUrls: ['./message-action-link.component.scss']
})
export class MessageActionLinkComponent {
  @Input() messageActionLink: FormProps;
  @Input() linkBackground = '';
  @Input() imgLink = '';
  @Input() propertyId = '';
  @Input() radiusConfig?: boolean;
  @Input() reBorderAtChatApp = false;
  @Input() widthInPercent?: number = 100;
  @Input() grayBorder? = false;
  constructor() {}

  public onClickActionLink(actionLink) {
    window.open(actionLink, '_blank');
  }
}
