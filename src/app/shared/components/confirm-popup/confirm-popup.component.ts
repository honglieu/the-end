import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'confirm-popup',
  templateUrl: './confirm-popup.component.html',
  styleUrls: ['./confirm-popup.component.scss']
})
export class ConfirmPopupComponent implements OnInit {
  @Input() isShowIcon: boolean = true;
  @Input() titleText = '';
  @Input() subTexts: string[] = [];
  @Input() buttonLeft = '';
  @Input() buttonRight = '';
  @Input() stateWarningTitle = '';
  @Input() iconUrl: string = '/assets/icon/trudi_avt.svg';
  @Input() backgroundRightBtn: string = 'var(--fg-brand)';
  @Input() btnType: 'primary' | 'danger' | 'neutral' = 'primary';
  @Output() onButtonLeftClick = new EventEmitter<boolean>();
  @Output() onButtonRightClick = new EventEmitter<boolean>();

  public isLoading = false;
  constructor() {}

  ngOnInit(): void {}

  handleLeftButtonClick(e: Event) {
    e.stopPropagation();
    this.onButtonLeftClick.next(true);
  }

  handleRightButtonClick(e: Event) {
    e.stopPropagation();
    this.onButtonRightClick.next(true);
    this.isLoading = true;
  }
}
