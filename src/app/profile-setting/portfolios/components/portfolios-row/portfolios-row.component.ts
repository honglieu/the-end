import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AuthService } from '@services/auth.service';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { Portfolio } from '@shared/types/user.interface';

@Component({
  selector: 'portfolios-row',
  templateUrl: './portfolios-row.component.html',
  styleUrls: ['./portfolios-row.component.scss']
})
export class PortfoliosRowComponent implements OnInit {
  @Input() portfolios: Portfolio;
  @Input() agencyId: string;
  public togglePortfolios: boolean = false;
  public portfoliosForm: FormGroup;
  private destroy$ = new Subject<boolean>();
  constructor(
    private authService: AuthService,
    private dashboardApiService: DashboardApiService
  ) {}

  ngOnInit() {}

  public handleUpdatePortfolios(isActive: boolean, id: string) {
    this.authService
      .updatePortfolios([id], this.agencyId, isActive)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.dashboardApiService.getPortfolios())
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
