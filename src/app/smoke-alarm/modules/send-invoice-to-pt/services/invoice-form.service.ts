import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ValidationErrors
} from '@angular/forms';
import { InvoiceForm } from '@shared/types/tenancy-invoicing.interface';
import { ComplianceService } from '@/app/compliance/services/compliance.service';

@Injectable({
  providedIn: 'root'
})
export class SmokeAlarmInvoiceFormService {
  public invoiceForm: FormGroup;
  public invoiceFormStateBS = new BehaviorSubject(null);

  constructor(
    private formBuilder: FormBuilder,
    public complianceService: ComplianceService
  ) {}

  buildForm(customValue?: InvoiceForm) {
    this.invoiceForm = this.formBuilder.group({
      invoiceType: new FormControl(
        customValue?.invoiceType ?? '',
        Validators.required
      ),
      invoiceDocument: new FormControl(customValue?.invoiceDocument ?? ''),
      // TODO add control base on invoiceType
      creditorInvoice: this.formBuilder.group(
        {
          creditor: new FormControl(
            customValue?.creditorInvoice?.creditor ?? null,
            [Validators.required]
          ),
          invoiceDescription: new FormControl(
            customValue?.creditorInvoice?.invoiceDescription ?? '',
            [Validators.required]
          ),
          invoiceREF: new FormControl(
            customValue?.creditorInvoice?.invoiceREF ?? '',
            [Validators.required]
          ),
          dueDate: new FormControl(
            customValue?.creditorInvoice?.dueDate ?? '',
            [Validators.required]
          ),
          excludingGST: new FormControl(
            customValue?.creditorInvoice?.excludingGST ?? null,
            [
              Validators.required,
              Validators.min(0),
              Validators.maxLength(10),
              Validators.pattern('^[0-9]*(.[0-9]{0,2})?$')
            ]
          ),
          gstAmount: new FormControl(
            customValue?.creditorInvoice?.gstAmount !== 0
              ? customValue?.creditorInvoice?.gstAmount
              : null,
            [
              Validators.min(0),
              Validators.maxLength(10),
              Validators.pattern('^[0-9]*(.[0-9]{0,2})?$')
            ]
          )
        },
        { validators: this.validateGstAmount }
      ),
      tenancy: new FormControl(customValue?.tenancyInvoice?.tenancy ?? '', [])
    });
  }

  clearTenancyControl() {
    this.invoiceForm?.removeControl('tenantInvoice');
  }

  // custom validation
  validateGstAmount(group: FormGroup): ValidationErrors | null {
    const excludingGST = group.get('excludingGST');
    const gstAmount = group.get('gstAmount');

    if (excludingGST && gstAmount) {
      const excludingGSTValue = Number(excludingGST.value);
      const gstAmountValue = Number(gstAmount.value);

      if (gstAmountValue > excludingGSTValue) {
        return { overGSTAmount: 'GST can not be greater than EXC GST' };
      }
    }

    return null;
  }

  resetForm() {
    this.invoiceForm?.enable();
    this.clearTenancyControl();
    this.complianceService.invoiceDataUpdate$.next({});
    this.invoiceForm?.reset();
  }
}
