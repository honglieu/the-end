import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  IMessagesConfirm,
  IMoveMailFolder
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { CHAR_WIDTH } from '@services/constants';
import { TaskType } from '@shared/enum';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { SharedService } from '@/app/services';

@Component({
  selector: 'confirm-move-message-to-inbox-popup',
  templateUrl: './confirm-move-message-to-inbox-popup.component.html',
  styleUrls: ['./confirm-move-message-to-inbox-popup.component.scss']
})
export class ConfirmMoveMessageToInboxPopupComponent implements OnInit {
  @Input() listMessages: IMoveMailFolder[] = [];
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string[]>();
  public title: string = '';
  public subtitle: string = '';
  public isDisabled: boolean = false;
  public readonly EDetailViewMode = EViewDetailMode;
  public listMessagesConfirm: IMessagesConfirm[] = [];
  public isConsole: boolean;

  constructor(
    private inboxToolbarService: InboxToolbarService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxToolbarService.isShowToolbar.next(false);
    this.listMessagesConfirm = [...this.listMessages]
      .filter((message) => message?.type === TaskType.TASK)
      .map((message) => {
        const listParticipants = message?.participants.map((participant) =>
          participant?.firstName
            ? this.extractContentInsideAngleBrackets(participant?.firstName)
            : this.extractContentInsideAngleBrackets(participant?.email)
        );
        const { displayParticipants, remainingParticipants } =
          this.determineParticipantsToDisplay(listParticipants);
        const textContent = message?.textContent
          ?.replace(/(?:\\[rn])+/g, '')
          .trim();
        return {
          ...message,
          message: textContent,
          displayParticipants,
          remainingParticipants
        };
      });
    this.setTitleAndSubtitle();
  }

  private setTitleAndSubtitle() {
    this.title = `Are you sure you want to move ${this.getMessageText(
      'this email',
      'these emails'
    )} to your inbox?`;

    this.subtitle = `This will remove the ${this.getMessageText(
      'email from its assigned task:',
      'emails from their assigned tasks:'
    )}`;
  }

  private getMessageText(single: string, multiple: string): string {
    return this.listMessagesConfirm.length > 1 ? multiple : single;
  }

  private determineParticipantsToDisplay(listParticipants) {
    let availableSpace = 398;
    let currentCumulativeWidth = 0;
    const displayParticipants = [];
    const firstItemExceedAvailableSpace =
      listParticipants[0]?.length * CHAR_WIDTH > availableSpace;

    const processParticipant = (participant: string) => {
      const participantWidth = participant?.length * CHAR_WIDTH;
      if (currentCumulativeWidth + participantWidth >= availableSpace) {
        return false;
      }
      currentCumulativeWidth += participantWidth + CHAR_WIDTH * 2;
      displayParticipants.push(participant);
      return true;
    };

    if (firstItemExceedAvailableSpace) {
      displayParticipants.push(listParticipants[0]);
    } else {
      for (const participant of listParticipants) {
        if (!processParticipant(participant)) {
          break;
        }
      }
    }

    return {
      displayParticipants,
      remainingParticipants: listParticipants.slice(displayParticipants.length)
    };
  }

  private extractContentInsideAngleBrackets(text: string) {
    const match = /<([^>]+)>/.exec(text);
    return match ? match[1] : text;
  }

  handleRightButtonClick(e: Event) {
    e.stopPropagation();
    const listThreadId = this.listMessages.map((message) => message?.threadId);
    this.confirm.emit(listThreadId);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.isShowToolbar.next(true);
  }

  handleLeftButtonClick(e: Event) {
    e.stopPropagation();
    this.handleCancel();
  }

  handleCancel() {
    this.cancel.emit();
    this.inboxToolbarService.isShowToolbar.next(true);
  }
}
