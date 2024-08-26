import {
  Component,
  ElementRef,
  Output,
  EventEmitter,
  ViewChild,
  Input,
  TemplateRef,
  AfterContentChecked,
  Renderer2,
  OnDestroy
} from '@angular/core';

import {
  isInputOrTextAreaElement,
  getContentEditableCaretCoords
} from './mention-utils';
import { getCaretCoordinates } from './caret-coords';

interface ICoords {
  top: number;
  left: number;
  editorWidth: number;
  editorHeight: number;
  editorReact?: ClientRect;
}

/**
 * Angular Mentions.
 * https://github.com/dmacfarlane/angular-mentions
 *
 * Copyright (c) 2016 Dan MacFarlane
 */
@Component({
  selector: 'mention-list',
  templateUrl: './trudi-mention.component.html',
  styleUrls: ['./trudi-mention.component.scss']
})
export class TrudiMentionComponent implements AfterContentChecked, OnDestroy {
  @Input() labelKey: string = 'label';
  @Input() avatarKey: string = 'avatar';
  @Input() itemTemplate: TemplateRef<any>;
  @Output() itemClick = new EventEmitter();
  @Output() clickOutside = new EventEmitter<MouseEvent>();
  @ViewChild('list', { static: true }) list: ElementRef;
  @ViewChild('defaultItemTemplate', { static: true })
  defaultItemTemplate: TemplateRef<any>;
  items = [];
  activeIndex: number = 0;
  hiddenValue: boolean = false;
  styleOff: boolean = false;
  nzVisible = true;
  private coords: ICoords;
  private offset: number = 0;
  private clickListener: () => void = null;
  private setNzVisibleTimeout: NodeJS.Timeout;

  constructor(private element: ElementRef, private renderer2: Renderer2) {
    this.clickListener = renderer2.listen(
      document,
      'click',
      (event: MouseEvent) => {
        const clickedInside = this.element.nativeElement.contains(event.target);
        if (clickedInside) return;
        this.clickOutside.emit(event);
      }
    );
  }

  get hidden() {
    return this.hiddenValue;
  }

  set hidden(value: boolean) {
    this.hiddenValue = value;
    !this.hidden && this.checkBounds();
    this.setNzVisibleTimeout = setTimeout(() => {
      this.nzVisible = !this.hidden;
    }, 200);
  }

  ngOnDestroy(): void {
    clearTimeout(this.setNzVisibleTimeout);
    this.clickListener = null;
  }

  ngAfterContentChecked() {
    if (!this.itemTemplate) {
      this.itemTemplate = this.defaultItemTemplate;
    }
  }

