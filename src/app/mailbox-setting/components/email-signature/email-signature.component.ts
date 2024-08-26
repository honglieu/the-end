import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import {
  IEmailSignatureSetting,
  IMailboxSetting
} from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  EEmailSignatureFormControlName,
  EGreeting,
  ESignOfPhrase,
  EUserMailboxRole,
  EVariablesKey
} from '@/app/mailbox-setting/utils/enum';
import { LoadingService } from '@services/loading.service';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { SharedService } from '@services/shared.service';
import { AbstractControl } from '@angular/forms';
import { MailboxSettingApiService } from '@/app/mailbox-setting/services/mailbox-setting-api.service';
import {
  LIST_GREETING,
  RECIPIENT_FORMAT_OPTIONS,
  SIGN_OFF_PHRASES,
  VARIABLES_KEY_MAPPING
} from '@/app/mailbox-setting/utils/constant';
import { EmailSignatureFormService } from '@/app/mailbox-setting/services/email-signature-form.service';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ActivatedRoute, Router } from '@angular/router';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';

@Component({
  selector: 'email-signature',
  templateUrl: './email-signature.component.html',
  styleUrls: ['./email-signature.component.scss']
})
export class EmailSignatureComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public isConsole: boolean = false;
  public signOffPhrasesOption = SIGN_OFF_PHRASES;
  public recipientFormatOptions = RECIPIENT_FORMAT_OPTIONS;
  public listGreeting = LIST_GREETING;
  public greetingPreview: string = '';
  mailboxSetting: IMailboxSetting;
  mailboxSignature: string;
  agencySignature: string;
  currentAgencyId: string;
  mailboxId: string;
  tempVariables: IEmailSignatureSetting;
  variables: IEmailSignatureSetting;
  public isOwnerOrAdminMailbox: boolean = false;
  public isDisable: boolean = false;
  public selectedItem;
  isOpen = false;
  isOverlayOutsideClick = false;
  public isArchiveMailbox: boolean = false;
  public isLoadingEmailSignOffData: boolean = false;
  public isLoading: boolean = true;
  public isShowSignatureDefault: boolean = false;
  @ViewChild(CdkOverlayOrigin) trigger: CdkOverlayOrigin;

  constructor(
    private sharedService: SharedService,
    public mailboxSettingService: MailboxSettingService,
    public inboxService: InboxService,
    public loadingService: LoadingService,
    public emailSignatureService: CompanyEmailSignatureService,
    private mailboxSettingApiService: MailboxSettingApiService,
    private emailSignatureFormService: EmailSignatureFormService,
    private router: Router,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    private activeRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.emailSignatureFormService.buildForm();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.mailboxSignature = this.mailboxSetting?.htmlStringSignature?.trim();
    this.agencySignature = this.mailboxSetting?.agencyContent?.trim();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));
    // this.getMailboxSetting();
    this.emailSignatureForm
      .get('enableSignature')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.isShowSignatureDefault = value;
      });
    this.subscribeToValueChanges(this.greetingOption, 'greeting');
    this.subscribeToValueChanges(this.recipientOption, 'recipient');
    this.updateGreetingPreview();

    this.subscribeValueFormChange();
    this.validatorTeamName();
    this.handleDisableForm();
    this.subscribeSignOfPhraseChange();
  }

  private subscribeToValueChanges(
    control: AbstractControl,
    propertyName: string
  ): void {
    control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this[propertyName] = value;
      this.updateGreetingPreview();
    });
  }

  updateGreetingPreview() {
    const exampleName =
      this.recipientOption.value === RECIPIENT_FORMAT_OPTIONS[0].key
        ? 'James'
        : 'James Maddison';
    const greetingPreviewValue = `${
      EGreeting[this.greetingOption.value]
    } ${exampleName},`;
    this.greetingPreview = this.generateHTML(greetingPreviewValue);
  }

  generateHTML(value: string): string {
    return `<div><span style="white-space: pre-wrap; font-weight: 400; color: #3D3D3D;">${value}</span></div>`;
  }

  handleEventFocus($event) {
    if (!this.isOwnerOrAdminMailbox || this.isConsole) return;
    this.isOpen = true;
  }

  handleOpenOrCloseDropdown($event) {
    if (!this.isOwnerOrAdminMailbox || this.isConsole) return;
    this.isOpen = this.isOverlayOutsideClick;
    this.isOverlayOutsideClick = false;
    this.isOpen = !this.isOpen;
  }

  setVariablesInOrder() {
    this.tempVariables = this.mailboxSetting?.mailSignature;
    const {
      signOffPhrase,
      mailboxEmailAddress,
      memberName,
      memberRole,
      optionOther,
      teamName,
      phoneNumber,
      greeting,
      recipient
    } = this.tempVariables || {};
    const greetingFormat = this.createFormatObject(greeting);
    const recipientFormat = this.createFormatObject(recipient);

    const orderedVariables = new Map([
      ['signOffPhrase', signOffPhrase],
      ['memberName', memberName],
      ['memberRole', memberRole],
      ['phoneNumber', phoneNumber],
      ['teamName', teamName],
      ['mailboxEmailAddress', mailboxEmailAddress],
      ['optionOther', optionOther],
      ['greeting', greetingFormat],
      ['recipient', recipientFormat]
    ]);
    this.variables = Object.fromEntries(
      orderedVariables
    ) as unknown as IEmailSignatureSetting;
    this.selectedItem = this.tempVariables?.signOffPhrase?.key;

    this.emailSignatureFormService.patchValueForm(this.variables);
    this.generateMailboxSignatureHTML(this.variables);
  }

  createFormatObject(value: string): { isEnabled: boolean; value: string } {
    return {
      isEnabled: true,
      value: value
    };
  }

  subscribeValueFormChange() {
    Object.keys(this.emailSignatureForm.controls).forEach(
      (controlName: EEmailSignatureFormControlName) => {
        this.emailSignatureForm
          .get(controlName)
          .valueChanges.pipe(
            takeUntil(this.destroy$),
            distinctUntilChanged(),
            debounceTime(300)
          )
          .subscribe((value: boolean | string) => {
            this.previewEmailSignature(controlName, value);
          });
      }
    );
  }

  validatorTeamName() {
    this.enableTeamName.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (!value) {
          this.teamName.setValue('');
        }
        this.emailSignatureFormService.validatorTeamName(
          value && this.teamName.value
        );
      });
  }

  handleChangeTeamName(value) {
    this.emailSignatureFormService.validatorTeamName(
      value && this.enableTeamName.value
    );
    this.handleSaveSignature();
  }

  handleDisableForm() {
    combineLatest([
      this.activeRoute.queryParams,
      this.inboxService.listMailBoxs$
    ])
      .pipe(
        switchMap(([queryParams, listMailBoxs]) => {
          const currentMailbox = listMailBoxs?.find(
            (mailbox) => mailbox?.id === queryParams['mailBoxId']
          );
          if (!queryParams || !listMailBoxs) return of(null);
          this.isOwnerOrAdminMailbox =
            currentMailbox?.role.includes(EUserMailboxRole.ADMIN) ||
            currentMailbox?.role.includes(EUserMailboxRole.OWNER);
          this.mailboxId = queryParams['mailBoxId'];
          if (
            this.isOwnerOrAdminMailbox &&
            !this.isArchiveMailbox &&
            !this.isConsole
          ) {
            this.emailSignatureForm.enable();
          } else {
            this.emailSignatureForm.disable();
            this.isDisable = true;
          }
          return this.mailboxSettingApiService.getMailboxSetting(
            queryParams['mailBoxId']
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (!res) return;
        this.setMailboxSignatureValues(res);
        this.setVariablesInOrder();
        this.selectedItem = res.mailSignature?.signOffPhrase?.key;
        this.generateMailboxSignatureHTML(res.mailSignature);
        this.emailSignatureFormService.patchValueForm(res.mailSignature);
        this.isLoading = false;
      });
  }

  previewEmailSignature(
    controlName: EEmailSignatureFormControlName,
    value: boolean | string | null
  ) {
    const key = VARIABLES_KEY_MAPPING[controlName];
    const variable = this.variables?.[key];
    if (!variable) return;
    if (key === EVariablesKey.SIGN_OFF_PHRASE && typeof value === 'string') {
      const signOffPhraseItem = this.signOffPhrasesOption.find(
        (item) => item.key === value
      );
      variable.value =
        this.optionOther.value && !signOffPhraseItem
          ? this.optionOther.value
          : (signOffPhraseItem?.label as string)?.trim();
      variable.key = signOffPhraseItem?.key || ESignOfPhrase.OTHER;
    } else if (key === EVariablesKey.TEAM_NAME && typeof value === 'string') {
      variable.value = (value as string)?.trim();
    } else {
      variable.isEnabled = !!value;
    }
  }

  subscribeSignOfPhraseChange() {
    this.enableSignOffPhrase.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((isEnabled) => {
        if (isEnabled) {
          this.signOffPhrase.enable();
        } else {
          this.signOffPhrase.disable();
          this.signOffPhrase.setValue(this.signOffPhrasesOption[0].label);
          this.selectedItem = ESignOfPhrase.BEST_WISHES;
          this.optionOther.setValue('');
        }
        if (this.isConsole || !this.isOwnerOrAdminMailbox) {
          this.signOffPhrase.disable();
        }
      });
  }

  overlayOutsideClick(event: MouseEvent) {
    if (this.selectedItem === ESignOfPhrase.OTHER && !this.optionOther.value) {
      this.isOpen = true;
      this.isOverlayOutsideClick = false;
      this.emailSignatureFormService.validatorOther(
        this.enableSignOffPhrase.value,
        ESignOfPhrase.OTHER
      );
      return;
    }
    const buttonElement = this.trigger.elementRef.nativeElement as HTMLElement;
    const targetElement = event.target as HTMLElement;
    if (!buttonElement.contains(targetElement)) {
      this.isOpen = false;
      this.isOverlayOutsideClick = true;
      this.handleSaveSignature();
    }
  }

  handleClickOptionOther($event) {
    if (!$event) return;
    this.selectedItem = ESignOfPhrase.OTHER;
    this.signOffPhrase.setValue(this.optionOther.value);
    $event.stopPropagation();
  }

  handleChangeSignOffPhrases(value) {
    this.selectedItem = value.key;
    this.isOpen =
      (value.key === ESignOfPhrase.OTHER ||
        this.signOffPhrase.value === ESignOfPhrase.OTHER) &&
      !this.optionOther.value;

    if (
      value.key === ESignOfPhrase.OTHER ||
      this.signOffPhrase.value === ESignOfPhrase.OTHER
    ) {
      this.optionOther.enable();
      this.signOffPhrase.setValue(this.optionOther.value);
    } else {
      this.signOffPhrase.setValue(value.label);
      this.optionOther.setValue('');
    }

    this.emailSignatureFormService.validatorOther(
      this.selectedItem !== ESignOfPhrase.OTHER && this.optionOther.value,
      ESignOfPhrase.OTHER
    );
    if (value.key === ESignOfPhrase.OTHER && !this.optionOther.value?.length)
      return;
    this.handleSaveSignature();
  }

  handleChangeTextOther(value) {
    this.signOffPhrase.setValue(value.target.value);
    this.emailSignatureFormService.validatorOther(
      this.enableSignOffPhrase.value,
      ESignOfPhrase.OTHER
    );
  }

  generateMailboxSignatureHTML(data) {
    const phoneNumberValue = this.phoneNumberFormatPipe.transform(
      data?.phoneNumber?.value
    );
    const dataFormat = {
      signOffPhrase: data.signOffPhrase,
      memberName: data.memberName,
      memberRole: data.memberRole,
      phoneNumber: { ...data.phoneNumber, value: phoneNumberValue },
      teamName: data.teamName,
      mailboxEmailAddress: data.mailboxEmailAddress
    };

    if (dataFormat && Object.keys(dataFormat).length > 0) {
      let htmlString = '';
      Object.keys(dataFormat).forEach((key: EVariablesKey) => {
        if (
          dataFormat[key]?.isEnabled ||
          dataFormat[key]?.key === ESignOfPhrase.OTHER
        ) {
          const value = dataFormat[key]?.value;
          if (!!value) {
            htmlString += this.generateHTML(value);
          }
        }
      });
      if (this.agencySignature && htmlString) {
        htmlString += '<div style="height: 16px;"></div>';
      }
      this.mailboxSignature = htmlString;
    }
  }

  handleSaveGreeting() {
    if (!this.isOwnerOrAdminMailbox) {
      return;
    }
    const payload = {
      ...this.variables,
      greeting: this.greetingOption.value || this.variables?.greeting,
      recipient: this.recipientOption.value || this.variables?.recipient
    };
    this.saveMailboxSignature(payload as IEmailSignatureSetting);
  }

  handleSaveSignature() {
    if (
      !this.isOwnerOrAdminMailbox ||
      (this.enableTeamName.value && !this.teamName.value?.trim()) ||
      (this.enableSignOffPhrase.value &&
        this.signOffPhrase.value === ESignOfPhrase.OTHER &&
        !this.optionOther.value?.trim())
    ) {
      return;
    }
    this.isLoadingEmailSignOffData = true;
    const {
      enableEmailAddress,
      enableName,
      enableRole,
      enableSignOffPhrase,
      enableTeamName,
      optionOther,
      signOffPhrase,
      teamName,
      enableSignature,
      enablePhoneNumber
    } = this.emailSignatureForm.value;

    const keySignOffPhrase = !optionOther?.length
      ? signOffPhrase?.replace(',', '')
      : ESignOfPhrase.OTHER;

    const payload = {
      signOffPhrase: {
        key: keySignOffPhrase || this.variables?.signOffPhrase?.key,
        value:
          signOffPhrase ||
          optionOther ||
          this.variables.signOffPhrase.value ||
          this.variables?.optionOther?.value,
        isEnabled: enableSignOffPhrase
      },
      memberName: {
        value: this.variables?.memberName?.value,
        isEnabled: enableName
      },
      memberRole: {
        value: this.variables?.memberRole?.value,
        isEnabled: enableRole
      },
      teamName: {
        value: teamName || this.variables?.teamName?.value,
        isEnabled: enableTeamName
      },
      mailboxEmailAddress: {
        value: this.variables?.mailboxEmailAddress?.value,
        isEnabled: enableEmailAddress
      },
      phoneNumber: {
        isEnabled: enablePhoneNumber
      },
      enableSignature,
      greeting: this.greetingOption.value || this.variables?.greeting,
      recipient: this.recipientOption.value || this.variables?.recipient
    };

    this.saveMailboxSignature(payload as IEmailSignatureSetting);
  }

  saveMailboxSignature(payload: IEmailSignatureSetting) {
    this.mailboxSettingApiService
      .saveMailboxSignature(this.mailboxId, payload as IEmailSignatureSetting)
      .pipe(
        finalize(() => (this.isLoadingEmailSignOffData = false)),
        debounceTime(300)
      )
      .subscribe((res) => {
        if (!res) return;
        this.generateMailboxSignatureHTML(res.mailSignature);
        this.mailboxSettingService.setMailboxSetting(res);
      });
  }

  setMailboxSignatureValues(mailboxSetting: IMailboxSetting) {
    const { htmlStringSignature, agencyContent } = mailboxSetting || {};
    this.mailboxSetting = mailboxSetting;
    this.mailboxSignature = htmlStringSignature;
    this.agencySignature = agencyContent;
    this.emailSignatureService.currentMailboxSignature =
      htmlStringSignature + agencyContent;
  }

  isLastItem(item): boolean {
    return (
      item === this.signOffPhrasesOption[this.signOffPhrasesOption.length - 1]
    );
  }

  handleNavigate() {
    this.router.navigate(['/dashboard/agency-settings/email-settings']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get emailSignatureForm() {
    return this.emailSignatureFormService.emailSignatureForm;
  }

  get enableSignOffPhrase() {
    return this.emailSignatureForm.get('enableSignOffPhrase');
  }

  get enableTeamName() {
    return this.emailSignatureForm.get('enableTeamName');
  }

  get enableName() {
    return this.emailSignatureForm.get('enableName');
  }

  get enableRole() {
    return this.emailSignatureForm.get('enableRole');
  }

  get enableEmailAddress() {
    return this.emailSignatureForm.get('enableEmailAddress');
  }

  get teamName() {
    return this.emailSignatureForm.get('teamName');
  }

  get signOffPhrase() {
    return this.emailSignatureForm.get('signOffPhrase');
  }

  get optionOther() {
    return this.emailSignatureForm.get('optionOther');
  }

  get enablePhoneNumber() {
    return this.emailSignatureForm.get('enablePhoneNumber');
  }

  get greetingOption() {
    return this.emailSignatureForm.get('greetingOption');
  }
  get recipientOption() {
    return this.emailSignatureForm.get('recipientOption');
  }
}
