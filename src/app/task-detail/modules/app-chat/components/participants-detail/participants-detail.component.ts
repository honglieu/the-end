import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Subject, filter, finalize, take, takeUntil, tap, timer } from 'rxjs';
import { EInboxAction } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { CompanyService } from '@services/company.service';
import { ConversationService } from '@services/conversation.service';
import { LoadingService } from '@services/loading.service';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { PropertiesService } from '@services/properties.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { EUserInviteStatusType, SocketType } from '@shared/enum/index.enum';
import {
  ECreatedFrom,
  EMessageComeFromType
} from '@shared/enum/messageType.enum';
import { CallTypeEnum } from '@shared/enum/share.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  EParticipantType,
  EUndentifiedType,
  EUserPropertyType,
  ERmCrmStatus
} from '@shared/enum/user.enum';
import { isEmail } from '@shared/feature/function.feature';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { userType } from '@trudi-ui';
import { UserConversation } from '@shared/types/conversation.interface';
import { TaskItem, TaskName } from '@shared/types/task.interface';
import {
  ListTrudiContact,
  OnSearchValueEmitter
} from '@shared/types/trudi.interface';
import {
  PropertyContact,
  UnhappyStatus
} from '@shared/types/unhappy-path.interface';
import { IUserParticipant } from '@shared/types/user.interface';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ESentMsgEvent,
  ETypeMessage,
  ISendMsgResponseV2,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiUserTypeInRmPipe } from '@trudi-ui';

