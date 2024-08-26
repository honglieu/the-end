import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import {
  PIE_CHART_SETTING,
  barChartTimeSavedConfig,
  donutChartTimeSavedConfig,
  lineChartTimeSavedConfig
} from './utils/config-chart';

import { CHART_LABEL_WIDTH, EChartType, EPeriodType } from '@trudi-ui';

import {
  calculateTrendData,
  getChartPeriodFilter,
  getDataLineChartByPeriod,
  groupDataByPeriod
} from '@/app/dashboard/modules/insights/utils/group-data';
import {
  IBreakDownTimeSavedData,
  ITimeSavedData
} from '@/app/dashboard/modules/insights/interfaces/insights.interface';
import { ERangeDateType } from '@/app/dashboard/modules/insights/enums/insights.enum';
import {
  AgencyDateFormatService,
  RegionDateFormat
} from '@/app/dashboard/services/agency-date-format.service';
import { Subject, take } from 'rxjs';
import { cloneDeep } from 'lodash-es';

@Component({
  selector: 'time-savings-section',
  templateUrl: './time-savings-section.component.html',
  styleUrls: ['./time-savings-section.component.scss']
})
export class TimeSavingsSectionComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() breakDownTimeSavedData: IBreakDownTimeSavedData;
  @Input() timeSavingData: ITimeSavedData[] = [];
  @Input() rangeDateType: ERangeDateType;

  public destroy$ = new Subject<void>();
  public dateFormat: RegionDateFormat;
  public readonly EChartType = EChartType;
  public readonly chartTypeDropdown = [
    {
      id: EChartType.BAR,
      label: 'Bar chart'
    },
    {
      id: EChartType.LINE,
      label: 'Line chart'
    }
  ];
  public readonly chartPeriodDropdown = [
    {
      id: EPeriodType.DAY,
      label: 'Day'
    },
    {
      id: EPeriodType.WEEK,
      label: 'Week'
    },
    {
      id: EPeriodType.MONTH,
      label: 'Month'
    },
    {
      id: EPeriodType.QUARTER,
      label: 'Quarter'
    },
    {
      id: EPeriodType.YEAR,
      label: 'Year'
    }
  ];

  public currentChartType = EChartType.BAR;

  public currentChartPeriod = null;

  public barChartConfigs = barChartTimeSavedConfig();
  public donutChartConfigs = donutChartTimeSavedConfig();
  public lineChartConfigs = lineChartTimeSavedConfig();

  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rangeDateType']) {
      this.currentChartPeriod = getChartPeriodFilter(this.rangeDateType);
    }
    if (changes['timeSavingData']) {
      this.buildTotalTimeSaved();
    }
    if (changes['breakDownTimeSavedData']) {
      let totalHours = 0;
      let pieChartData = [];
      let pieChartAnnotation = [];
      if (this.breakDownTimeSavedData) {
        totalHours = Object.values(this.breakDownTimeSavedData).reduce(
          (sum, obj) => sum + obj?.value || 0,
          0
        );
        let totalPercent = 0;
        Object.entries(this.breakDownTimeSavedData)
          ?.sort(
            (a, b) =>
              PIE_CHART_SETTING[a[0]]?.order - PIE_CHART_SETTING[b[0]]?.order
          )
          .forEach(([key, data], index, arr) => {
            const pieType = PIE_CHART_SETTING?.[key];

            pieChartAnnotation.push({
              order: pieType?.order,
              description: pieType?.description.replace(
                '{hours}',
                `${data?.numbers || 0}`
              ),
              badge: pieType?.badge,
              title: pieType?.title,
              color: pieType?.color
            });

            if (!totalHours) return;

            const hours = data?.value || 0;
            const percent = totalHours
              ? Number.parseFloat(((hours / totalHours) * 100).toFixed(2))
              : 0;

            const isLast = index === arr.length - 1;
            if (!isLast) totalPercent += percent;

            let lastPercent = isLast ? 100 - totalPercent : percent;
            lastPercent = Number.parseFloat(lastPercent.toFixed(2));

            pieChartData.push({
              title: pieType?.title,
              color: pieType?.color,
              type: key,
              count: data?.hours || 0,
              number: data?.numbers || 0,
              hours,
              percent: lastPercent
            });
          });
      }

      this.donutChartConfigs = {
        ...this.donutChartConfigs,
        data: pieChartData,
        annotation: pieChartAnnotation.sort((a, b) => a.order - b.order)
      };
    }
  }

  buildTotalTimeSaved() {
    if (!this.timeSavingData?.length) return;
    const timeSaved = cloneDeep(this.timeSavingData);

    this.agencyDateFormatService.dateFormat$
      .pipe(take(1))
      .subscribe((dateFormat) => {
        if (this.currentChartType === EChartType.BAR) {
          let modifiedData = groupDataByPeriod(
            timeSaved,
            this.currentChartPeriod,
            ['totalTimeSaved'],
            dateFormat
          );
          this.barChartConfigs = {
            ...this.barChartConfigs,
            data: calculateTrendData(modifiedData, 'totalTimeSaved'),
            labelWidth: Number(CHART_LABEL_WIDTH[this.currentChartPeriod])
          };
        } else if (this.currentChartType === EChartType.LINE) {
          let lastIndex = this.timeSavingData.length - 1;
          let modifiedData = getDataLineChartByPeriod(
            dateFormat,
            timeSaved,
            this.currentChartPeriod,
            'timeCollection',
            ['totalTimeSaved']
          );
          this.lineChartConfigs = {
            ...this.lineChartConfigs,
            data: calculateTrendData(modifiedData, 'totalTimeSaved'),
            periodType: this.currentChartPeriod,
            dateFormat: dateFormat,
            minLabel: this.timeSavingData[0].timeCollection,
            maxLabel: this.timeSavingData[lastIndex].timeCollection
          };
        }
      });
  }
  onHandleChangeChartType(value) {
    this.currentChartType = value;
    this.buildTotalTimeSaved();
  }

  onHandleChangePeriodType(value) {
    this.currentChartPeriod = value;
    this.buildTotalTimeSaved();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
