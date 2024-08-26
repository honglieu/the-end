import {
  IGetInsightsDataPayload,
  IInsightsFilter,
  IInsightsData,
  IUserActivities
} from '@/app/dashboard/modules/insights/interfaces/insights.interface';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  distinctUntilKeyChanged,
  filter,
  map,
  switchMap
} from 'rxjs';
import { DEFAULT_AGENT_ID } from '@/app/dashboard/modules/insights/constants/insights.constant';
import { getDatePayloadByRangeDateType } from '@/app/dashboard/modules/insights/utils/function';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { EAccomplishments } from '@/app/dashboard/modules/insights/enums/insights.enum';

@Injectable({
  providedIn: 'root'
})
export class InsightsService {
  public insightsData$ = new Subject<IInsightsData>();
  private insightUserActivities: BehaviorSubject<IUserActivities> =
    new BehaviorSubject({ isUrgent: false, taskNameIds: [] });
  private insightsFilterBS: BehaviorSubject<IInsightsFilter> =
    new BehaviorSubject(null);
  private insightsAccomplishmentsType: Subject<EAccomplishments> =
    new BehaviorSubject(null);
  private refreshInsightsData$ = new Subject();

  public insightsFilter$: Observable<Partial<IGetInsightsDataPayload>> =
    this.insightsFilterBS.asObservable().pipe(
      filter((insightsFilter) => Boolean(insightsFilter)),
      switchMap((insightsFilter) =>
        this.agencyDateFormatService.timezone$.pipe(
          distinctUntilKeyChanged('value'),
          map((timezone) => ({ insightsFilter, timezone }))
        )
      ),
      map(({ insightsFilter, timezone }) => {
        const { userId, startDate, endDate, rangeDateType } = insightsFilter;
        const dynamicPayload = userId === DEFAULT_AGENT_ID ? {} : { userId };
        const datePayload = getDatePayloadByRangeDateType(
          timezone,
          rangeDateType,
          startDate,
          endDate
        );

        return {
          ...datePayload,
          ...dynamicPayload,
          type: rangeDateType
        } as Partial<IGetInsightsDataPayload>;
      })
    );

  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  setInsightsFilter(insightsFilter: IInsightsFilter) {
    this.insightsFilterBS.next(insightsFilter);
  }

  getCurrentInsightsFilter() {
    return this.insightsFilterBS.getValue();
  }

  setInsightsAccomplishmentsType(value: EAccomplishments) {
    this.insightsAccomplishmentsType.next(value);
  }

  getInsightsAccomplishmentsType() {
    return this.insightsAccomplishmentsType;
  }

  setInsightUserActivities(userActivities: IUserActivities) {
    this.insightUserActivities.next(userActivities);
  }

  getInsightUserActivities() {
    return this.insightUserActivities;
  }

  setRefreshInsightsData() {
    this.refreshInsightsData$.next(null);
  }

  get refreshInsightsData() {
    return this.refreshInsightsData$.asObservable();
  }
}
