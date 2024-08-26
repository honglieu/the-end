import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { PreventButtonService } from './prevent-button.service';
import { EButtonType, ButtonKey } from './prevent-button.contstant';

@Injectable({
  providedIn: 'root'
})
export class PreventButtonGuard {
  constructor(private PreventButtonService: PreventButtonService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.PreventButtonService.shouldHandleProcess(
      state.url as ButtonKey,
      EButtonType.ROUTER
    );
  }
}
