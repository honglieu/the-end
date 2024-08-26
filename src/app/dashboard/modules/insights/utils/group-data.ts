import dayjs from 'dayjs';
import { CHART_LABEL_WIDTH, EPeriodType } from '@trudi-ui';
import {
  ERangeDateType,
  ETrendType,
  PercentageType
} from '@/app/dashboard/modules/insights/enums/insights.enum';
import { RegionDateFormat } from '@/app/dashboard/services/agency-date-format.service';
import { formatNumber } from './function';

export function groupDataByPeriod(
  data,
  period: EPeriodType,
  categories: string[],
  dateFormat: RegionDateFormat,
  isCountItemHasValue = false
) {
  const groupedData = {};
  let lastIndex = data.length - 1;
  data.forEach((item) => {
    let date = new Date(item.timeCollection);
    let label;

    switch (period) {
      case EPeriodType.DAY:
        label = dayjs.utc(date).format(dateFormat.DATE_FORMAT_DAYJS);
        break;
      case EPeriodType.MONTH:
        label = dayjs.utc(date).format('MMM YYYY');
        break;
      case EPeriodType.QUARTER:
        label = `Q${Math.ceil(
          (date.getUTCMonth() + 1) / 3
        )}/${date.getUTCFullYear()}`;
        break;
      case EPeriodType.YEAR:
        label = String(date.getUTCFullYear());
        break;
      case EPeriodType.WEEK:
        const currentDate = dayjs.utc(item.timeCollection);
        label = getWeekLabel(
          currentDate,
          data[0].timeCollection,
          data[lastIndex].timeCollection,
          dateFormat
        );
        break;
    }

    if (!groupedData[label]) {
      groupedData[label] = {
        ...item,
        timeCollection: label
      };
      categories.forEach((category) => {
        groupedData[label][category] = 0;
      });
    }
    categories.forEach((category) => {
      groupedData[label][category] += item[category];
    });
    if (isCountItemHasValue) {
      countTotalItemHasValue(categories, groupedData[label]);
    }
  });

  return Object.values(groupedData);
}

export function convertToPercentageStackbar(data) {
  let convertData = data.map((value) => {
    let maxValue = 100;
    const total = value.completed + value.inprogress;
    let completedPercentage = ((value.completed / total) * 100).toFixed(2);
    let inProgressPercentage = maxValue - Number(completedPercentage);

    return {
      ...value,
      [PercentageType.COMPLETED]: parseFloat(completedPercentage),
      [PercentageType.IN_PROGRESS]: parseFloat(
        String(inProgressPercentage.toFixed(2))
      )
    };
  });
  return convertData;
}

export function getDataLineChartByPeriod(
  dateFormat,
  data,
  period,
  bindLabel,
  categories: string[],
  isCountItemHasValue = false
) {
  let tempData = data;
  let lastIndex = tempData.length - 1;
  if (period === EPeriodType.DAY) {
    let dateChart = tempData.map((i) => ({
      ...i,
      [bindLabel]: dayjs.utc(new Date(i[bindLabel])),
      dateTooltip: dayjs.utc(i[bindLabel]).format(dateFormat.DATE_FORMAT_DAYJS)
    }));
    return dateChart;
  }
  const groupedData = {};
  tempData.forEach((item) => {
    const date = dayjs.utc(item[bindLabel]);
    let key;
    switch (period) {
      case EPeriodType.MONTH:
        key = date.format('YYYY-MM');
        item[bindLabel] = new Date(item[bindLabel]).setUTCDate(1);
        item.dateTooltip = dayjs.utc(item[bindLabel]).format('MMM YYYY');
        break;
      case EPeriodType.QUARTER:
        let dateTime = new Date(item[bindLabel]);
        dateTime.setUTCMonth(Math.floor(dateTime.getUTCMonth() / 3) * 3);
        dateTime.setUTCDate(1);
        key = date.format('YYYY-[Q]Q');
        item[bindLabel] = dateTime;
        item.dateTooltip = getQuater(date);
        break;
      case EPeriodType.YEAR:
        key = date.format('YYYY');
        let updateLabel = new Date(item[bindLabel]);
        updateLabel.setUTCDate(1);
        updateLabel.setUTCMonth(0);
        item[bindLabel] = updateLabel;
        item.dateTooltip = dayjs.utc(item[bindLabel]).format('YYYY');
        break;
      case EPeriodType.WEEK:
        const weekStartDate = date.startOf('week');
        key = `${weekStartDate.format('DD/MM/YYYY')}`;
        item.dateTooltip = getWeekLabel(
          dayjs.utc(date),
          tempData[0][bindLabel],
          tempData[lastIndex][bindLabel],
          dateFormat
        );
        item[bindLabel] = dayjs
          .utc(item[bindLabel])
          .startOf('week')
          .day(1)
          .toDate();
        break;
      default:
        key = 'unknown';
    }

    if (groupedData[key]) {
      categories.forEach((category) => {
        groupedData[key][category] += item[category];
      });
    } else {
      groupedData[key] = { ...item };
      categories.forEach((category) => {
        groupedData[key][category] += 0;
      });
    }
    if (isCountItemHasValue) {
      countTotalItemHasValue(categories, groupedData[key]);
    }
  });

  return Object.values(groupedData);
}

