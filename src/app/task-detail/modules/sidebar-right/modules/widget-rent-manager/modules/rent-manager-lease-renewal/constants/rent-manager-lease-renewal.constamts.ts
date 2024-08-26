import { FrequencyRental } from '@shared/types/trudi.interface';
import { EWeekly } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/enums/rent-manager-lease-renewal.enum';

export const RENT_PERIOD_OPTION = [
  {
    label: 'Monthly',
    value: FrequencyRental.MONTHLY
  },
  {
    label: 'Weekly',
    value: FrequencyRental.WEEKLY
  },
  {
    label: 'Daily',
    value: FrequencyRental.DAILY
  }
];

export const WEEKLY_OPTION = [
  {
    label: 'Monday',
    value: EWeekly.MONDAY
  },
  {
    label: 'Tuesday',
    value: EWeekly.TUESDAY
  },
  {
    label: 'Wednesday',
    value: EWeekly.WEDNESDAY
  },
  {
    label: 'Thursday',
    value: EWeekly.THURSDAY
  },
  {
    label: 'Friday',
    value: EWeekly.FRIDAY
  },
  {
    label: 'Saturday',
    value: EWeekly.SATURDAY
  },
  {
    label: 'Sunday',
    value: EWeekly.SUNDAY
  }
];
