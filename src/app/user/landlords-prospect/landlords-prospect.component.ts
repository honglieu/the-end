import { Component, OnInit, ViewChild } from '@angular/core';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  merge,
  takeUntil,
  tap
} from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { UserService } from '@services/user.service';
import {
  IAgency,
  UserProperty
} from '@shared/types/users-by-property.interface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { UserAgentApiService } from '@/app/user/services/user-agent-api.service';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import { EActionUserType, ETypePage } from '@/app/user/utils/user.enum';
import {
  ParamsTenantLandlordsProspect,
  TABLE_COLUMN_LANDLORDS_PROSPECT_RM,
  eventData
} from '@/app/user/utils/user.type';

import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { AppCommonAgentUserComponent } from '@/app/user/shared/components/common-agent-user-component/common-agent-user-component.component';
import { CompanyService } from '@services/company.service';
import { UserInfoDrawerService } from '@/app/user/shared/components/drawer-user-info/services/user-info-drawer.service';
import { Store } from '@ngrx/store';
import { ownerProspectPageActions } from '@core/store/contact-page/owner-prospect/actions/owner-prospect-page.actions';
import {
  selectAllOwnerProspect,
  selectCurrentPageOwnerProspect,
  selectFetchingMoreOwnerProspect,
  selectFetchingOwnerProspect,
  selectFirstInitialOwnerProspect,
  selectTotalItemsOwnerProspect,
  selectTotalPagesOwnerProspect
} from '@core/store/contact-page/owner-prospect/selectors/owner-prospect.selectors';
import { SharedService } from '@services/shared.service';
import uuid4 from 'uuid4';

@Component({
  selector: 'landlords-prospect',
  templateUrl: './landlords-prospect.component.html',
  styleUrls: ['./landlords-prospect.component.scss']
})
export class LandlordsProspectComponent implements OnInit {
  @ViewChild(AppCommonAgentUserComponent)
  CommonComponentAgentUser: AppCommonAgentUserComponent;
  private unsubscribe = new Subject<void>();
  public dataTableDataSource: any[] = [];
  public totalItems: number;
  public totalPages: number;
  public tableColumns = TABLE_COLUMN_LANDLORDS_PROSPECT_RM;
  public activeMobileApp = false;
  public pageSize: number = 20;
  public isLoading: boolean = true;
  public typePage = ETypePage;
  public searchValue: string = '';
  public pageIndex: number = 0;
  public isRmEnvironment: boolean = false;
  public isLoadingMore: boolean = false;
  public allListAgencies = [];
  public visible: boolean = false;
  public currentDataUser: UserProperty;
  public paramsGetList: ParamsTenantLandlordsProspect = {
    page: 0,
    size: 20,
    crmStatus: [],
    search: ''
  };
  public visiblePropertyProfile = false;

  constructor(
    private userAgentService: UserAgentService,
    private userService: UserService,
    private agencyService: AgencyService,
    private userAgentApiService: UserAgentApiService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    private companyService: CompanyService,
    private sharedService: SharedService,
    private userInfoDrawerService: UserInfoDrawerService,
    private store: Store
  ) {}

  ngOnInit() {
    this.sharedService
      .isGlobalSearching$()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((_) => {
        this.visible = false;
      });
    this.subscribeAddDeletedEmailSecondary();
    this.subscribeDeletePhoneNumber();
    this.onStoreChange();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });

    combineLatest([
      this.userAgentService.getcrmLandlordProspectOption.pipe(
        debounceTime(500)
      ),
      this.userService.getSearchText().pipe(distinctUntilChanged())
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        tap(([crmStatus, searchText]) => {
          this.searchValue = searchText?.trim();
          this.paramsGetList = {
            ...this.paramsGetList,
            page: 0,
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
      ownerProspectPageActions.payloadChange({
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
    const totalItems$ = this.store.select(selectTotalItemsOwnerProspect);
    const currentPage$ = this.store.select(selectCurrentPageOwnerProspect);
    const totalPages$ = this.store.select(selectTotalPagesOwnerProspect);
    const firstInitial$ = this.store.select(selectFirstInitialOwnerProspect);
    const fetching$ = this.store.select(selectFetchingOwnerProspect);

    const fetchingMore$ = this.store
      .select(selectFetchingMoreOwnerProspect)
      .pipe(
        tap((fetching) => {
          this.isLoadingMore = fetching;
        })
      );
    const listOwnerProspect$ = this.store.select(selectAllOwnerProspect);

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
      listOwnerProspect$,
      fetchingMore$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([totalItems, currentPage, totalPages, userProperties]) => {
        const response = {
          totalItems,
          currentPage,
          totalPages,
          userProperties
        };
        this.getDataTableV2(response);
      });
  }
  getDataTableV2(response) {
    const { totalPages, totalItems, currentPage } = response;
    this.dataTableDataSource = [response];
    this.totalItems = totalItems;
    this.totalPages = totalPages;
    this.pageIndex = currentPage;
    this.allListAgencies = [...this.dataTableDataSource];

    this.dataTableDataSource = this.handleFormatDataListUser(
      this.allListAgencies
    );
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
      .getOwnerProspect(pageIndex, pageSize, crmStatus ?? [], search)
      .pipe(
        takeUntil(this.unsubscribe),
        finalize(() => {
          this.isLoading = false;
          this.isLoadingMore = false;
        })
      )
      .subscribe((res) => {
        if (!res) return;
        this.isLoading = false;
        const { totalItems, totalPages, currentPage } = res || {};
        this.dataTableDataSource = [res];
        this.totalItems = totalItems;
        this.totalPages = totalPages;
        this.pageIndex = currentPage;
        this.allListAgencies = [
          ...(currentPage === 0 ? [] : this.allListAgencies),
          ...this.dataTableDataSource
        ];

        this.dataTableDataSource = this.handleFormatDataListUser(
          this.allListAgencies
        );
      });
  }

  handleRefreshList(status) {
    if (status) {
      this.dispatchPayloadChange(this.paramsGetList);
    }
  }

  handleFormatDataListUser(listData: IAgency[]) {
    return listData.map((item) => ({
      dependencies: item.userProperties.map((userProperty) => ({
        uuid: uuid4(),
        status: userProperty.status,
        email: userProperty.email,
        userId: userProperty.userId,
        unconfirmedChangeEmail: userProperty.unconfirmedChangeEmail,
        firstName: userProperty.firstName || '',
        lastName: userProperty.lastName || '',
        phoneNumbers: userProperty.phoneNumbers || [],
        secondaryPhones: userProperty.secondaryPhones || [],
        secondaryEmails: userProperty.secondaryEmails || [],
        numUnit: userProperty?.source?.['numUnit']?.toString(),
        isChecked: false,
        displayStatus: userProperty.displayStatus || '',
        userMessengers: userProperty.userMessengers || [],
        userWhatsApps: userProperty.userWhatsApps || []
      }))
    }));
  }

  handleEventClickRow(event: eventData) {
    this.currentDataUser = event?.data;
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

  ngOnDestroy(): void {
    this.store.dispatch(ownerProspectPageActions.exitPage());
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