function countTotalItemHasValue(categories, groupedData) {
  let allCategoriesGreaterThanZero = true;
  categories.forEach((category) => {
    if (groupedData[category] <= 0) {
      allCategoriesGreaterThanZero = false;
    }
  });
  groupedData['totalItemHasValue'] = groupedData['totalItemHasValue'] ?? 0;
  if (allCategoriesGreaterThanZero) {
    groupedData['totalItemHasValue'] += 1;
  }
}

export function calculateTrendData(data, bindLabel) {
  if (data.length === 0) {
    return;
  }

  data[0].isUpTrend = ETrendType.EQUAL;
  data[0].percent = null;

  for (let i = 1; i < data.length; i++) {
    const currentValue = data[i][bindLabel];
    const previousValue = data[i - 1][bindLabel];

    const difference = currentValue - previousValue;

    data[i].isUpTrend =
      difference === 0 || previousValue === 0
        ? ETrendType.EQUAL
        : difference < 0
        ? ETrendType.DOWN
        : ETrendType.UP;

    if (previousValue === 0) {
      data[i].percent = null;
    } else if (difference === 0) {
      data[i].percent = 0;
    } else {
      const percent =
        ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
      data[i].percent = Number.isInteger(percent)
        ? percent
        : Math.round(percent * 100) / 100;
    }
  }
  return data;
}

export function calculateTrendDataStackBar(data) {
  if (data.length === 0) {
    return;
  }

  data[0].isUpTrendCompleted = ETrendType.EQUAL;
  data[0].isUpTrendInprogress = ETrendType.EQUAL;
  data[0].percentInProgress = null;
  data[0].percentCompleted = null;

  for (let i = 1; i < data.length; i++) {
    const {
      completed: currentValueCompleted,
      inprogress: currentValueInProgress
    } = data[i];
    const {
      completed: previousValueCompleted,
      inprogress: previousValueInProgress
    } = data[i - 1];

    const differenceCompleted = currentValueCompleted - previousValueCompleted;
    const differenceInProgress =
      currentValueInProgress - previousValueInProgress;

    const calculateTrend = (difference, previousValue) =>
      difference === 0 || previousValue === 0
        ? ETrendType.EQUAL
        : difference < 0
        ? ETrendType.DOWN
        : ETrendType.UP;

    data[i].isUpTrendCompleted = calculateTrend(
      differenceCompleted,
      previousValueCompleted
    );
    data[i].isUpTrendInprogress = calculateTrend(
      differenceInProgress,
      previousValueInProgress
    );

    if (previousValueCompleted === 0) {
      data[i].percentCompleted = null;
    } else if (differenceCompleted === 0) {
      data[i].percentCompleted = 0;
    } else {
      const percent =
        ((currentValueCompleted - previousValueCompleted) /
          Math.abs(previousValueCompleted)) *
        100;
      data[i].percentCompleted = parseFloat(percent.toFixed(2));
    }

    if (previousValueInProgress === 0) {
      data[i].percentInProgress = null;
    } else if (differenceInProgress === 0) {
      data[i].percentInProgress = 0;
    } else {
      const percent =
        ((currentValueInProgress - previousValueInProgress) /
          Math.abs(previousValueInProgress)) *
        100;
      data[i].percentInProgress = parseFloat(percent.toFixed(2));
    }
  }
  return data;
}
function getQuater(date) {
  let inputDate = new Date(date);
  let quarter = Math.floor((inputDate.getUTCMonth() + 3) / 3);
  let year = inputDate.getUTCFullYear();
  return `Q${quarter}/${year}`;
}

