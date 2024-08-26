import { Injectable } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
  FormControl,
  Validators
} from '@angular/forms';
import {
  IBillDetailData,
  IRMIssueBillData
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue-bill-details.interface';
import { EUserType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import dayjs from 'dayjs';

@Injectable()
export class BillDetailPopupFormService {
  constructor(private fb: FormBuilder) {}

  public isSubmittedBill = false;
  private billForm: FormGroup;
  public trudiTableDataSource = [];
  public get getBillForm() {
    return this.billForm;
  }

  public get billDetailForm() {
    return this.billForm?.get('billDetail') as FormGroup;
  }

  public get billTableForm() {
    return this.billForm?.get('billTable') as FormArray;
  }

  billableToValidateRequire() {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control) return null;
      const value = control.value;
      const otherControl = control.parent?.get('billable');
      if (otherControl && otherControl.value && !value) {
        return { required: true };
      }
      return null;
    };
  }

  calculateTotalAmount() {
    let amountTotal = this.billTableForm.controls.reduce((cur, prev) => {
      let convertedNumber = parseFloat(
        prev.get('amount')?.value?.toString()?.replace(/,/g, '') || 0
      );
      return cur + convertedNumber;
    }, 0);
    amountTotal = Math.round(amountTotal * 100) / 100;

    this.billDetailForm?.get('amount').setValue(amountTotal, {
      emitEvent: false
    });
  }

  buildBillForm(prefill?: IRMIssueBillData) {
    const {
      billDate,
      dueDate,
      postDate,
      accountType,
      accountId,
      comment,
      amount,
      invoice,
      serviceManagerTerm,
      termId,
      user,
      billDetails
    } = prefill || {};

    this.billForm = this.fb.group({
      billDetail: new FormGroup({
        concurrencyId: new FormControl(prefill?.source?.concurrencyId),
        accountType: new FormControl(
          accountType || EUserType.VENDOR,
          Validators.required
        ),
        account: new FormControl(
          user?.id || accountId || null,
          Validators.required
        ),
        amount: new FormControl(
          { value: amount || 0, disabled: true },
          Validators.required
        ),
        term: new FormControl(termId || serviceManagerTerm?.id || null),
        billDate: new FormControl(billDate || null, Validators.required),
        invoice: new FormControl(invoice || null),
        postDate: new FormControl(postDate || null, Validators.required),
        dueDate: new FormControl(dueDate || null, Validators.required),
        memo: new FormControl(comment || null)
      }),
      billTable: new FormArray([])
    });

    billDetails
      ?.sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)))
      .forEach((data) => {
        this.addTableForm(null, data);
      });
  }

  addTableForm(control?: FormGroup, prefill?: IBillDetailData) {
    let id = null,
      concurrencyId,
      externalId,
      expenseAccount,
      is1099,
      job,
      memo,
      billable,
      billableTo,
      markup,
      amount,
      accountType;

    if (control) {
      expenseAccount = control.get('expenseAccount')?.value;
      is1099 = control.get('is1099')?.value;
      job = control.get('job')?.value;
      memo = control.get('memo')?.value;
      billable = control.get('billable')?.value;
      billableTo = control.get('billableTo')?.value;
      markup = control.get('markup')?.value;
      amount = control.get('amount')?.value;
      accountType = control.get('accountType')?.value;
    }
    if (prefill) {
      concurrencyId = prefill.source?.concurrencyId;
      externalId = prefill.source?.externalId;
      id = prefill.id;
      expenseAccount =
        prefill.glAccountId || prefill.serviceManagerGLAccount.id;
      is1099 = prefill.is1099;
      job = prefill.jobId || prefill.serviceManagerJob.id;
      memo = prefill.comment;
      billable = prefill.isBillable;
      billableTo = prefill.user?.id || prefill.accountId;
      markup = prefill.markup;
      amount = prefill.amount;
      accountType = prefill.accountType;
    }
    const tableForm = this.fb.group({
      concurrencyId,
      externalId: new FormControl(externalId),
      billDetailId: new FormControl(id),
      expenseAccount: new FormControl(
        expenseAccount || null,
        Validators.required
      ),
      is1099: new FormControl(is1099 || false),
      job: new FormControl(job || null),
      memo: new FormControl(memo || null),
      billable: new FormControl(billable || false),
      billableTo: new FormControl(billableTo || null, [
        this.billableToValidateRequire()
      ]),
      markup: new FormControl(markup || null),
      amount: new FormControl(amount || null, Validators.required),
      accountType: new FormControl(accountType || EUserType.TENANT)
    });

    if (billable) {
      tableForm.get('markup')?.enable();
      tableForm.get('billableTo')?.enable();
    } else {
      tableForm.get('markup')?.disable();
      tableForm.get('billableTo')?.disable();
    }

    this.billTableForm.push(tableForm);
  }
}
