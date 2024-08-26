import { EAddOnType } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EmergencyContactsGuard {
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
    const isMobileAppEnabled = plan?.features[EAddOnType.MOBILE_APP]?.state;

    if (plan && !isMobileAppEnabled) {
      return this.router.createUrlTree(['/dashboard/agency-settings/team']);
    }

    return true;
  }
}
