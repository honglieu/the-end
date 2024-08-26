import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { SyncPropertyTreeLeasingFormService } from '@/app/leasing/services/sync-property-tree-leasing-form.service';
import { ContactMethod, IContact } from '@/app/leasing/utils/leasingType';
import { LeasingWidgetService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/leasing.service';

@Component({
  selector: 'tenancy-detail',
  templateUrl: './tenancy-detail.component.html',
  styleUrls: ['./tenancy-detail.component.scss']
})
export class TenancyDetailComponent implements OnInit {
  @Input() disable: boolean = null;
  @Input() syncStatus: boolean = null;

  constructor(
    public leasingFormService: SyncPropertyTreeLeasingFormService,
    public leasingWidgetService: LeasingWidgetService
  ) {}

  get leasingForm(): FormGroup {
    return this.leasingFormService.leasingForm;
  }

  get tenancyName(): AbstractControl {
    return this.leasingForm.get('tenancyName');
  }

  get tenantContacts(): AbstractControl {
    return this.leasingForm.get('tenantContacts');
  }

  get tenantContactsOrder(): AbstractControl {
    const tenantContacts = this.leasingForm.get('tenantContacts').value;
    return tenantContacts.sort((a, b) => b.isPrimary - a.isPrimary);
  }

  ngOnInit(): void {}

  toggleAddTenantContactPopup(event?: { contactEdit: IContact; pos: number }) {
    if (this.disable) return;
    this.leasingWidgetService.setShowAddTenantContactPopup(true);
    if (!event) {
      this.leasingFormService.tenantContactsForm.reset();
      this.leasingWidgetService.isEditTenantContact$.next(false);
      return;
    }
    const { contactEdit, pos } = event;
    this.leasingWidgetService.isEditTenantContact$.next(true);
    this.leasingWidgetService.tenantContactIndex$.next(pos);
    this.leasingFormService.tenantContactsForm.setValue({
      givenName: contactEdit.givenName || '',
      familyName: contactEdit.familyName || '',
      addressLine1: contactEdit.address.addressLine1 || '',
      email:
        contactEdit.contactInfos.find(
          (x) => x.contactMethod === ContactMethod.Email
        )?.details || '',
      phoneNumber:
        contactEdit.contactInfos.find(
          (x) => x.contactMethod === ContactMethod.HomePhone
        )?.details || '',
      unit: contactEdit.address.unit || '',
      streetNumber: contactEdit.address.streetNumber || '',
      suburb: contactEdit.address.suburb || '',
      state: contactEdit.address.state || '',
      postcode: contactEdit.address.postcode || '',
      country: contactEdit.address.country || ''
    });
  }

  onToggleRemoveTenantContact(event?: {
    pos: number;
    isPrimaryTenant: boolean;
  }) {
    const { pos, isPrimaryTenant } = event;

    if (!isPrimaryTenant || this.tenantContacts.value.length === 1) {
      const filterContact = this.tenantContacts.value.filter(
        (contact, index) => index !== pos && contact
      );

      this.tenantContacts.setValue(filterContact);
      return;
    }
    this.leasingWidgetService.setShowConfirmTenantContactPopup(true);
  }

  isFieldValid(field: string) {
    if (this.leasingForm) {
      return (
        !this.leasingForm.get(field).valid &&
        this.leasingForm.get(field).touched
      );
    }
    return false;
  }
}
