import { Component, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-message-dialog',
  templateUrl: 'message-dialog.component.html',
  styleUrls: ['./message-dialog.component.scss']
})
export class ModalDialogComponent {
  @Input() header: string;
  @Input() description: string;
  @Output() isConfirmed: EventEmitter<boolean> = new EventEmitter<boolean>();

  confirm() {
    this.isConfirmed.emit(true);
  }

  close() {
    this.isConfirmed.emit(false);
  }
}
