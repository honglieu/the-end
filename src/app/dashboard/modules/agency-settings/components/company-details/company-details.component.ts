import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import dayjs from 'dayjs';
import {
  BehaviorSubject,
  Subject,
  catchError,
  distinctUntilChanged,
  lastValueFrom,
  of,
  takeUntil
} from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import {
  AgencyService as AgencyDashboardService,
  AgencyService as AgencyServiceDashboard
} from '@/app/dashboard/services/agency.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { AgencyService } from '@services/agency.service';
import { CalendarService } from '@services/calendar.service';
import {
  EMAIL_VALIDATE,
  PHONE_PREFIXES,
  POPUP_TYPE,
  URL_PATTERN
} from '@services/constants';
import { HeaderService } from '@services/header.service';
import { LoadingService } from '@services/loading.service';
import { PermissionService } from '@services/permission.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { Agency, AgentSettingInfo } from '@shared/types/agency.interface';
import { PublicHoliday } from '@shared/types/calendar.interface';
import {
  BankAccount,
  CurrentUser,
  ICurrentUser
} from '@shared/types/user.interface';
import {
  formatTime,
  mapWorkingHoursTimeLabel
} from '@/app/trudi-send-msg/utils/helper-functions';
import { getMaskPhoneNumber } from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';
import { initTimezoneOptions } from '@core';
import { ERole } from '@/app/auth/auth.interface';
import { CompanyService } from '@services/company.service';
import { ICompany } from '@shared/types/company.interface';
import { EUploadAgencyStep } from '@/app/dashboard/modules/agency-settings/utils/enum';

const IF_NULL_AGENCY: AgentSettingInfo = {
  id: '',
  companyEmail: '',
  agencySetting: {
    websiteUrl: ''
  },
  address: '',
  name: '',
  phoneNumber: '',
  logo: '',
  createdAt: '',
  updatedAt: '',
  businessName: '',
  timeZone: ''
};

const messageError = {
  accountName: 'This agency name is already existed',
  phoneNumber: 'This phone number is already existed',
  email: 'This email is already existed'
};

@Component({
  selector: 'company-details',
  templateUrl: './company-details.component.html',
  styleUrls: [
    './company-email-signature/company-email-signature.component.scss',
    './company-details.component.scss'
  ]
})
@DestroyDecorator
export class CompanyDetailsComponent implements OnInit, OnDestroy {
  agentDetailInfo: AgentSettingInfo = IF_NULL_AGENCY;
  private subscribers = new Subject<void>();
  public isShowModal: boolean;
  public isShowUploadQuitConfirm: boolean = false;
  public popupModalPosition = ModalPopupPosition;
  public addLinkTitle = 'Add Website URL';
  public linkWebSite = '';
  public linkWebSiteConfirm = '';
  public isURL = true;
  public isAddLinkSuccess = false;
  public isAddedLink: boolean;
  currentUser$: BehaviorSubject<ICurrentUser> = this.userService.selectedUser;
  public isAdmin: boolean;
  public isAgencyAdmin = false;
  public isOpenPopupSetAccount: boolean = false;
  public isOpenPopupDeleteAccount: boolean = false;
  public popupType = POPUP_TYPE;
  public bsbValue: string = '';
  public accountName: string = '';
  public accountNumber: string = '';
  public isSubmit: boolean = false;
  public deletedIdAccount: string;
  public isUpdateSuccess: boolean;
  public showCroppie: boolean = true;
  public currentStep = 1;
  public maskPattern;
  public areaCode: string;
  public showWorkingHour = false;
  public lastOfficeHour = null;
  public isShowUploadLogoModal = false;
  public publicHolidays: PublicHoliday[] = [];
  public isEditCompanyDetails = false;
  public urlCompanyLogo: string = '';
  public tooltipTextEmail =
    'Please use the shared email address provided to your tenants / owners / suppliers - for example  rentals@youragency.com';

  public timezoneOptions = initTimezoneOptions();

  constructor(
    private headerService: HeaderService,
    public userService: UserService,
    private readonly agencyService: AgencyService,
    private readonly agencyDashboardService: AgencyDashboardService,
    public loadingService: LoadingService,
    private calendarService: CalendarService,
    private formBuilder: FormBuilder,
    private permissionService: PermissionService,
    private dashboardApiService: DashboardApiService,
    private agencyServiceDashboard: AgencyServiceDashboard,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService
  ) {}
  public currentUser: CurrentUser;
  public currentCompany: ICompany;
  editCompanyDetails: FormGroup;
  public checkSubmit: boolean = true;
  public urlLogo: string;
  public isPermissionEdit = false;
  public unsubscribe = new Subject<void>();
  public isChangeData: boolean = false;
  public isRmEnvironment: boolean = false;
  public maxCharacter: number = 12;
  public currentTimeZone = {};
  public isDisableOfficeHoursEditBtn: boolean = false;
  public listOfSubscription: Agency[];
  public listOfTrustAccount: BankAccount[];

