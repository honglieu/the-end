import { trudiUserId } from '@/app/services/constants';
import {
  EUserPropertyType,
  PreviewConversation,
  UserProperty
} from '@/app/shared';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { EUserSendType } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.enum';
import { IFacebookMessage } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';

@Component({
  selector: 'facebook-message-footer',
  templateUrl: './facebook-message-footer.component.html',
  styleUrl: './facebook-message-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FacebookMessageFooterComponent implements OnChanges {
  @Input() message: IFacebookMessage;
  @Input() currentConversation: PreviewConversation;
  @Input() isSending: boolean = false;
  @Input() isError: boolean = false;
  @Output() reSendEmitter = new EventEmitter();

  public sender: string;
  public isShowResendButton: boolean = true;
  public trudiUserId = trudiUserId;

  readonly EUserSendType = EUserSendType;
  readonly EUserPropertyType = EUserPropertyType;

  constructor(private userProfileDrawerService: UserProfileDrawerService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message']?.currentValue) {
      if (this.message.userSendType !== EUserSendType.USER) {
        const isSentByTrudi = this.message.userId === trudiUserId;
        const isSentByAgencyPage = this.message.type === EUserSendType.PAGE;
        this.sender = isSentByAgencyPage
          ? this.message.channelUserName
          : isSentByTrudi
          ? 'Trudi'
          : this.message.firstName;
      }
    }
  }

  handleOpenProfileDrawer(event: MouseEvent) {
    if (this.message.userType === EUserPropertyType.AGENT) return;
    event.stopPropagation();

    const { userId, firstName, creator, userType } = this.message;
    let dataUser = {
      ...this.message,
      pmUserId: userId,
      pmName: firstName,
      email: creator.email,
      sendFromUserType: userType,
      pmNameClick: true,
      conversationType: this.currentConversation.conversationType
    };

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }

  onResend() {
    if (!this.isShowResendButton) return;
    this.isSending = true;
    this.isError = false;
    this.reSendEmitter.emit();
  }
}
