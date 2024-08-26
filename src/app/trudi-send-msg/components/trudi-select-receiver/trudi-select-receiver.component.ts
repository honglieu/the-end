import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { EMAIL_PATTERN } from '@services/constants';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { userType } from '@trudi-ui';
import {
  ISelectedReceivers,
  ISendMsgConfigs,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  ECreateMessageFrom,
  EReceiverType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY,
  MAP_TYPE_RECEIVER_TO_DISPLAY,
  MAP_TYPE_RECEIVER_TO_LABEL
} from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import { IGetListContactTypeResponse } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { ICommunicationStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { EMessageComeFromType } from '@shared/enum/messageType.enum';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { CompanyService } from '@services/company.service';
import uuid4 from 'uuid4';

@Component({
  selector: 'trudi-select-receiver',
  templateUrl: './trudi-select-receiver.component.html',
  styleUrls: ['./trudi-select-receiver.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiSelectReceiverComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrudiSelectReceiverComponent
  implements OnInit, OnChanges, ControlValueAccessor
{
  @ViewChild('pseudoTemplate', { static: true }) pseudoTemplate: ElementRef;

  // TODO: remove this, move to common select component
  @ViewChild(NgSelectComponent) ngSelectReceiver: NgSelectComponent;
  @Input() items: ISelectedReceivers[] = [];
  @Input() bindLabel: string;
  @Input() bindValue: string;
  @Input() iconTemplate: string;
  @Input() textTemplate: string = '';
  @Input() placeholder: string = 'Search name, email or property address';
  @Input() extraCls: string = '';
  @Input() isAddItem: boolean = false;
  @Input() isHiddenLastChild: boolean = false;
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() lazyLoad: boolean = false;
  @Input() totalReceiver: number;
  @Input() compareWith: (a, b) => boolean;
  @Input() sendMsgType: ISendMsgType = null;
  @Input() isShowContactType: boolean = false;
  @Input() listContactTypes: IGetListContactTypeResponse[] = [];
  @Input() isPrefillSelected: boolean = false;
  @Input() prefillData: ICommunicationStep;
  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Output() nextPage = new EventEmitter();
  @Output() search = new EventEmitter();
  @Output() clearAll = new EventEmitter();
  @Output() triggerEventChange = new EventEmitter();
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  searchTerm: string = '';
  EUserPropertyType = EUserPropertyType;
  selectedValue: any[] = [];
  virtualScroll: boolean = true;
  isRmEnvironment: boolean = false;
  pipeType = userType;
  private unsubscribe = new Subject<void>();
  public LIST_RECEIVER_TYPE = [
    {
      label: 'Contact type',
      value: EReceiverType.CONTACT_TYPE
    },
    {
      label: 'Individual contact',
      value: EReceiverType.INDIVIDUAL_CONTACT
    }
  ];
  public listReceivers: ISelectedReceivers[] | IGetListContactTypeResponse[] =
    [];
  public currentReceiverType: EReceiverType = EReceiverType.CONTACT_TYPE;
  public ESendMsgType = ISendMsgType;
  public EReceiverType = EReceiverType;
  public EMessageComeFromType = EMessageComeFromType;
  public isHasUnIdentifiedContact: boolean = false;

  get totalSelected() {
    let listReceiver = [...this.selectedValue].filter((item) => {
      if (
        this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.MULTI_MESSAGES
      ) {
        return (
          ![EUserPropertyType.UNIDENTIFIED].includes(
            item.type as EUserPropertyType
          ) && !item?.isEmail
        );
      } else {
        return ![EUserPropertyType.UNIDENTIFIED].includes(
          item.type as EUserPropertyType
        );
      }
    });
    const hasTemporary = listReceiver?.some((item) => item?.isTemporary);
    if (hasTemporary) {
      listReceiver = Array.from(
        new Set(listReceiver?.map((item) => item?.id))
      )?.map((id) => listReceiver?.find((item) => item?.id === id));
    }
    const uniquePairs = new Set(
      listReceiver?.map((item) => `${item.id}-${item.propertyId}`)
    );

    return uniquePairs?.size;
  }

  public MAP_TYPE_RECEIVER_TO_LABEL = MAP_TYPE_RECEIVER_TO_LABEL;
  public MAP_TYPE_RECEIVER_TO_DISPLAY = MAP_TYPE_RECEIVER_TO_DISPLAY;
  public MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY =
    MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY;
  public currentDataSearch = {};
  public previousDataSearch: string = '';
  constructor(
    public cdr: ChangeDetectorRef,
    private dashboardAgencyService: DashboardAgencyService,
    private companyService: CompanyService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['items']?.currentValue &&
      this.currentReceiverType === EReceiverType.INDIVIDUAL_CONTACT
    ) {
      this.virtualScroll = this.items && this.items.length > 10;
    }
    if (changes['items']?.currentValue) {
      if (
        this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.MULTI_MESSAGES
      ) {
        this.items = this.items?.filter(
          (item) =>
            ![EUserPropertyType.UNIDENTIFIED].includes(
              item.type as EUserPropertyType
            ) && !item?.isEmail
        );
      } else {
        this.items = this.items?.filter(
          (item) =>
            ![EUserPropertyType.UNIDENTIFIED].includes(
              item.type as EUserPropertyType
            )
        );
      }
      const hasTemporary = this.items?.some((item) => item?.isTemporary);
      if (hasTemporary) {
        this.items = Array.from(
          new Set(this.items?.map((item) => item?.id))
        )?.map((id) => this.items?.find((item) => item?.id === id));
      }
      if (
        this.isShowContactType &&
        !this.isPrefillSelected &&
        this.currentReceiverType === EReceiverType.INDIVIDUAL_CONTACT
      ) {
        this.listReceivers = this.items;
        return;
      }
      this.companyService
        .getCurrentCompany()
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((company) => {
          this.isRmEnvironment =
            this.dashboardAgencyService.isRentManagerCRM(company);
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
        });
      this.items = this.items?.filter((item) =>
        !item.isAppUser ? !!item.email?.trim() : item
      );
    }
    if (changes['listContactTypes']?.currentValue) {
      this.listReceivers = this.listContactTypes;
      if (this.isPrefillSelected) {
        this.writeValue(
          this.listReceivers.filter(
            (item: IGetListContactTypeResponse) =>
              this.prefillData?.fields?.sendTo?.includes(item.type) &&
              item?.data?.length > 0
          )
        );
      }
    }
  }

  compareWithType(
    receiverA: IGetListContactTypeResponse,
    receiverB: IGetListContactTypeResponse
  ) {
    return receiverA.type === receiverB.type;
  }

  onInput(value: string): void {
    this.isHiddenLastChild = value.length > 0;
  }

  writeValue(value: IGetListContactTypeResponse[]): void {
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
    // this.calculatePseudoStyle();
    this.currentReceiverType = this.isShowContactType
      ? EReceiverType.CONTACT_TYPE
      : null;
    if (this.currentReceiverType) {
      this.placeholder = 'Select contact type';
    }
  }

  ngAfterViewInit() {
    // this.calculate();
  }

  onModelChange($event) {
    this.isHasUnIdentifiedContact = this.selectedValue.some(
      (item) => item?.type === EUserPropertyType.UNIDENTIFIED && !item?.isValid
    );
    this.onChange($event);
    this.triggerEventChange.emit($event);
  }

  handleEnterKeyPress(event: KeyboardEvent) {
    if (event.code === 'Enter') {
      this.handleClickOutsideReceiver();
    }
  }

  clearSearchTerm() {
    if (this.searchTerm?.length) {
      this.searchTerm = '';
      this.currentDataSearch = {};
      this.previousDataSearch = '';
      this.search.emit(this.searchTerm);
      if (this.currentReceiverType === EReceiverType.CONTACT_TYPE) {
        this.listReceivers = this.listContactTypes;
      }
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
    this.searchTerm = data.term?.trim() ?? '';
    this.currentDataSearch = data;
    if (this.currentReceiverType === EReceiverType.CONTACT_TYPE) {
      this.onSearchContactType(this.searchTerm);
    } else {
      let isSameSearchText = this.previousDataSearch === this.searchTerm;
      if (!isSameSearchText) {
        this.search.emit(this.searchTerm);
        this.previousDataSearch = this.searchTerm;
      }
    }
    if (data?.items?.length <= 10) {
      // workaround fix bug height of ng-select
      const dropdownPanelElement = this.ngSelectReceiver.element.querySelector(
        '.ng-dropdown-panel-items'
      );
      dropdownPanelElement?.children[1].setAttribute(
        'style',
        `transform: unset`
      );
      this.virtualScroll = false;
    }
  }

  onSearchContactType(value) {
    if (!value) {
      this.listReceivers = this.listContactTypes;
      return;
    }
    this.listReceivers = this.listContactTypes.filter(
      (item) =>
        item?.label.toLowerCase().includes(value.trim().toLowerCase()) ||
        item?.subLabel?.toLowerCase().includes(value.trim().toLowerCase())
    );
  }

  addEmail = (email) => {
    const uuid = uuid4();
    // use this because the EMAIL_PATTERN test fail on 'a@gmail.com'
    const emailPattern = EMAIL_PATTERN;
    const isValid = emailPattern.test(email.trim());
    this.clearSearchTerm();
    this.ngSelectReceiver.searchInput.nativeElement.value = '';
    return {
      id: uuid,
      isPrimary: true,
      isValid,
      type: EUserPropertyType.UNIDENTIFIED,
      email: email.trim(),
      firstName: null,
      lastName: null,
      inviteSent: null,
      lastActivity: null,
      phoneNumber: null,
      offBoardedDate: null,
      streetLine: null,
      propertyId: null
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

  // TODO: remove this, move to common select component
  handleClickOutsideReceiver() {
    if (this.ngSelectReceiver) {
      this.ngSelectReceiver?.close();
      this.ngSelectReceiver?.blur();
    }
  }

  trackByFn(item: ISelectedReceivers) {
    return (
      item.id +
      item.idUserPropertyGroup +
      (item.secondaryEmail?.id || item.secondaryEmailId || '')
    );
  }

  handleChangeContactType(value) {
    this.handleClearAll();
    this.currentReceiverType = value;
    if (value === EReceiverType.INDIVIDUAL_CONTACT) {
      this.listReceivers = this.items;
      this.placeholder = 'Search name, email or property address';
      this.virtualScroll = this.items && this.items.length > 10;
    } else {
      this.listReceivers = this.listContactTypes;
      this.placeholder = 'Select contact type';
    }
    this.onSearch(this.currentDataSearch);
  }

  goOnToNextPage() {
    if (this.currentReceiverType !== EReceiverType.CONTACT_TYPE) {
      this.nextPage.emit();
    }
  }

  handleClearAll() {
    this.clearAll.emit();
  }

  ngOnDestroy() {
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
