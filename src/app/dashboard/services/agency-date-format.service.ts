import { Injectable } from '@angular/core';
import dayjs from 'dayjs';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  filter,
  first,
  map,
  startWith,
  tap
} from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  EFunctionMode,
  ITimezone,
  convertUTCToLocalDateTime,
  formatUTCAndTimezone,
  getTimezoneDetail,
  getZonedOffset
} from '@core';
import { TrudiSafeAny } from '@core';
import { SHORT_ISO_DATE, SHORT_ISO_TIME_FORMAT } from '@services/constants';
import {
  hmsToSecondsOnly,
  secondsToHmsOnly
} from '@shared/components/date-picker2/util';
import { convertTime12to24 } from '@/app/trudi-send-msg/utils/helper-functions';
import { CompanyService } from '@services/company.service';
import { CandyDate } from '@trudi-ui';

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

const REGION_FORMAT_TIMES = {
  AU: {
    DATE_FORMAT_CHARECTOR: 'DD MMM, YYYY',
    DATE_FORMAT_CHARECTOR_PIPE: 'dd MMM, yyyy',
    DATE_FORMAT_DAYJS: 'DD/MM/YYYY',
    DATE_FORMAT_PIPE: 'dd/MM/yyyy',
    DATE_FORMAT_MONTH: 'M/D/YYYY',
    DATE_AND_TIME_FORMAT_DAYJS: 'hh:mm a DD/MM/YYYY',
    DATE_AND_TIME_FORMAT: 'hh:mm a, DD/MM/YYYY',
    DATE_AND_TIME_FORMAT_V2: 'hh:mma, DD/MM/YYYY',
    DATE_AND_TIME_FORMAT_PIPE: 'hh:mm DD/MM/YYYY',
    DATE_FORMAT_DAY_MONTH_DAYJS: 'DD/MM',
    DATE_FORMAT_FULL: 'ddd, DD/MM/YYYY'
  },
  US: {
    DATE_FORMAT_CHARECTOR: 'MMM DD, YYYY',
    DATE_FORMAT_CHARECTOR_PIPE: 'MMM dd, yyyy',
    DATE_FORMAT_DAYJS: 'MM/DD/YYYY',
    DATE_FORMAT_PIPE: 'MM/dd/yyyy',
    DATE_FORMAT_MONTH: 'D/M/YYYY',
    DATE_AND_TIME_FORMAT_DAYJS: 'hh:mm a MM/DD/YYYY',
    DATE_AND_TIME_FORMAT: 'hh:mm a, MM/DD/YYYY',
    DATE_AND_TIME_FORMAT_V2: 'hh:mma, MM/DD/YYYY',
    DATE_AND_TIME_FORMAT_PIPE: 'hh:mm MM/DD/YYYY',
    DATE_FORMAT_DAY_MONTH_DAYJS: 'MM/DD',
    DATE_FORMAT_FULL: 'ddd, MM/DD/YYYY'
  }
};

const AGENCY_TIMEZONE_KEY_CONST = 'agencyTimezone';

@Injectable({
  providedIn: 'root'
})
export class AgencyDateFormatService {
  private dateFormatSource$ = this.companyService.getCurrentCompany().pipe(
    map((company) => company?.crmSystem),
    distinctUntilChanged(),
    map((crmSystem) => this._getDateFormatByCRM(crmSystem)),
    tap((format) => {
      this.dateFormat$.next(format);
      localStorage.setItem('dateFormat', JSON.stringify(format));
    })
  );

  public dateFormat$ = new BehaviorSubject<RegionDateFormat>(null);

  private _timeZone$ = new BehaviorSubject<ITimezone>(null);
  public timezone$ = this.companyService.getCurrentCompany().pipe(
    map((agency) => agency?.timeZone),
    distinctUntilChanged(),
    filter(Boolean),
    map((timeZone) => getTimezoneDetail(timeZone)),
    tap((timezoneDetail) => {
      this._timeZone$.next(timezoneDetail);
      localStorage.setItem(
        AGENCY_TIMEZONE_KEY_CONST,
        JSON.stringify(timezoneDetail)
      );
    })
  );

  public dateFormatDayJS$ = this._getDateFormat('DATE_FORMAT_DAYJS');
  public dateFormatPipe$ = this._getDateFormat('DATE_FORMAT_PIPE');
  public dateFormatMonth$ = this._getDateFormat('DATE_FORMAT_MONTH');
  public dateAndTimeFormatDayjs$ = this._getDateFormat(
    'DATE_AND_TIME_FORMAT_DAYJS'
  );
  public dateAndTimeFormat$ = this._getDateFormat('DATE_AND_TIME_FORMAT');
  public dateAndTimeFormatV2$ = this._getDateFormat('DATE_AND_TIME_FORMAT_V2');
  public dateAndTimeFormatPipe$ = this._getDateFormat(
    'DATE_AND_TIME_FORMAT_PIPE'
  );
  public dateFormatCharector$ = this._getDateFormat('DATE_FORMAT_CHARECTOR');
  public dateFormatCharectorPipe$ = this._getDateFormat(
    'DATE_FORMAT_CHARECTOR_PIPE'
  );

  constructor(private companyService: CompanyService) {}

