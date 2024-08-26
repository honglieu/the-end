import { EPropertyTreeType } from '@/app/task-detail/utils/functions';

export enum EPopupOption {
  CREATE_NEW = 'CREATE_NEW',
  SELECT_EXISTING = 'SELECT_EXISTING'
}

export enum ESelectInvoiceType {
  MAINTENANCE_INVOICE = 'Maintenance',
  CREDITOR_INVOICE = 'Creditor',
  TENANCY_INVOICE = 'Tenancy'
}

export const SELECT_INVOICE_LABEL = {
  [ESelectInvoiceType.CREDITOR_INVOICE]: {
    title: 'Creditor invoice',
    [EPopupOption.CREATE_NEW]: 'Create new creditor invoice',
    [EPopupOption.SELECT_EXISTING]: 'Select existing creditor invoice'
  },
  [ESelectInvoiceType.TENANCY_INVOICE]: {
    title: 'Tenancy invoice',
    [EPopupOption.CREATE_NEW]: 'Create new tenancy invoice',
    [EPopupOption.SELECT_EXISTING]: 'Select existing tenancy invoice'
  },
  [ESelectInvoiceType.MAINTENANCE_INVOICE]: {
    title: 'Maintenance invoice',
    [EPopupOption.CREATE_NEW]: 'Create new maintenance invoice',
    [EPopupOption.SELECT_EXISTING]: 'Select existing maintenance invoice'
  }
};

export const SELECT_INVOICE_MAP = {
  [EPropertyTreeType.CREDITOR_INVOICE]: ESelectInvoiceType.CREDITOR_INVOICE,
  [EPropertyTreeType.TENANCY_INVOICE]: ESelectInvoiceType.TENANCY_INVOICE,
  [EPropertyTreeType.MAINTENANCE_INVOICE]:
    ESelectInvoiceType.MAINTENANCE_INVOICE
};
