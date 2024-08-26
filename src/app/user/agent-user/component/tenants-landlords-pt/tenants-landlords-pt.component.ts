import { PortfolioService } from '@/app/dashboard/services/portfolio.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { TitleCasePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged, skip, tap } from 'rxjs/operators';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AuthService } from '@services/auth.service';
import { LoadingService } from '@services/loading.service';
import { TaskService } from '@services/task.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import {
  EFilterType,
  EPropertyStatus,
  EUserPropertyType
} from '@shared/enum/user.enum';
import { Portfolio } from '@shared/types/user.interface';
import { IconType } from '@trudi-ui';
import { IAgentUserProperties } from '@/app/user/list-property-contact-view/model/main';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import { IDropdownMenuItem } from '@/app/user/shared/interfaces/dropdown-menu.interfaces';
import { FILTER_TYPE_TENANT_OWNER } from '@/app/user/utils/user.type';
import { properties } from 'src/environments/environment';
import { ApiService } from '@services/api.service';
import { PopupService } from '@services/popup.service';
import { UserService } from '@services/user.service';
import { IKeyUserIndex } from '@shared/types/filter.interface';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { Agency } from '@shared/types/agency.interface';
import { sortAgenciesFn } from '@shared/utils/helper-functions';
import { CompanyService } from '@services/company.service';
import { SupplierContactSearchService } from '@/app/user/supplier/services/supplier-contact-search.service';
import { Store } from '@ngrx/store';
import { tenantsOwnersPageActions } from '@core/store/contact-page/tenants-owners/property-tree/actions/tenants-owners-pt-page.actions';
import {
  selectAllTenantsOwners,
  selectCurrentPage,
  selectFetchingMoreTenantsOwners,
  selectFetchingTenantsOwners,
  selectIsCompletedScrollTenantsOwners,
  selectTotalItems,
  selectTotalPages,
  selectFirstInitialTenantsOwners
} from '@core/store/contact-page/tenants-owners/property-tree/selectors/tenants-owners-pt.selectors';
import { ETypePage } from '@/app/user/utils/user.enum';

const propertyStatus: { id: number; status: EPropertyStatus; text: string }[] =
  [
    { id: 1, status: EPropertyStatus.active, text: 'Active' },
    { id: 2, status: EPropertyStatus.archived, text: 'Archived' },
    { id: 3, status: EPropertyStatus.deleted, text: 'Deleted' }
  ];

declare const $: any;
@Component({
  selector: 'tenants-landlords-pt',
  templateUrl: './tenants-landlords-pt.component.html',
  styleUrls: ['./tenants-landlords-pt.component.scss'],
  providers: [TitleCasePipe]
})
@DestroyDecorator
export class TenantsLandlordsPtComponent implements OnInit, OnDestroy {
  selectedPeople: number;
  @ViewChildren(NgSelectComponent) selectElements: QueryList<any>;
  @ViewChild('selectAgency') public selectAgency: NgSelectComponent;
  @ViewChild('selectRole') selectRole!: NgSelectComponent;
  @ViewChild('selectInviteStatus') public selectInviteStatus: NgSelectComponent;
  @ViewChild('selectCRMStatus') public selectCRMStatus: NgSelectComponent;
  @ViewChild('selectPortfolio') public selectPortfolio: NgSelectComponent;
  @ViewChild('selectImportFilter') public selectImportFilter: NgSelectComponent;
  @ViewChild('searchInput') public searchElement: ElementRef;
  @ViewChild('filterWrapper') filterWrapper: ElementRef<HTMLDivElement>;
  @ViewChild('table', { static: true }) tableAgent: ElementRef<HTMLDivElement>;
  @ViewChild('tenantOwnerHeader', { static: true })
  tenantOwnerHeader: ElementRef;
  @ViewChild(CdkVirtualScrollViewport, { static: false })
  viewPort: CdkVirtualScrollViewport;

