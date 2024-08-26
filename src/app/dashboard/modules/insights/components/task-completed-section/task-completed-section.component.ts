import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChartAnnotation, ChartConfig } from '@trudi-ui';
import { StackBarChartData } from '@trudi-ui';
import { InsightsApiService } from '@/app/dashboard/modules/insights/services/insights-api.service';
import { Subject, filter, switchMap, takeUntil } from 'rxjs';
import { EPeriodType, CHART_LABEL_WIDTH } from '@trudi-ui';
import {
  IInsightTaskName,
  ITaskCompletedData
} from '@/app/dashboard/modules/insights/interfaces/insights.interface';
import {
  ETaskCompletedType,
  ETrendType,
  PercentageType
} from '@/app/dashboard/modules/insights/enums/insights.enum';
import {
  calculateTrendDataStackBar,
  convertToPercentageStackbar,
  formatPercentage,
  generateTaskCompletionString,
  getChartPeriodFilter,
  getChartPeriodLabelWidth,
  getStatusImgClass,
  getTrendImagePath,
  groupDataByPeriod,
  sortDataAscending
} from '@/app/dashboard/modules/insights/utils/group-data';
import { InsightsService } from '@/app/dashboard/modules/insights/services/insights.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  AgencyDateFormatService,
  RegionDateFormat
} from '@/app/dashboard/services/agency-date-format.service';

@Component({
  selector: 'task-completed-section',
  templateUrl: './task-completed-section.component.html',
  styleUrls: ['./task-completed-section.component.scss']
})
export class TaskCompletedSectionComponent implements OnInit, OnDestroy {
  public annotation: ChartAnnotation[] = [
    {
      color: 'rgba(51, 187, 178, 0.50)',
      title: 'Tasks completed'
    },
    {
      color: 'rgba(242, 245, 247, 1)',
      title: 'Tasks in progress'
    }
  ];
  private unsubscribe = new Subject<void>();
  public currentPeriodType = EPeriodType.DAY;
  public completedTaskOptions: IInsightTaskName[] = [];
  public selectedTasks: string[] = [];
  public customTitle?: string;
  public completedTasksGroupBy: ITaskCompletedData;
  public selectedTasksGroupBy: ITaskCompletedData;
  public totalPublishedTasks: number = 0;
  public totalArchivedTasks: number = 0;
  public totalSelectedPublishedTasks: number = 0;
  public totalSelectedArchivedTasks: number = 0;
  private currentAgencyId: string;
  private insightsFilter;
  private previousSelectedTask: string[] = [];

  private dateFormat: RegionDateFormat;
  public titleGroupTask: string[] = [];

  public isLoading: boolean = true;

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