export function sortDataAscending(data) {
  if (!data) {
    return [];
  }
  data.sort((a, b) => a.timeCollection.localeCompare(b.timeCollection));
  return data;
}

export function countWorkingDays(startDate, endDate): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return diffDatesInDays(end, start) + 1;
}

export function diffDatesInDays(dateFirst: Date, dateLast: Date): number {
  const timeDiff = dateFirst.getTime() - dateLast.getTime();
  return Math.floor(timeDiff / (86400 * 1000));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}

export function getTrendImagePath(isEqual, isUpTrend) {
  return isEqual
    ? ''
    : isUpTrend
    ? '/assets/icon/trend-up.svg'
    : '/assets/icon/trend-down.svg';
}

export function formatPercentage(value) {
  return typeof value === 'number'
    ? `<span class="${getStatusTrendingClass(value)}"> ${formatNumber(
        value
      )}% <span>`
    : '<span class="no_ercentage">--<span>';
}

function getStatusTrendingClass(value) {
  if (value > 0) {
    return 'trend_up--percentage';
  } else if (value < 0) {
    return 'trend_down--percentage';
  } else {
    return 'no_ercentage';
  }
}

export function getStatusImgClass(percentageData) {
  if (!percentageData) {
    return 'd-none';
  }
  return 'd-block';
}

export function generateEnquiriesString(data, key, percentageKey) {
  const statusKey = key === percentageKey ? 'inprogress' : 'completed';
  const actionType = key === percentageKey ? 'open' : 'resolved';
  const percentage =
    data[
      key === percentageKey ? 'inProgressPercentage' : 'completedPercentage'
    ];

  const enquiryOrEnquiries = data[statusKey] > 1 ? 'enquiries' : 'enquiry';

  return `${formatNumber(
    data[statusKey]
  )} ${enquiryOrEnquiries} ${actionType}<span style="color: #999999"> (${formatNumber(
    percentage
  )}%)</span>`;
}

export function generateTaskCompletionString(data, key, percentageKey) {
  const statusKey = key === percentageKey ? 'inprogress' : 'completed';
  const actionType = key === percentageKey ? 'in progress' : 'completed';
  const percentage =
    data[
      key === percentageKey ? 'inProgressPercentage' : 'completedPercentage'
    ];

  const enquiryOrEnquiries = data[statusKey] > 1 ? 'tasks' : 'task';

  return `${formatNumber(
    data[statusKey]
  )} ${enquiryOrEnquiries} ${actionType}<span style="color: #999999"> (${formatNumber(
    percentage
  )}%)</span>`;
}

export function getChartPeriodFilter(period: ERangeDateType) {
  switch (period) {
    case ERangeDateType.SO_FAR_THIS_WEEK:
    case ERangeDateType.LAST_WEEK:
    case ERangeDateType.SO_FAR_THIS_MONTH:
    case ERangeDateType.LAST_MONTH:
      return EPeriodType.DAY;
    case ERangeDateType.SO_FAR_THIS_QUARTER:
    case ERangeDateType.LAST_QUARTER:
    case ERangeDateType.CUSTOM:
      return EPeriodType.WEEK;
    case ERangeDateType.ALL_TIME:
    case ERangeDateType.SO_FAR_THIS_YEAR:
    case ERangeDateType.LAST_YEAR:
      return EPeriodType.MONTH;
    default:
      return EPeriodType.MONTH;
  }
}

export function getChartPeriodLabelWidth(period: EPeriodType) {
  switch (period) {
    case EPeriodType.DAY:
      return CHART_LABEL_WIDTH.DAY;
    case EPeriodType.MONTH:
      return CHART_LABEL_WIDTH.MONTH;
    case EPeriodType.QUARTER:
      return CHART_LABEL_WIDTH.QUARTER;
    case EPeriodType.WEEK:
      return CHART_LABEL_WIDTH.WEEK;
    case EPeriodType.YEAR:
      return CHART_LABEL_WIDTH.YEAR;
  }
}

function getWeekLabel(currentDate, minDate, maxDate, dateFormat) {
  let startDate = currentDate.startOf('week');
  let endDate = currentDate.endOf('week');

  if (startDate.isBefore(minDate)) {
    startDate = dayjs.utc(minDate);
  }

  if (endDate.isAfter(maxDate)) {
    endDate = dayjs.utc(maxDate);
  }

  return `${startDate.format(
    dateFormat.DATE_FORMAT_DAY_MONTH_DAYJS
  )} - ${endDate.format(dateFormat.DATE_FORMAT_DAYJS)}`;
}
