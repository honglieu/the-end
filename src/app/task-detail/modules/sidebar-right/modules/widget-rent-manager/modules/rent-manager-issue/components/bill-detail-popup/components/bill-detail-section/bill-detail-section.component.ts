import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  EUserPayloadType,
  EUserType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { BillDetailPopupFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/bill-detail-popup/services/bill-detail-popup-form.service';
import { BillDetailPopupService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/bill-detail-popup/services/bill-detail-popup.service';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  switchMap,
  takeUntil
} from 'rxjs';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { RentManagerIssueBillDetailsService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-bill-details.service';
import { TaskService } from '@services/task.service';
import { ISupplierBasicInfo } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { CURRENCYNUMBER } from '@services/constants';
import dayjs from 'dayjs';

@Component({
  selector: 'bill-detail-section',
  templateUrl: './bill-detail-section.component.html',
  styleUrls: ['./bill-detail-section.component.scss'],
  providers: [BillDetailPopupService]
})
export class BillDetailSectionComponent implements OnInit, OnDestroy {
  public propertyId = '';
  public agencyId = '';
  public listVendor = [];
  public listUser = [];
  public EUserType = EUserType;
  private destroy$ = new Subject<void>();
  public jobs = [];

  public accountData = [];
  public accountTypes = [
    {
      label: 'Vendor',
      value: EUserType.VENDOR
    },
    {
      label: 'Owner',
      value: EUserType.OWNER
    }
  ];
  public accounts = [];
  public terms = [];
  public maskPattern = CURRENCYNUMBER;

  constructor(
    private billDetailFormService: BillDetailPopupFormService,
    private billDetailService: BillDetailPopupService,
    private rentManagerIssueService: RentManagerIssueService,
    private renManagerIssueBillService: RentManagerIssueBillDetailsService,
    private taskService: TaskService
  ) {}

  get isSubmittedBill() {
    return this.billDetailFormService.isSubmittedBill;
  }

  get billForm() {
    return this.billDetailFormService.getBillForm;
  }

  get detailForm() {
    return this.billDetailFormService.billDetailForm;
  }

  get term() {
    return this.detailForm.get('term');
  }

  get invoice() {
    return this.detailForm?.get('invoice');
  }

  get accountType() {
    return this.detailForm?.get('accountType');
  }

  get account() {
    return this.detailForm?.get('account');
  }

  get billDate() {
    return this.detailForm?.get('billDate');
  }

  get postDate() {
    return this.detailForm?.get('postDate');
  }

  get dueDate() {
    return this.detailForm?.get('dueDate');
  }

  ngOnInit(): void {
    this.renManagerIssueBillService.currentBillDetails$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;

        this.getListData();
      });

    this.billDate.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && this.term.value) {
          this.handleDueDate(res, this.term.value);
        }
      });

    this.dueDate.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.term.setValue(null, { emitEvent: false });
      });

    this.term.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (!res) return;
      this.handleDueDate(this.billDate.value, res);
    });
  }

  fetchList(accountType: EUserType) {
    if (accountType === EUserType.VENDOR) {
      this.billDetailService.fetchListVendor({
        search: '',
        email_null: true,
        userIds: [],
        onlySyncData: true
      });
    } else {
      this.billDetailService.fetchListUser({
        propertyId: this.propertyId,
        email_null: true,
        userDetails: [],
        userType: [EUserPayloadType.LANDLORD]
      });
    }
  }

  customSearchFn(term: string, item) {
    const valueSearch = item.firstName?.trim() + ' ' + item.lastName?.trim();
    const searchByName =
      valueSearch.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    return searchByName;
  }

  getListData() {
    this.taskService.currentTask$
      .asObservable()
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        switchMap((currentTask) => {
          this.propertyId = currentTask?.property?.id;
          this.agencyId = currentTask?.property?.agencyId;
          this.billDetailService.fetchListVendor({
            search: '',
            email_null: true,
            userIds: [],
            onlySyncData: true
          });
          this.billDetailService.fetchListUser({
            propertyId: this.propertyId,
            email_null: true,
            userDetails: [],
            userType: [EUserPayloadType.LANDLORD]
          });
          return combineLatest([
            this.billDetailService.getListVendor(),
            this.billDetailService.getListUser(),
            this.rentManagerIssueService.rmIssueData$
          ]);
        })
      )
      .subscribe(([supplier, listUser, issueData]) => {
        if (supplier && this.accountType.value === EUserType.VENDOR) {
          this.accounts = supplier as ISupplierBasicInfo[];
        } else if (listUser && this.accountType.value === EUserType.OWNER) {
          this.accounts = listUser as ISelectedReceivers[];
        }
        this.accounts = this.accounts.map(this.getBindLabel);
        if (issueData) {
          this.terms = issueData.terms;
        }
        if (!this.accounts.find((ac) => ac.id === this.account?.value)) {
          this.account.setValue(null, { emitEvent: false });
        }
      });
  }

  getBindLabel(data: ISelectedReceivers, _, res: ISelectedReceivers[]) {
    return {
      ...data,
      bindLabel: data?.firstName || '' + data?.lastName || ''
    };
  }

  compareWith(receiverA: ISelectedReceivers, receiverB: ISelectedReceivers) {
    return (
      receiverA.id === receiverB.id &&
      receiverA.propertyId == receiverB.propertyId
    );
  }

  handleChangeAccountType() {
    this.account?.reset();
    this.fetchList(this.accountType?.value);
  }

  handleDueDate(billDate, termId: string) {
    const selectedTerm = this.terms.find((it) => it.id === termId);
    if (selectedTerm && selectedTerm.netDays) {
      const addNetDays = dayjs(billDate)
        .add(selectedTerm.netDays, 'd')
        .utc()
        .toString();
      this.dueDate.setValue(new Date(addNetDays), { emitEvent: false });
    } else if (selectedTerm && selectedTerm.netMonths) {
      let addNetMonth;
      const currentDate = dayjs(billDate).date();
      const nextDaysInMonthCount = dayjs(billDate)
        .add(selectedTerm.netMonths, 'M')
        .daysInMonth();
      if (currentDate > nextDaysInMonthCount) {
        const daysCount = selectedTerm.netMonths * 31;
        addNetMonth = dayjs(billDate).add(daysCount, 'd').toString();
      } else {
        const currentDate = dayjs(billDate).date();
        addNetMonth = dayjs(billDate)
          .add(selectedTerm.netMonths, 'M')
          .date(currentDate)
          .toString();
      }
      this.dueDate.setValue(new Date(addNetMonth), { emitEvent: false });
    } else if (selectedTerm && selectedTerm.monthDay) {
      const addMonthDay = dayjs(billDate)
        .add(1, 'M')
        .date(selectedTerm.monthDay)
        .utc()
        .toString();
      this.dueDate.setValue(new Date(addMonthDay), { emitEvent: false });
    } else {
      this.dueDate.setValue(billDate, { emitEvent: false });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
