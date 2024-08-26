import { debounceTime, takeUntil } from 'rxjs/operators';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  AgencyConsoleSetting,
  ResultAgenciesConsoleSetting
} from '@shared/types/agency.interface';
import { CompanyConsoleSettingService } from '@/app/console-setting/agencies/services/company-console-setting.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { CurrentUser } from '@shared/types/user.interface';
import { Subject, switchMap, combineLatest } from 'rxjs';
import {
  AgencyConsoleSettingPopupAction,
  EAgencyPlan,
  EConsoleFilterParams,
  EConsoleFilterTypes,
  SubscriptionStatus
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ToastrService } from 'ngx-toastr';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { IAllRegionsData } from '@/app/console-setting/agencies/utils/console.type';
import { ECrmType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'agencies-view-page',
  templateUrl: './agencies-view-page.component.html',
  styleUrls: ['./agencies-view-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AgenciesViewPageComponent implements OnInit {
  public readonly agencyPlan = EAgencyPlan;
  private unsubscribe = new Subject<void>();
  public agenciesList: AgencyConsoleSetting[] = [];
  public currentPage: number = 1;
  public totalPage: number = 0;
  public showNewEditModal: boolean = false;
  public scrollContainer: string = '.table-wrapper';
  public isLoading: boolean = true;
  public skeletonLoadingRowsNumber: Array<number>;
  public skeletonLoadingColumsNumber: Array<number> = Array(9);
  public currentUser: CurrentUser;
  public paramsGetList = {
    crm: '',
    feartures: ''
  };
  public queryString: string = '';
  public allRegionsData: IAllRegionsData;
  public propertyTree = ECrmType.PROPERTY_TREE;
  public selectedRowId: string = '';

  constructor(
    private _agencyConsoleSettingService: CompanyConsoleSettingService,
    private userService: UserService,
    private toastService: ToastrService,
    private dashboardApiService: DashboardApiService,
    private companyService: CompanyService
  ) {}

  get searchKeyWord() {
    return this._agencyConsoleSettingService.searchText;
  }

  set searchKeyWord(value: string) {
    this._agencyConsoleSettingService.searchText = value;
  }

  ngOnInit(): void {
    this.userService
      .getUserDetail()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((user) => {
        this.currentUser = user;
      });
    this.handleSearch();
    this.agenciesList.forEach((agency) => {
      agency.agencies = this._agencyConsoleSettingService.sortAgenciesByName(
        agency.agencies
      );
    });
  }

  handleSearch() {
    this._agencyConsoleSettingService.searchText$
      .pipe(
        takeUntil(this.unsubscribe),
        debounceTime(500),
        switchMap((keyWord) => {
          this.startLoading();
          return combineLatest([
            this._agencyConsoleSettingService.getAgenciesList(
              keyWord?.trim()?.toLowerCase() || '',
              this.queryString
            ),
            this._agencyConsoleSettingService.getListOfCustomers()
          ]);
        })
      )
      .subscribe(([agencies, customers]) => {
        this.isLoading = false;
        agencies.results.forEach((agency) => {
          agency.customer = customers?.some(
            (customer) => customer?.id === agency?.customer?.id
          )
            ? agency?.customer
            : null;
        });
        this.companyService.setCompanies(agencies.results);
        this.setVariableFromResponse(agencies || null);
      });
  }

  public openPopupNewAgency() {
    this.showNewEditModal = true;
    this._agencyConsoleSettingService.setNewEditModalData({
      action: AgencyConsoleSettingPopupAction.CREATE,
      data: null
    });
  }

  public onClosePopup(onSaveOrEdit: AgencyConsoleSettingPopupAction) {
    this.showNewEditModal = false;
    this.selectedRowId = '';
    if (onSaveOrEdit === AgencyConsoleSettingPopupAction.CREATE) {
      this.toastService.success('Agency added');
    }
    this._agencyConsoleSettingService.setNewEditModalData(null);
    onSaveOrEdit && (this.searchKeyWord = '');
  }

  public openPopupEditAgency(agency: AgencyConsoleSetting) {
    if (this.currentUser?.isAdministrator) {
      this._agencyConsoleSettingService.setNewEditModalData({
        action: AgencyConsoleSettingPopupAction.EDIT,
        data: agency
      });
      this.showNewEditModal = true;
      this.selectedRowId = agency.id;
    }
  }

  public appendData() {
    if (this.currentPage < this.totalPage) {
      this._agencyConsoleSettingService
        .getAgenciesList(
          this.searchKeyWord?.trim()?.toLowerCase(),
          this.queryString,
          this.currentPage + 1
        )
        .subscribe((res: ResultAgenciesConsoleSetting) => {
          if (res) {
            this.setVariableFromResponse(res);
          }
        });
    }
  }

  private setVariableFromResponse(
    response: ResultAgenciesConsoleSetting,
    isAppend: boolean = false
  ) {
    this.currentPage = response?.page;
    this.totalPage = response?.totalPages;
    if (isAppend) {
      this.agenciesList = [...this.agenciesList, ...response?.results];
    } else {
      this.agenciesList = response?.results;
    }
    this.agenciesList = this.agenciesList.map((agency) => ({
      ...agency,
      subscriptions: agency?.subscriptions?.map((item) => ({
        ...item,
        displayName: item?.metadata?.Name || item?.id,
        deleted:
          !agency.customer ||
          item?.deleted ||
          item?.status === SubscriptionStatus.canceled
      }))
    }));
  }

  private startLoading() {
    this.isLoading = true;
    this.skeletonLoadingRowsNumber = Array(
      Math.floor((window.innerHeight - 144) / 80)
    );
  }

  openURL(url: string) {
    window.open(url, '_blank');
  }

  handleItemsSelected(event): void {
    let paramKey;
    let paramValue;

    switch (event.type) {
      case EConsoleFilterTypes.CRM:
        paramKey = EConsoleFilterParams.CRM;
        paramValue =
          this._agencyConsoleSettingService.handleConsoleAgencyTextParamChange(
            event.items
          );
        break;
      case EConsoleFilterTypes.FEATURES:
        paramKey = EConsoleFilterParams.FEATURES;
        paramValue =
          this._agencyConsoleSettingService.handleConsoleAgencyTextParamChange(
            event.items
          );
        break;
    }

    this.paramsGetList = {
      ...this.paramsGetList,
      [paramKey]: paramValue
    };

    this.queryString = this._agencyConsoleSettingService.combineToStringParams(
      this.paramsGetList
    );

    //reload agencies list
    this.searchKeyWord = this.searchKeyWord;
  }

  public sliceFeatures(features: string): string {
    if (features.length > 3) {
      return features.slice(0, 3);
    } else {
      return features;
    }
  }

  public noDisplayFeatures(features: string) {
    if (features.length > 3) {
      return features.slice(3);
    }
    return [];
  }

  copyToClipboard(data) {
    if (!data) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(data).then(() => {
        this.toastService.success('Email copied');
      });
    } else {
      this.toastService.error('Browser does not support copy to clipboard');
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
