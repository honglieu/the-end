import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, of, switchMap, takeUntil, tap } from 'rxjs';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { LoadingService } from '@services/loading.service';
import { UserService } from '@services/user.service';
import { EFilterType } from '@shared/enum/user.enum';
import { TrudiTab } from '@trudi-ui';
import { AgentUserService } from './agent-user/agent-user.service';
import { UserAgentService } from './services/user-agent.service';
import {
  CRM_STATUS_LANLORDS_PROSPECT,
  CRM_STATUS_TENANTS_PROSPECT
} from './utils/user.type';
import { CompanyService } from '@services/company.service';
import { SupplierContactSearchService } from './supplier/services/supplier-contact-search.service';
import { Store } from '@ngrx/store';
import { contactBasePageActions } from '@core/store/contact-page/contact-base/actions/contact-base-page.actions';

@Component({
  selector: 'user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit, OnDestroy {
  public contactsTabs: TrudiTab<Object>[] = [];
  public unsubscribe = new Subject<void>();
  public currentAgencyId: string = '';
  public searchText: string = '';
  public isShowClose: boolean = false;
  public isShowClear: boolean = false;
  public isClearEnable: boolean = false;
  public searchValue: string = '';
  public filterType = EFilterType;
  public crmStatusLandlordsProspect = CRM_STATUS_LANLORDS_PROSPECT;
  public crmStatusTenantsProspect = CRM_STATUS_TENANTS_PROSPECT;
  public prevListCrmOwner: string[] = [];
  public prevListCrmTenant: string[] = [];
  public dataFilter = {};
  public currentCompanyId: string;

  constructor(
    public userService: UserService,
    public loadingService: LoadingService,
    private userAgentService: UserAgentService,
    private agentUserService: AgentUserService,
    public router: Router,
    private dashboardAgencyService: DashboardAgencyService,
    private companyService: CompanyService,
    private supplierContactSearchService: SupplierContactSearchService,
    private store: Store
  ) {}

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.store.dispatch(contactBasePageActions.exitPage());
  }

  ngOnInit(): void {
    this.showContactsTabsByAgency();
    this.handleGetListKey(
      'OWNER-PROSPECT',
      (value) => (this.prevListCrmOwner = value)
    );
    this.handleGetListKey(
      'TENANT-PROSPECT',
      (value) => (this.prevListCrmTenant = value)
    );
    this.handleGetSearch();
    this.router.events.pipe(takeUntil(this.unsubscribe)).subscribe((rs) => {
      if (rs instanceof NavigationEnd) {
        this.searchText = localStorage.getItem('searchText') || '';
      }
    });
  }

  handleGetSearch() {
    this.userService.searchText$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.searchText = res;
      });
  }

  handleGetListKey(filterKey: string, callback: (value) => void) {
    const listKeyFilters = this.agentUserService.getDataFilter(filterKey);
    const { CRM = [] } = listKeyFilters || {};
    callback(CRM);
  }

  showContactsTabsByAgency() {
    const contactsTabsRM: TrudiTab<Object>[] = [
      {
        title: 'Tenants / Owners',
        link: 'tenants-landlords'
      },
      {
        title: 'Tenant prospect',
        link: 'tenant-prospect'
      },
      {
        title: 'Owner prospect',
        link: 'landlords-prospect'
      },
      {
        title: 'Suppliers',
        link: 'suppliers'
      },
      {
        title: 'Other contacts',
        link: 'other-contacts'
      }
    ];
    const contactsTabsPT: TrudiTab<Object>[] = [
      {
        title: 'Tenants / Owners',
        link: 'tenants-landlords'
      },
      {
        title: 'Suppliers',
        link: 'suppliers'
      },
      {
        title: 'Other contacts',
        link: 'other-contacts'
      }
    ];
    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.unsubscribe),
        tap((res) => {
          if (this.currentCompanyId && res.id !== this.currentCompanyId) {
            this.supplierContactSearchService.setSelectedAgencyIds([]);
            this.userService.setSearchText('');
            localStorage.removeItem('SUPPLIER');
            localStorage.removeItem('TENANTS_OWNER');
          }
        }),
        switchMap((res) => {
          this.currentCompanyId = res.id;
          if (this.dashboardAgencyService.isRentManagerCRM(res)) {
            this.contactsTabs = contactsTabsRM;
            return this.router.events;
          } else {
            this.contactsTabs = contactsTabsPT;
            return of(null);
          }
        })
      )
      .subscribe();
  }

  handleCrmLandlordProspectItemsSelected(event) {
    let crmStatus = [];
    if (!event) return;
    crmStatus = event.items.map((itemStatus) => itemStatus.status);
    this.prevListCrmOwner = event.items.map((item) => item.text);
    this.dataFilter['CRM'] = this.prevListCrmOwner;

    this.agentUserService.setDataFilter('OWNER-PROSPECT', this.dataFilter);
    this.userAgentService.setcrmLandlordProspectOption = crmStatus;
  }

  handleCrmTenantProspectItemsSelected(event) {
    const currentCRMStatus = event.items.map((item) => item.status);
    this.prevListCrmTenant = event.items.map((item) => item.text);

    this.dataFilter['CRM'] = this.prevListCrmTenant;

    this.agentUserService.setDataFilter('TENANT-PROSPECT', {
      ...this.dataFilter
    });
    this.userAgentService.setCRMTenantProspectOption = currentCRMStatus;
  }

  onCloseSearch() {
    this.isShowClose = false;
    this.isShowClear = false;
    this.isClearEnable = false;
    this.searchText = '';
    this.searchValue = '';
    this.userService.setSearchText('');
  }

  onSearch(event) {
    const value: string = event.target.value || '';
    this.searchValue = value.trim();
    this.userService.setSearchText(value);
  }

  onFocusOnSearch() {
    this.isShowClear = true;
    this.isShowClose = true;
  }

  onFocusOutSearch(event) {
    this.isShowClear = false;
    this.isShowClose = false;
  }
}
