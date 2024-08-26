import { EPeriodType } from '@trudi-ui';
import { ChartConfig } from '@trudi-ui';
import {
  ITimeSavedData,
  IPieChartDataConfig
} from '@/app/dashboard/modules/insights/interfaces/insights.interface';
import {
  ETimeSavedAnnotation,
  ETrendType
} from '@/app/dashboard/modules/insights/enums/insights.enum';
import { formatNumber } from '@/app/dashboard/modules/insights/utils/function';

export const PIE_CHART_SETTING = {
  [ETimeSavedAnnotation.AI_GENERATED_REPLIES]: {
    order: 1,
    title: 'AI-generated replies',
    color: '#FEDF73',
    badge: null,
    description: 'Saves {hours} minutes per message'
  },
  [ETimeSavedAnnotation.TRANSCRIBING_PHONE_CALLS]: {
    order: 2,
    title: 'Transcribing phone calls',
    color: '#88EAE4',
    badge: {
      variant: 'warning',
      icon: 'crownPro',
      text: 'Pro',
      bgColor: '#F1C012'
    },
    description: 'Saves {hours} minutes per transcription'
  },
  [ETimeSavedAnnotation.TRANSLATING_ENQUIRIES]: {
    order: 3,
    title: 'Translating enquiries in another language',
    color: '#F192C6',
    badge: {
      variant: 'warning',
      icon: 'crownPro',
      text: 'Pro',
      bgColor: '#F1C012'
    },
    description: 'Saves {hours} minutes per translation '
  },
  [ETimeSavedAnnotation.AI_ASSISTANT]: {
    order: 4,
    title: 'AI Assistant capturing incoming enquiries',
    color: '#B58BFB',
    description: 'Saves {hours} minutes per enquiry'
  }
};

export const donutChartTimeSavedConfig = (configs?) => {
  const config: ChartConfig<IPieChartDataConfig> = {
    data: [],
    annotation: [],
    height: 380,
    width: 380,
    settings: {
      bindingProperty: {
        bindColor: 'color',
        bindValue: 'percent'
      }
    },
    tooltip: {
      replaceFunction: (template: string, data: IPieChartDataConfig) => {
        const newTemp = template
          .replace(/tooltip_value/, `${data.percent}%`)
          .replace(
            /tooltip_header/,
            `${formatNumber(data.count)} ${data.title}`
          )
          .replace(
            /tooltip_footer/,
            `Saving ${formatNumber(data.hours)} ${
              data.hours === 1 ? 'hour' : 'hours'
            }`
          );
        return newTemp;
      }
    },
    ...configs
  };
  return config;
};

export const barChartTimeSavedConfig = (configs?) => {
  const config: ChartConfig<ITimeSavedData> = {
    data: [],
    height: 500,
    settings: {
      bindingProperty: {
        bindValue: 'totalTimeSaved',
        bindColor: 'rgba(51, 187, 178, 0.50)',
        bindLabel: 'timeCollection'
      },
      interactionStatesHover: {
        mouseOver: {
          timeCollection: 'rgba(51, 187, 178, 1)'
        },
        mouseOut: {
          timeCollection: 'rgba(51, 187, 178, 0.50)'
        }
      }
    },
    tooltip: {
      replaceFunction: (template: string, data: ITimeSavedData) => {
        const newTemp = template
          ?.replace(/tooltip_date/, `${data?.timeCollection}`)
          .replace(
            /tooltip_hours/,
            `${formatNumber(data?.totalTimeSaved)} ${
              data?.totalTimeSaved === 1 ? 'hour' : 'hours'
            } saved`
          )
          .replace(
            /tooltip_trend/,
            `<div class="${
              data.isUpTrend === ETrendType.EQUAL
                ? 'no-data-trend'
                : data.isUpTrend === ETrendType.UP
                ? 'data-trend-up'
                : 'data-trend-down'
            }">
        <img src="${
          data.isUpTrend === ETrendType.EQUAL
            ? ''
            : data.isUpTrend === ETrendType.UP
            ? '/assets/icon/trend-up.svg'
            : '/assets/icon/trend-down.svg'
        }" />
           ${
             formatNumber(data?.percent) || data?.percent === 0
               ? `${formatNumber(data?.percent)}%`
               : '--'
           }
         </div>`
          );
        return newTemp;
      }
    },
    annotation: [],
    ...configs
  };
  return config;
};

export const lineChartTimeSavedConfig = (configs?) => {
  const config: ChartConfig<ITimeSavedData> = {
    data: [],
    height: 500,
    periodType: EPeriodType.MONTH,
    settings: {
      lineColor: '#33BAB1',
      areaDataColor: '#E9F9F8',
      bindingProperty: {
        bindValue: 'totalTimeSaved',
        bindLabel: 'timeCollection'
      }
    },
    tooltip: {
      replaceFunction: (template: string, data: ITimeSavedData) => {
        const newTemp = template
          .replace(/tooltip_date/, `${data.dateTooltip}`)
          .replace(
            /tooltip_hours/,
            `${formatNumber(data.totalTimeSaved)} ${
              data?.totalTimeSaved === 1 ? 'hour' : 'hours'
            } saved`
          )
          .replace(
            /tooltip_trend/,
            `<div class="${
              data.isUpTrend === ETrendType.EQUAL
                ? 'no-data-trend'
                : data.isUpTrend === ETrendType.UP
                ? 'data-trend-up'
                : 'data-trend-down'
            }">
          <img src="${
            data.isUpTrend === ETrendType.EQUAL
              ? ''
              : data.isUpTrend === ETrendType.UP
              ? '/assets/icon/trend-up.svg'
              : '/assets/icon/trend-down.svg'
          }" />
             ${
               formatNumber(data?.percent) || data?.percent === 0
                 ? `${formatNumber(data?.percent)}%`
                 : '--'
             }
           </div>`
          );
        return newTemp;
      }
    },
    ...configs
  };

  return config;
};
