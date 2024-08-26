import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { EMessageType } from '@shared/enum/messageType.enum';
import { IMessage } from '@shared/types/message.interface';
import { PropertiesService } from '@services/properties.service';

@Component({
  selector: 'voice-mail-inbox-detail-message',
  templateUrl: './voice-mail-inbox-detail-message.component.html',
  styleUrls: ['./voice-mail-inbox-detail-message.component.scss']
})
export class VoicemailInboxDetailMessageComponent implements OnChanges {
  @Input() message: IMessage;
  @Input() phoneNumber: string;
  readonly EMessagesType = EMessageType;

  constructor(public propertiesService: PropertiesService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message']?.currentValue) {
      if (
        this.message.creator?.isTemporary &&
        [EMessageType.reopened, EMessageType.solved].includes(
          this.message.messageType.toUpperCase() as EMessageType
        )
      ) {
        this.message.firstName = this.phoneNumber;
      }
    }
  }
}
