import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map } from 'rxjs';
import { ICompany } from '@shared/types/company.interface';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { CompanyAgentCurrentUser } from '@shared/types/user.interface';
import { syncs } from 'src/environments/environment';
import { ApiService } from '@services/api.service';
import { ElectronService } from './electron.service';
import { CHANGE_COMPANY } from 'src/helpers/electron/constants';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private activeMobileApp: BehaviorSubject<boolean> = new BehaviorSubject(true);
  private companies: BehaviorSubject<ICompany[]> = new BehaviorSubject([]);
  private currentCompanyId$: BehaviorSubject<string> = new BehaviorSubject('');
  private listCompanyAgent: BehaviorSubject<CompanyAgentCurrentUser[]> =
    new BehaviorSubject<CompanyAgentCurrentUser[]>(null);

  constructor(
    private apiService: ApiService,
    private electronService: ElectronService
  ) {}

  isRentManagerCRM(company: ICompany) {
    return company?.CRM === ECrmSystemId[ECRMSystem.RENT_MANAGER];
  }

  isPropertyTreeCRM(company: ICompany) {
    return company?.CRM === ECrmSystemId[ECRMSystem.PROPERTY_TREE];
  }

  getCurrentCompany() {
    return combineLatest([
      this.getCurrentCompanyId(),
      this.getCompanies()
    ]).pipe(
      filter(([companyId, companies]) => {
        return companyId && companies && companies.length > 0;
      }),
      map(([companyId, companies]) => {
        const company = companies.find((company) => company.id === companyId);
        this.setActiveMobileApp(company?.isActive);
        return company;
      })
    );
  }

  getCurrentCompanyId() {
    return this.currentCompanyId$.asObservable();
  }

  currentCompanyId() {
    return this.currentCompanyId$.value;
  }

  setCurrentCompanyId(value) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send(CHANGE_COMPANY, value);
    }
    return this.currentCompanyId$.next(value);
  }

  getCompanies() {
    return this.companies.asObservable();
  }

  getCompaniesValue() {
    return this.companies.getValue();
  }

  setCompanies(value) {
    return this.companies.next(value);
  }

  get listCompanyAgent$() {
    return this.listCompanyAgent.asObservable();
  }

  get listCompanyAgentValue() {
    return this.listCompanyAgent.getValue();
  }

  get currentCompanyCRMSystemName() {
    return this.getCurrentCompany().pipe(
      map((value) => {
        return value?.crmSystem;
      })
    );
  }

  setListCompanyAgent(value: CompanyAgentCurrentUser[]) {
    this.listCompanyAgent.next(value);
  }

  getActiveMobileApp() {
    return this.activeMobileApp.asObservable();
  }

  setActiveMobileApp(value: boolean) {
    return this.activeMobileApp.next(value);
  }
  getStatusSyncAgenciesByCompanyId() {
    return this.apiService.getAPI(
      syncs,
      'get-status-sync-agencies-by-companyId'
    );
  }
}
