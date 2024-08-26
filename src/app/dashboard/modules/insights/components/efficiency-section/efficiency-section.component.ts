import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { Subject, first, take, takeUntil } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { CHART_LABEL_WIDTH, EChartType, EPeriodType } from '@trudi-ui';
import { ChartConfig } from '@trudi-ui';
import {
  ERangeDateType,
  ETrendType
} from '@/app/dashboard/modules/insights/enums/insights.enum';
import { IEfficiencyData } from '@/app/dashboard/modules/insights/interfaces/insights.interface';
import {
  calculateTrendData,
  getDataLineChartByPeriod,
  groupDataByPeriod,
  sortDataAscending
} from '@/app/dashboard/modules/insights/utils/group-data';
import {
  formatNumber,
  getTypeOfProperty
} from '@/app/dashboard/modules/insights/utils/function';
import { CountryService } from '@/app/dashboard/services/country.service';

@Component({
  selector: 'efficiency-section',
  templateUrl: './efficiency-section.component.html',
  styleUrls: ['./efficiency-section.component.scss']
})
export class EfficiencySectionComponent implements OnInit, OnDestroy {
  @Input() efficiencyData: IEfficiencyData[] = [];
  @Input() rangeDateType: ERangeDateType = ERangeDateType.LAST_WEEK;
  @Input() isFilterInsightForEntireTeam: boolean = true;
  public EChartType = EChartType;
  public currentPeriodType = EPeriodType.DAY;
  public currentChartType = EChartType.LINE;
  public LIST_PERIOD_TYPE = [
    {
      label: 'Day',
      value: EPeriodType.DAY
    },
    {
      label: 'Week',
      value: EPeriodType.WEEK
    },

    {
      label: 'Month',
      value: EPeriodType.MONTH
    },

    {
      label: 'Quarter',
      value: EPeriodType.QUARTER
    },
    {
      label: 'Year',
      value: EPeriodType.YEAR
    }
  ];
  public LIST_CHART_TYPE = [
    {
      label: 'Line chart',
      value: EChartType.LINE
    },
    {
      label: 'Bar chart',
      value: EChartType.BAR
    }
  ];

