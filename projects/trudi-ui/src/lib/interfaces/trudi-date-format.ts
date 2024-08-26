import { Observable } from "rxjs";
import { CandyDate, ITimezone } from "../utils";
import dayjs from "dayjs";

export type TrudiSafeAny = any;
export type RegionDateFormat = {
  DATE_FORMAT_DAYJS: string;
  DATE_FORMAT_PIPE: string;
  DATE_FORMAT_MONTH: string;
  DATE_AND_TIME_FORMAT_DAYJS: string;
  DATE_AND_TIME_FORMAT_PIPE: string;
  DATE_FORMAT_CHARECTOR: string;
  DATE_FORMAT_CHARECTOR_PIPE: string;
  DATE_FORMAT_DAY_MONTH_DAYJS: string;
  DATE_FORMAT_FULL: string;
  DATE_AND_TIME_FORMAT: string;
};

export interface TrudiDateFormat {
  dateFormat$: Observable<RegionDateFormat>;
  timezone$: Observable<ITimezone>;
  dateFormatDayJS$: Observable<string>;
  dateFormatPipe$: Observable<string>;
  dateFormatMonth$: Observable<string>;
  dateAndTimeFormatDayjs$: Observable<string>;
  dateAndTimeFormat$: Observable<string>;
  dateAndTimeFormatV2$: Observable<string>;
  dateAndTimeFormatPipe$: Observable<string>;
  dateFormatCharector$: Observable<string>;
  dateFormatCharectorPipe$: Observable<string>;

  init(): Observable<[RegionDateFormat, ITimezone]>;

  getDateFormat(): RegionDateFormat;
  getCurrentTimezone(): ITimezone;

  agencyDayJs(...args: TrudiSafeAny): dayjs.Dayjs;
  initDateTimezoneWithLocal(dateTime: Date | string | number): CandyDate;
  initTimezoneToday(): CandyDate;
  expectedTimezoneDate(dateTime): Date;
  expectedTimezoneStartOfDay(dateTime: Date | string | number): Date;
  formatTimezoneDate(
    dateTime: Date | string | number,
    format: string,
    includeAbbrev?: boolean
  ): string;
  formatTimezoneTime(
    dateTime: Date | string | number,
    format: string,
    includeAbbrev?: boolean
  ): string;
  buildRangeTimePicker(
    date: Date | string | number,
    includeTz?: boolean
  ): { rangeFrom: number; rangeTo: number };
  combineDateAndTimeToISO(date: Date | string | number, time: number): string;
  combineDateAndTimeFromUTCToLocal(date: Date | string | number): string;
}
