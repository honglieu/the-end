import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppMessageViewGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    // const isAppMessageEnabled =
    //   localStorage.getItem('isAppMessageEnabled') === 'true';

    // if (!isAppMessageEnabled) {
    //   return this.router.navigate(['/dashboard']);
    // }

    // return isAppMessageEnabled;
    return true;
  }
}
