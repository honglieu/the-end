import { Component, OnDestroy, OnInit } from '@angular/core';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { MessageIdSetService } from './services/message-id-set.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { ReminderMessageType } from '@/app/dashboard/modules/inbox/enum/reminder-message.enum';

@Component({
  selector: 'message-list-view',
  templateUrl: './message-list-view.component.html',
  styleUrls: ['./message-list-view.component.scss']
})
export class MessageListViewComponent implements OnInit, OnDestroy {
  public readonly EViewDetailMode = EViewDetailMode;
  private readonly destroy$ = new Subject<void>();
  public showTaskDetail: boolean = false;
  public hasSelectedInbox: boolean = false;
  public queryParam: Params;
  public isReminderMessage: boolean = false;
  readonly ReminderMessageType = ReminderMessageType;

  constructor(
    private readonly messageIdSetService: MessageIdSetService,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.onMessageIdsChanged();
    this.onSelectedInboxChanged();
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((queryParam) => {
        this.queryParam = queryParam;
        this.isReminderMessage = [
          ReminderMessageType.UNANSWERED,
          ReminderMessageType.FOLLOW_UP
        ].includes(queryParam['reminderType']);
      });
  }

  private onSelectedInboxChanged(): void {
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((inboxItem) => {
        this.hasSelectedInbox = Boolean(inboxItem.length);
      });
  }

  private onMessageIdsChanged() {
    this.messageIdSetService.isMessageIdsEmpty$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((isMessageIdsEmpty) => {
        this.showTaskDetail = !isMessageIdsEmpty;
      });
    this.inboxToolbarService.triggerResetMessageDetail$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showTaskDetail = false;
        this.messageIdSetService.setIsMessageIdsEmpty(true);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
