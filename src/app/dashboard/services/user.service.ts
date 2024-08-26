import * as Sentry from '@sentry/angular-ivy';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { EUserDetailStatus, EUserPropertyType } from '@shared/enum/user.enum';
import {
  CompanyAgentCurrentUser,
  CurrentUser
} from '@shared/types/user.interface';
import { DashboardApiService } from './dashboard-api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userDetail: BehaviorSubject<CurrentUser> = new BehaviorSubject(null);
  private selectedUser: BehaviorSubject<CurrentUser> = new BehaviorSubject(
    null
  );
  private pmPortalIsDeleted: boolean = false;

  constructor(private dashboardApiService: DashboardApiService) {}

  getUserDetail() {
    return this.userDetail.asObservable();
  }

  setUserDetail(value: CurrentUser) {
    if (value && value.id) {
      if (value.id !== this.userDetail.value?.id) {
        Sentry.setUser({ id: value.id, email: value.email });
      }
      this.userDetail.next(value);
      localStorage.setItem('userId', value.id);
      this.checkPmPortalIsDeleted(value);
    }
  }

  getSelectedUser() {
    return this.selectedUser.asObservable();
  }

  setSelectedUser(value: CurrentUser) {
    this.selectedUser.next(value);
  }

  getPmPortalIsDeleted() {
    return this.pmPortalIsDeleted;
  }

  private checkPmPortalIsDeleted(user) {
    if (user) {
      this.pmPortalIsDeleted =
        user.type === EUserPropertyType.LEAD &&
        user.status === EUserDetailStatus.DELETED;
    } else {
      this.pmPortalIsDeleted = true;
    }
  }

  checkUser(): Observable<any> {
    if (!this.selectedUser?.value?.id) {
      return this.dashboardApiService.getUserDetail().pipe(
        tap((res) => {
          if (res?.id) {
            this.selectedUser.next(res);
          }
        })
      );
    }
    return of(null);
  }

  checkIsAgencyAdmin(
    companyId: string,
    companyAgents: CompanyAgentCurrentUser[]
  ) {
    if (!companyId || !companyAgents) return false;
    return companyAgents.find(
      (companyAgent) => companyAgent.companyId === companyId
    ).isAgencyAdmin;
  }
}
