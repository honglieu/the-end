import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { IFacebookMessage } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { ReplyMessageService } from '@/app/services/reply-message.service';
import { EUserSendType } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.enum';
import {
  EUserPropertyType,
  PreviewConversation,
  UserProperty
} from '@/app/shared';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';

@Component({
  selector: 'facebook-reply-header',
  templateUrl: './facebook-reply-header.component.html',
  styleUrl: './facebook-reply-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FacebookReplyHeaderComponent implements OnChanges, AfterViewInit {
  @ViewChild('replyHeaderText', { static: false })
  replyHeaderText: ElementRef;
  @Input() message: IFacebookMessage;
  @Input() currentConversation?: PreviewConversation;

  replyTitle: string = null;

  constructor(
    private replyMessageService: ReplyMessageService,
    private renderer: Renderer2,
    private userProfileDrawerService: UserProfileDrawerService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message']?.currentValue) {
      this.replyTitle = this.replyMessageService.getReplyTitle(
        this.message as IFacebookMessage
      );
    }
  }

  ngAfterViewInit() {
    const text = this.replyTitle;

    const name =
      this.message.messageReply.userType === EUserPropertyType.LEAD
        ? this.message.messageReply.creator.firstName
        : this.message.messageReply.creator.facebookName;

    // this.renderTextWithClickableNames(text, name);
  }

  renderTextWithClickableNames(text: string, name: string) {
    const container = this.replyHeaderText.nativeElement;

    text = text.replace(
      name,
      `<span class="name-clickable" style="cursor: pointer">${name}</span>`
    );

    container.innerHTML = text;

    const clickableElements = container.querySelectorAll('.name-clickable');
    clickableElements.forEach((element: HTMLElement) => {
      this.renderer.listen(element, 'click', (event) =>
        this.handleOpenProfileDrawer(event)
      );

      element.addEventListener('mouseover', () => {
        element.style.textDecoration = 'underline';
      });
      element.addEventListener('mouseout', () => {
        element.style.textDecoration = 'none';
      });
    });
  }

  handleOpenProfileDrawer(event: MouseEvent) {
    if (
      this.message.messageReply.userType !== EUserPropertyType.LEAD &&
      this.message.messageReply.userType !== EUserPropertyType.USER
    )
      return;
    event.stopPropagation();

    if (this.message.messageReply.userType === EUserPropertyType.LEAD) {
      const { userId, firstName, creator, userType } =
        this.message.messageReply;
      var dataPM = {
        ...this.message.messageReply,
        pmUserId: userId,
        pmName: firstName,
        email: creator.email,
        sendFromUserType: userType
      };
    } else {
      const userId = this.message?.messageReply.userId;
      const currentDataUserProfile =
        this.currentConversation?.participants.find((p) => p.userId === userId);
      const {
        createdFrom,
        emailVerified,
        email,
        channelUserId,
        name,
        conversationType
      } = this.currentConversation;
      var dataUser = {
        ...(currentDataUserProfile || this.currentConversation),
        createdFrom,
        emailVerified,
        name,
        email: emailVerified ?? email,
        channelUserId,
        conversationType
      };
    }

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      (dataPM ?? dataUser) as unknown as UserProperty
    );
  }
}
