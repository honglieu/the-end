import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { ISummaryData } from '@/app/dashboard/modules/agency-settings/utils/billing.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

enum EUnitCoupon {
  Dollar = '$',
  Percent = '%'
}
@Component({
  selector: 'billing-table',
  templateUrl: './billing-table.component.html',
  styleUrls: ['./billing-table.component.scss']
})
export class BillingTableComponent implements OnInit, OnChanges {
  @Input() isCoupon: boolean = false;
  @Input() tableTitle: string;
  @Input() showMoreBtn = false;
  @Input() hiddenQuantitySymbol = false;
  @Input() rowLimit: number;
  @Input() isTrial: boolean;
  @Input() billingTableData: ISummaryData[];
  @Output() showMoreItem = new EventEmitter();
  public unitCoupon = EUnitCoupon;

  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['billingTableData']?.currentValue) {
      this.billingTableData = this.billingTableData
        .map((value) => {
          if (value.dataOnNextMonth) {
            return {
              ...value,
              amount: Math.abs(-value.amount) || 0,
              quantity: Math.abs(-value.quantity) || 0
            };
          }
          return value;
        })
        .sort(
          (a, b) =>
            new Date(a.period.start).getTime() -
            new Date(b.period.start).getTime()
        );
    }
  }

  handleShowMore() {
    this.showMoreItem.emit();
  }
}
