import { EBillType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';

export const BILL_TYPES = [
  {
    title: 'Purchase order',
    type: EBillType.PURCHASE_ORDER,
    tooltip:
      'You cannot create a bill for line items that have a linked PO or will create a linked PO.'
  },
  {
    title: 'Invoice detail',
    type: EBillType.INVOICE_DETAIL,
    tooltip:
      'You cannot create a bill for line items that have a linked PO or will create a linked PO.',

    isDisabled: false
  },
  {
    title: 'Vendor bill',
    type: EBillType.VENDOR_BILL,
    tooltip:
      'You cannot create a bill for line items that have a linked PO or will create a linked PO.'
  },
  {
    title: 'Owner bill',
    type: EBillType.OWNER_BILL,
    tooltip:
      'You cannot create a bill for line items that have a linked PO or will create a linked PO.'
  }
];
