import { EPeriodType } from './chart.constant';

type RegionDateFormat = {
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
export interface ChartAnnotation {
  color: string;
  title: string;
  description?: string;
  badge?: {
    variant: string;
    text: string;
    icon: string;
    bgColor: string;
    color?: string;
  };
}

export interface ChartConfig<T> {
  data: T[];
  annotation?: ChartAnnotation[];
  tooltip?: {
    replaceFunction?: (replaceString: string, arg1: T, arg2?: string) => string;
  };
  width?: number;
  height: number;
  labelWidth?: number;
  settings: {
    interactionStatesHover?: {
      mouseOver: {
        [key: string]: string;
      };
      mouseOut: {
        [key: string]: string;
      };
    };
    bindingProperty?: {
      bindValue: string;
      bindColor?: string;
      bindLabel?: string;
    };
    colorConfig?: string[];
    lineColor?: string;
    areaDataColor?: string;
    groups?: string[];
  };
  periodType?: EPeriodType;
  dateFormat?: RegionDateFormat;
  minLabel?: string | number | Date;
  maxLabel?: string | number | Date;
}
