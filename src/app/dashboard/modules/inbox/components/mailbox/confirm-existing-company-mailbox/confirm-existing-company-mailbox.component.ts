import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EMailBoxPopUp } from '@shared/enum/inbox.enum';

@Component({
  selector: 'confirm-existing-company-mailbox',
  templateUrl: './confirm-existing-company-mailbox.component.html',
  styleUrls: ['./confirm-existing-company-mailbox.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ConfirmExistingCompanyMailboxComponent {
  @Input() visible: boolean = true;
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();

  constructor(private _inboxService: InboxService) {}

  public handleCancel() {
    this.onCancel.emit();
  }

  public handleNext() {
    this._inboxService.setPopupMailBoxState(EMailBoxPopUp.EMAIL_PROVIDER);
  }

  public handleBack() {
    this._inboxService.setPopupMailBoxState(EMailBoxPopUp.MAILBOX_TYPE);
  }
}
