import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'confirm-send-invite-or-message',
  templateUrl: './confirm-send-invite-or-message.component.html',
  styleUrls: ['./confirm-send-invite-or-message.component.scss']
})
export class ConfirmSendInviteOrMessageComponent implements OnInit {
  @Input() numberSent: number;
  @Input() isSendInvite: boolean = true;
  @Input() usersHaveInvalidEmail = [];
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isOpenSuccessModal = new EventEmitter();
  constructor() {}

  ngOnInit() {}

  public isOpenModal(status) {
    if (!status) {
      this.isCloseModal.next(status);
    }
  }

  public handleConfirmSuccess(status) {
    this.isOpenSuccessModal.next({ status: status });
  }

  ngOnDestroy() {}
}
