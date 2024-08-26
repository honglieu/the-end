import { UserType } from '@/app/services/constants';
import {
  EConfirmContactType,
  EConversationType,
  ECreatedFrom,
  EUserPropertyType
} from '@shared/enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { EPage } from '@shared/enum/trudi';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { UserProperty } from '@/app/shared/types';

@Component({
  selector: 'app-message-reopened',
  templateUrl: './message-reopened.component.html',
  styleUrls: ['./message-reopened.component.scss']
})
export class MessageReopenedComponent implements OnInit, OnChanges {
  @Input() message;
  @Input() conversationType?: EConversationType;
  @Input() phoneNumber: string = '';
  public title: string = '';
  public isFromMailBox: boolean = false;
  public isUserFromApp: boolean = false;
  public EPage = EPage;
  public ECreatedFrom = ECreatedFrom;
  public EUserPropertyType = EUserPropertyType;
  public userRole: string = '';
  public checkToShowPhoneNumber: boolean;
  constructor(
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private userProfileDrawerService: UserProfileDrawerService
  ) {}

  get isClickable() {
    return (
      this.message?.userType === EUserPropertyType.LEAD &&
      [
        EConversationType.MESSENGER,
        EConversationType.SMS,
        EConversationType.WHATSAPP
      ].includes(this.conversationType)
    );
  }

  ngOnInit(): void {
    this.title = this.message?.title;
    this.isFromMailBox =
      this.message?.userType === EConfirmContactType.MAILBOX && !!this.title;
    this.isUserFromApp =
      this.message?.createdFrom === ECreatedFrom.APP &&
      this.message?.userType == UserType.USER;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message']?.currentValue) {
      const isNoPropertyConversation = this.message?.property?.isTemporary;
      this.userRole = this.contactTitleByConversationPropertyPipe.transform(
        this.message,
        {
          isNoPropertyConversation,
          isMatchingPropertyWithConversation: true,
          showFullContactRole: true
        }
      );

      this.checkToShowPhoneNumber = this.shouldShowPhoneNumber();
    }
  }

  shouldShowPhoneNumber(): boolean {
    const isSMS =
      this.conversationType === EConversationType.SMS &&
      this.message?.isUserFromSms &&
      !!this.phoneNumber;
    const isWhatsApp =
      this.conversationType === EConversationType.WHATSAPP &&
      ![localStorage.getItem('userId')].includes(this.message?.creator?.id) &&
      this.message?.creator?.externalId;
    return isSMS || isWhatsApp;
  }

  handleOpenProfileDrawer(event: MouseEvent) {
    if (!this.isClickable) return;
    event.stopPropagation();

    const { userId, firstName, creator, userType } = this.message;

    let dataUser = {
      ...this.message,
      pmUserId: userId,
      pmName: firstName,
      email: creator.email,
      sendFromUserType: userType,
      pmNameClick: true,
      conversationType: this.conversationType
    };

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }
}
