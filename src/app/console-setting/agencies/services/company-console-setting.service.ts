import { IDropdownMenuItem } from '@/app/user/shared/interfaces/dropdown-menu.interfaces';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import {
  CompanyPayload,
  ResultAgenciesConsoleSetting,
  StripeCustomer
} from '@shared/types/agency.interface';
import { ECountryName } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { agencies, syncs, users } from 'src/environments/environment';
import {
  IAllRegionsData,
  NewEditData
} from '@/app/console-setting/agencies/utils/console.type';

@Injectable({
  providedIn: 'root'
})
export class CompanyConsoleSettingService {
  private searchTextBS: BehaviorSubject<string> = new BehaviorSubject(null);
  private newEditModalData: BehaviorSubject<NewEditData> = new BehaviorSubject(
    null
  );
  public searchText$ = this.searchTextBS.asObservable();
  public newEditModalData$ = this.newEditModalData.asObservable();
  private allRegionsDataBS: BehaviorSubject<IAllRegionsData> =
    new BehaviorSubject(null);
  public allRegionsData$ = this.allRegionsDataBS.asObservable();

  constructor(private _apiService: ApiService) {}

  set searchText(value: string) {
    this.searchTextBS.next(value);
  }

  get searchText() {
    return this.searchTextBS.value;
  }

  setNewEditModalData(value: NewEditData) {
    this.newEditModalData.next(value);
  }

  setAllRegionsData(value: IAllRegionsData) {
    this.allRegionsDataBS.next(value);
  }

  public getAgenciesList(
    search: string = '',
    queryParams: string = '',
    page: number = 1,
    limit: number = 50,
    sname: string = 'asc'
  ): Observable<ResultAgenciesConsoleSetting> {
    return this._apiService.getAPI(
      agencies,
      `get-list-agencies?search=${search}&${queryParams}&page=${page}&limit=${limit}&sname=${sname}`
    );
  }

  public getAgencyResources() {
    return this._apiService.getAPI(agencies, 'get-agency-resources');
  }

  checkAgencyValidator(id: string, name: string) {
    return this._apiService.postAPI(agencies, 'validate-agency', {
      id,
      name
    });
  }

  saveCompany(payload: CompanyPayload) {
    return this._apiService.postAPI(
      agencies,
      'create-and-update-company',
      payload
    );
  }

  getListOfCustomers(): Observable<StripeCustomer[]> {
    return this._apiService.getAPI(users, 'list-of-customers');
  }

  getListOfUnregisteredCustomers(
    companyId: string
  ): Observable<StripeCustomer[]> {
    return this._apiService.getAPI(
      users,
      `unregistered-customers${companyId ? `?companyId=${companyId}` : ''}`
    );
  }

  getListOfSubscriptions(customerId: string) {
    return this._apiService.getAPI(
      users,
      `list-of-subscriptions?customerId=${customerId}`
    );
  }

  getListOfAgency() {
    return this._apiService.getAPI(agencies, `ptAgencies`);
  }

  getCRMList(country: ECountryName) {
    return this._apiService.getAPI(agencies, `get-crm-system/${country}`);
  }

  syncAgency(agencyId: string) {
    return this._apiService.getAPI(syncs, `sync-properties-tree`, { agencyId });
  }

  syncAllAgency(companyId: string) {
    return this._apiService.getAPI(syncs, `sync-all-agency`, { companyId });
  }

  handleConsoleAgencyTextParamChange(items: IDropdownMenuItem[]): string {
    const textArray = items.map((item) => (item.selected ? item.key : ''));
    const resultCrmStatusParam = textArray.join(',');
    return resultCrmStatusParam || '';
  }

  combineToStringParams(params) {
    return Object.entries(params)
      .map(([key, value]) => [key, value].join('='))
      .join('&');
  }

  sortAgenciesByName(agency) {
    return [...agency.agencies].sort((a, b) =>
      a.ptAgencyName.localeCompare(b.ptAgencyName)
    );
  }
}
