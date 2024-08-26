import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'internet-disconnect',
  templateUrl: './internet-disconnect.component.html',
  styleUrls: ['./internet-disconnect.component.scss']
})
export class InternetDisconnectComponent implements OnInit {
  @Output() showNotifyInternet = new EventEmitter<any>();
  constructor() {}

  ngOnInit(): void {}

  handleCloseNotify() {
    this.showNotifyInternet.emit(false);
  }
}
