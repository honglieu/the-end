import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { VoiceMailQueryType } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { TaskStatusType, TrudiUiModule } from '@trudi-ui';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { combineNames, ILastPmJoined } from '@/app/shared';
import { SharedService } from '@/app/services';

export enum EJoinConversationContent {
  AI_CONTROL = 'Your AI Assistant is in control of this conversation',
  AI_NEED_HUMAN = 'Your AI Assistant needs a human to join this conversation',
  HAS_PM_JOIN_CONVERSATION = 'is in control of this conversation'
}

export enum EJoinConversationOpenFrom {
  VOICE_MAIL = 'VOICE_MAIL',
  SMS = 'SMS',
  DEFAULT = 'DEFAULT'
}

@Component({
  selector: 'join-conversation',
  standalone: true,
  imports: [CommonModule, TrudiUiModule],
  templateUrl: './join-conversation.component.html',
  styleUrl: './join-conversation.component.scss'
})
export class JoinConversationComponent implements OnInit, OnDestroy, OnChanges {
  @Input() openFrom: EJoinConversationOpenFrom =
    EJoinConversationOpenFrom.DEFAULT;
  @Input() disabled: boolean = false;
  @Input() disabledTooltipText: string = '';
  @Input() currentConversation;
  @Output() joinConversation = new EventEmitter<void>();
  public textContent: EJoinConversationContent | string =
    EJoinConversationContent.AI_CONTROL;
  public isResolved: boolean = false;
  public isVoicemail: boolean = false;
  public disableJoinBtn: boolean = false;
  public isConsole: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.isResolved =
          params[VoiceMailQueryType.MESSAGE_STATUS] ===
          TaskStatusType.completed;
        this.checktoDisableJoinBtn();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    const { openFrom, disabled } = changes || {};

    if (openFrom) {
      this.isVoicemail = this.openFrom === EJoinConversationOpenFrom.VOICE_MAIL;
    }

    if (disabled) {
      this.checktoDisableJoinBtn();
    }

    if (changes['currentConversation']) {
      const currentConversation = changes['currentConversation'].currentValue;

      const isPmJoined = currentConversation?.isPmJoined;
      const isHasTicketSession = currentConversation?.isHasTicketSession;
      const lastPmJoined = currentConversation?.lastPmJoined;

      if (!isPmJoined) {
        if (!isHasTicketSession) {
          this.textContent = EJoinConversationContent.AI_CONTROL;
        } else {
          this.textContent = EJoinConversationContent.AI_NEED_HUMAN;
        }
      } else if (lastPmJoined) {
        const lastPmJoinedData = lastPmJoined;
        this.textContent = [
          combineNames(lastPmJoinedData?.firstName, lastPmJoinedData?.lastName),
          EJoinConversationContent.HAS_PM_JOIN_CONVERSATION
        ].join(' ');
      }
    }

    this.cdr.markForCheck();
  }

  checktoDisableJoinBtn() {
    this.disableJoinBtn = this.isResolved || this.disabled || this.isConsole;
  }

  handleJoinConversation() {
    this.joinConversation.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
