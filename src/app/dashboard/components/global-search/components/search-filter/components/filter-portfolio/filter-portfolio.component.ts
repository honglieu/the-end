import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, filter, takeUntil, tap } from 'rxjs';
import { PortfolioService } from '@/app/dashboard/services/portfolio.service';
import { Portfolio } from '@shared/types/user.interface';
import { GlobalSearchService } from '@/app/dashboard/components/global-search/services/global-search.service';
import { isEqual } from 'lodash-es';
import { TrudiSelectDropdownV2Component } from '@trudi-ui';
@Component({
  selector: 'filter-portfolio',
  templateUrl: './filter-portfolio.component.html',
  styleUrls: ['./filter-portfolio.component.scss']
})
export class FilterPortfolioComponent implements OnInit, OnDestroy {
  @ViewChild('dropdown') selectDropdown: TrudiSelectDropdownV2Component;
  public portfolios: Portfolio[] = [];
  private unsubscribe = new Subject<void>();
  public selectedList: string[] = [];

  constructor(
    private portfolioService: PortfolioService,
    private globalSearchService: GlobalSearchService
  ) {}

  ngOnInit(): void {
    this.initPortfolioList();
    this.globalSearchService.globalSearchPayload$
      .pipe(
        takeUntil(this.unsubscribe),
        tap((payload) => {
          if (!payload?.search && this.selectDropdown) {
            this.selectDropdown.handleVisibleChange(false);
          }
        }),
        filter(
          (payload) => !isEqual(payload.propertyManagerIds, this.selectedList)
        )
      )
      .subscribe((payload) => {
        this.selectedList = payload.propertyManagerIds;
      });
  }

  initPortfolioList() {
    this.portfolioService
      .getPortfolios$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((portfolios) => {
        if (portfolios) {
          this.portfolios = portfolios
            .map((group) => {
              return group.portfolios.map((portfolio) => ({
                ...portfolio,
                agencyId: group.id,
                agencyName: group.name,
                label: `${portfolio.firstName || ''} ${
                  portfolio.lastName || ''
                }`.trim()
              }));
            })
            .flat();
        }
      });
  }

  handleChangeSelectedList(value) {
    this.globalSearchService.setGlobalSearchPayload({
      propertyManagerIds: value
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
