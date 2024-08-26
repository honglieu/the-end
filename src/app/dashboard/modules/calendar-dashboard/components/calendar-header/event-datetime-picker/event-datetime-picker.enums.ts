export enum EEventDatetimePicker {
  NextThreeMonths = 'NextThreeMonths',
  NextSixMonths = 'NextSixMonths',
  NextYear = 'NextYear',
  PassedThreeMonths = 'PassedThreeMonths',
  PassedSixMonths = 'PassedSixMonths',
  PassedYear = 'PassedYear',
  CustomRange = 'CustomRange'
}

export const EventDatetimePicker: Record<EEventDatetimePicker, string> = {
  NextThreeMonths: 'Next 3 months',
  NextSixMonths: 'Next 6 months',
  NextYear: 'Next 12 months',
  PassedThreeMonths: 'Past 3 months',
  PassedSixMonths: 'Past 6 months',
  PassedYear: 'Past 12 months',
  CustomRange: 'Custom'
};

type EventDatetimePickerOptions = Exclude<
  EEventDatetimePicker,
  EEventDatetimePicker.CustomRange
>;

export const EventDatetimePickerOptions: Record<
  EventDatetimePickerOptions,
  number
> = {
  NextThreeMonths: 3,
  NextSixMonths: 6,
  NextYear: 12,
  PassedThreeMonths: -3,
  PassedSixMonths: -6,
  PassedYear: -12
};

export const EventDatetimePickerType: Record<
  string,
  EventDatetimePickerOptions
> = {
  '0': EEventDatetimePicker.NextThreeMonths,
  '1': EEventDatetimePicker.NextThreeMonths,
  '2': EEventDatetimePicker.NextThreeMonths,
  '3': EEventDatetimePicker.NextThreeMonths,
  '4': EEventDatetimePicker.NextSixMonths,
  '5': EEventDatetimePicker.NextSixMonths,
  '6': EEventDatetimePicker.NextSixMonths,
  '7': EEventDatetimePicker.NextYear,
  '8': EEventDatetimePicker.NextYear,
  '9': EEventDatetimePicker.NextYear,
  '10': EEventDatetimePicker.NextYear,
  '11': EEventDatetimePicker.NextYear,
  '12': EEventDatetimePicker.NextYear,
  '-1': EEventDatetimePicker.PassedThreeMonths,
  '-2': EEventDatetimePicker.PassedThreeMonths,
  '-3': EEventDatetimePicker.PassedThreeMonths,
  '-4': EEventDatetimePicker.PassedSixMonths,
  '-5': EEventDatetimePicker.PassedSixMonths,
  '-6': EEventDatetimePicker.PassedSixMonths,
  '-7': EEventDatetimePicker.PassedYear,
  '-8': EEventDatetimePicker.PassedYear,
  '-9': EEventDatetimePicker.PassedYear,
  '-10': EEventDatetimePicker.PassedYear,
  '-11': EEventDatetimePicker.PassedYear,
  '-12': EEventDatetimePicker.PassedYear
};

export const durationOfPicker: number[] = Object.keys(
  EventDatetimePickerType
).map((key) => +key);
