import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';
import {
  ICalendarEvent,
  IToolbar,
  IWeekTittle
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  BehaviorSubject,
  Subject,
  debounceTime,
  filter,
  switchMap,
  takeUntil,
  tap,
  map,
  EMPTY,
  distinctUntilChanged
} from 'rxjs';
import { LAZY_LOAD_CALENDAR } from '@services/constants';
import { CalendarFilterService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-filter/services/calendar-filter.service';
import dayjs from 'dayjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LinkedTasksComponent } from './components/linked-tasks/linked-tasks.component';
import { combineLatest } from 'rxjs';
import { CalendarEventService } from './services/calendar-event.service';
import { NotificationService } from '@services/notification.service';
import { ECurrentTab, EEventStatus } from '@shared/enum/calendar.enum';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { CalendarToolbarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendarToolbar.service';
import {
  ActivatedRoute,
  NavigationStart,
  Params,
  Router
} from '@angular/router';
import { SharedService } from '@services/shared.service';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { EPropertyStatus, GroupType } from '@shared/enum';
import { CompanyService } from '@services/company.service';
import { Store } from '@ngrx/store';
import {
  calendarDashboardPageActions,
  selectCalendarEvents,
  selectFetchingCalendarEvent
} from '@core/store/calendar-dashboard';
import { SplashScreenService } from '@/app/splash-screen/splash-screen.service';
import { EVENT_ROUTE } from '@/app/dashboard/modules/calendar-dashboard/constants/event.constants';
import { calendarDashboardActions } from '@core/store/calendar-dashboard/actions/calendar-dashboard.actions';
import { CalendarEvent } from '@core/store/calendar-dashboard/types';
export enum EScrollStatus {
  UP = 'UP',
  DOWN = 'DOWN'
}

@Component({
  selector: 'calendar-list-view',
  templateUrl: './calendar-list-view.component.html',
  styleUrls: [
    './components/date-row/date-row.component.scss',
    './calendar-list-view.component.scss'
  ]
})
@DestroyDecorator
export class CalendarListViewComponent
  implements OnInit, AfterViewInit, OnDestroy, AfterViewChecked
{
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;
  private overlayRef: OverlayRef;
  private isShowLinkTask: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private destroy$ = new Subject<void>();
  public scrollStatus: EScrollStatus = null;
  public scrolledIndex = 0;
  public scrolledToBottom = false;
  public scrolledToTop = false;
  private scrollTimeOut: NodeJS.Timeout = null;
  public currentCalendarEventId: string;
  public isCheckAll: boolean = false;
  public startBulkCreateTasks: boolean = false;
  public isConsole: boolean;
  public companyId: string = '';
  private isProcessingData: boolean = false;
  public toolbarConfig: IToolbar[] = [
    {
      icon: 'plusGray',
      label: 'Create task',
      dataE2E: 'events-page-float-popup-create-task-button',
      action: () => {
        this.calendarToolbarService.setCalendarToolbar([]);
        this.startBulkCreateTasks = true;
      }
    },
    {
      icon: 'iconCloseV2',
      action: () => {
        this.handleClearSelected();
        this.startBulkCreateTasks = false;
      }
    }
  ];
  public isLoading: boolean = true;
  private readonly filterRouterFn = () => {
    const calendarRoute = EVENT_ROUTE;
    return this.router.url.includes(calendarRoute);
  };
  public isFocusView: boolean;
  public isFiltered: boolean;
  public calendarEventsList: ICalendarEvent[] | IWeekTittle[] = [];

  private currentEventType: string = null;
  public isHideEvent: boolean = false;

  private calendarFilterChange$ = combineLatest([
    this.calendarFilterService.searchText$.pipe(
      distinctUntilChanged((prev, curr) => {
        if (!prev) return false;

        return prev.trim() === curr.trim();
      })
    ),
    this.calendarFilterService.focusView$,
    this.calendarFilterService.getEventTypeSelected(),
    this.calendarFilterService.getPortfolioSelected(),
    this.calendarFilterService.getSelectedDateRange(),
    this.calendarFilterService.getEventId().pipe(distinctUntilChanged()),
    this.calendarFilterService.getSelectedAgencies(),
    this.calendarFilterService.getShowEventWithoutTasks$()
  ]);
  private defaultQueryParams: Params;
  private fetching$ = this.store
    .select(selectFetchingCalendarEvent)
    .pipe(
      tap(
        (fetching) => this.isLoading !== fetching && (this.isLoading = fetching)
      )
    );
  public visiblePropertyProfile = false;
  public propertyId: string = '';
  public activeRowId: string;
  public searchText: string;
  constructor(
    private calendarService: CalendarService,
    private calendarEventService: CalendarEventService,
    private calendarFilterService: CalendarFilterService,
    private notificationService: NotificationService,
    private calendarToolbarService: CalendarToolbarService,
    private overlay: Overlay,
    private router: Router,
    private sharedService: SharedService,
    private companyService: CompanyService,
    private renderer: Renderer2,
    private readonly store: Store,
    private activatedRoute: ActivatedRoute,
    private readonly splashScreenService: SplashScreenService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    if (this.isConsole) this.turnOffFocusView();
    this.getCurrentEventType();
    this.onStoreChange();
    this.handleSetDefaultQueryParams();
    this.subscribeEventLink();
    this.subscribeCheckAll();
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((rs) => {
      if (rs instanceof NavigationStart) {
        this.isShowLinkTask.next(false);
      }
    });
    this.subscribeGetShowEventWithoutTask();
  }

  private getCurrentEventType(): void {
    this.calendarFilterService
      .getEventTypeSelected()
      .pipe(takeUntil(this.destroy$))
      .subscribe((eventType: string) => {
        this.currentEventType = eventType;
      });
  }
  private onStoreChange() {
    const calendarEventRes$ = this.store
      .select(selectCalendarEvents)
      .pipe(filter(Boolean));

    combineLatest([calendarEventRes$, this.fetching$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([res, fetching]) => {
        this.isLoading = fetching;
        this.updateUICalendarEventList(res);
      });
  }

  private updateUICalendarEventList(res) {
    if (res) {
      if (this.calendarService?.calendarEventParam$?.pageIndex === '0') {
        this.viewport?.scrollToOffset(0);
        this.calendarEventsList = [];
        this.calendarService.clearPageIndex();
      }
      this.calendarEventsList = res;
      if (this.isHideEvent) {
        this.calendarEventsList = (
          this.calendarEventsList as ICalendarEvent[]
        ).filter((event) => !event.linkedTasks?.length);
      }

      const allAvailableEvent = (
        this.calendarEventsList as ICalendarEvent[]
      ).filter(
        (e) =>
          e?.id &&
          ![EEventStatus.CANCELLED, EEventStatus.CLOSED].includes(
            e?.eventStatus
          )
      );
      let isSelectedAll =
        this.isCheckAll &&
        this.eventSelectedList.length === this.currentAllEvent.length;
      this.calendarToolbarService.setCurrentAllEvent(allAvailableEvent);
      if (isSelectedAll) {
        this.calendarToolbarService.setEventSelectedList(allAvailableEvent);
        this.calendarEventsList = this.calendarEventsList.map((e) => {
          if (
            ![EEventStatus.CANCELLED, EEventStatus.CLOSED].includes(
              e?.eventStatus
            )
          ) {
            return { ...e, isSelected: true };
          }
          return { ...e, isSelected: false };
        });
        this.checkDisplayToolbar();
      }

      if (this.scrollStatus === EScrollStatus.UP) {
        if (res?.length) {
          this.scrolledToTop = false;
        }
        this.onScrolledChange(0);
      }

      this.isProcessingData = false;
    }
  }

  handleSetDefaultQueryParams() {
    // Handle cases where query params already exist in the url
    combineLatest([
      this.activatedRoute.queryParams.pipe(debounceTime(300)),
      this.activatedRoute.fragment,
      this.companyService.getCurrentCompanyId()
    ])
      .pipe(takeUntil(this.destroy$), filter(this.filterRouterFn))
      .subscribe(([params, fragment, companyId]) => {
        // Clear param when switch company
        let queryParams = params;
        if (queryParams && this.companyId && this.companyId != companyId) {
          queryParams = {
            ...queryParams,
            eventTypes: [],
            portfolios: [],
            agencyIds: []
          };
        }
        this.companyId = companyId;

        if (fragment === 'showHistoricalEvent') {
          this.calendarFilterService.setShowHistoricalEvent(true);
        }
        this.calendarToolbarService.setEventSelectedList([]);
        if (queryParams && queryParams['startDate'] && queryParams['endDate']) {
          this.defaultQueryParams = {
            startDate: queryParams['startDate'],
            endDate: queryParams['endDate'],
            search: queryParams['search'] || '',
            eventTypes: queryParams['eventTypes'] || null,
            portfolios: queryParams['portfolios'] || null,
            eventId: queryParams['eventId'] || '',
            agencyIds: queryParams['agencyIds'] || null,
            calendarFocus:
              queryParams[ETaskQueryParams.CALENDAR_FOCUS] || GroupType.MY_TASK,
            isShowEventWithoutTasks: queryParams['isShowEventWithoutTasks']
          };
        } else {
          this.defaultQueryParams = queryParams;
        }
        this.router
          .navigate([], {
            queryParams: this.defaultQueryParams,
            relativeTo: this.activatedRoute,
            replaceUrl: true
          })
          .then(() => {
            this.subscribeCalendarFilterChange();
            if (this.calendarFilterService.isScrolling) return;
            if (queryParams['startDate']) {
              const payload =
                this.calendarFilterService.getCalendarFilterPayload(
                  queryParams
                );
              this.isFiltered =
                payload.filter.agencyIds.length > 0 ||
                payload.filter.propertyManagerIds.length > 0 ||
                payload.filter.eventTypes.length > 0 ||
                payload.search !== '';
              this.payLoadChange({ ...payload });
            }
          });
      });

    // Handle cases where there are no query params in the url or return to the page
    this.activatedRoute.queryParams
      .pipe(
        takeUntil(this.destroy$),
        filter((queryParams) => {
          return (
            !Boolean(
              queryParams && queryParams['startDate'] && queryParams['endDate']
            ) && this.filterRouterFn()
          );
        })
      )
      .subscribe((res) => {
        const date = this.activatedRoute.snapshot.queryParams['date'];
        const queryParams = this.calendarFilterService.toQueryParams(date);
        this.router.navigate([], {
          queryParams: queryParams,
          relativeTo: this.activatedRoute,
          replaceUrl: true
        });
      });
  }

  subscribeCalendarFilterChange() {
    this.calendarFilterChange$
      .pipe(takeUntil(this.destroy$), filter(this.filterRouterFn))
      .subscribe(([searchText, focusView]) => {
        this.searchText = searchText;
        this.isFocusView = focusView;
        if (this.calendarService.getScrollToday() > -1) return;
        const date = this.activatedRoute.snapshot.queryParams['date'];
        const queryParams = this.calendarFilterService.toQueryParams(date);
        this.router.navigate([], {
          queryParams: queryParams,
          relativeTo: this.activatedRoute,
          replaceUrl: true
        });
      });
  }

  trackByFunction(index, item) {
    return item.id;
  }

  subscribeCheckAll() {
    this.calendarToolbarService.checkAll$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isCheckAll) => {
        this.isCheckAll = isCheckAll;
      });
  }

  checkDisplayToolbar() {
    this.calendarToolbarService.setCalendarToolbar(this.toolbarConfig);
  }

  ngAfterViewChecked() {
    if (this.viewport) {
      const isScrollable =
        this.viewport.getElementRef().nativeElement.scrollHeight >
        this.viewport.getElementRef().nativeElement.clientHeight;
      const checkBox = document.querySelector('.header-wrapper');
      if (isScrollable) {
        this.renderer.setStyle(checkBox, 'margin-right', '37px');
      } else {
        this.renderer.setStyle(checkBox, 'margin-right', '32px');
      }
    }
  }

  handleCheckEventChange(event) {
    const eventSelectedList = [...this.eventSelectedList];
    const eventIdx = eventSelectedList.findIndex((e) => e?.id === event?.id);
    if (event?.isSelected) {
      if (eventIdx === -1) {
        eventSelectedList.push(event);
      }
    } else {
      eventSelectedList.splice(eventIdx, 1);
    }
    this.calendarToolbarService.setEventSelectedList(eventSelectedList);
    this.checkDisplayToolbar();
  }

  handleCheckAllChange() {
    if (this.isCheckAll) {
      this.calendarToolbarService.setEventSelectedList(this.currentAllEvent);
      this.checkDisplayToolbar();
      this.calendarEventsList = this.calendarEventsList.map((e) => {
        if (
          ![EEventStatus.CANCELLED, EEventStatus.CLOSED].includes(
            e?.eventStatus
          )
        ) {
          return { ...e, isSelected: true };
        }
        return { ...e, isSelected: false };
      });
    } else {
      this.handleClearSelected();
    }
  }

  handleClearSelected() {
    this.calendarEventsList = this.calendarEventsList.map((e) => {
      return { ...e, isSelected: false };
    });
    this.calendarToolbarService.setEventSelectedList([]);
    this.checkDisplayToolbar();
  }

  subscribeEventLink() {
    this.notificationService
      .getIsShowNotification()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isShow) => {
        if (isShow && this.calendarFilterService.getEventId().value) {
          this.calendarFilterService.setEventId(null);
        }
        if (isShow) {
          this.visiblePropertyProfile = false;
        }
      });

    this.calendarFilterService
      .getDataEvent()
      .pipe(
        takeUntil(this.destroy$),
        filter(Boolean),
        map(([event, linked]) => {
          if (!event) {
            return null;
          }
          const { eventType } = event;
          if (eventType !== this.currentEventType) {
            this.calendarFilterService.setEventTypeSelected(eventType);
          }
          this.calendarFilterService.setShowEventWithoutTasks(false);
          this.calendarEventService.setEventLinkedTaskListData(linked);
          return event;
        }),
        switchMap((event) => {
          if (!event) {
            return EMPTY;
          }
          return combineLatest([
            this.splashScreenService.visible$,
            this.fetching$
          ]).pipe(
            debounceTime(500),
            map(([visible, isFetching]) => {
              return { event, visible, isFetching };
            })
          );
        })
      )
      .subscribe(({ event, visible, isFetching }) => {
        if (!visible && !isFetching && !this.isShowLinkTask?.value) {
          this.handleOpenLinkTask(event);
        }
      });
  }

  ngAfterViewInit() {
    this.calendarService.scrollToday$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs >= 0) {
          this.viewport?.scrollToIndex(rs, 'smooth');
          this.calendarService.scrollToday(-1);
        }
      });
  }

  // Listen wheel event
  @HostListener('mousewheel', ['$event'])
  onMousewheelEvent(event: WheelEvent) {
    if (
      !this.scrolledToTop &&
      !this.isProcessingData &&
      ((this.scrolledIndex < 2 && event.deltaY < 0) ||
        (event.deltaY < 0 &&
          this.viewport?.elementRef.nativeElement.scrollTop == 0))
    ) {
      this.onScrollUp();
      this.scrolledToTop = true;
    }
    this.calendarFilterService.isScrolling = true;
    this.scrollTimeOut && clearTimeout(this.scrollTimeOut);

    this.scrollTimeOut = setTimeout(() => {
      this.calendarFilterService.isScrolling = false;
    }, 500);
  }

  onScrollUp() {
    this.isProcessingData = true;
    this.scrollStatus = EScrollStatus.UP;
    this.calendarService.pageUpIndex = this.calendarService.pageUpIndex - 1;
    const pageIndex = this.calendarService.pageUpIndex;
    const pageSize = 20;
    this.pageChange(pageIndex, pageSize);
  }

  onScrollDown() {
    if (this.isProcessingData) return;
    this.isProcessingData = true;
    this.scrollStatus = EScrollStatus.DOWN;
    this.calendarService.pageDownIndex = this.calendarService.pageDownIndex + 1;
    const pageIndex = this.calendarService.pageDownIndex;
    const pageSize = 20;
    this.pageChange(pageIndex, pageSize);
  }

  private getCalendarDateByIndex(index) {
    const date =
      (this.calendarEventsList[index] as ICalendarEvent)?.date ||
      (this.calendarEventsList[index] as IWeekTittle).key;
    return new Date(date);
  }

  onScrolledChange(event) {
    this.scrolledIndex = event;
    if (!this.calendarEventsList.length) {
      return;
    }
    const currentMonth = this.getCalendarDateByIndex(this.scrolledIndex);
    const isSameMonth = dayjs(currentMonth).isSame(
      this.calendarFilterService.getSelectedDateRange().value[0],
      'month'
    );
    if (
      isSameMonth &&
      !this.scrolledToTop &&
      !this.scrolledToBottom &&
      this.calendarFilterService.isScrolling
    ) {
      this.calendarFilterService.isScrolling = true;
    }
  }

  onScroll(event) {
    const element = this.viewport?.elementRef.nativeElement;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceFromBottom <= LAZY_LOAD_CALENDAR && !this.scrolledToBottom) {
      this.onScrollDown();
      this.scrolledToBottom = true;
    } else if (
      distanceFromBottom >= LAZY_LOAD_CALENDAR &&
      this.scrolledToBottom
    ) {
      this.scrolledToBottom = false;
    }
  }

  getHistoricalEvents(eventId: string) {
    this.calendarEventService
      .getEventChangeHistory(eventId)
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res !== null && Object.keys(res).length > 0)
      )
      .subscribe((res) => {
        this.calendarEventService.setHistoricalEventLists$(
          res.eventChangeHistory
        );
      });
  }

  private payLoadChange(payload) {
    this.ngZone.run(() => {
      this.store.dispatch(
        calendarDashboardPageActions.payloadChange({ payload })
      );
    });
  }

  private pageChange(pageIndex, pageSize) {
    this.ngZone.run(() => {
      this.store.dispatch(
        calendarDashboardPageActions.pageChange({
          pageIndex,
          pageSize,
          scrollStatus: this.scrollStatus
        })
      );
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(calendarDashboardPageActions.exitPage());
    this.calendarToolbarService.setEventSelectedList([]);
    clearTimeout(this.scrollTimeOut);
  }

  get eventSelectedList$() {
    return this.calendarToolbarService.eventSelectedList$;
  }

  get eventSelectedList() {
    return this.calendarToolbarService.eventSelectedList;
  }

  get currentAllEvent$() {
    return this.calendarToolbarService.currentAllEvent$;
  }

  get currentAllEvent() {
    return this.calendarToolbarService.currentAllEvent;
  }

  public handleOpenLinkTask(rowData: ICalendarEvent): void {
    this.getHistoricalEvents(rowData.id);
    if (!this.currentCalendarEventId) {
      this.currentCalendarEventId = rowData.id;
    }

    let isShow = true;
    this.activeRowId = this.currentCalendarEventId;
    if (rowData.id === this.currentCalendarEventId) {
      if (!this.isShowLinkTask.value) {
        this.attachComponentToBody(rowData);
      } else {
        isShow = false;
        this.activeRowId = '';
      }
    } else {
      this.attachComponentToBody(rowData);
      this.currentCalendarEventId = rowData.id;
      this.activeRowId = this.currentCalendarEventId;
    }
    this.isShowLinkTask.next(isShow);
  }

  private attachComponentToBody(rowData: ICalendarEvent): void {
    this.destroyComponent();
    if (rowData.id != this.currentCalendarEventId) {
      this.calendarFilterService.setShowHistoricalEvent(false);
    }
    this.overlayRef = this.overlay.create();
    const componentPortal = new ComponentPortal(LinkedTasksComponent);
    const componentRef = this.overlayRef.attach(componentPortal);
    componentRef.instance.calendarEvent = rowData;
    componentRef.instance.isShowLinkTaskBS = this.isShowLinkTask;
    componentRef.instance.destroyRef = () => {
      if (this.overlayRef) {
        this.overlayRef.detach();
        this.calendarFilterService.setShowHistoricalEvent(false);
        this.activeRowId = '';
      }
      this.isShowLinkTask?.next(!this.isShowLinkTask);
    };
    if (this.calendarFilterService.getShowHistoricalEventBS().getValue()) {
      componentRef.instance.currentTab = ECurrentTab.HISTORICAL_EVENTS;
    }
  }

  public destroyComponent(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  public handleCancelBulkCreateTasks() {
    this.checkDisplayToolbar();
    this.calendarService.setPopupBulkCreateTasks(null);
    this.startBulkCreateTasks = false;
  }

  public turnOffFocusView() {
    this.calendarFilterService.setFocusView(false);
  }

  public toggleCheckAll() {
    this.isCheckAll = !this.isCheckAll;
    this.handleCheckAllChange();
  }

  handleCloseLinkTask(isClose) {
    this.isShowLinkTask?.next(!isClose);
  }

  handleOpenPropertyProfile(rowData) {
    const { propertyId, propertyStatus } = rowData || {};
    this.propertyId = propertyId;
    if (propertyStatus === EPropertyStatus.deleted || !propertyId) return;
    this.visiblePropertyProfile = true;
    this.isShowLinkTask?.next(false);
  }

  handleEmitEventId(id) {
    if (!this.isHideEvent) return;
    this.calendarEventsList = (
      this.calendarEventsList as ICalendarEvent[]
    ).filter((item) => item.id !== id);
    this.ngZone.run(() => {
      this.store.dispatch(
        calendarDashboardActions.setAll({
          events: this.calendarEventsList as CalendarEvent[]
        })
      );
    });
  }

  subscribeGetShowEventWithoutTask() {
    this.calendarFilterService
      .getShowEventWithoutTasks$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.isHideEvent = res));
  }
}
