import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  Observable,
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  of,
  skip,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ApiService } from '@services/api.service';
import { LoadingService } from '@services/loading.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import {
  EFilterType,
  EParamsFilter,
  EPropertyStatus,
  ERmCrmStatus
} from '@shared/enum/user.enum';
import { UserProperties } from '@shared/types/user.interface';
import {
  UserProperty,
  UsersByProperty
} from '@shared/types/users-by-property.interface';
import { IAgentUserProperties } from '@/app/user/list-property-contact-view/model/main';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import { EActionUserType, ETypePage } from '@/app/user/utils/user.enum';
import { properties } from 'src/environments/environment';
import { UserService as UserDashboardService } from './../../../../dashboard/services/user.service';
import { CompanyService } from '@services/company.service';
import { ParamsTenantsLandlords } from '@/app/user/utils/user.type';
import { Store } from '@ngrx/store';
import {
  selectAllTenantsOwners,
  selectCurrentPage,
  selectFetchingMoreTenantsOwners,
  selectFetchingTenantsOwners,
  selectFirstInitial,
  selectIsCompedScrollTenantsOwners,
  selectTotalItems,
  selectTotalPages
} from '@core/store/contact-page/tenants-owners/rent-manager/selectors/tenants-owners-rm.selectors';
import { tenantsOwnersPageActions } from '@core/store/contact-page/tenants-owners/rent-manager/actions/tenants-owners-rm-page.actions';
import { tenantsOwnersActions } from '@core/store/contact-page/tenants-owners/rent-manager/actions/tenants-owners-rm.actions';

@Component({
  selector: 'tenants-landlords-rm',
  templateUrl: './tenants-landlords-rm.component.html',
  styleUrls: ['./tenants-landlords-rm.component.scss']
})
export class TenantsLandlordsRmComponent implements OnInit {
  @ViewChild('tenantOwnerHeader') tenantOwnerHeader: ElementRef;
  private unsubscribe = new Subject<void>();
  private cancelHTTPRequest = new Subject<void>();
  public agencyObservable$: Observable<string>;
  readonly ACTION_TYPE = EActionUserType;
  public isLoading: Boolean = true;
  public pageIndex: number = 0;
  public userProperties: UserProperties;
  public totalItems: number;
  public totalPages: number;
  public agentListLength: number;
  public searchValue: string = '';
  public selectedUser: UserProperty[] = [];
  public isLoadingMore = false;
  public typePage = ETypePage;
  public listAgentUserProperties: IAgentUserProperties[];
  public allPropertyContacts: IAgentUserProperties[] = [];
  public inviteStatus = [];
  public isRmEnvironment: boolean = false;
  public paramsGetList: ParamsTenantsLandlords = {} as ParamsTenantsLandlords;
  public increaseHeaderHeight: number = 0;
  private setHeightTimeOut: NodeJS.Timeout = null;

