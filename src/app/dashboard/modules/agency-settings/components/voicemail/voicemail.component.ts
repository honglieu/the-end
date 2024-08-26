import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';
import { FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isEqual } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  Subject,
  distinctUntilChanged,
  of,
  pairwise,
  startWith,
  switchMap,
  takeUntil
} from 'rxjs';
import { ERole } from '@/app/auth/auth.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { PHONE_PREFIXES } from '@services/constants';
import { LoadingService } from '@services/loading.service';
import { UserService } from '@services/user.service';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import {
  INVALID_NUMBER,
  REDIRECT_NUMBER_DUPLICATED,
  daysOfWeek,
  voicemailCustomiseOption
} from '@/app/dashboard/modules/agency-settings/utils/constants';
import {
  ECustomiseVoicemailOption,
  ICustomiseValue,
  IVoicemailCustomHoursData,
  IVoicemailCustomiseOptionProps,
  IVoicemailSetting
} from '@/app/dashboard/modules/agency-settings/utils/enum';
import { getMaskPhoneNumber } from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';
import { VoicemailApiService } from './voicemail-api.service';
import { VoicemailFormService } from './voicemail-form.service';
import { VoicemailService } from './voicemail.service';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { CompanyService } from '@services/company.service';
import { PermissionService } from '@services/permission.service';