@Component({
  selector: 'participants-detail',
  templateUrl: './participants-detail.component.html',
  styleUrls: ['./participants-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantsDetailComponent implements OnInit, OnChanges {
  @Input() participants;
  @Input() currentConversation: UserConversation;
  @Input() isUnindentifiedEmail: boolean;
  @Input() isUnindentifiedProperty: boolean;
  @Input() isUnindentifiedPhoneNumber: boolean;
  @Input() isUnHappyPath: boolean;
  @Input() currentAgencyId: string;
  @Input() isShowParticipantDrawer: boolean;
  @Input() task: TaskItem;
  @Input() enableCallBtn;
  @Input() prefillToCcBccReceiversList;
  @Output() onCallApp = new EventEmitter();
  @Output() openModal: EventEmitter<void> = new EventEmitter();
  @Input() inviteDeactivate: boolean;
  @Input() callTooltipType;
  @Input() upsellVoiceCall;
  @Input() upsellVideoCall;
  @Input() isConsoleUser: boolean;
  private destroy$ = new Subject();
  public isRmEnvironment: boolean;
  public EUserPropertyType = EUserPropertyType;
  public placeHolderTrudiUnhappy: string = 'Search contact';
  public contactList: ListTrudiContact[] = [];
  public propertyList: PropertyContact[] = [];
  public taskNameList: TaskName[] = [];
  public unhappyStatus: UnhappyStatus = {
    isAssignNewTask: true,
    isConfirmProperty: true,
    confirmContactType: null,
    isConfirmContactUser: false,
    isLandlordFutureWithNoProperty: true
  };
  public pipeType: string = userType.DEFAULT;
  public totalPageContactList?: number;
  public showPopoverProfile: boolean = false;
  public isShowTrudiSendMsg: boolean = false;
  public unhappyPathLoading: boolean = false;
  public isDeletedOrArchived: boolean = false;
  public isReassign: boolean = true;
  public isHiddenPrimary = false;
  public callType = CallTypeEnum;
  public configs;
  public EInboxAction = EInboxAction;
  public participantsActive: Set<string> = new Set();
  readonly EMessageComeFromType = EMessageComeFromType;
  readonly EParticipantType = EParticipantType;
  readonly EConfirmContactType = EConfirmContactType;
  readonly EUndentifiedType = EUndentifiedType;
  readonly TaskStatusType = TaskStatusType;
  typeMessage = ETypeMessage;

  constructor(
    private userService: UserService,
    private taskService: TaskService,
    private agencyService: AgencyService,
    private propertyService: PropertiesService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef,
    private conversationService: ConversationService,
    private userTypeInRmPipe: TrudiUserTypeInRmPipe,
    public loadingService: LoadingService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    private companyService: CompanyService,
    private inboxToolbarService: InboxToolbarService,
    private toastCustomService: ToastCustomService
  ) {}

  ngOnInit(): void {
    this.subscribeCurrentAgency();
  }

  handleShowPopupReassign(messageRecipientId: string) {
    this.participants.forEach((item) => {
      const participantSelected = item?.participants?.find(
        (p) => p.messageRecipientId === messageRecipientId
      );
      if (participantSelected) {
        participantSelected.isReAssign = !participantSelected.isReAssign;
      }
    });
  }

  private getEmailForContactFetch(
    participant: IUserParticipant,
    isConfirm?: boolean,
    reassign?: boolean
  ): string {
    const trudiEmail = participant?.secondaryEmail || participant?.email;

    return ![ECreatedFrom.VOICE_MAIL].includes(participant?.createdFrom) &&
      ((isEmail(trudiEmail) && participant?.isMultipleContact) || isConfirm)
      ? trudiEmail
      : '';
  }

  private getPhoneNumberForContactFetch(
    participant,
    isConfirm?: boolean
  ): string {
    return [ECreatedFrom.VOICE_MAIL].includes(participant?.createdFrom) &&
      (participant?.isMultipleContact || isConfirm)
      ? participant?.phoneNumberFromConversationLog
      : '';
  }

  handleOnGetUnHappyPath(
    event: OnSearchValueEmitter,
    isReassign: boolean,
    participant: IUserParticipant,
    reassign: boolean = false
  ): void {
    const { search, page, limit } = event;
    if (this.shouldFetchProperties(isReassign)) {
      this.fetchTrudiProperties(search);
    } else if (this.shouldFetchContacts(isReassign)) {
      this.fetchTrudiContacts(search, page, limit, participant, reassign);
    } else if (this.shouldFetchTaskNames()) {
      this.fetchTaskNames(search);
    }
  }

  private shouldFetchTaskNames(): boolean {
    return !this.unhappyStatus.isAssignNewTask;
  }

  private fetchTaskNames(search: string): void {
    this.unhappyPathLoading = true;
    this.taskService
      .getTaskNameList(search, TaskType.TASK)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.unhappyPathLoading = false;
        })
      )
      .subscribe((res) => (this.taskNameList = res));
  }

  private shouldFetchProperties(isReassign): boolean {
    return (
      [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER].includes(
        this.unhappyStatus?.confirmContactType as EConfirmContactType
      ) &&
      (!this.unhappyStatus?.isConfirmProperty || isReassign)
    );
  }

  private fetchTrudiContacts(
    search: string,
    page: number,
    limit: number,
    participant: IUserParticipant,
    reassign: boolean = false
  ): void {
    if (this.shouldSkipContactFetch(page)) return;
    this.unhappyPathLoading = true;

    this.userService
      .getListTrudiContact(
        search,
        this.getEmailForContactFetch(participant, false, reassign),
        page,
        limit,
        this.getPhoneNumberForContactFetch(participant)
      )
      .pipe(
        filter((res) => Boolean(res)),
        takeUntil(this.destroy$),
        finalize(() => {
          this.unhappyPathLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((res) => {
        this.updateContactList(res.contacts, participant);
        this.totalPageContactList = res.totalPage;
      });
  }

  private updateContactList(
    contacts: ListTrudiContact[],
    participant: IUserParticipant = null
  ): void {
    const updatedContacts = contacts.map((item) => ({
      ...item,
      fullName: this.sharedService.displayName(item.firstName, item.lastName),
      propertyTypeOrAddress: this.getPropertyTypeOrAddress(item)
    }));

    this.contactList = this.showPopoverProfile
      ? [
          ...this.contactList,
          ...updatedContacts.filter(
            (item) => item.property?.id !== this.currentConversation.propertyId
          )
        ]
      : [...this.contactList, ...updatedContacts];
    this.contactList = this.contactList.filter((item) => {
      return !(
        (participant?.userPropertyId &&
          participant?.userPropertyId === item?.userPropertyId &&
          participant?.userPropertyType === item?.userPropertyType) ||
        ((participant?.type === EUserPropertyType.SUPPLIER ||
          participant?.type === EUserPropertyType.OTHER) &&
          participant.userId === item.id)
      );
    });
  }

  private getPropertyTypeOrAddress(item: ListTrudiContact): string {
    if (
      [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER].includes(
        item.userType as EConfirmContactType
      )
    ) {
      return item.userType === EConfirmContactType.OTHER
        ? this.sharedService.displayAllCapitalizeFirstLetter(
            item.contactType?.split('_').join(' ').toLowerCase()
          )
        : this.sharedService.displayCapitalizeFirstLetter(
            item.userType?.toLowerCase()
          );
    } else {
      return (
        this.sharedService.displayCapitalizeFirstLetter(
          USER_TYPE_IN_RM[item.userPropertyType]?.toLowerCase() ||
            item.userPropertyType?.toLowerCase()
        ) +
        (item.userPropertyType !== EUserPropertyType.TENANT_PROSPECT
          ? this.displayPropertyStreetline(item.property?.streetline)
          : '')
      );
    }
  }

  private shouldSkipContactFetch(page: number): boolean {
    return this.totalPageContactList && page > this.totalPageContactList;
  }

  private shouldFetchContacts(isReassign: boolean): boolean {
    return (
      (!this.unhappyStatus?.confirmContactType &&
        !this.unhappyStatus?.isConfirmContactUser) ||
      isReassign
    );
  }

  private fetchTrudiProperties(search: string): void {
    this.unhappyPathLoading = true;
    this.userService
      .getListTrudiProperties(search)
      .pipe(
        filter((res) => Boolean(res)),
        takeUntil(this.destroy$),
        finalize(() => {
          this.unhappyPathLoading = false;
        })
      )
      .subscribe((res) => (this.propertyList = this.mapPropertyList(res)));
  }

  private mapPropertyList(res: PropertyContact[]): PropertyContact[] {
    return res.map((item) => ({
      ...item,
      fullName: this.sharedService.displayName(
        item.user.firstName,
        item.user.lastName
      )
    }));
  }

  private subscribeCurrentAgency() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
  }

  private resetStatusItems() {
    for (const item of this.participants || []) {
      item?.participants?.forEach((participant) => {
        if (!participant.isExpand) return;
        participant.isExpand = false;
        participant.isReAssign = false;
      });
    }
  }

  private updateParticipantItems() {
    for (const item of this.participants || []) {
      item?.participants?.forEach((participant) => {
        if (this.participantsActive.has(participant['messageRecipientId'])) {
          participant['isExpand'] = true;
        }
      });
    }
    this.groupParticipantsByType();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isShowParticipantDrawer']?.currentValue) {
      this.resetStatusItems();
    }

    if (changes['participants']?.currentValue) {
      this.updateParticipantItems();
    }

    const { currentConversation } = changes;
    if (
      currentConversation?.previousValue?.['id'] !==
      currentConversation?.currentValue?.['id']
    ) {
      this.showPopoverProfile = false;
    }

    if (changes['currentConversation']?.currentValue) {
      this.getPlaceholderTrudiReassign();
    }
  }

  getFormattedPhoneNumbers(participant: IUserParticipant) {
    const secondaryPhoneNumber = this.phoneNumberFormatPipe.transform(
      participant?.secondaryPhoneNumber
    );
    const phoneNumberFromConversationLog = this.phoneNumberFormatPipe.transform(
      participant?.phoneNumberFromConversationLog
    );
    const mobileNumbers =
      participant?.mobileNumber?.length > 0
        ? participant.mobileNumber
            .map((item: string) => this.phoneNumberFormatPipe.transform(item))
            .join(' / ')
        : '';
    const phoneNumber = this.phoneNumberFormatPipe.transform(
      participant?.phoneNumber
    );

    return (
      secondaryPhoneNumber ||
      phoneNumberFromConversationLog ||
      mobileNumbers ||
      phoneNumber ||
      ''
    );
  }

  setEmptyContactList() {
    this.contactList = [];
  }

  handleParticipantInfoClick(participant): void {
    if (!this.unhappyPathLoading) {
      this.showPopoverProfile = false;
      this.openModal.emit(participant);
    }
  }

  determinePropertyAddress(user) {
    return user?.type === EUserPropertyType.UNIDENTIFIED && !user?.streetline
      ? 'Unidentified property'
      : this.propertyService.getAddressProperty(
          {
            streetline: user?.streetline,
            id: '',
            unitNo: '',
            address: ''
          },
          user?.type,
          TaskType.MESSAGE
        );
  }

  requestToCallWithType(
    type?: CallTypeEnum,
    isActive?: boolean,
    participant?: IUserParticipant
  ) {
    this.onCallApp.emit({
      type: type,
      isActive: isActive,
      participant: participant
    });
  }

  getPlaceholderTrudiReassign() {
    const title =
      this.currentConversation?.trudiResponse?.data?.[0]?.body?.text;
    if (title?.includes('property')) {
      this.placeHolderTrudiUnhappy = 'Search for property';
    } else if (title?.includes('contact')) {
      this.placeHolderTrudiUnhappy = 'Search contact';
    } else if (title?.includes('task')) {
      this.placeHolderTrudiUnhappy = 'Search for task';
    }
  }

  toggleParticipant(messageRecipientId: string) {
    this.participants.forEach((item) => {
      const participantSelected = item.participants?.find(
        (p) => p?.messageRecipientId === messageRecipientId
      );
      if (participantSelected && this.isShowParticipantDrawer) {
        participantSelected.isExpand = !participantSelected.isExpand;
        if (participantSelected.isExpand) {
          this.participantsActive.add(messageRecipientId);
        } else {
          this.participantsActive.delete(messageRecipientId);
        }
      }
    });
  }

  groupParticipantsByType() {
    this.participants.forEach((item) => {
      item.participants.forEach((participant) => {
        if (
          participant?.crmStatus === 'DELETED' ||
          participant?.crmStatus === 'ARCHIVED'
        ) {
          this.isDeletedOrArchived = true;
        } else {
          this.isDeletedOrArchived = false;
        }

        this.unhappyStatus = {
          ...this.unhappyStatus,
          confirmContactType: [
            EUserPropertyType.SUPPLIER,
            EUserPropertyType.OTHER
          ].includes(participant?.contactType as EUserPropertyType)
            ? (participant?.contactType as EConfirmContactType)
            : null
        };

        const isDisplayUserDetail = ![
          EParticipantType.UNIDENTIFIED_CONTACTS
        ].includes(item?.type);
        const isDisplayContactDetail =
          item.type === EParticipantType.UNIDENTIFIED_CONTACTS &&
          !!(participant?.secondaryEmail || participant?.email);

        const isDisplayPhoneUnidentified =
          item.type === EParticipantType.UNIDENTIFIED_CONTACTS &&
          !(participant?.secondaryEmail || participant?.email);

        const isShouldShowBullet =
          ![EParticipantType.UNIDENTIFIED_CONTACTS].includes(item.type) &&
          (!!participant.type || !!participant?.userPropertyType);

        const shouldShowUserEmail =
          (!!participant?.firstName || !!participant?.lastName) &&
          ![EParticipantType.UNIDENTIFIED_CONTACTS].includes(item?.type);

        const determineUserType = this.determineUserType(participant);

        const isShowProfile =
          !!participant?.propertyId &&
          ![
            EUserPropertyType.SUPPLIER,
            EUserPropertyType.OTHER,
            EUserPropertyType.LANDLORD_PROSPECT,
            EUserPropertyType.TENANT_PROSPECT,
            EUserPropertyType.OWNER_PROSPECT
          ].includes(determineUserType) &&
          participant?.crmStatus !== ERmCrmStatus.RMDeleted;
        const name =
          `${participant?.firstName || ''} ${
            participant?.lastName || ''
          }`.trim() || 'Unknown';
        participant.generateUserName = name?.replace(/\"/g, '');
        participant.mobileNumber = JSON.parse(participant.mobileNumber || '[]');
        participant.isShouldShowBullet = isShouldShowBullet;
        participant.shouldShowUserEmail = shouldShowUserEmail;
        participant.isDisplayPhoneUnidentified = isDisplayPhoneUnidentified;
        participant.isDisplayContactDetail = isDisplayContactDetail;
        participant.isDisplayUserDetail = isDisplayUserDetail;
        participant.isAppUser =
          this.userService.getStatusInvite(
            participant?.iviteSent,
            participant?.lastActivity,
            participant?.offBoardedDate,
            participant?.trudiUserId
          ) === EUserInviteStatusType.active;
        participant.determineUserType = determineUserType;
        participant.determinePropertyAddress =
          this.determinePropertyAddress(participant);
        participant.isShowProfile = isShowProfile;
      });
    });
  }

  generateUserDetails(user) {
    this.isHiddenPrimary = [
      EUserPropertyType.TENANT_PROSPECT,
      EUserPropertyType.OWNER_PROSPECT
    ].includes(user?.propertyType as EUserPropertyType);
    const crmStatusString =
      user?.crmStatus !== null && this.isDeletedOrArchived
        ? `${user?.crmStatus} `
        : '';
    const primaryString =
      user?.isPrimary && !this.isHiddenPrimary ? 'primary ' : '';

    const startMessageByMapping = {
      [EUserPropertyType.LANDLORD]: EUserPropertyType.OWNER,
      [EUserPropertyType.EXTERNAL]: 'External email • '
    };

    const mappedStartMessageBy =
      startMessageByMapping[user?.userPropertyType] || user?.userPropertyType;
    const startMessageByString = this.userTypeInRmPipe.transform(
      mappedStartMessageBy,
      this.pipeType,
      this.isRmEnvironment
    );
    if (!!startMessageByString) {
      return crmStatusString + primaryString + startMessageByString;
    }
    return crmStatusString + primaryString;
  }

  determineUserType(user) {
    if (!user?.type) return '';

    switch (user?.type) {
      case EUserPropertyType.OTHER:
        return user?.contactType;
      case EUserPropertyType.SUPPLIER:
        return user?.type;
      case EUserPropertyType.USER:
        return user?.userPropertyType === EUserPropertyType.LANDLORD
          ? EUserPropertyType.OWNER
          : user?.userPropertyType === EUserPropertyType.LANDLORD_PROSPECT
          ? USER_TYPE_IN_RM.LANDLORD_PROSPECT
          : user?.userPropertyType;
      default:
        if (
          !EUserPropertyType.OTHER.includes(
            user?.userPropertyType as EUserPropertyType
          ) &&
          !EUserPropertyType.USER.includes(
            user?.userPropertyType as EUserPropertyType
          )
        )
          return this.generateUserDetails(user);
        return '';
    }
  }

  displayPropertyStreetline(streetline: string) {
    if (!streetline) {
      return '';
    }
    return ' • ' + streetline;
  }

  handleNzPopoverProfile(): void {
    this.showPopoverProfile = true;
  }

  handleConfirmSelectContact(
    event,
    isReassign,
    participant,
    reassign = false
  ): void {
    const { id, type, streetline } = event;
    if (!id) return;

    const validUserTypes = [
      EConfirmContactType.TENANT,
      EConfirmContactType.LANDLORD,
      EConfirmContactType.OWNER,
      EConfirmContactType.TENANT_UNIT,
      EConfirmContactType.LANDLORD_PROSPECT,
      EConfirmContactType.TENANT_PROPERTY,
      EConfirmContactType.OWNER_PROSPECT,
      EConfirmContactType.TENANT_PROSPECT
    ];

    const isTenantType = validUserTypes.includes(type as EConfirmContactType);

    const validUserOtherTypes = [
      EConfirmContactType.OTHER,
      EConfirmContactType.SUPPLIER
    ];

    const isOtherType = validUserOtherTypes.includes(
      type as EConfirmContactType
    );
    const tempParams = [
      this.getEmailForContactFetch(participant, true, reassign),
      this.getPhoneNumberForContactFetch(participant, true),
      participant?.userId
    ];

    const confirmMethodsMap = new Map([
      [
        isTenantType,
        {
          method: this.conversationService.confirmTrudiContact.bind(
            this.conversationService
          ),
          params: [
            this.conversationService.currentConversation.value.id,
            this.taskService.currentTask$.value.id,
            id,
            this.conversationService.currentConversation.value.agencyId,
            ...tempParams
          ]
        }
      ],
      [
        isOtherType,
        {
          method:
            this.conversationService.confirmTrudiSupplierOrOtherContact.bind(
              this.conversationService
            ),
          params: [
            id,
            this.taskService.currentTask$.value.id,
            this.conversationService.currentConversation.value.id,
            ...tempParams
          ]
        }
      ]
    ]);

    const { method: confirmMethod, params } = confirmMethodsMap.get(true) || {
      method: null,
      params: null
    };

    if (confirmMethod) {
      confirmMethod(...params)
        .pipe(
          tap(() => {
            this.unhappyPathLoading = true;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (res) => {
            this.taskService.reloadTaskDetail.next(true);
            this.conversationService.setParticipantChanged({
              ...res,
              oldUserId: participant.userId,
              isReassign
            });
            this.showPopoverProfile = false;

            timer(200)
              .pipe(take(1))
              .subscribe(() => (this.unhappyPathLoading = false));
          },
          error: () => {}
        });
    }
  }

  sendMessageFromParticipant(participant: IUserParticipant) {
    let receiverList = [];
    receiverList.push({
      id: participant?.userId,
      propertyId: participant?.propertyId
    });
    const prefillToCcBccReceiversList = {
      bcc: [],
      cc: [],
      to: [
        {
          email: participant?.email,
          userId: participant?.userId,
          firstName: participant?.firstName,
          lastName: participant?.lastName,
          propertyId: participant?.userPropertyId,
          userType: participant?.type,
          name: participant?.generateUserName,
          userPropertyType: participant?.userPropertyType,
          isPrimary: participant?.isPrimary,
          isTemporary: participant?.isTemporary,
          secondaryEmailId: participant?.secondaryEmailId,
          secondaryEmail: participant?.secondaryEmail
        }
      ]
    };

    this.isShowTrudiSendMsg = true;
    this.inboxToolbarService.setInboxItem([]);
    this.configs = {
      'header.title': null,
      'header.isPrefillProperty': false,
      'body.receiver.isShowContactType': false,
      'body.prefillReceivers': true,
      'body.prefillReceiversList': receiverList,
      'body.tinyEditor.isShowDynamicFieldFunction': true,
      'otherConfigs.isCreateMessageType': true,
      'footer.buttons.showBackBtn': false,
      'header.showDropdown': true,
      'body.prefillToCcBccReceiversList': prefillToCcBccReceiversList,
      'otherConfigs.createMessageFrom': ECreateMessageFrom.SCRATCH,
      'otherConfigs.isShowSecondaryEmail': true,
      'otherConfigs.isShowGreetingContent': true
    };
  }

  handleCloseModalSendMsg() {
    this.isShowTrudiSendMsg = false;
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.isShowTrudiSendMsg = false;
        this.conversationService.reloadConversationList.next(true);
        if (event.isDraft) {
          return;
        }
        const dataForToast = {
          taskId:
            event.data?.[0]?.taskId ||
            (event.data as ISendMsgResponseV2)?.task?.id ||
            (event.data as any)?.jobReminders?.[0]?.taskId,
          isShowToast: true,
          type: SocketType.newTask,
          mailBoxId: event.mailBoxId || (event.data as any)?.mailBoxId,
          taskType: TaskType.MESSAGE,
          pushToAssignedUserIds: [],
          conversationId:
            event.data?.[0]?.conversationId ||
            (event.data as any)?.conversation?.id ||
            (event.data as any)?.jobReminders?.[0]?.conversationId,
          status:
            (event.data as ISendMsgResponseV2)?.task?.status ||
            event.data?.[0]?.status ||
            event.data?.[0]?.messageType
        };
        this.toastCustomService.openToastCustom(
          dataForToast,
          true,
          EToastCustomType.SUCCESS_WITH_VIEW_BTN
        );
        this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE, {
          enableHtml: true
        });
        break;

      default:
        break;
    }
  }

  onDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
