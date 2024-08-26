import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SharedService } from '@services/shared.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { NgOption } from '@ng-select/ng-select';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { PHONE_PREFIXES } from '@services/constants';
import { CompanyService } from '@services/company.service';
import {
  ICreateSupplierPolicy,
  ISelectContacts
} from '@/app/dashboard/modules/agency-settings/utils/interface';
import { crmStatusType } from '@shared/enum';
import { EmergencyContactsApiService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts-api.service';
import { EmergencyContactsService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts.service';
import { TrudiMultiSelectComponent } from '@trudi-ui';
import { sortSuppliersList } from '@/app/dashboard/modules/agency-settings/utils/functions';

@Component({
  selector: 'select-contacts',
  templateUrl: './select-contacts.component.html',
  styleUrls: ['./select-contacts.component.scss'],
  providers: [
    EmergencyContactsApiService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectContactsComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectContactsComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('addSupplierPopup') addSupplierPopupRef;
  @ViewChild('selectContacts')
  selectContacts: TrudiMultiSelectComponent;
  @Input() items: ISelectContacts[] = [];
  @Input() bindValue: string;
  @Input() bindLabel: string;
  @Input() groupBy: string;
  @Input() placeholder: string = 'Search for contact';
  @Input() clearSearchOnAdd: boolean = false;
  @Input() readonly: boolean = false;
  @Input() dropdownPosition: string = 'auto';
  @Output() focusOut = new EventEmitter();
  @Output() handleOpen = new EventEmitter();
  @Output() eventCallback = new EventEmitter();
  @Output() eventClear = new EventEmitter();
  @Output() eventClearAll = new EventEmitter();
  private destroy$ = new Subject<void>();
  public isRmEnvironment: boolean = false;
  public areaCode: string;
  listItem: ISelectContacts[] = [];
  EUserPropertyType = EUserPropertyType;
  crmStatusType = crmStatusType;
  isShowPopup = false;
  // handle control value accessor for form control value binding to this component
  _selected: ISelectContacts[] = [];
  _disabled: boolean = false;
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(obj: any): void {
    this._selected = obj;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }
  // end handle control value accessor for form control value binding to this component

  constructor(
    private sharedService: SharedService,
    private emergencyContactsService: EmergencyContactsService,
    private emergencyContactsApiService: EmergencyContactsApiService,
    private cdr: ChangeDetectorRef,
    private agencyService: AgencyService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        this.areaCode = this.isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']?.currentValue) {
      this.listItem = [...this.items];
      this.listItem = sortSuppliersList(this.listItem);
      this.cdr.markForCheck();
    }
  }

  handleFocusOut() {
    this.focusOut.emit();
    this.listItem = sortSuppliersList(this.items);
  }

  displayName(firstName: string, lastName: string) {
    return this.sharedService.displayName(firstName, lastName) || '';
  }

  customSearchFn() {
    return true;
  }

  onSearch(event: { term: string; items: ISelectContacts[] }) {
    const dataFilter = this.items.filter((item) => {
      const searchByName = item?.lastName
        ?.trim()
        .toLowerCase()
        .includes(event?.term?.trim().toLowerCase());

      const searchByEmail = item?.email
        ?.trim()
        .toLowerCase()
        .includes(event?.term?.trim().toLowerCase());

      return searchByName || searchByEmail;
    });
    this.listItem = sortSuppliersList(dataFilter);
  }

  addNewSupplier(event: ICreateSupplierPolicy) {
    const params = { ...event };
    this.emergencyContactsApiService.createSupplierPolicies(params).subscribe({
      next: (res) => {
        this.isShowPopup = false;
        this.modalCloseHandler();
        this.eventCallback.emit(res.body);
        this.emergencyContactsService.refreshSupplierLists(
          res.body as ISelectContacts
        );
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (
          err?.status === 400 &&
          err?.error?.message === 'Company name already exists'
        ) {
          this.addSupplierPopupRef?.addNewSupplierForm
            ?.get('companyName')
            .setErrors({ existCompanyName: true });
          this.cdr.markForCheck();
        }
      },
      complete: () => {}
    });
  }

  handleClear(item: NgOption, callback: (value: NgOption) => void) {
    //customized clear item and emit event to parent component
    callback(item);
    this.eventClear.emit();
  }

  modalCloseHandler() {
    setTimeout(() => {
      this.selectContacts.blurNgSelect();
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
