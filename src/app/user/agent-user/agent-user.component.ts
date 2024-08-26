import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';

@Component({
  selector: 'app-agent-user',
  templateUrl: './agent-user.component.html',
  styleUrls: ['./agent-user.component.scss']
})
@DestroyDecorator
export class AgentUserComponent implements OnInit, OnDestroy {
  public isShowPtOrRm: boolean;
  public unSubcribe$ = new Subject<void>();
  constructor(
    private agencyDashboardService: AgencyDashboardService,
    private companyService: CompanyService
  ) {}
  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unSubcribe$))
      .subscribe((res) => {
        if (this.agencyDashboardService.isRentManagerCRM(res)) {
          this.isShowPtOrRm = false;
        } else {
          this.isShowPtOrRm = true;
        }
      });
  }
  ngOnDestroy(): void {
    this.unSubcribe$.next();
    this.unSubcribe$.complete();
  }
}