  ngOnInit(): void {
    this.isDisableOfficeHoursEditBtn = ![ERole.ADMIN, ERole.OWNER].includes(
      this.permissionService.getCurrentRole as ERole
    );
    this.userService.userInfo$
      .pipe(takeUntil(this.subscribers))
      .subscribe((data) => {
        this.currentUser = data;
      });
    const navigationState = window.history.state;
    if (navigationState && navigationState.fromCurrentPage) {
      this.showWorkingHour = true;
    }
    this.getSuppliers();
    this.loadingService.onLoading();
    this.headerService.headerState$.next({
      ...this.headerService.headerState$.value,
      title: 'Agency details'
    });
    this.handleDefaultLogo();
    this.editCompanyDetails = this.formBuilder.group({
      name: new FormControl('', [Validators.required]),
      businessName: new FormControl('', [Validators.required]),
      address: ['', Validators.required],
      agencyTimezone: new FormControl('', [Validators.required]),
      companyEmail: ['', [Validators.required, this.validateCompanyEmail()]],
      phoneNumber: new FormControl('', []),
      websiteUrl: ['', [this.validateWebsiteUrl()]]
    });

    this.editCompanyDetails.valueChanges
      .pipe(takeUntil(this.subscribers))
      .subscribe(() => {
        this.checkSubmit = true;
      });

    this.editCompanyDetails
      .get('agencyTimezone')
      .valueChanges.pipe(
        takeUntil(this.unsubscribe),
        map((timeZone) => {
          return this.timezoneOptions.find((item) => item.value === timeZone);
        }),
        filter(Boolean)
      )
      .subscribe((timeZone) => {
        this.currentTimeZone = timeZone;
      });

    this.checkDisableForm();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment =
          this.agencyServiceDashboard?.isRentManagerCRM(company);
        if (this.isRmEnvironment) {
          this.maxCharacter = 14;
        }
        this.areaCode = this.isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
        this.listOfSubscription = company?.agencies;
      });
  }

  phoneNumberValidator() {
    const minLength = this.agencyDashboardService.getPhoneNumberMinLength.value;
    const phoneNumberControl = this.editCompanyDetails.get('phoneNumber');
    phoneNumberControl.addValidators(this.minLength(minLength, 'Phone number'));
  }

  handleOnchangeForm() {
    this.isChangeData = true;
  }

  checkDisableForm() {
    this.isPermissionEdit = this.permissionService.hasFunction(
      'COMPANY_DETAIL.PROFILE.EDIT'
    );
    if (this.isPermissionEdit) {
      this.editCompanyDetails.enable();
    } else this.editCompanyDetails.disable();
  }

  maxLength(max: number, name: string): ValidatorFn {
    return (
      control: AbstractControl
    ): { [key: string]: ValidationErrors } | null => {
      if (control.value && control.value.replace(/\s/g, '').length > max) {
        return { [name + ' ']: null };
      }
      return null;
    };
  }

  minLength(min: number, name: string): ValidatorFn {
    return (
      control: AbstractControl
    ): { [key: string]: ValidationErrors } | null => {
      if (control.value && control.value.replace(/[^0-9]/g, '').length < min) {
        return { [name + ' ']: null };
      }
      return null;
    };
  }

  validateWebsiteUrl(): ValidatorFn {
    return (
      control: AbstractControl
    ): { [key: string]: ValidationErrors } | null => {
      if (control.value && !this.validateURL(control.value)) {
        return { ['URL' + ' ']: null };
      }
      return null;
    };
  }

  validateCompanyEmail(): ValidatorFn {
    return (
      control: AbstractControl
    ): { [key: string]: ValidationErrors } | null => {
      if (control.value && !this.validateEmail(control.value)) {
        return { ['Email' + ' ']: null };
      }
      return null;
    };
  }

  onPhoneNumberChange($event: Event) {
    this.phoneNumberValidator();
    let phoneNumber = ($event.target as HTMLInputElement).value;
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    this.editCompanyDetails.patchValue({ phoneNumber: phoneNumber });
    this.maskPattern = getMaskPhoneNumber(phoneNumber, this.areaCode);
    this.isChangeData = true;
  }

  customTZSearchFn(timezone: string, item) {
    timezone = timezone.toLowerCase();
    return Boolean(item?.label?.toLowerCase()?.includes(timezone));
  }

  handleDefaultLogo() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (!res) return;
        this.currentCompany = res;
        this.urlCompanyLogo = res?.useDefaultLogo
          ? res?.defaultLogo
          : res?.logo;
      });
  }

  getListPublicHoliday() {
    this.calendarService
      .getViewCalendarByRegion(
        this.lastOfficeHour?.id,
        new Date().getFullYear()
      )
      .pipe(takeUntil(this.subscribers))
      .subscribe({
        next: (res) => {
          this.publicHolidays = res || [];
          this.publicHolidays = this.publicHolidays
            .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
            .map((holiday) => {
              return {
                ...holiday,
                date: dayjs(holiday.date).format(
                  this.agencyDateFormatService.dateFormat$.value
                    ?.DATE_FORMAT_DAYJS
                )
              };
            })
            .filter((holiday) => holiday.isActive);
        }
      });
  }

  getWorkingHoursExist() {
    this.agencyDashboardService
      .getWorkingHoursExist()
      .pipe(takeUntil(this.subscribers))
      .subscribe({
        next: (data) => {
          this.lastOfficeHour = null;
          if (!data || data?.message) return;
          this.lastOfficeHour = data;
          this.lastOfficeHour.regionWorkingHours =
            this.lastOfficeHour.regionWorkingHours.map((item) => {
              return {
                ...item,
                label: item.dayInWeek.slice(0, 3),
                startTime12: formatTime(item.startTime),
                endTime12: formatTime(item.endTime)
              };
            });

          this.lastOfficeHour.timeLabel = mapWorkingHoursTimeLabel(
            this.lastOfficeHour.regionWorkingHours
          );

          this.lastOfficeHour.dayLabel =
            'Public holidays in ' + this.lastOfficeHour.alias[1];
        },
        error: () => {},
        complete: () => {
          if (this.lastOfficeHour?.id) {
            this.getListPublicHoliday();
          }
        }
      });
  }

  getSuppliers(): void {
    this.companyService
      .getCurrentCompanyId()
      .pipe(takeUntil(this.subscribers), distinctUntilChanged())
      .subscribe({
        next: (companyId) => {
          if (companyId) {
            this.loadingService.onLoading();
            this.getDataTable(companyId);
            this.handleGetBankAccount();
            this.getWorkingHoursExist();
          } else {
            this.whenAgencyIdNull();
          }
        },
        error: () => {
          this.loadingService.stopLoading();
        }
      });
  }

  whenAgencyIdNull() {
    this.agentDetailInfo = IF_NULL_AGENCY;
  }

  getDataTable(userId?: string) {
    this.agencyDashboardService
      .getAgencySetting()
      .pipe(catchError(() => of<AgentSettingInfo>(IF_NULL_AGENCY)))
      .subscribe({
        next: (e) => {
          this.isEditCompanyDetails = false;
          const websiteUrl = e.agencySetting?.websiteUrl || e?.websiteUrl;
          this.isAddLinkSuccess = websiteUrl?.length > 0;
          this.linkWebSiteConfirm = websiteUrl;
          this.agentDetailInfo = e;
          this.editCompanyDetails.patchValue({
            name: e.name,
            businessName: e.businessName,
            address: e.address,
            agencyTimezone: e.timeZone,
            companyEmail: e.companyEmail,
            phoneNumber: e.phoneNumber,
            websiteUrl: websiteUrl
          });
          this.maskPattern = getMaskPhoneNumber(e.phoneNumber, this.areaCode);
        }
      });
  }

  setWorkingHour() {
    if (
      this.permissionService.isOwner ||
      this.permissionService.isAdministrator
    ) {
      this.showWorkingHour = true;
    }
  }

  handleSetInputValue($event) {
    const value = $event.target.value;
    this.isURL = this.validateURL(value);
    if (this.isURL) {
      this.linkWebSite = value;
    } else {
      this.linkWebSite = '';
    }
  }

  validateURL(domain: string): boolean {
    const regexURL = URL_PATTERN;
    return regexURL.test(domain);
  }

  validateEmail(email: string): boolean {
    const regexEmail = EMAIL_VALIDATE;
    return regexEmail.test(email);
  }

  handleAddWebsiteLink() {
    if (this.isURL && this.linkWebSite.length > 0) {
      this.agencyService
        .addLinkContact(this.linkWebSite)
        .pipe(takeUntil(this.subscribers))
        .subscribe({
          next: (res) => {
            this.linkWebSiteConfirm = this.linkWebSite;
            this.isShowModal = false;
            this.isAddLinkSuccess = true;
          },
          error: (err) => {
            this.isAddLinkSuccess = false;
            this.isShowModal = false;
          }
        });
    }
  }

  handleEditLink(link: string) {
    this.addLinkTitle = 'Change Website URL';
    this.isShowModal = true;
    this.linkWebSite = link;
  }

  handleGotoLink(link: string) {
    window.open(link, '_blank');
  }

  handleGetBankAccount() {
    this.userService
      .getBankAccount()
      .pipe(takeUntil(this.subscribers))
      .subscribe((data) => {
        if (!data) return;
        this.listOfTrustAccount = data?.map((acc) => ({
          ...acc,
          agencyName: acc.agency?.name
        }));
        this.loadingService.stopLoading();
      });
  }

  handleToggleAccountPopup() {
    this.isOpenPopupSetAccount = !this.isOpenPopupSetAccount;
  }

  handleToggleDeleteAccountPopup(id: string) {
    this.deletedIdAccount = id;
    this.isOpenPopupDeleteAccount = !this.isOpenPopupDeleteAccount;
  }

  checkErrorValue(errors): boolean {
    for (let key in errors) {
      if (errors[key].hasError || errors[key].isRequired) {
        return true;
      }
    }
    return false;
  }

  onShowUploadLogoModalChange(value: boolean) {
    if (!this.isPermissionEdit) return;
    if (value) {
      const { defaultLogo, useDefaultLogo, logo } = this.currentCompany || {};
      const currentLogo = useDefaultLogo ? defaultLogo : logo;
      this.urlCompanyLogo = this.urlCompanyLogo ?? currentLogo;
    }
    this.urlLogo = this.urlCompanyLogo;
    this.isShowUploadLogoModal = value;
  }

  onCurrentStepChange(step: number) {
    this.currentStep = step;
    if (this.currentStep === EUploadAgencyStep.REMOVE) {
      this.urlLogo = this.currentCompany.defaultLogo;
    } else {
      const { defaultLogo, useDefaultLogo, logo } = this.currentCompany || {};
      this.urlLogo = useDefaultLogo ? defaultLogo : logo;
    }
  }
  onQuitConfirmChange(value: boolean) {
    this.isShowUploadQuitConfirm = value;
  }
  onShowCroppieChange(value: boolean) {
    this.showCroppie = value;
  }
  togglePopupAddLink() {
    this.isShowModal = !this.isShowModal;
    this.isURL = true;
  }

  handleSaveLogo() {
    this.handleOnchangeForm();
    this.onSubmitEdit();
  }

  onLinkNewImage(url: string) {
    this.urlCompanyLogo = url;
  }

  onSubmitEdit() {
    this.checkSubmit = false;
    if (!this.isChangeData) return;
    if (this.editCompanyDetails.invalid) {
      this.editCompanyDetails.markAllAsTouched();
      return;
    }

    const body = {
      ...this.editCompanyDetails.value,
      mediaLink: this.urlCompanyLogo || undefined
    };

    this.agencyDashboardService.updateCompanyDetails(body).subscribe(
      async () => {
        this.isEditCompanyDetails = false;
        const {
          name,
          businessName,
          address,
          companyEmail,
          phoneNumber,
          websiteUrl,
          mediaLink
        } = body;

        this.agentDetailInfo = {
          ...this.agentDetailInfo,
          name,
          businessName,
          address,
          companyEmail,
          phoneNumber
        };
        this.linkWebSiteConfirm = websiteUrl;
        if (mediaLink) {
          this.currentCompany.logo = mediaLink;
          this.currentCompany.useDefaultLogo = false;
        }
        const companies = await lastValueFrom(
          this.dashboardApiService.getUserAgencies(this.currentUser.id)
        );
        if (!companies?.length || !companies[0]?.id) {
          throw new Error('Get user companies fail!');
        }
        this.companyService.setCompanies(companies);
      },
      (err) => {
        if (err?.status === 409) {
          const { message } = err.error || {};
          if (message === messageError.accountName) {
            this.editCompanyDetails.controls['name'].setErrors({
              name: 'duplicate'
            });
          } else if (message === messageError.phoneNumber) {
            this.editCompanyDetails.controls['phoneNumber'].setErrors({
              phoneNumber: 'duplicate'
            });
          } else if (message === messageError.email) {
            this.editCompanyDetails.controls['companyEmail'].setErrors({
              companyEmail: 'duplicate'
            });
          }
        }
      },
      () => {
        this.isChangeData = false;
      }
    );
  }

  ngOnDestroy() {
    this.subscribers.next();
    this.subscribers.complete();
  }
}
