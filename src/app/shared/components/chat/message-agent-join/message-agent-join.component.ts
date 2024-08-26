import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  Output,
  EventEmitter
} from '@angular/core';
import { trudiUserId } from '@/app/services/constants';
import { ConversationService } from '@/app/services/conversation.service';
import { ECreatedFrom, EMessageType } from '@shared/enum/messageType.enum';
import { EPage } from '@shared/enum/trudi';
import { EConversationType, EUserPropertyType } from '@/app/shared/enum';
import { UserProperty } from '@/app/shared/types';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { IFacebookMessage } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';

@Component({
  selector: 'app-message-agent-join',
  templateUrl: './message-agent-join.component.html',
  styleUrls: ['./message-agent-join.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageAgentJoinComponent implements OnChanges {
  public trudiUserId = trudiUserId;
  public isSendFromEmail: boolean = false;
  @Input() message: IFacebookMessage | null = null;
  @Input() title: string | null = null;
  @Input() conversationType: EConversationType;
  @Output() nameClickEvent = new EventEmitter<void>();
  public EMessageTypeEnum = EMessageType;
  public ECreatedFrom = ECreatedFrom;
  public EUserPropertyType = EUserPropertyType;
  public EPage = EPage;
  public EConversationType = EConversationType;
  constructor(
    private conversationService: ConversationService,
    private readonly userProfileDrawerService: UserProfileDrawerService
  ) {}

  get isClickable() {
    return (
      this.message?.userType === EUserPropertyType.LEAD &&
      [
        EConversationType.WHATSAPP,
        EConversationType.MESSENGER,
        EConversationType.SMS
      ].includes(this.conversationType)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']?.currentValue) {
      this.isSendFromEmail =
        this.conversationService.checkIsSendFromEmail(
          this.message.conversationId
        ) &&
        ![
          EConversationType.WHATSAPP,
          EConversationType.MESSENGER,
          EConversationType.SMS,
          EConversationType.APP
        ].includes(this.conversationType);
      this.getTitleTrudiJoinSMS();
    }
  }

  getTitleTrudiJoinSMS() {
    if (
      ![
        EConversationType.WHATSAPP,
        EConversationType.SMS,
        EConversationType.APP
      ].includes(this.conversationType) ||
      this.message.userId !== trudiUserId
    )
      return;
    const AI_ASSISTANT = 'Trudi®, AI Assistant';
    this.message.firstName = AI_ASSISTANT;
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
