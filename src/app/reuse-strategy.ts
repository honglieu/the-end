import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy
} from '@angular/router';
import { Subject } from 'rxjs';
import { AppRouteName } from './shared/enum';

@Injectable({
  providedIn: 'root'
})
export class CustomReuseStrategy implements RouteReuseStrategy {
  private routesToCache: AppRouteName[] = [
    AppRouteName.TASKS,
    AppRouteName.DEFAULT_TASKS,
    AppRouteName.MESSAGES,
    AppRouteName.CALENDAR_PAGE,
    AppRouteName.AGENT_USER,
    AppRouteName.TENANT_PROSPECT,
    AppRouteName.OWNER_PROSPECT,
    AppRouteName.SUPPLIER,
    AppRouteName.OTHER_CONTACT
  ];
  private storedRouteHandles = new Map<AppRouteName, DetachedRouteHandle>();

  private _onRetrieve$ = new Subject<ActivatedRouteSnapshot>();
  public onRetrieve$ = this._onRetrieve$.asObservable();

  private _onStore$ = new Subject<ActivatedRouteSnapshot>();
  public onStore$ = this._onStore$.asObservable();

  // Decides if the route should be stored
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    if (this.isLazyLoad(route) || !this.hasReuseConfig(route)) {
      return false;
    }
    return this.routesToCache.includes(route.data?.['name']);
  }

  // Store the information for the route we're destructing
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (this.hasReuseConfig(route)) {
      this.storedRouteHandles.set(route.data?.['name'], handle);
      this._onStore$.next(route);
    }
  }

  // Return true if we have a stored route object for the next route
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const routeName = route.data?.['name'];
    const shouldReuse = route.data?.['reuse'];
    return shouldReuse ? this.storedRouteHandles.has(routeName) : false;
  }

  // If we returned true in shouldAttach(), now return the actual route data for restoration
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    if (this.isLazyLoad(route) || !this.hasReuseConfig(route)) {
      return false;
    }
    const handler = this.storedRouteHandles.get(route.data?.['name']);
    if (handler) {
      this._onRetrieve$.next(route);
    }
    return handler;
  }

  // Reuse the route if we're going to and from the same route
  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot
  ): boolean {
    return future.routeConfig === current.routeConfig;
  }

  private isLazyLoad(route: ActivatedRouteSnapshot): boolean {
    return Boolean(!route.routeConfig || route.routeConfig.loadChildren);
  }

  private hasReuseConfig(route: ActivatedRouteSnapshot) {
    const routeName = route?.data['name'];
    const shouldReuse = route?.data['reuse'];
    return Boolean(routeName && shouldReuse);
  }
}
