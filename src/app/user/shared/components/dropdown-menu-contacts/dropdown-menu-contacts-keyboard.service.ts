import { Injectable } from '@angular/core';
import { Subject, filter, fromEvent, takeUntil } from 'rxjs';

@Injectable()
export class DropdownMenuContactsKeyboardService {
  private destroy$ = new Subject<void>();

  public reset() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public hanldeNavigate() {
    setTimeout(() => {
      const menu = document.querySelector('.ant-dropdown-menu') as HTMLElement;
      menu?.focus();

      let index = -1;
      const allowEvents = ['ArrowUp', 'ArrowDown', 'Tab'];

      fromEvent(menu, 'keydown')
        .pipe(
          filter((event: KeyboardEvent) => allowEvents.includes(event.key)),
          takeUntil(this.destroy$)
        )
        .subscribe((event) => {
          event.preventDefault();
          const elements = menu.querySelectorAll<HTMLElement>(
            '[tabindex]:not([tabindex="-1"]), [focusable]'
          );

          if (event.key == 'ArrowUp') {
            index = this.naviagateUp(index, elements);
          } else {
            index = this.navigateDown(index, elements);
          }
        });
    }, 300);
  }

  private naviagateUp(index: number, elements: NodeListOf<HTMLElement>) {
    index--;
    if (index < 0) {
      index = elements.length - 1;
    }
    const element = elements[index] as HTMLElement;
    element.focus();
    return index;
  }

  private navigateDown(index: number, elements: NodeListOf<HTMLElement>) {
    index++;
    if (index >= elements.length) {
      index = 0;
    }
    const element = elements[index] as HTMLElement;
    element.focus();
    return index;
  }
}
