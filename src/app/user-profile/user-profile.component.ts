import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { LoadingService } from '@services/loading.service';
import { SharedService } from '@services/shared.service';
import { UserService } from '@services/user.service';
import { CurrentUser } from '@shared/types/user.interface';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { CompanyService } from '@services/company.service';
import {
  PHONE_NUMBER_PATTERN_OTHER,
  PHONE_PREFIXES
} from '@services/constants';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { IFile } from '@shared/types/file.interface';
import { getMaskPhoneNumber } from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  providers: [LoadingService]
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private unSubscribe = new Subject<void>();
  public _invalidFile = false;
  public currentUser: CurrentUser;
  public profileForm: FormGroup;
  public phoneNumberPattern = PHONE_NUMBER_PATTERN_OTHER;
  private getCurrentUserSubscription: Subscription;
  public companyId: string;
  public mailboxId: string;
  public areaCode: string;
  public isPrefix: boolean = true;
  public maxCharacter: number = 11;
  public isDisabled = false;
  public showEmailSignatureModal = false;
  public currentEmailSignature;
  public imageSignatureData;
  public isFirstRender = true;
  public showPhoneField = false;
  public agencySignature: string;
  public readonly EMAIL_SIGNATURE_IMAGE_VALID_TYPE = ['.png', '.jpeg', '.jpg'];
  get name() {
    return this.profileForm?.get('name');
  }

  get title() {
    return this.profileForm?.get('title');
  }

  get phone() {
    return this.profileForm?.get('phone');
  }

  get emailSignatureControl() {
    return this.profileForm?.get('emailSignature');
  }

  setFirstName(value: string) {
    this.name?.setValue(value);
  }
  setTitle(value: string) {
    this.title?.setValue(value);
  }
  setPhone(value: string) {
    this.phone?.setValue(value);
  }
  setEmailSignature(value: IFile[] | null) {
    this.emailSignatureControl?.setValue(value);
  }

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    public readonly sharedService: SharedService,
    public ld: LoadingService,
    private toastService: ToastrService,
    private companyService: CompanyService,
    private mailboxSettingService: MailboxSettingService,
    private websocketService: RxWebsocketService,
    private agencyServiceDashboard: AgencyService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe
  ) {}

  ngOnInit() {
    this.initForm();
    this.getCurrentUser();
    this.getProfileUser();
    this.getMailboxId();
    this.getSocketUpdateProfile();
  }

  initForm(formData?) {
    this.profileForm = this.formBuilder.group(
      {
        name: [formData?.name?.trim() ?? '', Validators.required],
        title: [formData?.title?.trim() ?? '', Validators.required],
        phone: [
          formData?.phone?.trim() ?? '',
          this.phoneNumberMinLength(
            this.agencyServiceDashboard.getPhoneNumberMinLength.value
          )
        ]
      },
      { updateOn: 'blur' }
    );
  }

  onInputBlur() {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.valid) {
      this.handleUpdateUserProfile({
        name: this.name.value,
        title: this.title.value,
        phone: this.phone.value,
        emailSignature: this.imageSignatureData?.[0] || null
      });
    }
  }

  phoneNumberMinLength(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (
        control?.value &&
        control?.value.replace(/^\(\+1\) |[^0-9]/g, '').length < min
      ) {
        return { invalidPhoneNumber: true };
      }
      return null;
    };
  }

  getSocketUpdateProfile() {
    this.websocketService.onSocketUserProfile
      .pipe(
        distinctUntilChanged(),
        debounceTime(200),
        takeUntil(this.unSubscribe)
      )
      .subscribe((res) => {
        if (!res) return;
        const { firstName, title, phoneNumber } = res.dataUpdate || {};
        this.userService.userInfo$.next({
          ...this.userService.userInfo$.getValue(),
          firstName,
          title,
          phoneNumber
        });
      });
  }

  handleChange(event) {
    if (event?.target.value?.length === 0) {
      this.isPrefix = true;
      this.maxCharacter = 12;
      this.phone.setValidators(
        this.phoneNumberMinLength(
          this.agencyServiceDashboard.getPhoneNumberMinLength.value
        )
      );
      this.phone.updateValueAndValidity();
    }
    const phoneNumber = (event.target as HTMLInputElement).value?.replace(
      /[^0-9]/g,
      ''
    );
    this.phoneNumberPattern = getMaskPhoneNumber(phoneNumber, this.areaCode);
    this.phone.patchValue(phoneNumber);
  }
  getCurrentUser() {
    this.ld.onLoading();
    combineLatest([
      this.companyService.getCurrentCompanyId(),
      this.userService.userInfo$,
      this.companyService.currentCompanyCRMSystemName
    ])
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(([companyId, res, currentCompanyCRM]) => {
        if (!res || !companyId) return;
        this.currentUser = res;
        const emailSignatureValue = res?.imageSignature
          ? [res?.imageSignature]
          : null;
        this.areaCode =
          currentCompanyCRM === ECRMSystem.RENT_MANAGER
            ? PHONE_PREFIXES.US[0]
            : PHONE_PREFIXES.AU[0];
        this.initForm({
          title: this.currentUser.title,
          name: this.sharedService.displayName(
            this.currentUser?.firstName,
            this.currentUser?.lastName
          ),
          phone: this.transFormPhoneNumber(this.currentUser?.phoneNumber)
        });
        this.imageSignatureData = emailSignatureValue;
        this.currentEmailSignature = res?.imageSignature;
        this.companyId = companyId;
        this.userService.selectedUser.next(res);
        this.ld.stopLoading();
      });
  }

  transFormPhoneNumber(phone: string) {
    if (!phone) return phone;
    const regex = /^\(\+\d+\)\s+/;
    const phoneNumber = this.phoneNumberFormatPipe
      .transform(phone)
      .replace(regex, '');
    if (phoneNumber.replace(/\D/g, '')?.length > 10) {
      this.isPrefix = false;
      this.maxCharacter = phone.length + 1;
    }
    return phoneNumber;
  }

  getProfileUser() {
    const currentUser = this.userService.getUserInfo();
    if (currentUser) {
      this.phoneNumberPattern = getMaskPhoneNumber(
        this.transFormPhoneNumber(this.currentUser?.phoneNumber)
          .split(' ')
          .join(''),
        this.areaCode
      );
      this.initForm({
        title: this.currentUser.title,
        name: this.sharedService.displayName(
          this.currentUser?.firstName,
          this.currentUser?.lastName
        ),
        phone: this.transFormPhoneNumber(this.currentUser?.phoneNumber)
      });
    }
  }

  getMailboxId() {
    this.mailboxSettingService.mailBoxId$
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((rs) => {
        this.mailboxId = rs;
      });
  }

  public handleUpdateUserProfile(formValue: {
    name: string;
    title: string;
    phone: string;
    emailSignature;
  }) {
    const { name, title, phone, emailSignature } = formValue;
    this.getCurrentUserSubscription &&
      this.getCurrentUserSubscription.unsubscribe();
    if (this.profileForm.invalid || !(name && title)) return;
    const phoneNumber = this.formatPhoneNumber(phone);
    this.userService
      .updateUserProfile(name.trim(), title.trim(), phoneNumber, emailSignature)
      .subscribe({
        next: () => {
          this.toastService.success('Profile updated');
          this.getCurrentUserSubscription = this.userService.getCurrentUser();
          if (this.mailboxId) {
            this.mailboxSettingService.senderMailBoxId.next(this.mailboxId);
          }
        }
      });
  }

  public handleCloseEmailSignature() {
    this.imageSignatureData = !!this.currentEmailSignature
      ? [this.currentEmailSignature]
      : [];
    this.showEmailSignatureModal = !this.showEmailSignatureModal;
  }

  public handleSaveImageSignature(value) {
    if (value) {
      this.handleUpdateUserProfile({
        ...this.profileForm.value,
        emailSignature: value
      });
    }
  }

  formatPhoneNumber(phone: string) {
    if (!phone) return phone;
    const digitsOnlyPhone = phone.replace(/\D/g, '');
    if (digitsOnlyPhone?.length > 10) {
      return `+${phone.replace(/\+/g, '')}`;
    }
    return `${this.areaCode}${digitsOnlyPhone}`;
  }

  getListFile(event) {
    if (!this.isFirstRender) {
      if (event?.length) {
        this.imageSignatureData = event;
      } else {
        if (!this.imageSignatureData) return;
        this.imageSignatureData = null;
        this.handleUpdateUserProfile({
          ...this.profileForm.value,
          emailSignature: null
        });
      }
    }
    this.isFirstRender = false;
  }

  handelChangeAgencySignature(agencySignature: string) {
    if (!agencySignature) return;
    this.agencySignature = agencySignature;
  }

  onHasErrorMsg(value) {
    this._invalidFile = value;
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
    this.getCurrentUserSubscription?.unsubscribe();
    this.showPhoneField = false;
  }

  resetForm() {
    this.setFirstName(
      this.sharedService.displayName(
        this.currentUser?.firstName,
        this.currentUser?.lastName
      )
    );
    this.setTitle(this.currentUser?.title);
    this.setPhone(this.transFormPhoneNumber(this.currentUser?.phoneNumber));
  }
}
