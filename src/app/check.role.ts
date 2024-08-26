import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { users } from 'src/environments/environment';
import { ApiService } from './services/api.service';

@Injectable()
export class CheckRole {
  constructor(private router: Router, private apiService: ApiService) {}
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const userInfo = await this.apiService
      .getAPI(users, 'current-user')
      .toPromise();
    if (route.data['roles'].includes(userInfo.type)) {
      return true;
    } else {
      this.router.navigate(['/dashboard']);
      return false;
    }
  }
}
