import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RedirectToInboxDetailGuard {
  constructor(private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const taskId = route.params['taskId'];
    if (!taskId) return this.router.navigate(['/']);
    return this.router.navigate(['/dashboard', 'inbox', 'detail', taskId], {
      queryParams: {
        ...route.queryParams
      }
    });
  }
}
