import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject
} from '@angular/core';
import { PreviewTextComponent } from './preview-text/preview-text.component';
import { PreviewFileComponent } from './preview-file/preview-file.component';
import { IMessage } from '@shared/types/message.interface';
import { EMessageType } from '@shared/enum/messageType.enum';
import { ReplyMessageService } from '@services/reply-message.service';
import { TwemojiPipe } from '@/app/shared/pipes/twemoji.pipe';

@Component({
  selector: 'message-reply',
  standalone: true,
  imports: [
    CommonModule,
    PreviewTextComponent,
    PreviewFileComponent,
    TwemojiPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './message-reply.component.html',
  styleUrl: './message-reply.component.scss'
})
export class MessageReplyComponent {
  @Input() position: 'left' | 'right' = 'left';
  @Input() isSending: boolean = false;

  private _message: IMessage;
  @Input() set message(value: IMessage) {
    this._message = value;
    if (!value?.messageType) return;
    this._message.messageType =
      this._message.messageType.toUpperCase() as EMessageType;
  }

  get message(): IMessage {
    return this._message;
  }

  messagesType = EMessageType;

  private replyMessageService = inject(ReplyMessageService);

  handleClick() {
    this.replyMessageService.triggerScrollToElement.next(this.message.id);
  }
}