  // lots of confusion here between relative coordinates and containers
  position(
    nativeParentElement: HTMLInputElement,
    iframe: HTMLIFrameElement = null
  ) {
    if (isInputOrTextAreaElement(nativeParentElement)) {
      // parent elements need to have postition:relative for this to work correctly?
      this.coords = getCaretCoordinates(
        nativeParentElement,
        nativeParentElement.selectionStart,
        null
      );
      this.coords.top =
        nativeParentElement.offsetTop +
        this.coords.top -
        nativeParentElement.scrollTop;
      this.coords.left =
        nativeParentElement.offsetLeft +
        this.coords.left -
        nativeParentElement.scrollLeft;
      // getCretCoordinates() for text/input elements needs an additional offset to position the list correctly
      this.offset = this.getBlockCursorDimensions(nativeParentElement).height;
    } else if (iframe) {
      let context: { iframe: HTMLIFrameElement; parent: Element } = {
        iframe: iframe,
        parent: iframe.offsetParent
      };
      this.coords = getContentEditableCaretCoords(context);
    } else {
      let doc = document.documentElement;
      let scrollLeft =
        (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
      let scrollTop =
        (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
      // bounding rectangles are relative to view, offsets are relative to container?
      let caretRelativeToView = getContentEditableCaretCoords({
        iframe: iframe
      });
      let parentRelativeToContainer: ClientRect =
        nativeParentElement.getBoundingClientRect();
      this.coords.top =
        caretRelativeToView.top -
        parentRelativeToContainer.top +
        nativeParentElement.offsetTop -
        scrollTop;
      this.coords.left =
        caretRelativeToView.left -
        parentRelativeToContainer.left +
        nativeParentElement.offsetLeft -
        scrollLeft;
    }
    // set the default/inital position
    this.checkBounds();
  }

  get activeItem() {
    return this.items[this.activeIndex];
  }

  scrollToActiveItem() {
    const listEl: HTMLElement = this.list.nativeElement;
    const activeEl: HTMLElement = <HTMLElement>(
      listEl.getElementsByClassName('active').item(0)
    );
    let activeRect: ClientRect = activeEl?.getBoundingClientRect();

    if (activeRect?.bottom > listEl?.getBoundingClientRect()?.bottom) {
      listEl.scrollTop =
        activeEl.offsetTop + activeRect?.height - listEl?.clientHeight;
    } else if (activeRect?.top < listEl?.getBoundingClientRect()?.top) {
      listEl.scrollTop = activeEl?.offsetTop;
    }
  }

  activateNextItem() {
    // adjust scrollable-menu offset if the next item is out of view
    const listEl: HTMLElement = this.list.nativeElement;
    const activeEl = listEl.getElementsByClassName('active').item(0);
    let nextActiveIndex = this.activeIndex + 1;

    if (activeEl) {
      let nextLiEl: HTMLElement = <HTMLElement>activeEl.nextSibling;

      while (this.items[nextActiveIndex].disabled) {
        nextActiveIndex += 1;
        if (nextActiveIndex >= this.items.length) {
          return;
        }
        nextLiEl = <HTMLElement>nextLiEl.nextSibling;
      }

      if (nextLiEl && nextLiEl.nodeName == 'LI') {
        let nextLiRect: ClientRect = nextLiEl.getBoundingClientRect();

        if (nextLiRect.bottom > listEl.getBoundingClientRect().bottom) {
          listEl.scrollTop =
            nextLiEl.offsetTop + nextLiRect.height - listEl.clientHeight;
        }
      }
    }
    // select the next item
    this.activeIndex =
      nextActiveIndex >= this.items.length
        ? this.activeIndex
        : Math.max(Math.min(nextActiveIndex, this.items.length - 1), 0);
  }

  activatePreviousItem() {
    // adjust the scrollable-menu offset if the previous item is out of view
    const listEl: HTMLElement = this.list.nativeElement;
    const activeEl = listEl.getElementsByClassName('active').item(0);
    let prevActiveIndex = this.activeIndex - 1;

    if (activeEl) {
      let prevLiEl: HTMLElement = <HTMLElement>activeEl.previousSibling;

      while (this.items[prevActiveIndex].disabled) {
        prevActiveIndex -= 1;
        if (prevActiveIndex < 0) {
          return;
        }
        prevLiEl = <HTMLElement>prevLiEl.previousSibling;
      }

      if (prevLiEl && prevLiEl.nodeName == 'LI') {
        let prevLiRect: ClientRect = prevLiEl.getBoundingClientRect();
        if (prevLiRect.top < listEl.getBoundingClientRect().top) {
          listEl.scrollTop = prevLiEl.offsetTop;
        }
      }
    }
    // select the previous item
    this.activeIndex =
      prevActiveIndex < 0
        ? this.activeIndex
        : Math.max(Math.min(prevActiveIndex, this.items.length - 1), 0);
  }

  // reset for a new mention search
  reset() {
    this.scrollToActiveItem();
    this.checkBounds();
  }

  // final positioning is done after the list is shown (and the height and width are known)
  // ensure it's in the page bounds
  private checkBounds() {
    let { left, top, editorWidth, editorReact } = this.coords;
    let right;
    const listHeight = 44 * Math.min(this.items.length, 6);
    const isDropUp = editorReact.top + top - 30 > listHeight;
    const isDropLeft = editorWidth - left < 360; //If left space is smaller then mention max-width

    if (isDropUp) {
      top = -listHeight + top - 30;
    }

    right = isDropLeft ? editorWidth - left - 12 : null;

    if (editorWidth - left < 25) {
      left = 0;
      top += 20;
      right = null;
    }

    // set the revised/final position
    this.positionElement(left, top, right);
  }

  private positionElement(
    left: number = this.coords.left,
    top: number = this.coords.top,
    right: number | null
  ) {
    const el: HTMLElement = this.list.nativeElement;
    top += this.offset; // top of list is next line
    el.style.position = 'absolute';
    el.style.left = right ? 'unset' : left + 'px';
    el.style.right = right ? right + 'px' : 'unset';
    el.style.top = top + 'px';
  }

  private getBlockCursorDimensions(nativeParentElement: HTMLInputElement) {
    const parentStyles = window.getComputedStyle(nativeParentElement);
    return {
      height: parseFloat(parentStyles.lineHeight),
      width: parseFloat(parentStyles.fontSize)
    };
  }

  onItemClick(index: number) {
    this.activeIndex = index;
    this.itemClick.emit();
  }
}
