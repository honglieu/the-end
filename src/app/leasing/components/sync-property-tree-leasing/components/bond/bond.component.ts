import {
  AMOUNT_ERRORS,
  EAmountErrorMessage,
  EAmountErrorType
} from '@/app/leasing/utils/leasing.enum';
import { CURRENCYNUMBER } from '@services/constants';
import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { SyncPropertyTreeLeasingFormService } from '@/app/leasing/services/sync-property-tree-leasing-form.service';
import { SyncPropertyTreeLeasingService } from '@/app/leasing/services/sync-property-tree-leasing.service';

@Component({
  selector: 'bond',
  templateUrl: './bond.component.html',
  styleUrls: ['./bond.component.scss']
})
export class BondComponent implements OnInit {
  @Input() disable: boolean = null;
  public selected = {};
  public maskPattern = CURRENCYNUMBER;
  public amountErrors = AMOUNT_ERRORS.map((error) =>
    error.errorName === EAmountErrorType.InvalidMaximum
      ? { ...error, errorMessage: EAmountErrorMessage.Maximum999999 }
      : error
  );
  public amountLodgedDirectErrors = [
    ...this.amountErrors,
    {
      errorName: EAmountErrorType.InvalidAmountLodgedDirectAmount,
      errorMessage: EAmountErrorMessage.CannotExceedRequired
    }
  ];

  constructor(
    public syncPropertyTreeLeasingService: SyncPropertyTreeLeasingService,
    public syncPropertyTreeLeasingFormService: SyncPropertyTreeLeasingFormService,
    private readonly elr: ElementRef
  ) {}

  get bondForm(): FormGroup {
    return this.syncPropertyTreeLeasingFormService.bondForm;
  }

  get listAccountPT() {
    return this.syncPropertyTreeLeasingService.listAccountPT$.value;
  }

  get accountId(): AbstractControl {
    return this.bondForm.get('accountId');
  }

  get accountName(): AbstractControl {
    return this.bondForm.get('accountName');
  }

  get amount(): AbstractControl {
    return this.bondForm.get('amount');
  }

  get amountLodgedDirect(): AbstractControl {
    return this.bondForm.get('amountLodgedDirect');
  }

  ngOnInit(): void {}

  ngAfterViewChecked() {
    const elementSelected = this.elr.nativeElement.querySelector(
      '.ng-option .item-selected'
    );
    const parentElement = elementSelected?.closest('.ng-option');
    if (parentElement) {
      parentElement.classList.add('ng-selected');
    }
  }

  searchFn(term: string, item: any) {
    term = term.toLowerCase();
    return item.name.toLowerCase().includes(term);
  }

  onChangeState(event) {
    this.accountId.setValue(event?.id || null);
    this.accountName.setValue(event?.name || null);
  }
}
