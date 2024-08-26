import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'media-card',
  templateUrl: './media-card.component.html',
  styleUrls: ['./media-card.component.scss']
})
export class MediaCardComponent {
  @Input() file;
  @Input() disabled;
  @Output() onClick = new EventEmitter();
  @Output() onRemoveFile = new EventEmitter();

  constructor() {}

  handleClick(event: MouseEvent) {
    if (this.disabled) return;
    event.stopPropagation();
    this.onClick.emit(this.file);
  }

  removeFile(event: MouseEvent) {
    if (this.disabled) return;
    event.stopPropagation();
    this.onRemoveFile.emit(this.file);
  }
}
