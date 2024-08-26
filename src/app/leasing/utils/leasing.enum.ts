export enum PaymentPeriod {
  Day = 1,
  Week = 2,
  Fortnight = 3,
  Month = 4,
  Quarter = 5,
  Year = 6
}

export enum PeriodType {
  Week = 1,
  Month = 2,
  Year = 3,
  UserDefined = 4
}

export enum EAmountErrorType {
  InvalidNumber = 'invalidNumber',
  InvalidMaximum = 'invalidMaximum',
  InvalidFormat = 'invalidFormat',
  InvalidAmountLodgedDirectAmount = 'invalidAmountLodgedDirectAmount'
}

export enum EAmountErrorMessage {
  InvalidNumber = 'Invalid number',
  LessThan1000000 = 'Amount must be less than $1,000,000',
  Maximum999999 = 'Max amount is $999,999',
  InvalidFormat = 'Invalid format',
  CannotExceedRequired = 'Lodged amount cannot exceed Required amount'
}

export const AMOUNT_ERRORS = [
  {
    errorName: EAmountErrorType.InvalidNumber,
    errorMessage: EAmountErrorMessage.InvalidNumber
  },
  {
    errorName: EAmountErrorType.InvalidMaximum,
    errorMessage: EAmountErrorMessage.LessThan1000000
  },
  {
    errorName: EAmountErrorType.InvalidFormat,
    errorMessage: EAmountErrorMessage.InvalidFormat
  }
];

export const PaymentPeriodString: Record<number, string> = {
  [PaymentPeriod.Day]: 'day',
  [PaymentPeriod.Week]: 'week',
  [PaymentPeriod.Fortnight]: 'fortnight',
  [PaymentPeriod.Month]: 'month',
  [PaymentPeriod.Quarter]: 'quarter',
  [PaymentPeriod.Year]: 'year'
};

export const PeriodTypeString: Record<number, string> = {
  [PeriodType.Week]: 'weeks',
  [PeriodType.Month]: 'months',
  [PeriodType.Year]: 'years',
  [PeriodType.UserDefined]: ''
};
