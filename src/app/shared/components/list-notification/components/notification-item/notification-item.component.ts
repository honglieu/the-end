import dayjs from 'dayjs';
import {
  Component,
  Input,
  OnInit,
  HostListener,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { AgencyService } from '@services/agency.service';
import { TIME_FORMAT } from '@services/constants';
import { HeaderService } from '@services/header.service';
import { NotificationService } from '@services/notification.service';
import { TaskService } from '@services/task.service';
import {
  NotificationStatusEnum,
  NotificationTypeEnum,
  NotificationTabEnum,
  EventChangeStatusEnum
} from '@shared/enum/notification.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { UserConversation } from '@shared/types/conversation.interface';
import { Notification } from '@shared/types/notification.interface';
import { AgencyInSidebar } from '@shared/types/share.model';
import { ConversationService } from '@services/conversation.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { EInvoiceTaskType } from '@shared/enum/share.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

@Component({
  selector: 'notification-item',
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.scss']
})
export class NotificationItemComponent implements OnInit, OnChanges {
  @Input() notification: Notification;
  public readonly NotificationStatusEnum = NotificationStatusEnum;
  public readonly NotificationType = NotificationTypeEnum;
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
  public EUserPropertyType = EUserPropertyType;

  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService,
    private agencyService: AgencyService,
    private headerService: HeaderService,
    private conversationService: ConversationService,
    private readonly router: Router,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notification']) {
      this.notification = changes['notification']?.currentValue;
      this.titleNotification = this.notificationMessage(this.notification);
      this.notiType = this.notification.notiType;
      this.userType = this.notification?.options?.userConversation?.type;
      this.userConversation = this.notification?.options
        ?.userConversation as UserConversation;
      this.status = this.notification?.taskStatus;
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
      this.updateNotificationSeenState();
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
    this.notificationService
      .markNotificationAsRead(this.notification.id)
      .subscribe({
        next: (res) => {
          this.taskService.currentTaskId$.next(this.notification.taskId);
        }
      });
  }

  createTask(e: Event) {
    e.stopPropagation();
    if (
      this.notification.notiType === NotificationTypeEnum.REMINDER &&
      this.notification.options?.['type'] === 'NO_ASSIGNED_TASK'
    ) {
      switch (this.notification.options?.reminderType) {
        case EInvoiceTaskType.GENERAL_COMPLIANCE:
        case EInvoiceTaskType.SMOKE_ALARM:
          if (!this.notification?.options?.complianceId) break;
          this.checkComplianceHaveTask(
            this.notification?.options?.complianceId
          );
          return;
        case EInvoiceTaskType.TENANT_VACATE:
          if (!this.notification?.options?.idUserPropertyGroup) break;
          this.checkTenancyHasTask(
            this.notification?.options?.idUserPropertyGroup
          );
          return;
        default:
          break;
      }

      this.taskService.openTaskFromNotification$.next({
        propertyId: this.notification.options?.['propertyId'],
        taskNameId: this.notification.options?.['taskNameId'],
        notificationId: this.notification.id,
        inspectionId: this.notification.options.inspectionId,
        eventId: this.notification.options.eventId
      });
    }
  }

  checkComplianceHaveTask(complianceId: string) {
    // this.taskService.checkComplianceHaveTask(complianceId).subscribe(res => {
    //   if (res?.complianceHaveTask && res?.taskId) {
    //     this.notificationService.markNotificationAsRead(this.notification?.id).subscribe({
    //       next: () => {
    //         this.router.navigate([`dashboard/${this.agencyService.currentAgencyId.value}/detail`, res?.taskId], {
    //           replaceUrl: true
    //         });
    //         this.notificationService.removeNotiFromUnseenList(this.notification?.id);
    //         this.notificationService.reloadNotiList.next(true);
    //         this.headerService.isOpenNotificationList.next(false);
    //       }
    //     })
    //   } else {
    //     this.taskService.openTaskFromNotification$.next({
    //       propertyId: this.notification.options?.propertyId,
    //       taskNameId: this.notification.options?.taskNameId,
    //       notificationId: this.notification?.id,
    //       inspectionId: this.notification?.options?.inspectionId,
    //       complianceCategoryId: this.notification?.options?.complianceCategoryId
    //     });
    //   }
    // })
  }

  checkTenancyHasTask(tenancyId: string) {
    // this.taskService.checkTenancyHasTask(tenancyId, TaskNameId.tenantVacate).subscribe(res => {
    //   if (res && res?.id) {
    //     this.notificationService.markNotificationAsRead(this.notification?.id).subscribe({
    //       next: () => {
    //         this.router.navigate([`dashboard/${this.agencyService.currentAgencyId.value}/detail`, res?.id], {
    //           replaceUrl: true
    //         });
    //         this.notificationService.markAsReadNoti.next(this.notification?.id);
    //         this.headerService.isOpenNotificationList.next(false);
    //       }
    //     });
    //   } else {
    //     const { propertyId, taskNameId, regionId} = this.notification.options || {};
    //     this.taskService.openTaskFromNotification$.next({
    //       propertyId,
    //       taskNameId,
    //       notificationId: this.notification.id,
    //       regionId,
    //       tenancyId
    //     });
    //   }
    // })
  }

  notificationMessage(notification: Notification) {
    const taskTypeStr =
      notification?.taskType === this.taskType.TASK ? 'task' : 'message';
    const agencyName = this.agencyService.agenciesList
      .getValue()
      ?.find((agency) => agency.id === notification.agencyId);
    switch (notification.notiType) {
      case NotificationTypeEnum.NEW_TASK:
        return `You have received <span class="text-notification">a new ${taskTypeStr}:</span>`;
      case NotificationTypeEnum.ASSIGNED_TASK:
        return `You have been assigned to <span class="text-notification">a ${taskTypeStr}:</span>`;
      case NotificationTypeEnum.UNASSIGNED_TASK:
        return `You have been unassigned from <span class="text-notification">a ${taskTypeStr}:</span>`;
      case NotificationTypeEnum.RECEIVED_REPLY:
        return 'You have received <span class="text-notification">a reply:</span>';
      case NotificationTypeEnum.NEW_TASK_UNIDENTIFIED:
      case NotificationTypeEnum.NEW_TASK_NO_PORTFOLIO:
        return `${agencyName?.name} has received <span class="text-notification">a new ${taskTypeStr}:</span>`;
      case NotificationTypeEnum.CALL_TRANSCRIPTION:
        return `Your recent call with <span class="text-notification text-capitalize">${
          this.notification?.options?.user?.firstName || ''
        } ${this.notification?.options?.user?.lastName || ''} (${
          this.notification?.options?.user?.isPrimary ? 'Primary ' : ''
        }${this.notification?.options?.user?.type?.toLowerCase() || ''})
        </span> has finished processing.`;
      case NotificationTypeEnum.CANCELLED_TASK:
        return 'A Routine Inspection has been <span class="text-notification">cancelled</span> via Property Tree</span>';
      case NotificationTypeEnum.RESCHEDULED_TASK:
        return 'A Routine Inspection has been <span class="text-notification">rescheduled</span> via Property Tree';
      case NotificationTypeEnum.COMPLETED_TASK:
        return 'A Routine Inspection has been <span class="text-notification">completed</span> via Property Tree';
      case NotificationTypeEnum.RESCHEDULE_REQUEST:
        return 'You have received <b> a reply: </b>';
      case NotificationTypeEnum.REMINDER:
        notification.taskId = notification.options?.['taskId'];
        return '<b>Reminder:</b> ' + notification.options?.['headerTitle'];
      case NotificationTypeEnum.EVENT_CHANGE_DATA:
        notification.taskId = notification.options?.['taskId'];
        if (
          notification.options?.['key'] ===
          EventChangeStatusEnum.INSPECTION_CHANGE_TIME
        ) {
          return '<span class="text-notification">Routine inspection</span> has been rescheduled:';
        } else if (
          notification.options?.['key'] ===
          EventChangeStatusEnum.INSPECTION_CHANGE_STATUS
        ) {
          return '<span class="text-notification">Routine inspection</span> has changed status:';
        } else if (
          notification.options?.['key'] ===
          EventChangeStatusEnum.LEASE_CHANGE_TIME_START
        ) {
          return '<span class="text-notification">Lease start date</span> has been rescheduled:';
        } else if (
          notification.options?.['key'] ===
          EventChangeStatusEnum.LEASE_CHANGE_TIME_END
        ) {
          return '<span class="text-notification">Lease end date</span> has been rescheduled:';
        } else if (
          notification.options?.['key'] ===
          EventChangeStatusEnum.INVOICE_CHANGE_STATUS
        ) {
          return '<span class="text-notification">Tenancy invoice</span> has changed status:';
        } else if (
          notification.options?.['key'] ===
            EventChangeStatusEnum.COMPLIANCE_CANCEL_EXPIRY_DATE ||
          notification.options?.['key'] ===
            EventChangeStatusEnum.COMPLIANCE_CHANGE_STATUS_EXPIRY_DATE
        ) {
          return `<span class="text-notification">${notification.options?.categoryName} - Expiry</span> has been cancelled:`;
        } else if (
          notification.options?.['key'] ===
            EventChangeStatusEnum.COMPLIANCE_CANCEL_NEXT_SERVICE_DATE ||
          notification.options?.['key'] ===
            EventChangeStatusEnum.COMPLIANCE_CHANGE_STATUS_NEXT_SERVICE_DATE
        ) {
          return `<span class="text-notification">${notification.options?.categoryName} - Next service</span> has been cancelled:`;
        } else if (
          notification.options?.['key'] ===
          EventChangeStatusEnum.COMPLIANCE_CHANGE_EXPIRY_DATE
        ) {
          return `<span class="text-notification">${notification.options?.categoryName} - Expiry</span> has been rescheduled:`;
        } else if (
          notification.options?.['key'] ===
          EventChangeStatusEnum.COMPLIANCE_CHANGE_NEXT_SERVICE_DATE
        ) {
          return `<span class="text-notification">${notification.options?.categoryName} - Next service</span> has been rescheduled:`;
        } else if (
          notification.options?.['key'] ===
          EventChangeStatusEnum.VACATE_CHANGE_TIME
        ) {
          return `<span class="text-notification">Vacate date</span> has been rescheduled:`;
        } else {
          return '';
        }
      default:
        return '';
    }
  }

  updateNotificationSeenState() {
    this.notificationService
      .markNotificationAsRead(this.notification.id)
      .subscribe({
        next: () => {
          if (
            this.notificationService.activeTab$.getValue() ==
            NotificationTabEnum.ALL
          ) {
            this.notification.status = NotificationStatusEnum.SEEN;
          } else {
            this.getAllNotification(0);
          }
          this.notificationService.removeNotiFromUnseenList(
            this.notification.id
          );
        }
      });
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
            : `${this.notification?.taskName}\n${inspectionDate}, ${startTime} - ${endTime}`;
        break;
      case NotificationTypeEnum.REMINDER:
        this.taskName = this.notification.options?.['bodyTitle'];
        break;
      case NotificationTypeEnum.EVENT_CHANGE_DATA:
        this.taskName = this.notification.options?.['bodyTitle'];
        break;
      default:
        this.taskName = this.notification?.options?.messageTitle
          ? this.notification?.options?.messageTitle
          : this.notification?.taskName;
        if (inspectionVariables)
          this.taskName = `${this.taskName}\n${inspectionDate}, ${startTime} - ${endTime}`;
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
    if (this.userType === EUserPropertyType.AGENT)
      this.userType = 'Property Manager';
    if (this.userType === EUserPropertyType.OTHER)
      this.userType = 'Other Contacts';
    if (this.userType === EUserPropertyType.EXTERNAL) this.userType = '';
    if (
      this.notiType === NotificationTypeEnum.ASSIGNED_TASK ||
      this.notiType === NotificationTypeEnum.UNASSIGNED_TASK
    ) {
      return true;
    }
    if (this.status === TaskStatusType.unassigned) {
      if (
        this.notiType === NotificationTypeEnum.NEW_TASK_UNIDENTIFIED ||
        this.notification.options?.isNoPortfolio ||
        [EUserPropertyType.SUPPLIER, EUserPropertyType.OTHER].includes(
          this.userType as EUserPropertyType
        )
      ) {
        return false;
      }
      return true;
    }
    return this.userConversation?.type !== null;
  }

  getTaskUserType() {
    if (this.notification.userMessage?.type) {
      if (this.notification.userMessage?.userProperty?.isPrimary)
        return `Primary ${this.notification.userMessage.type}`;
      return `${this.notification.userMessage.type}`;
    }
    return '';
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
