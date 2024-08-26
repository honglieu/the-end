import { Component, Input, OnInit, Output } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidatorFn,
  ValidationErrors
} from '@angular/forms';
import { ShareValidators } from '@shared/validators/share-validator';
import { EventEmitter } from '@angular/core';
import {
  PHONE_NUMBER_PATTERN_OTHER,
  PHONE_PREFIXES,
  PROTOCOL
} from '@services/constants';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService as AgencyServiceDashboard } from '@/app/dashboard/services/agency.service';
import { getMaskPhoneNumber } from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'add-new-supplier',
  templateUrl: './add-new-supplier.component.html',
  styleUrls: ['./add-new-supplier.component.scss']
})
export class AddNewSupplierComponent implements OnInit {
  @Input() isShowPopup: boolean = false;
  @Output() handleConfirm = new EventEmitter();
  @Output() handleClose = new EventEmitter();
  private protocol = PROTOCOL;
  phoneNumberPattern = PHONE_NUMBER_PATTERN_OTHER;
  public unsubscribe = new Subject<void>();
  public isRmEnvironment: boolean = false;
  public areaCode: string;
  constructor(
    private agencyServiceDashboard: AgencyServiceDashboard,
    private companyService: CompanyService
  ) {}

  public addNewSupplierForm: FormGroup;

  get companyName(): AbstractControl {
    return this.addNewSupplierForm?.get('companyName');
  }

  get companyPhoneNumber(): AbstractControl {
    return this.addNewSupplierForm?.get('companyPhoneNumber');
  }

  get contactName(): AbstractControl {
    return this.addNewSupplierForm?.get('contactName');
  }

  get website(): AbstractControl {
    return this.addNewSupplierForm?.get('website');
  }

  get email(): AbstractControl {
    return this.addNewSupplierForm?.get('email');
  }

  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment =
          this.agencyServiceDashboard.isRentManagerCRM(company);
        this.areaCode = this.isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });

    this.addNewSupplierForm = new FormGroup({
      companyName: new FormControl('', [Validators.required]),
      companyPhoneNumber: new FormControl('', [
        Validators.required,
        this.phoneNumberMinLength(
          this.agencyServiceDashboard.getPhoneNumberMinLength.value
        )
      ]),
      contactName: new FormControl(''),
      website: new FormControl('', [ShareValidators.websiteUrl()]),
      email: new FormControl('', [Validators.required, ShareValidators.email()])
    });
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

  triggerCompanyPhoneNumber($event) {
    let phoneNumber = ($event.target as HTMLInputElement).value;
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    this.phoneNumberPattern = getMaskPhoneNumber(phoneNumber, this.areaCode);
    this.addNewSupplierForm.patchValue({ companyPhoneNumber: phoneNumber });
  }

  handleAddSupplier() {
    if (this.addNewSupplierForm.invalid) {
      this.addNewSupplierForm.markAllAsTouched();
      return;
    }
    const regexWebsite = new RegExp(`^${this.protocol}`);
    if (this.website.value && !regexWebsite.test(this.website.value)) {
      const website = `${this.protocol}${this.website.value}`;
      this.website.setValue(website);
    }
    const phoneNumber = this.addNewSupplierForm.get('companyPhoneNumber').value;
    const phone = `${this.areaCode}${phoneNumber}`;
    this.handleConfirm.emit({
      ...this.addNewSupplierForm.value,
      companyPhoneNumber: phone
    });
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
