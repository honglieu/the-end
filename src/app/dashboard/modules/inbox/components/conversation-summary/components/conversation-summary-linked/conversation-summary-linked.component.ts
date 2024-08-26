import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { ILinkedConversation } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { GroupType } from '@shared/enum/user.enum';
import { Router } from '@angular/router';
import { IUserParticipant } from '@shared/types/user.interface';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { PreviewConversation } from '@/app/shared';
import { IlinkedEmailToDisplay } from '@/app/dashboard/modules/inbox/components/conversation-summary/interface/conversation-summary';

@Component({
  selector: 'conversation-summary-linked',
  templateUrl: './conversation-summary-linked.component.html',
  styleUrl: './conversation-summary-linked.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationSummaryLinkedComponent implements OnChanges {
  @Input() linkedEmail: ILinkedConversation;
  @Input() currentConversation: PreviewConversation;

  public sender: IUserParticipant;
  public linkedEmailToDisplay: IlinkedEmailToDisplay;
  public screenWidth: number;

  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;
  public tooltipTitle: string = '';

  constructor(
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private router: Router
  ) {
    this.screenWidth = window.innerWidth;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.screenWidth = event.target.innerWidth;
    if (!this.linkedEmail) return;
    this.mapLinkedEmailToDisplay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['linkedEmail']?.currentValue) {
      this.sender = this.linkedEmail?.emailMetaData?.from?.[0];
      this.mapLinkedEmailToDisplay();
    }
  }

  private mapLinkedEmailToDisplay() {
    const { emailMetaData, previewMessage, title, isUrgent } =
      this.linkedEmail || {};

    const { messageDate, textContent, countAttachment } = previewMessage || {};

    const from = {
      fromTitle: this.contactTitleByConversationPropertyPipe.transform(
        emailMetaData?.from[0],
        {
          isNoPropertyConversation: false,
          isMatchingPropertyWithConversation: true,
          showOnlyName: true
        }
      ),
      fromRole: this.contactTitleByConversationPropertyPipe.transform(
        emailMetaData?.from[0],
        {
          isNoPropertyConversation: false,
          isMatchingPropertyWithConversation: true,
          showOnlyRole: true
        }
      )
    };

    const mappedToCcBcc = [emailMetaData?.to]
      .concat(emailMetaData?.cc, emailMetaData?.bcc)
      .flat();

    const isSmallScreenSize =
      this.screenWidth > 1200 && this.screenWidth < 1400;
    const displayCount = isSmallScreenSize ? 1 : 2;
    const participants = mappedToCcBcc?.map((user) => ({
      userId: user?.userId,
      toTitle: this.contactTitleByConversationPropertyPipe.transform(user, {
        isNoPropertyConversation: false,
        isMatchingPropertyWithConversation:
          this.currentConversation?.propertyId === user?.propertyId,
        showOnlyName: true
      }),
      toRole: this.contactTitleByConversationPropertyPipe.transform(user, {
        isNoPropertyConversation: false,
        isMatchingPropertyWithConversation:
          this.currentConversation?.propertyId === user?.propertyId,
        showOnlyRole: true
      }),
      isShowRole: user?.propertyId === this.currentConversation?.propertyId
    }));

    this.linkedEmailToDisplay = {
      from,
      to: participants?.slice(0, displayCount),
      more: mappedToCcBcc.slice(displayCount)?.length,
      timestamp: messageDate,
      emailTitle: title,
      emailContent: textContent,
      isUrgent,
      attachmentCount: countAttachment,
      isReply: title.includes('Re:')
    };
    this.tooltipTitle = participants
      .map(
        (participant) => participant.toTitle + ' (' + participant?.toRole + ')'
      )
      .join('<br>');
  }

  navigateToLinkedEmail() {
    const { taskStatus, taskType, taskId, conversationId, isAssigned } =
      this.linkedEmail;

    const statusUrl = {
      [TaskStatusType.inprogress]: 'all',
      [TaskStatusType.completed]: 'resolved',
      [TaskStatusType.deleted]: 'deleted'
    };
    if (taskType === TaskType.MESSAGE) {
      this.router.navigate(
        ['/dashboard', 'inbox', 'messages', statusUrl[taskStatus]],
        {
          queryParams: {
            inboxType: isAssigned ? GroupType.MY_TASK : GroupType.TEAM_TASK,
            status: taskStatus,
            taskId: taskId,
            conversationId: conversationId
          }
        }
      );
      return;
    }

    if (taskType === TaskType.TASK) {
      this.router.navigate(['/dashboard', 'inbox', 'detail', taskId], {
        queryParams: {
          taskId,
          conversationId
        }
      });
    }
  }

  trackBy(_item, user: IUserParticipant) {
    return user.userId;
  }
}
