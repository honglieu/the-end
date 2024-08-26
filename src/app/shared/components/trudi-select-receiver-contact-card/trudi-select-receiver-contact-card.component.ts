import { crmStatusType } from '@shared/enum/supplier.enum';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { userType } from '@trudi-ui';
import { MAP_TYPE_RECEIVER_TO_DISPLAY } from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import { EContactStatus } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import uuid4 from 'uuid4';
import { isEqual } from 'lodash-es';

@Component({
  selector: 'trudi-select-receiver-contact-card',
  templateUrl: './trudi-select-receiver-contact-card.component.html',
  styleUrls: ['./trudi-select-receiver-contact-card.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiSelectReceiverContactCardComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrudiSelectReceiverContactCardComponent
  implements OnInit, OnChanges, ControlValueAccessor, AfterViewInit
{
  @ViewChild('pseudoTemplate', { static: true }) pseudoTemplate: ElementRef;

  // TODO: remove this, move to common select component
  @ViewChild(NgSelectComponent) ngSelectReceiver: NgSelectComponent;
  @Input() items: ISelectedReceivers[] = [];
  @Input() bindLabel: string;
  @Input() bindValue: string;
  @Input() iconTemplate: string;
  @Input() textTemplate: string = 'TO';
  @Input() extraCls: string = '';
  @Input() isAddItem: boolean = false;
  @Input() isHiddenLastChild: boolean = false;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() lazyLoad: boolean = false;
  @Input() isSelectedProperty: boolean;
  @Input() disabledOnlyCheckbox: boolean;
  @Input() isPolicy: boolean = false;
  @Input() isOutOfOffice: boolean = false;
  @Input() compareWith: (a, b) => boolean;
  @Input() totalReceiver: number;
  @Output() nextPage = new EventEmitter();
  @Output() search = new EventEmitter();
  @Output() clearAll = new EventEmitter();
  @Output() handleShowArchivedContacts = new EventEmitter();
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  searchTerm: string = '';
  EUserPropertyType = EUserPropertyType;
  selectedValue: any[] = [];
  virtualScroll: boolean = true;
  isRmEnvironment: boolean = false;
  pipeType = userType;
  crmStatusType = crmStatusType;
  private unsubscribe = new Subject<void>();
  public MAP_TYPE_RECEIVER_TO_DISPLAY = MAP_TYPE_RECEIVER_TO_DISPLAY;
  public EContactStatus = EContactStatus;
  public selected$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  constructor(
    public cdr: ChangeDetectorRef,
    private dashboardAgencyService: DashboardAgencyService,
    private companyService: CompanyService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.virtualScroll = this.items && this.items.length > 10;
    }
    if (changes['items']?.currentValue) {
      this.companyService
        .getCurrentCompany()
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((agency) => {
          this.isRmEnvironment =
            this.dashboardAgencyService.isRentManagerCRM(agency);
          if (this.isRmEnvironment) {
            // variable seenIdPropertyPairs check coincide with each other id and other propertyId
            const seenIdPropertyPairs = {};
            this.items = this.items?.reduce((result, item) => {
              const idPropertyPair = `${item.id}-${item.propertyId}`;
              if (!seenIdPropertyPairs[idPropertyPair]) {
                seenIdPropertyPairs[idPropertyPair] = true;
                const typeInRm =
                  item.type === EUserPropertyType.TENANT_UNIT ||
                  item.type === EUserPropertyType.TENANT_PROPERTY
                    ? EUserPropertyType.TENANT_RM
                    : item.type;
                result.push({ ...item, typeInRm });
              }
              return result;
            }, []);

            const orderKeyType = [
              EUserPropertyType.LANDLORD,
              EUserPropertyType.TENANT_RM,
              EUserPropertyType.TENANT_PROSPECT,
              EUserPropertyType.LANDLORD_PROSPECT,
              EUserPropertyType.SUPPLIER,
              EUserPropertyType.OTHER
            ];
            this.items.sort(
              (a, b) =>
                orderKeyType.indexOf(a.typeInRm as EUserPropertyType) -
                orderKeyType.indexOf(b.typeInRm as EUserPropertyType)
            );
          }
          this.cdr.markForCheck();
        });
    }
  }

  onInput(value: string): void {
    this.isHiddenLastChild = value.length > 0;
  }

  writeValue(value: any): void {
    this.selectedValue = value;
    if (value?.length) {
      this.cdr.markForCheck();
    }
    this.onChange(value);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnInit(): void {
    this.calculatePseudoStyle();
  }

  ngAfterViewInit() {
    this.calculate();
  }

  onModelChange($event) {
    this.onChange($event);
  }

  clearSearchTerm() {
    if (this.searchTerm?.length) {
      this.searchTerm = '';
      this.search.emit(this.searchTerm);
    }
  }

  calculate() {
    if (this.pseudoTemplate && this.ngSelectReceiver) {
      this.pseudoTemplate.nativeElement.removeAttribute('style');
      const width = this.iconTemplate
        ? 20
        : this.pseudoTemplate.nativeElement.clientWidth;
      const valueContainer = this.ngSelectReceiver.element.querySelector(
        '.ng-value-container'
      );
      const hasVaLue =
        this.ngSelectReceiver.element.querySelector('.ng-has-value');
      valueContainer?.removeAttribute('style');
      if (valueContainer) {
        valueContainer.setAttribute('style', `padding-left:${width + 8}px`);
      }

      if (hasVaLue) {
        this.pseudoTemplate.nativeElement.style.top = '24px';
      }
    }
  }

  calculatePseudoStyle() {
    if (this.selectedValue.length > 0) {
      this.pseudoTemplate.nativeElement.removeAttribute('style');
      if (this.pseudoTemplate && this.ngSelectReceiver) {
        this.pseudoTemplate.nativeElement.setAttribute('style', 'top: 24px');
      }
    }
  }

  customSearchFnFake(term: string, item: any) {
    return true;
  }

  customSearchFn(term: string, item: any) {
    const valueSearch = item.firstName?.trim() + ' ' + item.lastName?.trim();
    const searchByName =
      valueSearch.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    const searchByProperty =
      item?.streetLine?.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    const searchByEmail =
      item?.email?.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    const searchByContactType =
      item?.contactType
        ?.replace('_', ' ')
        .toLowerCase()
        .indexOf(term.trim().toLowerCase()) > -1;
    return (
      searchByName || searchByProperty || searchByEmail || searchByContactType
    );
  }

  onSearch(data) {
    if (data?.term?.trim() === this?.searchTerm?.trim()) return;
    this.searchTerm = data.term.trim();
    this.search.emit(this.searchTerm);
    if (data.items.length <= 10) {
      // workaround fix bug height of ng-select
      const dropdownPanelElement = this.ngSelectReceiver.element.querySelector(
        '.ng-dropdown-panel-items'
      );
      dropdownPanelElement?.children[1].setAttribute(
        'style',
        `transform: unset`
      );
      this.virtualScroll = false;
    } else {
      this.virtualScroll = true;
    }
  }

  handleClear(item) {
    this.selectedValue = this.selectedValue?.filter((value) =>
      this.isPolicy ? value.id !== item.id : !isEqual(value, item)
    );
    this.onChange(this.selectedValue);
  }

  addEmail = (email) => {
    const uuid = uuid4();
    // use this because the EMAIL_PATTERN test fail on 'a@gmail.com'
    const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    const isValid = emailPattern.test(email.trim());
    this.clearSearchTerm();
    return {
      id: uuid,
      isPrimary: true,
      isValid,
      type: EUserPropertyType.EXTERNAL,
      email: email.trim(),
      firstName: null,
      lastName: null,
      inviteSent: null,
      lastActivity: null,
      phoneNumber: null,
      offBoardedDate: null,
      streetLine: null
    };
  };

  urlImg(userPropertyType: EUserPropertyType) {
    switch (userPropertyType) {
      case EUserPropertyType.LANDLORD:
        return '/assets/icon/check-octo-landlord.svg';
      case EUserPropertyType.TENANT:
      case EUserPropertyType.TENANT_PROPERTY:
      case EUserPropertyType.TENANT_UNIT:
        return '/assets/icon/check-octo-tenant.svg';
      case EUserPropertyType.SUPPLIER:
        return '/assets/icon/gold_star.svg';
      default:
        return '';
    }
  }

  textHeader(userPropertyType: EUserPropertyType) {
    switch (userPropertyType) {
      case EUserPropertyType.TENANT_PROSPECT:
        return 'TENANT PROSPECT';
      case EUserPropertyType.LANDLORD_PROSPECT:
        return 'OWNER PROSPECT';
      case EUserPropertyType.OTHER:
        return 'OTHER CONTACTS';
      case EUserPropertyType.LANDLORD:
        return EUserPropertyType.OWNER;
      case EUserPropertyType.TENANT_RM:
        return 'TENANT';
      default:
        return userPropertyType;
    }
  }

  trackByFn(item: ISelectedReceivers) {
    return (
      item.id +
      item.userPropertyId +
      (item.secondaryEmail?.id || item.secondaryEmailId || '')
    );
  }

  handleClearAll() {
    if (!this.selectedValue?.length) return;
    this.clearAll.emit();
  }

  onHandleShowArchivedContacts(event) {
    this.handleShowArchivedContacts.emit(event);
  }

  @HostListener('document:click', ['$event'])
  clickEvent(event) {
    if (event.target.classList.contains('ng-option-selected')) {
      this.clearSearchTerm();
    }
  }

  ngOnDestroy() {
    this.selected$.next(null);
    if (this.ngSelectReceiver) {
      this.ngSelectReceiver.element
        .querySelector('.ng-value-container')
        .removeAttribute('style');
    }
    if (this.pseudoTemplate) {
      this.pseudoTemplate.nativeElement.removeAttribute('style');
    }
  }
}
