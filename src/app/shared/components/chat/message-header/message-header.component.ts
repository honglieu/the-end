import {
  EConversationType,
  EMessageComeFromType,
  EUserPropertyType
} from '@shared/enum';
import { SendMesagePopupOpenFrom } from '@shared/enum/share.enum';
import { UserConversation } from '@shared/types/conversation.interface';
import { IMessage } from '@shared/types/message.interface';
import { IUserParticipant } from '@shared/types/user.interface';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { UserService } from '@services/user.service';
import { ReplyMessageService } from '@services/reply-message.service';

@Component({
  selector: 'app-message-header',
  templateUrl: './message-header.component.html',
  styleUrls: ['./message-header.component.scss']
})
export class MessageHeaderComponent implements OnChanges {
  @Input() senderType: string | null = null;
  @Input() firstName: string | null = null;
  @Input() lastName: string | null = null;
  @Input() createdAt: string | null = null;
  @Input() currentConversation: UserConversation;
  @Input() message: IMessage;
  public isTrudiSender: boolean;
  public senderOfMessage: IUserParticipant;
  public replyTitle: string = null;

  readonly EConversationType = EConversationType;

  constructor(
    private readonly userProfileDrawerService: UserProfileDrawerService,
    private userService: UserService,
    private replyMessageService: ReplyMessageService
  ) {}

  get isConversationAppOrVoicemail(): boolean {
    return [EConversationType.APP, EConversationType.VOICE_MAIL].includes(
      this.currentConversation?.conversationType
    );
  }

  get canViewProfile(): boolean {
    return this.isConversationAppOrVoicemail && !this.isTrudiSender;
  }

  get fullName(): string {
    return (
      `${this.firstName ? this.firstName + ' ' : ''}${
        this.lastName || ''
      }`.trim() || 'Unknown'
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message']?.currentValue) {
      const {
        emailMetadata,
        email,
        userId,
        firstName,
        lastName,
        userType,
        name,
        userPropertyType,
        senderType
      } = this.message || {};

      const { propertyId } = this.currentConversation || {};

      this.senderOfMessage = emailMetadata?.from?.length
        ? emailMetadata.from[0]
        : ({
            email,
            userId,
            firstName,
            lastName,
            propertyId,
            userType,
            name,
            userPropertyType
          } as unknown as IUserParticipant);

      this.isTrudiSender = senderType === SendMesagePopupOpenFrom.trudi;
      this.replyTitle = this.replyMessageService.getReplyTitle(this.message);
    }
  }

  handleOpenUserProfile(event) {
    event.stopPropagation();
    const { userType: senderUserType, email: senderEmail } =
      this.senderOfMessage || {};
    const {
      createdFrom,
      fromPhoneNumber,
      creator,
      userType: messageUserType
    } = this.message || {};
    const { email: conversationEmail } = this.currentConversation || {};

    const dataUser = {
      ...this.senderOfMessage,
      email: senderEmail || creator?.email || conversationEmail,
      createdFrom: createdFrom,
      fromPhoneNumber: fromPhoneNumber,
      userType: senderUserType || messageUserType
    };

    const isMailboxOrLeadType = [
      EUserPropertyType.LEAD,
      EUserPropertyType.MAILBOX
    ].includes((senderUserType || messageUserType) as EUserPropertyType);

    if (
      isMailboxOrLeadType &&
      [EMessageComeFromType.APP].includes(createdFrom)
    ) {
      dataUser.email = creator?.email;
      dataUser.userId = creator?.id;
    }

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }
}
