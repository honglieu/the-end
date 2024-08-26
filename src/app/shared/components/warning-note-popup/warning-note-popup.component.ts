import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'warning-note-popup',
  templateUrl: './warning-note-popup.component.html',
  styleUrls: ['./warning-note-popup.component.scss']
})
export class WarningNotePopupComponent implements OnInit {
  @Input() titleWarning: string =
    'You still have a message scheduled to be sent.';
  @Input() warningMessage: string = '';
  @Input() timeToCloseModal: number = 0;
  @Output() isCloseModal = new EventEmitter<boolean>();
  timeOut: NodeJS.Timeout = null;

  constructor() {}

  ngOnInit(): void {
    this.handleCloseModal();
  }

  handleCloseModal() {
    this.timeOut = setTimeout(() => {
      this.isCloseModal.emit(false);
    }, this.timeToCloseModal);
  }

  ngOnDestroy() {
    clearTimeout(this.timeOut);
  }
}
