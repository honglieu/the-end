import { Injectable } from '@angular/core';
import dayjs from 'dayjs';
import { BehaviorSubject, combineLatest, map, take } from 'rxjs';
import {
  ICalendarEvent,
  ICalendarEventParam
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { SHORT_ISO_DATE } from '@services/constants';
import { Params } from '@angular/router';
import { EEventType, GroupType } from '@shared/enum';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { PortfolioService } from '@/app/dashboard/services/portfolio.service';
import { CompanyService } from '@services/company.service';
import { isEqual } from 'lodash-es';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { getDateWithTimezone } from '@/app/dashboard/utils/utils';
import {
  EEventDatetimePicker,
  EventDatetimePickerOptions
} from '@/app/dashboard/modules/calendar-dashboard/components/calendar-header/event-datetime-picker/event-datetime-picker.enums';
import { LinkedTaskListDataType } from '@shared/types/calendar.interface';

@Injectable({
  providedIn: 'root'
})
export class CalendarFilterService {
  private searchTextBS: BehaviorSubject<string> = new BehaviorSubject(null);
  private focusViewBS: BehaviorSubject<boolean> = new BehaviorSubject(true);
  private showEventWithoutTasksBS: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  private eventTypeSelected$: BehaviorSubject<string> = new BehaviorSubject(
    null
  );
  private portfolioSelected$: BehaviorSubject<string[]> = new BehaviorSubject(
    []
  );
  private selectedAgencies$: BehaviorSubject<string[]> = new BehaviorSubject(
    []
  );
  private selectedDateRange$: BehaviorSubject<Date[]> = new BehaviorSubject([
    dayjs(dayjs().format(SHORT_ISO_DATE)).toDate(),
    dayjs(
      dayjs()
        .set(
          'months',
          dayjs().month() +
            EventDatetimePickerOptions[EEventDatetimePicker.NextSixMonths]
        )
        .format(SHORT_ISO_DATE)
    ).toDate()
  ]);
  private eventId$: BehaviorSubject<string> = new BehaviorSubject(null);
  private dataEvent$: BehaviorSubject<
    [ICalendarEvent, LinkedTaskListDataType]
  > = new BehaviorSubject(null);
  private showHistoricalEventBS: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public isScrolling = false;
  private followedAgencyAgentIdsBS: BehaviorSubject<string[]> =
    new BehaviorSubject([]);
  private followedAgencyIdsBS: BehaviorSubject<string[]> = new BehaviorSubject(
    []
  );

  private customTime: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public customTime$ = this.customTime.asObservable();

  constructor(
    private portfolioService: PortfolioService,
    private companyService: CompanyService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {
    this.agencyDateFormatService.timezone$.pipe(take(1)).subscribe((res) => {
      if (res && !this.selectedDateRange$.value[1]) {
        const today = getDateWithTimezone(
          new Date(),
          this.agencyDateFormatService.getCurrentTimezone()
        );
        this.setSelectedDateRange([today, null]);
      }
    });
  }

  // getter setter
  getEventId(): BehaviorSubject<string> {
    return this.eventId$;
  }

  setEventId(data: string) {
    this.eventId$.next(data);
  }

  setCustomTime(isCustomTime: boolean) {
    this.customTime.next(isCustomTime);
  }

  getDataEvent(): BehaviorSubject<[ICalendarEvent, LinkedTaskListDataType]> {
    return this.dataEvent$;
  }

  setDataEvent(data: [ICalendarEvent, LinkedTaskListDataType]) {
    this.dataEvent$.next(data);
  }

  public focusView$ = this.focusViewBS.asObservable();
  public setFocusView(isFocused: boolean): void {
    this.focusViewBS.next(isFocused);
  }

  public setShowEventWithoutTasks(isShowEventWithoutTasks: boolean): void {
    this.showEventWithoutTasksBS.next(isShowEventWithoutTasks);
  }

  getShowEventWithoutTasks$() {
    return this.showEventWithoutTasksBS;
  }
  getShowHistoricalEventBS() {
    return this.showHistoricalEventBS;
  }

  setShowHistoricalEvent(isShow: boolean) {
    this.showHistoricalEventBS.next(isShow);
  }

  getEventTypeSelected(): BehaviorSubject<string> {
    return this.eventTypeSelected$;
  }

  setEventTypeSelected(data: string) {
    const selectedEvent = this.mapEventType(data);
    this.eventTypeSelected$.next(selectedEvent);
  }

  // return agency that satisfy condition when focus change
  // instead of all selected agency
  public agenciesValue$ = combineLatest([
    this.companyService.getCurrentCompany(),
    this.followedAgencyIdsBS,
    this.getSelectedAgencies()
  ]).pipe(
    map(([currentCompany, followedAgencyIds, selectedAgencies]) => {
      const agencies = currentCompany?.agencies ?? [];
      const agencyIds = agencies
        .filter(
          (a) => followedAgencyIds.includes(a?.id) || !this.focusViewBS.value
        )
        .map((a) => a?.id);
      const result = selectedAgencies ?? [];
      return result.filter((i) => agencyIds.includes(i));
    })
  );

  // set value of agency based on value of focus view
  public setAgenciesValue(data: string[]) {
    if (!this.focusViewBS.value) {
      this.setSelectedAgencies(data);
    } else {
      const followedCrmSubscriptionIds = this.followedAgencyIdsBS.value;
      const notIncludedData = this.selectedAgencies$.value?.filter(
        (i) => !followedCrmSubscriptionIds.includes(i)
      );
      const newData = [...data, ...notIncludedData];
      this.setSelectedAgencies(newData);
    }
  }

  getSelectedAgencies(): BehaviorSubject<string[]> {
    return this.selectedAgencies$;
  }

  setSelectedAgencies(agencyIds: string[]) {
    this.selectedAgencies$.next(agencyIds);
  }

  // return portfolios that satisfy condition when focus change
  // instead of all selected portfolios
  public portfolioValue$ = combineLatest([
    this.portfolioService.getPortfolios$(),
    this.getPortfolioSelected(),
    this.focusView$
  ]).pipe(
    map(([portfolioGroups, selectedPortfolios, isFocus]) => {
      const resPortfolioGroups = portfolioGroups || [];
      const resPortfolios = resPortfolioGroups
        .map((group) => {
          return group.portfolios.map((portfolio) => ({
            ...portfolio,
            agencyId: group.id
          }));
        })
        .flat();

      const followedMagagerIds = resPortfolios
        .filter((p) => p?.isFollowed)
        .map((p) => p?.agencyAgentId);
      let followedAgencyIds = resPortfolios
        .filter((p) => p?.isFollowed)
        .map((p) => p?.agencyId);
      followedAgencyIds = followedAgencyIds.filter(
        (value, index) => followedAgencyIds.indexOf(value) === index
      );

      if (!isEqual(followedMagagerIds, this.followedAgencyAgentIdsBS.value)) {
        this.followedAgencyAgentIdsBS.next(followedMagagerIds);
      }
      if (!isEqual(followedAgencyIds, this.followedAgencyIdsBS.value)) {
        this.followedAgencyIdsBS.next(followedAgencyIds);
      }

      const agencyAgentIds = resPortfolios
        .filter((i) => i?.isFollowed || !isFocus)
        .map((p) => p?.agencyAgentId);
      const result = selectedPortfolios || [];
      return result.filter((i) => agencyAgentIds.includes(i));
    })
  );

  // set value of portfolio based on value of focus view
  public setPortfolioValue(data: string[]) {
    if (!this.focusViewBS.value) {
      this.setPortfolioSelected(data);
    } else {
      const followedManagerIds = this.followedAgencyAgentIdsBS.value;
      const selectedValue = this.portfolioSelected$.value;
      const notIncludedData = selectedValue?.filter(
        (i) => !followedManagerIds.includes(i)
      );
      const newData = [...data, ...notIncludedData];
      this.setPortfolioSelected(newData);
    }
  }

  getPortfolioSelected(): BehaviorSubject<string[]> {
    return this.portfolioSelected$;
  }

  setPortfolioSelected(data: string[]) {
    this.portfolioSelected$.next(data);
  }

  getSelectedDateRange(): BehaviorSubject<Date[]> {
    return this.selectedDateRange$;
  }

  setSelectedDateRange(data: Date[]) {
    return this.selectedDateRange$.next(data);
  }

  getCalendarFilterPayload(queryParams): ICalendarEventParam {
    let showEventWithoutTasks = queryParams?.isShowEventWithoutTasks;
    if (showEventWithoutTasks === 'true') {
      showEventWithoutTasks = true;
    } else {
      showEventWithoutTasks = false;
    }
    const isFocusView =
      queryParams[ETaskQueryParams.CALENDAR_FOCUS] !== GroupType.TEAM_TASK;
    this.setFocusView(isFocusView);
    let propertyManagerIds = this.transformToArray(
      queryParams?.portfolios
    )?.filter(Boolean);
    let agencyIds = this.transformToArray(queryParams?.agencyIds)?.filter(
      Boolean
    );
    if (isFocusView) {
      const managerIds = this.followedAgencyAgentIdsBS.value;
      propertyManagerIds =
        propertyManagerIds?.filter(
          (p) => !managerIds?.length || managerIds?.includes(p)
        ) || [];

      const listAgencyIds = this.followedAgencyIdsBS.value;
      agencyIds = agencyIds?.filter((p) => listAgencyIds?.includes(p)) || [];
    }
    return {
      filter: {
        eventTypes: this.transformToArray(queryParams?.eventTypes),
        propertyManagerIds: propertyManagerIds,
        agencyIds: agencyIds
      },
      startDate: queryParams?.date || queryParams?.startDate,
      endDate: queryParams?.endDate,
      pageIndex: '0',
      pageSize: '20',
      search: queryParams?.search || '',
      isFocusedView: isFocusView,
      isShowEventWithoutTasks: showEventWithoutTasks
    };
  }

  set searchText(value: string) {
    this.searchTextBS.next(value);
  }

  get searchText() {
    return this.searchTextBS?.value;
  }

  get searchText$() {
    return this.searchTextBS.asObservable();
  }

  clearAllFilter() {
    this.searchTextBS.next('');
    this.selectedDateRange$.next([
      getDateWithTimezone(
        new Date(),
        this.agencyDateFormatService.getCurrentTimezone()
      ),
      null
    ]);
    this.followedAgencyAgentIdsBS.next([]);
    this.followedAgencyIdsBS.next([]);
    this.setEventTypeSelected(null);
    this.setPortfolioSelected([]);
    this.setSelectedAgencies([]);
  }

  transformToArray(data) {
    if (typeof data === 'string') {
      return [data];
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  }

  public toQueryParams(date?: string): Params {
    const startOfMonth = this.selectedDateRange$.value[0] || new Date();
    const endOfMonth = this.selectedDateRange$.value[1];
    return {
      search: this.searchTextBS.value || '',
      eventTypes: this.eventTypeSelected$.value,
      portfolios: this.portfolioSelected$.value,
      agencyIds: this.selectedAgencies$.value,
      startDate: date || dayjs(startOfMonth).format(SHORT_ISO_DATE),
      endDate:
        endOfMonth && !isNaN(endOfMonth.getTime())
          ? dayjs(endOfMonth).format(SHORT_ISO_DATE)
          : '',
      eventId: this.eventId$.value || '',
      calendarFocus: this.focusViewBS.value
        ? GroupType.MY_TASK
        : GroupType.TEAM_TASK,
      isShowEventWithoutTasks: this.showEventWithoutTasksBS.value
    };
  }

  public mapEventType(type: string) {
    switch (type) {
      case EEventType.GENERAL_EXPIRY:
      case EEventType.SMOKE_ALARM_EXPIRY:
        return EEventType.COMPLIANCE_EXPIRY;
      case EEventType.SMOKE_ALARM_NEXT_SERVICE:
      case EEventType.GENERAL_NEXT_SERVICE:
        return EEventType.COMPLIANCE_NEXT_SERVICE;
      case EEventType.ALL_EVENT:
        return null;
      default:
        return type;
    }
  }

  clearAllFilterEvents() {
    this.setPortfolioSelected([]);
    this.searchText = '';
    this.setShowEventWithoutTasks(false);
    this.setFocusView(false);
    this.setCustomTime(false);
    this.setSelectedAgencies([]);
  }
}
