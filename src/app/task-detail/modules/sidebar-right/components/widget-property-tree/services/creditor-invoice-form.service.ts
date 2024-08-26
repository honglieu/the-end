import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

@Injectable({
  providedIn: 'root'
})
export class CreditorInvoiceFormService {
  public myForm: FormGroup;
  public amountPattern =
    /^(?=.+)(?=.{0,10}$)[0-9]*(\,[0-9]{3})*(\.[0-9]{0,2})?$/;
  readonly dateFormat$ = this.agencyDateFormatService.dateFormat$.getValue();

  constructor(
    private fb: FormBuilder,
    public taskService: TaskService,
    private shareService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  initForm() {
    this.myForm = this.fb.group(
      {
        invoiceDocument: this.fb.control(''),
        accountForm: this.fb.control('', [Validators.required]),
        creditor: this.fb.control('', [Validators.required]),
        account: this.fb.control('', [Validators.required]),
        property: this.fb.control(
          this.taskService.currentTask$.value?.property?.streetline
        ),
        description: this.fb.control('', [
          Validators.required,
          Validators.maxLength(255)
        ]),
        descriptionTenacy: this.fb.control('', Validators.required),
        invoiceREF: this.fb.control('', [Validators.required]),
        amountExcludingGST: this.fb.control('', [
          Validators.required,
          Validators.pattern(this.amountPattern),
          Validators.min(0),
          Validators.maxLength(16)
        ]),
        amountIncludingGST: this.fb.control('', [
          Validators.required,
          Validators.pattern(this.amountPattern),
          Validators.min(0),
          Validators.maxLength(16)
        ]),
        gstAmount: this.fb.control('', [
          Validators.pattern(this.amountPattern),
          Validators.min(0),
          Validators.maxLength(16)
        ]),
        amountExcludingGSTsecond: this.fb.control(null, [
          Validators.required,
          Validators.pattern(this.amountPattern),
          Validators.min(0),
          Validators.maxLength(16)
        ]),
        amountIncludingGSTsecond: this.fb.control(null, [
          Validators.required,
          Validators.pattern(this.amountPattern),
          Validators.min(0),
          Validators.maxLength(16)
        ]),
        gstAmountSecond: this.fb.control(null, [
          Validators.pattern(this.amountPattern),
          Validators.min(0),
          Validators.maxLength(16)
        ]),
        dueDate: this.fb.control('', [Validators.required]),
        accountTenancyInvoice: this.fb.control('', [Validators.required]),
        sendEmailTenancyInvoice: this.fb.control(true),
        dateTenant: this.fb.control('', [Validators.required]),
        tenacyInvoice: this.fb.control(null),
        isUpLoad: this.fb.control(false)
      },
      {
        validators: [
          this.validateGstAmountCreditor(this.shareService),
          this.validateGstAmountTenancy(this.shareService)
        ]
      }
    );
  }

  getCurrentDataForForm(currentData) {
    const { creditorInvoice, tenancyInvoice, isLinkInvoice, syncStatus } =
      currentData || {};
    const { salesTax, amount, description, creditorReference, dueDate } =
      creditorInvoice || {};
    if (syncStatus === ESyncStatus.INPROGRESS) {
      this.myForm.disable();
    }
    const creditorSalesTax = this.shareService.removeCommaInNumber(
      salesTax?.toString()
    );
    const creditorAmount = this.shareService.removeCommaInNumber(
      amount?.toString()
    );
    const invoiceSalesTax = this.shareService.removeCommaInNumber(
      tenancyInvoice?.salesTax?.toString()
    );
    const invoiceAmount = this.shareService.removeCommaInNumber(
      tenancyInvoice?.amount?.toString()
    );

    const numberGSTCreditor =
      creditorSalesTax || creditorAmount
        ? this.toFixedFloat(Number(creditorAmount) - Number(creditorSalesTax))
        : '';
    const numberGSTTeanancy =
      invoiceSalesTax || invoiceAmount
        ? this.toFixedFloat(Number(invoiceAmount) - Number(invoiceSalesTax))
        : '';

    this.myForm.patchValue({
      property: this.taskService.currentTask$.value?.property?.streetline,
      description,
      invoiceREF: creditorReference,
      amountExcludingGST: numberGSTCreditor?.toLocaleString(),
      gstAmount: salesTax?.toLocaleString(),
      amountIncludingGST:
        this.toFixedFloat(creditorAmount)?.toLocaleString() || '',
      descriptionTenacy: currentData?.tenancyInvoice?.description,
      amountExcludingGSTsecond: isLinkInvoice
        ? numberGSTTeanancy?.toLocaleString()
        : '',
      gstAmountSecond: currentData?.tenancyInvoice?.salesTax?.toLocaleString(),
      amountIncludingGSTsecond: isLinkInvoice
        ? this.toFixedFloat(invoiceAmount)?.toLocaleString()
        : '',
      tenancyId: currentData?.tenancyInvoice?.tenancyId,
      dueDate: dueDate
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(dueDate)
        : null,
      dateTenant:
        currentData?.tenancyInvoice &&
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          currentData?.tenancyInvoice?.dueDate
        )
    });
  }

  validateGstAmountCreditor(service: SharedService) {
    return (group: FormGroup): ValidationErrors | null => {
      const excludingGST = group.get('amountExcludingGST');
      const gstAmount = group.get('gstAmount');
      if (excludingGST && gstAmount) {
        const excludingGSTValue =
          typeof excludingGST.value === 'number'
            ? excludingGST.value
            : Number(service.removeCommaInNumber(excludingGST.value));
        const gstAmountValue =
          typeof excludingGST.value === 'number'
            ? gstAmount.value
            : Number(service.removeCommaInNumber(gstAmount.value));
        if (gstAmountValue > excludingGSTValue) {
          return { overGSTAmount: 'GST can not be greater than EXC GST' };
        }
      }
      return null;
    };
  }

  validateGstAmountTenancy(service: SharedService) {
    return (group: FormGroup): ValidationErrors | null => {
      const excludingGST = group.get('amountExcludingGSTsecond');
      const gstAmount = group.get('gstAmountSecond');
      if (excludingGST && gstAmount) {
        const excludingGSTValue = Number(
          service.removeCommaInNumber(excludingGST.value)
        );
        const gstAmountValue = Number(
          service.removeCommaInNumber(gstAmount.value)
        );
        if (gstAmountValue > excludingGSTValue) {
          return { overGSTAmountSecond: 'GST can not be greater than EXC GST' };
        }
      }
      return null;
    };
  }

  toFixedFloat(value: string | number, number = 2) {
    if (!value) return '';
    return typeof value === 'string'
      ? Number(Number(value).toFixed(number))
      : Number(value.toFixed(number));
  }
}
