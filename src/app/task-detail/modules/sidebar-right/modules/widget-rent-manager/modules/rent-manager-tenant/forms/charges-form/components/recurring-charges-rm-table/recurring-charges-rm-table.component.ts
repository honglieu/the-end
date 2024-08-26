import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { NgxMaskPipe } from 'ngx-mask';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { EEntityType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { EChargeTypes } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/charges-form/tenant-charges-form';
import { ETooltipNewTenantText } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';

@Component({
  selector: 'recurring-charges-rm-table',
  templateUrl: './recurring-charges-rm-table.component.html',
  styleUrls: ['./recurring-charges-rm-table.component.scss'],
  providers: [NgxMaskPipe]
})
export class RecurringChargesRMTableComponent implements OnChanges {
  @Input() recurringChargeList = [];
  @Input() disabled: boolean;
  @Input() loading: boolean;
  @Input() hiddenBtn: boolean;
  @Input() isSyncing = false;
  @Output() handleClickAdd = new EventEmitter<{
    type: string;
    index: number;
  }>();
  @Output() handleClickDelete = new EventEmitter<{
    type: string;
    index: number;
  }>();
  @Output() handleClickCheckbox = new EventEmitter<{
    isException: boolean;
    index?: number;
  }>();
  public selectedRecurringCharges = [];
  public entityType = EEntityType;
  public recurringChargeExceptTenant = [];
  public isDisabledCheckAll: boolean = false;
  public isShowTooltip: boolean = false;
  public visibleDrowdown: boolean = false;
  public itemSelected = null;
  public titleTooltip = ETooltipNewTenantText.TITLE_TOOLTIP_DELETED;
  public titleButtonAddNotSync =
    ETooltipNewTenantText.TITLE_TOOLTIP_BUTTON_ADD_NOT_SYNC;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;

  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnChanges(changes: SimpleChanges): void {
    const charges = changes['recurringChargeList']?.currentValue;
    if (!charges) return;
    this.recurringChargeExceptTenant = charges.filter((e) =>
      this.isExceptTenant(e)
    );
    this.isCheckAll();
    this.isDisabledCheckAll = this.handleDisabledCheckAll();
  }

  handleCheckAll() {
    const valueException = this.selectedRecurringCharges?.length > 0;
    this.selectedRecurringCharges = valueException
      ? []
      : this.recurringChargeExceptTenant;
    this.recurringChargeExceptTenant?.forEach((_, index) => {
      this.handleClickCheckbox.emit({ isException: valueException, index });
    });
  }

  isCheckAll() {
    const allSelected = this.recurringChargeExceptTenant?.every(
      (item) => !item.isException
    );
    this.selectedRecurringCharges = !allSelected
      ? []
      : [...this.recurringChargeExceptTenant];
  }

  isExceptTenant(e) {
    return e?.charge !== EEntityType.TENANT;
  }

  handleDisabledCheckAll() {
    return this.recurringChargeExceptTenant?.every(
      (item) => !this.isExceptTenant(item)
    );
  }

  handleCheckbox(element, index: number) {
    const isException = !element.isException;
    this.selectedRecurringCharges = [
      ...this.recurringChargeExceptTenant.filter((e) => !e?.isException)
    ];
    this.handleClickCheckbox.emit({ isException, index });
  }

  handleDeleteRecurringCharge(index) {
    this.recurringChargeList.splice(index, 1);
    this.handleClickDelete.emit({
      type: EChargeTypes.RECURRING_CHARGES,
      index
    });
  }

  onOpenRecurringCharges(index?: number) {
    this.handleClickAdd.emit({ type: EChargeTypes.RECURRING_CHARGES, index });
  }

  handleVisibleDropdown(event) {
    this.visibleDrowdown = event;
  }

  handleMouseEnter(item) {
    this.itemSelected = item;
  }

  handleMouseLeave() {
    this.itemSelected = null;
  }
}
