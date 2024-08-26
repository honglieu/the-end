import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PopupService } from '@services/popup.service';

@Component({
  selector: 'app-warning-popup',
  templateUrl: './warning-popup.component.html',
  styleUrls: ['./warning-popup.component.scss']
})
export class WarningPopupComponent implements OnInit {
  @Input() nameOfUser = '';
  @Input() id = '';

  @Output() onClose = new EventEmitter<boolean>();
  @Output() onSubmit = new EventEmitter<boolean>();

  constructor(public popupService: PopupService) {}
  ngOnInit() {}

  public close() {
    this.onClose.emit();
  }
  public submit() {
    this.onSubmit.emit();
  }
}
