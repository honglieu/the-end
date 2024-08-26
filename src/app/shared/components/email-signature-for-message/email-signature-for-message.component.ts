import {
  Component,
  Input,
  forwardRef,
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { merge, Subject, takeUntil } from 'rxjs';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { UserService } from '@services/user.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { sendOptionType } from '@shared/components/tiny-editor/send-option-control/send-option-control.component';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { CompanyService } from '@services/company.service';

const providers = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => EmailSignatureForMessageComponent),
  multi: true
};

@Component({
  selector: 'email-signature-for-message',
  templateUrl: './email-signature-for-message.component.html',
  styleUrls: ['./email-signature-for-message.component.scss'],
  providers: [providers]
})
export class EmailSignatureForMessageComponent
  implements OnInit, OnChanges, ControlValueAccessor, OnDestroy
{
  @Input() listReceivers = [];
  @Input() isShowSignature: boolean = false;
  @Input() isFormScheduleMsg: boolean = false;
  @Input() inlineMsg: boolean = false;
  @Input() sendOption: sendOptionType;
  public currentMailboxSignature: string;
  public isHasSignature: boolean = false;

  private unsubscribe = new Subject<void>();

  onSetStateEmailSignature = (value: boolean) => {};
  private activeMobileApp: boolean = true;

  constructor(
    public emailSignatureService: CompanyEmailSignatureService,
    private userService: UserService,
    private companyService: CompanyService,
    private mailboxSettingService: MailboxSettingService,
    public inboxService: InboxService,
    private _changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.inlineMsg) {
      this.emailSignatureService.hasSignatureInline
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((data) => {
          this.isHasSignature = data;
        });
    } else {
      this.emailSignatureService.hasSignature
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((data) => {
          this.isHasSignature = data;
        });
    }
    this.companyService
      .getActiveMobileApp()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((status: boolean) => {
        this.activeMobileApp = status;
      });

    merge(
      this.mailboxSettingService.mailboxSetting$,
      this.mailboxSettingService.senderMaiBoxSignature$
    )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailboxSetting) => {
        this.emailSignatureService.currentMailboxSignature =
          mailboxSetting?.htmlStringSignature + mailboxSetting?.agencyContent;
        this.currentMailboxSignature =
          mailboxSetting?.htmlStringSignature + mailboxSetting?.agencyContent;
        this._changeDetector.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['listReceivers']?.currentValue) {
      this.listReceivers = this.listReceivers.map((item) => ({
        ...item,
        id: item.id || item.userId
      }));

      const listTypeItem = [
        EUserPropertyType.SUPPLIER,
        EUserPropertyType.OTHER,
        EUserPropertyType.EXTERNAL
      ];
      const checkType = this.listReceivers.some((item) =>
        listTypeItem.includes(item.type)
      );
      const hasInvite = this.listReceivers.some((item) => !item.lastActivity);

      this.emailSignatureService.enableSignatureButton.next(
        !this.listReceivers.length || checkType || hasInvite
      );

      if (this.isFormScheduleMsg && this.sendOption === sendOptionType.EMAIL) {
        return;
      }
      if (!this.activeMobileApp) {
        this.isHasSignature = true;
        return;
      }
      if (this.listReceivers.length < 1) return;
      if (this.sendOption === sendOptionType.EMAIL) return;
      if (
        this.listReceivers.every(
          (item) => item === true || item.personUserEmail
        ) ||
        this.listReceivers.map((item) => item.id).every((item) => !item)
      ) {
        this.isHasSignature = true;
        return;
      }
      const params = this.listReceivers.map((item) => item.id).join('&userId=');
      this.userService.checkUserInviteStatus(params).subscribe((data) => {
        if (!data?.length) return;
        const userStatusList = new Map();
        data.forEach((user) => {
          userStatusList.set(user.userId, user.inviteStatus === 'ACTIVE');
          this.emailSignatureService.userStatusList.next(userStatusList);
        });
        this.isHasSignature =
          data?.length > 0 &&
          data.some((user) => user.inviteStatus !== 'ACTIVE');
      });
      if (this.inlineMsg) {
        this.emailSignatureService.selectedButtonInline.next(hasInvite);
      } else {
        this.emailSignatureService.selectedButton.next(hasInvite);
      }
      // trigger resize event to fix update ai-generate-msg-copy popover position
      window.dispatchEvent(new Event('resize'));
    }
  }

  writeValue(value: boolean): void {
    this.isShowSignature = value;
  }

  registerOnChange(fn: any): void {
    this.onSetStateEmailSignature = fn;
  }

  registerOnTouched(fn: any): void {}

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
