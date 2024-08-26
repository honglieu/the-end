import { TrudiUiModule } from '@trudi-ui';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  afterNextRender,
  inject
} from '@angular/core';
import { IMessage } from '@/app/shared/types/message.interface';
import { EMessageType } from '@shared/enum/messageType.enum';
import {
  PreviewFileComponent,
  PreviewTextComponent
} from '@shared/components/chat/message-reply';
import { ReplyMessageService } from '@services/reply-message.service';

@Component({
  selector: 'message-reply-preview',
  standalone: true,
  imports: [TrudiUiModule, PreviewTextComponent, PreviewFileComponent],
  templateUrl: './message-reply-preview.component.html',
  styleUrl: './message-reply-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageReplyPreviewComponent {
  @Output() closeEvent = new EventEmitter();
  @Output() afterNextRender = new EventEmitter();

  private _message: IMessage;
  @Input() set message(value: IMessage) {
    this._message = value;
    if (value) {
      this._message.messageType =
        value?.messageType?.toUpperCase() as EMessageType;
    }
    this.replyTitle = this.replyMessageService.getReplyTitle(value, true);
  }

  get message(): IMessage {
    return this._message;
  }

  private replyMessageService = inject(ReplyMessageService);

  messagesType = EMessageType;
  replyTitle: string = null;

  constructor() {
    afterNextRender(() => {
      this.afterNextRender.emit(true);
    });
  }

  handleClose() {
    this.closeEvent.emit(true);
  }
}
