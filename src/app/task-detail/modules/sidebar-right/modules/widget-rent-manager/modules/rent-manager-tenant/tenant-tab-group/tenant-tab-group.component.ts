import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  HostBinding,
  Input,
  NgZone,
  OnDestroy,
  QueryList,
  ViewChild
} from '@angular/core';
import { BehaviorSubject, Subject, switchMap, takeUntil } from 'rxjs';

@Directive({
  selector: '[tabPanel]'
})
export class TenantTabPanelDirective implements AfterViewInit, OnDestroy {
  @Input() tabTitle: string;
  @Input() isError = false;
  @HostBinding('style.display') _display: string = 'none';

  private _destroy$ = new Subject<void>();

  private _focus$ = new BehaviorSubject<boolean>(false);

  constructor(private _ngZone: NgZone) {}

  public setFocus(value: boolean) {
    this._focus$.next(value);
  }

  ngAfterViewInit(): void {
    this._ngZone.onStable
      .pipe(switchMap(() => this._focus$.asObservable()))
      .pipe(takeUntil(this._destroy$))
      .subscribe((value) => {
        if (value) {
          this._display = 'block';
        } else {
          this._display = 'none';
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}

@Component({
  selector: 'tenant-tab-group',
  templateUrl: './tenant-tab-group.component.html',
  styleUrls: ['./tenant-tab-group.component.scss']
})
export class TenantTabGroupComponent implements AfterContentInit {
  @ContentChildren(TenantTabPanelDirective)
  tabPanels: QueryList<TenantTabPanelDirective>;

  @ViewChild('tabContent') contentTemplate: ElementRef<Element>;

  public currentTabIndex = 0;
  public indexDepositTab = 3;
  public isValid = true;

  constructor() {}

  ngAfterContentInit(): void {
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
}
