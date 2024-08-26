import {
  AgencyEmailFontSettingService,
  FontSetting
} from '@services/agency-email-font-setting.service';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { PermissionService } from '@services/permission.service';
import { SharedService } from '@services/shared.service';
import {
  defaultFontFamily,
  defaultFontSize,
  listFontFamilies,
  listFontSizes
} from '@shared/components/tiny-editor/utils/font-utils';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  EMPTY,
  Subject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  finalize,
  switchMap,
  takeUntil
} from 'rxjs';
import { DestroyDecorator } from '@/app/shared/decorators/destroy.decorator';
import {
  EFooterButtonType,
  ISendEmailExternal,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ICompany } from '@/app/shared/types/company.interface';
import { agencies } from '@/environments/environment';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { CompanyService } from '@/app/services/company.service';
import { ConversationService } from '@/app/services/conversation.service';
import { ApiService } from '@/app/services/api.service';
import { LoadingService } from '@/app/services/loading.service';
import { EMailBoxType, EmailProvider } from '@/app/shared/enum/inbox.enum';

@Component({
  selector: 'font-settings',
  templateUrl: './font-settings.component.html',
  styleUrl: './font-settings.component.scss'
})
@DestroyDecorator
export class FontSettingsComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();
  public fontSettingsForm: FormGroup;
  public emailSignature: string = '';
  public isPermissionEdit: boolean = false;
  public isLoading: boolean = false;
  public isLoadingSignature: boolean = true;

  public fontFamilies = listFontFamilies;
  public fontSizes = listFontSizes;
  public currentFontSetting: FontSetting = {
    fontStyle: defaultFontFamily.format,
    fontSize: defaultFontSize.format
  };

  get fontStyle() {
    return this.fontSettingsForm?.get('fontStyle');
  }

  get fontSize() {
    return this.fontSettingsForm?.get('fontSize');
  }

  public agencyName: string = '';
  public emailAddress: string = '';
  public isVisibleModal: boolean = false;
  public configs = {
    'header.title': 'Send Message',
    'header.showDropdown': true,
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.nextButtonType': EFooterButtonType.NORMAL,
    'footer.buttons.showBackBtn': false,
    'footer.buttons.sendType': ISendMsgType.EXTERNAL,
    'body.tinyEditor.attachBtn.disabled': true,
    'body.prefillReceivers': false,
    'body.isTxtFeildEmail': true,
    'otherConfigs.isCreateMessageType': true,
    'body.prefillReceiversList': [],
    'body.prefillTitle': '',
    'body.prefillExternalSendTo': 'support@trudi.ai'
  };
  public emailURL: string = '';
  public smgContent: string = '';
  public isForwardingMailbox: boolean = false;

  constructor(
    private emailSignatureService: CompanyEmailSignatureService,
    private permissionService: PermissionService,
    private agencyEmailFontSettingService: AgencyEmailFontSettingService,
    private toastService: ToastrService,
    private router: Router,
    public readonly sharedService: SharedService,
    public loadingService: LoadingService,
    private apiService: ApiService,
    private conversationService: ConversationService,
    private inboxService: InboxService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.buildSettingsForm();
    this.checkPermission();
    this.isLoading = true;
    combineLatest([
      this.emailSignatureService.getEmailSignature(),
      this.agencyEmailFontSettingService.getFontSettings()
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([signature, fontSetting]) => {
        if (signature) {
          this.emailSignature = signature;
          this.isLoadingSignature = false;
        }
        if (fontSetting) {
          this.currentFontSetting = {
            fontStyle: fontSetting.fontStyle ?? defaultFontFamily.format,
            fontSize: fontSetting.fontSize ?? defaultFontSize.format
          };

          this.fontSettingsForm.patchValue(this.currentFontSetting);
        }
        this.isLoading = false;
      });

    this.listenOnChanges();

    this.subscribeCurrentCompany();

    combineLatest([
      this.inboxService.listMailBoxs$,
      this.inboxService.getCurrentMailBoxId()
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([listMailBox, currentMailBoxId]) => {
        if (listMailBox && currentMailBoxId) {
          const currentMailbox = listMailBox.find(
            (mailBox) => mailBox.id === currentMailBoxId
          );
          this.isForwardingMailbox =
            currentMailbox?.provider === EmailProvider.SENDGRID &&
            currentMailbox?.type === EMailBoxType.COMPANY;
        }
      });
    this.subscribeEmailSignature();
  }

  subscribeEmailSignature() {
    this.emailSignatureService.signatureContent
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => (this.emailSignature = value));
  }

  buildSettingsForm() {
    this.fontSettingsForm = new FormGroup({
      fontStyle: new FormControl(defaultFontFamily.format, [
        Validators.required
      ]),
      fontSize: new FormControl(defaultFontSize.format, [Validators.required])
    });
  }

  checkPermission() {
    const isConsole = this.sharedService.isConsoleUsers();
    if (isConsole) {
      this.isPermissionEdit = this.permissionService.isOwner;
    } else {
      this.isPermissionEdit = this.permissionService.hasFunction(
        'COMPANY_DETAIL.PROFILE.EDIT'
      );
    }
  }

  listenOnChanges() {
    this.fontSettingsForm.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((values) => {
        if (
          values &&
          values.fontStyle &&
          values.fontSize &&
          (values.fontStyle !== this.currentFontSetting.fontStyle ||
            values.fontSize !== this.currentFontSetting.fontSize)
        ) {
          const toastMessage =
            values.fontStyle !== this.currentFontSetting.fontStyle
              ? 'Font style updated'
              : 'Font size updated';

          this.currentFontSetting = {
            fontStyle: values.fontStyle,
            fontSize: values.fontSize
          };

          this.agencyEmailFontSettingService
            .updateFontSettings({
              emailStyleSetting: this.currentFontSetting
            })
            .pipe(takeUntil(this.unsubscribe))
            .subscribe({
              next: () => {
                this.toastService.success(toastMessage);
              },
              error(err) {
                console.log(err);
                this.toastService.error('Update fail.');
              }
            });
        }
      });
  }

  handleNavigate() {
    this.router.navigate(['/dashboard/agency-settings/email-signature']);
  }

  subscribeCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        distinctUntilChanged((prev, curr) => prev.id === curr.id),
        switchMap((company) => {
          if (!company) return EMPTY;
          this.loadingService.onLoading();
          this.setAgencyData(company);
          return this.getEmailAddress();
        }),
        catchError((error) => {
          this.toastService.error(error?.message || 'server error');
          this.loadingService.stopLoading();
          return EMPTY;
        }),
        finalize(() => {
          this.loadingService.stopLoading();
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((email) => (this.emailAddress = email?.outgoingEmail));
  }

  setAgencyData(res: ICompany) {
    this.agencyName = res.name;
    this.smgContent = `Hi Trudi Support\n\nFor ${this.agencyName}, we'd like to update the email address used for outgoing emails to [enter email address].\nPlease can someone get in touch to help.\n\nThanks`;
    this.configs[
      'body.prefillTitle'
    ] = `Request to change outgoing email address - ${this.agencyName}`;
  }

  getEmailAddress() {
    return this.apiService.getAPI(agencies, `get-outgoing-email`);
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    this.conversationService
      .sendRequestChangeEmail({
        to: (event.data as ISendEmailExternal).externalSendTo,
        content: (event.data as ISendEmailExternal).msgContent,
        subject: (event.data as ISendEmailExternal).msgTitle
      })
      .subscribe({
        next: () => {
          this.closeActivePopup();
          this.toastService.success('Successfully sent');
        },
        error: (error) => {
          this.toastService.error(error?.message || 'send error');
        }
      });
  }

  closeActivePopup() {
    this.isVisibleModal = false;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
