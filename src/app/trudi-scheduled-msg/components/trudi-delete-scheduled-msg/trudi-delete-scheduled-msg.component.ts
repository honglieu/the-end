import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ConversationService } from '@services/conversation.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ISendMsgConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiScheduledMsgService } from '@/app/trudi-scheduled-msg/services/trudi-scheduled-msg.service';
import { ITrudiScheduledMsgInfo } from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import { MaintenanceRequestService } from '@services/maintenance-request.service';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import { PetRequestService } from '@services/pet-request.service';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
import { TenantLandlordRequestService } from '@services/tenant-landlord-request.service';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { TrudiResponse } from '@shared/types/trudi.interface';
import { ECategoryType } from '@shared/enum/category.enum';
import { ActivatedRoute, Router } from '@angular/router';
import { AgencyService } from '@services/agency.service';
import { AppRoute } from '@/app/app.route';
import { stringFormat } from '@core/util';
import { EConversationType } from '@shared/enum';

@Component({
  selector: 'trudi-delete-scheduled-msg',
  templateUrl: './trudi-delete-scheduled-msg.component.html',
  styleUrls: ['./trudi-delete-scheduled-msg.component.scss']
})
export class TrudiDeleteScheduledMsgComponent implements OnInit, OnDestroy {
  @Input() hasConversationHistory = false;
  configs: ISendMsgConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      title: 'Are you sure you want to delete this scheduled message?',
      icon: 'iconWarningRed'
    }
  };
  receiver: string = '';
  selectedScheduledMsg: ITrudiScheduledMsgInfo;
  private inboxType: string;
  private unsubscribe = new Subject<void>();
  constructor(
    private trudiScheduledMsgService: TrudiScheduledMsgService,
    private taskService: TaskService,
    private conversationService: ConversationService,
    private trudiService: TrudiService,
    private maintenanceRequestService: MaintenanceRequestService,
    private leaseRenewalService: LeaseRenewalService,
    private petRequestService: PetRequestService,
    private tenancyInvoicingService: TenancyInvoicingService,
    private landlordTenantService: TenantLandlordRequestService,
    private routineInspectionService: RoutineInspectionService,
    private router: Router,
    private route: ActivatedRoute,
    private agencyService: AgencyService
  ) {}

  ngOnInit(): void {
    this.trudiScheduledMsgService.selectedScheduledMsg
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.selectedScheduledMsg = res;
        }
      });
    this.trudiScheduledMsgService.selectedReceiverName
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (data) {
          this.receiver = data;
        }
      });
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((params) => (this.inboxType = params['inboxType']));
  }

  handleBackScheduleMsg() {
    this.trudiScheduledMsgService.setPopupState({
      deleteScheduledMessage: false,
      scheduledMessage: true
    });
  }

  handleDeleteScheduledMsg() {
    const currentTask = this.taskService.currentTask$?.value;
    const { id, taskId, conversationId } = this.selectedScheduledMsg;
    this.trudiScheduledMsgService
      .deleteScheduledMsg(id)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((res) => {
          if (
            currentTask.taskType !== TaskType.MESSAGE &&
            this.trudiScheduledMsgService.listScheduledMsg.value.length === 1
          ) {
            this.conversationService.reloadConversationList.next(true);
          }

          if (
            res &&
            res.scheduledMessage &&
            res.trudiResponse &&
            this.selectedScheduledMsg.data.isFromTrudiButton
          ) {
            this.handleUpdateTrudiResponse(
              res.trudiResponse?.setting?.categoryId,
              res.scheduledMessage.data.action,
              res.trudiResponse
            );
          }
          return this.trudiScheduledMsgService.getListScheduledMsg(
            taskId,
            conversationId
          );
        })
      )
      .subscribe({
        next: () => {
          const data =
            this.trudiScheduledMsgService.listScheduledMsg.value.filter(
              (res) => res.id !== id
            );
          this.trudiScheduledMsgService.scheduleMessageCount.next({
            count: data.length || 0,
            conversationId
          });
          this.trudiScheduledMsgService.setPopupState({
            deleteScheduledMessage: false,
            scheduledMessage:
              this.trudiScheduledMsgService.listScheduledMsg.value.length === 0
                ? false
                : true
          });
          if (!data.length && !this.hasConversationHistory) {
            this.navigateToMessageIndex();
          }
        }
      });
  }

  navigateToMessageIndex() {
    const currentTask = this.taskService.currentTask$?.value;
    if (currentTask?.taskType === TaskType.MESSAGE) {
      const route = {
        [EConversationType.APP]: AppRoute.APP_MESSAGE_INDEX,
        [EConversationType.EMAIL]: AppRoute.MESSAGE_INDEX
      };
      const queryParams = {
        inboxType: this.inboxType,
        status:
          currentTask.status === TaskStatusType.unassigned
            ? TaskStatusType.inprogress
            : currentTask.status
      };
      this.router.navigate(
        [stringFormat(route[currentTask.conversations[0]?.conversationType])],
        {
          queryParams,
          relativeTo: this.route
        }
      );
    }
  }

  generateInboxType(type: string) {
    switch (type) {
      case TaskStatusType.my_messages:
        return TaskStatusType.my_task;
      case TaskStatusType.team_messages:
        return TaskStatusType.team_task;
      default:
        return type;
    }
  }

  handleUpdateTrudiResponse(
    categoryId: string,
    action: string,
    data: TrudiResponse
  ) {
    switch (categoryId) {
      case ECategoryType.leaseRenewal:
        this.leaseRenewalService.updateResponseData(action, data);
        break;
      case ECategoryType.routineMaintenance:
        this.maintenanceRequestService.updateMaintenanceResponseData(
          action,
          data
        );
        break;
      case ECategoryType.routineInspection:
        this.routineInspectionService.updateResponseData(action, data);
        break;
      case ECategoryType.landlordRequest:
        this.landlordTenantService.updateTenantLandlordResponseData(
          action,
          data
        );
        break;
      case ECategoryType.tenantRequest:
        this.tenancyInvoicingService.updateTenancyInvoicingResponseData(
          action,
          data
        );
        break;
      case ECategoryType.creditorInvoicing:
        this.tenancyInvoicingService.updateTenancyInvoicingResponseData(
          action,
          data
        );
        break;
      default:
        this.trudiService.updateTrudiResponse = data;
        break;
    }
  }

  ngOnDestroy(): void {
    this.selectedScheduledMsg = null;
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
