import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { Subject, filter, fromEvent, takeUntil } from 'rxjs';
import uuid4 from 'uuid4';
import { EMenuDropdownType } from '../enums/menu-dropdown-type.enum';

@Directive({
  selector: '[menuKeyboard]',
  standalone: true
})
export class MenuKeyboardDirective implements OnChanges {
  @Input() visibleMenu: Boolean = false;
  @Input() menuType: EMenuDropdownType = EMenuDropdownType.Popover;

  private uuid: string = uuid4();
  private destroy$ = new Subject<void>();
  private menuContent: HTMLElement = null;

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visibleMenu']?.currentValue) {
      setTimeout(() => {
        !this.menuContent && this.queryMenuContent();
        this.handleNavigate();
        return;
      }, 300);
    }
    if (!this.menuContent) return;
    (this.el.nativeElement as HTMLElement).focus();
    this.reset();
  }

  public reset() {
    this.menuContent?.removeAttribute('data-menu-keyboard-id');
    this.menuContent = null;
    this.destroy$.next();
    this.destroy$.complete();
  }

  public queryMenuContent() {
    let query = ``;

    switch (this.menuType) {
      case EMenuDropdownType.Popover:
        query += '.ant-popover-inner-content .ant-menu';
        break;
      case EMenuDropdownType.Dropdown:
        query += '.ant-dropdown-menu';
        break;
      case EMenuDropdownType.TrudiSelectDropDown:
        query += '.ant-dropdown';
        break;
      case EMenuDropdownType.CompanySettingGroup:
        query += '.cdk-overlay-pane .company-setting-group';
        break;
    }

    const menu = document.querySelector(
      query + ':not([data-menu-keyboard-id])'
    ) as HTMLElement;
    this.menuContent = menu;

    this.menuContent &&
      this.menuContent.setAttribute('data-menu-keyboard-id', this.uuid);
  }

  public handleNavigate() {
    (this.menuContent?.firstElementChild as HTMLElement)?.focus();
    let index = -1;
    const allowEvents = ['ArrowDown', 'ArrowUp', 'Tab'];

    fromEvent(this.menuContent, 'keydown')
      .pipe(
        filter((e: KeyboardEvent) => allowEvents.includes(e.key)),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        event.preventDefault();
        const elements = this.menuContent.querySelectorAll<HTMLElement>(
          '[tabindex]:not([tabindex="-1"]),[focusable]'
        );
        if (event.key == 'ArrowUp') {
          index = this.navigateUp(index, elements);
          return;
        }
        index = this.navigateDown(index, elements);
      });
  }

  private navigate(
    index: number,
    elements: NodeListOf<HTMLElement>,
    direction: number
  ) {
    const nextIndex = (index + direction + elements.length) % elements.length;
    const nextElement = elements[nextIndex];
    const focusElement = nextElement.hasAttribute('tabindex')
      ? nextElement
      : (nextElement.firstElementChild as HTMLElement);
    focusElement.focus();
    return nextIndex;
  }

  private navigateUp(index: number, elements: NodeListOf<HTMLElement>) {
    return this.navigate(index, elements, -1);
  }

  private navigateDown(index: number, elements: NodeListOf<HTMLElement>) {
    return this.navigate(index, elements, 1);
  }
}
