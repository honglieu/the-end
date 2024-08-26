import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { Auth0Service } from './services/auth0.service';
import queryString from 'query-string';

const LOGIN_URL = '/';

@Injectable()
export class CheckLogin {
  constructor(private router: Router, private auth0Service: Auth0Service) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    if (route.fragment && route.fragment.includes('id_token')) {
      return false;
    }
    const token = route.queryParams?.['token'];
    const sso = route.queryParams?.['sso'];
    const portalDesktopProtocol = route.queryParams?.['portalDesktopProtocol'];
    if (token) {
      return true;
    } else if (this.auth0Service.getAccessToken()) {
      if (state.url === LOGIN_URL) {
        await this.router.navigate(['/dashboard']);
      }
      return true;
    } else if (state.url === LOGIN_URL || sso) {
      return true;
    } else {
      if (portalDesktopProtocol) {
        this.openPortalDesktopProtocol(portalDesktopProtocol);
      }
      await this.router.navigate([LOGIN_URL]);
      return false;
    }
  }

  openPortalDesktopProtocol(portalDesktopProtocol: string) {
    const currentUrl = window.location.href;
    const appUrl = [
      portalDesktopProtocol,
      '://',
      encodeURIComponent(
        queryString.exclude(currentUrl, ['portalDesktopProtocol'])
      )
    ].join('');
    window.location.href = appUrl;
  }
}
