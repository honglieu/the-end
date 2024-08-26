import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { SyncPropertyTreeLeasingFormService } from '@/app/leasing/services/sync-property-tree-leasing-form.service';

@Component({
  selector: 'confirm-tenant-contact-pop-up',
  templateUrl: './confirm-tenant-contact-pop-up.component.html',
  styleUrls: ['./confirm-tenant-contact-pop-up.component.scss']
})
export class ConfirmTenantContactPopUpComponent implements OnInit {
  public listTenantContacts = [];
  public selectTenantContact = 1;
  @Output() onClose = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<number>();

  constructor(
    public syncPropertyTreeLeasingFormService: SyncPropertyTreeLeasingFormService
  ) {}

  get leasingForm(): FormGroup {
    return this.syncPropertyTreeLeasingFormService.leasingForm;
  }

  get tenantContacts(): AbstractControl {
    return this.leasingForm.get('tenantContacts');
  }

  ngOnInit(): void {
    this.listTenantContacts = this.tenantContacts.value.map(
      (contact, index) => ({ isCheck: index === 1, item: contact })
    );
  }

  closePopup() {
    this.onClose.emit();
  }

  confirmPopup() {
    this.confirm.emit(this.selectTenantContact);
  }

  onCheckboxChange(event: boolean, pos: number) {
    this.selectTenantContact = pos;
    this.listTenantContacts = this.listTenantContacts.map((contact, index) => ({
      ...contact,
      isCheck: index === pos
    }));
  }
}
