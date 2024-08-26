import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  Renderer2,
  ViewChildren
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup
} from '@angular/forms';
import { RentManagerIssueInvoiceDetailsFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/rent-manager-invoice-details-popup/services/rent-manager-issue-invoice-details-form.service';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { Subject, takeUntil } from 'rxjs';
import { CURRENCYNUMBER } from '@services/constants';
import { RentManagerIssueInvoiceDetailsService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/rent-manager-invoice-details-popup/services/rent-manager-issue-invoice-details.service';
import {
  IRentManagerIssueChargeType,
  IRmIssueData,
  ITerm
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { TrudiSingleSelectComponent } from '@trudi-ui';
import { FormattedInvoiceDetail } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue-invoice-details.interface';
@Component({
  selector: 'invoice-details-table',
  templateUrl: './invoice-details-table.component.html',
  styleUrls: ['./invoice-details-table.component.scss']
})
export class InvoiceDetailsTableComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() formGroup: FormGroup;
  public dropdownPosition = {};
  public scrollControl = {};
  public isScrollAdded: boolean = false;
  public appendTo: string;

  private observer: MutationObserver;
  public rmData: IRmIssueData;
  public chargeTypes: IRentManagerIssueChargeType[];
  public terms: ITerm[];
  public destroy$ = new Subject();
  public maskPattern = CURRENCYNUMBER;
  public readonly MAX_12_DIGIT_BEFORE_DECIMAL = '999999999999';
  public readonly MAX_7_DIGIT_BEFORE_DECIMAL = '9999999';
  public isAdding: boolean = false;
  @ViewChildren('productSelect')
  productSelects: QueryList<TrudiSingleSelectComponent> =
    new QueryList<TrudiSingleSelectComponent>();

  constructor(
    private rmIssueInvoiceDetailsFormService: RentManagerIssueInvoiceDetailsFormService,
    private rmIssueService: RentManagerIssueService,
    private rmIssueInvoiceDetailsService: RentManagerIssueInvoiceDetailsService,
    private elementRef: ElementRef<HTMLElement>,
    private renderer2: Renderer2
  ) {}

  ngOnInit(): void {
    this.rmIssueService.rmIssueData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.rmData = rs;
        this.chargeTypes = rs?.chargeTypes;
        this.terms = rs.terms || [];
      });
  }

  ngAfterViewInit() {
    const targetNode = this.elementRef.nativeElement.parentNode;
    const config = { attributes: false, childList: true, subtree: true };
    const callback = (
      mutationList: MutationRecord[],
      observer: MutationObserver
    ) => {
      this.handleScroll();
    };
    this.observer = new MutationObserver(callback);
    this.observer.observe(targetNode, config);
    this.productSelects.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (this.isAdding) {
          this.productSelects.last.handleFocus();
          this.isAdding = false;
        }
      });
  }

  isOpened() {
    document.querySelectorAll('.editable-row').forEach((item, index) => {
      this.dropdownPosition[index] = this.getDropdownDirection(item, index);
    });
  }

  getDropdownDirection(element, index) {
    const elementRect = element.getBoundingClientRect().top;
    const viewportHeight = document
      .querySelector('.trudi-table-body')
      .getBoundingClientRect();
    const parentTop = viewportHeight.top;
    const parentHeight = viewportHeight.height;
    return elementRect < parentTop + parentHeight / 2 ? 'bottom' : 'top';
  }

  handleScroll() {
    const viewportTable = document.getElementById('rm-issue-invoice-table');
    if (!viewportTable) return null;
    const infoHeight = document.getElementById(
      'rm-issue-invoice-info'
    ).clientHeight;
    const modalHeaderHeight = 73;
    const modalFooterHeight = 81;
    const tableHeader = 42;
    const tableFooter = 69;
    const modalBodyGap = 60;
    const spaceLeft =
      window.innerHeight -
      (infoHeight + modalHeaderHeight + modalFooterHeight + modalBodyGap);
    let shouldShowScroll = viewportTable?.clientHeight >= spaceLeft;
    if (shouldShowScroll) {
      this.isScrollAdded = true;
      this.scrollControl = { y: `${spaceLeft - tableHeader - tableFooter}px` };
      this.appendTo = '.ant-table-body';
    } else {
      this.appendTo = '';
      this.isScrollAdded = false;
      this.scrollControl = { y: null };
    }
  }

  addNewTableRow(): void {
    this.isAdding = true;
    const group = this.rmIssueInvoiceDetailsFormService.buildInvoiceDetailGroup(
      null,
      this.isTaxable.value
    );
    this.invoiceDetailsFormArray.push(group);
  }

  duplicateTableRow(control: FormControl) {
    const detail = control.value as FormattedInvoiceDetail;
    const newControl =
      this.rmIssueInvoiceDetailsFormService.buildInvoiceDetailGroup(
        {
          chargeTypeId: detail.chargeTypeId,
          comment: detail.comment,
          inventoryItemId: detail.inventoryItemId,
          isTaxable: detail.isTaxable,
          unitCost: detail.unitCost,
          totalPrice: detail.totalPrice,
          markup: detail.markup,
          quantity: detail.quantity
        },
        this.isTaxable.value
      );
    this.invoiceDetailsFormArray.push(newControl);
  }

  deleteTableRow(index: number) {
    this.invoiceDetailsFormArray.removeAt(index);
  }

  public get invoiceDetailsFormArray() {
    return this.formGroup?.get('invoiceDetails') as FormArray;
  }

  public get isTaxable() {
    return this.formGroup?.get('isTaxable');
  }

  public selectProduct(invoiceDetailRow: AbstractControl) {
    const inventoryItemMap =
      this.rmIssueInvoiceDetailsFormService.inventoryItemMap;
    const parent = invoiceDetailRow;
    const inventoryItem = parent.get('inventoryItemId');
    if (inventoryItem.value) {
      const { cost, description, quantity, chargeTypeId } = inventoryItemMap
        ? inventoryItemMap[inventoryItem.value]
        : { quantity: null, cost: null, description: '', chargeTypeId: null };
      parent?.get('unitCost')?.setValue(cost);
      if (!parent?.get('quantity')?.value)
        parent?.get('quantity')?.setValue(quantity);
      parent?.get('comment')?.setValue(description);
      parent?.get('chargeTypeId')?.setValue(chargeTypeId);
    }
    return null;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.observer.disconnect();
  }
}
