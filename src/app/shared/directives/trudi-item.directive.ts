import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import { getOS } from '@shared/utils/helper-functions';
import { EPlatform } from '@shared/enum/trudi';

@Directive({
  selector: '[trudi-item]',
  exportAs: 'trudiItem'
})
export class TrudiItemDirective {
  @Input() optionsTemplate?: NzDropdownMenuComponent;
  @Output() rightClick = new EventEmitter<MouseEvent>();
  @Output() itemClick = new EventEmitter<MouseEvent>();
  @Output() shiftClickPressed = new EventEmitter<MouseEvent>();
  @Output() ctrClickPressed = new EventEmitter<MouseEvent>();
  @Output() upKeyPressed = new EventEmitter<KeyboardEvent>();
  @Output() downKeyPressed = new EventEmitter<KeyboardEvent>();
  @Output() deleteKeyPressed = new EventEmitter<KeyboardEvent>();

  private focused: boolean = false;

  constructor(private nzContextMenuService: NzContextMenuService) {}

  @HostListener('focus', ['$event'])
  onFocus(event?: FocusEvent): void {
    this.focused = true;
  }

  @HostListener('blur', ['$event'])
  onBlur(event: FocusEvent): void {
    this.focused = false;
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    if (event.shiftKey) {
      this.shiftClickPressed.emit(event);
    } else if (event.metaKey || event.ctrlKey) {
      this.ctrClickPressed.emit(event);
    } else {
      this.itemClick.emit(event);
    }
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    this.rightClick.emit(event);
    if (this.optionsTemplate) {
      this.nzContextMenuService.create(event, this.optionsTemplate);
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.focused) return;
    switch (event.key) {
      case 'Backspace': {
        if (getOS() === EPlatform.MACOS) {
          this.deleteKeyPressed.emit(event);
        }
        break;
      }
      case 'Delete':
        this.deleteKeyPressed.emit(event);
        break;
      case 'ArrowUp':
        this.upKeyPressed.emit(event);
        break;
      case 'ArrowDown':
        this.downKeyPressed.emit(event);
        break;
    }
  }
}