@Component({
  selector: 'voicemail',
  templateUrl: './voicemail.component.html',
  styleUrls: ['./voicemail.component.scss']
})
export class VoicemailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('outsideOfficeHours', { static: true })
  outsideOfficeHours: ElementRef;
  @ViewChild('customHours', { static: true }) customHours: ElementRef;
  @ViewChild('customHoursDisplay', { static: true })
  customHoursDisplay: ElementRef;
  @ViewChild('voicemailContainer', { static: false })
  voicemailContainer: ElementRef<HTMLDivElement>;

  voicemailCustomiseOption: IVoicemailCustomiseOptionProps[] =
    voicemailCustomiseOption;
  currentAgencyId: string;
  areaCode: string;
  visible: boolean = false;
  voicemailAgencyNumber: string;
  redirectPhoneTerm: string;
  customHoursData: IVoicemailCustomHoursData[] = [];
  voicemailSetting: IVoicemailSetting;
  daysOfWeek = daysOfWeek;
  loadingVoicemailSetting: boolean = false;
  phonePrefixes = PHONE_PREFIXES;
  isRMEnvironment: boolean = false;
  isAdminOrOwner: boolean = false;
  isCustomHoursDataEmpty: boolean = false;
  previousCustomiseVoicemailValue: ECustomiseVoicemailOption;
  maxCharacter: number = 12;
  isRmEnvironment: boolean = false;
  maskPattern: string;
  readonly INVALID_NUMBER = INVALID_NUMBER;
  readonly REDIRECT_NUMBER_DUPLICATED = REDIRECT_NUMBER_DUPLICATED;
  private destroy$ = new Subject<void>();

  constructor(
    public loadingService: LoadingService,
    private router: Router,
    private renderer: Renderer2,
    private userService: UserService,
    private toastService: ToastrService,
    private activatedRoute: ActivatedRoute,
    private voicemailService: VoicemailService,
    private phoneFormatPipe: PhoneNumberFormatPipe,
    private voicemailApiService: VoicemailApiService,
    private voicemailFormService: VoicemailFormService,
    private permissionService: PermissionService,
    private readonly agencyDashboardService: AgencyService,
    private companyService: CompanyService
  ) {}

  get voicemailForm() {
    return this.voicemailFormService?.voicemailForm;
  }

  get redirectNumber() {
    return this.voicemailFormService?.voicemailForm?.get('redirectNumber');
  }

  get customiseVoicemail() {
    return this.voicemailFormService?.voicemailForm?.get('customiseVoicemail');
  }

  get dayForms() {
    return (this.voicemailForm?.get('days') as FormArray).controls;
  }

  get days() {
    return this.voicemailForm?.get('days');
  }

  ngOnInit(): void {
    this.voicemailFormService.buildVoicemailForm();
    this.getVoicemailSetting();
    this.subscribeVoicemailSetting();
    this.subscribeCustomiseVoicemailValueChanges();
    this.subscribeCurrentPlan();
    this.getAgenciesDashboard();
  }

  ngAfterViewInit() {
    this.addTemplate();
  }

  subscribeCurrentPlan() {
    this.agencyDashboardService.currentPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe((configPlan) => {
        if (!configPlan) return;
        const isVoicemailEnabled = localStorage.getItem('isVoicemailEnabled');
        if (isVoicemailEnabled === 'false') {
          this.router.navigate(['..'], {
            relativeTo: this.activatedRoute
          });
        }
      });
  }

  getAgenciesDashboard() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
        if (this.isRmEnvironment) {
          this.maxCharacter = 14;
        }
        this.areaCode = this.isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });
  }

  getVoicemailSetting() {
    this.loadingVoicemailSetting = true;
    this.companyService
      .getCurrentCompany()
      .pipe(
        switchMap((company) => {
          if (!company) return of(null);
          const currentUser = this.userService.userInfo$?.value;
          const isConsole = [
            UserTypeEnum.AGENT,
            UserTypeEnum.ADMIN,
            UserTypeEnum.SUPERVISOR
          ].includes(currentUser?.type as UserTypeEnum);
          const currentRole = this.permissionService.getCurrentRole;
          this.isAdminOrOwner = isConsole
            ? currentRole === UserTypeEnum.ADMIN
            : [ERole.OWNER, ERole.ADMIN].includes(currentRole as ERole);
          this.voicemailCustomiseOption = this.voicemailCustomiseOption.map(
            (option) => ({ ...option, disabled: !this.isAdminOrOwner })
          );
          this.isRMEnvironment =
            this.agencyDashboardService.isRentManagerCRM(company);
          return this.voicemailApiService.getVoicemailSetting();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((voicemailSetting: IVoicemailSetting) => {
        if (!voicemailSetting) return;
        this.voicemailService.setVoicemailSetting(voicemailSetting);
        this.loadingVoicemailSetting = false;
      });
  }

  subscribeVoicemailSetting() {
    this.voicemailService.voicemailSetting$
      .pipe(
        distinctUntilChanged((prev, cur) => isEqual(prev, cur)),
        takeUntil(this.destroy$)
      )
      .subscribe((voicemailSetting: IVoicemailSetting) => {
        this.voicemailSetting = voicemailSetting;
        this.areaCode = voicemailSetting?.company?.areaCode;
        this.voicemailAgencyNumber =
          (this.areaCode || '') +
          voicemailSetting?.company?.voiceMailPhoneNumber;
        this.voicemailForm.patchValue(
          {
            redirectNumber: voicemailSetting.redirectNumber,
            customiseVoicemail: voicemailSetting.customizeType
          },
          { emitEvent: false }
        );
        this.redirectPhoneTerm = voicemailSetting?.redirectNumber;
        if (voicemailSetting?.redirectNumber) {
          this.maskPattern = getMaskPhoneNumber(
            voicemailSetting.redirectNumber,
            this.areaCode
          );
        }
        if (!this.redirectNumber.value && this.isAdminOrOwner) {
          this.redirectNumber.markAsTouched();
          this.voicemailCustomiseOption = this.voicemailCustomiseOption.map(
            (option) =>
              option.value !== ECustomiseVoicemailOption.ALWAYS
                ? { ...option, disabled: true }
                : { ...option, disabled: !this.isAdminOrOwner }
          );
        } else {
          this.voicemailCustomiseOption = this.voicemailCustomiseOption.map(
            (option) => ({ ...option, disabled: !this.isAdminOrOwner })
          );
        }
        this.customHoursData = this.formatCustomizeValue(
          voicemailSetting.customizeValue?.['CUSTOM_HOURS']
        );
        this.isCustomHoursDataEmpty =
          !voicemailSetting.customizeValue ||
          this.customHoursData?.every(
            (data) => !data.startTime && !data.endTime
          );
        this.voicemailForm.patchValue(
          {
            days: this.customHoursData
          },
          { emitEvent: false }
        );
      });
  }

  formatRedirectNumber(areaCode: string, redirectNumber: string) {
    if (!redirectNumber) return '';
    const requiredLength = areaCode === PHONE_PREFIXES.US[0] ? 10 : 9;
    let formattedRedirectNumber = redirectNumber;
    formattedRedirectNumber =
      redirectNumber.length === requiredLength
        ? formattedRedirectNumber
        : formattedRedirectNumber.slice(-requiredLength);
    return formattedRedirectNumber;
  }

  onPhoneNumberChange($event: Event) {
    let phoneNumber = ($event.target as HTMLInputElement).value;
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    this.voicemailForm.patchValue({ redirectNumber: phoneNumber });
    this.maskPattern = getMaskPhoneNumber(phoneNumber, this.areaCode);
  }

  onTriggerBlurEvent() {
    const redirectNumberValue = this.redirectNumber.value;

    if (!redirectNumberValue || this.redirectNumber?.invalid) {
      if (this.voicemailSetting.redirectNumber) {
        const patchOptions = { emitEvent: false };

        this.voicemailForm.patchValue(
          { redirectNumber: this.redirectPhoneTerm },
          patchOptions
        );

        this.maskPattern = getMaskPhoneNumber(
          this.redirectPhoneTerm,
          this.areaCode
        );
      }
      return;
    }
    if (
      this.redirectNumber?.value !==
      this.formatRedirectNumber(
        this.areaCode,
        this.voicemailSetting?.redirectNumber
      )
    ) {
      this.updateVoicemailSetting({
        redirectNumber: this.redirectNumber.value
      });
    }
  }

  onTriggerFocusEvent() {
    if (/[()\s\-]/g.test(this.redirectNumber.value)) {
      this.voicemailForm.patchValue(
        {
          redirectNumber: this.redirectNumber.value.replace(/[()\s\-]/g, '')
        },
        { emitEvent: false }
      );
    }
    this.displayRedirectNumberInput();
  }

  openCustomHoursPopup() {
    if (!this.isAdminOrOwner || !this.voicemailSetting?.redirectNumber) return;
    this.visible = true;
    if (
      this.customiseVoicemail.value !== ECustomiseVoicemailOption.CUSTOM_TIME
    ) {
      this.customiseVoicemail.setValue(ECustomiseVoicemailOption.CUSTOM_TIME);
    }
  }

  formatCustomizeValue(
    daysValue: {
      [key: string]: IVoicemailCustomHoursData;
    }[]
  ) {
    if (!daysValue)
      return daysOfWeek.map(() => ({ startTime: '', endTime: '' }));
    return daysValue.map((day) => {
      const dayValues = Object.values(day)[0] as IVoicemailCustomHoursData;
      return {
        startTime: dayValues.startTime,
        endTime: dayValues.endTime
      };
    }) as IVoicemailCustomHoursData[];
  }

  updateVoicemailSetting(body: {
    [key: string]: ICustomiseValue | ECustomiseVoicemailOption | string;
  }) {
    this.voicemailApiService
      .updateVoicemailSetting({
        idVoicemailSetting: this.voicemailSetting.id,
        ...body
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((voicemailSetting: IVoicemailSetting) => {
        this.voicemailService.setVoicemailSetting(voicemailSetting);
      });
  }

  subscribeCustomiseVoicemailValueChanges() {
    this.customiseVoicemail.valueChanges
      .pipe(
        startWith(this.customiseVoicemail.value),
        pairwise(),
        switchMap(
          ([oldValue, newValue]: [
            oldValue: ECustomiseVoicemailOption,
            newValue: ECustomiseVoicemailOption
          ]) => {
            if (newValue === ECustomiseVoicemailOption.CUSTOM_TIME) {
              this.previousCustomiseVoicemailValue =
                oldValue || this.voicemailSetting.customizeType;
              this.visible = true;
            }
            this.isCustomHoursDataEmpty = this.customHoursData?.every(
              (data) => !data.startTime && !data.endTime
            );
            if (
              (this.isCustomHoursDataEmpty && this.visible) ||
              this.voicemailSetting?.customizeType ===
                this.customiseVoicemail?.value
            )
              return of(null);
            return this.voicemailApiService.updateVoicemailSetting({
              idVoicemailSetting: this.voicemailSetting.id,
              customizeType: newValue
            });
          }
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((voicemailSetting: IVoicemailSetting) => {
        if (!voicemailSetting) return;
        this.voicemailService.setVoicemailSetting(voicemailSetting);
      });
  }

  displayRedirectNumberInput(isFormat?: boolean) {
    const redirectNumberInput =
      this.voicemailContainer?.nativeElement?.querySelector(
        '.trudi-number-field'
      );
    if (redirectNumberInput) {
      this.renderer.setProperty(
        redirectNumberInput,
        'value',
        isFormat
          ? this.phoneFormatPipe.transform(this.redirectNumber.value)
          : this.redirectNumber.value
      );
    }
  }

  addTemplate() {
    this.voicemailCustomiseOption = this.voicemailCustomiseOption.map(
      (option) => {
        switch (option.value) {
          case ECustomiseVoicemailOption.OUTSIDE_OFFICE_HOURS:
            return {
              ...option,
              template: this.outsideOfficeHours
            };
          case ECustomiseVoicemailOption.CUSTOM_TIME:
            return {
              ...option,
              template: this.customHours,
              additionalTemplate: this.customHoursDisplay
            };
          default:
            return option;
        }
      }
    );
  }

  navigateToCompanyDetails() {
    this.router.navigate(['../agency-details'], {
      relativeTo: this.activatedRoute
    });
  }

  copyToClipboard() {
    const voicemailNumber = this.voicemailAgencyNumber;
    if (!voicemailNumber) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(voicemailNumber).then(() => {
        this.toastService.success('Voicemail number copied');
      });
    } else {
      this.toastService.error('Browser does not support copy to clipboard');
    }
  }

  handleCustomHoursSaved(isSaved?: boolean) {
    if (isSaved) {
      this.customHoursData = this.days.value;
    } else {
      this.customHoursData = this.formatCustomizeValue(
        this.voicemailSetting.customizeValue?.['CUSTOM_HOURS']
      );
      this.isCustomHoursDataEmpty = this.customHoursData?.every(
        (data) => !data.startTime && !data.endTime
      );
      this.voicemailForm.patchValue({
        days: this.customHoursData
      });
      if (this.isCustomHoursDataEmpty) {
        this.voicemailForm.patchValue({
          customiseVoicemail: this.previousCustomiseVoicemailValue
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
