import { debounceTime } from 'rxjs/operators';
import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  OnDestroy,
  OnChanges,
  Input,
  ViewChildren,
  QueryList,
  AfterViewInit
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, Subscription } from 'rxjs';
import { SCROLL_THRESHOLD } from '@/app/dashboard/utils/constants';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { TrudiSingleSelectComponent } from '@trudi-ui';
import { IJobDetail } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/purchase-order.interface';
import {
  IRentManagerIssueSyncStatus,
  IRmIssueJob
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { PurchaseOrderService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/purchase-order-popup/services/purchase-order.service';
import { CURRENCYNUMBER } from '@services/constants';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';

enum EOptions {
  DUPLICATE,
  DELETE
}

@Component({
  selector: 'purchase-order-bill-list',
  templateUrl: './purchase-order-bill-list.component.html',
  styleUrls: ['./purchase-order-bill-list.component.scss']
})
export class PurchaseOrderBillListComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  @ViewChild('jobSelect') jobSelect: TrudiSingleSelectComponent;
  @ViewChildren('jobSelect')
  jobSelectChildren: QueryList<TrudiSingleSelectComponent>;
  @Input() billDataList: IJobDetail[];
  @Output() clickDuplicate = new EventEmitter();
  @Output() clickDelete = new EventEmitter();
  @Output() reCalculateBill = new EventEmitter();
  private destroy$ = new Subject<void>();
  private timeoutId: NodeJS.Timeout;
  private isClickAdd = false;
  private subscription: Subscription;

  public form: FormGroup;
  public isShowDropdown: boolean = false;
  public readonly EOPTIONS = EOptions;
  public optionsList = [
    {
      text: 'Duplicate',
      type: EOptions.DUPLICATE,
      disabled: false
    },
    {
      text: 'Delete',
      type: EOptions.DELETE,
      disabled: false
    }
  ];
  public jobList: IRmIssueJob[] = [];
  public inventoryList = [];
  public currentIndex: number;
  public dropdownPosition = {};
  public maskPattern = CURRENCYNUMBER;
  private issueSyncStatus: IRentManagerIssueSyncStatus;

  constructor(
    private fb: FormBuilder,
    private rentManagerIssueService: RentManagerIssueService,
    private purchaseOrderService: PurchaseOrderService,
    private rentManagerIssueFormService: RentManagerIssueFormService
  ) {}

  ngOnInit(): void {
    this.rentManagerIssueFormService.syncStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.issueSyncStatus = rs;
      });

    this.rentManagerIssueService.rmIssueData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.jobList = res.job;
          this.inventoryList = res.inventoryItem;
        }
      });
  }

  ngAfterViewInit() {
    this.jobSelectChildren.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && this.isClickAdd) {
          res.last.handleFocus();
        }
      });
  }

  ngOnChanges(): void {
    const bills = (this.billDataList || []).map((value) => {
      return this.fb.group({
        id: [value?.id ?? null],
        externalId: [value?.externalId ?? null],
        job: [value?.jobId],
        item: [value?.inventoryItemId, Validators.required],
        quantity: [value?.quantity, [Validators.required]],
        cost: [value?.cost, [Validators.required]],
        memo: [value?.comment],
        total: [value?.total]
      });
    });

    this.form = this.buildForm(bills);
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.updateDropdownDirection();
    this.subscription = this.form.valueChanges
      .pipe(debounceTime(SCROLL_THRESHOLD))
      .subscribe((res) => {
        this.purchaseOrderService.setChangedPurchaseOrderData({
          billing: [
            ...res?.bills?.map((it) => {
              const bill = it;
              delete bill.externalId;
              return {
                ...bill,
                cost: parseFloat(it?.cost),
                quantity: Number(it?.quantity),
                comment: bill?.memo,
                inventoryItemId: bill?.item,
                jobId: bill?.job
              };
            })
          ],
          detail: {
            ...this.purchaseOrderService.changedPurchaseOrderData.detail
          }
        });
        if (this.purchaseOrderService.isChanged()) {
          const syncStatus =
            this.issueSyncStatus.syncStatus === ESyncStatus.NOT_SYNC
              ? ESyncStatus.NOT_SYNC
              : ESyncStatus.UN_SYNC;
          this.purchaseOrderService.setSyncStatus({
            syncStatus: syncStatus,
            lastTimeSynced: new Date()
          });
        }
        this.reCalculateBill.emit();
      });
  }

  handleClick(index) {
    this.currentIndex = index;
  }

  private buildForm(billsValue?) {
    return this.fb.group({
      bills: this.fb.array(billsValue ?? [])
    });
  }

  public addBill(form?: FormGroup) {
    this.isClickAdd = true;
    let jobValue,
      itemValue,
      quantityValue,
      costValue,
      memoValue,
      totalValue = null;
    if (form) {
      jobValue = form.get('job').value;
      itemValue = form.get('item').value;
      quantityValue = form.get('quantity').value;
      costValue = form.get('cost').value;
      memoValue = form.get('memo').value;
      totalValue = form.get('total').value;
    }
    const bill = this.fb.group({
      job: [jobValue],
      item: [itemValue, Validators.required],
      quantity: [quantityValue, [Validators.required]],
      cost: [costValue, [Validators.required]],
      memo: [memoValue],
      total: [totalValue]
    });
    this.bills.push(bill);
    this.updateDropdownDirection();
  }

  private removeBill(index: number) {
    this.bills.removeAt(index);
  }

  private formatNumber(inputNumber) {
    return inputNumber.toFixed(2);
  }

  onInventoryItemChange(value, i: number) {
    this.getCost(i).setValue(value.cost ? this.formatNumber(value.cost) : null);
    this.getMemo(i).setValue(value.description ?? '');
    this.getQuantity(i).setValue(this.formatNumber(1));
  }

  public handleOption(type: EOptions) {
    switch (type) {
      case EOptions.DELETE:
        this.clickDelete.emit();
        this.removeBill(this.currentIndex);
        break;
      case EOptions.DUPLICATE:
        this.addBill(this.bills.at(this.currentIndex) as FormGroup);
        this.clickDuplicate.emit();
        break;
      default:
        break;
    }
  }

  public updateDropdownDirection() {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      document.querySelectorAll('.bill-item').forEach((item, index) => {
        this.dropdownPosition[index] = this.getDropdownDirection(item);
      });
    }, 100);
  }

  public getDropdownDirection(element) {
    const elementRect = element.getBoundingClientRect().top;
    const viewportHeight = document
      .querySelector('.bill-wrapper')
      .getBoundingClientRect();
    const parentTop = viewportHeight.top;
    const parentHeight = viewportHeight.height;
    return elementRect < parentTop + parentHeight / 2 ? 'bottom' : 'top';
  }

  get isLoadingPurchaseOrder() {
    return this.purchaseOrderService.isLoadingPurchase;
  }
  get bills() {
    return this.form?.controls?.['bills'] as FormArray;
  }

  get isSubmittedPurchaseOrderForm() {
    return this.purchaseOrderService.isSubmittedPurchaseOrderForm;
  }

  getCost(index: number) {
    return (this.bills.at(index) as FormGroup)?.get('cost');
  }

  getQuantity(index: number) {
    return (this.bills.at(index) as FormGroup)?.get('quantity');
  }

  getMemo(index: number) {
    return (this.bills.at(index) as FormGroup)?.get('memo');
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeoutId);
    this.isClickAdd = false;
    this.destroy$.next();
    this.destroy$.complete();
  }
}
