import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-team-delete-profile',
  templateUrl: './team-delete-profile.component.html',
  styleUrls: ['./team-delete-profile.component.scss']
})
export class TeamDeleteProfileComponent {
  @Output() isCloseModal = new EventEmitter();
  @Output() emitDeleteProfile = new EventEmitter();

  public isOpenModal() {
    this.isCloseModal.next(null);
  }

  public isDeleteProfile() {
    this.emitDeleteProfile.next(null);
  }
}
