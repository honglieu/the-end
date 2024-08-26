import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {
  EMPTY,
  Subject,
  catchError,
  distinctUntilChanged,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import {
  IGetInsightsDataPayload,
  ITopPerformings,
  IAccomplishments,
  IEfficiencyData,
  IBreakDownTimeSavedData,
  ITimeSavedData,
  IInsightsData
} from '@/app/dashboard/modules/insights/interfaces/insights.interface';
import { InsightsApiService } from '@/app/dashboard/modules/insights/services/insights-api.service';
import { InsightsService } from '@/app/dashboard/modules/insights/services/insights.service';
import { ERangeDateType } from './enums/insights.enum';
import { isEqual } from 'lodash-es';
interface IComponentRendered {
  enquiresResolvedSection: boolean;
  taskCompletedSection: boolean;
}

@Component({
  selector: 'insights',
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss']
})
export class InsightsComponent implements OnInit, OnDestroy {
  @ViewChild('enquiresResolvedSectionElement', { read: ViewContainerRef })
  enquiresResolvedSectionElement: ViewContainerRef;
  @ViewChild('taskCompletedSectionElement', { read: ViewContainerRef })
  taskCompletedSectionElement: ViewContainerRef;
  private destroy$: Subject<void> = new Subject();
  public isLoading = true;
  public accomplishments: IAccomplishments[];
  public topPerformingTeamMembers: ITopPerformings;
  public efficiency: IEfficiencyData[];
  public breakDownTimeSaved: IBreakDownTimeSavedData;
  public timeSavings: ITimeSavedData[];
  public rangeDateType: ERangeDateType = ERangeDateType.LAST_WEEK;
  public isFilterInsightForEntireTeam: boolean = true;
  public properties: number;
  public componentRendered: IComponentRendered = {
    enquiresResolvedSection: false,
    taskCompletedSection: false
  };
  constructor(
    private insightsService: InsightsService,
    private insightsApiService: InsightsApiService
  ) {}

  ngOnInit(): void {
    this.handleRefreshInsightsData();
    this.handleFilterInsightsData();
    this.insightsService
      .getInsightsAccomplishmentsType()
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        if (
          (!this.componentRendered.enquiresResolvedSection ||
            !this.componentRendered.taskCompletedSection) &&
          type
        ) {
          !this.componentRendered.enquiresResolvedSection &&
            this.loadEnquiresResolvedSectionComponent();
          !this.componentRendered.taskCompletedSection &&
            this.loadTaskCompletedSectionComponent();
          for (let key in this.componentRendered) {
            this.componentRendered[key] = true;
          }
        }
      });
  }

  private handleFilterInsightsData() {
    this.insightsService.insightsFilter$
      .pipe(
        distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
        takeUntil(this.destroy$),
        switchMap((insightsFilter) => {
          this.isLoading = true;
          this.rangeDateType = insightsFilter.type;
          this.isFilterInsightForEntireTeam = !insightsFilter?.userId;
          return this.insightsApiService
            .getInsightsData({
              ...insightsFilter
            } as IGetInsightsDataPayload)
            .pipe(
              catchError((error) => {
                console.error(error?.message);
                return EMPTY;
              })
            );
        })
      )
      .subscribe((res) => this.setInsightsData(res));
  }

  private handleRefreshInsightsData() {
    this.insightsService.refreshInsightsData
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          const { startDate, endDate } =
            this.insightsService.getCurrentInsightsFilter();
          const insightsFilter = {
            ...this.insightsService.getCurrentInsightsFilter(),
            startDate: startDate?.toString() || '',
            endDate: endDate?.toString() || ''
          };
          return this.insightsApiService.getInsightsData(insightsFilter).pipe(
            catchError((error) => {
              console.error(error?.message);
              return EMPTY;
            })
          );
        }),
        tap((res) => this.setInsightsData(res))
      )
      .subscribe();
  }

  private setInsightsData(value: IInsightsData) {
    if (value) {
      this.insightsService.insightsData$.next(value);
      this.accomplishments = value.accomplishments;
      this.topPerformingTeamMembers = value.topPerforming;
      this.breakDownTimeSaved = value.chartData?.PIE_CHART;
      this.timeSavings = value.chartData?.TIME_SAVED;
      this.efficiency = value.chartData?.EFFICIENCY;
      this.properties = value.settings.CURRENT.PROPERTIES_NATIONAL.value;
      this.isLoading = false;
    }
  }

  handleScroll(event) {
    const preToRenderPx = 52;
    const heightInsightsHeader = 76;
    const scrollPosition =
      event.target.scrollTop +
      event.target.clientHeight +
      preToRenderPx +
      heightInsightsHeader;
    const enquiresResolvedSectionElementPosition =
      this.enquiresResolvedSectionElement?.element?.nativeElement?.offsetTop;
    const taskCompletedSectionElementPosition =
      this.taskCompletedSectionElement?.element?.nativeElement?.offsetTop;

    if (
      !this.componentRendered.enquiresResolvedSection &&
      scrollPosition >= enquiresResolvedSectionElementPosition
    ) {
      this.componentRendered = {
        ...this.componentRendered,
        enquiresResolvedSection: true
      };
      this.loadEnquiresResolvedSectionComponent();
    }

    if (
      !this.componentRendered.taskCompletedSection &&
      scrollPosition >= taskCompletedSectionElementPosition
    ) {
      this.componentRendered = {
        ...this.componentRendered,
        taskCompletedSection: true
      };
      this.loadTaskCompletedSectionComponent();
    }
  }

  loadEnquiresResolvedSectionComponent() {
    import(
      './components/enquires-resolved-section/enquires-resolved-section.component'
    ).then(({ EnquiresResolvedSectionComponent }) => {
      this.enquiresResolvedSectionElement.createComponent(
        EnquiresResolvedSectionComponent
      );
    });
  }

  loadTaskCompletedSectionComponent() {
    import(
      './components/task-completed-section/task-completed-section.component'
    ).then(({ TaskCompletedSectionComponent }) => {
      this.taskCompletedSectionElement.createComponent(
        TaskCompletedSectionComponent
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
