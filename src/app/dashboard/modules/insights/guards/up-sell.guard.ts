import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { EAgencyPlan } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';

@Injectable()
export class UpSellGuard {
  constructor(
    private agencyDashboardService: AgencyService,
    private router: Router
  ) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.agencyDashboardService.synchronizePlan().pipe(
      map((currentPlan) => {
        this.agencyDashboardService.setCurrentPlan(currentPlan);
        if (
          [EAgencyPlan.ELITE, EAgencyPlan.PRO].includes(currentPlan?.plan) ||
          (EAgencyPlan.CUSTOM === currentPlan?.plan && currentPlan?.insights)
        ) {
          this.router.navigate(['dashboard', 'insights']);
          return false;
        } else {
          return true;
        }
      })
    );
  }
}
