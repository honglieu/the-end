import { ERangeDateType } from '@/app/dashboard/modules/insights/enums/insights.enum';

export const DEFAULT_AGENT_ID = '00000000-0000-0000-0000-000000000000';

export const INSIGHTS_RANGE_TIME_DATA = [
  {
    label: 'So far this week',
    value: ERangeDateType.SO_FAR_THIS_WEEK
  },
  {
    label: 'So far this month',
    value: ERangeDateType.SO_FAR_THIS_MONTH
  },
  {
    label: 'So far this quarter',
    value: ERangeDateType.SO_FAR_THIS_QUARTER
  },
  {
    label: 'So far this year',
    value: ERangeDateType.SO_FAR_THIS_YEAR
  },
  {
    label: 'Last week',
    value: ERangeDateType.LAST_WEEK
  },
  {
    label: 'Last month',
    value: ERangeDateType.LAST_MONTH
  },
  {
    label: 'Last quarter',
    value: ERangeDateType.LAST_QUARTER
  },
  {
    label: 'Last year',
    value: ERangeDateType.LAST_YEAR
  },
  {
    label: 'All time',
    value: ERangeDateType.ALL_TIME
  },
  {
    label: 'Custom',
    value: ERangeDateType.CUSTOM
  }
];
