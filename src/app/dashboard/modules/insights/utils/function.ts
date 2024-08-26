import dayjs from 'dayjs';
import { ECountryName } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ITimezone } from '@core';
import {
  EPropertyByCountry,
  ERangeDateType
} from '@/app/dashboard/modules/insights/enums/insights.enum';

/**
 * Get date range payload based on the specified date range type.
 *
 * @param rangeDateType
 * @param startDate - Optional start date for CUSTOM rangeDateType.
 * @param endDate - Optional end date for CUSTOM rangeDateType.
 * @returns An object containing the start and end date payloads.
 */
export function getDatePayloadByRangeDateType(
  timezone: ITimezone,
  rangeDateType: ERangeDateType,
  startDate?: Date,
  endDate?: Date
) {
  let startDatePayload: string;
  let endDatePayload: string;
  const todayTZ = dayjs().tz(timezone.value);
  switch (rangeDateType) {
    case ERangeDateType.ALL_TIME:
      return {};
    case ERangeDateType.SO_FAR_THIS_WEEK:
      startDatePayload = todayTZ.startOf('week').toISOString();
      endDatePayload = todayTZ.endOf('day').subtract(1, 'day').toISOString();
      break;
    case ERangeDateType.SO_FAR_THIS_MONTH:
      startDatePayload = todayTZ.startOf('month').toISOString();
      endDatePayload = todayTZ.endOf('day').subtract(1, 'day').toISOString();
      break;
    case ERangeDateType.SO_FAR_THIS_QUARTER:
      startDatePayload = todayTZ.startOf('quarter').toISOString();
      endDatePayload = todayTZ.endOf('day').subtract(1, 'day').toISOString();
      break;
    case ERangeDateType.SO_FAR_THIS_YEAR:
      startDatePayload = todayTZ.startOf('year').toISOString();
      endDatePayload = todayTZ.endOf('day').subtract(1, 'day').toISOString();
      break;
    case ERangeDateType.LAST_WEEK:
      startDatePayload = todayTZ
        .subtract(1, 'week')
        .startOf('week')
        .toISOString();
      endDatePayload = todayTZ.subtract(1, 'week').endOf('week').toISOString();
      break;
    case ERangeDateType.LAST_MONTH:
      startDatePayload = todayTZ
        .subtract(1, 'month')
        .startOf('month')
        .toISOString();
      endDatePayload = todayTZ
        .subtract(1, 'month')
        .endOf('month')
        .toISOString();
      break;
    case ERangeDateType.LAST_QUARTER:
      startDatePayload = todayTZ
        .subtract(1, 'quarter')
        .startOf('quarter')
        .toISOString();
      endDatePayload = todayTZ
        .subtract(1, 'quarter')
        .endOf('quarter')
        .toISOString();
      break;
    case ERangeDateType.LAST_YEAR:
      startDatePayload = todayTZ
        .subtract(1, 'year')
        .startOf('year')
        .toISOString();
      endDatePayload = todayTZ.subtract(1, 'year').endOf('year').toISOString();
      break;
    case ERangeDateType.CUSTOM:
      startDatePayload = dayjs(startDate)
        .tz(timezone.value)
        .add(1, 'day')
        .startOf('day')
        .toISOString();
      endDatePayload = dayjs(endDate)
        .tz(timezone.value)
        .add(1, 'day')
        .startOf('day')
        .toISOString();
      break;
    default:
  }

  return {
    startDate: startDatePayload,
    endDate: endDatePayload
  };
}

export function getTypeOfProperty(
  propertyNumber: number,
  currentCountry: string
) {
  if (propertyNumber === 1 && currentCountry === ECountryName.AUSTRALIA) {
    return EPropertyByCountry.AU_PROPERTY_SINGULAR;
  }
  if (propertyNumber === 1 && currentCountry === ECountryName.UNITED_STATES) {
    return EPropertyByCountry.US_PROPERTY_SINGULAR;
  }
  if (propertyNumber !== 1 && currentCountry === ECountryName.AUSTRALIA) {
    return EPropertyByCountry.AU_PROPERTY;
  }
  if (propertyNumber !== 1 && currentCountry === ECountryName.UNITED_STATES) {
    return EPropertyByCountry.US_PROPERTY;
  }
  return EPropertyByCountry.AU_PROPERTY;
}

export function formatNumber(number) {
  if (!isNaN(parseFloat(number))) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(number);
  }
  return 0;
}