  public init() {
    return combineLatest([
      this.dateFormatSource$.pipe(startWith(null)),
      this.timezone$.pipe(startWith(null))
    ]).pipe(first(([dateFormat, timezone]) => Boolean(dateFormat && timezone)));
  }

  private _getDateFormat(key: string): Observable<string> {
    return this.dateFormatSource$.pipe(map((dateFormat) => dateFormat?.[key]));
  }

  private _getDateFormatByCRM(crm: ECRMSystem) {
    const defaultFormat = REGION_FORMAT_TIMES['AU'];
    const formats = {
      [ECRMSystem.PROPERTY_TREE]: REGION_FORMAT_TIMES['AU'],
      [ECRMSystem.RENT_MANAGER]: REGION_FORMAT_TIMES['US']
    };
    return formats[crm] || defaultFormat;
  }

  public getDateFormat(): RegionDateFormat {
    return this.dateFormat$.getValue();
  }

  public getCurrentTimezone(): ITimezone {
    return this._timeZone$.getValue();
  }

  public agencyDayJs(...args: TrudiSafeAny) {
    const tz = this.getCurrentTimezone();
    return dayjs(...args).tz(tz.value);
  }

  public initDateTimezoneWithLocal(
    dateTime: Date | string | number
  ): CandyDate {
    const tz = this.getCurrentTimezone();
    return new CandyDate(
      new Date(dateTime).toLocaleString('en', { timeZone: tz?.value })
    );
  }

  public initTimezoneToday() {
    return this.initDateTimezoneWithLocal(new Date());
  }

  public expectedTimezoneDate(dateTime) {
    if (!dateTime) return null;
    const tz = this.getCurrentTimezone();
    const tzDate = formatUTCAndTimezone(dateTime, tz);
    return new Date(tzDate);
  }

  public expectedTimezoneStartOfDay(dateTime) {
    if (!dateTime) return null;
    const tz = this.getCurrentTimezone();
    const tzDate = formatUTCAndTimezone(
      dateTime,
      tz,
      EFunctionMode.START_OF_DAY
    );
    return new Date(tzDate);
  }

  public formatTimezoneDate(
    dateTime: Date | string | number,
    format: string,
    includeAbbrev: boolean = false
  ) {
    if (!dateTime) return '';
    const tz = this.getCurrentTimezone();
    const abbrev = includeAbbrev && tz?.abbrev ? ` (${tz.abbrev})` : '';
    return `${dayjs(dateTime).tz(tz.value).format(format)}${abbrev}`;
  }

  public formatTimezoneTime(
    dateTime: Date | string | number,
    format: string,
    includeAbbrev: boolean = false
  ) {
    if (!dateTime) return '';
    const tz = this.getCurrentTimezone();
    const abbrev = includeAbbrev && tz?.abbrev ? ` (${tz.abbrev})` : '';
    if (typeof dateTime === 'string') {
      const timeRegex = new RegExp(/\d{2}:\d{2} (am|pm|AM|PM)/);
      if (timeRegex.test(dateTime)) {
        return `${dayjs(
          this.combineDateAndTimeToISO(
            this.initTimezoneToday().nativeDate,
            hmsToSecondsOnly(convertTime12to24(dateTime as string))
          )
        )
          .tz(tz.value)
          .format(format)}${abbrev}`;
      }

      if (!dayjs(dateTime as string).isValid()) {
        throw new Error('Invalid dateTime');
      }
    }
    return `${dayjs(dateTime).tz(tz.value).format(format)}${abbrev}`;
  }

  public buildRangeTimePicker(
    date: Date | string | number,
    includeTz: boolean = true
  ) {
    if (!date) return { rangeFrom: -1, rangeTo: 86400 };
    const timezone = includeTz
      ? this.getCurrentTimezone().value
      : Intl.DateTimeFormat().resolvedOptions().timeZone;

    const selectedDate = dayjs(date).tz(timezone).clone();
    const today = includeTz
      ? dayjs().tz(timezone).clone()
      : dayjs(this.initTimezoneToday().nativeDate).clone();

    if (selectedDate.isSame(today, 'day')) {
      const formattedDate = today.format(SHORT_ISO_TIME_FORMAT);
      return {
        rangeFrom: hmsToSecondsOnly(formattedDate),
        rangeTo: 86400
      };
    }

    if (selectedDate.isBefore(today, 'day')) {
      return { rangeFrom: 86400, rangeTo: 86400 };
    }

    return { rangeFrom: -1, rangeTo: 86400 };
  }

  public combineDateAndTimeToISO(date: Date | number | string, time: number) {
    const tz = this.getCurrentTimezone();
    const dateTime = `${dayjs(date).format(SHORT_ISO_DATE)}T${secondsToHmsOnly(
      time
    )}`;
    const zonedOffset = getZonedOffset(tz.value, dateTime);
    const datePayload = new Date(
      `${dateTime}${zonedOffset.offsetLabel}`
    ).toISOString();
    return datePayload;
  }

  public combineDateAndTimeFromUTCToLocal(date: Date | number | string) {
    const tz = this.getCurrentTimezone();
    if (!date) return null;
    return convertUTCToLocalDateTime(date, tz.value);
  }
}
