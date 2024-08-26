import { EAddOnType } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { catchError, map, Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SMSNumberGuard {
  constructor(private router: Router, private agencyService: AgencyService) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.agencyService.currentPlan$.pipe(
      switchMap((plan) => {
        if (plan) {
          return of(this.checkPlan(plan));
        } else {
          return this.agencyService.synchronizePlan().pipe(
            map((fetchedPlan) => this.checkPlan(fetchedPlan)),
            catchError(() =>
              of(this.router.createUrlTree(['/dashboard/agency-settings/team']))
            )
          );
        }
      })
    );
  }

  private checkPlan(plan: ConfigPlan): boolean | UrlTree {
    const isSMSFeatureEnabled = plan?.features[EAddOnType.SMS]?.state;

    if (plan && !isSMSFeatureEnabled) {
      return this.router.createUrlTree(['/dashboard/agency-settings/team']);
    }

    return true;
  }
}
