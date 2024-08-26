export enum TenancyInvoicingButtonAction {
  SEND_INVOICE_TO_PROPERTY_TREE = 'send_invoice_to_property_tree'
}

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  DEFAULT = 'DEFAULT',
  PARTPAID = 'PARTPAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum TenancyInvoiceSyncStatus {
  WAITING = '',
  COMPLETED = 'COMPLETED',
  INPROGRESS = 'INPROGRESS',
  FAILED = 'FAILED'
}
