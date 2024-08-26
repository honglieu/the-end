import {
  Component,
  Input,
  Output,
  OnChanges,
  OnInit,
  SimpleChanges,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import {
  IBillingInvoice,
  ISummaryData
} from '@/app/dashboard/modules/agency-settings/utils/billing.interface';
import { billingAmountFormat } from '@/app/dashboard/modules/agency-settings/utils/functions';
import dayjs from 'dayjs';
import { ECountry, ETaxType } from '@shared/enum/region.enum';
import { ToastrService } from 'ngx-toastr';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

export enum EInvoiceHistoryStatus {
  PAID = 'paid',
  OPEN = 'open',
  DRAFT = 'draft',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible'
}

@Component({
  selector: 'invoice-history',
  templateUrl: './invoice-history.component.html',
  styleUrls: ['./invoice-history.component.scss']
})
export class InvoiceHistoryComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('historyItem') historyItemRef: ElementRef<HTMLDivElement>;
  @Input() invoiceHistoryData: IBillingInvoice;
  @Input() previousInvoice: IBillingInvoice;
  @Input() isFirstMonth: boolean;
  @Output() toggleDropdown = new EventEmitter();
  private destroy$ = new Subject<void>();
  public currentInvoiceHistoryTitle: string = '';
  public currentInvoiceHistory: ISummaryData[];
  public nextMonthInvoiceHistory: ISummaryData[];
  public dataSetupFee: ISummaryData[];
  public invoicePropertyCount = {
    lastMonth: 0,
    currentMonth: 0
  };
  public dateFormatPipe: string;
  public readonly STATUS_OF_INVOICE = {
    [EInvoiceHistoryStatus.OPEN]: 'warning',
    [EInvoiceHistoryStatus.PAID]: 'success',
    [EInvoiceHistoryStatus.VOID]: 'role',
    [EInvoiceHistoryStatus.DRAFT]: 'role',
    [EInvoiceHistoryStatus.UNCOLLECTIBLE]: 'role'
  };
  public readonly EInvoiceHistoryStatus = EInvoiceHistoryStatus;
  public readonly COUNTRY = ECountry;
  public readonly TAX_TYPE = ETaxType;
  public rowLimit = 6;
  constructor(
    private toastService: ToastrService,
    private agencyDateFormatService: AgencyDateFormatService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.agencyDateFormatService.dateFormatPipe$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs) {
          this.dateFormatPipe = rs;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['invoiceHistoryData']?.currentValue) {
      const { summaryData } = this.invoiceHistoryData || {};
      const utcOffsetInMinutes = new Date().getTimezoneOffset();
      const mapSummaryData = summaryData?.map((it) => ({
        ...it,
        amount: billingAmountFormat(it?.amount),
        coupon:
          it?.coupon?.map((e) => ({
            ...e,
            value: billingAmountFormat(e?.value || 0)
          })) || [],
        period: {
          start: dayjs.unix(it?.period?.start as number).toString(),
          end: dayjs.unix(it?.period?.end as number).toString()
        }
      })) as ISummaryData[];
      this.currentInvoiceHistory = mapSummaryData?.filter(
        (value) => !value?.dataOnNextMonth && !value?.oneTime
      );
      this.nextMonthInvoiceHistory = mapSummaryData?.filter(
        (value) => value?.dataOnNextMonth
      );
      this.dataSetupFee = mapSummaryData?.filter((value) => !!value?.oneTime);
      this.invoicePropertyCount = {
        ...this.invoicePropertyCount,
        currentMonth: this.nextMonthInvoiceHistory?.[0]?.quantity || 0
      };
    }

    if (changes['previousInvoice']?.currentValue) {
      const { summaryData } = this.previousInvoice || {};
      this.invoicePropertyCount = {
        ...this.invoicePropertyCount,
        lastMonth:
          summaryData?.find((it) => !!it.dataOnNextMonth)?.quantity || 0
      };

      if (this.invoiceHistoryData.isNextMonthAfterTrail) {
        const { trial_end, trial_start } = this.invoiceHistoryData?.trial || {};
        const trialEnd = trial_end ? dayjs.unix(+trial_end) : '';
        const trialStart = trial_end ? dayjs.unix(+trial_start) : '';
        const daysLeft = trialEnd ? trialEnd.diff(trialStart, 'day') : 0;
        const daysLeftText = daysLeft > 1 ? 'days' : 'day';
        const formatTrialEnd =
          this.agencyDateFormatService.formatTimezoneDate(
            trialEnd.toString(),
            this.agencyDateFormatService.dateFormat$.getValue()
              .DATE_FORMAT_CHARECTOR
          ) || '';
        this.currentInvoiceHistoryTitle = `Trial - ${daysLeft} ${daysLeftText}, ended ${formatTrialEnd}`;
      } else {
        const propertyCount = this.invoicePropertyCount?.lastMonth;
        const propertyCountText =
          this.invoicePropertyCount?.lastMonth > 1 ? 'properties' : 'property';
        this.currentInvoiceHistoryTitle =
          'You started the month having pre-paid for ' +
          propertyCount +
          ' ' +
          propertyCountText;
      }
    }
  }

  downloadInvoiceFile() {
    if (!this.invoiceHistoryData?.invoice_pdf) {
      this.toastService.error('There are no files to download');
      return;
    }
    try {
      const link = document.createElement('a');
      link.href = this.invoiceHistoryData?.invoice_pdf;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      console.warn('download file error');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
