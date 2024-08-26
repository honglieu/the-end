import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EUserPropertyType } from '@shared/enum/user.enum';

@Component({
  selector: 'app-user-box',
  templateUrl: './app-user-box.component.html',
  styleUrls: ['./app-user-box.component.scss']
})
export class AppUserBoxComponent implements OnInit {
  @Input() listOfUserByGroupIndex;
  @Input() listOfUserByGroup;
  @Output() handleRemoveReceiver = new EventEmitter<string>();
  EUserPropertyType = EUserPropertyType;

  constructor() {}

  ngOnInit() {}
  handleEmitUserId(event) {
    this.handleRemoveReceiver.emit(event);
  }
}
