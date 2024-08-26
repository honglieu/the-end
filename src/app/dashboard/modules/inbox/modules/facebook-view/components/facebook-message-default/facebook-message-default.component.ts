import { trudiUserId } from '@/app/services/constants';
import {
  PreviewConversation,
  replaceUrlWithAnchorTag,
  UserProperty
} from '@/app/shared';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import {
  EReactionStatus,
  EUserSendType
} from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.enum';
import { IFacebookMessage } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';

@Component({
  selector: 'facebook-message-default',
  templateUrl: './facebook-message-default.component.html',
  styleUrl: './facebook-message-default.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FacebookMessageDefaultComponent implements AfterViewInit {
  @ViewChild('textContain') private textContain: ElementRef;
  @Input() message: IFacebookMessage;
  @Input() currentConversation: PreviewConversation;
  @Input() isSending: boolean = false;
  @Input() isUserVerified: boolean = false;

  public trudiUserId = trudiUserId;
  readonly EUserSendType = EUserSendType;
  readonly EReactionStatus = EReactionStatus;

  constructor(
    private readonly userProfileDrawerService: UserProfileDrawerService
  ) {}

  ngAfterViewInit() {
    this.convertTextToHyperlink();
  }

  convertTextToHyperlink() {
    if (this.textContain && this.textContain.nativeElement) {
      const paragraph = this.textContain.nativeElement as HTMLParagraphElement;

      paragraph.innerHTML = replaceUrlWithAnchorTag(paragraph.innerHTML);

      const anchors = paragraph.querySelectorAll('a');
      anchors.forEach((anchor: HTMLAnchorElement) => {
        if (!anchor.getAttribute('target')) {
          anchor.setAttribute('target', '_blank');
        }
      });
    }
  }

  handleOpenProfileDrawer(event: MouseEvent) {
    if (this.message.userSendType !== EUserSendType.USER) return;

    event.stopPropagation();
    const userId = this.message?.userId;
    const currentDataUserProfile = this.currentConversation?.participants.find(
      (p) => p.userId === userId
    );

    const {
      createdFrom,
      emailVerified,
      channelUserId,
      name,
      propertyId,
      conversationType,
      email
    } = this.currentConversation;

    const dataUser = {
      ...(currentDataUserProfile || this.currentConversation),
      createdFrom,
      emailVerified,
      name,
      email: emailVerified ?? email,
      conversationPropertyId: propertyId,
      channelUserId,
      conversationType,
      pmNameClick: true
    };

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }
}
