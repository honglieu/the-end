import { Component, OnInit, ViewChild } from '@angular/core';
import { UserProperties } from 'aws-sdk/clients/iot';
import { Subject, combineLatest, merge, takeUntil } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  tap
} from 'rxjs/operators';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { UserService } from '@services/user.service';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { UserAgentApiService } from '@/app/user/services/user-agent-api.service';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import { AppCommonAgentUserComponent } from '@/app/user/shared/components/common-agent-user-component/common-agent-user-component.component';
import { EActionUserType, ETypePage } from '@/app/user/utils/user.enum';
import {
  ParamsTenantLandlordsProspect,
  TABLE_COLUMN_TENANT_PROSPECT,
  eventData
} from './../utils/user.type';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { CompanyService } from '@services/company.service';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { SharedService } from '@services/shared.service';
import { UserInfoDrawerService } from '@/app/user/shared/components/drawer-user-info/services/user-info-drawer.service';
import { Store } from '@ngrx/store';
import { tenantProspectPageActions } from '@core/store/contact-page/tenant-prospect/actions/tenant-prospect-page.actions';
import {
  selectAllTenantProspect,
  selectCurrentPageTenantProspect,
  selectFetchingMoreTenantProspect,
  selectFetchingTenantProspect,
  selectFristInitialTenantProspect,
  selectTotalItemsTenantProspect,
  selectTotalPagesTenantProspect
} from '@core/store/contact-page/tenant-prospect/selectors/tenant-prospect.selectors';

@Component({
  selector: 'tenant-prospect',
  templateUrl: './tenant-prospect.component.html',
  styleUrls: ['./tenant-prospect.component.scss']
})
export class TenantProspectComponent implements OnInit {
  @ViewChild(AppCommonAgentUserComponent)
  CommonComponentAgentUser: AppCommonAgentUserComponent;
  private unsubscribe = new Subject<void>();
  public typePage = ETypePage;
  public userProperties: UserProperties;
  public isLoading: Boolean = true;
  public isLoadingMore: Boolean = true;
  public pageSize: number = 20;
  public pageIndex: number = 0;

  public agencyId: string = '';
  public totalItems = 100;
  public totalPages = 0;
  public dataTableDataSource;
  public allListAgencies = [];
  public dataTableColumn = TABLE_COLUMN_TENANT_PROSPECT;
  public popupState = {
    propertyInfo: false,
    addNotePropertyInfo: false,
    isShowConfirmInviteOrMessageModal: false,
    isShowSuccessInviteModal: false,
    isShowDeleteUser: false
  };
  public crmStatus: string[] = [];
  public searchText: string = '';
  public searchValue: string = '';
  public isRmEnvironment: boolean = false;
  public paramsGetList: ParamsTenantLandlordsProspect = {
    page: 0,
    size: 20,
    search: '',
    crmStatus: []
  };

  public visible: boolean = false;
  public currentDataUser: UserProperty;
  public visiblePropertyProfile = false;

  constructor(
    private userAgentService: UserAgentService,
    private userAgentApiService: UserAgentApiService,
    private userService: UserService,
    private agencyService: AgencyService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    private companyService: CompanyService,
    private sharedService: SharedService,
    private userInfoDrawerService: UserInfoDrawerService,
    private store: Store
  ) {}

