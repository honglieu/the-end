import { Component, OnDestroy, OnInit } from '@angular/core';
import { takeUntil, Subject, filter } from 'rxjs';
import { PortfolioService } from '@/app/dashboard/services/portfolio.service';
import { Portfolio } from '@shared/types/user.interface';
import { CalendarFilterService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-filter/services/calendar-filter.service';
import { CalendarToolbarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendarToolbar.service';
import { isEqual } from 'lodash-es';
import { CompanyService } from '@services/company.service';
import { Agency } from '@shared/types/agency.interface';
import { sortAgenciesFn } from '@shared/utils/helper-functions';
import { SharedService } from '@services/shared.service';
import { EMenuDropdownType } from '@shared/directives/menuKeyboard.directive';

@Component({
  selector: 'calendar-filter-group',
  templateUrl: './calendar-filter-group.component.html',
  styleUrls: ['./calendar-filter-group.component.scss']
})
export class CalendarFilterGroupComponent implements OnInit, OnDestroy {
  public sortedPortfolios: Portfolio[] = [];
  public selectedPortfolios: string[] = [];
  public portfolios: Portfolio[] = [];
  public titleGroupTask: string[] = [];
  public isConsole = false;
  private destroy$ = new Subject<void>();
  public selectedAgencyIds: string[] = [];
  public agencies: Agency[] = [];
  public filteredAgencies: Agency[] = [];
  private isFocusView: boolean;

  public visibleDropdown: boolean = false;

  public EMenuDropdownType = EMenuDropdownType;
  constructor(
    private calendarFilterService: CalendarFilterService,
    private calendarToolbarService: CalendarToolbarService,
    private portfolioService: PortfolioService,
    private companyService: CompanyService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.calendarFilterService.focusView$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => this.isFocusView !== res)
      )
      .subscribe((res) => {
        this.isFocusView = res;
        this.mapPortfolios();
      });
    this.initPortfolioList();
    this.initAgenciesList();
  }

  initPortfolioList() {
    this.portfolioService
      .getPortfolios$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((portfolios) => {
        if (portfolios) {
          this.titleGroupTask = [];
          this.portfolios = portfolios
            .map((group) => {
              this.titleGroupTask.push(group.name);
              return group.portfolios.map((portfolio) => ({
                ...portfolio,
                agencyId: group.id,
                agencyName: group.name
              }));
            })
            .flat();
          this.mapPortfolios();
        }
      });

    this.calendarFilterService.portfolioValue$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => !isEqual(this.selectedPortfolios, res || []))
      )
      .subscribe((value) => {
        this.selectedPortfolios = value || [];
      });
  }

  private initAgenciesList() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.agencies = company?.agencies ?? [];
        if (this.agencies.length > 1) {
          this.agencies.sort(sortAgenciesFn);
          this.filterAgencies();
        }
      });
    this.calendarFilterService.agenciesValue$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => !isEqual(this.selectedAgencyIds, res || []))
      )
      .subscribe((res) => {
        this.selectedAgencyIds = res || [];
      });
  }

  public onPortfolioVisibleChange(isVisible: boolean) {
    if (!isVisible) {
      this.calendarFilterService.setPortfolioValue(this.selectedPortfolios);
      this.calendarToolbarService.setEventSelectedList([]);
      this.calendarFilterService.setEventId(null);
    }
  }

  public onSubscriptionVisibleChange(isVisible: boolean) {
    if (!isVisible) {
      this.calendarFilterService.setAgenciesValue(this.selectedAgencyIds);
      this.calendarToolbarService.setEventSelectedList([]);
      this.calendarFilterService.setEventId(null);
    }
  }

  private mapPortfolios() {
    this.sortedPortfolios = this.portfolios
      .filter((p) => p?.isFollowed || !this.isFocusView)
      .map((item) => ({
        ...item,
        label: `${item.firstName || ''} ${item.lastName || ''}`.trim()
      }));
    this.titleGroupTask = [
      ...new Set(this.sortedPortfolios.map((e) => e.agencyName).filter(Boolean))
    ];
    this.filterAgencies();
  }

  private filterAgencies() {
    if (this.isFocusView) {
      const agencyIds = this.sortedPortfolios.map((e) => e?.agencyId);
      this.filteredAgencies = this.agencies.filter((a) =>
        agencyIds.includes(a?.id)
      );
    } else this.filteredAgencies = this.agencies;
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  public onDropdownMenuVisibleChange(event: boolean): void {
    this.visibleDropdown = event;

    this.onPortfolioVisibleChange(this.visibleDropdown);
    this.onSubscriptionVisibleChange(this.visibleDropdown);
  }
}
