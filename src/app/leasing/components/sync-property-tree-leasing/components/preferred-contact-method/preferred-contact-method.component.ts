import { SyncPropertyTreeLeasingFormService } from '@/app/leasing/services/sync-property-tree-leasing-form.service';
import { ContactMethod } from '@/app/leasing/utils/leasingType';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TrudiUiModule } from '@trudi-ui';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';

const FORM_CONTROL_NAMES = ['notice', 'invoice', 'receipt'];
const ALL_FORM_CONTROL_NAMES = [...FORM_CONTROL_NAMES].concat('offer');

@Component({
  selector: 'preferred-contact-method',
  standalone: true,
  imports: [
    CommonModule,
    TrudiUiModule,
    NzDropDownModule,
    NzToolTipModule,
    ReactiveFormsModule
  ],
  templateUrl: './preferred-contact-method.component.html',
  styleUrl: './preferred-contact-method.component.scss'
})
export class PreferredContactMethodComponent implements OnInit, OnDestroy {
  @Input() disable: boolean = false;

  private destroy$ = new Subject<void>();
  public CONTACT_METHOD_DATA = [
    {
      label: 'Auto email receipts',
      tooltip: '',
      controlName: 'receipt',
      disabled: !this.tenantContacts?.value?.length
    },
    {
      label: 'Auto email invoices',
      tooltip: '',
      controlName: 'invoice',
      disabled: !this.tenantContacts?.value?.length
    },
    {
      label: 'Has not consented for electronic notices',
      tooltip:
        'Tick this box if the Tenant Contact has not consented to receive electronic notices. Residential Inspection Notices for this contact will be sent to the Company Email',
      controlName: 'notice',
      disabled: !this.tenantContacts?.value?.length
    },
    {
      label: 'Do not contract tenant for marketing/promotional offers',
      tooltip:
        'Tick this box if you do not wish for this tenant contact to receive marketing and promotional content, such as referrals for Movinghub',
      controlName: 'offer',
      disabled: false
    }
  ];
  public contactInfos;
  constructor(
    private syncPropertyTreeLeasingFormService: SyncPropertyTreeLeasingFormService
  ) {}

  ngOnInit(): void {
    this.handleDisabledAllForm();
    this.initForm();
    this.leasingForm.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        if (this.disable) return;
        if (res.tenantContacts?.length) {
          this.handleChangeStatusControl(FORM_CONTROL_NAMES, 'enable');
          this.contactInfos = [...res.tenantContacts]?.map((item) => ({
            ...item?.contact?.contactInfos.find(
              (it) => it?.contactMethod === ContactMethod.Email
            )
          }));
          if (this.contactInfos?.length === 1 && this.contactInfos?.[0]) {
            this.contactEmailControl.setValue(this.contactInfos[0]?.details);
          }
        } else {
          this.handleChangeStatusControl(FORM_CONTROL_NAMES, 'disabled');
          this.syncPropertyTreeLeasingFormService.resetForm([
            'contactMethodForm'
          ]);
        }
      });
  }

  private initForm() {
    if (this.disable) return;
    if (this.tenantContacts.value?.length) {
      this.handleChangeStatusControl(FORM_CONTROL_NAMES, 'enable');
      this.contactMethodForm.patchValue({
        receipt: true,
        invoice: true
      });
    } else {
      this.handleChangeStatusControl(FORM_CONTROL_NAMES, 'disabled');
    }
  }

  private handleChangeStatusControl(
    formNames: string[],
    type: 'enable' | 'disabled'
  ) {
    formNames.forEach((controlName) => {
      if (type === 'enable') {
        this.contactMethodForm.get(controlName).enable();
      } else {
        this.contactMethodForm.get(controlName).disable();
      }
    });
  }

  private handleDisabledAllForm() {
    if (this.disable) {
      this.handleChangeStatusControl(ALL_FORM_CONTROL_NAMES, 'disabled');
    }
  }

  public onSelectContactEmail(contactEmail) {
    this.contactEmailControl.setValue(contactEmail);
  }

  get leasingForm() {
    return this.syncPropertyTreeLeasingFormService.leasingForm;
  }
  get tenantContacts() {
    return this.leasingForm.get('tenantContacts');
  }
  get contactMethodForm() {
    return this.syncPropertyTreeLeasingFormService.contactMethodForm;
  }

  get offerControl() {
    return this.contactMethodForm.get('offer');
  }

  get noticeControl() {
    return this.contactMethodForm.get('notice');
  }

  get invoiceControl() {
    return this.contactMethodForm.get('invoice');
  }

  get receiptControl() {
    return this.contactMethodForm.get('receipt');
  }

  get contactEmailControl() {
    return this.contactMethodForm.get('contactEmail');
  }

  get hasManyTenantContact() {
    return this.tenantContacts?.value?.length > 1;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
