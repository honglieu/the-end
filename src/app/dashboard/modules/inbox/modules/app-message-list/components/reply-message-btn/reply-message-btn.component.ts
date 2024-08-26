import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReplyMessageService } from '@services/reply-message.service';
import { TrudiUiModule } from '@trudi-ui';
import { IMessage } from '@shared/types/message.interface';

@Component({
  selector: 'reply-message-btn',
  standalone: true,
  imports: [CommonModule, TrudiUiModule],
  templateUrl: './reply-message-btn.component.html',
  styleUrl: './reply-message-btn.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReplyMessageBtnComponent {
  @Input() inDropdown: boolean = false;
  @Input() position: 'left' | 'right' | null = null;
  @Input() message: IMessage | null = null;

  replyMessageService = inject(ReplyMessageService);

  handleReply() {
    this.replyMessageService.triggerReply.next(this.message);
  }
}
