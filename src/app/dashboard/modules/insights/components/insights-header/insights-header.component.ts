import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash-es';
import { Subject, combineLatest, filter, switchMap, takeUntil } from 'rxjs';
import {
  DEFAULT_AGENT_ID,
  INSIGHTS_RANGE_TIME_DATA
} from '@/app/dashboard/modules/insights/constants/insights.constant';
import { ERangeDateType } from '@/app/dashboard/modules/insights/enums/insights.enum';
import { IExtraAgent } from '@/app/dashboard/modules/insights/interfaces/insights.interface';
import { InsightsApiService } from '@/app/dashboard/modules/insights/services/insights-api.service';
import { InsightsService } from '@/app/dashboard/modules/insights/services/insights.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';
import { SHORT_ISO_DATE } from '@services/constants';
import { PermissionService } from '@services/permission.service';
import { SharedService } from '@services/shared.service';
import { Agent, InviteStatus } from '@shared/types/agent.interface';

const AGENT_GROUP_TITLE_MAPPINGS = {
  [InviteStatus.ACTIVE]: 'ACTIVE PROPERTY MANAGERS',
  [InviteStatus.DEACTIVATED]: 'DEACTIVATED PROPERTY MANAGERS',
  [InviteStatus.DELETED]: 'DELETED PROPERTY MANAGERS'
};

const DEFAULT_AGENT = {
  id: DEFAULT_AGENT_ID,
  fullName: 'Entire team',
  googleAvatar: 'assets/icon/multiple-users.svg'
} as IExtraAgent;

