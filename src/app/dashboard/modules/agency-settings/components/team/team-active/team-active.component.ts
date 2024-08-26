import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PopupService } from '@services/popup.service';

@Component({
  selector: 'app-team-active',
  templateUrl: './team-active.component.html',
  styleUrls: ['./team-active.component.scss']
})
export class TeamActiveComponent implements OnInit {
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() emitDeactivate = new EventEmitter<string>();
  @Input() nameOfUser = '';
  @Input() id = '';
  constructor(public popupService: PopupService) {}
  ngOnInit() {}
  public isOpenModal(status: boolean) {
    if (!status) {
      this.isCloseModal.next(status);
    }
  }

  public isActivate() {
    if (this.id) {
      this.emitDeactivate.next(this.id);
    }
  }
}
