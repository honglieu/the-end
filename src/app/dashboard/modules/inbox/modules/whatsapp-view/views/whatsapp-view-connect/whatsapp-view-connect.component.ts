import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { filter, Subject, takeUntil } from 'rxjs';
import {
  PhoneNumberToRegisterType,
  WhatsappSteps
} from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.enum';
import { animate, style, transition, trigger } from '@angular/animations';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {
  CompanyService,
  PermissionService,
  PHONE_NUMBER_PATTERN_OTHER,
  PHONE_PREFIXES
} from '@/app/services';
import {
  AgencyService,
  AgencyService as AgencyServiceDashboard
} from '@/app/dashboard/services/agency.service';
import { getMaskPhoneNumber } from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';
import { VoicemailService } from '@/app/dashboard/modules/agency-settings/components/voicemail/voicemail.service';
import { EAddOnType } from '@/app/console-setting/agencies/utils/agencies-setting.enum';

@Component({
  selector: 'whatsapp-view-connect',
  templateUrl: './whatsapp-view-connect.component.html',
  styleUrls: ['./whatsapp-view-connect.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('textAnimation', [
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(0px)' }),
        animate(
          '150ms ease-in',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ]),
      transition('* => void', [
        animate(
          '150ms ease-out',
          style({ opacity: 0, transform: 'translateY(0px)' })
        )
      ])
    ])
  ]
})
export class WhatsappViewConnectComponent implements OnInit, OnDestroy {
  @Output() completeConnect = new EventEmitter<void>();
  public currentStep = WhatsappSteps.Initial;
  private destroy$ = new Subject<void>();
  readonly WhatsappSteps = WhatsappSteps;
  readonly PhoneNumberToRegisterType = PhoneNumberToRegisterType;
  public phoneForm: FormGroup;
  public areaCode: string;
  public isRmEnvironment: boolean = false;
  public phoneNumberPattern = PHONE_NUMBER_PATTERN_OTHER;
  public voicemailPhoneNumber: string = '';
  public isTurnOnWhatsApp: boolean;
  public isPermissionEdit: boolean = false;

  public checkboxList = [
    {
      value: PhoneNumberToRegisterType.SAME_PHONE_NUMBER,
      label: 'The same number in use for your Trudi® voicemail and SMS',
      disabled: true
    },
    {
      value: PhoneNumberToRegisterType.MY_OWN_PHONE_NUMBER,
      label: 'My own phone number',
      note: 'A phone number linked to a physical device. This phone number cannot be linked to an existing WhatsApp account and must be able to verify via a one-time PIN.'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private agencyServiceDashboard: AgencyServiceDashboard,
    private voicemailService: VoicemailService,
    private agencyService: AgencyService,
    private permissionService: PermissionService
  ) {
    this.phoneForm = this.fb.group({
      phoneOption: [PhoneNumberToRegisterType.SAME_PHONE_NUMBER],
      phoneNumber: ['']
    });
  }

  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment =
          this.agencyServiceDashboard.isRentManagerCRM(company);
        this.areaCode = this.isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });

    this.voicemailService.voicemailSetting$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) =>
          (this.voicemailPhoneNumber = data.company.voiceMailPhoneNumber)
      );

    this.phoneForm
      .get('phoneNumber')
      .setValidators([
        Validators.required,
        this.phoneNumberMinLength(
          this.agencyServiceDashboard.getPhoneNumberMinLength.value
        )
      ]);

    this.agencyService.currentPlan$
      .pipe(
        filter((res) => !!res),
        takeUntil(this.destroy$)
      )
      .subscribe((currentPlan) => {
        this.isTurnOnWhatsApp =
          currentPlan?.features?.[EAddOnType.WHATSAPP]?.enable;
      });

    this.isPermissionEdit =
      this.permissionService.isOwner || this.permissionService.isAdministrator;
  }

  phoneNumberMinLength(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (
        control?.value &&
        control?.value.replace(/^\(\+1\) |[^0-9]/g, '').length < min
      ) {
        return { invalidPhoneNumber: true };
      }
      if ((control?.dirty || control?.touched) && control?.value === '') {
        return { required: true };
      }
      return null;
    };
  }

  triggerCompanyPhoneNumber($event: Event): void {
    let phoneNumber = ($event.target as HTMLInputElement).value;
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    this.phoneNumberPattern = getMaskPhoneNumber(phoneNumber, this.areaCode);
    this.phoneForm.patchValue({ phoneNumber: phoneNumber });
  }

  handleCreateWhatsAppAccount(): void {
    this.currentStep = WhatsappSteps.GetStart;
  }

  handleConfirm(): void {
    const selectedOption = this.phoneForm.get('phoneOption').value;

    if (selectedOption === PhoneNumberToRegisterType.SAME_PHONE_NUMBER) {
      const phone = `${this.areaCode}${this.voicemailPhoneNumber}`;
      this.currentStep = WhatsappSteps.Success;
    } else if (
      selectedOption === PhoneNumberToRegisterType.MY_OWN_PHONE_NUMBER
    ) {
      if (this.phoneForm.invalid) {
        this.phoneForm.markAllAsTouched();
        return;
      } else {
        const phoneNumber = this.phoneForm.get('phoneNumber').value;
        const phone = `${this.areaCode}${phoneNumber}`;
        this.currentStep = WhatsappSteps.Success;
      }
    }
  }

  handleAddPhoneNumberForm() {
    this.currentStep = WhatsappSteps.Integrate;
  }

  handleCancel() {
    this.currentStep = WhatsappSteps.Initial;
  }

  handleComplete() {
    this.completeConnect.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