@Component({
  selector: 'insights-header',
  templateUrl: './insights-header.component.html',
  styleUrls: ['./insights-header.component.scss']
})
export class InsightsHeaderComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject();
  public readonly insightsRangeTimeData = INSIGHTS_RANGE_TIME_DATA;
  public readonly datePickerFormatPipe$ =
    this.agencyDateFormatService.dateFormatPipe$;
  public DATE_FORMAT;
  public selectedAgentId = DEFAULT_AGENT_ID;
  public ERangeDateType = ERangeDateType;
  public isShowRangePicker: boolean = false;
  public listOfAgents: IExtraAgent[] = [DEFAULT_AGENT];
  public rangeDateType: ERangeDateType = ERangeDateType.LAST_WEEK;
  private preRangeDateType: ERangeDateType;
  public rangeTimeValue;
  public rangeTimeTitle: string;
  public isLoading: boolean = true;
  public queryParams: Params;
  public isConsole: boolean = false;
  public isMemberNotConsole: boolean = false;
  public currentUser: Agent;
  public readonly groupOrders = [
    AGENT_GROUP_TITLE_MAPPINGS[InviteStatus.ACTIVE],
    AGENT_GROUP_TITLE_MAPPINGS[InviteStatus.DEACTIVATED],
    AGENT_GROUP_TITLE_MAPPINGS[InviteStatus.DELETED]
  ];
  public defaultRangeDate = [
    dayjs().startOf('week').subtract(1, 'week').toDate(),
    dayjs().endOf('week').subtract(1, 'week').toDate()
  ];

  public rangeDate = this.defaultRangeDate;
  public disabledStartDate = (date) => {
    const isDateTodayAndAfter = dayjs(date).isSameOrAfter(
      dayjs(
        this.agencyDateFormatService.initTimezoneToday().nativeDate
      ).startOf('day')
    );
    const isDateBeforeAgencyStartDate = dayjs(date).isBefore(
      dayjs(this.agencyDateFormatService.initTimezoneToday().nativeDate)
        .year(2021)
        .startOf('year')
    );
    return isDateTodayAndAfter || isDateBeforeAgencyStartDate;
  };
  timezone: string = '';

  constructor(
    private router: Router,
    private insightsService: InsightsService,
    private insightsApiService: InsightsApiService,
    private activatedRoute: ActivatedRoute,
    private agencyService: AgencyService,
    private agencyDateFormatService: AgencyDateFormatService,
    private permissionService: PermissionService,
    private sharedService: SharedService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.subscribeQueryParamsAndAgent();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.agencyDateFormatService.dateFormat$
      .pipe(filter((rs) => !!rs))
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.DATE_FORMAT = rs.DATE_FORMAT_DAYJS.replace(/\//g, '-');
      });
  }

  subscribeQueryParamsAndAgent() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((agency) => {
          this.timezone = agency.timeZone;
          return combineLatest([
            this.insightsApiService.getListOfAgent(),
            this.activatedRoute.queryParams
          ]);
        })
      )
      .subscribe(([agentList, queryParams]) => {
        this.handleChangeAgentList(agentList);
        this.handleChangeQueryParams(queryParams);
        this.isLoading = false;
      });
  }

  handleChangeAgentList(agentList: Agent[]) {
    this.listOfAgents = [DEFAULT_AGENT];
    if (agentList && agentList.length) {
      const userId = localStorage.getItem('userId');
      this.isMemberNotConsole =
        this.permissionService.isMember && !this.isConsole;
      if (this.isMemberNotConsole) {
        this.currentUser = agentList.find((item) => item?.id === userId);
      } else {
        this.listOfAgents = [
          ...this.listOfAgents,
          ...agentList.map((item) => ({
            ...item,
            fullName:
              (item.firstName ?? '') +
              ' ' +
              (item.lastName ?? '') +
              `${item.id === userId ? ' (me)' : ''}`,
            groupBy: AGENT_GROUP_TITLE_MAPPINGS[item.inviteStatus] || ''
          }))
        ];
      }
    }
  }

  handleChangeQueryParams(queryParams: Params): void {
    this.queryParams = queryParams;
    try {
      let { rangeDateType, userId, startDate, endDate } = queryParams ?? {};
      if (!this.listOfAgents.find((item) => item.id === userId)) userId = null;
      if (
        !this.insightsRangeTimeData.find((item) => item.value === rangeDateType)
      ) {
        rangeDateType = null;
      }
      const regex = /\d{4}-\d{2}-\d{2}/;
      // using local tz to path into date range picker
      startDate = regex.test(startDate)
        ? dayjs(`${startDate}T00:00:00.000`)
        : dayjs(null);

      endDate = regex.test(endDate)
        ? dayjs(`${endDate}T00:00:00.000`)
        : dayjs(null);

      // Invalid startDate or endDate
      if (
        rangeDateType === ERangeDateType.CUSTOM &&
        (!startDate.isValid() || !endDate.isValid())
      ) {
        throw {
          rangeDateType: ERangeDateType.LAST_WEEK,
          userId: userId || DEFAULT_AGENT_ID,
          startDate: null,
          endDate: null
        };
      }
      // Invalid rangeDateType or userId
      if (!rangeDateType || !userId) {
        const errorData = {
          rangeDateType: rangeDateType || ERangeDateType.LAST_WEEK,
          userId: userId || DEFAULT_AGENT_ID
        };
        if (rangeDateType !== ERangeDateType.CUSTOM) {
          errorData['startDate'] = null;
          errorData['endDate'] = null;
        }
        throw errorData;
      }

      startDate = startDate.isValid() ? startDate.toDate() : null;
      endDate = endDate.isValid() ? endDate.toDate() : null;
      this.rangeDateType = rangeDateType;
      this.preRangeDateType = rangeDateType;
      this.selectedAgentId = userId;
      if (this.rangeDateType === ERangeDateType.CUSTOM) {
        this.rangeTimeValue = [startDate, endDate];
        this.rangeDate = [startDate, endDate];
      }
      this.updateRangeTimeTitle();
      if (this.isMemberNotConsole) {
        this.selectedAgentId = localStorage.getItem('userId');
      }
      this.insightsService.setInsightsFilter({
        rangeDateType: this.rangeDateType,
        userId: this.selectedAgentId,
        startDate,
        endDate
      });
    } catch (errorData) {
      let queryParams = errorData;
      const currentInsightsFilter =
        this.insightsService.getCurrentInsightsFilter();
      if (currentInsightsFilter) {
        const { rangeDateType, userId, startDate, endDate } =
          currentInsightsFilter;

        const customDate = (dateTime) =>
          dateTime ? dayjs(dateTime).format(SHORT_ISO_DATE) : null;

        queryParams = {
          ...queryParams,
          rangeDateType,
          userId,
          startDate: customDate(startDate),
          endDate: customDate(endDate)
        };
      }
      this.router.navigate([], {
        queryParams: queryParams,
        queryParamsHandling: 'merge',
        relativeTo: this.activatedRoute
      });
    }
  }

  handleChangeRangeTime(event) {
    if (event === ERangeDateType.CUSTOM) {
      this.isShowRangePicker = true;
    } else {
      this.rangeDate = this.defaultRangeDate;
      this.rangeTimeValue = [];
      this.rangeTimeTitle = '';
      this.router.navigate([], {
        queryParams: {
          rangeDateType: event,
          startDate: null,
          endDate: null
        },
        queryParamsHandling: 'merge',
        relativeTo: this.activatedRoute
      });
    }
  }

  handleCalendarChange(event) {
    if (event?.length === 2) {
      this.rangeDateType = ERangeDateType.CUSTOM;
      this.router.navigate([], {
        queryParams: {
          rangeDateType: ERangeDateType.CUSTOM,
          startDate: dayjs(event[0]).tz(this.timezone).format(SHORT_ISO_DATE),
          endDate: dayjs(event[1]).tz(this.timezone).format(SHORT_ISO_DATE)
        },
        queryParamsHandling: 'merge',
        relativeTo: this.activatedRoute
      });
      this.isShowRangePicker = false;
    }
  }

  handleOpenChangeRangePicker(event) {
    if (!event) {
      this.isShowRangePicker = false;
      if (this.rangeTimeValue?.length === 2) {
        this.updateRangeTimeTitle();
      } else {
        this.rangeDateType = this.preRangeDateType;
      }
    }
  }

  updateRangeTimeTitle() {
    this.agencyDateFormatService.dateFormatDayJS$
      .pipe(takeUntil(this.destroy$))
      .subscribe((format) => {
        if (this.rangeTimeValue?.length >= 2) {
          this.rangeTimeTitle =
            dayjs(this.rangeTimeValue[0]).format(format) +
            ' - ' +
            dayjs(this.rangeTimeValue[1]).format(format);
        } else {
          this.rangeTimeTitle = this.getRangeTitle(
            this.preRangeDateType
          )?.label;
        }
      });
  }

  getRangeTitle(value: ERangeDateType) {
    return this.insightsRangeTimeData.find((item) => item.value === value);
  }

  handleCancel() {
    this.isShowRangePicker = false;
    this.rangeDateType = this.queryParams['rangeDateType'];
    if (this.rangeDateType === ERangeDateType.CUSTOM) {
      this.rangeDate = [
        dayjs(this.queryParams['startDate']).toDate(),
        dayjs(this.queryParams['endDate']).toDate()
      ];
    } else {
      this.rangeDate = cloneDeep(this.defaultRangeDate);
    }
  }

  handleChangeAgent(event: string) {
    this.router.navigate([], {
      queryParams: { userId: event },
      queryParamsHandling: 'merge',
      relativeTo: this.activatedRoute
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
