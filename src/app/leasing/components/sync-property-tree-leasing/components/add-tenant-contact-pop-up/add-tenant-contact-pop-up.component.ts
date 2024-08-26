import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SyncPropertyTreeLeasingFormService } from '@/app/leasing/services/sync-property-tree-leasing-form.service';
import { AbstractControl, FormGroup } from '@angular/forms';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { EPropertyTreeType } from '@/app/task-detail/utils/functions';
import { formatPhoneNumber } from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { PHONE_PREFIXES } from '@services/constants';
import { Subject, takeUntil } from 'rxjs';
import { CompanyService } from '@services/company.service';
import { TaskService } from '@/app/services';

@Component({
  selector: 'add-tenant-contact-pop-up',
  templateUrl: './add-tenant-contact-pop-up.component.html',
  styleUrls: ['./add-tenant-contact-pop-up.component.scss']
})
export class AddTenantContactPopUpComponent implements OnInit {
  @Input() isEditTenantContact: boolean;
  @Input() tenantContactIndex: number;
  @Input() isOpenAddContactPopup: boolean;
  @Output() onClose = new EventEmitter<boolean>();
  public maskPattern;
  public isRmEnvironment: boolean = false;
  public areaCode: string;
  public unsubscribe = new Subject<void>();

  constructor(
    public leasingFormService: SyncPropertyTreeLeasingFormService,
    public widgetPTService: WidgetPTService,
    private agencyService: AgencyService,
    private companyService: CompanyService,
    private taskService: TaskService
  ) {}

  get tenantContactsForm(): FormGroup {
    return this.leasingFormService.tenantContactsForm;
  }

  get leasingForm(): FormGroup {
    return this.leasingFormService.leasingForm;
  }

  get givenName(): AbstractControl {
    return this.tenantContactsForm.get('givenName');
  }

  get tenantContacts(): AbstractControl {
    return this.leasingForm.get('tenantContacts');
  }

  ngOnInit(): void {
    if (!this.isEditTenantContact)
      this.leasingFormService.buildFormTenantContact();

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService?.isRentManagerCRM(company);
        this.areaCode = this.isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });

    this.prefillTenantContactForm();
  }

  private prefillTenantContactForm() {
    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          const {
            unitNo = '',
            suburb = '',
            state = '',
            postCode = '',
            country = '',
            streetNumber = '',
            address = ''
          } = res.property || {};
          const street = address?.replace(streetNumber, '') || '';
          this.tenantContactsForm.patchValue({
            addressLine1: street,
            unit: unitNo,
            streetNumber: streetNumber,
            suburb: suburb,
            state: state,
            postcode: postCode,
            country: country
          });
        }
      });
  }

  get isPrimaryContact() {
    if (this.isEditTenantContact) {
      return this.tenantContacts.value[this.tenantContactIndex]?.isPrimary;
    }
    return this.tenantContacts.value?.length === 0;
  }

  closePopup() {
    this.onClose.emit();
    this.widgetPTService.setPopupWidgetState(EPropertyTreeType.NEW_TENANCY);
  }

  onPhoneNumberChange(event: Event): void {
    let phoneNumber = (event.target as HTMLInputElement).value;
    phoneNumber = formatPhoneNumber(phoneNumber, this.areaCode);
    this.tenantContactsForm.patchValue({ phoneNumber: phoneNumber });
  }

  onSaveTenantContact(isEditTenantContact: boolean) {
    if (this.tenantContactsForm.invalid) {
      this.tenantContactsForm.markAllAsTouched();
      return;
    }
    if (isEditTenantContact) {
      const tenantContacts = this.tenantContacts.value;
      tenantContacts[this.tenantContactIndex] = {
        ...this.leasingFormService.mapTenantContact(),
        isPrimary: tenantContacts[this.tenantContactIndex].isPrimary
      };
      this.tenantContacts.setValue(tenantContacts);
    } else {
      this.tenantContacts.setValue([
        ...this.tenantContacts.value,
        this.leasingFormService.mapTenantContact()
      ]);
    }
    this.closePopup();
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
