import { Component, Input, OnInit } from '@angular/core';
import { CallingService } from '@services/calling.service';
import { UserService } from '@services/user.service';
import { CallTypeEnum } from '@shared/enum/share.enum';
import { UserStatus } from '@shared/enum/user.enum';

enum MessageCallState {
  active,
  finished,
  missed
}
@Component({
  selector: 'app-message-call',
  templateUrl: './message-call.component.html',
  styleUrls: ['./message-call.component.scss']
})
export class MessageCallComponent implements OnInit {
  @Input() message: any | null = null;
  @Input() userId;
  @Input() currentConversationId: string;
  public messageCallState = MessageCallState;
  public getCallTime: any;
  public callState: MessageCallState;
  public callType = CallTypeEnum;
  public userStatus = UserStatus;

  constructor(
    private userService: UserService,
    private callingService: CallingService
  ) {}

  ngOnInit(): void {
    this.getCallTime = this.callingService.getCallTime(
      this.message.messageCall
    );
    this.callState = this.getCallState(this.message.messageCall);
  }

  getCallState(messageCall: any) {
    if (messageCall) {
      if (!messageCall.endedAt) {
        return MessageCallState.active;
      }

      if (
        !messageCall.participiants ||
        messageCall.participiants.find(
          (participiant) => !participiant?.joinedAt
        )
      ) {
        return MessageCallState.missed;
      }

      if (messageCall.endedAt) {
        return MessageCallState.finished;
      }
    }
    return MessageCallState.finished;
  }
}
