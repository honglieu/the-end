import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IconType } from '../trudi-icon/trudi-icon.component';

@Component({
  selector: 'trudi-tag',
  templateUrl: './trudi-tag.component.html',
  styleUrls: ['./trudi-tag.component.scss']
})
export class TrudiTagComponent implements OnInit {
  @Input() title: string;
  @Input() imgUrl: string = '';
  @Input() disabled: boolean = false;
  @Input() icon: IconType;
  @Output() onClose = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  handleClose() {
    if (!this.disabled) {
      this.onClose.emit();
    }
  }
}
