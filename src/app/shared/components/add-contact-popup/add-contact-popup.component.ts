import { animate, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  TemplateRef
} from '@angular/core';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  tap
} from 'rxjs';
import { UserService } from '@services/user.service';
import {
  ListTrudiContact,
  OnSearchValueEmitter,
  UserInformation
} from '@shared/types/trudi.interface';
import { SharedService } from '@services/shared.service';
import { EConfirmContactType, EConversationType } from '@shared/enum';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { ConversationService } from '@services/conversation.service';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';

const NOTE_ZONE_TRANSITION = '.25s';

@Component({
  selector: 'add-contact-popup',
  templateUrl: './add-contact-popup.component.html',
  styleUrls: ['./add-contact-popup.component.scss'],
  animations: [
    trigger('toTopFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 1, transform: 'translateY(8px)' })
        )
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(8px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 0, transform: 'translateY(-10px)' })
        )
      ])
    ]),
    trigger('collapse', [
      transition(':enter', [
        style({ height: '0' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '108px' }))
      ]),
      transition(':leave', [
        style({ height: '108px' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '0' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.25s', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.25s', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddContactPopupComponent implements OnDestroy {
  @Input() disabled: boolean = false;
  @Input() participantInfo: UserInformation;
  @Input() applySecondaryLogic: boolean = false;
  @Input() set popoverPlacement(value: 'bottomRight' | 'bottomLeft') {
    this.placement = value;
  }
  @Output() onOk = new EventEmitter<boolean>();
  @ContentChild('template', { static: false })
  template: TemplateRef<unknown>;
  public placement: 'bottomRight' | 'bottomLeft';
  public contactList: ListTrudiContact[] = [];
  public visibleDropdown: boolean = false;
  public totalPage: number = 1;
  public isLoadingList: boolean = false;

  private destroy$ = new Subject();

  constructor(
    private readonly userService: UserService,
    private readonly sharedService: SharedService,
    private readonly conversationService: ConversationService,
    private readonly cdr: ChangeDetectorRef,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private voiceMailService: VoiceMailService
  ) {}

  handleOnSearchUnHappyPath({ search, page, limit }: OnSearchValueEmitter) {
    if (this.shouldSkipContactFetch(page)) return;
    this.isLoadingList = true;
    const conversationPropertyId =
      this.conversationService.currentConversation.value?.propertyId ||
      this.voiceMailService.currentVoicemailConversationValue$?.propertyId;
    const emailIgnores = [
      EConversationType.SMS,
      EConversationType.WHATSAPP
    ].includes(this.participantInfo.conversationType)
      ? [this.participantInfo.emailVerified]
      : this.participantInfo?.email
      ? [this.participantInfo.email]
      : [];
    const phoneNumberIgnore = encodeURIComponent(
      this.participantInfo?.fromPhoneNumber
    );

    this.userService
      .getListTrudiContact(
        search,
        '',
        page,
        limit,
        null,
        conversationPropertyId,
        emailIgnores,
        phoneNumberIgnore
      )
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          if (page === 1) {
            this.contactList = [];
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.totalPage = res.totalPage;
            this.updateContactList(res.contacts);
            this.isLoadingList = false;
            this.cdr.markForCheck();
          }
        },
        complete: () => {
          this.isLoadingList = false;
          this.cdr.markForCheck();
        }
      });
  }

  private updateContactList(contacts: ListTrudiContact[]): void {
    const newContacts = contacts.map((item) => ({
      ...item,
      fullName: this.sharedService.displayName(item.firstName, item.lastName),
      propertyTypeOrAddress:
        this.contactTitleByConversationPropertyPipe.transform(item, {
          isNoPropertyConversation: false,
          isMatchingPropertyWithConversation: true,
          showOnlyRole: true,
          showPrimaryText: true
        })
    }));

    const tempContactList = [...this.contactList, ...newContacts];
    this.contactList = tempContactList;
    this.cdr.markForCheck();
  }

  private shouldSkipContactFetch(page: number): boolean {
    return this.totalPage && page > this.totalPage;
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
      return this.sharedService.displayCapitalizeFirstLetter(
        USER_TYPE_IN_RM[item.userPropertyType]?.toLowerCase() ||
          item.userPropertyType?.toLowerCase()
      );
    }
  }

  setEmptyContactList() {
    this.contactList = [];
  }

  onDropdownMenuVisibleChange(event) {
    this.visibleDropdown = event;
    if (event) {
      this.handleOnSearchUnHappyPath({ search: '', page: 1, limit: 10 });
    } else {
      this.setEmptyContactList();
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
