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
export class VoiceMailViewGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const isVoiceMailEnabled =
      localStorage.getItem('isVoiceMailEnabled') === 'true';

    if (!isVoiceMailEnabled) {
      return this.router.navigate(['/dashboard']);
    }

    return isVoiceMailEnabled;
  }
}
