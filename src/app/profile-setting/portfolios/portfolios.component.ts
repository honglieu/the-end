import { Component, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { IPortfoliosGroups } from './interfaces/portfolios.interface';
import { displayName } from '@shared/feature/function.feature';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';

@Component({
  selector: 'portfolios',
  templateUrl: './portfolios.component.html',
  styleUrls: ['./portfolios.component.scss']
})
export class PortfoliosComponent implements OnInit {
  public portfoliosGroups: IPortfoliosGroups[];
  private destroy$ = new Subject<boolean>();
  constructor(private dashboardApiService: DashboardApiService) {}

  ngOnInit(): void {
    this.subscribeListPortfolios();
  }

  private subscribeListPortfolios() {
    this.dashboardApiService
      .getPortfolios()
      .pipe(takeUntil(this.destroy$))
      .subscribe((portfolios) => {
        this.portfoliosGroups = portfolios.map((item) => {
          const newPortfolios = item.portfolios.map((profile) => {
            return {
              ...profile,
              fullName: displayName(profile?.firstName, profile?.lastName)
            };
          });
          return { ...item, portfolios: newPortfolios };
        });
      });
  }

  groupTrackBy(_, group: IPortfoliosGroups) {
    return group.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
