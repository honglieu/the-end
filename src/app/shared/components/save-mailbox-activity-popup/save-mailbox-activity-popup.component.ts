import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { IMailBox } from '@shared/types/user.interface';
import {
  ICategoryTaskActivity,
  IMailboxSetting
} from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';

@Component({
  selector: 'save-mailbox-activity-popup',
  templateUrl: './save-mailbox-activity-popup.component.html',
  styleUrls: ['./save-mailbox-activity-popup.component.scss']
})
export class SaveMailboxActivityPopupComponent implements OnInit, OnDestroy {
  private currentMailbox: IMailBox;
  public configs = {
    visible: true,
    title: 'Save mailbox activity to Property Tree',
    subTitle:
      'Do you wish to automatically save conversations to the property documents section in Property Tree?',
    saveResolveText: 'Save resolved conversations',
    btnText: 'Save'
  };
  public form: FormGroup;
  public listCategoryTaskActivity: ICategoryTaskActivity[] = [];
  public unsubscribe: Subject<void> = new Subject();
  public mailboxSetting: IMailboxSetting;
  constructor(
    private fb: FormBuilder,
    private inboxService: InboxService,
    private mailboxSettingApiService: MailboxSettingApiService,
    public mailboxSettingService: MailboxSettingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.inboxService.currentMailBox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.currentMailbox = res;
      });
    this.getCategorySaveTaskActivity();
    this.getMailboxSetting();
  }

  getMailboxSetting() {
    this.mailboxSettingService.mailboxSetting$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((setting) => {
        this.mailboxSetting = setting;
      });
  }

  getCategorySaveTaskActivity() {
    this.mailboxSettingApiService
      .getCategorySaveTaskActivity()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listCategory) => {
        if (!listCategory.length) return;
        this.listCategoryTaskActivity = listCategory;
      });
  }

  initForm() {
    this.form = this.fb.group({
      autoSyncConversationsToPT: [true],
      saveCategoryDocumentType: [null]
    });
  }
  confirm() {
    const { autoSyncConversationsToPT, saveCategoryDocumentType } =
      this.form.value;
    this.mailboxSettingApiService
      .saveMailboxBehaviours(this.currentMailbox.id, {
        resolved: this.mailboxSetting?.mailBehavior?.resolved || null,
        deleted: this.mailboxSetting?.mailBehavior?.resolved || null,
        autoSyncConversationsToPT,
        saveCategoryDocumentType: saveCategoryDocumentType
      })
      .subscribe(() => {
        this.inboxService.setPopupMailBoxState(null);
        this.cdr.markForCheck();
      });
  }
  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
