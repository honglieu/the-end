import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Output
} from '@angular/core';

@Directive({
  selector: '[appDnd]'
})
export class DndDirective {
  @HostBinding('class.fileover') fileOver: boolean;
  @Output() filesDropped = new EventEmitter<any>();
  constructor() {}

  @HostListener('dragover', ['$event'])
  onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(evt: DragEvent) {
    this.fileOver = false;
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event']) onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
    const files = evt.dataTransfer.files;
    if (files.length) {
      this.filesDropped.emit(files);
    }
  }
}
