import {
  Component,
  Input,
  EventEmitter,
  Output,
  SimpleChanges,
  OnChanges,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { UserConversation } from '@shared/types/conversation.interface';
import {
  EPropertyStatus,
  EUserDetailStatus,
  EUserPropertyType
} from '@shared/enum/user.enum';
import { TaskItem, TaskName } from '@shared/types/task.interface';
import {
  ListTrudiContact,
  OnSearchValueEmitter,
  TrudiResponse
} from '@shared/types/trudi.interface';
import {
  PropertyContact,
  UnhappyStatus
} from '@shared/types/unhappy-path.interface';
import { TaskService } from '@services/task.service';
import { PropertiesService } from '@services/properties.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { EMessageComeFromType } from '@shared/enum/index.enum';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { Subject, filter, take, takeUntil, tap, timer } from 'rxjs';
import { TaskType } from '@shared/enum/task.enum';
import { ConversationService } from '@services/conversation.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { UserService } from '@services/user.service';
import { isEmail } from '@shared/feature/function.feature';
import { SharedService } from '@services/shared.service';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { TitleCasePipe } from '@angular/common';
import { UppercaseFirstLetterPipe } from '@shared/pipes/uppercase-first-letter';
import { MessageService } from '@services/message.service';
import {
  EButtonTask,
  EButtonType,
  TrudiUserTypeInRmPipe,
  userType
} from '@trudi-ui';

@Component({
  selector: 'select-reassign-contact-popup',
  templateUrl: './select-reassign-contact-popup.component.html',
  styleUrls: ['./select-reassign-contact-popup.component.scss'],
  providers: [
    TrudiUserTypeInRmPipe,
    PhoneNumberFormatPipe,
    TitleCasePipe,
    UppercaseFirstLetterPipe
  ]
})
export class SelectReassignContactPopupComponent
  implements OnChanges, OnDestroy
{
  @Input() currentConversation: UserConversation;
  @Input() task: TaskItem;

  @Input() isHiddenPrimary: boolean;
  @Input() isRmEnvironment: boolean;
  @Input() inviteDeactivate: boolean;
  @Input() isUnindentifiedEmail: boolean;
  @Input() isUnindentifiedProperty: boolean;
  @Input() isUnindentifiedPhoneNumber: boolean;
  @Input() isUnHappyPath: boolean;
  @Input() isSuperHappyPath: boolean;
  @Input() isConfirmContactUser: boolean;
  @Input() isConsole: boolean;
  @Input() isShowLabel: boolean;
  @Input() taskDetailViewMode: EViewDetailMode;
  @Input() currentAgencyId: string;
  @Input() isSyncInprogress: boolean;
  @Input() isSyncSuccess: boolean;

  @Output() openModal: EventEmitter<void> = new EventEmitter();

  public contactList: ListTrudiContact[] = [];
  public propertyList: PropertyContact[] = [];
  public taskNameList: TaskName[] = [];
  public trudiResponse: TrudiResponse;
  public totalPageContactList?: number;

  public placeHolderTrudiUnhappy: string = 'Search for contact';
  public typeTrudi: string;
  public isDeletedOrArchived: boolean = false;
  public unhappyPathLoading: boolean = false;
  public overlayDropdown: boolean = true;
  public showPopover: boolean = false;
  public showPopoverProfile: boolean = false;
  public unhappyStatus: UnhappyStatus = {
    isAssignNewTask: true,
    isConfirmProperty: true,
    confirmContactType: null,
    isConfirmContactUser: false,
    isLandlordFutureWithNoProperty: true
  };
  public pipeType: string = userType.DEFAULT;
  public placement: string[] = ['bottomLeft', 'leftTop'];
  public placementReassign: string[] = ['rightTop', 'bottomRight'];
  public propertyStatus: EPropertyStatus;

  private unsubscribe = new Subject<boolean>();

  readonly EUserPropertyType = EUserPropertyType;
  readonly EUserDetailStatus = EUserDetailStatus;
  readonly EViewDetailMode = EViewDetailMode;
  readonly EMessageComeFromType = EMessageComeFromType;
  readonly EPropertyStatus = EPropertyStatus;
  readonly EButtonType = EButtonType;
  readonly EButtonTask = EButtonTask;

  get shouldShowUserEmail(): boolean {
    const { firstName, lastName, startMessageBy } =
      this.currentConversation || {};
    return (
      (!!firstName || !!lastName) &&
      ![EUserPropertyType.UNIDENTIFIED, EUserPropertyType.EXTERNAL].includes(
        startMessageBy as EUserPropertyType
      )
    );
  }

  get generateUserName(): string {
    const { firstName, lastName } = this.currentConversation || {};
    return `${firstName || ''} ${lastName || ''}`.trim();
  }

  get shouldDisplayUserDetails(): boolean {
    const { startMessageBy, trudiResponse } = this.currentConversation || {};
    return (
      ![EUserPropertyType.UNIDENTIFIED].includes(
        startMessageBy as EUserPropertyType
      ) || trudiResponse === null
    );
  }

  get generateUserDetails(): string {
    const { crmStatus, isPrimary, startMessageBy } =
      this.currentConversation || {};
    const crmStatusString = this.isDeletedOrArchived ? `${crmStatus} ` : '';
    const primaryString = isPrimary && !this.isHiddenPrimary ? 'primary ' : '';

    const startMessageByMapping = {
      [EUserPropertyType.LANDLORD]: EUserPropertyType.OWNER,
      [EUserPropertyType.EXTERNAL]: 'External email • '
    };

    const mappedStartMessageBy =
      startMessageByMapping[startMessageBy] || startMessageBy;
    const startMessageByString = this.userTypeInRmPipe.transform(
      mappedStartMessageBy,
      this.pipeType,
      this.isRmEnvironment
    );

    return crmStatusString + primaryString + startMessageByString;
  }

  get shouldDisplayContactDetails(): boolean {
    const { startMessageBy, email } = this.currentConversation || {};
    return Boolean(
      (this.inviteDeactivate ||
        startMessageBy === EUserPropertyType.EXTERNAL) &&
        email
    );
  }

  get shouldDisplayPhoneUnidentified(): boolean {
    const { email, firstName, lastName } = this.currentConversation || {};
    return !email && !firstName && !lastName;
  }

  get hasPhoneNumber(): boolean {
    return !!this.currentConversation?.phoneNumber;
  }

  get shouldShowBullet(): boolean {
    return ![EUserPropertyType.EXTERNAL].includes(
      this.currentConversation?.startMessageBy as EUserPropertyType
    );
  }

  get determineUserType(): string {
    if (!this.currentConversation?.startMessageBy) return '';

    switch (this.currentConversation.startMessageBy) {
      case EUserPropertyType.OTHER:
        return this.currentConversation.contactType;
      case EUserPropertyType.USER:
        return this.currentConversation.propertyType;
      default:
        if (
          !EUserPropertyType.OTHER.includes(
            this.currentConversation?.startMessageBy as EUserPropertyType
          ) &&
          !EUserPropertyType.USER.includes(
            this.currentConversation?.startMessageBy as EUserPropertyType
          )
        )
          return this.generateUserDetails;
        return '';
    }
  }

  get determinePropertyAddress(): string {
    const { property } = this.task || {};
    const { propertyType, userNoPropertyId } = this.currentConversation || {};

    return propertyType === EUserPropertyType.UNIDENTIFIED &&
      !this.task.property?.streetline
      ? 'Unidentified property'
      : this.propertyService.getAddressProperty(
          {
            ...property,
            streetline: userNoPropertyId ? '' : property.streetline
          },
          propertyType,
          TaskType.MESSAGE
        );
  }

  get shouldHideUserProfile(): boolean {
    const { propertyType, isTemporary, crmStatus } =
      this.currentConversation || {};

    return (
      propertyType === EUserPropertyType.SUPPLIER ||
      isTemporary ||
      propertyType === EUserPropertyType.UNIDENTIFIED ||
      propertyType === EUserPropertyType.EXTERNAL ||
      propertyType === EUserPropertyType.OTHER ||
      propertyType === EUserPropertyType.TENANT_PROSPECT ||
      propertyType === EUserPropertyType.OWNER_PROSPECT ||
      propertyType === EUserPropertyType.LANDLORD_PROSPECT ||
      crmStatus === EUserDetailStatus.DELETED
    );
  }

  get isMultipleContact(): boolean {
    return Object.prototype.hasOwnProperty.call(
      this.currentConversation,
      'isMultipleContact'
    )
      ? this.currentConversation.isMultipleContact
      : this.task?.conversations?.[0]?.isMultipleContact;
  }

  get userProfile(): string {
    const { createdFrom, phoneNumber, trudiResponse, email } =
      this.currentConversation || {};
    switch (createdFrom) {
      case EMessageComeFromType.VOICE_MAIL:
        const phoneNumberText =
          this.phoneNumberFormatPipe.transform(phoneNumber);
        const unverifiedText = trudiResponse?.data?.[0]?.body
          ?.isUnVerifiedPhoneNumber
          ? ' - Unverified'
          : '';
        return `${phoneNumberText}${unverifiedText}`;
      default:
        return email ? email : 'No email address';
    }
  }

  get headerTrudiPageText(): string {
    return this.isMultipleContact
      ? ' is assigned to multiple contacts'
      : this.currentConversation.trudiResponse?.data[0]?.header?.text;
  }

  get headerTrudiPageEmail(): string {
    return this.isMultipleContact
      ? this.currentConversation?.email
      : this.currentConversation.trudiResponse?.data[0]?.header?.email;
  }

  constructor(
    private agencyService: AgencyService,
    private taskService: TaskService,
    private sharedService: SharedService,
    private userService: UserService,
    private propertyService: PropertiesService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    private conversationService: ConversationService,
    private userTypeInRmPipe: TrudiUserTypeInRmPipe,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const { currentConversation } = changes;

    if (
      currentConversation?.previousValue?.['id'] !==
      currentConversation?.currentValue?.['id']
    ) {
      this.showPopover = false;
      this.showPopoverProfile = false;
    }

    if (changes['currentConversation']?.currentValue) {
      this.propertyStatus = this.currentConversation?.propertyStatus;
      this.getUnHappyStatus();
      this.getPlaceholderTrudiReassign();
      this.getIsDeletedOrArchived();
    }
  }

  getUnHappyStatus() {
    this.unhappyStatus = {
      ...this.unhappyStatus,
      confirmContactType: [
        EUserPropertyType.SUPPLIER,
        EUserPropertyType.OTHER
      ].includes(this.currentConversation.contactType as EUserPropertyType)
        ? (this.currentConversation.contactType as EConfirmContactType)
        : null
    };
  }

  getPlaceholderTrudiReassign() {
    const title =
      this.currentConversation?.trudiResponse?.data?.[0]?.body?.text;
    if (title?.includes('property')) {
      this.overlayDropdown = true;
      this.placeHolderTrudiUnhappy = 'Search for property';
    } else if (title?.includes('contact')) {
      this.overlayDropdown = true;
      this.placeHolderTrudiUnhappy = 'Search for contact';
    } else if (title?.includes('task')) {
      this.overlayDropdown = false;
      this.placeHolderTrudiUnhappy = 'Search for task';
    }
  }

  getIsDeletedOrArchived() {
    if (
      this.currentConversation &&
      (this.currentConversation?.crmStatus === 'DELETED' ||
        this.currentConversation?.crmStatus === 'ARCHIVED')
    ) {
      this.isDeletedOrArchived = true;
    } else {
      this.isDeletedOrArchived = false;
    }
  }

  handleUserInfoClick(): void {
    if (!this.unhappyPathLoading) {
      this.showPopover = false;
      this.showPopoverProfile = false;
      this.openModal.emit();
    }
  }

  setEmptyContactList() {
    this.contactList = [];
  }

  handleNzPopover(): void {
    this.showPopover = true;
  }

  handleNzPopoverProfile(): void {
    this.showPopoverProfile = true;
  }

  handleConfirmSelectContact(event, isReassign): void {
    const { id, type, streetline } = event;

    if (!id) return;

    const validUserTypes = [
      EConfirmContactType.TENANT,
      EConfirmContactType.LANDLORD,
      EConfirmContactType.OWNER,
      EConfirmContactType.TENANT_UNIT,
      EConfirmContactType.LANDLORD_PROSPECT,
      EConfirmContactType.TENANT_PROPERTY
    ];

    const isTenantType = validUserTypes.includes(type as EConfirmContactType);

    const validUserOtherTypes = [
      EConfirmContactType.OTHER,
      EConfirmContactType.SUPPLIER,
      EConfirmContactType.OWNER_PROSPECT,
      EConfirmContactType.TENANT_PROSPECT
    ];

    const isOtherType = validUserOtherTypes.includes(
      type as EConfirmContactType
    );
    const tempParams = [
      this.getEmailForContactFetch(true),
      this.getPhoneNumberForContactFetch(true)
    ];

    const confirmMethodsMap = new Map([
      [
        (this.isUnHappyPath || isReassign) &&
          isTenantType &&
          ((streetline && this.isRmEnvironment) || !this.isRmEnvironment),
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
        (!streetline && this.isRmEnvironment) ||
          ((this.isUnHappyPath || isReassign) && isOtherType),
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
          takeUntil(this.unsubscribe)
        )
        .subscribe({
          next: () => {
            this.taskService.reloadTaskDetail.next(true);
            this.showPopover = false;
            this.showPopoverProfile = false;
            this.cdr.markForCheck();

            timer(200)
              .pipe(take(1))
              .subscribe(() => (this.unhappyPathLoading = false));
          },
          error: () => {}
        });
    }
  }

  handleOnGetUnHappyPath(
    event: OnSearchValueEmitter,
    isReassign: boolean
  ): void {
    const { search, page, limit } = event;

    if (this.shouldFetchProperties(isReassign)) {
      this.fetchTrudiProperties(search);
    } else if (this.shouldFetchContacts(isReassign)) {
      this.fetchTrudiContacts(search, page, limit);
    } else if (this.shouldFetchTaskNames()) {
      this.fetchTaskNames(search);
    }
  }

  private shouldFetchProperties(isReassign): boolean {
    return (
      [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER].includes(
        this.unhappyStatus?.confirmContactType as EConfirmContactType
      ) &&
      (!this.unhappyStatus?.isConfirmProperty || isReassign)
    );
  }

  private fetchTrudiProperties(search: string): void {
    this.userService
      .getListTrudiProperties(search)
      .pipe(
        filter((res) => Boolean(res)),
        takeUntil(this.unsubscribe)
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

  private shouldFetchContacts(isReassign: boolean): boolean {
    return (
      (!this.unhappyStatus?.confirmContactType &&
        !this.unhappyStatus?.isConfirmContactUser) ||
      isReassign
    );
  }

  private fetchTrudiContacts(
    search: string,
    page: number,
    limit: number
  ): void {
    if (this.shouldSkipContactFetch(page)) return;

    this.userService
      .getListTrudiContact(
        search,
        this.getEmailForContactFetch(),
        page,
        limit,
        this.getPhoneNumberForContactFetch()
      )
      .pipe(
        filter((res) => Boolean(res)),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        this.updateContactList(res.contacts);
        this.totalPageContactList = res.totalPage;
        this.cdr.markForCheck();
      });
  }

  private shouldSkipContactFetch(page: number): boolean {
    return this.totalPageContactList && page > this.totalPageContactList;
  }

  private getEmailForContactFetch(isConfirm?: boolean): string {
    const trudiEmail =
      this.trudiResponse?.data[0]?.header?.email ||
      this.currentConversation?.email;

    return ![EMessageComeFromType.VOICE_MAIL].includes(
      this.currentConversation.createdFrom as EMessageComeFromType
    ) &&
      ((isEmail(trudiEmail) && !this.isUnindentifiedEmail) || isConfirm)
      ? trudiEmail
      : '';
  }

  private getPhoneNumberForContactFetch(isConfirm?: boolean): string {
    return [EMessageComeFromType.VOICE_MAIL].includes(
      this.currentConversation.createdFrom as EMessageComeFromType
    ) &&
      ((!this.currentConversation.trudiResponse?.data[0]?.body
        ?.isUnVerifiedPhoneNumber &&
        !this.currentConversation.trudiResponse?.data[0]?.body
          ?.isUnindentifiedPhoneNumber) ||
        isConfirm)
      ? this.currentConversation.phoneNumber
      : '';
  }

  private updateContactList(contacts: ListTrudiContact[]): void {
    const updatedContacts = contacts.map((item) => ({
      ...item,
      fullName: this.sharedService.displayName(item.firstName, item.lastName),
      propertyTypeOrAddress: this.getPropertyTypeOrAddress(item)
    }));

    this.contactList = this.showPopoverProfile
      ? [
          ...this.contactList,
          ...updatedContacts.filter((item) =>
            this.currentConversation.userNoPropertyId
              ? item?.id !== this.currentConversation.userNoPropertyId
              : item.property?.id !== this.currentConversation.propertyId
          )
        ]
      : [...this.contactList, ...updatedContacts];
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

  private shouldFetchTaskNames(): boolean {
    return !this.unhappyStatus.isAssignNewTask;
  }

  private fetchTaskNames(search: string): void {
    this.taskService
      .getTaskNameList(search, TaskType.TASK)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => (this.taskNameList = res));
  }

  displayPropertyStreetline(streetline: string) {
    if (!streetline) {
      return '';
    }
    return ' • ' + streetline;
  }

  onInfoUser() {
    if (
      this.propertyStatus === EPropertyStatus.deleted ||
      !this.currentConversation.streetline
    )
      return;
    this.messageService.requestShowUserInfo.next({
      ...this.messageService.requestShowUserInfo.getValue,
      showModal: true,
      isFromTaskCoversation: true
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next(true);
    this.unsubscribe.complete();
  }
}
