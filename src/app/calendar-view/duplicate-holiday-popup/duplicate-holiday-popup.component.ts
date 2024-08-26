import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'duplicate-holiday-popup',
  templateUrl: './duplicate-holiday-popup.component.html',
  styleUrls: ['./duplicate-holiday-popup.component.scss']
})
export class DuplicateHolidayPopupComponent implements OnInit {
  @Input() holidayId: string;
  @Input() nameChosen: string;
  @Input() nameChange: string;
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() handleConfirmChange = new EventEmitter<any>();
  public rightBtnText = 'Change';
  public leftBtnText = 'Cancel';
  constructor() {}

  ngOnInit(): void {}

  leftBtnClick() {
    this.isCloseModal.next(false);
  }

  rightBtnClick() {
    const data = {
      holidayId: this.holidayId,
      nameChose: this.nameChosen,
      nameChange: this.nameChange
    };
    this.handleConfirmChange.emit(data);
  }
}
