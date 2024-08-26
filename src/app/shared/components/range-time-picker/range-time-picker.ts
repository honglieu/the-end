export enum TimePickerType {
  year = 'year',
  month = 'month',
  day = 'day',
  pickBy = 'pickBy'
}

export interface ITimePickBy {
  type: TimePickerType;
  value: number;
}
