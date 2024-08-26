import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { Subject, takeUntil } from 'rxjs';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import { IMailBox } from '@shared/types/user.interface';

@Component({
  selector: 'confirm-auto-sync-conversations-to-pt',
  templateUrl: './confirm-auto-sync-conversations-to-pt.component.html',
  styleUrls: ['./confirm-auto-sync-conversations-to-pt.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ConfirmAutoSyncConversationsToPtComponent
  implements OnInit, OnDestroy
{
  @Output() confirm: EventEmitter<void> = new EventEmitter<void>();
  private destroy$: Subject<void> = new Subject<void>();
  private currentMailbox: IMailBox;

  constructor(
    private inboxService: InboxService,
    private mailboxSettingApiService: MailboxSettingApiService
  ) {}

  ngOnInit(): void {
    this.inboxService.currentMailBox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentMailbox = res;
      });
  }

  public onConfirmAutoSyncConversationsToPt(confirmAutoSync: boolean) {
    this.mailboxSettingApiService
      .saveMailboxBehaviours(this.currentMailbox.id, {
        resolved: null,
        deleted: null,
        autoSyncConversationsToPT: confirmAutoSync
      })
      .subscribe(() => {
        this.confirm.emit();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
