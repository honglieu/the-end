import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { Observable, filter } from 'rxjs';
import { CompanyService } from '@services/company.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardGuard {
  constructor(private router: Router, private companyService: CompanyService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const urlSplitArray = state.url.split('/');
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    const hasCompanyId = uuidRegex.test(urlSplitArray[2]);
    const oldCompanyId = localStorage.getItem('companyId');
    const newCompanyId = urlSplitArray[2];

    if (
      urlSplitArray.length >= 3 &&
      uuidRegex.test(newCompanyId) &&
      hasCompanyId &&
      oldCompanyId !== newCompanyId
    ) {
      this.companyService
        .getCompanies()
        .pipe(filter(Boolean))
        .subscribe((companies) => {
          const existCompanyId =
            companies.findIndex((company) => company.id === newCompanyId) !==
            -1;
          if (!existCompanyId) return;
          this.companyService.setCurrentCompanyId(newCompanyId);
          localStorage.setItem('companyId', newCompanyId);
        });
    }

    if (hasCompanyId) {
      urlSplitArray.splice(2, 1);
      // delete route.queryParams['companyId'];
      const url = urlSplitArray.join('/');
      this.router.navigateByUrl(url);
      return false;
    }
    return true;
  }
}
