import { Pipe, PipeTransform } from '@angular/core';
import { EBillType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';

@Pipe({ name: 'billTypeDisabled' })
export class BillTypeDisabledPipe implements PipeTransform {
  transform(billType, listBills): boolean {
    if (!listBills || listBills.length === 0) {
      return false;
    }
    if (
      billType === EBillType.PURCHASE_ORDER &&
      (listBills.includes(EBillType.INVOICE_DETAIL) ||
        listBills.includes(EBillType.VENDOR_BILL) ||
        listBills.includes(EBillType.OWNER_BILL))
    ) {
      return true;
    }
    if (
      billType !== EBillType.PURCHASE_ORDER &&
      listBills.includes(EBillType.PURCHASE_ORDER)
    ) {
      return true;
    }
    return false;
  }
}
