import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'toolbar-wrapper',
  templateUrl: './toolbar-wrapper.component.html',
  styleUrl: './toolbar-wrapper.component.scss'
})
export class ToolbarWrapperComponent implements OnInit, OnDestroy {
  @Input() isShowSendActionTpl: boolean = true;
  @ViewChild('toolbarItems', { static: false })
  toolbarItems: ElementRef<HTMLDivElement>;
  @ViewChild('toolbar', { static: false })
  toolbar: ElementRef<HTMLDivElement>;
  private observer: ResizeObserver = null;

  public currentDirectionScrollToolbar: 'left' | 'right' = 'left';
  public isShowBtnScrollToolbar = false;
  private scrollX = 300;

  constructor(protected cdr: ChangeDetectorRef, private element: ElementRef) {}
  ngOnInit(): void {
    this.observer = new ResizeObserver((entries) => {
      this.checkIsShowScrollToolbarBtn();
    });
    this.observer.observe(this.element.nativeElement);
  }

  handleActionScrollToolbar(
    direction: 'left' | 'right',
    behavior: ScrollBehavior = 'smooth'
  ) {
    this.toolbarItems.nativeElement.scrollTo({
      left: direction === 'left' ? -this.scrollX : this.scrollX,
      behavior
    });
    this.currentDirectionScrollToolbar = direction;
  }
  checkIsShowScrollToolbarBtn() {
    const toolbar = this.toolbarItems?.nativeElement;
    const space = this.isShowBtnScrollToolbar ? 12 : 0;
    this.isShowBtnScrollToolbar =
      toolbar.scrollWidth > toolbar.offsetWidth + space;
    if (this.isShowBtnScrollToolbar) {
      this.handleActionScrollToolbar('left', 'auto');
    }
    // this.scrollX = toolbar.scrollWidth - toolbar.offsetWidth;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.observer?.unobserve(this.element.nativeElement);
  }
}