  private destroy$: Subject<void> = new Subject();
  public dataStackBarChart;
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
            `${generateTaskCompletionString(data, key, percentageKey)}`
          )

          .replace(/tooltip_footer/, `${formatPercentage(percentageData)}`)
          .replace(
            /tooltip_icon_footer/,
            `
            <img class=${getStatusImgClass(percentageData)} src="${
              key === percentageKey
                ? getTrendImagePath(
                    data.isUpTrendInprogress === ETrendType.EQUAL,
                    data.isUpTrendInprogress === ETrendType.UP
                  )
                : getTrendImagePath(
                    data.isUpTrendCompleted === ETrendType.EQUAL,
                    data.isUpTrendCompleted === ETrendType.UP
                  )
            }" />
       `
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
    private agencyService: AgencyService,
    private insightsService: InsightsService,
    private insightsApiService: InsightsApiService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}
  ngOnInit(): void {
    this.agencyDateFormatService.dateFormat$.subscribe((dateFormat) => {
      this.dateFormat = dateFormat;
    });

    this.agencyService.listTask$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => !!res)
      )
      .subscribe((res) => {
        this.sortTasksByName(res['ARCHIVED']);
        this.sortTasksByName(res['PUBLISHED']);
        const sortDataTaskList = Object.keys(res).sort((a, b) => {
          if (a === ETaskCompletedType.PUBLISHED) {
            return -1;
          } else if (b === ETaskCompletedType.PUBLISHED) {
            return 1;
          } else {
            return 0;
          }
        });
        const mappedDataTaskList = sortDataTaskList.reduce((result, status) => {
          let titleTask = status + ' TASKS';
          this.titleGroupTask.push(titleTask);
          const statusData = res[status].map((item) => ({
            ...item,
            status,
            titleTask
          }));
          return [...result, ...statusData];
        }, []);
        this.completedTaskOptions = mappedDataTaskList;
        this.totalPublishedTasks = res[ETaskCompletedType.PUBLISHED].length;
        this.totalArchivedTasks = res[ETaskCompletedType.ARCHIVED].length;
        this.compareCountData(this.completedTaskOptions, this.selectedTasks);
      });

    this.insightsService.insightsFilter$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((insightsFilter) => {
          this.isLoading = true;
          this.insightsFilter = insightsFilter;
          return this.insightsApiService.getTaskData({
            ...insightsFilter,
            taskNameIds: []
          });
        })
      )
      .subscribe((res) => {
        const typePeriodFilter = getChartPeriodFilter(this.insightsFilter.type);
        this.currentPeriodType = typePeriodFilter;
        this.dataStackBarChart = sortDataAscending(res);
        const dataConvertToPercentage = convertToPercentageStackbar(
          groupDataByPeriod(
            this.dataStackBarChart,
            this.currentPeriodType,
            ['inprogress', 'completed'],
            this.dateFormat
          )
        );
        this.configStackBarChart = {
          ...this.configStackBarChart,
          labelWidth: getChartPeriodLabelWidth(this.currentPeriodType),
          data: calculateTrendDataStackBar(dataConvertToPercentage)
        };
        this.isLoading = false;
      });
  }

  sortTasksByName(tasks: IInsightTaskName[]) {
    tasks?.sort((taskA, taskB) => {
      const nameTaskA = taskA.name.toLowerCase();
      const nameTaskB = taskB.name.toLowerCase();
      if (nameTaskA < nameTaskB) {
        return -1;
      }
      if (nameTaskA > nameTaskB) {
        return 1;
      }
      return 0;
    });
  }

  handleVisibleChange($event) {
    if (!$event) {
      let allSelectedTasksExist = this.selectedTasks.every((value) => {
        return (
          this.previousSelectedTask.includes(value) &&
          this.previousSelectedTask.length === this.selectedTasks.length
        );
      });
      if (
        this.previousSelectedTask.length > 0 &&
        this.selectedTasks.length === 0
      ) {
        allSelectedTasksExist = false;
      }
      if (!allSelectedTasksExist) {
        this.isLoading = true;

        let valueUserActivities = this.insightsService
          .getInsightUserActivities()
          .getValue();
        this.insightsService.setInsightUserActivities({
          ...valueUserActivities,
          taskNameIds: this.selectedTasks
        });
        this.insightsApiService
          .getTaskData({
            agencyId: this.currentAgencyId,
            ...this.insightsFilter,
            taskNameIds: this.selectedTasks
          })
          .subscribe((res) => {
            this.dataStackBarChart = res;
            this.handleChangePeriodType(this.currentPeriodType);
            this.handleValueChange(this.selectedTasks);
            this.previousSelectedTask = this.selectedTasks;
            this.isLoading = false;
          });
      }
    }
  }
  groupTaskCompletedBy(taskCompleted, groupBy: string): ITaskCompletedData {
    return taskCompleted.reduce(function (accumulator, currentTask) {
      let key = currentTask[groupBy];
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(currentTask);
      return accumulator;
    }, {});
  }

  handleChangePeriodType($event) {
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

  compareCountData(taskCompleted, selectedTasks): void {
    if (
      taskCompleted.length === selectedTasks?.length ||
      !selectedTasks?.length
    ) {
      this.customTitle = ETaskCompletedType.All;
    }
  }
  handleValueChange(event: string[]): void {
    let selectedValue = this.completedTaskOptions.filter((item) =>
      event.includes(item.id)
    );
    this.selectedTasksGroupBy = this.groupTaskCompletedBy(
      selectedValue,
      'status'
    );

    this.compareCountData(this.completedTaskOptions, this.selectedTasks);

    this.totalSelectedPublishedTasks =
      this.selectedTasksGroupBy[ETaskCompletedType.PUBLISHED]?.length;
    this.totalSelectedArchivedTasks =
      this.selectedTasksGroupBy[ETaskCompletedType.ARCHIVED]?.length;

    if (
      this.totalPublishedTasks === this.totalSelectedPublishedTasks &&
      !this.totalSelectedArchivedTasks
    ) {
      this.customTitle = ETaskCompletedType.PUBLISHED;
      return;
    } else {
      this.customTitle = null;
    }

    if (
      this.totalArchivedTasks === this.totalSelectedArchivedTasks &&
      !this.totalSelectedPublishedTasks
    ) {
      this.customTitle = ETaskCompletedType.ARCHIVED;
    } else {
      if (
        this.completedTaskOptions.length === selectedValue?.length ||
        !selectedValue?.length
      ) {
        this.customTitle = ETaskCompletedType.All;
      } else {
        this.customTitle = null;
      }
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
