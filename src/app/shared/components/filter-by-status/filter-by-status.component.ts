import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subject, combineLatest, takeUntil, take } from 'rxjs';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EInboxFilterSelected } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { EMenuDropdownType } from '@shared/directives/menuKeyboard.directive';
import { EPlacement } from '@shared/types';

const NOTE_ZONE_TRANSITION = '.25s';

@Component({
  selector: 'filter-by-status',
  templateUrl: './filter-by-status.component.html',
  styleUrls: ['./filter-by-status.component.scss'],
  animations: [
    trigger('toTopFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 1, transform: 'translateY(8px)' })
        )
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(8px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 0, transform: 'translateY(-10px)' })
        )
      ])
    ]),
    trigger('collapse', [
      transition(':enter', [
        style({ height: '0' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '108px' }))
      ]),
      transition(':leave', [
        style({ height: '108px' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '0' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.25s', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.25s', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterByStatusComponent implements OnInit, OnDestroy {
  @Input() disabled: boolean = false;
  @Input() set popoverPlacement(value: 'bottomRight' | 'leftTop') {
    this.placement = value;
  }

  public assignBoxPlacement = EPlacement.BOTTOM_LEFT;
  public selectedAgency = [];
  public visibleDropdown: boolean = false;
  public placement: 'bottomRight' | 'leftTop' = 'bottomRight';
  private unsubscribe = new Subject<void>();
  public EMenuDropdownType = EMenuDropdownType;

  constructor(
    public inboxFilterService: InboxFilterService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.preFillWhenReload();
    this.inboxFilterService.selectedStatus$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((selectedStatus) => {
        const isTaskType = this.router.url.includes('tasks');
        if (isTaskType) return;
        this.inboxFilterService.patchValueSelectedItem(
          'messageStatus',
          selectedStatus.length
        );
      });
  }

  private preFillWhenReload() {
    combineLatest([
      this.inboxFilterService.selectedStatus$,
      this.activatedRoute.queryParams
    ])
      .pipe(takeUntil(this.unsubscribe), take(1))
      .subscribe(([selectedStatus, queryParams]) => {
        const messageStatus =
          queryParams?.[EInboxFilterSelected.MESSAGE_STATUS];
        if (!selectedStatus.length && messageStatus) {
          this.inboxFilterService.setSelectedStatus(messageStatus);
        }
      });
  }

  onDropdownMenuVisibleChange(event) {
    this.visibleDropdown = event;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
