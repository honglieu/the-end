import { EUserMailboxRole } from '@/app/mailbox-setting/utils/enum';
import { EMailBoxStatus, EMailBoxType, EmailProvider } from '@shared/enum';
import { IMailBox } from '@shared/types/user.interface';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { FacebookAccountService } from '@/app/dashboard/services/facebook-account.service';

@Component({
  selector: 'mailbox-item',
  templateUrl: './mailbox-item.component.html',
  styleUrl: './mailbox-item.component.scss'
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class MailboxItemComponent implements OnInit, OnDestroy {
  @Input() item: IMailBox;
  @Input() unreadList: { [x: string]: boolean } = {};
  @Input() channelId: string;
  @Input() isLastItem: boolean;
  @Input() isUnderItemOpen: boolean;
  @Output() expandMailbox = new EventEmitter<IMailBox>();
  @Output() selectMailbox = new EventEmitter<string>();
  private unsubscribe = new Subject<void>();
  public isAccountAdded: boolean;
  readonly EUserMailboxRole = EUserMailboxRole;
  readonly EMailBoxStatus = EMailBoxStatus;
  readonly mailBoxType = EMailBoxType;
  readonly EmailProvider = EmailProvider;
  public textTooltip: string = `We've lost connection to your email account.`;
  public dnone: boolean = false;
  public currentParams: Params;
  private isFirstCheck: boolean = true;

  constructor(
    private inboxService: InboxService,
    private inboxSidebarService: InboxSidebarService,
    private readonly router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.checkVisibleSetting();
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.currentParams = res;
        const mailboxActiveString = localStorage.getItem('mailboxActive');
        if (
          this.isFirstCheck &&
          this.currentParams['mailBoxId'] &&
          !mailboxActiveString
        ) {
          this.item.isOpen = this.currentParams['mailBoxId'] === this.item.id;
          this.isFirstCheck = false;
        }
      });
  }

  checkVisibleSetting() {
    this.inboxSidebarService
      .getAccountAdded()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isAccountAdded = res;
      });
  }

  connectAgain(item) {
    localStorage.setItem('reconnectMailBoxId', item.id);
    this.inboxService.setIsConnectAgainMailbox(item);
  }

  handleRetrySync(item) {
    this.inboxService.setIsRetryMailbox(item);
  }

  handleExpandMailbox() {
    this.item.isOpen = !this.item.isOpen;
    this.expandMailbox.emit(this.item);
  }

  handleSelectMailbox(item) {
    this.selectMailbox.emit(item.id);
  }

  navigateToMailboxSetting() {
    this.router
      .navigateByUrl(`/dashboard/mailbox-settings?mailBoxId=${this.item.id}`)
      .then(() => {
        this.inboxService.setIsArchiveMailbox(
          this.item.status === EMailBoxStatus.ARCHIVE
        );
        this.inboxService.preMailBoxId.next(this.currentParams['mailBoxId']);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
