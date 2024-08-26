import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  TemplateRef
} from '@angular/core';
import { BehaviorSubject, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { groupListItemsByDatePeriod } from '@shared/utils/helper-functions';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AutoScrollService } from '@/app/dashboard/modules/inbox/services/auto-scroll.service';

@Component({
  selector: 'app-message-groups',
  templateUrl: './message-groups.component.html',
  styleUrls: ['./message-groups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageGroupsComponent<T>
  implements OnDestroy, OnChanges, AfterViewInit
{
  private onDestroy = new Subject<void>();
  @Input() set items(value) {
    this._items$.next(value);
  }
  @Input() set totalItems(value) {
    this._totalItems$.next(value);
  }
  @Input() groupType;
  @Input() groupField: keyof T;
  @Input() listItemsTemplate: TemplateRef<unknown>;
  public collapseGroupIds: Record<string, boolean> = {};
  private readonly _items$ = new BehaviorSubject<T[]>([]);
  private readonly _totalItems$ = new BehaviorSubject<number>(0);

  public readonly groupData$ = combineLatest({
    items: this._items$,
    totalItems: this._totalItems$,
    timezone: this.agencyDateFormatService.timezone$
  }).pipe(
    takeUntil(this.onDestroy),
    map(({ items, totalItems, timezone }) => {
      const groups = groupListItemsByDatePeriod<T>(
        items,
        this.groupField,
        totalItems,
        timezone.value
      );
      return {
        currentCount: items.length,
        groups,
        totalItems
      };
    })
  );
  public readonly rendered = new Subject<T>();

  constructor(
    private agencyDateFormatService: AgencyDateFormatService,
    private readonly elementRef: ElementRef,
    private readonly autoScrollService: AutoScrollService
  ) {}

  ngAfterViewInit() {
    // render callack auto scroll when reloading, back navigate from outside page
    this.autoScrollService
      .initializeAutoScroll(this.rendered, this.elementRef)
      .subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groupType'] && changes['groupType'].currentValue) {
      this.collapseGroupIds = {};
    }
  }

  toggleIsExpandedGroup(id: number, allowCollapse: boolean) {
    if (allowCollapse) {
      this.collapseGroupIds[id] = !this.collapseGroupIds[id];
    }
  }
  trackByMessageGroup(_: number, group) {
    return group?.groupName;
  }
  ngOnDestroy(): void {
    this.autoScrollService.destroy();
    this.onDestroy.next();
    this.onDestroy.complete();
  }
}
