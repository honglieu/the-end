import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { ReminderMessageType } from '@/app/dashboard/modules/inbox/enum/reminder-message.enum';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { SmsMessageListService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message.services';
import { SmsMessageConversationIdSetService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message-id-set.service';
import { ComposeEditorType } from '@/app/dashboard/modules/inbox/modules/sms-view/components/sms-compose-message/sms-compose-message.component';
@Component({
  selector: 'sms-view',
  templateUrl: './sms-view.component.html',
  styleUrl: './sms-view.component.scss'
})
export class SmsViewComponent implements OnInit, OnDestroy {
  public readonly EViewDetailMode = EViewDetailMode;
  private readonly destroy$ = new Subject<void>();
  public showMessageDetail: boolean = false;
  public hasSelectedInbox: boolean = false;
  public queryParam: Params = {};
  public isReminderMessage: boolean = false;
  public isCreateNewMessage = false;
  readonly ReminderMessageType = ReminderMessageType;
  readonly ComposeEditorType = ComposeEditorType;

  constructor(
    private readonly smsMessageConversationIdSetService: SmsMessageConversationIdSetService,
    private readonly inboxToolbarService: InboxToolbarService,
    private smsMessageListService: SmsMessageListService
  ) {}

  ngOnInit(): void {
    this.onMessageIdsChanged();
    this.onSelectedInboxChanged();
  }

  private onSelectedInboxChanged(): void {
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((inboxItem) => {
        this.hasSelectedInbox = Boolean(inboxItem.length);
      });
  }

  private onMessageIdsChanged() {
    this.smsMessageConversationIdSetService.isMessageIdsEmpty$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isMessageIdsEmpty) => {
        this.showMessageDetail = !isMessageIdsEmpty;
      });

    this.inboxToolbarService.triggerResetMessageDetail$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showMessageDetail = false;
      });
  }

  ngOnDestroy(): void {
    this.smsMessageListService.setPreFillCreateNewMessage(null);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
