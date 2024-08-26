import {
  CdkVirtualScrollViewport,
  ScrollDispatcher
} from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { Params } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { collapseMotion } from '@core';

@Component({
  selector: 'virtual-reminder-list-viewport',
  templateUrl: './virtual-reminder-list-viewport.component.html',
  styleUrls: ['./virtual-reminder-list-viewport.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [collapseMotion]
})
export class VirtualReminderListViewportComponent
  implements AfterViewInit, OnDestroy
{
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
  @Input() reminderList = [];
  @Input() isLoading: boolean = false;
  @Input() sendMsgModalConfig;
  @Input() queryParam: Params;
  @Input() isIgnore: boolean;
  @Input() rawMsg: string;
  @Output() handleAssignAgents = new EventEmitter();
  @Output() changePage: EventEmitter<number> = new EventEmitter();
  private destroy$ = new Subject<void>();
  private currentPage: number = 0;

  constructor(
    private scrollDispatcher: ScrollDispatcher,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.scrollDispatcher
        .scrolled()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (
            this.viewport.measureScrollOffset('bottom') === 0 &&
            !this.isLoading
          ) {
            this.changePage.emit(++this.currentPage);
          }
          // if (this.viewport.measureScrollOffset('top') === 0) {
          //   // handle load more data when scroll start top
          // }
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
