import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { transition, trigger, useAnimation } from '@angular/animations';
import { CdkPortal, DomPortalOutlet } from '@angular/cdk/portal';
import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  EmbeddedViewRef,
  Injector,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import dayjs from 'dayjs';
import { POSITION_MAP } from 'ng-zorro-antd/core/overlay';
import { ToastrService } from 'ngx-toastr';
import {
  distinctUntilChanged,
  filter,
  lastValueFrom,
  map,
  Subject,
  takeUntil
} from 'rxjs';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { NotificationService } from '@services/notification.service';
import { TaskService } from '@services/task.service';
import { TriggerMenuDirective } from '@shared/directives/trigger-menu.directive';
import { TaskNameId, TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { LinkedTaskListDataType } from '@shared/types/calendar.interface';
import { QueryParams } from '@shared/types/notification.interface';
import { TaskItemDropdown } from '@shared/types/task.interface';
import {
  ESentMsgEvent,
  ETypeMessage,
  ISendMsgResponseV2,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  closeMenu,
  openMenu
} from '@/app/dashboard/animation/triggerMenuAnimation';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CalendarEventService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-list-view/services/calendar-event.service';
import { PropertiesService } from '@services/properties.service';
import { TENANCY_STATUS } from '@services/constants';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { EEventStatus } from '@shared/enum/calendar.enum';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { IMailBox } from '@shared/types/user.interface';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { SocketType } from '@shared/enum/socket.enum';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { EVENT_ROUTE } from '@/app/dashboard/modules/calendar-dashboard/constants/event.constants';
enum ESidebarPopup {
  CREATE_CONVERSATION,
  CREATE_TASK,
  MAIL_IMPORT
}

@Component({
  selector: 'sidebar-item-create',
  templateUrl: './sidebar-item-create.component.html',
  styleUrls: ['./sidebar-item-create.component.scss'],
  animations: [
    trigger('menuAnimation', [
      transition(':enter', [useAnimation(openMenu)]),
      transition(':leave', [useAnimation(closeMenu)])
    ])
  ]
})
export class SidebarItemCreateComponent implements OnInit {
  @ViewChild('menu') menu: TriggerMenuDirective;
  createMenuPosition = [POSITION_MAP.right];
  isOpenCreateMenu = false;
  isMouseOver = false;
  activePopup: ESidebarPopup;
  listTaskName: TaskItemDropdown[] = [];
  createNewConversationConfigs = {
    'header.showDropdown': true,
    'header.title': null,
    'header.isPrefillProperty': false,
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'footer.buttons.sendType': ISendMsgType.BULK,
    'body.prefillReceivers': false,
    'otherConfigs.isCreateMessageType': true,
    'body.tinyEditor.attachBtn.disabled': false,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.SCRATCH,
    'otherConfigs.isShowGreetingContent': true,
    'inputs.openFrom': TaskType.MESSAGE
  };
  public createNewTaskConfigs: IConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      showDropdown: true
    }
  };
  TaskType = TaskType;
  typeMessage = ETypeMessage;
  ESidebarPopup = ESidebarPopup;
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;
  public listMailBox: IMailBox[] = [];
  private subscriber = new Subject<void>();
  @ViewChild(CdkPortal)
  private portal: CdkPortal;
  private embeddedViewRef: EmbeddedViewRef<any>;
  constructor(
    private toastService: ToastrService,
    private taskService: TaskService,
    private notificationService: NotificationService,
    private agencyService: AgencyService,
    private readonly router: Router,
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertiesService,
    private calendarEventService: CalendarEventService,
    private cfr: ComponentFactoryResolver,
    private cdr: ChangeDetectorRef,
    private ar: ApplicationRef,
    private injector: Injector,
    private inboxSidebarService: InboxSidebarService,
    public inboxService: InboxService,
    private toastCustomService: ToastCustomService,
    private messageFlowService: MessageFlowService
  ) {}

  ngOnInit(): void {
    this.listTaskName = [];
    this.getListMailBox();
    this.agencyService.listTask$
      .pipe(takeUntil(this.subscriber))
      .subscribe((topic) => {
        this.listTaskName = this.taskService.createTaskNameList();
      });

    this.activatedRoute.queryParams
      .pipe(
        filter((res) => this.checkFromMailReminder(res)),
        distinctUntilChanged((prev, curr) => {
          if (prev?.['notificationId'] && curr?.['notificationId']) {
            return prev?.['notificationId'] === curr?.['notificationId'];
          } else if (prev?.['eventId'] && curr?.['eventId']) {
            return prev?.['eventId'] === curr?.['eventId'];
          }
          return false;
        }),
        map((queryParam) => ({ queryParam })),
        takeUntil(this.subscriber)
      )
      .subscribe(({ queryParam }) => {
        this.handleTaskFromReminder(queryParam);
      });
    this.subscribeOpenTaskFromNotification();
    this.inboxSidebarService.openCreateSendMessage
      .pipe(takeUntil(this.subscriber))
      .subscribe((res) => {
        if (res) {
          this.handleClickOpenMenuCreate(ESidebarPopup.CREATE_CONVERSATION);
        }
      });
  }

  getListMailBox() {
    this.inboxService.listMailBoxs$
      .pipe(takeUntil(this.subscriber))
      .subscribe((listMailBoxs) => {
        if (!listMailBoxs) return;
        this.listMailBox = listMailBoxs;
      });
  }

  openMenu(event: MouseEvent, createMenu: TemplateRef<ElementRef>): void {
    if (!this.menu.menuTrigger) {
      this.menu.menuTrigger = createMenu;
    }
    this.menu.dClicked(event);
  }

  onMenuSaveChange(event: boolean) {
    this.isOpenCreateMenu = event;
    if (!this.isOpenCreateMenu) {
      this.menu.menuTrigger = null;
    }
  }

  checkFromMailReminder(queryParams) {
    return queryParams['action'] === 'createTask';
  }

  subscribeOpenTaskFromNotification() {
    this.taskService.openTaskFromNotification$
      .pipe(takeUntil(this.subscriber))
      .subscribe((data) => {
        if (!data) return;
        this.notificationService.handleCloseNotification();
        this.activePopup = ESidebarPopup.CREATE_TASK;
        this.menu?.close();
        this.cdr.markForCheck();
      });
  }

  handleClickOpenMenuCreate(activePopup: ESidebarPopup) {
    this.activePopup = activePopup;
    this.isOpenCreateMenu = false;
    if (activePopup === ESidebarPopup.CREATE_CONVERSATION) {
      this.messageFlowService
        .openSendMsgModal(this.createNewConversationConfigs)
        .pipe(takeUntil(this.subscriber))
        .subscribe((rs) => {
          switch (rs.type) {
            case ESendMessageModalOutput.MessageSent:
              this.onSendMsg(rs.data);
              break;
          }
        });
    }
    this.menu?.close();
    this.inboxSidebarService.openCreateSidebar.next(true);
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        if (event?.isDraft) {
          return;
        }
        const allAreNotAppUsers = event?.receivers.every(
          (item) => !item?.isAppUser
        );
        const foundMailBox = this.listMailBox.find(
          (item) => item?.id === event?.mailBoxId
        );
        if (
          foundMailBox?.status === EMailBoxStatus.DISCONNECT &&
          allAreNotAppUsers
        )
          return;
        const dataForToast = {
          conversationId:
            event.data?.[0]?.conversationId ||
            (event.data as ISendMsgResponseV2)?.conversation?.id ||
            (event.data as any)?.jobReminders?.[0]?.conversationId,
          taskId:
            event.data?.[0]?.taskId ||
            (event.data as ISendMsgResponseV2)?.task?.id ||
            (event.data as any)?.jobReminders?.[0]?.taskId,
          isShowToast: true,
          type:
            event?.type === ISendMsgType.SCHEDULE_MSG
              ? SocketType.send
              : SocketType.newTask,
          mailBoxId: event.mailBoxId || (event.data as any)?.mailBoxId,
          taskType: TaskType.MESSAGE,
          pushToAssignedUserIds: [],
          status:
            event.data?.[0]?.messageType ||
            (event.data as ISendMsgResponseV2)?.task?.status ||
            event.data?.[0]?.status ||
            TaskStatusType.inprogress
        };
        this.toastCustomService.openToastCustom(
          dataForToast,
          true,
          EToastCustomType.SUCCESS_WITH_VIEW_BTN
        );
        this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE, {
          enableHtml: true
        });

        break;
      case ESentMsgEvent.COMPLETED:
        this.closeActivePopup();
        break;
      default:
        break;
    }
  }

  handleTaskFromReminder(queryParams: Params) {
    const eventId = queryParams['eventId'];
    const notificationId = queryParams['notificationId'];

    this.calendarEventService
      .getLinkedTaskList(eventId)
      .subscribe(async (res: LinkedTaskListDataType) => {
        if (
          res?.completedTasks?.length ||
          res?.inprogressTasks?.length ||
          res?.eventStatus === EEventStatus.CANCELLED
        ) {
          const queryParamsObject: QueryParams = {
            date: dayjs(res.eventDate).format('YYYY-MM-DD'),
            eventId
          };
          const calendarRoute = EVENT_ROUTE;
          setTimeout(
            () =>
              this.router.navigate([calendarRoute], {
                replaceUrl: true,
                queryParams: queryParamsObject,
                queryParamsHandling: 'merge'
              }),
            0
          );
        } else {
          const propertyId = queryParams['propertyId'];
          const eventId = queryParams['eventId'] || queryParams['calendarId'];
          const taskNameId = queryParams['taskNameId'];
          const tenancyId = queryParams['tenancyId'];
          const regionId = queryParams['regionId'];
          const inspectionId = queryParams['inspectionId'];
          const type = queryParams['type'];
          const arrearId = queryParams['arrearId'];
          const complianceId = queryParams['complianceId'];
          let data: any = {
            propertyId,
            eventId,
            taskNameId
          };

          switch (taskNameId) {
            case TaskNameId.leaseRenewal: {
              const notification = await lastValueFrom(
                this.notificationService.getNotificationById(notificationId)
              );

              const notificationData = notification?.notification;

              if (!notificationData) {
                this.toastService.error('Notification not found.');
                return;
              }

              const {
                options: { userPropertyGroupId, propertyId }
              } = notificationData;

              const info = await this.propertyService.getTenancyStatus(
                propertyId,
                userPropertyGroupId
              );
              if (info === TENANCY_STATUS.vacated) {
                this.toastService.error(
                  'Cannot create task for vacated tenancy'
                );
                return;
              }

              data = {
                ...data,
                taskNameId,
                tenancyId,
                notificationId
              };
              break;
            }
            case TaskNameId.generalCompliance:
            case TaskNameId.smokeAlarms:
              data = {
                ...data,
                taskNameId,
                tenancyId,
                notificationId,
                complianceId
              };
              break;
            case TaskNameId.tenantVacate:
            case TaskNameId.tenantVacateQLD_SA_WA_ACT_RegionIds:
              data = {
                ...data,
                taskNameId,
                regionId,
                tenancyId,
                notificationId,
                type
              };
              break;
            case TaskNameId.leasing:
              data = {
                ...data,
                taskNameId,
                inspectionId,
                tenancyId,
                notificationId,
                type
              };
              break;
            case TaskNameId.breachNotice:
              data = {
                ...data,
                taskNameId,
                type,
                arrearId,
                regionId,
                notificationId,
                tenancyId
              };
              break;
            case TaskNameId.routineInspection:
            case TaskNameId.routineInspection_QLD:
            case TaskNameId.routineInspection_WA:
              data = {
                ...data,
                taskNameId,
                type,
                arrearId,
                regionId,
                notificationId,
                tenancyId,
                inspectionId
              };
              break;
            default:
              break;
          }
          this.taskService.openTaskFromNotification$.next(data);
        }
      });
  }

  closeActivePopup() {
    this.activePopup = null;
    if (this.taskService.openTaskFromNotification$?.value) {
      const currentParams = this.activatedRoute.snapshot.queryParams;
      const { inboxType, status, channelId, mailBoxId } = currentParams;
      this.router.navigate([], {
        queryParams: { inboxType, status, channelId, mailBoxId },
        replaceUrl: true
      });
      this.taskService.openTaskFromNotification$.next(null);
    }
  }

  ngAfterViewInit() {
    this.embeddedViewRef = new DomPortalOutlet(
      document.body,
      this.cfr,
      this.ar,
      this.injector
    ).attachTemplatePortal(this.portal);
  }

  ngOnDestroy() {
    this.subscriber.next();
    this.subscriber.complete();
    this.embeddedViewRef.destroy();
  }
}
