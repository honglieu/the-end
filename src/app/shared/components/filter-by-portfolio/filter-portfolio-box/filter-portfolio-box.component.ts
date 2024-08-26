import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InboxFilterLoadingService } from '@/app/dashboard/modules/inbox/services/inbox-filter-loading.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { PortfolioService } from '@/app/dashboard/services/portfolio.service';
import { IPortfoliosGroups } from '@/app/profile-setting/portfolios/interfaces/portfolios.interface';
import { Portfolio } from '@shared/types/user.interface';

export const LAZY_LOAD_PORTFOLIO = 20;
@Component({
  selector: 'filter-portfolio-box',
  templateUrl: './filter-portfolio-box.component.html',
  styleUrls: ['./filter-portfolio-box.component.scss']
})
export class FilterPortfolioBoxComponent implements OnInit, OnDestroy {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;
  @Input() onTop?: boolean = true;
  @Input() left?: boolean = true;
  @Input() countSelected: number = 0;
  @Input() isDisable: boolean = false;
  public filterList: IPortfoliosGroups[] = [];
  private unsubscribe = new Subject<void>();
  public searchValue: string = '';
  public searchList: IPortfoliosGroups[] = [];
  public selectedList: string[] = [];
  public pageIndex = 1;
  public isLoadingList = false;
  public isScrolledToBottom = false;
  public totalPage = 0;
  public totalItem = 0;
  private totalAgencies: number = 0;
  public totalOriginalItems: number = 0;

  constructor(
    private readonly elr: ElementRef,
    private inboxFilterService: InboxFilterService,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private portfolioService: PortfolioService,
    private inboxFilterLoading: InboxFilterLoadingService
  ) {}

  ngOnInit(): void {
    if (!this.onTop) {
      this.elr.nativeElement.style.top = 'unset';
      this.elr.nativeElement.style.bottom = '-100%';
    }
    if (this.left) {
      this.elr.nativeElement.style.left = 'unset';
      this.elr.nativeElement.style.right = '100%';
    }
    this.isLoadingList = true;
    this.getSelectedPortfolioId();
    this.getSearchList();
    this.searchList = this.filterList.map((agency) => ({
      ...agency,
      portfolios: agency.portfolios.sort((x, y) => {
        return x.selected ? -1 : y.selected ? 1 : 0;
      })
    }));
  }

  getStyle() {
    return {
      height:
        this.totalItem < 8
          ? `${this.totalItem * 44 + this.totalAgencies * 32}px`
          : '324px'
    };
  }

  getSelectedPortfolioId() {
    this.inboxFilterLoading.onMultiLoading();
    this.inboxFilterService
      .getSelectedPortfolio()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res.length) {
          this.selectedList = res;
        } else {
          this.selectedList = [];
        }
        this.inboxFilterLoading.offMultiLoading();
      });
  }

  search() {
    if (this.searchValue) {
      this.searchList = this.filterList
        .map((agency) => {
          let filterPortfolios: Portfolio[] = agency.portfolios.filter(
            (portfolio) =>
              portfolio.label
                ?.toLowerCase()
                ?.includes(this.searchValue?.toLowerCase().trim())
          );
          if (filterPortfolios.length) {
            return {
              ...agency,
              portfolios: filterPortfolios
            };
          }
          return null;
        })
        .filter(Boolean);
    } else {
      this.searchList = [...this.filterList];
    }
    this.totalItem = this.searchList
      .map((agency) => agency.portfolios)
      .flat().length;
    this.totalAgencies = this.searchList.length;
  }

  onClearSelection() {
    this.searchList.forEach((agency) => {
      agency.portfolios.forEach((portfolio) => {
        portfolio.selected = false;
      });
    });
    this.selectedList = [];
    this.filterListMessage([]);
    this.filterList.forEach((agency) => {
      agency.portfolios.forEach((portfolio) => {
        portfolio.selected = false;
      });
    });
  }

  getSearchList() {
    this.portfolioService
      .getPortfolios$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((agencies) => {
        if (agencies) {
          this.filterList = agencies
            .map((agency) => {
              let filterPortfolios = agency.portfolios
                .filter((portfolio) => portfolio.isFollowed || !this.isDisable)
                .map((portfolio) => ({
                  ...portfolio,
                  label: `${portfolio.firstName} ${
                    portfolio.lastName || ''
                  }`.trim(),
                  selected: this.selectedList.includes(portfolio.agencyAgentId)
                }));
              if (filterPortfolios.length) {
                return {
                  ...agency,
                  portfolios: filterPortfolios
                };
              }
              return null;
            })
            .filter(Boolean);
          this.totalOriginalItems = this.filterList
            .map((agency) => agency.portfolios)
            .flat().length;
          this.totalItem = this.totalOriginalItems;
          this.totalAgencies = this.filterList.length;
          this.isLoadingList = false;
          this.isScrolledToBottom = false;
          this.cdRef.markForCheck();
        } else {
          this.filterList = [];
        }
      });
  }

  handleCheckbox(agencyId: string, agencyAgentId: string) {
    const agencyIndex: number = this.searchList.findIndex(
      (agency) => agency.id === agencyId
    );
    const portfolioIndex: number = this.searchList[
      agencyIndex
    ]?.portfolios.findIndex(
      (portfolio) => portfolio.agencyAgentId === agencyAgentId
    );
    if (agencyIndex !== -1 && portfolioIndex !== -1) {
      const portfolio = this.searchList[agencyIndex].portfolios[portfolioIndex];
      const checked = !portfolio.selected;
      portfolio.selected = checked;
      this.selectedList = checked
        ? [...this.selectedList, agencyAgentId]
        : this.selectedList.filter((id) => id !== agencyAgentId);
      if (!checked) {
        const filterPortfolio = this.filterList
          .find((agency) => agency.id === agencyId)
          ?.portfolios.find(
            (portfolio) => portfolio.agencyAgentId === agencyAgentId
          );
        if (filterPortfolio) {
          filterPortfolio.selected = false;
        }
      }
      this.filterListMessage(this.selectedList);
    }
  }

  filterListMessage(listIdAssignee: string[]) {
    this.inboxFilterService.setSelectedPortfolio(listIdAssignee);
    this.router.navigate([], {
      queryParams: { propertyManagerId: listIdAssignee, taskId: null },
      queryParamsHandling: 'merge'
    });
  }

  onClearSearch() {
    this.searchList = [...this.filterList];
    this.searchValue = '';
    this.totalItem = this.searchList
      .map((agency) => agency.portfolios)
      .flat().length;
    this.totalAgencies = this.searchList.length;
  }

  onScroll() {
    const element = this.viewport?.elementRef.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (
      distanceFromBottom <= LAZY_LOAD_PORTFOLIO &&
      !this.isScrolledToBottom &&
      this.pageIndex < this.totalPage
    ) {
      this.isScrolledToBottom = true;
      this.pageIndex = this.pageIndex + 1;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
