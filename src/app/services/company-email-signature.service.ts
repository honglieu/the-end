import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { conversations } from 'src/environments/environment';
import { BehaviorSubject, tap, filter } from 'rxjs';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';

@Injectable({
  providedIn: 'root'
})
export class CompanyEmailSignatureService {
  public signatureContent: BehaviorSubject<string> = new BehaviorSubject('');
  public hasSignature: BehaviorSubject<boolean> = new BehaviorSubject(true);
  public hasSignatureInline: BehaviorSubject<boolean> = new BehaviorSubject(
    true
  );
  public enableSignatureButton: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public selectedButton: BehaviorSubject<boolean> = new BehaviorSubject(true);
  public selectedButtonInline: BehaviorSubject<boolean> = new BehaviorSubject(
    true
  );
  public existingSignature: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  // active -> true
  public userStatusList: BehaviorSubject<Map<string, boolean>> =
    new BehaviorSubject(new Map());
  public currentMailboxSignature: string;
  public currentMailBoxId: string;
  constructor(
    private apiService: ApiService,
    private mailboxSettingService: MailboxSettingService,
    public inboxService: InboxService
  ) {
    this.mailboxSettingService.mailboxSetting$.subscribe((mailboxSetting) => {
      this.currentMailboxSignature =
        mailboxSetting?.htmlStringSignature + mailboxSetting?.agencyContent;
    });
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(filter((mailBoxId) => !!mailBoxId))
      .subscribe((mailBoxId) => {
        this.currentMailBoxId = mailBoxId;
      });
  }

  createEmailSignature(body) {
    return this.apiService.postAPI(conversations, 'save-email-signature', body);
  }

  getEmailSignature() {
    return this.apiService.getAPI(conversations, `get-email-signature`).pipe(
      tap((data) => {
        this.signatureContent.next(data);
      })
    );
  }
}
