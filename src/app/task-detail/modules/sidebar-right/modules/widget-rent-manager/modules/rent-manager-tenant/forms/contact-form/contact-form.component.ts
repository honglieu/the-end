import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { FormArray, FormControl, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { AgencyService as AgencyServiceDashboard } from '@/app/dashboard/services/agency.service';
import { PHONE_NUMBER_PATTERN_US, PHONE_PREFIXES } from '@services/constants';
import { IOptionPill } from '@shared/components/dropdown-pill/dropdown-pill';
import { TenantOptionsStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-options-state.service';
import { ETooltipNewTenantText } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';
import { TenantFormBase } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-base';
import { TenantFormMasterService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-master.service';
import { TenantContactForm } from './tenant-contact-form';
import { formatPhoneNumber } from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';
import { CompanyService } from '@services/company.service';

type ContactForm = FormArray & {
  controls: TenantContactForm[];
};

@Pipe({ name: 'showTextTooltip', pure: false })
export class ShowTextTooltipContactFormPipe implements PipeTransform {
  transform(field: FormControl) {
    const isPrimary = field.get('isPrimary')?.value;
    const contactId = field.get('contactId')?.value;
    return isPrimary
      ? 'Cannot delete primary contact'
      : !isPrimary && contactId
      ? ETooltipNewTenantText.TITLE_TOOLTIP_DELETED
      : '';
  }
}

@Component({
  selector: 'contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss']
})
export class ContactFormComponent
  extends TenantFormBase<ContactForm>
  implements OnInit
{
  public contactForm: ContactForm;
  public listContactType: IOptionPill[] = [];
  public listCoApplicant: IOptionPill[] = [];
  public maskPattern = '';
  public paragraph: object = { rows: 0 };
  public isSyncing: boolean = false;
  public isRmEnvironment: boolean = false;
  public areaCode: string;
  public phoneNumber;

  constructor(
    private tenantOptionsStateService: TenantOptionsStateService,
    private tenantFormMaster: TenantFormMasterService,
    private agencyServiceDashboard: AgencyServiceDashboard,
    private companyService: CompanyService
  ) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.contactForm = this.form;
    this.tenantFormMaster.isSyncing$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isSync) => {
        this.isSyncing = isSync;
      });

    this.tenantOptionsStateService.optionsSync$
      .pipe(takeUntil(this.destroy$))
      .subscribe((options) => {
        this.listContactType = options.contactTypes;
        this.listCoApplicant = options.rmApplicantTypes;
      });

    this.getCurrentAgencyID();
    if (this.contactForm.controls.length === 1) {
      this.contactForm.controls[0].get('isPrimary').setValue(true);
    }
  }

  getCurrentAgencyID() {
    this.companyService
      .getCurrentCompany()
      .pipe()
      .subscribe((company) => {
        this.isRmEnvironment =
          this.agencyServiceDashboard?.isRentManagerCRM(company);
        this.areaCode = this.isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });
  }

  handleAddNewFormContact() {
    const form = new TenantContactForm();
    this.tenantFormMaster.addControl('contacts', form);
    form.markAsPristine();
    form.markAsUntouched();
  }

  handleDeleteContact(index: number) {
    this.tenantFormMaster.removeControl('contacts', index);
  }

  setPrimary(event: MouseEvent, index: number) {
    event.stopPropagation();
    const { controls } = this.contactForm;
    controls[index].get('isPrimary').setValue(true);

    for (let i = 0; i < controls.length; i++) {
      if (i === index) continue;
      controls[i].get('isPrimary').setValue(false);
    }
  }

  onChangeApplicantType(event, index: number) {
    const { controls } = this.contactForm;
    if (!event) {
      controls[index].get('applicantType').addValidators(Validators.required);
    } else {
      controls[index]
        .get('applicantType')
        .removeValidators(Validators.required);
    }
    controls[index].get('applicantType').updateValueAndValidity();
  }

  onPhoneNumberChange(event, index) {
    const phoneNumberInput = event.target as HTMLInputElement;
    let phoneNumber = phoneNumberInput.value;
    phoneNumber = phoneNumber?.replace(/[^0-9+()\s-]/g, '');
    this.phoneNumber = phoneNumber;
    this.contactForm.controls[index]
      .get('phoneNumber')
      .patchValue(formatPhoneNumber(phoneNumber, this.areaCode));
  }

  generateFormatRegion(text: string) {
    let template = '';
    text = text.replace(/[^0-9]/g, '');
    for (let i = 0; i < text.length; i++) {
      template += '0';
    }
    return template;
  }

  getMaskPhoneNumber(phoneNumber, areaCode: string) {
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    let maskPhoneNumber = '';
    switch (areaCode) {
      case PHONE_PREFIXES.US[0]:
        maskPhoneNumber = PHONE_NUMBER_PATTERN_US;
        break;
      default:
        maskPhoneNumber = '';
        break;
    }
    return maskPhoneNumber;
  }
}
