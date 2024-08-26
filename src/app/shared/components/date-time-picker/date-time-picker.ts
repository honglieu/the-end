export enum typePicker {
  year = 'year',
  month = 'month',
  day = 'day',
  pickBy = 'pickBy'
}

export interface IPickBy {
  type: typePicker;
  value: number;
}
