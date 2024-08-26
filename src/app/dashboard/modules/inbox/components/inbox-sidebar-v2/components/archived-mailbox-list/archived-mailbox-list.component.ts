import { IMailBox } from '@shared/types/user.interface';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Subject } from 'rxjs';
import { EMailBoxStatus } from '@shared/enum';
import { PageFacebookMessengerType } from '@/app/dashboard/shared/types/facebook-account.interface';
import { FACEBOOK_INBOX_ROUTE_DATA } from '@/app/dashboard/utils/inbox-sidebar-router-data';
import { IMessageRoute } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { Router } from '@angular/router';
import { PageWhatsAppType } from '@/app/dashboard/shared/types/whatsapp-account.interface';

@Component({
  selector: 'archived-mailbox-list',
  templateUrl: './archived-mailbox-list.component.html',
  styleUrl: './archived-mailbox-list.component.scss'
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivedMailboxListComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() listMailBoxs: IMailBox[] = [];
  @Input() listArchiveMessenger: PageFacebookMessengerType[] = [];
  @Input() listArchiveWhatsApp: PageWhatsAppType[] = [];
  @Input() unreadList: { [x: string]: boolean } = {};
  private unsubscribe = new Subject<void>();
  public mailboxArchived: Set<string> = new Set();
  public isShowArchivedMailbox: boolean = false;
  public FACEBOOK_INBOX_ROUTE_DATA: IMessageRoute = FACEBOOK_INBOX_ROUTE_DATA;
  public listMailBoxsClone: IMailBox[] = [];

  constructor(
    public inboxService: InboxService,
    public mailboxSettingService: MailboxSettingService,
    private router: Router
  ) {}

  ngOnInit() {
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    this.isShowArchivedMailbox =
      JSON.parse(localStorage.getItem('isShowArchivedMailbox')) ||
      this.checkHasSelectingMessengerArchived() ||
      false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['listMailBoxs'] &&
      changes['listMailBoxs'].previousValue !==
        changes['listMailBoxs'].currentValue
    ) {
      this.listMailBoxsClone = this.listMailBoxs;
      this.listMailBoxs = this.listMailBoxs.filter(
        (item) => item.status === EMailBoxStatus.ARCHIVE
      );
      this.listMailBoxs?.forEach((mailbox) => {
        const mailboxActiveString = localStorage.getItem('mailboxArchived');
        if (mailboxActiveString) {
          const mailboxActiveArray = JSON.parse(mailboxActiveString);
          this.mailboxArchived = new Set(mailboxActiveArray);
        }
        if (this.mailboxArchived.has(mailbox.id)) {
          mailbox.isOpen = true;
        }
      });
    }

    if (
      changes['listArchiveMessenger'] &&
      changes['listArchiveMessenger'].currentValue?.lenght
    ) {
      this.isShowArchivedMailbox =
        JSON.parse(localStorage.getItem('isShowArchivedMailbox')) ||
        this.checkHasSelectingMessengerArchived() ||
        false;
    }
  }

  handleExandMailbox(mailbox) {
    const mailboxSelected = this.listMailBoxs?.find(
      (item) => item?.id === mailbox?.id
    );
    if (mailboxSelected) {
      mailboxSelected.isOpen = !mailboxSelected.isOpen;

      if (mailboxSelected.isOpen) {
        this.mailboxArchived.add(mailbox?.id);
      } else {
        this.mailboxArchived.delete(mailbox?.id);
      }

      localStorage.setItem(
        'mailboxArchived',
        JSON.stringify(Array.from(this.mailboxArchived))
      );
    }
  }

  beforeUnloadHandler() {
    localStorage.removeItem('mailboxArchived');
    localStorage.removeItem('isShowArchivedMailbox');
  }

  hanldShowArchivedMailbox() {
    this.isShowArchivedMailbox = !this.isShowArchivedMailbox;
    localStorage.setItem(
      'isShowArchivedMailbox',
      JSON.stringify(this.isShowArchivedMailbox)
    );
    if (!this.isShowArchivedMailbox) {
      this.listMailBoxs = this.listMailBoxs.map((item) => {
        return {
          ...item,
          isOpen: false
        };
      });
    }
  }

  checkHasSelectingMessengerArchived() {
    return this.listArchiveMessenger.some((item) => {
      return this.router.url?.includes(item.id);
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }
}
