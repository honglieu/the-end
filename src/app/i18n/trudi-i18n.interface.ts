import { Locale } from 'date-fns';

export interface TrudiPaginationI18nInterface {
  items_per_page: string;
  jump_to: string;
  jump_to_confirm: string;
  page: string;

  // Pagination.jsx
  prev_page: string;
  next_page: string;
  prev_5: string;
  next_5: string;
  prev_3: string;
  next_3: string;
}

export interface TrudiGlobalI18nInterface {
  placeholder: string;
}

export interface TrudiDatePickerI18nInterface {
  lang: TrudiDatePickerLangI18nInterface;
  timePickerLocale: TrudiTimePickerI18nInterface;
}

export interface TrudiCalendarI18nInterface {
  today: string;
  now: string;
  backToToday: string;
  ok: string;
  clear: string;
  month: string;
  year: string;
  timeSelect: string;
  dateSelect: string;
  monthSelect: string;
  yearSelect: string;
  decadeSelect: string;
  yearFormat: string;
  monthFormat?: string;
  dateFormat: string;
  dayFormat: string;
  dateTimeFormat: string;
  monthBeforeYear?: boolean;
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
  previousDecade: string;
  nextDecade: string;
  previousCentury: string;
  nextCentury: string;
}

export interface TrudiDatePickerLangI18nInterface
  extends TrudiCalendarI18nInterface {
  placeholder?: string;
  yearPlaceholder?: string;
  quarterPlaceholder?: string;
  monthPlaceholder?: string;
  weekPlaceholder?: string;
  rangePlaceholder?: string[];
  rangeYearPlaceholder?: string[];
  rangeMonthPlaceholder?: string[];
  rangeWeekPlaceholder?: string[];
}

export interface TrudiTimePickerI18nInterface {
  placeholder?: string;
  rangePlaceholder?: string[];
}

export type ValidateMessage = string | (() => string);

export type TrudiCascaderI18nInterface = TrudiGlobalI18nInterface;

export interface TrudiTableI18nInterface {
  filterTitle?: string;
  filterConfirm?: string;
  filterReset?: string;
  selectAll?: string;
  selectInvert?: string;
  selectionAll?: string;
  sortTitle?: string;
  expand?: string;
  collapse?: string;
  triggerDesc?: string;
  triggerAsc?: string;
  cancelSort?: string;
}

export interface TrudiModalI18nInterface {
  okText: string;
  cancelText: string;
  justOkText: string;
}

export interface TrudiPopconfirmI18nInterface {
  okText: string;
  cancelText: string;
}

export interface TrudiTransferI18nInterface {
  titles?: string[];
  searchPlaceholder?: string;
  itemUnit?: string;
  itemsUnit?: string;
}

export interface TrudiUploadI18nInterface {
  uploading?: string;
  removeFile?: string;
  uploadError?: string;
  previewFile?: string;
  downloadFile?: string;
}

export interface TrudiEmptyI18nInterface {
  description: string;
}

export interface TrudiTextI18nInterface {
  edit: string;
  copy: string;
  copied: string;
  expand: string;
}

export interface TrudiCronExpressionLabelI18n {
  second?: string;
  minute?: string;
  hour?: string;
  day?: string;
  month?: string;
  week?: string;
  // innerHTML
  secondError?: string;
  minuteError?: string;
  hourError?: string;
  dayError?: string;
  monthError?: string;
  weekError?: string;
}

export interface TrudiCronExpressionCronErrorI18n {
  cronError?: string;
}

export type TrudiCronExpressionI18nInterface =
  TrudiCronExpressionCronErrorI18n & TrudiCronExpressionLabelI18n;

export interface TrudiI18nInterface {
  locale: string;
  Pagination: TrudiPaginationI18nInterface;
  DatePicker: TrudiDatePickerI18nInterface;
  TimePicker: TrudiTimePickerI18nInterface;
  Calendar: TrudiDatePickerI18nInterface;
  global?: TrudiGlobalI18nInterface;
  Table: TrudiTableI18nInterface;
  Modal: TrudiModalI18nInterface;
  Popconfirm: TrudiPopconfirmI18nInterface;
  Transfer: TrudiTransferI18nInterface;
  Upload: TrudiUploadI18nInterface;
  Empty: TrudiEmptyI18nInterface;
  Text?: TrudiTextI18nInterface;
  CronExpression?: TrudiCronExpressionI18nInterface;
}

export type DateLocale = Locale;
