import { AppMessageListService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-list.service';
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
  TemplateRef,
  ViewChild,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { BehaviorSubject, Subject, map, of, takeUntil, startWith } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  EExcludedUserRole,
  EUserPropertyType,
  EUserPlatformType
} from '@shared/enum/user.enum';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import {
  ISelectedReceivers,
  ISendMsgConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import {
  GetListUserPayload,
  GetListUserResponse,
  TrudiSendMsgUserService
} from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY } from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import { EContactStatus } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';

import { isCheckedReceiversInList } from '@/app/trudi-send-msg/utils/helper-functions';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { HelperService } from '@services/helper.service';

@Component({
  selector: 'message-receiver',
  templateUrl: './message-receiver.component.html',
  styleUrls: ['./message-receiver.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MessageReceiverComponent),
      multi: true
    }
  ],
  exportAs: 'trudiSelectReceiver',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageReceiverComponent
  implements OnInit, OnChanges, AfterViewInit, ControlValueAccessor
{
  @ViewChild('pseudoTemplate') pseudoTemplate: ElementRef;
  @ViewChild('suffixTemp') suffixTemp: ElementRef;

  // TODO: remove this, move to common select component
  @ViewChild(NgSelectComponent) ngSelectReceiver: NgSelectComponent;
  @Input() whiteList: string[] = [];
  @Input() appendTo = '';
  @Input() isAutoFocus = false;
  @Input() bindLabel: string;
  @Input() bindValue: string;
  @Input() iconTemplate: string;
  @Input() prefixTemplate: string = '';
  @Input() placeholder: string = 'Search name, email or property address';
  @Input() extraCls: string = '';
  @Input() isHiddenLastChild: boolean = false;
  @Input() disabled: boolean = false;
  @Input() compareWith: (a, b) => boolean;

  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() suffixTemplate: TemplateRef<string> = null;
  @Input() prefillReceiver: ISelectedReceivers = null;
  @Input() isRmEnvironment: boolean = false;

  @Input() callWhenFocus = false;
  @Input() filterItemsFn: (items: ISelectedReceivers[]) => ISelectedReceivers[];
  @Input() closeOnSelect = true;

  @Output() setPreviewLabel = new EventEmitter();
  @Output() changeValue = new EventEmitter();

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  public searchTerm: string = '';
  public EUserPropertyType = EUserPropertyType;
  public selectedValue: ISelectedReceivers = null;
  public taskPropertyId: string = null;
  public selectedProperty: UserPropertyInPeople = null;
  private unsubscribe = new Subject<void>();
  public listReceivers: ISelectedReceivers[] = [];
  public currentPage: number = 1;
  public totalPage: number = 0;
  public totalReceiver: number = null;
  public isCreateMessageFromTask: boolean = false;

  public isHasUnIdentifiedContact: boolean = false;

  private isLoadingBS = new BehaviorSubject(false);
  private receiversPayloadBS = new BehaviorSubject<GetListUserPayload>(null);

  public MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY =
    MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY;

  public isShowArchivedContacts: boolean = false;
  public EContactStatus = EContactStatus;
  public isFocused: boolean = false;
  public excludedUserRole = [
    EExcludedUserRole.BELONGS_TO_OTHER_PROPERTIES,
    EExcludedUserRole.UNRECOGNIZED,
    EExcludedUserRole.EMPTY
  ];
  public isFocusCalled = false;
  private isHiddenDropdownPanel: boolean = false;
  constructor(
    public cdr: ChangeDetectorRef,
    private trudiSendMsgService: TrudiSendMsgService,
    private trudiSendMsgUserService: TrudiSendMsgUserService,
    private helper: HelperService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private appMessageListService: AppMessageListService
  ) {
    this.isCreateMessageFromTask = this.helper.isInboxDetail;
  }

  onInput(value: string): void {
    this.isHiddenLastChild = value.length > 0;
  }

  writeValue(value: ISelectedReceivers[]): void {
    this.selectedValue = value?.[0];
    if (value) {
      this.cdr.markForCheck();
    }
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['suffixTemplate']) {
      this.updateStyleForPrefix();
    }
    if (changes['configs']) {
      if (this.isCreateMessageFromTask) {
        const taskProperty =
          this.configs.serviceData.taskService.currentTask?.property;
        this.taskPropertyId =
          taskProperty && !taskProperty.isTemporary
            ? taskProperty.id
            : undefined;
        this.fetchMore({
          page: 1,
          propertyId: this.taskPropertyId
        });
      }
    }
  }

  ngOnInit(): void {
    this.trudiSendMsgFormService.property.valueChanges
      .pipe(
        startWith(this.trudiSendMsgFormService.property.value),
        distinctUntilChanged((prev, cur) => {
          return (prev || {}).id === (cur || {}).id;
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((property) => {
        this.selectedProperty = property;
      });
    this.appMessageListService.isHiddenPanel$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isHiddenPanel: boolean) => {
        this.isHiddenDropdownPanel = isHiddenPanel;
      });
    if (!this.callWhenFocus) {
      this.getReceivers();
    }
  }

  ngAfterViewInit() {
    if (this.isAutoFocus) {
      setTimeout(() => {
        this.ngSelectReceiver.focus();
      }, 0);
    }
    this.updateStyleForPrefix();
  }

  onModelChange($event) {
    this.isHasUnIdentifiedContact =
      this.selectedValue?.type === EUserPropertyType.UNIDENTIFIED &&
      !this.selectedValue?.['isValid'];

    let value = $event;
    this.onChange(value ? [value] : []);
    this.handleChangeValue();
  }

  getReceivers() {
    let { agencyId } = this.trudiSendMsgService.getIDsFromOtherService();
    this.handleGetData();
    this.fetchMore({
      userDetails: this.prefillReceiver ? [this.prefillReceiver] : [],
      search: this.searchTerm,
      page: 1,
      agencyId,
      email_null: false,
      limit: 20,
      isShowArchivedStatus: this.isShowArchivedContacts,
      userPlatformType: EUserPlatformType.APP
    });
  }

  checkExistConversation(receiver: ISelectedReceivers) {
    const inputReceiver = isCheckedReceiversInList(
      receiver,
      this.prefillReceiver,
      'id'
    );
    return inputReceiver;
  }

  fetchMore(payload) {
    this.receiversPayloadBS.next({
      ...this.receiversPayloadBS.value,
      ...payload
    });
  }
  public get isLoading$() {
    return this.isLoadingBS.asObservable();
  }

  handleGetData() {
    this.receiversPayloadBS
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((rs: GetListUserPayload) => {
          this.isLoadingBS.next(true);
          if (rs) {
            this.listReceivers = rs.page === 1 ? [] : this.listReceivers;
            return this.trudiSendMsgUserService.getListUserV2(rs);
          }
          return of(null);
        }),
        map((rs) => {
          if (rs) {
            let res = rs as GetListUserResponse;
            this.totalPage = res.totalPage;
            if (!this.totalReceiver) {
              this.totalReceiver = res.totalUser;
            }

            let filteredUsers = this.modifiedReceiverData(res.users);
            let filteredUsersProperty = this.modifiedReceiverData(
              res.userProperties
            );
            return {
              users: filteredUsers,
              usersProperty: filteredUsersProperty
            };
          }
          return {
            users: [],
            usersProperty: []
          };
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        let updatedData = this.taskPropertyId ? res.usersProperty : res.users;
        const listReceivers =
          this.currentPage === 1
            ? updatedData
            : [...(this.listReceivers || []), ...(updatedData || [])];

        this.listReceivers = this.filterItemsFn
          ? this.filterItemsFn(listReceivers)
          : listReceivers;
        if (this.isHiddenDropdownPanel) {
          this.appMessageListService.setIsHiddenPanel(false);
        }
        this.isLoadingBS.next(false);
      });
  }

  modifiedReceiverData(filteredUsers) {
    if (!filteredUsers?.length) return;
    if (this.isRmEnvironment) {
      const seenIdPropertyPairs = {};
      filteredUsers = filteredUsers.reduce((result, item) => {
        const idPropertyPair = `${item.id}-${item.propertyId}-${
          item.secondaryEmail?.id || item.secondaryEmailId || ''
        }`;
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
    }

    filteredUsers = filteredUsers?.filter(
      (item) =>
        ![EUserPropertyType.UNIDENTIFIED, EUserPropertyType.EXTERNAL].includes(
          item.type as EUserPropertyType
        )
    );

    const hasTemporary = filteredUsers?.some((item) => item?.isTemporary);
    if (hasTemporary) {
      filteredUsers = Array.from(
        new Set(filteredUsers?.map((item) => item?.id))
      )?.map((id) => filteredUsers?.find((item) => item?.id === id));
    }

    return filteredUsers;
  }

  goToNextPage() {
    if (this.totalPage < this.currentPage + 1) return;
    this.currentPage += 1;
    this.fetchMore({
      page: this.currentPage
    });
  }

  handleEnterKeyPress(event: KeyboardEvent) {
    if (event.code === 'Enter') {
      this.handleClickOutsideReceiver();
    }
  }

  onCloseSelect() {
    this.clearSearchTerm();
    this.setPreviewLabel.emit(true);
  }

  handleSelectedItem(isSelected: boolean) {
    if (!isSelected) {
      this.clearSearchTerm();
    }
  }

  clearSearchTerm() {
    if (this.searchTerm?.length) {
      this.searchTerm = '';
      this.handleSearchData(this.searchTerm);
    }
  }

  onSearchFn() {
    return true;
  }

  onSearch(data) {
    this.searchTerm = data.term?.trim() ?? '';
    this.handleSearchData(this.searchTerm);
  }

  handleSearchData(searchTerm) {
    const mappedValue = {
      id: this.selectedValue?.id || this.selectedValue?.['userId'],
      propertyId: this.selectedValue?.propertyId
    };
    if (
      this.selectedValue?.secondaryEmail?.id ||
      this.selectedValue?.secondaryEmailId
    ) {
      mappedValue['secondaryEmailId'] =
        this.selectedValue?.secondaryEmail?.id ||
        this.selectedValue?.secondaryEmailId;
    }
    this.currentPage = 1;
    this.fetchMore({
      userDetails: !searchTerm?.length && mappedValue.id ? [mappedValue] : [],
      search: searchTerm,
      page: this.currentPage
    });
  }

  handleClickOutsideReceiver() {
    if (this.ngSelectReceiver) {
      this.ngSelectReceiver?.close();
      this.ngSelectReceiver.blur();
    }
  }

  trackByFn(item: ISelectedReceivers) {
    return (
      item.id +
      (item.propertyId || '') +
      item.idUserPropertyGroup +
      (item.secondaryEmail?.id || item.secondaryEmailId || '')
    );
  }

  handleClearAll() {
    this.isHasUnIdentifiedContact = false;
    this.selectedValue = null;
    this.onChange([]);
    this.handleChangeValue();
  }

  updateStyleForPrefix() {
    if (!this.ngSelectReceiver) return;
    const selectElement = this.ngSelectReceiver.element.querySelector(
      '.ng-value-container'
    ) as HTMLElement;
    if (this.pseudoTemplate) {
      const span = document.createElement('span');
      span.innerText = (
        this.pseudoTemplate.nativeElement as HTMLElement
      ).innerText;
      span.style.position = 'absolute';
      span.style.left = '-9999px';
      document.body.appendChild(span);
      const width = Math.round(span?.getBoundingClientRect()?.width);
      selectElement.style.setProperty(
        'padding-left',
        `${width + 8}px`,
        'important'
      );
      document.body.removeChild(span);
    }
  }

  handleShowArchivedContacts(event) {
    this.fetchMore({
      userDetails: [],
      page: 1,
      isShowArchivedStatus: this.isShowArchivedContacts
    });
  }

  onFocusAndOpenSelect() {
    setTimeout(() => {
      this.ngSelectReceiver.focus();
      if (!this.isHiddenDropdownPanel) {
        this.ngSelectReceiver.open();
      }
      this.isFocused = true;
      if (this.callWhenFocus && !this.isFocusCalled) {
        this.getReceivers();
        this.isFocusCalled = true;
      }
    }, 0);
  }

  handleChangeValue() {
    this.changeValue.emit();
  }

  @HostListener('document:click', ['$event'])
  clickEvent(event) {
    if (event.target.classList.contains('ng-option-selected')) {
      this.clearSearchTerm();
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    if (this.ngSelectReceiver) {
      this.ngSelectReceiver.element
        .querySelector('.ng-value-container')
        .removeAttribute('style');
    }
  }
}
