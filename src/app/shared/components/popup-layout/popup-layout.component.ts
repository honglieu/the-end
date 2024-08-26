import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'popup-layout',
  templateUrl: './popup-layout.component.html',
  styleUrls: ['./popup-layout.component.scss']
})
export class PopupLayoutComponent implements OnInit {
  @Input() headerText = 'Select property';
  @Input() logoSvgSegmentId = '#home-rounded-icon';
  @Input() leftButtonText = 'Cancel';
  @Input() rightButtonText = 'Confirm';
  @Input() disabledRightButton = true;
  @Input() disabledLeftButton = false;
  @Input() apiCalling = false;
  @Input() dividerBottom = true;
  @Output() whenClosed = new EventEmitter<void>();
  @Output() whenConfirmed = new EventEmitter<void>();
  @Output() whenCancel = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {}

  onClose(e: Event): void {
    e.stopPropagation();
    this.whenClosed.emit();
  }

  onCancel() {
    this.whenCancel.emit();
  }

  onConfirm() {
    this.whenConfirmed.emit();
  }
}
