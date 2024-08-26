import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { catchError, lastValueFrom, of } from 'rxjs';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { UserService } from '@services/user.service';
import { CompanyService } from '@services/company.service';
@Injectable({
  providedIn: 'root'
})
export class RoleGuardCanActive {
  constructor(
    private agencyDashboardService: AgencyDashboardService,
    private dashboardApiService: DashboardApiService,
    private userService: UserService,
    private router: Router,
    private companyService: CompanyService
  ) {}
  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const companyId = localStorage.getItem('companyId');
    const userId = this.userService.userInfo$.value.id;

    let companies = this.companyService.getCompaniesValue();
    if (!companies.length) {
      companies = await lastValueFrom(
        this.dashboardApiService
          .getUserAgencies(userId)
          .pipe(catchError(() => of([])))
      );
    }

    const company = companies.find((company) => company.id === companyId);
    const isSelectedAgencyFromRM =
      this.agencyDashboardService.isRentManagerCRM(company);
    if (!isSelectedAgencyFromRM) {
      this.router.navigate([`/dashboard/contacts/tenants-landlords`]);
    }

    return isSelectedAgencyFromRM;
  }
}
