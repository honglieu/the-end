import { TrudiButtonType } from '@trudi-ui';
import { CdkDrag, CdkDragMove } from '@angular/cdk/drag-drop';
import { Overlay } from '@angular/cdk/overlay';
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
  AfterViewInit,
  TemplateRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  Inject
} from '@angular/core';
import {
  DEFAULT_RESIZE_DIRECTION,
  NzResizableDirective,
  NzResizeDirection,
  NzResizeEvent
} from 'ng-zorro-antd/resizable';
import { debounceTime, fromEvent, Subject, takeUntil } from 'rxjs';
import {
  CloseEventArgs,
  ModalPopupComponent,
  ModalPopupPosition
} from '@shared/components/modal-popup/modal-popup';
import { PreventButtonService } from '@trudi-ui';
import { ModalManagementService } from '@/app/dashboard/services/modal-management.service';

type TEvent<T = {}> = T;

export interface StyleCustom {
  backgroundColor?: string;
  border?: string;
}
@Component({
  selector: 'resizable-modal-popup',
  templateUrl: './resizable-modal-popup.html',
  styleUrls: ['./resizable-modal-popup.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResizableModalPopupComponent
  implements OnInit, AfterContentInit, OnChanges, AfterViewInit, OnDestroy
{
  static onResizeOrDragStarted = new Subject<void>();
  @ViewChild('dragModal', { static: false }) dragModal: CdkDrag;
  @ViewChild('modalContainer') modalContainer: ElementRef;
  private static lastZIndex = 1;
  private readonly DEFAULT_WIDTH = 800;

  @Input() modalId?: string;
  @Input() colorBtn: TrudiButtonType = 'primary';
  @Input() closable: boolean = true;
  @Input() isShowFooter = false;
  @Input() iconName: string = '';
  @Input() subTitle: string;
  @Input() hiddenCancelBtn: boolean = false;
  @Input() hiddenOkBtn: boolean = false;
  @Input() showBackBtn: boolean = false;
  @Input() disableOkBtn: boolean = false;
  @Input() heightCustom: string;
  @Input() widthCustom: number;
  @Input() minWidth: number = this.DEFAULT_WIDTH;
  @Input() isCustomMoveable: boolean = false;
  @Input() okText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() styleCustom?: StyleCustom;

  @Input() transparent? = false;
  @Input() bigSize = false;
  @Input() specificWidth;
  @Input() show = false;
  @Input() showTitle = false;
  @Input() styleIcon = { 'width.px': 48, 'height.px': 48 };
  @Input() classIconTitle = 'size-48';

  @Input() position: ModalPopupPosition = ModalPopupPosition.center;
  @Input() title: string;
  @Input() widthInPercent?: number;
  @Input() stopPropagation?: boolean = false;
  @Input() hasPadding = true;
  @Input() isFullScreenModal: boolean = false;
  @Input() appendBody: boolean = false;
  @Input() resizable = false;
  @Input() headerTemplate: TemplateRef<HTMLElement>;
  @Input() footerTemplate: TemplateRef<HTMLElement>;
  @Input() draggable: boolean = false;
  @Input() hasBackdrop: boolean = true;
  @Output() isFullScreenModalChange = new EventEmitter<boolean>();
  @Output() closeModal = new EventEmitter<CloseEventArgs>();
  @Output() triggerEventScroll = new EventEmitter();

  @Output() onOk: EventEmitter<TEvent> = new EventEmitter<TEvent>();
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onBack: EventEmitter<void> = new EventEmitter<void>();
  @Output() moved = new EventEmitter<CdkDragMove<unknown>>();
  @Output() resized: EventEmitter<NzResizeEvent> =
    new EventEmitter<NzResizeEvent>();

  @ViewChild('modalContent') modalElement?: ElementRef;

  public modalPopupPosition = ModalPopupPosition;
  public zIndex = 0;
  public width = this.DEFAULT_WIDTH;
  public height;
  public animationId = -1;
  public disabled = false;
  public maxWidth: number;
  public resizeDirection: NzResizeDirection | null = null;
  public maxHeight: number;
  public minHeight: number;
  public eventResize: NzResizeEvent;
  public resizeHandleOptions = normalizeResizeHandleOptions(
    DEFAULT_RESIZE_DIRECTION
  );
  public isBrowserSafari: boolean = false;
  private destroy$ = new Subject();

  constructor(
    private el: ElementRef<HTMLDivElement>,
    private ngZone: NgZone,
    private overlay: Overlay,
    @Inject(PreventButtonService)
    public PreventButtonService: PreventButtonService,
    private modalManagementService: ModalManagementService,
    private cdr: ChangeDetectorRef
  ) {
    this.zIndex = 10000 + ModalPopupComponent.lastZIndex * 100;
    ModalPopupComponent.lastZIndex++;
    this.setDefaultWidth();
  }
  ngOnInit(): void {
    this.isBrowserSafari = this.isSafariBrowser();
    this.onTriggerWarningModal();
  }

  isSafariBrowser() {
    return (
      navigator.userAgent.indexOf('Safari') > -1 &&
      navigator.userAgent.indexOf('Chrome') <= -1
    );
  }

  private onTriggerWarningModal() {
    this.PreventButtonService.triggerWarningModal$
      .pipe(takeUntil(this.destroy$))
      .subscribe((trigger) => {
        if (!this.show) return;
        if (
          !trigger ||
          trigger?.id === this.modalId ||
          (!this.modalId &&
            this.modalManagementService?.openModalIds[0] === trigger?.id)
        ) {
          this.addShakeAnimation();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isFullScreenModal']) {
      if (!changes['isFullScreenModal']?.firstChange) {
        this.dragModal?.reset();
        const point = this.calculateCenterPosition(
          changes['isFullScreenModal']?.currentValue
        );
        this.dragModal?._dragRef?.setFreeDragPosition(point);
        this.resized.emit();
      }
    }
  }

  resizeToDefault() {
    const modalContainerEl = this.modalContainer.nativeElement as HTMLElement;
    this.width = this.isCustomMoveable
      ? modalContainerEl.offsetWidth
      : this.widthInPercent > 0
      ? (window.innerWidth * this.widthInPercent) / 100
      : this.DEFAULT_WIDTH;
    this.height = this.isCustomMoveable
      ? window.innerHeight * 0.75
      : window.innerHeight * 0.9;

    if (!this.isCustomMoveable) {
      this.width = Math.max(this.minWidth, this.width);
    }
    this.cdr.markForCheck();
  }

  setDefaultWidth() {
    this.maxHeight = window.innerHeight * 0.9;
    this.minHeight = window.innerHeight * 0.6;
    this.minWidth = this.minWidth || this.DEFAULT_WIDTH;
    this.maxWidth = window.innerWidth * 0.9;
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

  ngAfterViewInit() {
    this.resizeToDefault();
    if (this.appendBody) {
      document.body.appendChild(this.el.nativeElement);
    }
    fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.resizeToDefault();
        const point = this.calculateCenterPosition(this.isFullScreenModal);
        this.dragModal?._dragRef?.setFreeDragPosition(point);
        this.resized.emit();
      });
    const point = this.calculateCenterPosition(this.isFullScreenModal);
    this.dragModal?._dragRef?.setFreeDragPosition(point);
  }

  ngAfterContentInit() {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        const element = this.modalElement?.nativeElement as HTMLElement;
        element?.focus();
      });
    });
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

  onResize(
    { width, height, mouseEvent }: NzResizeEvent,
    resizeDirective: NzResizableDirective
  ): void {
    const mouseEv = mouseEvent as MouseEvent;
    this.ngZone.runOutsideAngular(() => {
      cancelAnimationFrame(this.animationId);
      const direction = resizeDirective['currentHandleEvent']
        .direction as NzResizeDirection;
      if (mouseEv.clientX < 0 || mouseEv.clientY < 0) return;
      if (
        !this.isFullScreenModal &&
        width >= this.maxWidth &&
        height >= this.maxHeight
      ) {
        this.isFullScreenModalChange.emit(true);
      }
      this.animationId = requestAnimationFrame(() => {
        const deltaWidth = width - this.width;
        const deltaHeight = height - this.height;
        if (!deltaWidth && !deltaHeight) {
          return;
        }
        if ((deltaWidth || deltaHeight) && this.isFullScreenModal) {
          this.isFullScreenModalChange.emit(false);
        }
        this.recalculatePosition(direction, deltaWidth, deltaHeight);
        this.width = width;
        this.height = height;
        this.eventResize = { width, height, mouseEvent };
        this.resized.emit(this.eventResize);
      });
    });
  }

  recalculatePosition(direction: NzResizeDirection, deltaWidth, deltaHeight) {
    const { x, y } = this.dragModal.getFreeDragPosition();
    const newX = x - deltaWidth;
    const newY = y - deltaHeight;

    switch (direction) {
      case 'left':
      case 'bottomLeft':
        this.dragModal._dragRef.setFreeDragPosition({
          x: newX,
          y: y
        });
        break;
      case 'top':
      case 'topRight':
        this.dragModal._dragRef.setFreeDragPosition({
          x: x,
          y: newY
        });
        break;
      case 'topLeft':
        this.dragModal._dragRef.setFreeDragPosition({
          x: newX,
          y: newY
        });
        break;
      default:
        break;
    }
  }

  calculateCenterPosition(isFullScreenModal) {
    const currentWidth = isFullScreenModal ? this.maxWidth : this.width;
    const currentHeight = isFullScreenModal ? this.maxHeight : this.height;
    const x = window.innerWidth / 2 - currentWidth / 2;
    const y = window.innerHeight / 2 - currentHeight / 2;
    return { x, y };
  }

  handleOk(): void {
    this.onOk.emit();
  }

  handleCancel(): void {
    this.onCancel.emit();
  }

  handleBack(): void {
    this.onBack.emit();
  }

  handleResizeOrDragStarted() {
    ResizableModalPopupComponent.onResizeOrDragStarted.next();
  }

  private addShakeAnimation() {
    const modalElement = this.el.nativeElement.querySelector('.modal-window');
    if (modalElement) {
      modalElement.classList.add('shake-animation');
      modalElement.addEventListener(
        'animationend',
        () => {
          modalElement.classList.remove('shake-animation');
        },
        { once: true }
      );
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.el.nativeElement?.remove();
  }
}

function normalizeResizeHandleOptions(value: Array<NzResizeDirection>) {
  return value.map((val) => {
    if (typeof val === 'string') {
      return {
        direction: val,
        cursorType: 'window'
      };
    }

    return val;
  });
}
