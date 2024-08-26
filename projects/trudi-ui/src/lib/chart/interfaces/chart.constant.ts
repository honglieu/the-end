export enum EPeriodType {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  QUARTER = 'QUARTER'
}
export enum EChartType {
  DONUT = 'DONUT',
  LINE = 'LINE',
  BAR = 'BAR'
}
export enum CHART_LABEL_WIDTH {
  DAY = 80,
  MONTH = 105,
  QUARTER = 110,
  WEEK = 160,
  YEAR = 95
}
export const MIN_LABEL_INTERVAL = 3;

export enum MAX_DATA_LENGTH_FOR_POINT_DISTANCE {
  TABLET = 5,
  LAPTOP = 8,
  DESKTOP = 10
}

export enum CHART_DISPLAY_MODE {
  TABLET = 1024,
  LAPTOP = 1400
}

export enum ZoomLevel {
  Low = 5,
  MediumLow = 6,
  Medium = 7,
  MediumHigh = 8,
  High = 9
}

export const spacingChartConfig = {
  [CHART_LABEL_WIDTH.DAY]: {
    marginLeft: 50,
    marginRight: 50
  },
  [CHART_LABEL_WIDTH.MONTH]: {
    marginLeft: 30,
    marginRight: 30
  },
  [CHART_LABEL_WIDTH.YEAR]: {
    marginLeft: 25,
    marginRight: 25
  },
  [CHART_LABEL_WIDTH.WEEK]: {
    marginLeft: 60,
    marginRight: 60
  },
  [CHART_LABEL_WIDTH.QUARTER]: {
    marginLeft: 20,
    marginRight: 20
  }
};