  private unsubscribe = new Subject<void>();
  private getListDataTable$ = new Subject();
  public sortedPortfolios: Portfolio[] = [];
  public portfolios: Portfolio[] = [];
  public selectedPortfolios: string[] = [];
  public titleGroupTask: string[] = [];
  public searchValue: string = '';
  public searchText: string = '';
  public pageIndex: number = 0;
  public crmStatus = [];
  public propertyStatus = propertyStatus;
  public inviteStatus = [];
  public loadingFilter: boolean = false;
  public isLoading: boolean = true;
  public LandLordCRMStatuses = [
    {
      id: 1,
      text: 'ACTIVE'
    },
    {
      id: 2,
      text: 'ARCHIVED'
    }
  ];
  public PropertyManagerCRMStatuses = [
    {
      id: 1,
      text: 'ACTIVE'
    }
  ];
  public listDateFilter = [
    {
      id: 1,
      name: 'Last 24 hrs',
      value: '24h',
      data: 'last-24hrs'
    },
    {
      id: 2,
      name: 'Last 7 days',
      value: '7d',
      data: 'last-7days'
    },
    {
      id: 3,
      name: 'Last 30 days',
      value: '30d',
      data: 'last-30days'
    },
    {
      id: 4,
      name: 'Last 90 days',
      value: '90d',
      data: 'last-90days'
    }
  ];
  public itemPerRowOptions = [
    {
      id: 1,
      text: 10
    },
    {
      id: 2,
      text: 20
    },
    {
      id: 3,
      text: 50
    },
    {
      id: 4,
      text: 100
    }
  ];
  public listRoles = [];
  public selectedCompany: string;
  public selectedInviteStatus: string;
  public selectedCRMStatus: string;
  public prevListCrm: string[] = [];
  public prevListRoles: string[] = [];
  public prevListTime: string[] = [];
  public prevListPropertyStatus: string[] = [];
  public prevListListInviteStatus: string[] = [];
  public prevListLastTime: string[] = [];
  public prevListAgencies: string[] = [];
  public newDataFilter = {};
  public selectedTime: string;
  public filterForm: FormGroup;
  public agencies: Agency[] = [];
  public propertyContacts: IAgentUserProperties[];
  public allPropertyContacts: IAgentUserProperties[] = [];
  public isLoadingMore = false;
  public dataSelect: IKeyUserIndex;

  public isTouch = false;
  public changes = false;
  public currentRolesPicked = '';
  public currentCRMPicked = '';
  public isClearCRM = true;
  public isInviteStatus = true;
  public isLastActive = true;
  public isAgency = false;

  public IconType = IconType;
  public totalItems: number;
  public totalPages: number;
  public agentListLength: number;
  public isClearPortfolio = true;
  public activeMobileApp = false;

  public filterType = EFilterType;
  public filterTemp: { [type: string]: string | number } = {
    [EFilterType.PORTFOLIO]: '',
    [EFilterType.ROLES]: '',
    [EFilterType.STATUS]: '',
    [EFilterType.CRM]: '',
    [EFilterType.LAST_IMPORT]: ''
  };

