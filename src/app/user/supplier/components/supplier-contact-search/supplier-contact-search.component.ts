import { Component, ElementRef, OnDestroy } from '@angular/core';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { UserService } from '@services/user.service';
import { crmStatusType } from '@shared/enum/supplier.enum';
import { SupplierContactSearchService } from '@/app/user/supplier/services/supplier-contact-search.service';
import { Agency } from '@shared/types/agency.interface';
import { EFilterType } from '@shared/enum/user.enum';
import { CompanyService } from '@services/company.service';
import { sortAgenciesFn } from '@shared/utils/helper-functions';
import { EKeyFilterContact } from '@shared/enum/filter.enum';
export const crmStatus: { id: number; status: crmStatusType; text: string }[] =
  [
    { id: 1, status: crmStatusType.pending, text: 'Active' },
    { id: 2, status: crmStatusType.archived, text: 'Archived' }
    // { id: 3, status: crmStatusType.deleted, text: 'Deleted' }
  ];

@Component({
  selector: 'supplier-contact-search',
  templateUrl: './supplier-contact-search.component.html',
  styleUrls: ['./supplier-contact-search.component.scss']
})
export class SupplierContactSearchComponent implements OnDestroy {
  public searchText: string = localStorage.getItem('searchText') || '';
  public isClearCRM: boolean = false;
  public selectedCRMStatus =
    parseInt(JSON.parse(localStorage.getItem('SUPPLIER'))?.id) || 1;
  public unsubscribe = new Subject<void>();
  public crmStatus = crmStatus;
  public crmStatusType = crmStatusType;
  public readonly filterType = EFilterType;
  public isPtEnvironment: boolean = true;
  public agencies: Agency[] = [];
  public selectedAgencyIds: string[] = [];
  private destroy$: Subject<void> = new Subject<void>();
  private keyLocalStorageTenantsOwnersContacts: string = 'TENANTS_OWNER';

  constructor(
    private supplierContactSearchService: SupplierContactSearchService,
    private userService: UserService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.userService
      .getSearchText()
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        this.searchText = res;
      }),
      this.initFilterAgencies();
    this.getSelectedAgenciesFromLocalStorage();
    this.supplierContactSearchService
      .getSelectedAgencyIds()
      .pipe(takeUntil(this.destroy$))
      .subscribe((agencyIds) => {
        this.selectedAgencyIds = agencyIds;
      });
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isPtEnvironment = this.companyService.isPropertyTreeCRM(company);
      });
  }

  handleSearch(event) {
    this.userService.setSearchText(event.target.value);
  }

  handleClearSearch(elementRef: ElementRef<HTMLInputElement>) {
    elementRef?.nativeElement?.blur();
    this.userService.setSearchText('');
  }

  crmChanged(event) {
    localStorage.setItem('SUPPLIER', JSON.stringify(event));
    this.selectedCRMStatus = event.id;
    let status = event.status;
    this.supplierContactSearchService.setSelectedCRMStatus(status);
  }

  private initFilterAgencies() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.selectedCRMStatus =
          parseInt(JSON.parse(localStorage.getItem('SUPPLIER'))?.id) || 1;
        this.agencies = company?.agencies ?? [];
        if (this.agencies.length > 1) {
          this.agencies.sort(sortAgenciesFn);
        }
      });
  }

  public changeFilterAgencies(event) {
    if (event.items && event.type === EFilterType.AGENCIES) {
      this.selectedAgencyIds = event.items?.map((agency) => agency.id);
      this.supplierContactSearchService.setSelectedAgencyIds(
        this.selectedAgencyIds
      );
      let tenantsOwnersFilter = this.getTenantsOwnersFilterLocalStorage() || {};
      tenantsOwnersFilter[EKeyFilterContact.AGENCIES] = this.selectedAgencyIds;
      localStorage.setItem(
        this.keyLocalStorageTenantsOwnersContacts,
        JSON.stringify(tenantsOwnersFilter)
      );
    }
  }

  private getSelectedAgenciesFromLocalStorage() {
    const filterTenantsOwnersPage = this.getTenantsOwnersFilterLocalStorage();
    if (filterTenantsOwnersPage) {
      this.selectedAgencyIds =
        filterTenantsOwnersPage[EKeyFilterContact.AGENCIES];
      this.supplierContactSearchService.setSelectedAgencyIds(
        this.selectedAgencyIds
      );
    }
  }

  private getTenantsOwnersFilterLocalStorage() {
    return JSON.parse(
      localStorage.getItem(this.keyLocalStorageTenantsOwnersContacts)
    );
  }

  ngOnDestroy(): void {
    this.supplierContactSearchService.setSelectedCRMStatus(
      JSON.parse(localStorage.getItem('SUPPLIER'))?.status ||
        crmStatusType.pending
    );
    this.destroy$.next();
    this.destroy$.complete();
  }
}
