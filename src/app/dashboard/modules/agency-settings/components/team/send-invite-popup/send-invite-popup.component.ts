import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PopupService } from '@services/popup.service';

@Component({
  selector: 'app-send-invite-popup',
  templateUrl: './send-invite-popup.component.html',
  styleUrls: ['./send-invite-popup.component.scss']
})
export class SendInvitePopupComponent implements OnInit {
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() name = new EventEmitter<boolean>();

  public nameOfUser: string;

  constructor(public popupService: PopupService) {}

  ngOnInit() {}

  public isOpenModal(status) {
    if (!status) {
      this.isCloseModal.next(status);
    }
  }
}
