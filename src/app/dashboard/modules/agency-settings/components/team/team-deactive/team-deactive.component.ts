import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PopupService } from '@services/popup.service';

@Component({
  selector: 'app-team-deactive',
  templateUrl: './team-deactive.component.html',
  styleUrls: ['./team-deactive.component.scss']
})
export class TeamDeactiveComponent implements OnInit {
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

  public isDeactivate() {
    if (this.id) {
      this.emitDeactivate.next(this.id);
    }
  }
}
