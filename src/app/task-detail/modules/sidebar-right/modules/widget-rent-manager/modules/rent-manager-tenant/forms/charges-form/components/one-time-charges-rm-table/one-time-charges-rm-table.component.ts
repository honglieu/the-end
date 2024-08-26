import { ETooltipNewTenantText } from './../../../../types';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgxMaskPipe } from 'ngx-mask';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { EChargeTypes } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/charges-form/tenant-charges-form';

@Component({
  selector: 'one-time-charges-rm-table',
  templateUrl: './one-time-charges-rm-table.component.html',
  styleUrls: ['./one-time-charges-rm-table.component.scss'],
  providers: [NgxMaskPipe]
})
export class OneTimeChargesRMTableComponent {
  @Input() oneTimeChargeList = [];
  @Input() loading: boolean;
  @Input() disabled: boolean;
  @Output() handleClickAdd = new EventEmitter<{
    type: string;
    index: number;
  }>();
  @Output() handleClickDelete = new EventEmitter<{
    type: string;
    index: number;
  }>();
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  public itemSelected = null;
  public visibleDrowdown: boolean = false;
  public titleTooltip = ETooltipNewTenantText.TITLE_TOOLTIP_DELETED;
  public titleButtonAddNotSync =
    ETooltipNewTenantText.TITLE_TOOLTIP_BUTTON_ADD_NOT_SYNC;
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  handleDeleteOneTimeCharge(index) {
    this.oneTimeChargeList.splice(index, 1);
    this.handleClickDelete.emit({ type: EChargeTypes.ONE_TIME_CHARGES, index });
  }

  onOpenOneTimeCharges(index?: number) {
    this.handleClickAdd.emit({ type: EChargeTypes.ONE_TIME_CHARGES, index });
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