  public searchInFilter: { [type: string]: boolean } = {};
  public TYPE_GET_PORTFOLIO: string = 'ALL-PORTFOLIO';
  public EUserPropertyType = EUserPropertyType;
  public increaseHeaderHeight: number;
  private setHeightTimeOut: NodeJS.Timeout = null;
  public typePage = ETypePage;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private userService: UserService,
    private agentUserService: AgentUserService,
    private popupService: PopupService,
    private companyService: CompanyService,
    public loadingService: LoadingService,
    public taskService: TaskService,
    private authService: AuthService,
    private titleCasePipe: TitleCasePipe,
    private agencyDateFormatService: AgencyDateFormatService,
    private userAgentService: UserAgentService,
    private portfolioService: PortfolioService,
    private supplierContactSearchService: SupplierContactSearchService,
    private store: Store
  ) {
    this.filterForm = this.fb.group({
      search: this.fb.control(''),
      roles: this.fb.control(''),
      invStatus: this.fb.control([]),
      crmStatus: this.fb.control([]),
      portfolioUserId: this.fb.control([]),
      propertyStatus: this.fb.control([]),
      time: this.fb.control(''),
      agencyIds: this.fb.control([])
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.setIncreaseHeaderHeight();
  }

  ngOnInit() {
    this.loadingFilter = true;
    this.selectedCompany = this.companyService.currentCompanyId();
    this.subscribeDeletePhoneNumber();
    this.onStoreChange();
    this.getDataSelect(localStorage.getItem('userId')).subscribe({
      next: (roleAndCRMdata) => {
        this.handleCRMStatusAndRoleData(roleAndCRMdata);
        this.handleGetValueFilter();
        this.queryDataToGetTable();
        this.getListUsersByProperty();

        this.getDataTable(0);
        this.agentUserService.reloadTenantLandlordData
          .pipe(takeUntil(this.unsubscribe), skip(1))
          .subscribe((res) => {
            res && this.getDataTable(this.pageIndex);
          });
      },
      complete: () => {
        this.loadingService.stopLoading();
      }
    });
    this.setHeightTimeOut = setTimeout(() => {
      this.setIncreaseHeaderHeight();
    }, 0);
    this.getListAgencies();
    this.supplierContactSearchService
      .getSelectedAgencyIds()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((agencyIds) => {
        this.prevListAgencies = agencyIds;
      });
    this.initPortfolio();
  }

  subscribeDeletePhoneNumber() {
    this.userService
      .isDeletePhoneNumber()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.getDataTable(this.pageIndex);
      });
  }

  private initPortfolio() {
    this.portfolioService
      .getPortfolios$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((portfolios) => {
        if (!portfolios) return;
        this.filterForm.get('portfolioUserId').setValue([]);
        this.getDataTable(0);
        this.titleGroupTask = [];
        this.portfolios = portfolios
          .map((group) => {
            this.titleGroupTask.push(group.name);
            return group.portfolios.map((portfolio) => ({
              ...portfolio,
              agencyId: group.id,
              agencyName: group.name
            }));
          })
          .flat();
        this.mapPortfolios();
      });

    this.selectedPortfolios =
      this.agentUserService.getDataFilter('TENANTS_OWNER')?.PORTFOLIO || [];
  }

  private mapPortfolios() {
    this.sortedPortfolios = this.portfolios.map((item) => ({
      ...item,
      label: `${item.firstName || ''} ${item.lastName || ''}`.trim()
    }));
  }
  private getListAgencies() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.agencies = company.agencies;
        if (this.agencies.length > 1) {
          this.agencies.sort(sortAgenciesFn);
        }
      });
  }

  resetDataFilter() {
    this.loadingFilter = true;
    localStorage.removeItem('TENANTS_OWNER');
    this.prevListCrm = ['Active'];
    this.prevListPropertyStatus = ['Active'];
    this.newDataFilter = {
      CRM: this.prevListCrm,
      PROPERTY_STATUS: this.prevListPropertyStatus
    };
    this.agentUserService.setDataFilter('TENANTS_OWNER', this.newDataFilter);
    this.selectedPortfolios = [];
    this.prevListRoles = [];
    this.prevListAgencies = [];
    this.currentRolesPicked = '';
    this.loadingFilter = false;
    this.supplierContactSearchService.setSelectedAgencyIds([]);
  }

  handleGetValueFilter() {
    const listKeyFilters = this.agentUserService.getDataFilter('TENANTS_OWNER');
    const {
      CRM,
      PROPERTY_STATUS,
      ROLES,
      STATUS,
      LAST_IMPORT,
      AGENCIES,
      PORTFOLIO
    } = listKeyFilters || {};
    this.prevListCrm = CRM || ['Active'];
    this.prevListPropertyStatus = PROPERTY_STATUS || ['Active'];
    this.prevListLastTime = LAST_IMPORT || [];
    this.prevListRoles = ROLES || [];
    this.prevListListInviteStatus = STATUS || [];
    this.prevListAgencies = AGENCIES || [];
    this.selectedPortfolios = PORTFOLIO || [];
    this.filterForm.get('portfolioUserId').setValue(this.selectedPortfolios);
    this.supplierContactSearchService.setSelectedAgencyIds(AGENCIES);
  }

  handleRefreshData($event) {
    const { refreshed } = $event || {};
    if (refreshed) {
      this.getDataTable(this.pageIndex);
    }
  }

  onSearchFilter(event, type: EFilterType): void {
    let { term } = event;
    this.searchInFilter[type] = !!term;
  }

  combineNames(firstName: string | null, lastName: string | null): string {
    return [firstName, lastName].filter(Boolean).join(' ');
  }

  getPortfolios() {
    return this.authService
      .getPortfoliosByType(this.TYPE_GET_PORTFOLIO)
      .pipe(takeUntil(this.unsubscribe));
  }

  customDisplayOfValue(display: 'none' | 'block' = 'none') {
    const value: HTMLElement = this.selectRole.element.querySelector(
      '.ng-value-container'
    );
    value.style.opacity = display === 'none' ? '0' : '1';
    value.style.width = display === 'none' ? '0' : '100%';
  }

  queryDataToGetTable(): void {
    combineLatest([
      this.companyService
        .getCurrentCompanyId()
        .pipe(takeUntil(this.unsubscribe), distinctUntilChanged()),
      this.userService
        .getSearchText()
        .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
    ]).subscribe(([companyId, searchText]) => {
      if (companyId) {
        this.selectedCompany = companyId;
      }
      this.filterForm.get('search').setValue(searchText?.trim());
      this.searchValue = searchText?.trim();
      this.getDataTable(0);
    });
  }

  private onStoreChange() {
    const totalItems$ = this.store.select(selectTotalItems);
    const currentPage$ = this.store.select(selectCurrentPage);
    const totalPages$ = this.store.select(selectTotalPages);
    const firstInitial$ = this.store.select(selectFirstInitialTenantsOwners);
    const fetching$ = this.store.select(selectFetchingTenantsOwners);
    const fetchingMore$ = this.store
      .select(selectFetchingMoreTenantsOwners)
      .pipe(
        tap((fetching) => {
          this.isLoadingMore = fetching;
        })
      );
    const isCpmpletedScroll$ = this.store
      .select(selectIsCompletedScrollTenantsOwners)
      .pipe(
        tap((isCpmpletedScroll) => {
          this.userAgentService.isCompletedScroll$.next(isCpmpletedScroll);
        })
      );
    const listTenantsOwners$ = this.store.select(selectAllTenantsOwners).pipe(
      tap((propertyContacts) => {
        this.allPropertyContacts = [...propertyContacts];
        this.propertyContacts = [...this.allPropertyContacts];
        this.agentListLength = this.propertyContacts?.length;
        this.propertyContacts = this.userAgentService.handleFormatListContact(
          this.propertyContacts
        );
      })
    );

    combineLatest([firstInitial$, fetching$])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([firstInit, fetching]) => {
        if (firstInit) {
          this.isLoading = true;
        } else {
          this.isLoading !== fetching && (this.isLoading = fetching);
        }
      });

    combineLatest([
      totalItems$,
      currentPage$,
      totalPages$,
      listTenantsOwners$,
      fetching$,
      fetchingMore$,
      isCpmpletedScroll$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([totalItems, currentPage, totalPages]) => {
        const response = {
          totalItems,
          currentPage,
          totalPages
        };
        this.updateUI(response);
      });
  }

  private updateUI(response) {
    const { totalItems, currentPage, totalPages } = response || {};
    this.totalItems = totalItems;
    this.pageIndex = currentPage;
    this.totalPages = totalPages;
  }

  getListUsersByProperty() {
    this.getListDataTable$
      .pipe(debounceTime(500), takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          this.dispatchPayloadChange(res);
        }
      });
  }

  getDataTable(pageIndex: number, paramMts?: string) {
    const pi = pageIndex?.toString().trim() || 0;
    this.loadingService.onLoading();
    const paramsObject = {
      page: pi,
      roleType: !paramMts ? this.currentRolesPicked : paramMts,
      inviteStatuses: this.getInvStatus(),
      crmStatuses: this.getCrmStatus(),
      time: this.getTime(),
      search: this.getSearchValue() || '',
      portfolioUserIds: this.getPortfolioUserId(),
      propertyStatuses: this.getPropertyStatus(),
      agencyIds: this.getAgencyIds()
    };
    this.getListDataTable$.next(paramsObject);
    this.loadingFilter = false;
  }

  private dispatchPayloadChange(payload) {
    this.store.dispatch(
      tenantsOwnersPageActions.payloadChange({
        payload
      })
    );
  }

  createDataFilter(event) {
    this.agentUserService.handleDataFilter(
      event,
      this.newDataFilter,
      'TENANTS_OWNER',
      FILTER_TYPE_TENANT_OWNER
    );
  }

  getDataSelect(userId: string) {
    if (userId) {
      this.loadingService.onLoading();
      return this.apiService.getAPI(
        properties,
        'get-key-user-index' + `?userId=${userId}`
      );
    }
    return null;
  }

  handleCRMStatusAndRoleData(res) {
    if (res) {
      res.roleType = res.roleType.filter(
        (role) => role.text !== 'AGENT' && role.text !== 'Clear'
      );
      res.roleType.forEach((role) => {
        if (role.text === EUserPropertyType.LANDLORD) {
          role.text = 'Owner';
        }
        role.id++;
      });
      res.crmStatus.map((crm) => {
        crm.id++;
        if (crm.text === 'PROSPECT') {
          crm.text = 'PROSPECTIVE';
        }
      });
      const idxArchived = res.crmStatus.findIndex(
        (item) => item.text === 'ARCHIVED'
      );

      this.arrayMove(res.crmStatus, idxArchived, res.crmStatus.length - 3);
      this.dataSelect = res;
      this.listRoles = this.dataSelect.roleType;
      this.selectAllForDropdownItems(this.listRoles);
      this.dataSelect.roleType = this.selectCustomText(
        this.dataSelect.roleType
      );
      this.crmStatus = this.selectCustomText(this.dataSelect.crmStatus).filter(
        (e) => e.text !== 'Clear' && e.text !== 'Deleted'
      );
      this.inviteStatus = this.selectCustomText(
        this.dataSelect.inviteStatus
      ).filter((e) => e.text !== 'Clear');
    }
  }

  selectCustomText(crmStatus) {
    return crmStatus.map((e) => {
      e.text = this.titleCasePipe.transform(e.text);
      return e;
    });
  }

  arrayMove(array, fromIndex, toIndex) {
    let arr = array;
    let element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
    return arr;
  }

  onSearch(event) {
    const value: string = event.target.value || '';
    this.searchValue = value.trim();
    this.filterForm.get('search').setValue(value);
    this.pageIndex = 0;
    this.getDataTable(this.pageIndex);
  }

  selectAllForDropdownItems(items: any[]) {
    let allSelect = (items) => {
      items.forEach((element) => {
        element['selectedAllGroup'] = 'selectedAllGroup';
      });
    };
    allSelect(items);
  }

  getClassBasedOnCRM() {
    switch (this.getCrmStatus()) {
      case 'ARCHIVED':
        return 'archived';
      case 'PROSPECT':
        return 'prospective';
      default:
        return '';
    }
  }

  getSearchValue() {
    return this.filterForm.get('search').value;
  }

  getRoles() {
    return this.filterForm.get('roles').value !== 'Clear all'
      ? this.filterForm.get('roles').value
      : '';
  }

  getInvStatus() {
    return this.filterForm.get('invStatus').value !== 'Clear all'
      ? this.filterForm.get('invStatus').value
      : [];
  }

  getCrmStatus() {
    return this.filterForm.get('crmStatus').value !== 'Clear all'
      ? this.filterForm.get('crmStatus').value
      : [];
  }

  getTime() {
    return this.filterForm.get('time').value !== 'Clear all'
      ? this.filterForm.get('time').value
      : '';
  }

  getPortfolioUserId() {
    return this.filterForm.get('portfolioUserId').value !== 'Clear'
      ? this.filterForm.get('portfolioUserId').value
      : [];
  }

  getPropertyStatus() {
    return this.filterForm.get('propertyStatus').value !== 'Clear'
      ? this.filterForm.get('propertyStatus').value
      : [];
  }

  private getAgencyIds() {
    return this.agencies?.length > 1 &&
      this.filterForm.get('agencyIds').value !== 'Clear'
      ? this.filterForm.get('agencyIds').value
      : [];
  }

  handleItemsSelected(event) {
    let eventCustom;
    let items;
    let type;
    let ignoreThisEmitting;
    if (Array.isArray(event)) {
      ignoreThisEmitting = false;
      type = EFilterType.PORTFOLIO;
      items = event.map((item) => ({
        id: item,
        selected: true,
        text: this.sortedPortfolios.find(
          (portfolio) => portfolio.agencyAgentId === item
        ).label
      }));
      eventCustom = { items, type };
    } else {
      ignoreThisEmitting = event?.ignoreThisEmitting;
      type = event.type;
      items = event.items;
      eventCustom = event;
    }
    this.pageIndex = 0;
    switch (type) {
      case EFilterType.CRM:
        this.handleCRMEvent(items, 'text', 'crmStatus');
        break;
      case EFilterType.PORTFOLIO:
        this.handlePortfolioEvent(items, 'id', 'portfolioUserId');
        break;
      case EFilterType.ROLES:
        this.handleRolesEvent(items);
        break;
      case EFilterType.LAST_IMPORT:
        this.handleLastImportEvent(items, 'value', 'time');
        break;
      case EFilterType.STATUS:
        this.handleStatusEvent(items, 'text', 'invStatus');
        break;
      case EFilterType.AGENCIES:
        this.handleChangeFilterAgencies(items, 'id', 'agencyIds');
        break;
      case EFilterType.PROPERTY_STATUS:
        this.handlePropertyStatusEvent(items, 'status', 'propertyStatus');
        break;
      default:
        break;
    }
    if (!ignoreThisEmitting) {
      this.createDataFilter(eventCustom);
    }
  }

  private handleChangeFilterAgencies(
    items: [],
    bindLabel: string,
    formControlName: string
  ) {
    const agencyIds = this.handleArrayParamChange(items, bindLabel);
    this.supplierContactSearchService.setSelectedAgencyIds(agencyIds);
    this.filterForm.get(formControlName).setValue(agencyIds);
    this.getDataTable(this.pageIndex);
  }

  handleCRMEvent(items, bindLabel, formControlName) {
    const handleTextCrmStatus = this.handleArrayParamChange(items, bindLabel);
    this.filterForm
      .get(formControlName)
      .setValue(handleTextCrmStatus.map((status) => status.toUpperCase()));
    this.getDataTable(this.pageIndex);
  }

  handlePortfolioEvent(items, bindLabel, formControlName) {
    const portfolio = this.handleArrayParamChange(items, bindLabel);
    this.filterForm.get(formControlName).setValue(portfolio);
    this.getDataTable(this.pageIndex);
  }

  handleRolesEvent(items) {
    const roleType =
      items[0]?.text?.toUpperCase() === EUserPropertyType.OWNER
        ? 'Landlord'
        : items[0]?.text;
    this.filterForm.get('roles').setValue(roleType);
    if (items[0]?.text) {
      this.currentRolesPicked = roleType;
    } else {
      this.currentRolesPicked = '';
    }
    this.getDataTable(this.pageIndex);
  }

  handleLastImportEvent(items, bindLabel, formControlName) {
    const handleText = this.handleTextParamChange(items, bindLabel);
    this.filterForm.get(formControlName).setValue(handleText);
    this.getDataTable(this.pageIndex);
  }

  handleStatusEvent(items, bindLabel, formControlName) {
    const trudiAppText = this.handleArrayParamChange(items, bindLabel);
    this.filterForm
      .get(formControlName)
      .setValue(trudiAppText.map((status) => status.toUpperCase()));
    this.getDataTable(this.pageIndex);
  }

  handlePropertyStatusEvent(items, bindLabel, formControlName) {
    const propertyStatusText = this.handleArrayParamChange(items, bindLabel);
    this.filterForm.get(formControlName).setValue(propertyStatusText);
    this.getDataTable(this.pageIndex);
  }

  handleTextParamChange(items: IDropdownMenuItem[], bindLabel: string): string {
    const textArray = items.map((item) =>
      item[bindLabel] === 'Prospective' ? 'PROSPECT' : item[bindLabel]
    );
    const resultCrmStatusParam = textArray.join(',');
    return resultCrmStatusParam || '';
  }

  handleArrayParamChange(
    items: IDropdownMenuItem[],
    bindLabel: string
  ): string[] {
    const mapArray = items.map((item) =>
      item[bindLabel] === 'Prospective' ? 'PROSPECT' : item[bindLabel]
    );
    return mapArray || [];
  }

  setIncreaseHeaderHeight() {
    const offsetHeight = this.tenantOwnerHeader?.nativeElement?.offsetHeight;

    if (offsetHeight > 28) {
      this.increaseHeaderHeight = offsetHeight - 28;
    } else {
      this.increaseHeaderHeight = 0;
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.setHeightTimeOut);
    this.popupService.isShowActionLinkModal.next(false);
    this.store.dispatch(tenantsOwnersPageActions.exitPage());
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.agentUserService.reloadTenantLandlordData.next(false);
  }
}
