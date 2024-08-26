import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {
  FormattedRmIssueInvoice,
  IRMIssueInvoice,
  InvoiceDetail
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue-invoice-details.interface';
import {
  IInventoryItemIssue,
  IRentManagerIssueTaxType,
  IRentManagerIssueWorkOrder,
  IRmIssueData
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
@Injectable({
  providedIn: 'root'
})
export class RentManagerIssueInvoiceDetailsFormService {
  public invoiceDetailForm: FormGroup;
  public rmIssueData: IRmIssueData;
  public workOrderData: IRentManagerIssueWorkOrder;
  public inventoryItemMap: Record<string, IInventoryItemIssue>;
  private taxTypeMap: Record<string, IRentManagerIssueTaxType>;
  public submitted: boolean = false;
  static formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    roundingMode: 'halfEven'
  } as unknown);
  constructor(private fb: FormBuilder) {}

  buildForm(data?: IRMIssueInvoice) {
    const { invoiceDetails, isTaxable } = data || {};
    const invoiceDetailGroups = (invoiceDetails || []).map((invoiceDetail) => {
      return this.buildInvoiceDetailGroup({ ...invoiceDetail }, isTaxable);
    });
    this.invoiceDetailForm = this.fb.group({
      id: data?.id || null,
      concurrencyId: data?.source?.concurrencyId || null,
      externalId: data?.source?.externalId || null,
      isTaxable: this.fb.control(!!data?.isTaxable, {
        validators: this.toggleTaxField
      }),
      termId: data?.termId,
      balanceDue: data?.balanceDue || 0,
      subTotal: data?.subTotal || 0,
      totalAmount: data?.totalAmount || 0,
      chargeAmountPaid: data?.chargeAmountPaid || 0,
      markupTotal: data?.markupTotal,
      tax: data?.tax || 0,
      comment: data?.comment || null,
      invoiceDate: [data?.invoiceDate, Validators.required],
      dueDate: [data?.dueDate, Validators.required],
      jobId: data?.jobId,
      invoiceDetails: this.fb.array(invoiceDetailGroups, {
        validators: [
          this.calculateTaxAmount,
          this.calculateTax,
          this.calculateSubTotal
        ]
      }),
      accountType: [data.accountType, Validators.required],
      accountId: [data?.accountId || null, Validators.required],
      taxTypeId: this.fb.control({
        value: data?.taxTypeId || null,
        disabled: !data?.isTaxable
      }),
      taxPercent: this.fb.control(
        {
          value: data?.taxPercent || null,
          disabled: !data?.isTaxable
        },
        {
          validators: [this.calculateTaxAmount, this.calculateTax]
        }
      ),
      taxableAmount: this.fb.control(
        { value: 0, disabled: true },
        {
          validators: this.calculateTax
        }
      ),
      workOrderId: data?.workOrderId
    });
    return this.invoiceDetailForm;
  }

  buildInvoiceDetailGroup(data?: Partial<InvoiceDetail>, isTaxable?: boolean) {
    const disabled = !!!isTaxable;
    const group = this.fb.group(
      {
        id: data?.id || null,
        invoiceId: data?.invoiceId || null,
        concurrencyId: data?.source?.concurrencyId || null,
        externalId: data?.source?.externalId || null,
        chargeTypeId: this.fb.control(data?.chargeTypeId || null, {
          validators: Validators.required
        }),
        markup: data?.markup || null,
        inventoryItemId: this.fb.control(data?.inventoryItemId || null, [
          Validators.required
        ]),
        comment: data?.comment || null,
        unitCost: this.fb.control(data?.unitCost || null, {
          validators: [
            this.calculateInvoiceDetailsAmount(),
            Validators.required
          ]
        }),
        quantity: this.fb.control(data?.quantity || null, {
          validators: [
            Validators.required,
            this.calculateInvoiceDetailsAmount()
          ]
        }),
        totalPrice: this.fb.control({
          value: data?.totalPrice || null,
          disabled: true
        }),
        isTaxable: this.fb.control({
          value: data?.isTaxable || false,
          disabled: disabled
        })
      },
      {
        validators: this.calculateInvoiceDetailsAmount()
      }
    );
    return group;
  }

  public getValue(): FormattedRmIssueInvoice {
    const invoiceValue = this.invoiceDetailForm.getRawValue();
    const markupTotal = formatNumber(invoiceValue.markupTotal);
    const subTotal = formatNumber(invoiceValue.subTotal);
    const tax = formatNumber(invoiceValue.tax);
    const totalAmount = formatNumber(markupTotal + subTotal + tax);
    const chargeAmountPaid = formatNumber(invoiceValue.chargeAmountPaid);
    const balanceDue = formatNumber(totalAmount - chargeAmountPaid);
    const value = {
      ...invoiceValue,
      taxPercent: formatNumber(invoiceValue.taxPercent),
      concurrencyId: invoiceValue.concurrencyId,
      externalId: invoiceValue.externalId,
      tax: formatNumber(invoiceValue.tax),
      subTotal: subTotal,
      markupTotal: markupTotal,
      totalAmount: totalAmount,
      balanceDue: balanceDue,
      chargeAmountPaid,
      invoiceDetails: invoiceValue.invoiceDetails.map((detail) => ({
        quantity: formatNumber(detail.quantity),
        totalPrice: formatNumber(detail.totalPrice),
        markup: formatNumber(detail.markup),
        unitCost: formatNumber(detail.unitCost),
        isTaxable: detail.isTaxable,
        id: detail.id,
        inventoryItemId: detail.inventoryItemId,
        chargeTypeId: detail.chargeTypeId,
        comment: detail.comment || null
      }))
    };
    delete value.taxableAmount;
    return value as FormattedRmIssueInvoice;
  }

  private calculateInvoiceDetailsAmount(): ValidatorFn {
    return (formGroup: AbstractControl) => {
      const parent = formGroup?.parent;
      const inventoryItemId = parent?.get('inventoryItemId')?.value;
      const unitCost = parent?.get('unitCost')?.value;
      const quantity = parent?.controls['quantity']?.value;
      const markup = parent?.controls['markup']?.value;
      let amount = null;
      if (inventoryItemId && quantity) {
        if (markup) {
          const markupTotal = formatNumber(markup) * formatNumber(quantity);
          amount =
            formatNumber(quantity) * formatNumber(unitCost) +
            formatNumber(markupTotal);
        } else {
          amount = formatNumber(quantity) * formatNumber(unitCost);
        }
      }
      formGroup?.parent?.get('totalPrice')?.setValue(amount);
      return null;
    };
  }

  public prefillTaxData(control: AbstractControl) {
    const taxTypeMap = this.taxTypeMap;
    const taxTypeId = control.value;
    const parent = control?.parent;
    if (taxTypeId)
      parent?.get('taxPercent')?.setValue(taxTypeMap[taxTypeId]?.rate);
  }

  private toggleTaxField(isTaxable: AbstractControl): ValidatorFn {
    const parent = isTaxable?.parent;
    const taxTypeId = parent?.get('taxTypeId');
    const taxPercent = parent?.get('taxPercent');
    const taxableAmount = parent?.get('taxableAmount');
    const tax = parent?.get('tax');
    const invoiceDetails = parent?.get('invoiceDetails') as FormArray;
    if (isTaxable.value) {
      taxTypeId?.enable();
      taxPercent?.enable();
      taxTypeId?.addValidators(Validators.required);
      taxPercent?.addValidators(Validators.required);
      invoiceDetails?.controls?.forEach((control) => {
        control.get('isTaxable')?.enable();
      });
    } else {
      taxTypeId?.disable();
      taxTypeId?.setValue(null);
      taxPercent?.disable();
      taxPercent?.setValue(null);
      taxableAmount?.disable();
      taxableAmount?.setValue(null);
      taxTypeId?.removeValidators(Validators.required);
      taxPercent?.removeValidators(Validators.required);
      tax?.setValue(0);
      invoiceDetails?.controls?.forEach((control) => {
        control.get('isTaxable')?.setValue(false);
        control.get('isTaxable')?.disable();
      });
    }
    taxTypeId?.updateValueAndValidity();
    taxPercent?.updateValueAndValidity();
    return null;
  }

  private calculateTaxAmount(control: AbstractControl): ValidatorFn {
    const parent = control?.parent;
    const isTaxable = parent?.get('isTaxable')?.value;
    let taxAmount = 0;
    let markupTotal = 0;
    const invoiceDetails = parent?.get('invoiceDetails') as FormArray;
    invoiceDetails?.controls?.forEach((invoiceDetail) => {
      const isTaxable = invoiceDetail.get('isTaxable')?.value;
      const markup = invoiceDetail.get('markup')?.value;
      const quantity = invoiceDetail.get('quantity')?.value;
      const totalPrice = invoiceDetail.get('totalPrice')?.value;
      if (isTaxable) {
        taxAmount += formatNumber(totalPrice);
      }
      markupTotal += formatNumber(markup) * formatNumber(quantity);
    });
    parent?.get('taxableAmount')?.setValue(isTaxable ? taxAmount : 0);
    parent?.get('markupTotal')?.setValue(markupTotal);
    return null;
  }

  private calculateTax(control: AbstractControl): ValidatorFn {
    const parent = control?.parent;
    const taxPercent = parent?.get('taxPercent')?.value || 0;
    const isTaxable = parent?.get('isTaxable')?.value;
    const taxableAmount = parent?.get('taxableAmount')?.value;
    let tax = 0;
    if (isTaxable && taxPercent) {
      tax = parseFloat(
        RentManagerIssueInvoiceDetailsFormService.formatter.format(
          (formatNumber(taxableAmount) / 100) * formatNumber(taxPercent)
        )
      );
    }
    parent?.get('tax')?.setValue(tax);
    return null;
  }

  private calculateSubTotal(invoiceDetails: FormArray): ValidatorFn {
    let subTotal = 0;
    const parent = invoiceDetails.parent;
    const subTotalControl = parent?.get('subTotal');
    invoiceDetails.controls.forEach((control) => {
      const totalPrice = control.get('totalPrice')?.value;
      const markup = control.get('markup')?.value;
      const quantity = control.get('quantity')?.value;
      if (!markup) {
        subTotal += formatNumber(totalPrice);
      } else {
        subTotal +=
          formatNumber(totalPrice) -
          formatNumber(markup) * formatNumber(quantity);
      }
    });
    subTotalControl?.setValue(subTotal);
    return null;
  }

  setPrefillData(rmIssueData: IRmIssueData) {
    this.rmIssueData = rmIssueData;
    this.inventoryItemMap = rmIssueData.inventoryItem.reduce((prev, curr) => {
      prev[curr.id] = { ...curr };
      return prev;
    }, {});

    this.taxTypeMap = rmIssueData.taxTypes.reduce((prev, curr) => {
      prev[curr.id] = { ...curr };
      return prev;
    }, {});
  }

  setWorkOrderData(rmIssueWorkOrderData: IRentManagerIssueWorkOrder) {
    this.workOrderData = rmIssueWorkOrderData;
  }
}

export function formatNumber(value: string | number | null) {
  if (!value) return 0;
  return parseFloat(Number(value?.toString().replace(/,/g, '')).toFixed(2));
}
