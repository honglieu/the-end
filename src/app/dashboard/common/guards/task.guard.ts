import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { TaskStatusType } from '@shared/enum/task.enum';

@Injectable({
  providedIn: 'root'
})
export class TaskGuard {
  constructor(private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.router.navigate(['/dashboard', 'inbox', 'messages'], {
      queryParams: {
        ...route.queryParams,
        inboxType: TaskStatusType.unassigned,
        status: TaskStatusType.inprogress
      },
      queryParamsHandling: 'merge'
    });
  }
}
