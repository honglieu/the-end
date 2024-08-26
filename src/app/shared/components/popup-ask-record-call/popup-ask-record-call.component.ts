import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-popup-ask-record-call',
  templateUrl: './popup-ask-record-call.component.html',
  styleUrls: ['./popup-ask-record-call.component.scss']
})
export class PopupAskRecordCallComponent implements OnInit {
  @Output() isStartRecord = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit(): void {}

  onStartRecord(status: boolean) {
    this.isStartRecord.emit(status);
  }
}
