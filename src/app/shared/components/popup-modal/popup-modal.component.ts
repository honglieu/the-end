import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { POPUP_ICON, POPUP_TYPE } from '@services/constants';

@Component({
  selector: 'popup-modal',
  templateUrl: './popup-modal.component.html',
  styleUrls: ['./popup-modal.component.scss']
})
export class PopupModalComponent implements OnInit, OnChanges {
  @Input() title: string;
  @Input() subTitle: string;
  @Input() disabledConfirmButton: string;
  @Input() type: string;
  @Input() hasCancelButton: boolean;
  @Input() confirmBtnText: string;
  @Output() onClosePopup = new EventEmitter<boolean>();
  @Output() onConfirm = new EventEmitter<boolean>();
  @Input() cancelBtnText: string = 'Cancel';
  @Input() hasBackButton: boolean;
  @Output() onCancel = new EventEmitter<boolean>();

  public popupIcons = POPUP_ICON;
  public popupType = POPUP_TYPE;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {}

  ngOnInit(): void {}

  handleClosePopup(forkClose: boolean = false) {
    if (forkClose) {
      return this.onClosePopup.emit();
    }
    if (this.hasBackButton) {
      this.onCancel.emit();
    } else {
      this.onClosePopup.emit();
    }
  }

  handleConfirm() {
    this.onConfirm.emit();
  }
}
