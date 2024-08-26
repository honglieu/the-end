import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { agencies, users } from 'src/environments/environment';
import { ApiService } from './api.service';
import { UserService } from './user.service';
import {
  AgencyDetail,
  CrudAgency,
  Suppliers
} from '@shared/types/agency.interface';
import { AgencyInSidebar, CssConfigVariable } from '@shared/types/share.model';
import { ElectronService } from '@services/electron.service';
import { EVENT_ROUTE } from '@/app/dashboard/modules/calendar-dashboard/constants/event.constants';

declare const loader: any;

@Injectable({
  providedIn: 'root'
})
/**
 * @deprecated The service should not be used
 */
export class AgencyService {
  /**
   * @deprecated The subject should not be used
   */
  public currentAgencyId: BehaviorSubject<string> = new BehaviorSubject(null);
  /**
   * @deprecated The subject should not be used
   */
  public currentAgency: BehaviorSubject<any> = new BehaviorSubject(null);
  private agencyId = null;
  public agenciesList: BehaviorSubject<AgencyInSidebar<CssConfigVariable>[]> =
    new BehaviorSubject([]);
  public agenciesCrudList: BehaviorSubject<CrudAgency[]> = new BehaviorSubject<
    CrudAgency[]
  >([]);

  constructor(
    private router: Router,
    public userService: UserService,
    private apiService: ApiService,
    private electronService: ElectronService
  ) {}

  changeAgency(id) {
    if (this.agencyId === id) {
      return;
    }
    this.agencyId = id;
    localStorage.setItem('agencyId', this.agencyId);
    this.currentAgencyId.next(this.agencyId);
    const agencyList = this.agenciesList.value;
    const currentAgency = agencyList.find((el) => el.id === this.agencyId);
    this.currentAgency.next(currentAgency);
  }

  loadAgenciesToNavigate(userId?: string) {
    this.apiService
      .getAPI(
        agencies,
        'user-agencies?userId=' +
          (this.userService.selectedUser.value.id || userId)
      )
      .subscribe((res: AgencyInSidebar<CssConfigVariable>[]) => {
        window.loader.ajaxindicatorstop();
        if (res) {
          this.agenciesList.next(res);
          const agenciesList = res.filter((a) => a.id === this.agencyId);
          this.currentAgency.next(agenciesList?.[0] || res?.[0] || null);
        }
      });
  }

  loadAgencies() {
    this.apiService
      .getAPI(users, 'v2/agent-details')
      .subscribe((res: AgencyDetail) => {
        if (
          !localStorage.getItem('firstTimeLogin') &&
          this.userService.selectedUser.value.isAdministrator
        ) {
          localStorage.setItem('firstTimeLogin', 'true');
          this.router.navigate([`controls/agent-management`]);
        } else {
          this.loadAgenciesToNavigate();
        }
      });
  }

  setCurrentAgencyId(id: string) {
    if (id === this.agencyId) {
      return;
    }
    const urlSplitArray = this.router.url.split('/');
    const eventURLSplitArray = EVENT_ROUTE.split('/');
    urlSplitArray[2] = id;
    urlSplitArray[4] = urlSplitArray[3]?.includes(eventURLSplitArray[1])
      ? eventURLSplitArray[2]
      : urlSplitArray[4];
    if (urlSplitArray.includes('detail')) {
      const urlSplit = urlSplitArray.join('/').split('detail');
      this.router.navigate([urlSplit[0] + 'unassigned']);
    } else {
      this.router.navigate([urlSplitArray.join('/')]);
    }
  }

  getListSupplier(): Observable<Suppliers[]> {
    return this.apiService.getAPI(agencies, 'list-supplier/');
  }

  getListCrudAgencies(): Observable<CrudAgency[]> {
    return this.apiService.getAPI(agencies, 'onboard-agency');
  }

  postSaveAgency(agency: CrudAgency): Observable<CrudAgency> {
    return this.apiService.postAPI(agencies, 'onboard-agency', agency);
  }

  putSaveAgency(agency: CrudAgency): Observable<CrudAgency> {
    return this.apiService.putAPI(agencies, 'onboard-agency', agency);
  }

  addSupplier(
    companyName: string,
    contactName: string,
    emergencyPhoneNumber: string,
    website: string,
    type: string,
    agencyId: string
  ): Observable<Suppliers> {
    return this.apiService.postAPI(agencies, 'supplier', {
      companyName,
      contactName,
      emergencyPhoneNumber,
      website,
      type,
      agencyId
    });
  }

  editSupplier(
    companyName: string,
    contactName: string,
    emergencyPhoneNumber: string,
    website: string,
    type: string,
    supplierId: string
  ): Observable<Suppliers> {
    return this.apiService.putAPI(agencies, 'supplier', {
      companyName,
      contactName,
      emergencyPhoneNumber,
      website,
      type,
      supplierId
    });
  }

  deleteSupplier(supplierId: string): Observable<{ message: string }> {
    return this.apiService.deleteAPI(agencies, 'supplier/' + supplierId);
  }

  addLinkContact(websiteUrl: string): Observable<{ message: string }> {
    return this.apiService.putAPI(agencies, `detail`, {
      websiteUrl
    });
  }

  updateReiDomain(reiDomain: string): Observable<{ message: string }> {
    return this.apiService.putAPI(agencies, `detail`, {
      reiDomain
    });
  }

  getListRegion(params = {}): Observable<any> {
    return this.apiService.get(`${users}get-list-region`, params).pipe(
      tap((response: any) => {
        return response;
      })
    );
  }

  getWorkingHourd(stateId: string): Observable<any> {
    return this.apiService
      .get(`${users}get-pm-schedule-by-region/${stateId}`)
      .pipe(
        tap((response: any) => {
          return response;
        })
      );
  }

  //TODO: relocated getWorkingHourdExist to agencyDashboardService
  getWorkingHourdExist(): Observable<any> {
    return this.apiService
      .get(
        `${users}get-pm-schedule-by-region-exist?agencyId=${
          this.currentAgencyId.value || this.agencyIdFromLocalStorage
        }`
      )
      .pipe(
        tap((response: any) => {
          return response;
        })
      );
  }

  updateWorkingHourd(body: any): Observable<any> {
    return this.apiService
      .post(`${users}update-pm-region-working-hour`, body)
      .pipe<any>(
        tap((response: any) => {
          return response;
        })
      );
  }

  inviteTeamMember(body: any): Observable<any> {
    return this.apiService.postAPI(agencies, 'invite-team-members', body);
  }

  checkEmailInvite(body: any): Observable<any> {
    return this.apiService.postAPI(agencies, 'check-email-invite', body).pipe(
      tap((response: any) => {
        return response;
      })
    );
  }

  updateLogo(formData: any) {
    return this.apiService.postFormAPI(
      agencies,
      `update-logo`,
      Object.fromEntries(formData.entries())
    );
  }

  removeLogo() {
    return this.apiService.putAPI(agencies, `remove-logo`);
  }

  get agencyIdFromLocalStorage() {
    return localStorage.getItem('agencyId') || null;
  }
}
