import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ApiService } from '@services/api.service';
import { users } from 'src/environments/environment';
import { ConversationService } from '@services/conversation.service';
import { Subject, takeUntil } from 'rxjs';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { EUserPropertyType, UserStatus } from '@shared/enum/user.enum';

@Component({
  selector: 'app-invitation-message',
  templateUrl: './invitation-message.component.html',
  styleUrls: ['./invitation-message.component.scss']
})
export class InvitationMessageComponent implements OnInit, OnDestroy {
  @Input() conversationType: EConversationType;
  @Input() userId: string;
  @Input() propertyId: string;
  @Input() propertyType: EUserPropertyType;
  @Input() inviteStatus: UserStatus;
  @Input() canInviteViaConversation: boolean;
  @Input() inviteViaConversation: boolean;

  public popupModalPosition = ModalPopupPosition;
  public isShow: boolean = false;
  public isInvited: boolean = false;
  public isShowSendInviteSuccessModal = false;
  private showInviteTimeout: NodeJS.Timeout;
  private hideInviteTimeout: NodeJS.Timeout;
  private popupTimeOut: NodeJS.Timeout;
  private unsubscribe = new Subject<void>();
  public activeMobileApp = false;

  constructor(
    private apiService: ApiService,
    private conversationService: ConversationService
  ) {}

  ngOnInit() {
    this.isInvited = this.isInvitedUser(
      this.propertyType,
      this.inviteStatus,
      this.canInviteViaConversation,
      this.inviteViaConversation
    );
    this.showInviteTimeout = setTimeout(() => {
      this.isShow = true;
    }, 500);

    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.inviteStatus = res.inviteStatus;
          this.canInviteViaConversation = res.canInviteViaConversation;
          this.inviteViaConversation = res.inviteViaConversation;
          this.propertyType = res.propertyType;
          this.isInvited = this.isInvitedUser(
            this.propertyType,
            this.inviteStatus,
            this.canInviteViaConversation,
            this.inviteViaConversation
          );
        }
      });
  }

  isInvitedUser(
    propertyType: EUserPropertyType,
    inviteStatus: UserStatus,
    canInviteViaConversation: boolean,
    inviteViaConversation: boolean
  ): boolean {
    return (
      [EUserPropertyType.LANDLORD, EUserPropertyType.TENANT].includes(
        propertyType
      ) &&
      inviteStatus !== UserStatus.ACTIVE &&
      !inviteViaConversation &&
      canInviteViaConversation
    );
  }

  handleSendInvite() {
    if (
      this.isInvitedUser(
        this.propertyType,
        this.inviteStatus,
        this.canInviteViaConversation,
        this.inviteViaConversation
      )
    ) {
      this.onSendInvite(this.userId, this.propertyId);
    }
  }

  onSendInvite(userId: string, propertyId: string) {
    this.handleCloseInvite();
    const body = {
      userProperties: [{ userId, propertyId }],
      options: { inviteViaConversation: true }
    };
    this.apiService.postAPI(users, 'send-bulk-app-invite', body).subscribe(
      (response) => {
        if (response) {
          this.isShowSendInviteSuccessModal = true;
          this.popupTimeOut = setTimeout(() => {
            this.isShowSendInviteSuccessModal = false;
          }, 3000);
        }
      },
      (error) => {
        console.error(error);
      }
    );
  }

  handleCloseInvite() {
    this.isShow = false;
    this.hideInviteTimeout = setTimeout(() => {
      this.isInvited = false;
    }, 2000);
  }

  handleCloseInviteApi(userId: string) {
    this.handleCloseInvite();
    const body = {
      canInviteViaConversation: false
    };
    this.apiService
      .putAPI(users, `update-invite-via-conversation/${userId}`, body)
      .subscribe();
  }

  ngOnDestroy(): void {
    clearTimeout(this.showInviteTimeout);
    clearTimeout(this.popupTimeOut);
    clearTimeout(this.hideInviteTimeout);
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
