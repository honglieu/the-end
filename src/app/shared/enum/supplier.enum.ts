export enum crmStatusType {
  pending = 'PENDING',
  archived = 'ARCHIVED',
  deleted = 'DELETED',
  clear = 'CLEAR'
}

export enum EPaymentMethod {
  BPAY = 'BPAY',
  EFT = 'EFT',
  CHEQUE = 'CHEQUE'
}

export const paymentMethodName = {
  [EPaymentMethod.BPAY]: 'BPAY',
  [EPaymentMethod.EFT]: 'EFT',
  [EPaymentMethod.CHEQUE]: 'Cheque'
};
