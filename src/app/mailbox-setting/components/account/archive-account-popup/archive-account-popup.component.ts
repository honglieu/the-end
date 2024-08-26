import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { Subject, filter, switchMap, takeUntil } from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { IArchiveMailboxResponse } from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { CompanyService } from '@services/company.service';
import {
  CompanyAgentCurrentUser,
  IMailBox
} from '@shared/types/user.interface';

@Component({
  selector: 'archive-account-popup',
  templateUrl: './archive-account-popup.component.html',
  styleUrls: ['./archive-account-popup.component.scss']
})
export class ArchiveAccountPopupComponent implements OnDestroy {
  @Input() visible: boolean = false;
  @Input() currentMailbox: IMailBox;
  @Input() currentAgencyId: string;
  @Input() mailboxId: string;
  @Output() closePopup = new EventEmitter();
  @Output() isLoading = new EventEmitter();
  isArchivingMailbox: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private companyService: CompanyService,
    private mailboxSettingApiService: MailboxSettingApiService,
    private mailboxSettingService: MailboxSettingService,
    private inboxService: InboxService,
    private dashboardApiService: DashboardApiService
  ) {}

  archiveMailbox() {
    this.isArchivingMailbox = true;
    this.isLoading.emit(true);

    this.mailboxSettingApiService
      .archiveMailbox(this.mailboxId)
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (response: IArchiveMailboxResponse) =>
            Object.keys(response).length > 0
        ),

        switchMap(() =>
          this.dashboardApiService
            .getListMailbox()
            .pipe(filter((list) => !!list))
        )
      )
      .subscribe({
        next: (list: CompanyAgentCurrentUser[]) => {
          this.companyService.setListCompanyAgent(list);
          this.inboxService.setIsArchiveMailbox(true);
        },
        error: () => {
          this.closePopup.emit();
          this.isLoading.emit(false);
          this.isArchivingMailbox = false;
        },
        complete: () => {
          this.closePopup.emit();
          this.isLoading.emit(false);
          this.isArchivingMailbox = false;
        }
      });
  }

  handleCancel() {
    this.closePopup.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
