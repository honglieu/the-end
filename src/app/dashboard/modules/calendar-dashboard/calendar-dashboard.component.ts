import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest, distinctUntilChanged, takeUntil } from 'rxjs';
import { HeaderService } from '@services/header.service';
import { LoadingService } from '@services/loading.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { TaskItemDropdown } from '@shared/types/task.interface';
import { UserPropInSelectPeople } from '@shared/types/user.interface';
import { ICalendarEvent } from './interfaces/calendar-dashboard.interface';
import { NavigatorService } from '@services/navigator.service';
import { NavigationStart, Router } from '@angular/router';
import { CalendarService } from './services/calendar.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { SyncPropertyDocumentStatus } from '@shared/types/socket.interface';
import { SocketType } from '@shared/enum/socket.enum';
import { TaskType } from '@shared/enum/task.enum';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { ToastrService } from 'ngx-toastr';
import { EventsTabApiService } from '@shared/components/property-profile/components/events-tab/events-tab-service/events-tab-api.service';

@Component({
  selector: 'calendar-dashboard',
  templateUrl: './calendar-dashboard.component.html',
  styleUrls: ['./calendar-dashboard.component.scss']
})
export class CalendarDashboardComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();
  public activeProperty: UserPropInSelectPeople[] = [];
  public createTaskByCateOpenFrom = CreateTaskByCateOpenFrom;
  public taskNames: TaskItemDropdown[] = [];
  public taskNamesForCreateModal: TaskItemDropdown[] = [];
  public isShowCreateTaskModal: boolean = false;
  public selectedTenancyId: string;
  public selectedEvent: ICalendarEvent;
  public selectedEventFromEventsTab: ICalendarEvent;

  constructor(
    private loadingService: LoadingService,
    private headerService: HeaderService,
    private propertiesService: PropertiesService,
    private taskService: TaskService,
    private navigatorService: NavigatorService,
    private calendarService: CalendarService,
    private agencyService: AgencyService,
    private websocketService: RxWebsocketService,
    private toastCustomService: ToastCustomService,
    private toastService: ToastrService,
    private router: Router,
    private readonly eventsTabApiService: EventsTabApiService
  ) {}

  ngOnInit(): void {
    this.subscribeToSocketNotifySendBulkMessageDone();
    this.loadingService.stopLoading();
    this.headerService.setHeaderState({ title: 'Calendar' });
    this.calendarService
      .getRmInspectionType()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.calendarService.setListRmInspectionType(res || []);
      });

    combineLatest([
      this.agencyService.listTask$,
      this.taskService.calendarEventSelected$,
      this.eventsTabApiService.getLinkEvent$()
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([taskNameList, calendarEvent, calendarEventFromEventTab]) => {
        this.selectedEventFromEventsTab = calendarEventFromEventTab;
        this.selectedEvent = calendarEvent;
        this.taskNames = this.taskService.createTaskNameList();
      });

    this.router.events.pipe(takeUntil(this.unsubscribe)).subscribe((rs) => {
      if (rs instanceof NavigationStart) {
        if (rs.url.includes('detail'))
          this.navigatorService.setReturnUrl(this.router.url);
        else this.navigatorService.setReturnUrl(null);
      }
    });

    this.subscribeActiveProperties();
  }

  subscribeActiveProperties() {
    this.propertiesService.listofActiveProp
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) this.activeProperty = res;
      });
  }

  subscribeToSocketNotifySendBulkMessageDone() {
    this.websocketService.onSocketNotifySendBulkMessageDone
      .pipe(
        distinctUntilChanged(
          (pre, cur) => pre?.socketTrackId === cur?.socketTrackId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((data) => {
        let messageLabel = '';
        if (data?.messages?.[0]?.isDraft) return;
        if (data.status === SyncPropertyDocumentStatus.SUCCESS) {
          if (data.messageSended === 1) {
            // TODO: check impact when changed 'type' from SocketType.newTask => SocketType.notifySendManyEmailMessageDone
            const dataForToast = {
              conversationId: data.messages[0]?.conversationId,
              taskId: data.messages[0].taskId,
              isShowToast: true,
              type: SocketType.notifySendManyEmailMessageDone,
              mailBoxId: data.mailBoxId,
              taskType: data.taskType || TaskType.MESSAGE,
              pushToAssignedUserIds: [],
              status: data.messages[0].status
            };
            this.toastCustomService.openToastCustom(
              dataForToast,
              true,
              EToastCustomType.SUCCESS_WITH_VIEW_BTN
            );
          } else {
            messageLabel = `${data.messageSended} messages`;
            this.toastService.success(`${messageLabel} sent`);
          }
        } else {
          let messageFailed = data.totalMessage - data.messageSended;
          messageLabel = `${messageFailed} ${
            messageFailed === 1 ? 'message' : 'messages'
          }`;
          this.toastService.error(
            `${data.totalMessage - data.messageSended} failed to send`
          );
        }
      });
  }

  getTaskNames() {
    this.taskNames = this.taskService.createTaskNameList();
  }

  handleCloseModal() {
    this.taskService.calendarEventSelected$.next(null);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.handleCloseModal();
  }
}
