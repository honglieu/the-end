import { EMAIL_PATTERN } from '@services/constants';
import {
  crmStatusType,
  EExcludedUserRole,
  EUserPropertyType
} from '@shared/enum';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import {
  GetListUserPayload,
  GetListUserResponse,
  PrefillUser,
  TrudiSendMsgUserService
} from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { isCheckedReceiversInList } from '@/app/trudi-send-msg/utils/helper-functions';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY } from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import {
  EContactStatus,
  ECreateMessageFrom
} from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ISelectedReceivers,
  ISendMsgConfigs
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  BehaviorSubject,
  Subject,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import uuid4 from 'uuid4';
import { SelectReceiverComponent } from '@shared/components/select-receiver/select-receiver/select-receiver.component';
import { SharedService } from '@services/shared.service';

@Component({
  selector: 'select-specific-receiver',
  templateUrl: './select-specific-receiver.component.html',
  styleUrl: './select-specific-receiver.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TrudiSendMsgUserService]
})
export class SelectSpecificReceiverComponent implements OnInit, OnChanges {
  @ViewChild('selectReceiver', { static: false })
  selectReceiver: SelectReceiverComponent<ISelectedReceivers>;

  isLoading$ = new BehaviorSubject(false);
  private receiversPayload$ = new BehaviorSubject<GetListUserPayload>(null);
  listReceivers: ISelectedReceivers[] = [];
  private destroy$ = new Subject<void>();
  isShowArchivedContacts: boolean = false;
  isAddingTag: boolean = false;
  totalPage: number = 0;
  totalReceiver: number = null;
  MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY = MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY;
  EUserPropertyType = EUserPropertyType;
  crmStatusType = crmStatusType;
  EContactStatus = EContactStatus;
  excludedUserRole = [
    EExcludedUserRole.BELONGS_TO_OTHER_PROPERTIES,
    EExcludedUserRole.UNRECOGNIZED,
    EExcludedUserRole.EMPTY
  ];
  isHasUnIdentifiedContact: boolean = false;
  isConsoleUser: boolean;
  isFocused = false;
  public isOpen: boolean = false;

  @Input() formCtl!: FormControl;
  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() isShowSuffix: boolean = false;
  @Input() isShowCCBtn: boolean = false;
  @Input() isShowBCCBtn: boolean = false;
  @Input() prefixTemplate: string = '';
  @Input() suffixTemplate: TemplateRef<string> = null;
  @Input() selectedProperty: UserPropertyInPeople = null;
  @Input() ignoreUsers: PrefillUser[] = [];
  @Input() taskIds: string[] = [];
  @Input() skipLogicByConversationProperty: boolean = false;
  @Input() recipientsFromConfigs = [];
  @Input() isRmEnvironment: boolean = false;
  @Input() prefillReceivers = [];
  @Input() showPropertyContactOnly = false;
  @Input() filterItemsFn: (items: ISelectedReceivers[]) => ISelectedReceivers[];
  @Input() extraCls: string = '';
  @Input() isAddItem: boolean = false;
  @Input() placeholder: string;
  @Input() suffixPaddingLeft: string = '30px';
  @Input() isOnlySupplierAndOther: boolean = false;
  @Input() appendTo = '';
  @Input() multiLabelTemplate: TemplateRef<HTMLElement> = null;

  @Output() onOpen = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  constructor(
    private trudiSendMsgService: TrudiSendMsgService,
    private trudiSendMsgUserService: TrudiSendMsgUserService,
    private sharedService: SharedService
  ) {}

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
  }

  ngOnInit(): void {
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    this.getReceivers();
  }

  handleSearch(payload) {
    this.fetchMore(payload);
  }

  handleClearAll() {
    this.formCtl.setValue([]);
    this.isHasUnIdentifiedContact = false;
  }

  fetchMore(payload) {
    this.receiversPayload$.next({
      ...(this.receiversPayload$.value || {}),
      ...payload,
      isReplyMsg: !!this.configs.body.replyToMessageId,
      isOnlySupplierAndOther: this.isOnlySupplierAndOther
    });
  }

  getReceivers() {
    if (!this.isConsoleUser) {
      let { agencyId } = this.trudiSendMsgService.getIDsFromOtherService();
      this.handleGetData();
      this.fetchMore({
        userDetails: this.prefillReceivers,
        search: '',
        page: 1,
        agencyId,
        email_null: false,
        limit:
          this.prefillReceivers?.length > 20
            ? this.prefillReceivers.length
            : 20,
        isShowArchivedStatus: this.isShowArchivedContacts,
        propertyId: this.selectedProperty?.id ?? null
      });
    }
  }

  addEmail = (email) => {
    const uuid = uuid4();
    const emailPattern = EMAIL_PATTERN;
    const newEmail =
      email?.trim() || this.selectReceiver.searchTerm?.trim() || '';
    const isInvalid = !emailPattern.test(newEmail);
    this.isAddingTag = true;
    return {
      id: uuid,
      isPrimary: true,
      isInvalid,
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

  handleAddTag = ($event) => {
    if (this.isConsoleUser) {
      this.listReceivers = [];
    }
  };

  compareWith(
    receiverA: ISelectedReceivers,
    receiverB: ISelectedReceivers
  ): boolean {
    const areIdsEqual = receiverA.id === receiverB.id;
    const arePropertyIdsEqual = receiverA.propertyId === receiverB.propertyId;
    const areSecondaryEmailIdsEqual =
      (receiverA.secondaryEmail?.id || receiverA.secondaryEmailId) ==
      (receiverB.secondaryEmail?.id || receiverB.secondaryEmailId);

    return areIdsEqual && arePropertyIdsEqual && areSecondaryEmailIdsEqual;
  }

  handleGetData() {
    this.receiversPayload$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((rs: GetListUserPayload) => {
          this.isLoading$.next(true);
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
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        let updatedData =
          !this.selectReceiver.searchTerm.length && !!this.selectedProperty?.id
            ? res.usersProperty
            : res.users;
        //Show only current property contact
        updatedData =
          this.showPropertyContactOnly && !!this.selectedProperty?.id
            ? res.usersProperty
            : updatedData;
        const listReceivers =
          this.receiversPayload$.value?.page === 1
            ? updatedData
            : [...(this.listReceivers || []), ...(updatedData || [])];
        this.listReceivers = this.filterItemsFn
          ? this.filterItemsFn(listReceivers)
          : listReceivers;
        // this.setDefaultSelected(res.users ?? []);
        this.isLoading$.next(false);
      });
  }

  setDefaultSelected(listReceivers) {
    if (this.formCtl.value?.length) return;
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
    this.listReceivers = tempSelectedValue;
  }

  checkExistConversation(receiver: ISelectedReceivers) {
    const inputReceiver = this.prefillReceivers.find((ir) =>
      isCheckedReceiversInList(receiver, ir, 'id')
    );
    return inputReceiver;
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

  handleShowArchivedContacts(event) {
    this.fetchMore({
      userDetails: [],
      page: 1,
      isShowArchivedStatus: this.isShowArchivedContacts
    });
  }

  blur() {
    this.selectReceiver.blur();
  }

  onFocusAndOpenSelect() {
    this.selectReceiver.onFocusAndOpenSelect();
  }

  focusAndBlur() {
    this.selectReceiver.focusAndBlur();
  }

  handleFocus(isFocused) {
    this.isFocused = isFocused;
  }

  handleVisibleDropdownChange(isOpen: boolean) {
    this.isOpen = isOpen;
    if (isOpen) {
      this.onOpen.emit();
    } else {
      this.onClose.emit();
    }
  }
}