  ngOnInit() {
    this.subscribeAddDeletedEmailSecondary();
    this.subscribeDeletePhoneNumber();
    this.sharedService
      .isGlobalSearching$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((_) => {
        this.visible = false;
      });

    this.onStoreChange();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });

    combineLatest([
      this.userAgentService.getCRMTenantProspectOption.pipe(debounceTime(500)),
      this.userService.searchText$.pipe(distinctUntilChanged())
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        tap(([crmStatus, searchText]) => {
          this.searchValue = searchText?.trim();
          this.paramsGetList = {
            ...this.paramsGetList,
            crmStatus,
            search: this.searchValue ?? ''
          };
        })
      )
      .subscribe(() => {
        this.dispatchPayloadChange(this.paramsGetList);
      });
    this.userInfoDrawerService.sendMsg$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res.state) {
          this.visible = false;
        }
      });
  }

  private dispatchPayloadChange(payload) {
    this.store.dispatch(
      tenantProspectPageActions.payloadChange({
        payload
      })
    );
  }

  subscribeAddDeletedEmailSecondary() {
    merge(this.userService.isDeletedEmail$, this.userService.isAddEmail$)
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((res) => {
        this.handleRefreshList(true);
      });
  }

  subscribeDeletePhoneNumber() {
    this.userService
      .isDeletePhoneNumber()
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((res) => {
        this.handleRefreshList(true);
      });
  }

  private onStoreChange() {
    const totalItems$ = this.store.select(selectTotalItemsTenantProspect);
    const currentPage$ = this.store.select(selectCurrentPageTenantProspect);
    const totalPages$ = this.store.select(selectTotalPagesTenantProspect);
    const firstInitial$ = this.store.select(selectFristInitialTenantProspect);
    const fetching$ = this.store.select(selectFetchingTenantProspect);
    const fetchingMore$ = this.store
      .select(selectFetchingMoreTenantProspect)
      .pipe(
        tap((fetching) => {
          this.isLoadingMore = fetching;
        })
      );
    const listTenantProspect$ = this.store.select(selectAllTenantProspect).pipe(
      tap((tenantProspect) => {
        this.allListAgencies = [...tenantProspect];

        this.dataTableDataSource =
          this.userAgentService.handleFormatDataListUser(this.allListAgencies);
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
      listTenantProspect$,
      fetchingMore$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([totalItems, currentPage, totalPages]) => {
        const response = {
          totalItems,
          currentPage,
          totalPages
        };
        this.getDataTableV2(response);
      });
  }

  getDataTableV2(response) {
    const { totalPages, totalItems, currentPage } = response;
    this.totalPages = totalPages;
    this.totalItems = totalItems;
    this.pageIndex = currentPage;
  }

  /**
   *
   * @deprecated
   */
  getDataTable(pageIndex: number, pageSize: number) {
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    this.isLoading = pageIndex === 0;

    const { crmStatus, search } = this.paramsGetList;
    this.userAgentApiService
      .getListTenantProspect(pageIndex, pageSize, crmStatus, search)
      .pipe(
        takeUntil(this.unsubscribe),
        finalize(() => {
          this.isLoading = false;
          this.isLoadingMore = false;
        })
      )
      .subscribe((res) => {
        if (!res) return;
        const { listAgencies, totalPages, totalItems, currentPage } = res || {};

        this.allListAgencies = [
          ...(currentPage === 0 ? [] : this.allListAgencies),
          ...listAgencies
        ];

        this.dataTableDataSource =
          this.userAgentService.handleFormatDataListUser(this.allListAgencies);
        this.totalPages = totalPages;
        this.totalItems = totalItems;
        this.pageIndex = currentPage;
      });
  }

  handleRefreshList(event) {
    this.store.dispatch(
      tenantProspectPageActions.payloadChange({
        payload: this.paramsGetList
      })
    );
  }

  handleEventClickRow(event: eventData) {
    this.currentDataUser = event.data;
    this.visible = false;
    switch (event.type) {
      case EActionUserType.ADD_MAIL:
        this.CommonComponentAgentUser.userProperties = event.data;
        this.CommonComponentAgentUser.handleOpenModal(EActionUserType.ADD_MAIL);
        break;
      case EActionUserType.SEND_MSG:
        this.CommonComponentAgentUser.selectedUser = event.data;
        this.CommonComponentAgentUser.createNewConversationConfigs = {
          ...this.CommonComponentAgentUser.createNewConversationConfigs,
          'body.tinyEditor.isShowDynamicFieldFunction': true,
          'otherConfigs.isProspect': true,
          'otherConfigs.createMessageFrom': ECreateMessageFrom.CONTACT,
          'body.prefillReceiversList':
            this.CommonComponentAgentUser.selectedUser.map((item) => ({
              id: item?.userId,
              propertyId: item?.propertyId
            })) as ISelectedReceivers[]
        };
        this.CommonComponentAgentUser.handleOpenModal(EActionUserType.SEND_MSG);
        break;
      case EActionUserType.DELETE_SECONDARY_EMAIL:
        this.CommonComponentAgentUser.detectActionType =
          EActionUserType.DELETE_SECONDARY_EMAIL;
        this.CommonComponentAgentUser.emailOnOption = event.data;
        this.CommonComponentAgentUser.textConfirm = {
          ...this.CommonComponentAgentUser.textConfirm,
          title: `Are you sure you want to delete the email ${event.data?.email}`,
          contentText: ''
        };
        this.CommonComponentAgentUser.handleOpenModal(
          EActionUserType.DELETE_SECONDARY_EMAIL
        );
        break;
      case EActionUserType.DELETE_SECONDARY_PHONE:
        this.CommonComponentAgentUser.phoneOnOption = event.data;
        this.CommonComponentAgentUser.detectActionType =
          EActionUserType.DELETE_SECONDARY_PHONE;
        const phoneNumberFormatted = this.phoneNumberFormatPipe.transform(
          event?.data?.phoneNumber
        );
        this.CommonComponentAgentUser.textConfirm = {
          ...this.CommonComponentAgentUser.textConfirm,
          title: `Are you sure you want to delete the phone ${phoneNumberFormatted}`,
          contentText: ''
        };
        this.CommonComponentAgentUser.handleOpenModal(
          EActionUserType.DELETE_SECONDARY_PHONE
        );
        break;

      case EActionUserType.PROPERTY:
        this.visiblePropertyProfile = true;
        break;

      default:
        this.visible = true;
        break;
    }
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  ngOnDestroy(): void {
    this.store.dispatch(tenantProspectPageActions.exitPage());
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  protected readonly ETypePage = ETypePage;
}