  constructor(
    private userAgentService: UserAgentService,
    private userService: UserService,
    private agencyService: AgencyService,
    public changeDetectorRef: ChangeDetectorRef,
    private apiService: ApiService,
    private loadingService: LoadingService,
    public taskService: TaskService,
    private websocketService: RxWebsocketService,
    private UserDashboardService: UserDashboardService,
    private companyService: CompanyService,
    private store: Store
  ) {
    this.UserDashboardService.getSelectedUser()
      .pipe(
        filter((res) => !!res?.id),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        this.websocketService.connect(res);
      });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.setIncreaseHeaderHeight();
  }

  ngOnInit() {
    this.onStoreChange();
    this.userAgentService.getTriggerValueActionFilter
      .pipe(
        takeUntil(this.unsubscribe),
        skip(1),
        debounceTime(500),
        filter(Boolean),
        tap((trigger) => {
          const { isTrigger } = trigger;
          if (!isTrigger) return;
          this.cancelHTTPRequest.next();
          this.paramsGetList = {
            ...this.paramsGetList,
            page: String(0)
          };
          this.dispatchPayloadChange(this.paramsGetList);
        })
      )
      .subscribe();

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        this.setHeightTimeOut = setTimeout(() => {
          this.setIncreaseHeaderHeight();
        }, 0);
      });
    this.getSearchInAgency();
    this.onSelectedAgency();
    this.subscribeToSocketBulkMail();
  }
  private dispatchPayloadChange(payload) {
    this.store.dispatch(
      tenantsOwnersPageActions.payloadChange({
        payload
      })
    );
  }

  subscribeDeletePhoneNumber() {
    this.userService
      .isDeletePhoneNumber()
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((res) => {
        if (!res) return;
        this.handleRefreshData();
      });
  }

  subscribeToSocketBulkMail() {
    this.websocketService.onSocketBulkEmail
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.store.dispatch(tenantsOwnersActions.socketBulkEmail({ data: rs }));
      });
  }

  private onStoreChange() {
    const totalItems$ = this.store.select(selectTotalItems);
    const currentPage$ = this.store.select(selectCurrentPage);
    const totalPages$ = this.store.select(selectTotalPages);
    const firstInitial$ = this.store.select(selectFirstInitial);
    const fetching$ = this.store.select(selectFetchingTenantsOwners);

    const fetchingMore$ = this.store
      .select(selectFetchingMoreTenantsOwners)
      .pipe(
        tap((fetchingMore) => {
          this.isLoadingMore = fetchingMore;
        })
      );
    const isCompletedScroll$ = this.store
      .select(selectIsCompedScrollTenantsOwners)
      .pipe(
        tap((isCompletedScroll) =>
          this.userAgentService.isCompletedScroll$.next(isCompletedScroll)
        )
      );
    const listAgentUserProperties$ = this.store
      .select(selectAllTenantsOwners)
      .pipe(
        tap(async (propertyContacts) => {
          this.allPropertyContacts = [...propertyContacts];

          this.listAgentUserProperties = [...this.allPropertyContacts];
          this.agentListLength = this.listAgentUserProperties?.length;
          this.listAgentUserProperties =
            this.userAgentService.handleFormatListContact(
              this.listAgentUserProperties
            );
        })
      );

    combineLatest([firstInitial$, fetching$])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([firstInit, fetching]) => {
        if (firstInit) {
          this.isLoading = true;
        } else {
          this.isLoading !== fetching &&
            !this.isLoadingMore &&
            (this.isLoading = fetching);
        }
      });

    combineLatest([
      totalItems$,
      currentPage$,
      totalPages$,
      listAgentUserProperties$,
      fetchingMore$,
      isCompletedScroll$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([total, currentPage, totalPage]) => {
        const response = {
          totalItems: total,
          currentPage,
          totalPage
        };
        this.getDataTableV2(response);
      });
  }

  getDataTableV2(response) {
    const { totalItems, currentPage, totalPage } = response;
    this.totalItems = totalItems;
    this.pageIndex = currentPage;
    this.totalPages = totalPage;
  }

  /**
   * @deprecated
   */
  getDataTable(
    pageIndex: number,
    paramMts?: string
  ): Observable<UsersByProperty> {
    return new Observable((observer) => {
      const pi = pageIndex.toString().trim();
      this.isLoading = pageIndex === 0;
      this.loadingService.onLoading();
      this.paramsGetList = {
        ...this.paramsGetList,
        paramMts: paramMts,
        page: pi
      };
      const queryString = this.userAgentService.combineToQueryStringParams(
        this.paramsGetList
      );
      this.apiService
        .getAPI(properties, `v1/list-users-by-property?${queryString}`)
        .pipe(
          takeUntil(this.cancelHTTPRequest),
          finalize(() => {
            this.isLoadingMore = false;
          }),
          switchMap((res) => {
            if (res) {
              const { propertyContacts, totalItems, currentPage, totalPages } =
                res || {};
              this.totalItems = totalItems;
              this.pageIndex = currentPage;
              this.totalPages = totalPages;
              this.allPropertyContacts =
                currentPage === 0
                  ? [...propertyContacts]
                  : [...this.allPropertyContacts, ...propertyContacts];

              this.listAgentUserProperties = [...this.allPropertyContacts];
              this.agentListLength = this.listAgentUserProperties?.length;
              this.listAgentUserProperties =
                this.userAgentService.handleFormatListContact(
                  this.listAgentUserProperties
                );
              this.userAgentService.isCompletedScroll$.next(true);
            }
            observer.next(res);
            observer.complete();
            return of(res);
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe();
    });
  }

  handleRefreshData() {
    this.userAgentService.setTriggerActionFilter = {
      isTrigger: true
    };
  }

  handleItemsSelected(event) {
    let paramKey;
    let paramName;

    switch (event.type) {
      case EFilterType.CRM:
        paramKey = EParamsFilter.CRM_STATUS;
        paramName = 'status';
        break;
      case EFilterType.PORTFOLIO:
        paramKey = EParamsFilter.PORTFOLIO_USER;
        paramName = 'id';
        break;
      case EFilterType.ROLES:
        paramKey = EParamsFilter.ROLES;
        paramName = 'status';
        break;
      case EFilterType.LAST_IMPORT:
        paramKey = EParamsFilter.TIME;
        paramName = 'value';
        break;
      case EFilterType.STATUS:
        paramKey = EParamsFilter.INVITE_STATUS;
        paramName = 'status';
        break;
      default:
        paramKey = EParamsFilter.PROPERTY_STATUS;
        paramName = 'status';
        break;
    }

    const paramValue = this.userAgentService.handleTextParamChange(
      event.items,
      paramName
    );

    this.paramsGetList = {
      ...this.paramsGetList,
      [paramKey]: paramValue
    };
    this.userAgentService.setTriggerActionFilter = {
      isTrigger: true,
      pageIndex: 0
    };
  }

  getSearchInAgency(): void {
    this.userService
      .getSearchText()
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((searchText) => {
        this.searchValue = searchText?.trim();
        this.paramsGetList = {
          ...this.paramsGetList,
          search: this.searchValue ?? ''
        };
        this.userAgentService.setTriggerActionFilter = { isTrigger: true };
      });
  }

  onSelectedAgency() {
    this.paramsGetList = {
      ...this.paramsGetList,
      crmStatus: ERmCrmStatus.RMCurrent,
      propertyStatus: EPropertyStatus.active
    };
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
    this.store.dispatch(tenantsOwnersPageActions.exitPage());
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.cancelHTTPRequest.next();
    this.cancelHTTPRequest.complete();
  }
}
