import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { EMailBoxPopUp, EmailProvider } from '@shared/enum/inbox.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'select-email-provider',
  templateUrl: './select-email-provider.component.html',
  styleUrls: ['./select-email-provider.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SelectEmailProviderComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() isConsole: boolean = false;
  @Input() isOwner: boolean = false;
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onNext: EventEmitter<EmailProvider> =
    new EventEmitter<EmailProvider>();
  public visibleTermsModal: boolean = false;
  public selectedEmailProvider: EmailProvider;
  public readonly emailProvider = EmailProvider;
  public isErrorSelect: boolean = false;
  public googleProvider: boolean = false;
  public isDisableSave: boolean = true;
  public termForm: FormGroup;

  constructor(private _inboxService: InboxService, public form: FormBuilder) {}

  ngOnInit(): void {
    this.termForm = this.form.group({
      trudiTerm: false,
      thirdPartyTerm: false,
      googleTerm: false
    });

    this.termForm.valueChanges.subscribe(() => {
      this.checkAllCheckboxes();
    });
  }

  public onSelectEmailProvider(provider: EmailProvider, triggerEvent = false) {
    this.selectedEmailProvider = provider;
    if (this.isOwner) {
      this.isErrorSelect = false;
    }
    this.visible = false;
    this.continueProcessAfterSelectProvider();
  }

  public onOpenPopupModal(provider: EmailProvider) {
    this.selectedEmailProvider = provider;
    this.googleProvider = provider === EmailProvider.OUTLOOK ? false : true;
    this.visible = false;
    this.visibleTermsModal = true;
  }

  public handleCancel() {
    this.onCancel.emit();
  }

  public handleBack() {
    this._inboxService.setPopupMailBoxState(EMailBoxPopUp.MAILBOX_TYPE);
  }

  public handleBackSelectEmailProvider() {
    this.visibleTermsModal = false;
    this.visible = true;
    this.isDisableSave = true;
    this.resetTermForm();
  }

  private continueProcessAfterSelectProvider() {
    switch (this.selectedEmailProvider) {
      case EmailProvider.GMAIL:
      case EmailProvider.OUTLOOK:
        this.onNext.emit(this.selectedEmailProvider);
        break;
      case EmailProvider.OTHER:
        if (!this.isConsole) {
          this._inboxService.setPopupMailBoxState(
            EMailBoxPopUp.INTEGRATE_IMAP_SMTP_SERVER
          );
        }
        break;
      default:
        break;
    }
  }

  checkAllCheckboxes(): void {
    this.isDisableSave = !(
      this.termForm.get('trudiTerm').value &&
      this.termForm.get('thirdPartyTerm').value &&
      this.termForm.get('googleTerm').value
    );
  }

  resetTermForm() {
    this.termForm.patchValue({
      trudiTerm: false,
      thirdPartyTerm: false,
      googleTerm: false
    });
  }

  handleChangeConfirm(event, controlName: string) {
    const target = event?.target as HTMLElement;
    const isCheckboxClicked = target?.tagName === 'TRUDI-CHECKBOX';

    if (!isCheckboxClicked) {
      const checkboxControl = this.termForm.get(controlName);
      if (checkboxControl) {
        checkboxControl.setValue(!checkboxControl.value);
      }
    }
  }

  handleClickLink(e: MouseEvent) {
    const target = e?.target as HTMLElement;
    e.stopPropagation();
    target.blur();
  }
}
