import {
  Component,
  Input,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  HostListener,
  ElementRef,
  ViewChild,
  NgZone,
  AfterContentInit,
  OnInit
} from '@angular/core';

export enum ModalPopupPosition {
  right,
  center,
  full_screen
}
export interface CloseEventArgs {
  canClose: boolean;
}
@Component({
  selector: 'app-modal-popup',
  templateUrl: './modal-popup.html',
  styleUrls: ['./modal-popup.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalPopupComponent implements OnInit, AfterContentInit {
  public static lastZIndex = 1;
  @Input() transparent? = false;
  @Input() bigSize = false;
  @Input() specificWidth;
  @Input() show = false;
  @Input() showTitle = false;
  @Input() position: ModalPopupPosition = ModalPopupPosition.center;
  @Input() title: string;
  @Input() widthInPercent?: number;
  @Input() stopPropagation?: boolean = false;
  @Input() hasPadding = true;
  @Input() isFullScreenModal: boolean = false;
  @Input() appendBody: boolean = false;
  @Input() zIndex;
  @Output() closeModal = new EventEmitter<CloseEventArgs>();
  @ViewChild('modalContent') modalElement?: ElementRef;
  public _zIndex = 0;

  public modalPopupPosition = ModalPopupPosition;
  constructor(private el: ElementRef<HTMLDivElement>, private ngZone: NgZone) {
    this._zIndex = 10000 + ModalPopupComponent.lastZIndex * 100;
    ModalPopupComponent.lastZIndex++;
  }

  onClose(e: Event): void {
    const eventArgs = {
      canClose: false
    } as CloseEventArgs;
    this.closeModal.emit(eventArgs);
    if (eventArgs.canClose === true) {
      this.show = false;
    }
    if (this.stopPropagation) {
      e.stopPropagation();
    }
  }

  onClickModal(e: Event): void {
    if (this.stopPropagation) {
      e.stopPropagation();
    }
  }

  ngAfterViewInit() {
    if (this.appendBody) {
      document.body.appendChild(this.el.nativeElement);
    }
  }

  ngAfterContentInit() {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        const element = this.modalElement?.nativeElement as HTMLElement;
        element?.focus();
      });
    });
  }

  ngOnInit() {
    if (Number.isInteger(this.zIndex)) {
      this._zIndex = this.zIndex;
    }
  }

  getFocusableElements(element: HTMLElement): HTMLElement[] {
    return Array.from(
      element.querySelectorAll(
        'input, select, textarea, button,[tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];
  }

  @HostListener('keydown.Tab', ['$event'])
  onTabKeyPress(event: KeyboardEvent) {
    const modalContentElement = this.modalElement.nativeElement;
    const focusableElements = this.getFocusableElements(modalContentElement);
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement =
      focusableElements[focusableElements.length - 1];

    if (!event.shiftKey && document.activeElement === lastFocusableElement) {
      // Tab, move focus to the first element
      event.preventDefault();
      firstFocusableElement.focus();
    }
  }

  ngOnDestroy() {
    this.el.nativeElement?.remove();
  }
}
