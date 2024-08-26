export enum CreditorInvoicingButtonAction {
  CREATE_TENANCY_INVOICE = 'create_tenancy_invoice',
  CANCEL_TENANCY_INVOICE = 'cancel_tenancy_invoice',
  CANCEL_CREDITOR_INVOICE = 'cancel_creditor_invoice',
  SEND_INVOICE_TO_PROPERTY_TREE = 'send_invoice_to_property_tree',
  PAID_NOTIFY_TENANT_OF_CANCELLATION = 'paid_notify_tenant_of_cancellation',
  PAID_THANKS_TENANT_FOR_PAYMENT = 'paid_thanks_tenant_for_payment',
  PAID_NOTIFY_LANDLORD_OF_PAYMENT = 'paid_notify_landlord_of_payment',
  PARTPAID_THANK_TENANT_FOR_PART_PAYMENT = 'partpaid_thank_tenant_for_part_payment',
  PARTPAID_SCHEDULE_TENANT_REMINDER = 'partpaid_schedule_tenant_reminder',
  UNPAID_FORWARD_INVOICE_TO_TENANT = 'unpaid_forward_invoice_to_tenant',
  UNPAID_SCHEDULE_TENANT_REMINDER_PAYMENT_DUE = 'unpaid_schedule_tenant_reminder_payment_due',
  UNPAID_SCHEDULE_TENANT_REMINDER_OVERDUE_INVOICE = 'unpaid_schedule_tenant_reminder_overdue_invoice',
  CALL_TENANT_INVOICE = 'call_tenant_invoice',
  PLACE_CALL_TO_TENANT_UNPAID = 'place_call_to_tenant_un_paid',
  PLACE_CALL_TO_TENANT_PARTPAID = 'place_call_to_tenant_part_paid'
}

export enum EStatusPaid {
  UNPAID = 'Unpaid',
  PAID = 'Paid',
  PARTPAID = 'PartPaid',
  CANCELLED = 'Cancelled',

  CREATE_TENANCY_INVOICE = 'create_tenancy_invoice',
  CANCEL_TENANCY_INVOICE = 'cancel_tenancy_invoice',
  CANCEL_CREDITOR_INVOICE = 'cancel_creditor_invoice',
  SEND_INVOICE_TO_PROPERTY_TREE = 'send_invoice_to_property_tree',
  PAID_NOTIFY_TENANT_OF_CANCELLATION = 'paid_notify_tenant_of_cancellation',
  PAID_THANKS_TENANT_FOR_PAYMENT = 'paid_thanks_tenant_for_payment',
  PAID_NOTIFY_LANDLORD_OF_PAYMENT = 'paid_notify_landlord_of_payment',
  PARTPAID_THANK_TENANT_FOR_PART_PAYMENT = 'partpaid_thank_tenant_for_part_payment',
  PARTPAID_SCHEDULE_TENANT_REMINDER = 'partpaid_schedule_tenant_reminder',
  UNPAID_FORWARD_INVOICE_TO_TENANT = 'unpaid_forward_invoice_to_tenant',
  UNPAID_SCHEDULE_TENANT_REMINDER_PAYMENT_DUE = 'unpaid_schedule_tenant_reminder_payment_due',
  UNPAID_SCHEDULE_TENANT_REMINDER_OVERDUE_INVOICE = 'unpaid_schedule_tenant_reminder_overdue_invoice'
}

export enum EInvoice {
  CREDITOR_INVOICE = 'CREDITOR_INVOICE',
  TENANCY_INVOICE = 'TENANCY_INVOICE'
}

export enum EInvoiceType {
  TENANCY_INVOICE,
  CREDITOR_INVOICE
}
