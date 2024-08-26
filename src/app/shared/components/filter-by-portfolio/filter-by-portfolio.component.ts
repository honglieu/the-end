import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subject, map, switchMap, takeUntil } from 'rxjs';
import { TaskService } from '@services/task.service';
import { SharedService } from '@services/shared.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { PortfolioService } from '@/app/dashboard/services/portfolio.service';
import { EMenuDropdownType } from '@shared/directives/menuKeyboard.directive';
import { EPlacement } from '@shared/types';

const NOTE_ZONE_TRANSITION = '.25s';

export function getFilterItem(list, selectedList?, searchText?: string) {
  return list?.map((item) => ({
    ...item,
    label: `${item.firstName} ${item.lastName || ''}`.trim(),
    selected: selectedList?.includes(item.id) ? true : false
  }));
}

@Component({
  selector: 'filter-by-portfolio',
  templateUrl: './filter-by-portfolio.component.html',
  styleUrls: ['./filter-by-portfolio.component.scss'],
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
export class FilterByPortfolioComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() disabled: boolean = false;
  @Input() set popoverPlacement(value: 'bottomRight' | 'leftTop') {
    this.placement = value;
  }

  public portfolioList = [];
  public placement: 'bottomRight' | 'leftTop' = 'bottomRight';
  private unsubscribe = new Subject<void>();
  public assignBoxPlacement = EPlacement.BOTTOM_LEFT;
  public selectedAgency = [];
  public selectedPortfolio = [];
  public visibleDropdown: boolean = false;
  public EMenuDropdownType = EMenuDropdownType;

  constructor(
    public taskService: TaskService,
    public sharedService: SharedService,
    private inboxFilterService: InboxFilterService,
    private portfolioService: PortfolioService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getPortfolioList();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] && !changes['disabled'].firstChange) {
      this.getPortfolioList();
    }
  }

  onDropdownMenuVisibleChange(event) {
    this.visibleDropdown = event;
  }

  getPortfolioList() {
    this.inboxFilterService
      .getSelectedPortfolio()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((selectedPortfolios) =>
          this.portfolioService.getPortfolios$().pipe(
            map((portfolios) => {
              const listPortfolio = portfolios
                .map((group) => group.portfolios)
                .flat();
              return {
                portfolios: listPortfolio?.filter(
                  (r) => r.isFollowed || !this.disabled
                ),
                selectedList: selectedPortfolios || []
              };
            })
          )
        )
      )
      .subscribe(({ portfolios, selectedList }) => {
        this.selectedPortfolio = portfolios.filter((item) =>
          selectedList.includes(item.agencyAgentId)
        );
        this.inboxFilterService.patchValueSelectedItem(
          'portfolio',
          this.selectedPortfolio.length
        );
        this.cdRef.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
