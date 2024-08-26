import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-team-assign-owner',
  templateUrl: './team-assign-owner.component.html',
  styleUrls: [
    '../team-assign-admin/team-assign-admin.component.scss',
    './team-assign-owner.component.scss'
  ]
})
export class TeamAssignOwnerComponent {
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
