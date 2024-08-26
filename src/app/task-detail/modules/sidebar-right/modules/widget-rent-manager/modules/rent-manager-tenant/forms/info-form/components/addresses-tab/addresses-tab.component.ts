import {
  Component,
  ContentChildren,
  ElementRef,
  NgZone,
  OnInit,
  QueryList,
  ViewChild
} from '@angular/core';
import { TenantTabPanelDirective } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/tenant-tab-group/tenant-tab-group.component';

@Component({
  selector: 'addresses-tab',
  templateUrl: './addresses-tab.component.html',
  styleUrls: ['./addresses-tab.component.scss']
})
export class AddressesTabComponent implements OnInit {
  @ContentChildren(TenantTabPanelDirective)
  tabPanels: QueryList<TenantTabPanelDirective>;
  @ViewChild('leftArrowContainer', { static: false })
  leftArrowContainer: ElementRef<HTMLDivElement>;
  @ViewChild('rightArrowContainer', { static: false })
  rightArrowContainer: ElementRef<HTMLDivElement>;
  @ViewChild('tabsList', { static: false })
  tabsList: ElementRef<HTMLDivElement>;
  private rightArrow: HTMLElement;
  private leftArrow: HTMLElement;
  private observerMutation: MutationObserver;
  private dragging = false;
  private observerResize: ResizeObserver;
  public currentTabIndex = 0;
  public isValid = true;
  private timeout1: NodeJS.Timeout = null;

  constructor(private _ngZone: NgZone) {}

  ngOnInit(): void {}

  ngAfterContentChecked(): void {
    this._handleVisibleContent();
  }

  setCurrentTabIndex(event: MouseEvent, index: number) {
    event.stopPropagation();
    this.currentTabIndex = index;
    this._handleVisibleContent();
  }

  private _handleVisibleContent() {
    this.tabPanels.forEach((tab, index) => {
      tab.setFocus(index == this.currentTabIndex);
    });
  }

  handleSlideRendered() {
    this.timeout1 && clearTimeout(this.timeout1);
    this.timeout1 = setTimeout(() => {
      this.initializeTabs();
    }, 100);
  }

  // start handle slide component by thanh.le
  initializeTabs(): void {
    try {
      if (!this.leftArrowContainer) return;
      this.rightArrow =
        this.rightArrowContainer?.nativeElement.querySelector(
          '.right-arrow .icon'
        );
      this.leftArrow =
        this.leftArrowContainer?.nativeElement.querySelector(
          '.left-arrow .icon'
        );
      this.rightArrow?.addEventListener('click', this.scrollRight);
      this.leftArrow?.addEventListener('click', this.scrollLeft);
      this.tabsList.nativeElement.addEventListener('scroll', this.manageIcons);
      this.tabsList.nativeElement.addEventListener(
        'mousedown',
        this.startDragging
      );
      this._ngZone.runOutsideAngular(() => {
        this.tabsList.nativeElement.addEventListener('mousemove', this.drag);
        document.addEventListener('mouseup', this.stopDragging);
      });
      this.observerMutation = new MutationObserver(this.updateScrollValues);
      this.observerResize = new ResizeObserver(this.updateScrollValues);
      this.observerMutation.observe(this.tabsList.nativeElement, {
        attributes: true,
        childList: true,
        subtree: true
      });
      this.observerResize.observe(this.tabsList.nativeElement);
    } catch (error) {
      console.error(error);
    }
  }

  scrollRight = () => {
    this.tabsList.nativeElement.scrollLeft += 170;

    this.manageIcons();
  };

  scrollLeft = () => {
    this.tabsList.nativeElement.scrollLeft -= 170;
    this.manageIcons();
  };
  manageIcons = () => {
    if (this.tabsList.nativeElement.scrollLeft >= 20) {
      this.leftArrowContainer.nativeElement.classList.add('active');
    } else {
      this.leftArrowContainer.nativeElement.classList.remove('active');
    }

    let maxScrollValue =
      this.tabsList.nativeElement.scrollWidth -
      this.tabsList.nativeElement.clientWidth -
      20;
    if (this.tabsList.nativeElement.scrollLeft >= maxScrollValue) {
      this.rightArrowContainer.nativeElement.classList.remove('active');
    } else {
      this.rightArrowContainer.nativeElement.classList.add('active');
    }
  };

  startDragging = () => {
    this.dragging = true;
  };

  drag = (e) => {
    if (!this.dragging) return;
    this.tabsList.nativeElement.classList.add('dragging');
    this.tabsList.nativeElement.scrollLeft -= e.movementX;
  };

  stopDragging = () => {
    this.dragging = false;
    this.tabsList.nativeElement.classList.remove('dragging');
  };

  updateScrollValues = () => {
    this.manageIcons();
  };

  removeEventListenerTab() {
    if (!this.rightArrow) return;
    this.rightArrow.removeEventListener('click', this.scrollRight);
    this.leftArrow.removeEventListener('click', this.scrollLeft);
    this.tabsList.nativeElement.removeEventListener('scroll', this.manageIcons);
    this.tabsList.nativeElement.removeEventListener(
      'mousedown',
      this.startDragging
    );
    this.tabsList.nativeElement.removeEventListener('mousemove', this.drag);
    document.removeEventListener('mouseup', this.stopDragging);
    this.observerMutation.disconnect();
    this.observerResize.disconnect();
  }
  ngOnDestroy() {
    clearTimeout(this.timeout1);
    this.removeEventListenerTab();
  }
}
