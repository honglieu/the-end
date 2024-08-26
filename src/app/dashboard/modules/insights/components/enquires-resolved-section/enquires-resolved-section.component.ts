import { Component, OnInit } from '@angular/core';
import { ChartAnnotation, ChartConfig } from '@trudi-ui';
import { StackBarChartData } from '@trudi-ui';
import {
  EEnquiriesType,
  ETrendType,
  PercentageType
} from '@/app/dashboard/modules/insights/enums/insights.enum';
import { InsightsApiService } from '@/app/dashboard/modules/insights/services/insights-api.service';
import { EPeriodType, CHART_LABEL_WIDTH } from '@trudi-ui';
import {
  calculateTrendDataStackBar,
  convertToPercentageStackbar,
  groupDataByPeriod,
  getTrendImagePath,
  sortDataAscending,
  formatPercentage,
  getChartPeriodFilter,
  getChartPeriodLabelWidth,
  generateEnquiriesString,
  getStatusImgClass
} from '@/app/dashboard/modules/insights/utils/group-data';
import { InsightsService } from '@/app/dashboard/modules/insights/services/insights.service';
import { Subject, switchMap, takeUntil } from 'rxjs';
import {
  AgencyDateFormatService,
  RegionDateFormat
} from '@/app/dashboard/services/agency-date-format.service';
import { IEEnquiriesTypeFilter } from '@/app/dashboard/modules/insights/interfaces/insights.interface';

@Component({
  selector: 'enquires-resolved-section',
  templateUrl: './enquires-resolved-section.component.html',
  styleUrls: ['./enquires-resolved-section.component.scss']
})
export class EnquiresResolvedSectionComponent implements OnInit {
  public dataEnquiries: StackBarChartData[];
  private insightsFilter;
  private conversationTypeValue = EEnquiriesType.ALL;
  public periodValue = EPeriodType.DAY;
  public dataStackBarChart: StackBarChartData[];
  public isSelectedUrgent = false;
  public dateFormat: RegionDateFormat;
  private destroy$: Subject<void> = new Subject();
  public isLoading: boolean = true;
  public annotation: ChartAnnotation[] = [
    {
      color: 'rgba(51, 187, 178, 0.50)',
      title: 'Enquiries resolved'
    },
    {
      color: 'rgba(242, 245, 247, 1)',
      title: 'Enquiries open'
    }
  ];

  public period = [
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

  public conversationTypeFilter: IEEnquiriesTypeFilter[] = [];

  public configStackBarChart: ChartConfig<StackBarChartData> = {
    annotation: this.annotation,
    data: [],
    height: 500,
    tooltip: {
      replaceFunction: (
        replaceString: string,
        data: StackBarChartData,
        key: string
      ) => {
        let percentageKey = PercentageType.IN_PROGRESS;
        const percentageData =
          key === percentageKey
            ? data['percentInProgress']
            : data['percentCompleted'];
        const text = replaceString
          .replace(/tooltip_header/, data['timeCollection'])
          .replace(
            /tooltip_body/,
            `${generateEnquiriesString(data, key, percentageKey)}`
          )

          .replace(/tooltip_footer/, `${formatPercentage(percentageData)} `)
          .replace(
            /tooltip_icon_footer/,
            `<img class=${getStatusImgClass(percentageData)} src="${
              key === percentageKey
                ? getTrendImagePath(
                    data.isUpTrendInprogress === ETrendType.EQUAL,
                    data.isUpTrendInprogress === ETrendType.UP
                  )
                : getTrendImagePath(
                    data.isUpTrendCompleted === ETrendType.EQUAL,
                    data.isUpTrendCompleted === ETrendType.UP
                  )
            }" />`
          );
        return text;
      }
    },
    settings: {
      bindingProperty: {
        bindLabel: 'timeCollection',
        bindValue: null
      },
      interactionStatesHover: {
        mouseOver: {
          completedPercentage: 'rgba(51, 187, 178, 1)',
          inProgressPercentage: 'rgba(216, 220, 223, 1)'
        },
        mouseOut: {
          completedPercentage: 'rgba(51, 187, 178, 0.50)',
          inProgressPercentage: 'rgba(242, 245, 247, 1)'
        }
      },
      colorConfig: ['rgba(51, 187, 178, 0.50)', 'rgba(242, 245, 247, 1)'],
      groups: ['completedPercentage', 'inProgressPercentage']
    }
  };

  constructor(
    private insightsService: InsightsService,
    private insightsApiService: InsightsApiService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}
  ngOnInit(): void {
    this.agencyDateFormatService.dateFormat$.subscribe((dateFormat) => {
      this.dateFormat = dateFormat;
    });

    this.insightsService.insightsFilter$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((insightsFilter) => {
          this.isLoading = true;
          this.insightsFilter = insightsFilter;
          return this.insightsApiService.getEnquiryChart({
            ...insightsFilter,
            isUrgent: this.isSelectedUrgent,
            conversationType: this.conversationTypeValue
          });
        })
      )
      .subscribe((res) => {
        const typePeriodFilter = getChartPeriodFilter(this.insightsFilter.type);
        this.periodValue = typePeriodFilter;

        this.dataStackBarChart = sortDataAscending(res.chartData);
        this.conversationTypeFilter = res.conversationTypeFilter || [];
        const dataConvertToPercentage = convertToPercentageStackbar(
          groupDataByPeriod(
            this.dataStackBarChart,
            this.periodValue,
            ['inprogress', 'completed'],
            this.dateFormat
          )
        );
        this.configStackBarChart = {
          ...this.configStackBarChart,
          labelWidth: getChartPeriodLabelWidth(this.periodValue),
          data: calculateTrendDataStackBar(dataConvertToPercentage)
        };
        this.isLoading = false;
      });
  }