  public lineChartConfig: ChartConfig<IEfficiencyData> = {
    data: [],
    height: 600,
    settings: {
      lineColor: '#33BAB1',
      areaDataColor: '#E9F9F8',
      bindingProperty: {
        bindValue: 'propertyActivePerTeam',
        bindLabel: 'timeCollection'
      }
    },
    periodType: EPeriodType.MONTH,
    tooltip: {
      replaceFunction: (template: string, data: IEfficiencyData) => {
        return this.handleDisplayTooltip(template, data);
      }
    }
  };
  public barChartConfig: ChartConfig<IEfficiencyData> = {
    data: [],
    height: 500,
    settings: {
      bindingProperty: {
        bindValue: 'propertyActivePerTeam',
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
      replaceFunction: (template: string, data: IEfficiencyData) => {
        return this.handleDisplayTooltip(template, data);
      }
    },
    annotation: []
  };
  public listEfficiencies: IEfficiencyData[] = [];
  public propertyTextByCountry: string = '';
  public currentCountry: string;
  private _destroy$ = new Subject<void>();

  constructor(
    private agencyDateFormatService: AgencyDateFormatService,
    private countryService: CountryService
  ) {}
  ngOnChanges(changes: SimpleChanges) {
    if (changes['rangeDateType'] || changes['efficiencyData']) {
      this.getEfficiencyData();
    }
  }
  ngOnInit(): void {
    this.getEfficiencyData();
    this.countryService.currentInformationCountry$
      .pipe(takeUntil(this._destroy$))
      .subscribe((currentInforCountry) => {
        this.propertyTextByCountry = currentInforCountry.propertyTextByCountry;
        this.currentCountry = currentInforCountry.countryName;
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  getEfficiencyData() {
    this.listEfficiencies = sortDataAscending(this.efficiencyData);
    if (!!this.listEfficiencies) {
      this.filterDisplayChartByRangeDateType(this.rangeDateType);
    }
  }

  onHandleChangePeriodType(value) {
    this.currentPeriodType = value;
    this.onBuildChart(value, this.currentChartType);
  }

  onHandleChangeChartType(value) {
    this.currentChartType = value;
    this.onBuildChart(this.currentPeriodType, value);
  }

  onBuildChart(periodType, chartType) {
    if (chartType === EChartType.LINE) {
      this.getDataLineChartByPeriod(periodType);
    } else if (chartType === EChartType.BAR) {
      this.getDataBarChartByPeriod(periodType);
    }
  }

  getDataLineChartByPeriod(period) {
    let lastIndex = this.listEfficiencies.length - 1;
    this.lineChartConfig = {
      ...this.lineChartConfig,
      minLabel: this.listEfficiencies[0]?.timeCollection,
      maxLabel: this.listEfficiencies[lastIndex]?.timeCollection
    };
    this.agencyDateFormatService.dateFormat$
      .pipe(takeUntil(this._destroy$), first(Boolean))
      .subscribe((dateFormat) => {
        let tempData = cloneDeep(this.listEfficiencies);
        // Group data by period
        let groupDataChart = getDataLineChartByPeriod(
          dateFormat,
          tempData,
          period,
          'timeCollection',
          ['propertyActive', 'teamMembers', 'totalProperties'],
          true
        );
        // Calculate percent , data trend, property/ working day
        let modifiedData = this.modifyDataForBindChart(groupDataChart, period);

        this.lineChartConfig = {
          ...this.lineChartConfig,
          periodType: period,
          dateFormat: dateFormat,
          data: modifiedData
        };
      });
  }

  getDataBarChartByPeriod(period) {
    this.agencyDateFormatService.dateFormat$
      .pipe(take(1))
      .subscribe((dateFormat) => {
        let tempData = cloneDeep(this.listEfficiencies);
        tempData = tempData.map((i) => ({
          ...i,
          timeCollectionDefault: i.timeCollection
        }));
        // Group data by period
        let groupDataChart = groupDataByPeriod(
          tempData,
          period,
          ['propertyActive', 'teamMembers', 'totalProperties'],
          dateFormat,
          true
        ) as IEfficiencyData[];
        // Calculate percent , data trend, property/ working day
        let modifiedData = this.modifyDataForBindChart(groupDataChart, period);

        this.barChartConfig = {
          ...this.barChartConfig,
          labelWidth: Number(CHART_LABEL_WIDTH[period]),
          data: calculateTrendData(modifiedData, 'propertyActivePerTeam')
        };
      });
  }

  calculatePropertyPerTeam(data, period) {
    if (period === EPeriodType.DAY) {
      return data.map((item) => ({
        ...item,
        propertyActivePerTeam: item.propertyActive
      }));
    }
    return data.map((item) => {
      let workingDays =
        item?.totalItemHasValue > 0 ? item?.totalItemHasValue : 1;

      return {
        ...item,
        propertyActivePerTeam: Number.isInteger(
          item.propertyActive / workingDays
        )
          ? item.propertyActive / workingDays
          : Math.round((item.propertyActive / workingDays) * 100) / 100,
        totalProperties: Number.isInteger(item.totalProperties / workingDays)
          ? item.totalProperties / workingDays
          : Math.round((item.totalProperties / workingDays) * 100) / 100,
        teamMembers: Number.isInteger(item.teamMembers / workingDays)
          ? item.teamMembers / workingDays
          : Math.round((item.teamMembers / workingDays) * 100) / 100
      };
    });
  }

  modifyDataForBindChart(data, type) {
    let tempData = this.calculatePropertyPerTeam(data, type);
    return calculateTrendData(tempData, 'propertyActivePerTeam');
  }

  filterDisplayChartByRangeDateType(rangeDateType) {
    switch (rangeDateType) {
      case ERangeDateType.SO_FAR_THIS_WEEK:
      case ERangeDateType.LAST_WEEK:
      case ERangeDateType.SO_FAR_THIS_MONTH:
      case ERangeDateType.LAST_MONTH: {
        this.currentPeriodType = EPeriodType.DAY;
        if (this.currentChartType === EChartType.LINE) {
          this.getDataLineChartByPeriod(EPeriodType.DAY);
        } else if (this.currentChartType === EChartType.BAR) {
          this.getDataBarChartByPeriod(EPeriodType.DAY);
        }
        break;
      }
      case ERangeDateType.SO_FAR_THIS_QUARTER:
      case ERangeDateType.LAST_QUARTER:
      case ERangeDateType.CUSTOM: {
        this.currentPeriodType = EPeriodType.WEEK;
        if (this.currentChartType === EChartType.LINE) {
          this.getDataLineChartByPeriod(EPeriodType.WEEK);
        } else if (this.currentChartType === EChartType.BAR) {
          this.getDataBarChartByPeriod(EPeriodType.WEEK);
        }
        break;
      }
      case ERangeDateType.SO_FAR_THIS_YEAR:
      case ERangeDateType.LAST_YEAR:
      case ERangeDateType.ALL_TIME: {
        this.currentPeriodType = EPeriodType.MONTH;
        if (this.currentChartType === EChartType.LINE) {
          this.getDataLineChartByPeriod(EPeriodType.MONTH);
        } else if (this.currentChartType === EChartType.BAR) {
          this.getDataBarChartByPeriod(EPeriodType.MONTH);
        }
        break;
      }
    }
  }
  handleDisplayTooltip(template: string, data: IEfficiencyData) {
    const propertyTextTooltip = getTypeOfProperty(
      data.propertyActivePerTeam,
      this.currentCountry
    );

    return template
      .replace(/tooltip_date/, `${data.dateTooltip ?? data.timeCollection}`)
      .replace(
        /tooltip_property/,
        `${formatNumber(
          data.propertyActivePerTeam
        )} ${propertyTextTooltip} per team member`
      )
      .replace(
        /tooltip_data/,
        this.isFilterInsightForEntireTeam
          ? `${formatNumber(
              data.totalProperties
            )} ${propertyTextTooltip} / ${formatNumber(data.teamMembers)} ${
              data.teamMembers === 1 ? 'team member' : 'team members'
            }`
          : ''
      )
      .replace(
        /tooltip_data_percent/,
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
  }
}
