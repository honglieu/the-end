import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-team-assign-admin',
  templateUrl: './team-assign-admin.component.html',
  styleUrls: ['./team-assign-admin.component.scss']
})
export class TeamAssignAdminComponent {
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() emitConfirm = new EventEmitter<string>();
  @Input() nameOfUser = '';
  @Input() id = '';

  public isOpenModal(status: boolean) {
    if (!status) {
      this.isCloseModal.next(status);
    }
  }

  public isConfirm() {
    if (this.id) {
      this.emitConfirm.next(this.id);
    }
  }
}
