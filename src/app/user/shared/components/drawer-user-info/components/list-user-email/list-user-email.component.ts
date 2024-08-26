import { ConversationService } from '@services/conversation.service';
import { OtherContactService } from '@services/orther-contact.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import {
  EConfirmContactType,
  EConversationType,
  ECreatedFrom,
  EMessageType,
  EUserPropertyType,
  TaskType
} from '@shared/enum';
import { ETypePage } from '@/app/user/utils/user.enum';
import { IUserPropertyV2 } from '@/app/user/utils/user.type';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, combineLatest, debounceTime, takeUntil } from 'rxjs';
import { UserInfoDrawerService } from '@/app/user/shared/components/drawer-user-info/services/user-info-drawer.service';
import { EToastMessageDefault } from '@/app/toast/toastType';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@services/shared.service';
import { IMessage } from '@shared/types/message.interface';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';

@Component({
  selector: 'list-user-email',
  templateUrl: 'list-user-email.component.html',
  styleUrls: ['list-user-email.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListUserEmailComponent implements OnChanges, OnInit, OnDestroy {
  @Input() userContacts: IUserPropertyV2[] = [];
  @Input() currentDataUser: IUserPropertyV2;
  @Input() isRmSystem: boolean = false;
  @Input() isAppMessage: boolean;
  @Input() isSMSMessage: boolean;
  @Input() isWhatsApp: boolean;
  @Input() isDisableActionByOffBoardStatus: boolean;
  @Input() isNotDetectedContact = false;
  @Input() visible: boolean = false;

  public listContact = new Map<string, IUserPropertyV2[]>();
  public isLoading: boolean = false;
  public isShowQuitConfirm: boolean = false;
  public currentContact: IUserPropertyV2;
  public textNoPropertyOrNoAssignedContact: string =
    'No property for this conversation';
  public conversationPropertyId: string = '';
  public isNoPropertyConversation: boolean = false;
  public isConsole: boolean = false;
  public isArchiveMailbox: boolean = false;
  public isDisconnectedMailbox: boolean = false;
  public currentVoicemailConversation;
  public currentConversation;
  public currentVoicemailTask;
  public TaskType = TaskType;
  public conversationType = EConversationType;
  public isAssigned: boolean;

  readonly userTypes = [
    EConfirmContactType.TENANT,
    EConfirmContactType.TENANT_PROPERTY,
    EConfirmContactType.TENANT_PROSPECT,
    EConfirmContactType.TENANT_UNIT,
    EConfirmContactType.OWNER,
    EConfirmContactType.OWNER_PROSPECT,
    EConfirmContactType.LANDLORD,
    EConfirmContactType.LANDLORD_PROSPECT
  ];
  readonly userOtherTypes = [
    EConfirmContactType.OTHER,
    EConfirmContactType.SUPPLIER
  ];
  readonly ETypePage = ETypePage;
  readonly EUserPropertyType = EUserPropertyType;
  private destroy$ = new Subject<void>();
  public readonly EButtonType = EButtonType;
  public readonly EButtonTask = EButtonTask;
  public readonly ECreatedFrom = ECreatedFrom;

  get listContactInternalProperty(): IUserPropertyV2[] {
    return this.listContact.get('internal') || [];
  }

  get listContactExternalProperty(): IUserPropertyV2[] {
    return this.listContact.get('external') || [];
  }

  getAssignButtonHiddenStatus(item: IUserPropertyV2, hiddenBtnAssign: boolean) {
    const {
      isMatchesProperty,
      isMatchesException,
      isMatchesLead,
      isSuggested,
      type: userType
    } = item;

    const { taskType, conversationType } =
      this.currentVoicemailConversation || this.currentConversation || {};

    const { APP: appConversationType } = this.conversationType;

    const isAssignableContact = this.isSupportAssignAllContact(item)
      ? true
      : isMatchesProperty ||
        isMatchesException ||
        isMatchesLead ||
        (isSuggested && taskType === TaskType.MESSAGE);

    const isRestrictedByConversationType =
      conversationType === appConversationType;
    const isRestrictedByMessageType =
      (this.isSMSMessage || this.isWhatsApp) &&
      userType === EUserPropertyType.LEAD;
    const isPmNameClicked = !!this.currentDataUser?.pmNameClick;

    return (
      isAssignableContact &&
      !hiddenBtnAssign &&
      !isRestrictedByConversationType &&
      !isRestrictedByMessageType &&
      !isPmNameClicked
    );
  }

  constructor(
    private readonly conversationService: ConversationService,
    private readonly taskService: TaskService,
    private readonly userService: UserService,
    private readonly mainService: OtherContactService,
    private readonly toatrService: ToastrService,
    private readonly userInfoDrawerService: UserInfoDrawerService,
    private readonly inboxService: InboxService,
    private readonly sharedService: SharedService,
    private readonly voicemailInboxService: VoiceMailService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();

    if (this.currentDataUser.conversationType !== EConversationType.MESSENGER) {
      combineLatest([
        this.inboxService.getIsDisconnectedMailbox(),
        this.inboxService.isArchiveMailbox$
      ])
        .pipe(takeUntil(this.destroy$))
        .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
          this.isArchiveMailbox = isArchiveMailbox;
          this.isDisconnectedMailbox = isDisconnectedMailbox;
        });
    }

    combineLatest([
      this.conversationService.currentConversation,
      this.voicemailInboxService.currentVoicemailConversation$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([conversation, currentVoicemailConversation]) => {
        this.currentVoicemailConversation = currentVoicemailConversation;
        this.currentConversation = conversation;
        this.conversationPropertyId =
          this.currentDataUser?.createdFrom === ECreatedFrom.VOICE_MAIL
            ? currentVoicemailConversation?.propertyId
            : conversation?.propertyId;
        if (this.userContacts && this.currentDataUser) {
          this.populateContactLists();
          this.updateConversationProperties();
          this.cdr.markForCheck();
        }
      });

    this.voicemailInboxService.currentVoicemailTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentVoicemailTask) => {
        this.currentVoicemailTask = currentVoicemailTask;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.userContacts && this.currentDataUser) {
      this.populateContactLists();
      this.updateConversationProperties();
      this.cdr.markForCheck();
    }
  }

  private updateConversationProperties() {
    this.isNoPropertyConversation =
      this.currentConversation?.isTemporaryProperty ||
      this.currentVoicemailConversation?.isTemporaryProperty ||
      this.currentDataUser?.isTemporaryProperty;

    if (
      this.conversationPropertyId ||
      this.currentDataUser?.conversationPropertyId
    ) {
      let recognizedLabel = 'email address';

      switch (
        this.currentDataUser?.createdFrom ||
        this.currentDataUser?.conversationType
      ) {
        case ECreatedFrom.VOICE_MAIL:
          recognizedLabel = this.currentDataUser?.emailVerified
            ? 'user'
            : 'phone number';
          break;
        case ECreatedFrom.SMS:
        case ECreatedFrom.WHATSAPP:
          recognizedLabel = 'user';
          break;
        case EConversationType.MESSENGER:
          recognizedLabel = 'user';
          break;
      }

      this.textNoPropertyOrNoAssignedContact = `We recognized this ${recognizedLabel}, but no contact has been assigned to this conversation.`;
    } else if (this.currentDataUser?.createdFrom === ECreatedFrom.SMS) {
      this.textNoPropertyOrNoAssignedContact = '';
    }

    if (this.currentVoicemailConversation) {
      const { isUnVerifiedPhoneNumber, isProvidedOtp } =
        this.currentVoicemailConversation?.trudiResponse?.data?.[0].body || {};

      if (isProvidedOtp && isUnVerifiedPhoneNumber)
        this.textNoPropertyOrNoAssignedContact = `We recognized this phone number but the caller wasn't able to verify their identity. Would you like to manually assign a contact?`;
    }
  }

  private populateContactLists() {
    if (!this.visible) return;
    this.listContact.clear();

    const externalContacts: IUserPropertyV2[] = [];
    const internalContacts: IUserPropertyV2[] = [];

    this.userContacts.forEach((contact) => {
      const processedContact = this.processContact(contact);

      const contactArray = processedContact.isAssigned
        ? internalContacts
        : externalContacts;

      contactArray.push(processedContact);
    });

    let sortedUser = this.comparatorRole(externalContacts);

    if (
      this.currentDataUser?.isBelongToOtherContact &&
      this.currentDataUser?.emailVerified
    ) {
      sortedUser = this.comparatorPhoneNumberEmail(sortedUser);
    } else {
      sortedUser = this.comparatorProperty(sortedUser);
      sortedUser = this.comparatorIsSuggested(sortedUser);
    }
    this.isAssigned = sortedUser.some((item) => item.isAssigned);
    this.listContact.set('internal', internalContacts);
    this.listContact.set('external', sortedUser);
  }

  private isSupportAssignAllContact(contact: IUserPropertyV2): boolean {
    const supportedTypes = [
      EConfirmContactType.TENANT,
      EConfirmContactType.TENANT_PROPERTY,
      EConfirmContactType.TENANT_PROSPECT,
      EConfirmContactType.TENANT_UNIT,
      EConfirmContactType.OWNER,
      EConfirmContactType.OWNER_PROSPECT,
      EConfirmContactType.LANDLORD
    ];
    const contactType = contact?.type || contact.user?.type;
    return supportedTypes.includes(contactType as EConfirmContactType);
  }

  private isContactSelectedForOTP(contact: IUserPropertyV2): boolean {
    if (!this.currentVoicemailConversation) return false;

    const { isUnVerifiedPhoneNumber, userIdSelected, isProvidedOtp } =
      this.currentVoicemailConversation?.trudiResponse?.data?.[0].body || {};

    return (
      userIdSelected === contact.user.id &&
      isUnVerifiedPhoneNumber &&
      isProvidedOtp
    );
  }

  private getCurrentPropertyId(): string | null {
    const {
      conversationType,
      isTemporaryProperty,
      conversationPropertyId,
      propertyId
    } = this.currentDataUser || {};

    if (
      conversationType === EConversationType.MESSENGER &&
      isTemporaryProperty
    ) {
      return conversationPropertyId || propertyId;
    }

    return propertyId;
  }

  private isInternalContact(contact: IUserPropertyV2): boolean {
    const currentSender = this.getSenderInfo();
    const currentUserId = currentSender?.userId || this.currentDataUser?.userId;
    const currentPropertyId =
      currentSender?.propertyId || this.getCurrentPropertyId();

    const isContactMatchingUser = [contact.userId, contact.user.id].includes(
      currentUserId
    );
    const isMatchesProperty = contact.propertyId === currentPropertyId;

    if (!isContactMatchingUser) return false;

    if (this.isSupportAssignAllContact(contact)) {
      return isMatchesProperty;
    }

    const isMatchesException = this.isMatchesException(contact);
    const isMatchesLead = contact?.type === EUserPropertyType.LEAD;
    const isConversationSupported = [
      EConversationType.SMS,
      EConversationType.WHATSAPP
    ].includes(this.currentDataUser?.conversationType);

    return (
      isMatchesException ||
      isMatchesLead ||
      (isMatchesProperty && isConversationSupported)
    );
  }

  private getSenderInfo(): { userId: string; propertyId: string } | null {
    if (
      (this.currentDataUser as unknown as IMessage)?.messageType !==
      EMessageType.ticket
    )
      return null;

    const senderInfo = (this.currentDataUser as unknown as IMessage)
      .emailMetadata?.from?.[0];
    return {
      userId: senderInfo?.userId,
      propertyId: senderInfo?.propertyId
    };
  }

  private processContact(contact: IUserPropertyV2) {
    const isMatchesException = this.isMatchesException(contact);
    const isMatchesLead = contact?.type === EUserPropertyType.LEAD;
    const isMatchesProperty =
      contact.propertyId === this.getCurrentPropertyId();
    const isInternal = this.isInternalContact(contact);
    const isContactUnverifiedOTP = this.isContactSelectedForOTP(contact);

    const isAssigned =
      this.currentDataUser?.conversationType === this.conversationType.MESSENGER
        ? isInternal && this.currentDataUser.isUserVerified
        : isInternal;

    const isDisableDeleted = isMatchesException
      ? contact?.userType === EUserPropertyType.SUPPLIER &&
        !contact.user.isSystemCreate
      : true;

    return {
      ...contact,
      isSuggested: isContactUnverifiedOTP,
      isAssigned,
      isMatchesException,
      isMatchesProperty,
      isDisableDeleted,
      isMatchesLead,
      textTooltip: this.generateTooltipTitle(contact, this.currentDataUser),
      streetline: contact.streetline || contact.property?.streetline,
      userId: contact.userId || contact.user.id,
      propertyId: this.isPropertyNull(contact),
      user: { ...contact.property, ...contact.user }
    };
  }

  private isPropertyNull(contact: IUserPropertyV2): string | null {
    const nullTypes = [
      EUserPropertyType.SUPPLIER,
      EUserPropertyType.OTHER,
      EUserPropertyType.LANDLORD_PROSPECT,
      EUserPropertyType.OWNER_PROSPECT,
      EUserPropertyType.TENANT_PROSPECT
    ];

    return nullTypes.includes(contact?.userType as EUserPropertyType)
      ? null
      : contact.propertyId || this.currentDataUser?.propertyId;
  }

  private comparatorRole(list: IUserPropertyV2[]) {
    const types = [...this.userTypes, ...this.userOtherTypes];
    return list.sort((a, b) => {
      return (
        (types.indexOf(a.type as EConfirmContactType) || 0) -
        (types.indexOf(b.type as EConfirmContactType) || 0)
      );
    });
  }

  private comparatorProperty(list: IUserPropertyV2[]) {
    return list.sort((a, b) => {
      return (
        Number(b.isMatchesProperty) - Number(a.isMatchesProperty) ||
        Number(a.isMatchesException) - Number(b.isMatchesException) ||
        Number(b.isMatchesLead) - Number(a.isMatchesLead)
      );
    });
  }

  private comparatorIsSuggested(list: IUserPropertyV2[]) {
    const suggestedItems = list.filter((item) => item.isSuggested);

    const nonSuggestedItems = list.filter((item) => !item.isSuggested);

    return [...suggestedItems, ...nonSuggestedItems];
  }

  private comparatorPhoneNumberEmail(list: IUserPropertyV2[]) {
    return list.sort((a, b) => {
      if (a.isMatchesProperty !== b.isMatchesProperty) {
        return a.isMatchesProperty ? -1 : 1;
      }

      if (this.isMatchPhoneNumberEmail(a) !== this.isMatchPhoneNumberEmail(b)) {
        return this.isMatchPhoneNumberEmail(a) ? -1 : 1;
      }

      return 0;
    });
  }

  private isMatchPhoneNumberEmail({
    user: { email, secondaryEmails, phoneNumber, secondaryPhones }
  }: IUserPropertyV2) {
    const { fromPhoneNumber, emailVerified } = this.currentDataUser || {};
    const listEmail = [
      email?.toLowerCase(),
      ...secondaryEmails.map(({ email }) => email?.toLowerCase())
    ].filter(Boolean);
    const listPhoneNumber = [
      phoneNumber,
      ...secondaryPhones.map(({ phoneNumber }) => phoneNumber)
    ].filter(Boolean);

    return (
      listEmail.includes(emailVerified?.toLowerCase()) &&
      listPhoneNumber.includes(fromPhoneNumber)
    );
  }

  private isMatchesException(contact) {
    return [EUserPropertyType.OTHER, EUserPropertyType.SUPPLIER].includes(
      (contact?.userType || contact.type) as EUserPropertyType
    );
  }

  private generateTooltipTitle(userProperty, currentDataUser) {
    if (
      (this.isNotDetectedContact &&
        this.currentDataUser.conversationType === EConversationType.SMS) ||
      this.currentDataUser.pmNameClick
    )
      return '';
    let systemName = this.isRmSystem ? 'Rent Manager' : 'Property Tree';
    if (this.userTypes.includes(userProperty?.type)) {
      return userProperty?.isPrimary
        ? 'Cannot delete primary contact'
        : `This contact can only be deleted directly from ${systemName}`;
    } else if (
      currentDataUser?.type === EConfirmContactType.SUPPLIER ||
      currentDataUser?.type === EConfirmContactType.OTHER
    ) {
      return currentDataUser.isSystemCreate
        ? null
        : `This contact can only be deleted directly from ${systemName}`;
    }
    return `This contact can only be deleted directly from ${systemName}`;
  }

  handleAssignConversation(item) {
    if (
      this.isLoading ||
      this.isConsole ||
      this.isArchiveMailbox ||
      this.isDisconnectedMailbox ||
      this.isNotDetectedContact ||
      ([
        EConversationType.SMS,
        EConversationType.WHATSAPP,
        EConversationType.MESSENGER
      ].includes(this.currentDataUser?.conversationType) &&
        (!this.currentDataUser.isUserVerified ||
          !this.currentDataUser.currentPMJoined))
    )
      return;

    this.isLoading = true;
    const { id, user, isSuggested } = item;

    const isTenantType = this.userTypes.includes(
      (item?.type || user.type) as EConfirmContactType
    );

    const isOtherType = this.userOtherTypes.includes(
      (item?.type || user.type) as EConfirmContactType
    );
    const tempParams = [
      [EConversationType.SMS, EConversationType.WHATSAPP].includes(
        this.currentDataUser.conversationType
      )
        ? this.currentDataUser.emailVerified || ''
        : this.currentDataUser.email || '',
      this.currentDataUser.fromPhoneNumber || '',
      this.listContactInternalProperty[0]?.user?.id ||
        this.currentDataUser.userId
    ];

    const taskId =
      this.taskService.currentTask$.value?.id ||
      this.currentVoicemailTask?.id ||
      this.currentDataUser.taskId;

    const conversationId =
      this.currentConversation?.id ||
      this.currentVoicemailConversation?.id ||
      this.currentDataUser.conversationId;

    const agencyId =
      this.currentConversation?.agencyId ||
      this.currentVoicemailConversation?.agencyId;
    const confirmMethodsMap = new Map([
      [
        isTenantType,
        {
          method: this.conversationService.confirmTrudiContact.bind(
            this.conversationService
          ),
          params: [
            conversationId,
            taskId,
            id || user.id,
            agencyId,
            ...tempParams,
            isSuggested
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
            id || user.id,
            taskId,
            conversationId,
            ...tempParams,
            isSuggested
          ]
        }
      ],
      [
        !isTenantType && !isOtherType,
        {
          method: this.conversationService.confirmTrudiPM.bind(
            this.conversationService
          ),
          params: [
            id || user.id,
            taskId,
            conversationId,
            ...tempParams,
            isSuggested
          ]
        }
      ]
    ]);

    const { method: confirmMethod, params } = confirmMethodsMap.get(true) || {
      method: null,
      params: null
    };

    if (confirmMethod) {
      this.sharedService.setLoadingDetailHeader(true);
      confirmMethod(...params)
        .pipe(takeUntil(this.destroy$), debounceTime(300))
        .subscribe({
          next: (res) => {
            this.taskService.reloadTaskDetail.next(true);
            this.conversationService.setParticipantChanged({
              ...res,
              oldUserId: res.oldUserId || this.currentDataUser.userId,
              isReassign: true
            });
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.sharedService.setLoadingDetailHeader(false);
            this.toatrService.error(`Assigned failed`);
          }
        });
    }
  }

  handlePreventDeleteContact(item) {
    this.currentContact = item;
    this.isShowQuitConfirm = true;
  }

  handleCloseModalDelete() {
    this.isShowQuitConfirm = false;
  }

  handleDeleteItems() {
    const item = this.currentContact;
    const currentUserId = this.userService.userInfo$.value.id;

    const confirmMethodsMap = new Map([
      [
        item.userType === EConfirmContactType.SUPPLIER,
        {
          method: this.userService.deleteSupplier.bind(this.userService),
          params: {
            supplierDeleteIds: [item.user.id],
            userId: currentUserId
          }
        }
      ],
      [
        item.userType !== EConfirmContactType.SUPPLIER,
        {
          method: this.mainService.delete.bind(this.mainService),
          params: {
            otherContactDeleteIds: [item.user.id],
            userId: currentUserId
          }
        }
      ]
    ]);

    const { method: confirmMethod, params } = confirmMethodsMap.get(true) || {
      method: null,
      params: null
    };

    if (confirmMethod) {
      confirmMethod(params)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isShowQuitConfirm = false;
            this.isLoading = false;
            this.userService.setIsDeleteUser(true);
            this.taskService.reloadTaskDetail.next(true);
            this.userInfoDrawerService.setDeletedUser(item.user.id);
            this.toatrService.success(EToastMessageDefault.deletedSuccess);
            this.conversationService.reloadConversationList.next(true);
            this.cdr.markForCheck();
          },
          error: () => {}
        });
    }
  }

  handleExportHistoryConversation(item: IUserPropertyV2) {
    if (this.isNotDetectedContact) return;
    this.userInfoDrawerService.openExportConversation({
      state: true,
      userPropertyId: item?.id
    });
  }

  trackByUserId(index: number, userProperty: IUserPropertyV2): string {
    return userProperty?.id || userProperty?.user.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
