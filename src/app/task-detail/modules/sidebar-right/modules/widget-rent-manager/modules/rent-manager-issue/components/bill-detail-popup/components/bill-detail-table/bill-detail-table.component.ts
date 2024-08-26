import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  EUserPayloadType,
  EUserType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { FormGroup } from '@angular/forms';
import { BillDetailPopupFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/bill-detail-popup/services/bill-detail-popup-form.service';
import { BillDetailPopupService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/bill-detail-popup/services/bill-detail-popup.service';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { RentManagerIssueBillDetailsService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-bill-details.service';
import { TaskService } from '@services/task.service';
import { CURRENCYNUMBER } from '@services/constants';

@Component({
  selector: 'bill-detail-table',
  templateUrl: './bill-detail-table.component.html',
  styleUrls: ['./bill-detail-table.component.scss']
})
export class BillDetailTableComponent implements OnInit, OnDestroy {
  public agencyId = '';
  public propertyId = '';
  public jobs = [];
  public destroy$ = new Subject<void>();
  public EUserType = EUserType;
  public dropdownPosition = {};
  public listUser: ISelectedReceivers[] = [];
  public maskPattern = CURRENCYNUMBER;

  public expenseAccounts = [];
  public appendTo = '';
  public positionBillableDropdown = 0;
  public trudiTableColumns = [
    { label: 'Expense account', key: 'expense_account', width: '15%' },
    { label: '1099', key: '1099', width: '8%' },
    { label: 'Job', key: 'job', width: '15%' },
    { label: 'Memo', key: 'memo', width: '15%' },
    { label: 'Billable', key: 'billable', width: '8%' },
    { label: 'Billable to', key: 'billable_to', width: '250px' },
    { label: 'Markup', key: 'markup', width: '10%' },
    { label: 'Amount', key: 'amount', width: '10%' },
    { label: '', key: 'option', width: '4%' }
  ];

  constructor(
    private billDetailPopupFormService: BillDetailPopupFormService,
    private billDetailService: BillDetailPopupService,
    private rentManagerIssueService: RentManagerIssueService,
    private renManagerIssueBillService: RentManagerIssueBillDetailsService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef
  ) {}

  get isSubmittedBill() {
    return this.billDetailPopupFormService.isSubmittedBill;
  }

  get billTableForm() {
    return this.billDetailPopupFormService.billTableForm;
  }

  ngOnInit(): void {
    this.renManagerIssueBillService.currentBillDetails$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.getListData();
      });
  }

  getListData() {
    this.taskService.currentTask$
      .asObservable()
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        switchMap((currentTask) => {
          if (!currentTask) return of();
          this.propertyId = currentTask?.property?.id;
          this.agencyId = currentTask?.property?.agencyId;

          this.billDetailService.fetchListUser({
            propertyId: this.propertyId,
            search: '',
            email_null: true,
            userDetails: [],
            userType: [
              EUserPayloadType.TENANT_PROPERTY,
              EUserPayloadType.TENANT_PROSPECT,
              EUserPayloadType.TENANT_UNIT,
              EUserPayloadType.LANDLORD
            ]
          });
          return combineLatest([
            this.billDetailService.getListUser(),
            this.rentManagerIssueService.rmIssueData$
          ]).pipe(takeUntil(this.destroy$));
        })
      )
      .subscribe(([listUser, listIssueData]) => {
        if (listUser) {
          this.listUser = (listUser as ISelectedReceivers[]).map(
            this.getBindLabel
          );
        }
        if (listIssueData) {
          this.jobs = listIssueData.job;
          this.expenseAccounts = listIssueData.glAccount;
        }
      });
  }

  getBindLabel(data: ISelectedReceivers, _, res: ISelectedReceivers[]) {
    return {
      ...data,
      bindLabel: data?.firstName + '' + data?.lastName || data?.email || ''
    };
  }

  isOpened() {
    document.querySelectorAll('.bill-detail-item').forEach((item, index) => {
      this.dropdownPosition[index] = this.getDropdownDirection(item, index);
    });
    this.cdr.markForCheck();
  }

  getDropdownDirection(element, index) {
    const elementRect = element.getBoundingClientRect().top;
    const viewportHeight = document
      .querySelector('.bill-table-body')
      .getBoundingClientRect();
    const parentTop = viewportHeight.top;
    const parentHeight = viewportHeight.height;
    return elementRect < parentTop + parentHeight / 2 ? 'bottom' : 'top';
  }

  handleChangeAmount() {
    this.billDetailPopupFormService.calculateTotalAmount();
  }

  addTableRow(form?: FormGroup) {
    this.billDetailPopupFormService.addTableForm(form);
  }
  deleteTableRow(index) {
    this.billTableForm.removeAt(index);
    this.billDetailPopupFormService.calculateTotalAmount();
  }
  handleChangeBillable(formGroup: FormGroup) {
    if (formGroup.get('billable')?.value === false) {
      formGroup.get('billableTo')?.disable();
      formGroup.get('markup')?.disable();
    } else {
      formGroup.get('billableTo')?.enable();
      formGroup.get('markup')?.enable();
    }
    formGroup.get('billableTo')?.reset();
    formGroup.get('markup')?.reset();
    formGroup.get('billableTo').updateValueAndValidity();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
