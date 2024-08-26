import { EInboxFilterSelected } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, take, takeUntil } from 'rxjs';

@Component({
  selector: 'filter-show-task-message',
  templateUrl: './filter-show-task-message.component.html',
  styleUrl: './filter-show-task-message.component.scss'
})
export class FilterShowTaskMessageComponent implements OnInit, OnDestroy {
  @Input() isDisabled: boolean = false;
  public isShowTaskMessage: boolean = false;
  private unsubscribe = new Subject<void>();
  public titleToggle: string;

  constructor(
    public inboxFilterService: InboxFilterService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.preFillWhenReload();
    this.inboxFilterService.showMessageInTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShowTaskMessage: boolean) => {
        this.isShowTaskMessage = isShowTaskMessage;
        this.inboxFilterService.patchValueSelectedItem(
          'showTaskMessage',
          this.isShowTaskMessage ? 1 : 0
        );
      });
    this.getMessageType();
  }

  getMessageType() {
    const url = this.router.url;
    this.titleToggle = url.includes('/inbox/messages')
      ? 'emails'
      : url.includes('/inbox/app-messages')
      ? 'messages'
      : url.includes('/inbox/voicemail-messages')
      ? 'voicemails'
      : url.includes('/inbox/sms-messages')
      ? 'sms'
      : 'emails';
  }

  onShowTaskEmailsChange(status: boolean): void {
    this.isShowTaskMessage = status;
    this.inboxFilterService.setShowMessageInTask(status);
    this.inboxFilterService.patchValueSelectedItem(
      'showTaskMessage',
      this.isShowTaskMessage ? 1 : 0
    );
    this.router.navigate([], {
      queryParams: {
        showMessageInTask: this.isShowTaskMessage || null
      },
      queryParamsHandling: 'merge'
    });
  }

  private preFillWhenReload() {
    combineLatest([
      this.inboxFilterService.showMessageInTask$,
      this.activatedRoute.queryParams
    ])
      .pipe(takeUntil(this.unsubscribe), take(1))
      .subscribe(([status, queryParams]) => {
        const showMessageInTask =
          queryParams?.[EInboxFilterSelected.SHOW_MESSAGE_IN_TASK];
        if (!status && showMessageInTask === 'true') {
          this.inboxFilterService.setShowMessageInTask(showMessageInTask);
        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
