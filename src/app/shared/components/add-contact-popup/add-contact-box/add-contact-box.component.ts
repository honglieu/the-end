import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import {
  CreateNewContactUserResponse,
  IUserParticipant
} from '@shared/types/user.interface';
import { UserInformation } from '@shared/types/trudi.interface';
import { PropertiesService } from '@services/properties.service';
import {
  EConfirmContactType,
  EConversationType,
  ECreatedFrom,
  EMessageComeFromType,
  EPropertyStatus
} from '@shared/enum';
import { isEmail } from '@shared/feature/function.feature';
import { ConversationService } from '@services/conversation.service';
import { TaskService } from '@services/task.service';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  takeUntil
} from 'rxjs';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { OnSearchValueEmitter } from '@shared/types/trudi.interface';
import { FormControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '@services/user.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@services/shared.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';

@Component({
  selector: 'add-contact-box',
  templateUrl: './add-contact-box.component.html',
  styleUrls: ['./add-contact-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddContactBoxComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;
  @Input() onTop?: boolean = true;
  @Input() left?: boolean = true;
  @Input() contactList = [];
  @Input() totalPage: number = 0;
  @Input() participantInfo: UserInformation;
  @Input() isLoadingList: boolean = false;
  @Input() applySecondaryLogic: boolean = false;
  @Output() onSearch = new EventEmitter<OnSearchValueEmitter>();
  @Output() onSetEmptyContactList = new EventEmitter();
  @Output() onCloseDropdownAddContact = new EventEmitter();
  @Output() onOk = new EventEmitter<boolean>();

  searchText$ = new FormControl(null);
  subscriber = new Subject<void>();
  public currentPage = 1;
  public DEFAULT_LIMIT = 10;
  public DEFAULT_PAGE = 1;

  public isScrolledToBottom: boolean = false;
  public LAZY_LOAD_ASSIGNEE = 58;
  public totalItem = 0;
  public showCreateNewContact = false;
  public isOpenContactList = true;
  public ModalPopupPosition = ModalPopupPosition;
  public selectedUserPropertyId: string;
  public selectPropertyId: string;
  public selectedUserId: string;
  public selectedUserType: string;
  public selectedPropertyId: string;
  public isReassign: boolean = false;
  public isAddingContact: boolean = false;
  public isConsole: boolean = false;
  public isArchiveMailbox: boolean = false;
  public isDisconnectedMailbox: boolean = false;
  public conversationTaskId: string;

  readonly EPropertyStatus = EPropertyStatus;
  readonly ECreatedFrom = ECreatedFrom;
  private destroy$ = new Subject();
  readonly EButtonType = EButtonType;
  readonly EButtonTask = EButtonTask;
  public currentVoicemailConversation;
  public currentVoicemailTask;
  public conversationPropertyId;
  isTemporaryProperty: boolean;

  constructor(
    private readonly elr: ElementRef,
    private readonly propertyService: PropertiesService,
    private readonly userService: UserService,
    private readonly conversationService: ConversationService,
    private readonly taskService: TaskService,
    private readonly toastrService: ToastrService,
    private readonly inboxService: InboxService,
    private readonly sharedService: SharedService,
    private readonly voicemailInboxService: VoiceMailService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get getStyle() {
    return {
      height: this.totalItem < 8 ? `${this.totalItem * 58}px` : '324px'
    };
  }

  ngOnInit(): void {
    if (this.left) {
      this.elr.nativeElement.style.left = 'unset';
      this.elr.nativeElement.style.right = '100%';
    }

    this.isConsole = this.sharedService.isConsoleUsers();

    if (this.participantInfo.conversationType !== EConversationType.MESSENGER) {
      combineLatest([
        this.inboxService.getIsDisconnectedMailbox(),
        this.inboxService.isArchiveMailbox$
      ])
        .pipe(takeUntil(this.destroy$))
        .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
          this.isArchiveMailbox = isArchiveMailbox;
          this.isDisconnectedMailbox = isDisconnectedMailbox;
        });

      combineLatest([
        this.conversationService.currentConversation,
        this.voicemailInboxService.currentVoicemailConversation$
      ])
        .pipe(takeUntil(this.destroy$))
        .subscribe(([conversation, currentVoicemailConversation]) => {
          this.conversationTaskId = conversation.taskId;
          this.currentVoicemailConversation = currentVoicemailConversation;
          const { conversationType, isTemporaryProperty } = conversation || {};
          this.isTemporaryProperty =
            isTemporaryProperty && conversationType === EConversationType.SMS;
          this.conversationPropertyId =
            conversation?.propertyId ||
            currentVoicemailConversation?.propertyId;
        });
    } else {
      this.conversationPropertyId =
        this.participantInfo?.conversationPropertyId;
    }

    this.searchText$.valueChanges
      .pipe(
        takeUntil(this.subscriber),
        distinctUntilChanged((prev, current) => {
          if (!prev) return false;
          return prev.trim() === current.trim();
        }),
        debounceTime(300)
      )
      .subscribe((searchValue: string) => {
        this.onSetEmptyContactList.emit();
        this.onSearch.emit({
          search: searchValue.trim(),
          page: this.DEFAULT_PAGE,
          limit: this.DEFAULT_LIMIT
        });
        this.currentPage = this.DEFAULT_PAGE;
      });

    this.voicemailInboxService.currentVoicemailTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentVoicemailTask) => {
        this.currentVoicemailTask = currentVoicemailTask;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    const { contactList } = changes;
    if (contactList?.currentValue) {
      this.totalItem = this.contactList.length;
      this.cdr.markForCheck();
    }
  }

  onClearSearch() {
    this.searchText$.setValue('');
  }

  onScroll() {
    if (this.isLoadingList) return;

    const element = this.viewport?.elementRef.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (
      distanceFromBottom <= this.LAZY_LOAD_ASSIGNEE &&
      !this.isScrolledToBottom &&
      this.totalPage !== this.currentPage
    ) {
      this.isScrolledToBottom = true;
      this.currentPage += 1;
      this.onSearch.emit({
        page: this.currentPage,
        search: this.searchText$.value || '',
        limit: this.DEFAULT_LIMIT
      });
    } else if (
      (distanceFromBottom >= this.LAZY_LOAD_ASSIGNEE &&
        this.isScrolledToBottom) ||
      this.totalPage === this.currentPage
    ) {
      this.isScrolledToBottom = false;
    }
  }

  onClickPopup(e: Event) {
    e.stopPropagation();
  }

  trackByFn(item) {
    return item.id;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  onAddNewContact() {
    this.isOpenContactList = false;
    this.showCreateNewContact = true;
  }

  handleClickAddContact(participant: UserInformation) {
    if (
      this.isAddingContact ||
      this.isConsole ||
      this.isArchiveMailbox ||
      this.isDisconnectedMailbox
    )
      return;

    this.selectedUserPropertyId = participant.userPropertyId || participant.id;
    this.selectPropertyId = participant.property?.id;
    this.selectedUserType =
      participant.userPropertyType || participant.userType;
    this.selectedUserId = participant.id;

    if (this.applySecondaryLogic && !this.isTemporaryProperty) {
      this.onConfirmSelectContactSecondaryEmail();
      return;
    }
    this.onConfirmSelectContact();
  }

  handleOnCloseCreateContact(contact?: CreateNewContactUserResponse) {
    this.showCreateNewContact = false;
    //contact exists meaning create new contact
    if (contact) {
      this.selectedUserPropertyId = contact.id;
      this.selectedUserType = contact.type;
      this.onConfirmSelectContact();
    } else {
      this.isOpenContactList = true;
    }
  }

  onConfirmSelectContactSecondaryEmail() {
    const isFromVoiceMail =
      this.participantInfo.conversationType === EConversationType.VOICE_MAIL;
    const isFromSMS =
      this.participantInfo.conversationType === EConversationType.SMS;
    const isFromWhatsApp =
      this.participantInfo.conversationType === EConversationType.WHATSAPP;
    const isEmailVerified = !!this.participantInfo.emailVerified;

    if (isFromSMS || isFromWhatsApp) {
      const addPhoneObservable = this.userService.addSecondaryPhoneToContact(
        this.selectedUserId,
        this.participantInfo.fromPhoneNumber,
        this.selectPropertyId,
        isFromWhatsApp && this.participantInfo.channelUserId
      );
      const addEmailObservable = this.userService.addSecondaryEmailToContact(
        this.selectedUserId,
        this.participantInfo.emailVerified,
        this.selectPropertyId,
        this.participantInfo.channelUserId
      );
      if (isEmailVerified) {
        forkJoin([addPhoneObservable, addEmailObservable])
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.onCloseDropdownAddContact.emit();
              this.onOk.emit();
            },
            error: (err) => {
              this.onCloseDropdownAddContact.emit();
            }
          });
      } else {
        addPhoneObservable.pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.onCloseDropdownAddContact.emit();
            this.onOk.emit();
          },
          error: (err) => {
            this.onCloseDropdownAddContact.emit();
          }
        });
      }
    } else {
      const observable =
        isFromVoiceMail && this.applySecondaryLogic
          ? this.userService.addSecondaryPhoneToContact(
              this.selectedUserId,
              this.participantInfo.fromPhoneNumber,
              this.selectPropertyId
            )
          : this.userService.addSecondaryEmailToContact(
              this.selectedUserId,
              this.participantInfo.email,
              this.selectPropertyId,
              this.participantInfo.channelUserId,
              this.conversationTaskId
            );
      observable.pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.toastrService.success('Assigned successfully');
          if (res?.assignToAgents) {
            this.taskService.currentTask$.next({
              ...this.taskService.currentTask$.getValue(),
              assignToAgents: res.assignToAgents
            });
          }
          this.onCloseDropdownAddContact.emit();
          this.onOk.emit();
        },
        error: (err) => {
          this.onCloseDropdownAddContact.emit();
        }
      });
    }
  }

  onConfirmSelectContact() {
    if (this.selectedPropertyId)
      this.propertyService
        .getPropertyById(this.selectedPropertyId)
        .subscribe((result) => {
          if (!result) return;
          this.propertyService.currentTaskRegion.next({
            id: result?.regionId,
            name: result?.state
          });
        });
    this.handleConfirmSelectContact(
      this.selectedUserPropertyId,
      this.selectedUserType,
      this.isReassign,
      this.participantInfo
    );
    this.resetField();
  }

  resetField() {
    this.selectedUserPropertyId = null;
    this.selectedUserType = null;
  }

  handleConfirmSelectContact(id, type, isReassign, participant): void {
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
    const requireCreateSecondContact =
      [EConversationType.SMS, EConversationType.WHATSAPP].includes(
        this.participantInfo?.conversationType
      ) ?? false;
    const tempParams = [
      this.getEmailForContactFetch(participant, true),
      this.getPhoneNumberForContactFetch(participant, true),
      participant?.userId,
      false, //isSuggested
      this.participantInfo.channelUserId,
      requireCreateSecondContact
    ];

    const taskId =
      this.taskService.currentTask$.value?.id ||
      this.currentVoicemailTask?.id ||
      participant.taskId;
    const conversationId =
      this.conversationService.currentConversation.value?.id ||
      this.currentVoicemailConversation?.id ||
      participant.conversationId;
    const agencyId =
      this.conversationService.currentConversation.value?.agencyId ||
      this.currentVoicemailConversation?.agencyId;

    const confirmMethodsMap = new Map([
      [
        isTenantType,
        {
          method: this.conversationService.confirmTrudiContact.bind(
            this.conversationService
          ),
          params: [conversationId, taskId, id, agencyId, ...tempParams]
        }
      ],
      [
        isOtherType,
        {
          method:
            this.conversationService.confirmTrudiSupplierOrOtherContact.bind(
              this.conversationService
            ),
          params: [id, taskId, conversationId, ...tempParams]
        }
      ]
    ]);

    const { method: confirmMethod, params } = confirmMethodsMap.get(true) || {
      method: null,
      params: null
    };

    this.isAddingContact = true;
    if (confirmMethod) {
      this.sharedService.setLoadingDetailHeader(true);
      confirmMethod(...params)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.taskService.reloadTaskDetail.next(true);
            if (
              this.participantInfo.conversationType ===
              EConversationType.MESSENGER
            ) {
              this.conversationService.setParticipantChanged({
                ...res,
                oldUserId: participant.userId,
                conversationPropertyId: res.propertyId,
                isReassign
              });
            } else {
              this.conversationService.setParticipantChanged({
                ...res,
                oldUserId: participant.userId,
                isReassign
              });
            }
          },
          error: () => {
            this.sharedService.setLoadingDetailHeader(false);
          },
          complete: () => {
            this.onCloseDropdownAddContact.emit();
            this.onOk.emit();
            this.isAddingContact = false;
            this.isOpenContactList = true;
          }
        });
    } else {
      this.isOpenContactList = true;
      this.isAddingContact = false;
    }
  }

  private getEmailForContactFetch(
    participant: IUserParticipant,
    isConfirm?: boolean
  ): string {
    let trudiEmail =
      participant.conversationType === EConversationType.SMS
        ? !!participant?.emailVerified
          ? participant?.emailVerified
          : ''
        : participant?.secondaryEmail ||
          participant?.email ||
          participant?.emailVerified;
    if (participant.conversationType === EConversationType.WHATSAPP) {
      trudiEmail = !!participant?.emailVerified
        ? participant?.emailVerified
        : '';
    }
    return ![ECreatedFrom.VOICE_MAIL].includes(participant?.createdFrom) &&
      ((isEmail(trudiEmail) && participant?.isMultipleContact) || isConfirm)
      ? trudiEmail
      : '';
  }

  private getPhoneNumberForContactFetch(
    participant,
    isConfirm?: boolean
  ): string {
    return [
      EConversationType.VOICE_MAIL,
      EConversationType.SMS,
      EConversationType.WHATSAPP
    ].includes(participant?.conversationType) &&
      (participant?.isMultipleContact || isConfirm)
      ? participant?.phoneNumberFromConversationLog ||
          participant?.fromPhoneNumber
      : '';
  }
}
