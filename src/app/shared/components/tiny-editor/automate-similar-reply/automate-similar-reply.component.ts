import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'automate-similar-reply',
  templateUrl: './automate-similar-reply.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutomateSimilarReplyComponent {
  @Input() disabled: boolean = false;

  get automateSimilarControl(): AbstractControl {
    return this.trudiSendMsgFormService.sendMsgForm?.get('automateSimilar');
  }

  constructor(
    private router: Router,
    private trudiSendMsgFormService: TrudiSendMsgFormService
  ) {}

  navigateToMailboxSettings() {
    this.router.navigate(['/dashboard/mailbox-settings/ai-replies']);
  }
}