  handleChangeCheckBox() {
    this.isLoading = true;
    this.insightsApiService
      .getEnquiryChart({
        ...this.insightsFilter,
        isUrgent: this.isSelectedUrgent,
        conversationType: this.conversationTypeValue
      })
      .subscribe((res) => {
        this.dataStackBarChart = sortDataAscending(res.chartData);
        this.handleChangePeriod(this.periodValue);
        this.isLoading = false;
      });
  }

  handleChangeEnquiries($event) {
    this.conversationTypeValue = $event;
    this.isLoading = true;
    let valueUserActivities = this.insightsService
      .getInsightUserActivities()
      .getValue();
    this.insightsService.setInsightUserActivities({
      ...valueUserActivities,
      isUrgent: this.isSelectedUrgent
    });
    this.insightsApiService
      .getEnquiryChart({
        ...this.insightsFilter,
        isUrgent: this.isSelectedUrgent,
        conversationType: this.conversationTypeValue
      })
      .subscribe((res) => {
        this.dataStackBarChart = sortDataAscending(res.chartData);
        this.handleChangePeriod(this.periodValue);
        this.isLoading = false;
      });
  }
  handleChangePeriod($event) {
    switch ($event) {
      case EPeriodType.DAY: {
        const dataConvertToPercentage = convertToPercentageStackbar(
          groupDataByPeriod(
            this.dataStackBarChart,
            EPeriodType.DAY,
            ['inprogress', 'completed'],
            this.dateFormat
          )
        );
        this.configStackBarChart = {
          ...this.configStackBarChart,
          labelWidth: CHART_LABEL_WIDTH.DAY,
          data: calculateTrendDataStackBar(dataConvertToPercentage)
        };
        break;
      }
      case EPeriodType.MONTH: {
        const dataConvertToPercentage = convertToPercentageStackbar(
          groupDataByPeriod(
            this.dataStackBarChart,
            EPeriodType.MONTH,
            ['inprogress', 'completed'],
            this.dateFormat
          )
        );
        this.configStackBarChart = {
          ...this.configStackBarChart,
          labelWidth: CHART_LABEL_WIDTH.MONTH,
          data: calculateTrendDataStackBar(dataConvertToPercentage)
        };
        break;
      }
      case EPeriodType.WEEK: {
        const dataConvertToPercentage = convertToPercentageStackbar(
          groupDataByPeriod(
            this.dataStackBarChart,
            EPeriodType.WEEK,
            ['inprogress', 'completed'],
            this.dateFormat
          )
        );
        this.configStackBarChart = {
          ...this.configStackBarChart,
          labelWidth: CHART_LABEL_WIDTH.WEEK,
          data: calculateTrendDataStackBar(dataConvertToPercentage)
        };
        break;
      }
      case EPeriodType.QUARTER: {
        const dataConvertToPercentage = convertToPercentageStackbar(
          groupDataByPeriod(
            this.dataStackBarChart,
            EPeriodType.QUARTER,
            ['inprogress', 'completed'],
            this.dateFormat
          )
        );
        this.configStackBarChart = {
          ...this.configStackBarChart,
          labelWidth: CHART_LABEL_WIDTH.QUARTER,
          data: calculateTrendDataStackBar(dataConvertToPercentage)
        };
        break;
      }
      case EPeriodType.YEAR: {
        const dataConvertToPercentage = convertToPercentageStackbar(
          groupDataByPeriod(
            this.dataStackBarChart,
            EPeriodType.YEAR,
            ['inprogress', 'completed'],
            this.dateFormat
          )
        );
        this.configStackBarChart = {
          ...this.configStackBarChart,
          labelWidth: CHART_LABEL_WIDTH.YEAR,
          data: calculateTrendDataStackBar(dataConvertToPercentage)
        };
        break;
      }
    }
  }
}
