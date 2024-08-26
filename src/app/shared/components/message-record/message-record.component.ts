import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-message-record',
  templateUrl: './message-record.component.html',
  styleUrls: ['./message-record.component.scss']
})
export class MessageRecordComponent {
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
