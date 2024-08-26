import {
  AfterViewInit,
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
  TemplateRef,
  ViewChild,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { BehaviorSubject, Subject, map, of, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { EMAIL_PATTERN } from '@services/constants';
import { EExcludedUserRole, EUserPropertyType } from '@shared/enum/user.enum';
import { userType } from '@trudi-ui';
import {
  ISelectedReceivers,
  ISendMsgConfigs,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  EContactStatus,
  ECreateMessageFrom,
  EReceiverType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY,
  MAP_TYPE_RECEIVER_TO_DISPLAY
} from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import {
  GetListUserPayload,
  GetListUserResponse,
  IGetListContactTypeResponse,
  PrefillUser,
  TrudiSendMsgUserService
} from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { ICommunicationStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { EMessageComeFromType } from '@shared/enum/messageType.enum';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { isCheckedReceiversInList } from '@/app/trudi-send-msg/utils/helper-functions';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import uuid4 from 'uuid4';
import { isEqual } from 'lodash-es';
import { crmStatusType } from '@/app/shared/enum';
import { captureMessage } from '@sentry/angular-ivy';

@Component({
  selector: 'trudi-select-receiver-v2',
  templateUrl: './trudi-select-receiver-v2.component.html',
  styleUrls: ['./trudi-select-receiver-v2.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiSelectReceiverV2Component),
      multi: true
    }
  ],
  exportAs: 'trudiSelectReceiver',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrudiSelectReceiverV2Component
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
  @Input() isAddItem: boolean = false;
  @Input() isHiddenLastChild: boolean = false;
  @Input() disabled: boolean = false;
  @Input() compareWith: (a, b) => boolean;
  @Input() sendMsgType: ISendMsgType = null;
  @Input() listContactTypes: IGetListContactTypeResponse[] = [];
  @Input() isPrefillSelected: boolean = false;
  @Input() prefillData: ICommunicationStep;
  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() isShowSuffix: boolean = false;
  @Input() isShowCCBtn: boolean = false;
  @Input() isShowBCCBtn: boolean = false;
  @Input() suffixTemplate: TemplateRef<string> = null;
  @Input() prefillReceivers = [];
  @Input() recipientsFromConfigs = [];
  @Input() isRmEnvironment: boolean = false;
  // TODO: change to targetPropertyId
  @Input() selectedProperty: UserPropertyInPeople = null;
  @Input() ignoreUsers: PrefillUser[] = [];
  @Input() taskIds: string[] = [];
  @Input() skipLogicByConversationProperty: boolean = false;
  @Input() isBulkSend = false; //todo remove
  @Input() callWhenFocus = false;
  @Input() filterItemsFn: (items: ISelectedReceivers[]) => ISelectedReceivers[];
  @Input() closeOnSelect = false;
  @Input() showPropertyContactOnly = false;
  @Output() triggerEventChange = new EventEmitter();
  @Output() clearAll = new EventEmitter();
  @Output() triggerEventBlur = new EventEmitter();
  @Output() setPreviewLabel = new EventEmitter();
  @Output() changeValue = new EventEmitter();

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  public searchTerm: string = '';
  public EUserPropertyType = EUserPropertyType;
  public crmStatusType = crmStatusType;
  public selectedValue = [];
  public pipeType = userType;
  private unsubscribe = new Subject<void>();
  public currentReceiverType: EReceiverType = null;
  public ESendMsgType = ISendMsgType;
  public EReceiverType = EReceiverType;
  public EMessageComeFromType = EMessageComeFromType;
  public listReceivers: ISelectedReceivers[] = [];
  public currentPage: number = 1;
  public totalPage: number = 0;
  public totalReceiver: number = null;
  public selectedValueIds = [];
  public isHasUnIdentifiedContact: boolean = false;
  public isAddingTag: boolean = false;
  get totalSelected() {
    let listReceiver = [...this.selectedValue].filter((item) => {
      if (
        this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.MULTI_MESSAGES
      ) {
        return (
          ![
            EUserPropertyType.UNIDENTIFIED,
            EUserPropertyType.EXTERNAL
          ].includes(item.type as EUserPropertyType) && !item?.isEmail
        );
      } else {
        return ![
          EUserPropertyType.UNIDENTIFIED,
          EUserPropertyType.EXTERNAL
        ].includes(item.type as EUserPropertyType);
      }
    });
    const hasTemporary = listReceiver?.some((item) => item?.isTemporary);
    if (hasTemporary) {
      listReceiver = Array.from(
        new Set(listReceiver?.map((item) => item?.id))
      )?.map((id) => listReceiver?.find((item) => item?.id === id));
    }
    const uniquePairs = new Set(
      listReceiver?.map(
        (item) =>
          `${item.id}-${item.propertyId}-${
            item.secondaryEmail?.id || item.secondaryEmailId || ''
          }`
      )
    );

    return uniquePairs?.size;
  }

  private isLoadingBS = new BehaviorSubject(false);
  private receiversPayloadBS = new BehaviorSubject<GetListUserPayload>(null);
  public MAP_TYPE_RECEIVER_TO_DISPLAY = MAP_TYPE_RECEIVER_TO_DISPLAY;
  public MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY =
    MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY;
  public numberParticipantsDisplay: number = 0;
  public isShowArchivedContacts: boolean = false;
  public EContactStatus = EContactStatus;
  public isFocused: boolean = false;
  public excludedUserRole = [
    EExcludedUserRole.BELONGS_TO_OTHER_PROPERTIES,
    EExcludedUserRole.UNRECOGNIZED,
    EExcludedUserRole.EMPTY
  ];
  public isFocusCalled = false;

  constructor(
    public cdr: ChangeDetectorRef,
    private trudiSendMsgService: TrudiSendMsgService,
    private trudiSendMsgUserService: TrudiSendMsgUserService,
    private trudiSendMsgFormService: TrudiSendMsgFormService
  ) {}

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedProperty']) {
      this.fetchMore({
        page: 1,
        propertyId: this.selectedProperty?.id ?? null
      });
    }

    if (changes['ignoreUsers'] && changes['ignoreUsers'].currentValue) {
      this.fetchMore({
        ignoreUserDetails: this.ignoreUsers
      });
    }

    if (changes['taskIds']) {
      this.fetchMore({
        taskIds: this.taskIds
      });
    }

    if (changes['suffixTemplate']) {
      this.updateStyleForPrefix();
    }
  }

  ngOnInit(): void {
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
    this.isHasUnIdentifiedContact = this.selectedValue.some(
      (item) => item?.type === EUserPropertyType.UNIDENTIFIED && !item?.isValid
    );
    let value = $event;
    this.triggerEventChange.emit(value);
    this.onChange(value);
  }

  getReceivers() {
    let { agencyId } = this.trudiSendMsgService.getIDsFromOtherService();
    this.handleGetData();
    this.fetchMore({
      userDetails: this.prefillReceivers,
      search: this.searchTerm,
      page: 1,
      agencyId,
      email_null: false,
      limit:
        this.prefillReceivers?.length > 20 ? this.prefillReceivers.length : 20,
      isShowArchivedStatus: this.isShowArchivedContacts,
      propertyId: this.selectedProperty?.id ?? null
    });
  }

  setDefaultSelected(listReceivers) {
    if (this.selectedValue.length) return;
    let tempSelectedValue = [];
    listReceivers.forEach((user) => {
      const inputReceiver = this.checkExistConversation(user);
      if (!inputReceiver) return;
      if (
        user.isAppUser ||
        (!user.isAppUser &&
          (!!user.email?.trim() || !!user.secondaryEmail?.email?.trim()))
      ) {
        tempSelectedValue.push(user);
      }
    });
    this.writeValue(tempSelectedValue);
  }

  checkExistConversation(receiver: ISelectedReceivers) {
    const inputReceiver = this.prefillReceivers.find((ir) =>
      isCheckedReceiversInList(receiver, ir, 'id')
    );
    return inputReceiver;
  }

  fetchMore(payload) {
    this.receiversPayloadBS.next({
      ...this.receiversPayloadBS.value,
      ...payload,
      isReplyMsg: !!this.configs.body.replyToMessageId
    });
  }

  public get isLoading$() {
    return this.isLoadingBS.asObservable();
  }

  handleGetData() {
    this.receiversPayloadBS
      .pipe(
        debounceTime(500),
        distinctUntilChanged((previous, current) => {
          return isEqual(
            { ...previous, search: previous?.search?.trim() },
            { ...current, search: current?.search?.trim() }
          );
        }),
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
        let updatedData =
          this.searchTerm.length || !this.selectedProperty?.id
            ? res.users
            : res.usersProperty;
        //Show only current property contact
        updatedData =
          this.showPropertyContactOnly && !!this.selectedProperty?.id
            ? res.usersProperty
            : updatedData;
        const listReceivers =
          this.currentPage === 1
            ? updatedData
            : [...(this.listReceivers || []), ...(updatedData || [])];
        this.listReceivers = this.filterItemsFn
          ? this.filterItemsFn(listReceivers)
          : listReceivers;
        this.setDefaultSelected(res.users ?? []);
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

    if (
      this.configs.otherConfigs.createMessageFrom ===
      ECreateMessageFrom.MULTI_MESSAGES
    ) {
      filteredUsers = filteredUsers?.filter(
        (item) =>
          ![
            EUserPropertyType.UNIDENTIFIED,
            EUserPropertyType.EXTERNAL
          ].includes(item.type as EUserPropertyType) && !item?.isEmail
      );
    } else {
      filteredUsers = filteredUsers?.filter(
        (item) =>
          ![
            EUserPropertyType.UNIDENTIFIED,
            EUserPropertyType.EXTERNAL
          ].includes(item.type as EUserPropertyType)
      );
    }

    const hasTemporary = filteredUsers?.some((item) => item?.isTemporary);
    if (hasTemporary) {
      filteredUsers = Array.from(
        new Set(filteredUsers?.map((item) => item?.id))
      )?.map((id) => filteredUsers?.find((item) => item?.id === id));
    }

    // for case map secondary email to prefill
    if (this.recipientsFromConfigs?.length) {
      filteredUsers.forEach((user) => {
        const selectUser = this.recipientsFromConfigs.find(
          (one) => one.userId === user.id
        );
        const senderEmail = selectUser?.email || user.email;
        user.email =
          !user.email || this.configs.otherConfigs.isShowSecondaryEmail
            ? selectUser?.secondaryEmail || senderEmail
            : senderEmail;
        user.secondaryEmailId = selectUser?.secondaryEmailId || null;
        user.type =
          user.type === EUserPropertyType.LEAD ||
          user.type === EUserPropertyType.MAILBOX
            ? null
            : user.type;
      });
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
    if (event.code !== 'Enter' || !this.ngSelectReceiver) return;
    if (this.isBulkSend) {
      this.ngSelectReceiver.close();
      this.ngSelectReceiver.blur();
    } else {
      if (!this.selectedProperty?.id) {
        this.ngSelectReceiver.close();
      }
    }
  }

  onCloseSelect() {
    this.clearSearchTerm();
    this.setPreviewLabel.emit(true);
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
    this.currentPage = 1;
    this.fetchMore({
      userDetails: !searchTerm?.length
        ? this.selectedValue
            ?.filter(
              (item) => uuid4.valid(item.id || item.userId) && item.propertyId
            )
            .map((item) => {
              const mappedValue = {
                id: item.id || item.userId,
                propertyId: item.propertyId
              };
              if (item.secondaryEmail?.id || item.secondaryEmailId) {
                mappedValue['secondaryEmailId'] =
                  item.secondaryEmail?.id || item.secondaryEmailId;
              }
              return mappedValue;
            })
        : [],
      search: searchTerm,
      page: this.currentPage
    });
  }

  addEmail = (email: string | null) => {
    const uuid = uuid4();
    const emailPattern = EMAIL_PATTERN;
    // sometime we will get `email` with value is null, can use `this.searchTerm` instead
    const newEmail = email?.trim() || this.searchTerm?.trim() || '';
    if (!newEmail) {
      // schedule for avoid blocking main thread
      setTimeout(() => {
        captureMessage('Email is empty', {
          extra: { originEmail: email, searchTerm: this.searchTerm },
          level: 'debug'
        });
      }, 0);
    }
    const isValid = emailPattern.test(newEmail);
    this.isAddingTag = true;
    return {
      id: uuid,
      isPrimary: true,
      isValid,
      type: EUserPropertyType.UNIDENTIFIED,
      email: newEmail,
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

  handleClickOutsideReceiver() {
    if (this.ngSelectReceiver && (this.isBulkSend || !this.isAddingTag)) {
      this.ngSelectReceiver?.close();
      this.ngSelectReceiver.blur();
    }
    this.isAddingTag = false;
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
    if (!this.selectedValue.length) return;
    this.isHasUnIdentifiedContact = false;
    this.clearAll.emit();
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
    if (this.callWhenFocus) {
      setTimeout(() => {
        this.ngSelectReceiver.focus();
        this.ngSelectReceiver.open();
        this.isFocused = true;
        if (!this.isFocusCalled) {
          this.getReceivers();
          this.isFocusCalled = true;
        }
      }, 0);
    } else {
      this.ngSelectReceiver.focus();
      this.ngSelectReceiver.open();
      this.isFocused = true;
    }
  }

  handleChangeValue() {
    this.changeValue.emit();
  }

  clickEvent(event) {
    if (event.target.classList.contains('ng-option-selected')) {
      this.clearSearchTerm();
      this.ngSelectReceiver.searchInput.nativeElement.value = '';
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
