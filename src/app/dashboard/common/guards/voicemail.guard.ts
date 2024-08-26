import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '@services/user.service';

@Injectable({
  providedIn: 'root'
})
export class CanActivateVoicemail {
  constructor(private router: Router, private userService: UserService) {}

  canActivate(
    route: ActivatedRouteSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const isVoicemailEnabled = localStorage.getItem('isVoicemailEnabled');

    if (isVoicemailEnabled === 'true') {
      return true;
    }

    return this.router.navigate(['/dashboard', 'agency-settings']);
  }
}
