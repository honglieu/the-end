import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  Subject,
  combineLatest,
  filter,
  map,
  switchMap,
  takeUntil
} from 'rxjs';
import { IRMIssueInvoice } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue-invoice-details.interface';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { RentManagerIssueApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-api.service';
import { RentManagerIssueInvoiceDetailsFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/rent-manager-invoice-details-popup/services/rent-manager-issue-invoice-details-form.service';
import { TaskService } from '@services/task.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { SharedService } from '@services/shared.service';
import { CURRENCYNUMBER } from '@services/constants';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  IRentManagerIssueChargeType,
  IRmIssueData,
  ITerm
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { RentManagerIssueInvoiceDetailsService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/rent-manager-invoice-details-popup/services/rent-manager-issue-invoice-details.service';
import {
  ACCOUNT_TYPE_LABEL,
  EAccountType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import dayjs from 'dayjs';

@Component({
  selector: 'invoice-details-info',
  templateUrl: './invoice-details-info.component.html',
  styleUrls: ['./invoice-details-info.component.scss']
})
export class InvoiceDetailsInfoComponent implements OnInit, OnDestroy {
  @Input() formGroup: FormGroup;

  public rmData: IRmIssueData;
  public invoiceTypes = [
    {
      id: EAccountType.OWNER,
      name: 'Owner'
    },

    {
      id: EAccountType.TENANT,
      name: 'Tenant'
    },
    {
      id: EAccountType.PROSPECT,
      name: 'Tenant prospect'
    }
  ];
  public destroy$ = new Subject();
  public invoiceDetails: IRMIssueInvoice;
  public listUser = [];
  public terms: ITerm[] = [];
  public maskPattern = CURRENCYNUMBER;
  public readonly MAX_8_DIGIT_BEFORE_DECIMAL = '99999999';
  public ACCOUNT_TYPE_LABEL = ACCOUNT_TYPE_LABEL;
  public chargeTypes: IRentManagerIssueChargeType[] = [];

  constructor(
    private rmIssueInvoiceDetailsService: RentManagerIssueInvoiceDetailsService,
    private rmIssueService: RentManagerIssueService,
    private rmIssueApiService: RentManagerIssueApiService,
    private sharedService: SharedService,
    private rmIssueInvoiceDetailsFormService: RentManagerIssueInvoiceDetailsFormService,
    private taskService: TaskService,
    private agencyService: AgencyService
  ) {}

  ngOnInit(): void {
    this.rmIssueService.rmIssueData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.rmData = rs;
        this.chargeTypes = rs?.chargeTypes;
        this.terms = rs.terms || [];
      });

    this.rmIssueInvoiceDetailsService.userPayload$
      .pipe(takeUntil(this.destroy$))
      .pipe(
        filter((payload) => !!payload),
        switchMap((rs) => {
          return this.rmIssueApiService.getListUserApi(rs).pipe(
            map((users: ISelectedReceivers[]) =>
              users.map((user) => ({
                ...user,
                fullName: this.sharedService.displayName(
                  user.firstName,
                  user.lastName
                )
              }))
            )
          );
        })
      )
      .subscribe((rs) => {
        this.listUser = rs;
      });

    combineLatest([
      this.taskService.currentTask$,
      this.rmIssueInvoiceDetailsService.currentInvoiceDetails$
    ])
      .pipe(takeUntil(this.destroy$))
      .pipe(
        filter(([task, invoiceDetails]) => {
          return !!task && !!invoiceDetails;
        })
      )
      .subscribe(([task, invoiceDetails]) => {
        this.rmIssueInvoiceDetailsService.setGetListUserPayload({
          propertyId: task.property?.id,
          userType: this.rmIssueInvoiceDetailsService.getUserPayloadType(
            invoiceDetails.accountType
          ),
          search: ''
        });
      });

    this.invoiceDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && this.getTermControl.value) {
          this.handleDueDate(res, this.getTermControl.value);
        }
      });

    this.dueDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.getTermControl.setValue(null, { emitEvent: false });
      });

    this.getTermControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.handleDueDate(this.invoiceDateControl.value, res);
      });
  }

  handleAccountTypeChange(accountType: EAccountType) {
    this.rmIssueInvoiceDetailsService.setGetListUserPayload({
      userType:
        this.rmIssueInvoiceDetailsService.getUserPayloadType(accountType)
    });
    this.accountIdControl.setValue(null, { emitEvent: false });
    this.accountIdControl.markAsUntouched();
  }

  handleDueDate(billDate, termId: string) {
    const selectedTerm = this.terms.find((it) => it.id === termId);
    if (selectedTerm && selectedTerm.netDays) {
      const addNetDays = dayjs(billDate)
        .add(selectedTerm.netDays, 'd')
        .utc()
        .toString();
      this.dueDateControl.setValue(new Date(addNetDays), { emitEvent: false });
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
      this.dueDateControl.setValue(new Date(addNetMonth), { emitEvent: false });
    } else if (selectedTerm && selectedTerm.monthDay) {
      const addMonthDay = dayjs(billDate)
        .add(1, 'M')
        .date(selectedTerm.monthDay)
        .utc()
        .toString();
      this.dueDateControl.setValue(new Date(addMonthDay), { emitEvent: false });
    } else {
      this.dueDateControl.setValue(billDate, { emitEvent: false });
    }
  }

  public get getTermControl() {
    return this.formGroup?.get('termId');
  }

  public get totalAmount() {
    return this.formGroup?.get('totalAmount')?.value;
  }

  public get chargeAmount() {
    return this.formGroup?.get('chargeAmount')?.value;
  }

  public get chargeAmountPaid() {
    return this.formGroup?.get('chargeAmountPaid')?.value;
  }

  public get balanceDue() {
    return this.formGroup?.get('balanceDue')?.value;
  }

  public get tax() {
    return this.formGroup?.get('tax')?.value;
  }

  public get accountIdControl() {
    return this.formGroup?.get('accountId');
  }

  public get accountTypeControl() {
    return this.formGroup?.get('accountType');
  }

  public get subTotal() {
    return this.formGroup?.get('subTotal')?.value;
  }

  public get dueDateControl() {
    return this.formGroup?.get('dueDate');
  }

  public get invoiceDateControl() {
    return this.formGroup?.get('invoiceDate');
  }

  public get markupTotal() {
    return this.formGroup?.get('markupTotal').value;
  }

  public get submitted() {
    return this.rmIssueInvoiceDetailsFormService.submitted;
  }

  public get taxTypeId() {
    return this.formGroup?.get('taxTypeId');
  }

  public changeTaxType() {
    this.rmIssueInvoiceDetailsFormService.prefillTaxData(this.taxTypeId);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
