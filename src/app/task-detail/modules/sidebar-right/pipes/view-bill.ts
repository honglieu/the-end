import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'viewBill' })
export class ViewBillPipe implements PipeTransform {
  transform(billType, listBills, listBillInfo): boolean {
    if (!listBills || listBills.length === 0) {
      return false;
    }
    const listBillCreated = listBillInfo
      .filter((item) => item.id && listBills.includes(item.type))
      .map((i) => i.type);
    if (listBillCreated.includes(billType)) {
      return true;
    }

    return false;
  }
}
