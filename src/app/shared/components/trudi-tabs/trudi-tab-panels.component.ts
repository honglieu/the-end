import {
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  NgZone,
  OnInit,
  Output,
  QueryList,
  ViewChild
} from '@angular/core';
import { TenantTabPanelDirective } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/tenant-tab-group/tenant-tab-group.component';

@Component({
  selector: 'trudi-tab-panels',
  templateUrl: './trudi-tab-panels.component.html',
  styleUrls: ['./trudi-tab-panels.component.scss']
})
export class TrudiTabsComponent implements OnInit {
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
  @Output() changeCurrentTabIndex = new EventEmitter<{}>();

  constructor(private _ngZone: NgZone) {}

  ngOnInit(): void {}

  ngAfterContentChecked(): void {
    this._handleVisibleContent();
  }

  setCurrentTabIndex(event: MouseEvent, index: number, tab) {
    event.stopPropagation();
    this.currentTabIndex = index;
    this._handleVisibleContent();
    this.changeCurrentTabIndex.emit(index);
  }

  private _handleVisibleContent() {
    this.tabPanels.forEach((tab, index) => {
      tab.setFocus(index == this.currentTabIndex);
    });
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
