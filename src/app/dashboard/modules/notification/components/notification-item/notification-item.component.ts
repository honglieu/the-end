import { mapUsersToName } from '@core';
import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { ToastrService } from 'ngx-toastr';
import { Subject, of } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';
import { AppRoute } from '@/app/app.route';
import { stringFormat } from '@core';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { CompanyService } from '@services/company.service';
import { TENANCY_STATUS, TIME_FORMAT } from '@services/constants';
import { ErrorService } from '@services/error.service';
import { HeaderService } from '@services/header.service';
import { NotificationService } from '@services/notification.service';
import { PropertiesService } from '@services/properties.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import {
  EventChangeStatusEnum,
  NotificationStatusEnum,
  NotificationTabEnum,
  NotificationTypeEnum
} from '@shared/enum/notification.enum';
import { EInvoiceTaskType } from '@shared/enum/share.enum';
import { TaskNameId, TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  EUserPropertyType,
  GroupType,
  UserTypeEnum
} from '@shared/enum/user.enum';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import { userType } from '@trudi-ui';
import { UserConversation } from '@shared/types/conversation.interface';
import {
  IPolicyNotification,
  Notification,
  QueryParams
} from '@shared/types/notification.interface';
import { AgencyInSidebar } from '@shared/types/share.model';
import { IMailBox } from '@shared/types/user.interface';
import { CalendarFilterService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-filter/services/calendar-filter.service';
import { EMailProcess } from '@/app/dashboard/modules/inbox/modules/message-list-view/enum/message.enum';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { PreventButtonService } from '@trudi-ui';
import { EButtonCommonKey, EButtonType } from '@trudi-ui';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { EVENT_ROUTE } from '@/app/dashboard/modules/calendar-dashboard/constants/event.constants';
import { EPolicyType } from '@/app/dashboard/modules/agency-settings/enum/account-setting.enum';
import { PoliciesService } from '@/app/dashboard/modules/agency-settings/components/policies/services/policies.service';
import { IFile } from '@/app/shared/types';
import { IFileComment } from '@/app/task-detail/modules/steps/utils/comment.interface';

@Component({
  selector: 'notification-item',
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.scss'],
  providers: [TrudiTitleCasePipe]
})
export class NotificationItemComponent implements OnInit, OnChanges, OnDestroy {
  @Input() notification: Notification;
  public readonly NotificationStatusEnum = NotificationStatusEnum;
  public readonly NotificationType = NotificationTypeEnum;
  public readonly EPolicyType = EPolicyType;
  private unsubscribe = new Subject<void>();
  public TIME_FORMAT = TIME_FORMAT;
  public title = '';
  public agentName: AgencyInSidebar<null>;
  public titleNotification = '';
  public conversationId = '';
  public taskName = '';
  public taskType = TaskType;
  public userConversation: UserConversation;
  public showMessageUserType = false;
  public userName = '';
  public notiType;
  public userType;
  public status;
  public isShowPropertyAddressMsgType;
  public isShowPropertyAddressTaskType;
  public EUserPropertyType = EUserPropertyType;
  public currentCompanyId;
  public companies;
  public textLinktask: string;
  public isRmEnvironment: boolean = false;
  public isPtEnvironment: boolean = false;
  public pipeType: string = userType.NO_BRACKET;
  public statusNotifications = {
    markAsUnread: 'Mark as unread',
    markAsRead: 'Mark as read'
  };
  public hasAddAccount: boolean = false;
  public syncMailboxStatus: EMailBoxStatus;
  readonly EMailBoxStatus = EMailBoxStatus;
  public listMailbox: IMailBox[];
  public internalNoteContent: string = '';
  public internalNoteFile: IFileComment[] = [];

  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService,
    private headerService: HeaderService,
    private readonly router: Router,
    private titleCasePipe: TrudiTitleCasePipe,
    private calendarFilterService: CalendarFilterService,
    private propertyService: PropertiesService,
    private toastr: ToastrService,
    private sharedService: SharedService,
    private userService: UserService,
    private agencyDateFormatService: AgencyDateFormatService,
    private inboxService: InboxService,
    private errorService: ErrorService,
    private mailboxSettingService: MailboxSettingService,
    private inboxFilterService: InboxFilterService,
    private readonly store: Store,
    private companyService: CompanyService,
    private PreventButtonService: PreventButtonService,
    private policiesService: PoliciesService
  ) {}

  ngOnInit(): void {
    this.notificationService.markAsReadNoti
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((res) => {
          if (res && res === this.notification?.id) {
            return this.notificationService.markNotificationAsRead(
              this.notification?.id
            );
          } else {
            return of(null);
          }
        })
      )
      .subscribe((res) => {
        if (!res) return;
        this.notificationService.reloadNotiList.next(true);
        this.notificationService.removeNotiFromUnseenList(
          this.notification?.id
        );
      });

    this.isShowPropertyAddressMsgType =
      this.notification?.propertyAddress?.length &&
      this.notification?.notiType !==
        this.NotificationType.NEW_TASK_NO_PORTFOLIO &&
      this.notification?.notiType !==
        this.NotificationType.NEW_TASK_UNIDENTIFIED &&
      this.notification?.notiType !==
        this.NotificationType.CALL_TRANSCRIPTION &&
      this.userType !== 'Property Manager' &&
      this.userType !== EUserPropertyType.TENANT_PROSPECT;

    this.isShowPropertyAddressTaskType =
      this.notification?.propertyAddress?.length &&
      (!this.notification?.options?.isNoPortfolio ||
        (this.notification?.options?.isNoPortfolio &&
          this.notification?.notiType !==
            this.NotificationType.CALL_TRANSCRIPTION &&
          this.notification?.notiType !==
            this.NotificationType.NEW_TASK_NO_PORTFOLIO &&
          this.notification?.notiType !==
            this.NotificationType.NEW_TASK_UNIDENTIFIED &&
          (this.userType === EUserPropertyType.TENANT ||
            this.userType === EUserPropertyType.LANDLORD)));

    this.subscribeCurrentAgencyId();
    this.subscribeAgencies();
    this.titleNotification = this.notificationMessage(this.notification);
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.companyService.isRentManagerCRM(company);
        this.isPtEnvironment = this.companyService.isPropertyTreeCRM(company);
      });

    this.inboxService.listMailBoxs$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((list) => !!list)
      )
      .subscribe((list) => {
        this.listMailbox = list;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notification']) {
      this.handleUpdateNotificationData(changes['notification']?.currentValue);
    }
  }

  handleUpdateNotificationData(notificationValue: Notification) {
    this.notification = notificationValue;
    this.titleNotification = this.notificationMessage(this.notification);
    this.notiType = this.notification.notiType;
    this.userType = this.notification?.options?.userConversation?.type;
    this.userConversation = this.notification?.options
      ?.userConversation as UserConversation;
    this.status = this.notification?.taskStatus;
    this.textLinktask =
      this.notification?.countTask > 0
        ? `${this.notification?.countTask} linked ${
            this.notification?.countTask > 1 ? 'tasks' : 'task'
          }`
        : '';
    this.getLinkConversationId();
    if (this.notification?.taskType === this.taskType.MESSAGE) {
      this.getMessageTitle();
      this.showMessageUserType = this.checkShowMessageUserType();
      this.userName = this.getMessageUserName();
    } else {
      this.getTaskName();
      this.userType = this.getTaskUserType();
    }
  }

  subscribeCurrentAgencyId() {
    this.companyService
      .getCurrentCompanyId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.currentCompanyId = res;
      });
  }

  subscribeAgencies() {
    this.companyService
      .getCompanies()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.companies = res;
      });
  }

  getMessageUserName() {
    if (
      this.notiType === NotificationTypeEnum.CALL_TRANSCRIPTION &&
      !this.notification?.options?.isNoPortfolio
    ) {
      return (this.userName = '');
    }
    return (
      (this.userConversation?.firstName
        ? this.userConversation.firstName
        : '') +
      ' ' +
      (this.userConversation?.lastName ? this.userConversation.lastName : '')
    );
  }

  @HostListener('click', ['$event.target'])
  onClickNotification(target) {
    this.headerService.isOpenNotificationList.next(false);
    if (this.notification.status == NotificationStatusEnum.UN_SEEN)
      this.updateNotificationUnRead();
  }

  getLinkConversationId() {
    switch (this.notification.notiType) {
      case this.NotificationType.CALL_TRANSCRIPTION:
      case this.NotificationType.RECEIVED_REPLY:
        this.conversationId = this.notification.conversationId;
        break;
      default:
        break;
    }
  }

  onNavigateToAnotherPlace() {
    if (this.notification?.options?.type !== 'NO_ASSIGNED_TASK') {
      this.handleDefaultNavigate();
    }
    this.notificationService.handleCloseNotification();
    this.notificationService
      .markNotificationAsRead(this.notification.id)
      .subscribe({
        next: (res) => {
          this.taskService.currentTaskId$.next(this.notification.taskId);
          this.notificationService.reloadNotiList.next(true);
          this.notificationService.activeTab$.next(NotificationTabEnum.ALL);
        }
      });
  }

  async createTask(e: Event) {
    if (!this.shouldHandleProcess()) return;
    e.stopPropagation();
    this.notificationService
      .markNotificationAsRead(this.notification?.id)
      .subscribe((res) => {
        if (!res) return;
        this.notificationService.reloadNotiList.next(true);
      });
    if (
      this.notification.notiType === NotificationTypeEnum.REMINDER &&
      this.notification.countTask === 0
    ) {
      const {
        reminderType,
        idUserPropertyGroup,
        userPropertyGroupId,
        taskNameId,
        eventId,
        propertyId,
        inspectionId,
        regionId
      } = this.notification.options || {};
      const { parentRegionId } = this.notification || {};
      switch (reminderType) {
        case EInvoiceTaskType.LEASE_RENEWAL:
          const info = await this.propertyService.getTenancyStatus(
            propertyId,
            userPropertyGroupId
          );
          if (info === TENANCY_STATUS.vacated) {
            this.toastr.error('Cannot create task for vacated tenancy');
            return;
          }
          break;
        case EInvoiceTaskType.GENERAL_COMPLIANCE:
        case EInvoiceTaskType.SMOKE_ALARM:
        case EInvoiceTaskType.LEASE_START:
        case EInvoiceTaskType.INGOING_INSPECTION:
        case EInvoiceTaskType.ARREAR:
          this.checkExistTaskReminder();
          return;
        default:
          this.checkExistTaskReminder();
          return;
      }

      this.taskService.openTaskFromNotification$.next({
        propertyId,
        taskNameId,
        notificationId: this.notification.id,
        inspectionId,
        eventId,
        regionId,
        type: reminderType,
        tenancyId: idUserPropertyGroup,
        parentRegionId
      });
    }
  }

  navigateToSchedule(e: Event) {
    e.stopPropagation();
    this.calendarFilterService.clearAllFilter();
    const calendarRoute = EVENT_ROUTE;
    const queryParams: QueryParams = {
      startDate: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        this.notification?.eventDate
      ),
      endDate: '',
      eventId: this.notification.eventId,
      search: null,
      assignedTo: null,
      propertyManagerId: null,
      messageStatus: null,
      clearFilter: true
    };

    this.router.navigate([calendarRoute], {
      replaceUrl: true,
      queryParams
    });
    if (this.notification?.status === NotificationStatusEnum.UN_SEEN) {
      this.notificationService.markAsReadNoti.next(this.notification?.id);
    }
    this.notificationService.handleCloseNotification();
  }

  checkExistTaskReminder() {
    const notificationId = this.notification.id;
    this.taskService
      .checkNotificationHasTask(notificationId)
      .subscribe((res) => {
        if (res?.taskIds?.length) {
          this.router.navigate(
            [stringFormat(AppRoute.TASK_DETAIL, res?.taskIds[0])],
            {
              replaceUrl: true,
              queryParams: {
                type: 'TASK'
              }
            }
          );
          this.notificationService.markAsReadNoti.next(notificationId);
          this.notificationService.handleCloseNotification();
        } else {
          const {
            reminderType,
            propertyId,
            taskNameId,
            inspectionId,
            complianceId,
            regionId,
            idUserPropertyGroup,
            eventId,
            calendarId,
            arrearId
          } = this.notification.options;
          const { parentRegionId } = this.notification || {};

          let data: any = {
            propertyId,
            eventId: eventId || calendarId,
            taskNameId,
            type: reminderType,
            regionId,
            parentRegionId
          };

          switch (taskNameId) {
            case TaskNameId.generalCompliance:
            case TaskNameId.smokeAlarms:
              data = {
                ...data,
                taskNameId,
                tenancyId: idUserPropertyGroup,
                notificationId,
                inspectionId,
                complianceId
              };
              break;
            case TaskNameId.leasing:
              if (reminderType === EInvoiceTaskType.LEASE_START) {
                data = {
                  ...data,
                  taskNameId,
                  notificationId,
                  tenancyId: idUserPropertyGroup,
                  type: reminderType
                };
              } else {
                data = {
                  ...data,
                  taskNameId,
                  notificationId,
                  inspectionId,
                  tenancyId: idUserPropertyGroup
                };
              }
              break;
            case TaskNameId.breachNotice:
              data = {
                ...data,
                taskNameId,
                notificationId,
                type: reminderType,
                regionId: regionId,
                arrearId,
                tenancyId: idUserPropertyGroup
              };
              break;
            default:
              break;
          }
          this.taskService.openTaskFromNotification$.next(data);
        }
      });
  }

  notificationMessage(notification: Notification) {
    const taskTypeStr =
      (notification?.options?.taskType || notification?.taskType) ===
      this.taskType.TASK
        ? 'task'
        : 'message';
    const mailboxName =
      (notification?.options?.taskType || notification?.taskType) ===
      this.taskType.TASK
        ? ''
        : ` ${
            notification?.mailBox?.name ?? notification?.options?.mailBox?.name
          }`;
    switch (notification.notiType) {
      case NotificationTypeEnum.NEW_TASK:
        return `You have received <span class="text-notification">a new ${taskTypeStr}</span> in${mailboxName}:`;
      case NotificationTypeEnum.ASSIGNED_TASK:
        return `You have been assigned to <span class="text-notification">a ${taskTypeStr}</span> in${mailboxName}:`;
      case NotificationTypeEnum.UNASSIGNED_TASK:
        return `You have been unassigned from <span class="text-notification">a ${taskTypeStr}</span> in${mailboxName}:`;
      case NotificationTypeEnum.RECEIVED_REPLY:
        return `You have received <span class="text-notification">a reply</span> in ${mailboxName}:`;
      case NotificationTypeEnum.NEW_TASK_UNIDENTIFIED:
      case NotificationTypeEnum.NEW_TASK_NO_PORTFOLIO:
        return `You have received <span class="text-notification">a new ${taskTypeStr}</span> in${mailboxName}:`;
      case NotificationTypeEnum.CALL_TRANSCRIPTION:
        const user = this.notification?.options?.user;
        const userName = `${user?.firstName || ''} ${user?.lastName || ''}`;
        const userPrimary = user?.isPrimary ? 'Primary ' : '';
        const userType = user?.type || '';
        return `Your recent call with <span class="text-notification">${userName} (${userPrimary}${userType})</span> has finished processing.`;
      case NotificationTypeEnum.CANCELLED_TASK:
        return 'A routine inspection has been <span class="text-notification">cancelled</span> via Property Tree';
      case NotificationTypeEnum.RESCHEDULED_TASK:
        return 'A routine inspection has been <span class="text-notification">rescheduled</span> via Property Tree';
      case NotificationTypeEnum.COMPLETED_TASK:
        return 'A routine inspection has been <span class="text-notification">completed</span> via Property Tree';
      case NotificationTypeEnum.RESCHEDULE_REQUEST:
        return `${mailboxName} has received <span class="text-notification"> a reply: </span>`;
      case NotificationTypeEnum.REMINDER:
        notification.taskId = notification.options?.['taskId'];
        return (
          '<span class="text-notification">Reminder:</span> ' +
          this.titleCasePipe.transform(notification.options?.['headerTitle'])
        );
      case NotificationTypeEnum.EVENT_CHANGE_DATA:
        notification.taskId = notification.options?.['taskId'];
        const eventKey = notification.options?.['key'];

        const eventChangeMessages = {
          [EventChangeStatusEnum.INSPECTION_CHANGE_TIME]: `<span class="text-notification">${
            this.titleCasePipe.transform(
              notification.options?.inspectionType
            ) || 'Routine'
          } inspection</span> has been rescheduled:`,
          [EventChangeStatusEnum.INSPECTION_CHANGE_STATUS]: `<span class="text-notification">${
            this.titleCasePipe.transform(
              notification.options?.inspectionType
            ) || 'Routine'
          } inspection</span> has changed status:`,
          [EventChangeStatusEnum.LEASE_CHANGE_TIME_START]:
            '<span class="text-notification">Lease start date</span> has been rescheduled:',
          [EventChangeStatusEnum.LEASE_CHANGE_TIME_END]:
            '<span class="text-notification">Lease end date</span> has been rescheduled:',
          [EventChangeStatusEnum.INVOICE_CHANGE_STATUS]:
            '<span class="text-notification">Tenancy invoice</span> has changed status:',
          [EventChangeStatusEnum.COMPLIANCE_CHANGE_EXPIRY_DATE]: `<span class="text-notification">${this.titleCasePipe.transform(
            notification.options?.categoryName
          )} - Expiry</span> has been rescheduled:`,
          [EventChangeStatusEnum.COMPLIANCE_CHANGE_NEXT_SERVICE_DATE]: `<span class="text-notification">${this.titleCasePipe.transform(
            notification.options?.categoryName
          )} - Next service</span> has been rescheduled:`,
          [EventChangeStatusEnum.COMPLIANCE_CANCEL_EXPIRY_DATE]: `<span class="text-notification">${this.titleCasePipe.transform(
            notification.options?.categoryName
          )} - Expiry</span> date has been removed:`,
          [EventChangeStatusEnum.COMPLIANCE_CANCEL_NEXT_SERVICE_DATE]: `<span class="text-notification">${this.titleCasePipe.transform(
            notification.options?.categoryName
          )} - Next service</span> date has been removed:`,
          [EventChangeStatusEnum.COMPLIANCE_CHANGE_STATUS_EXPIRY_DATE]: `<span class="text-notification">${this.titleCasePipe.transform(
            notification.options?.categoryName
          )} - Expiry</span> has been closed:`,
          [EventChangeStatusEnum.COMPLIANCE_CHANGE_STATUS_NEXT_SERVICE_DATE]: `<span class="text-notification">${this.titleCasePipe.transform(
            notification.options?.categoryName
          )} - Next service</span> has been closed:`,
          [EventChangeStatusEnum.COMPLIANCE_DELETE_EXPIRY_DATE]: `<span class="text-notification">${this.titleCasePipe.transform(
            notification.options?.categoryName
          )} - Expiry</span> has been deleted:`,
          [EventChangeStatusEnum.COMPLIANCE_DELETE_NEXT_SERVICE_DATE]: `<span class="text-notification">${this.titleCasePipe.transform(
            notification.options?.categoryName
          )} - Next service</span> has been deleted:`,
          [EventChangeStatusEnum.VACATE_CHANGE_TIME]: `<span class="text-notification">Vacate date</span> has been rescheduled:`,
          [EventChangeStatusEnum.ARREAR_INVOICE_CHANGE]: `<span class="text-notification">Arrears</span> ${notification.options?.['arrearType']} has been rectified:`,
          [EventChangeStatusEnum.ARREAR_RENT_CHANGE]: `<span class="text-notification">Arrears</span> ${notification.options?.['arrearType']} has been rectified:`,
          [EventChangeStatusEnum.LEASE_END_CHANGE_TIME_RM]: `<span class="text-notification">Lease end date</span> has been rescheduled:`,
          [EventChangeStatusEnum.LEASE_START_CHANGE_TIME_RM]: `<span class="text-notification">Lease start date</span> has been rescheduled:`,
          [EventChangeStatusEnum.MOVE_IN_CHANGE_TIME_RM]: `<span class="text-notification">Move in date</span> has been rescheduled:`,
          [EventChangeStatusEnum.MOVE_OUT_CHANGE_TIME_RM]: `<span class="text-notification">Move out date</span> has been rescheduled:`,
          [EventChangeStatusEnum.INSPECTION_CHANGE_TIME_RM]: `<span class="text-notification">${notification.options?.['inspectionType']} inspection</span> has been rescheduled:`,
          [EventChangeStatusEnum.INSPECTION_CHANGE_STATUS_RM]: `<span class="text-notification">${notification.options?.['inspectionType']} inspection</span> has changed status:`,
          [EventChangeStatusEnum.ISSUE_OPEN_CHANGE_TIME_RM]: `<span class="text-notification">Issue open date</span> has been rescheduled:`,
          [EventChangeStatusEnum.ISSUE_OPEN_CHANGE_STATUS_RM]: `<span class="text-notification">Issue</span> has changed status:`,
          [EventChangeStatusEnum.INVOICE_CHANGE_STATUS_RM]: `<span class="text-notification">Tenancy invoice </span>${notification.options?.[
            'headerTitle'
          ]?.slice('Tenant invoice'.length)}:`
        };

        return eventChangeMessages[eventKey] || '';
      case NotificationTypeEnum.NEW_SHARED_MAIL_BOX:
        const { firstName, lastName } = this.notification.options.owner;
        return `${this.sharedService.displayName(
          firstName,
          lastName
        )} has added you to <span class="text-notification">the shared mailbox</span>:`;
      case NotificationTypeEnum.NEW_INTERNAL_NOTE_MENTIONED:
        return this.handleShowInternalNoteNotification();
      case NotificationTypeEnum.NEW_INTERNAL_NOTE_COMMENTED:
        return this.handleShowInternalNoteNotification(true);
      case NotificationTypeEnum.COMPANY_POLICY:
        const options = this.notification?.options as IPolicyNotification;
        let action;
        switch (options?.actionType) {
          case EPolicyType.create:
            action = 'added a new policy:';
            break;
          case EPolicyType.update:
            action = 'edited a policy:';
            break;
          case EPolicyType.delete:
            action = 'deleted a policy:';
            break;
        }

        const actor =
          options?.role === UserTypeEnum.ADMIN ||
          options?.role === UserTypeEnum.SUPERADMIN
            ? 'Trudi team'
            : `${options?.firstName}`;
        return `${actor} has ${action}`;
      default:
        return '';
    }
  }

  handleShowInternalNoteNotification(isCommented?: boolean) {
    const pmName = this.findPmDisplayName();
    if (isCommented) {
      return `<span class="text-notification">${pmName}</span> left a comment in your <span class="text-notification">task</span>:`;
    } else {
      return `You have been mentioned in <span class="text-notification">a comment:</span>`;
    }
  }

  findPmDisplayName() {
    const { firstName, lastName } =
      this.notification?.options.note?.createdUser;
    return this.sharedService.displayName(firstName, lastName);
  }

  updateNotificationAsRead() {
    this.notificationService
      .markNotificationAsRead(this.notification.id)
      .subscribe({
        next: () => {
          this.updateNotificationStatus(NotificationStatusEnum.SEEN);
          this.notificationService.removeNotiFromUnseenList(
            this.notification.id
          );
          this.notificationService.unreadCount.next(
            this.notificationService.unreadCount.value - 1
          );
        }
      });
  }

  updateNotificationUnRead() {
    this.notificationService
      .markNotificationUnRead(this.notification.id)
      .subscribe({
        next: () => {
          this.updateNotificationStatus(NotificationStatusEnum.UN_SEEN);
          this.notificationService.addNotificationToUnseenList(
            this.notification
          );
          this.notificationService.unreadCount.next(
            this.notificationService.unreadCount.value + 1
          );
        }
      });
  }

  updateNotificationStatus(status) {
    const activeTab = this.notificationService.activeTab$.getValue();
    if (
      activeTab === NotificationTabEnum.ALL ||
      activeTab === NotificationTabEnum.UNREAD
    ) {
      this.notification.status = status;
    } else {
      this.getAllNotification(0);
    }
  }

  getAllNotification(pageIndex: number) {
    this.notificationService.getListNotification(pageIndex).subscribe((rs) => {
      this.notificationService.currentAllPage$.next(rs.currentPage);
      this.notificationService.currentAllTotalPage$.next(rs.totalPages);
    });
  }

  getTaskName() {
    let startTime = null;
    let endTime = null;
    let inspectionDate = null;

    const inspectionVariables = this.notification?.options?.inspectionVariables;
    if (inspectionVariables) {
      const { startTime: inspStartTime, endTime: inspEndTime } =
        inspectionVariables;
      startTime = dayjs.utc(inspStartTime).format(TIME_FORMAT);
      endTime = dayjs.utc(inspEndTime).format(TIME_FORMAT);
      inspectionDate = dayjs
        .utc(inspStartTime)
        .format(
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
        );
    }

    switch (this.notification.notiType) {
      case NotificationTypeEnum.RECEIVED_REPLY:
        if (!this.notification.options?.messageTitle) {
          this.taskName = 'RE: ' + this.notification.conversationTitle;
        } else {
          if (this.notification.taskName === 'Unidentified Enquiry') {
            this.taskName = 'RE: ' + this.notification.conversationTitle;
          } else {
            this.taskName = 'RE: ' + this.notification.taskName;
          }
        }
        break;
      case NotificationTypeEnum.CALL_TRANSCRIPTION:
        this.taskName = 'View call transcription';
        break;
      case NotificationTypeEnum.RESCHEDULED_TASK:
      case NotificationTypeEnum.CANCELLED_TASK:
      case NotificationTypeEnum.COMPLETED_TASK:
        this.taskName =
          this.notification.notiType === NotificationTypeEnum.RESCHEDULED_TASK
            ? this.notification?.options?.inspectionVariables?.notification
                .replace('${inspection date}', inspectionDate)
                .replace('${start time}', startTime)
                .replace('${end time}', endTime)
            : `${this.titleCasePipe.transform(
                this.notification?.taskName
              )}\n${inspectionDate}, ${startTime} - ${endTime}`;
        break;
      case NotificationTypeEnum.REMINDER:
        this.taskName = this.titleCasePipe.transform(
          this.notification.options?.['bodyTitle']
        );
        break;
      case NotificationTypeEnum.EVENT_CHANGE_DATA:
        this.taskName = this.notification.options?.['bodyTitle'];
        break;
      case NotificationTypeEnum.NEW_SHARED_MAIL_BOX:
        this.taskName = this.notification?.options?.email || '';
        break;
      case NotificationTypeEnum.NEW_INTERNAL_NOTE_MENTIONED:
      case NotificationTypeEnum.NEW_INTERNAL_NOTE_COMMENTED:
        const taskTitle = mapUsersToName(
          this.notification?.options?.note.text,
          this.notification?.options?.note.internalNoteMentions
        );
        this.internalNoteContent = taskTitle.replace(/<p>|<\/p>/g, '');

        const files = this.notification.options?.note?.children?.map(
          (file) => file?.internalNoteFile
        );
        this.internalNoteFile = files.slice(0, 2);

        this.taskName = this.notification.taskName;
        break;
      case NotificationTypeEnum.COMPANY_POLICY:
        this.taskName = (
          this.notification?.options as IPolicyNotification
        ).policyName;
        break;
      default:
        this.taskName = this.notification?.options?.messageTitle
          ? this.notification?.options?.messageTitle
          : this.titleCasePipe.transform(this.notification?.taskName);
        if (inspectionVariables)
          this.taskName = `${this.titleCasePipe.transform(
            this.taskName
          )}\n${inspectionDate}, ${startTime} - ${endTime}`;
        break;
    }
  }
  getMessageTitle() {
    if (this.notification.notiType === NotificationTypeEnum.RECEIVED_REPLY) {
      if (!this.notification?.options?.messageTitle) {
        this.taskName = this.notification.options?.messageTitle;
      } else {
        if (this.notification.taskName === 'Unidentified Enquiry') {
          this.taskName = 'RE: ' + this.notification?.options?.messageTitle;
        } else {
          this.taskName =
            'RE: ' +
            (this.notification?.conversationTitle === 'Enquiry'
              ? '(no subject)'
              : this.notification?.conversationTitle ||
                this.notification?.options.messageTitle);
        }
      }
    } else if (this.notiType === NotificationTypeEnum.CALL_TRANSCRIPTION) {
      this.taskName = 'View call transcription';
    } else {
      this.taskName =
        this.notification?.options?.messageTitle ||
        this.notification?.conversationTitle;
    }
  }

  checkShowMessageUserType() {
    switch (this.userType) {
      case EUserPropertyType.AGENT:
        this.userType = 'Property Manager';
        break;
      case EUserPropertyType.OTHER:
        this.userType = 'Other';
        break;
      case EUserPropertyType.EXTERNAL:
        this.userType = '';
        break;
    }

    if (
      this.notiType === NotificationTypeEnum.ASSIGNED_TASK ||
      this.notiType === NotificationTypeEnum.UNASSIGNED_TASK
    ) {
      return true;
    }
    if (this.status === TaskStatusType.unassigned) {
      if (
        this.notification.options?.isNoPortfolio ||
        this.userType === EUserPropertyType.USER
      ) {
        return false;
      }
      return true;
    }

    return this.userConversation?.type !== null;
  }

  getTaskUserType() {
    if (this.notification.userMessage?.type) {
      if (this.notification.userMessage?.userProperty?.isPrimary) {
        return `Primary ${this.notification.userMessage.type}`;
      }
      return `${this.notification.userMessage.type}`;
    }
    return '';
  }

  shouldHandleProcess(): boolean {
    return this.PreventButtonService.shouldHandleProcess(
      EButtonCommonKey.NAVIGATE_NOTIFICATION_ITEM,
      EButtonType.COMMON
    );
  }

  checkToNavigate(e: Event) {
    if (!this.shouldHandleProcess()) return;
    if (
      [
        NotificationTypeEnum.NEW_TASK_NO_PORTFOLIO,
        NotificationTypeEnum.NEW_TASK_UNIDENTIFIED,
        NotificationTypeEnum.NEW_SHARED_MAIL_BOX
      ].includes(this.notification?.notiType)
    ) {
      this.userService
        .checkMailboxIsExist(
          this.notification?.mailBox?.id ||
            this.notification?.options?.mailBoxId
        )
        .subscribe({
          next: (res) => {
            if (res) {
              const mailBoxId =
                this.notification?.options?.mailBoxId ||
                this.notification?.mailBox?.id;
              this.inboxService.setCurrentMailBoxId(mailBoxId);

              switch (this.notification?.notiType) {
                case NotificationTypeEnum.NEW_SHARED_MAIL_BOX:
                  this.handleNavigateToSharedMailbox(e, res);
                  break;
                case NotificationTypeEnum.NEW_INTERNAL_NOTE_MENTIONED:
                case NotificationTypeEnum.NEW_INTERNAL_NOTE_COMMENTED:
                  this.handleNavigateToInternalNote();
                  break;
                default:
                  this.handleDefaultNavigate();
                  break;
              }
              if (
                this.notification?.status === NotificationStatusEnum.UN_SEEN
              ) {
                this.notificationService.markAsReadNoti.next(
                  this.notification?.id
                );
              }
              this.notificationService.handleCloseNotification();
            } else {
              this.notificationService.markAsReadNoti.next(
                this.notification?.id
              );
              this.notificationService.handleCloseNotification();
              this.notificationService.setOpenModalWarningFromNoti(true);
              this.errorService.handleShowMailBoxPermissionWarning(true);
            }
          },
          error: (err) => {
            this.notificationService.markAsReadNoti.next(this.notification?.id);
            this.notificationService.handleCloseNotification();
            this.errorService.handleShowMailBoxPermissionWarning(true);
            this.notificationService.setOpenModalWarningFromNoti(true);
          }
        });
      return;
    } else if (
      this.notification.hasOwnProperty('countTask') &&
      this.notification.countTask >= 0 &&
      [
        NotificationTypeEnum.EVENT_CHANGE_DATA,
        NotificationTypeEnum.REMINDER
      ].includes(this.notification.notiType)
    ) {
      this.navigateToSchedule(e);
    } else if (
      [
        NotificationTypeEnum.NEW_TASK,
        NotificationTypeEnum.ASSIGNED_TASK,
        NotificationTypeEnum.UNASSIGNED_TASK,
        NotificationTypeEnum.RECEIVED_REPLY,
        NotificationTypeEnum.NEW_INTERNAL_NOTE_MENTIONED,
        NotificationTypeEnum.NEW_INTERNAL_NOTE_COMMENTED
      ].includes(this.notification?.notiType)
    ) {
      switch (this.notification?.notiType) {
        case NotificationTypeEnum.NEW_INTERNAL_NOTE_MENTIONED:
        case NotificationTypeEnum.NEW_INTERNAL_NOTE_COMMENTED:
          this.handleNavigateToInternalNote();
          break;
        default:
          this.handleDefaultNavigate();
          break;
      }
      if (this.notification?.status === NotificationStatusEnum.UN_SEEN) {
        this.notificationService.markAsReadNoti.next(this.notification?.id);
      }
      this.notificationService.handleCloseNotification();
    } else if (
      this.notification?.notiType === NotificationTypeEnum.COMPANY_POLICY
    ) {
      const options = this.notification?.options as IPolicyNotification;
      this.handleNavigatetoPolicy(e, options);
      if (this.notification?.status === NotificationStatusEnum.UN_SEEN) {
        this.notificationService.markAsReadNoti.next(this.notification?.id);
      }
      this.notificationService.handleCloseNotification();
    } else {
      this.onNavigateToAnotherPlace();
    }
  }

  handleDefaultNavigate() {
    this.taskService
      .checkUserAssignedToTask(this.notification.taskId)
      .subscribe((res) => {
        const {
          isAssigned,
          status,
          mailBoxId,
          isMoveToMailFolder,
          mailMessageId,
          threadId,
          mailFolderId
        } = res || {};
        const currentInboxType = isAssigned
          ? GroupType.MY_TASK
          : GroupType.TEAM_TASK;
        const currentMailboxId = this.notification?.mailBox?.id;
        const currentAgencyId = this.notification.agencyId;
        let defaultRoute = stringFormat(
          AppRoute.TASK_DETAIL,
          this.notification.taskId
        );
        let queryParams = {
          conversationId: this.notification.conversationId,
          mailBoxId: currentMailboxId,
          inboxType: currentInboxType,
          status: status || TaskStatusType.inprogress
        };
        if (this?.notification?.taskType === TaskType.MESSAGE) {
          const concatUrl =
            status === TaskStatusType.deleted
              ? '/deleted'
              : status === TaskStatusType.completed
              ? '/resolved'
              : '';
          defaultRoute = `${stringFormat(
            this?.notification?.conversationType === EConversationType.APP
              ? AppRoute.APP_MESSAGE_INDEX
              : this?.notification?.conversationType ===
                EConversationType.VOICE_MAIL
              ? AppRoute.VOICE_MAIL_MESSAGE_INDEX
              : AppRoute.MESSAGE_INDEX
          )}${concatUrl}`;
          queryParams['taskId'] = this.notification?.parentConversation
            ? this.notification?.parentConversation?.taskId
            : this.notification?.taskId;
          if (this.notification?.parentConversation) {
            queryParams['showMessageInTask'] = true;
            this.inboxFilterService.setShowMessageInTask(true);
          }
          queryParams['conversationType'] = this.notification?.conversationType;
        } else if (this?.notification?.taskType === TaskType.TASK) {
          queryParams['type'] = TaskType.TASK;
          queryParams['conversationType'] =
            this?.notification?.conversationType;
        }
        if (isMoveToMailFolder && mailMessageId && threadId && mailFolderId) {
          queryParams.status = TaskStatusType.mailfolder;
          queryParams['externalId'] = mailFolderId;
          queryParams['threadId'] = threadId;
          queryParams['emailMessageId'] = mailMessageId;
          defaultRoute = `dashboard/inbox/mail`;
        }
        this.router.navigate([defaultRoute], { queryParams });
      });
  }

  handleNavigateToSharedMailbox(e: Event, newMailbox) {
    e.stopPropagation();
    const inboxRoute = stringFormat(AppRoute.MESSAGE_INDEX);
    const currentMailboxId = this.notification?.options?.mailBoxId;
    const currnentInboxType = this.inboxFilterService.getSelectedInboxType();
    const queryParams = {
      mailProcess: EMailProcess.NEW_SHARED_MAILBOX,
      notificationId: this.notification?.id,
      mailBoxId: currentMailboxId,
      inboxType: currnentInboxType,
      status: TaskStatusType.inprogress
    };
    const isExistNewMailbox = this.listMailbox.find(
      (mail) => mail.id === newMailbox.id
    );
    if (!isExistNewMailbox) {
      const listMailbox = [...this.listMailbox, newMailbox];
      const companyAgents = this.companyService.listCompanyAgentValue;

      companyAgents[0].mailBoxes = Array.from(
        new Map(listMailbox.map((m) => [m.id, m])).values()
      );
      this.companyService.setListCompanyAgent(companyAgents);
    }
    const currentMailBox = this.listMailbox.find(
      (mail) => mail.id === currentMailboxId
    );
    this.inboxService.setCurrentMailBox(currentMailBox);
    this.inboxService.setCurrentMailBoxId(currentMailboxId);
    this.mailboxSettingService.setMailBoxId(currentMailboxId);
    this.mailboxSettingService.setRole(currentMailBox.role);
    this.router.navigate([inboxRoute], {
      queryParams
    });
  }

  changeStatusNoti(event: Event) {
    if (this.notification.status === NotificationStatusEnum.UN_SEEN) {
      this.updateNotificationAsRead();
      event.stopPropagation();
    } else {
      this.updateNotificationUnRead();
      event.stopPropagation();
    }
  }

  handleNavigateToInternalNote() {
    const internalNoteRoute = `${stringFormat(
      AppRoute.TASK_DETAIL,
      this.notification.taskId
    )}`;
    this.router.navigate([internalNoteRoute], {
      queryParams: {
        stepId: this.notification.options?.stepId,
        friendlyId: this.notification.options.note?.friendlyId
      },
      queryParamsHandling: ''
    });
  }

  handleNavigatetoPolicy(e: Event, option: IPolicyNotification) {
    e.stopPropagation();
    if (option.isPolicyDeleted) {
      this.toastr.error('Policy has been deleted');
    }
    const policyRoute = ['dashboard', 'agency-settings', 'policies'];
    this.router.navigate(policyRoute, {
      queryParams: {
        openPolicyPanel: !option.isPolicyDeleted,
        policyId: option.policyId
      },
      replaceUrl: true
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
