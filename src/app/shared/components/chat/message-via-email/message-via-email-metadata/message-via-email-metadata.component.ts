import { trudiUserId } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { EConfirmContactType } from '@shared/enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { IMessage } from '@shared/types/message.interface';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { IUserContact } from '@/app/user/shared/interfaces/user-info-drawer.interfaces';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  EExcludedUserRole,
  EUserPropertyType,
  UserTypeEnum
} from '@shared/enum/user.enum';
import { userType } from '@trudi-ui';
import {
  IUserLabelObject,
  UserInformation
} from '@shared/types/trudi.interface';
import { Property } from '@/app/shared/types';

@Component({
  selector: 'message-via-email-metadata',
  templateUrl: './message-via-email-metadata.component.html',
  styleUrls: ['./message-via-email-metadata.component.scss']
})
export class MessageViaEmailMetadataComponent
  implements OnChanges, OnInit, OnDestroy
{
  @Input() emailMetadataFiled: UserInformation[];
  @Input() hasStyleName: boolean = false;
  @Input() isInfoOfHeader: boolean = false;
  @Input() senderPmName: string = '';
  @Input() conversationProperty: Property;
  @Input() showEmailTag: boolean = true;
  @Input() showRole: boolean = true;
  @Input() showAddContactButton: boolean = false;
  @Input() canViewUserProfile: boolean = false;
  @Input() isSender: boolean = false;
  @Input() userId?: string = null;
  @Input() message?: IMessage = null;

  public EUserPropertyType = EUserPropertyType;
  public EConfirmContactType = EConfirmContactType;
  public pipeType: string = userType.NO_BRACKET;
  public trudiUserId = trudiUserId;
  private unsubscribe: Subject<void> = new Subject<void>();

  constructor(
    public conversationService: ConversationService,
    readonly userProfileDrawerService: UserProfileDrawerService,
    private contactTitleByConversationProperty: ContactTitleByConversationPropertyPipe
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['emailMetadataFiled']?.currentValue) {
      this.setEmailMetadataProperties();
    }
  }

  ngOnInit(): void {
    this.subscribeCurrentConversation();
  }

  subscribeCurrentConversation() {
    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((conversation) => {
        if (this.emailMetadataFiled && !this.conversationProperty) {
          this.setEmailMetadataProperties(conversation);
        }
      });
  }

  setEmailMetadataProperties(conversation?) {
    const currentConversation =
      conversation || this.conversationService.currentConversation.value;
    this.emailMetadataFiled = this.emailMetadataFiled.map(
      (item: UserInformation) => {
        item.name = (
          (item?.firstName?.replace(/"/g, '').trim() ?? '') +
          ' ' +
          (item?.lastName?.replace(/"/g, '').trim() ?? '')
        ).trim();
        item.email = item?.email?.trim() ?? '';
        item.type = item?.userType ?? '';
        item.userLabelObject = this.setUserInformation(
          item,
          currentConversation
        );
        item.hideEmail =
          [
            EExcludedUserRole.BELONGS_TO_OTHER_PROPERTIES,
            EExcludedUserRole.UNRECOGNIZED,
            EExcludedUserRole.EMPTY
          ].includes(item.userLabelObject?.userRole as EExcludedUserRole) &&
          item.userLabelObject.userLabel === item.email;
        return item;
      }
    );
  }

  handleClickEmail(item, event: MouseEvent) {
    event.stopPropagation();
    if (item?.userId === trudiUserId) return;
    const dataUser = item as IUserContact;

    if (dataUser.userType === EUserPropertyType.MAILBOX && this.isSender) {
      dataUser.pmName = this.senderPmName;
      dataUser.pmUserId = this.userId;
      dataUser.isSender = true;
    }
    dataUser.sendFromUserType = this.message?.userType as UserTypeEnum;
    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser
    );
  }

  setUserInformation(item, conversation): IUserLabelObject {
    const userLabelObject: IUserLabelObject = {
      userLabel: this.contactTitleByConversationProperty.transform(item, {
        isNoPropertyConversation:
          conversation?.isTemporaryProperty ||
          this.conversationProperty?.isTemporary,
        isMatchingPropertyWithConversation:
          conversation?.propertyId === item.propertyId ||
          this.conversationProperty?.id === item.propertyId,
        showOnlyName: true
      }),
      userRole: this.contactTitleByConversationProperty.transform(item, {
        isNoPropertyConversation:
          conversation?.isTemporaryProperty ||
          this.conversationProperty?.isTemporary,
        isMatchingPropertyWithConversation:
          conversation?.propertyId === item.propertyId ||
          this.conversationProperty?.id === item.propertyId,
        showOnlyRole: true,
        showFullContactRole: true,
        showCrmStatus: true
      })
    };

    return userLabelObject;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
