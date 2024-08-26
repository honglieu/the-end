import { IMailBox } from '@shared/types/user.interface';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { EUserMailboxRole } from '@/app/mailbox-setting/utils/enum';
import { EMailBoxStatus, EMailBoxType, EmailProvider } from '@shared/enum';
import { Subject, takeUntil } from 'rxjs';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';

@Component({
  selector: 'archived-mailbox-item',
  templateUrl: './archived-mailbox-item.component.html',
  styleUrl: './archived-mailbox-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivedMailboxItemComponent implements OnInit, OnDestroy {
  @Input() item: IMailBox;
  @Input() unreadList: { [x: string]: boolean } = {};
  @Output() expandMailbox = new EventEmitter<IMailBox>();
  @Output() selectMailbox = new EventEmitter<string>();
  private unsubscribe = new Subject<void>();
  readonly EUserMailboxRole = EUserMailboxRole;
  readonly EMailBoxStatus = EMailBoxStatus;
  readonly mailBoxType = EMailBoxType;
  readonly EmailProvider = EmailProvider;
  textTooltip: string = `We've lost connection to your email account.`;
  public isAccountAdded: boolean;
  public currentParams: Params;

  constructor(
    private inboxSidebarService: InboxSidebarService,
    private activatedRoute: ActivatedRoute,
    private inboxService: InboxService,
    private readonly router: Router,
    private mailboxSettingService: MailboxSettingService
  ) {}

  ngOnInit() {
    this.checkVisibleSetting();
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.currentParams = res;
      });
  }
  handleExpand() {
    this.item.isOpen = !this.item.isOpen;
    this.expandMailbox.emit(this.item);
  }

  handleSelectMailbox(item) {
    this.selectMailbox.emit(item.id);
  }

  checkVisibleSetting() {
    this.inboxSidebarService
      .getAccountAdded()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isAccountAdded = res;
      });
  }

  navigateToMailboxSetting() {
    this.router
      .navigateByUrl(`/dashboard/mailbox-settings?mailBoxId=${this.item.id}`)
      .then(() => {
        this.inboxService.setIsArchiveMailbox(
          this.item.status === EMailBoxStatus.ARCHIVE
        );
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
