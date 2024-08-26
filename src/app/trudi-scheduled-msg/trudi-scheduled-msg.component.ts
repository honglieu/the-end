import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { TrudiService } from '@services/trudi.service';
import {
  EPopupAction,
  NavigatePopUpsService,
  PopupQueue
} from '@/app/share-pop-up/services/navigate-pop-ups.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { MaintenanceRequestService } from '@services/maintenance-request.service';
import { popupQueue } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  EFooterButtonType,
  ESentMsgEvent,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiScheduledMsgService } from './services/trudi-scheduled-msg.service';
import { ITrudiScheduledMsgInfo } from './utils/trudi-scheduled-msg.inteface';
import { SendMessageService } from '@services/send-message.service';
import { TrudiResponse } from '@shared/types/trudi.interface';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
import { TenantLandlordRequestService } from '@services/tenant-landlord-request.service';
import { ECategoryType } from '@shared/enum/category.enum';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { TaskService } from '@services/task.service';
import { TaskNameId } from '@shared/enum/task.enum';
import { RoutineInspectionButtonAction } from '@shared/enum/routine-inspection.enum';
import { CreditorInvoicingButtonAction } from '@shared/enum/creditor-invoicing.enum';
import { sendOptionType } from '@/app/trudi-send-msg/components/trudi-send-msg-header/components/trudi-send-option-menu/trudi-send-option-menu.component';
import * as HTMLParser from 'node-html-parser';
@Component({
  selector: 'trudi-scheduled-msg',
  templateUrl: './trudi-scheduled-msg.component.html',
  styleUrls: ['./trudi-scheduled-msg.component.scss']
})
export class TrudiScheduledMsgComponent implements OnInit, OnDestroy {
  @Input() hasConversationHistory = false;
  @Output() onBack = new EventEmitter();
  @Output() onQuit = new EventEmitter();

  private $destroy: Subject<boolean> = new Subject();

  listModalScheduleMsg: ITrudiScheduledMsgInfo[] = [];
  ModalPopupPosition = ModalPopupPosition;
  popupQueue: PopupQueue = popupQueue;
  EUserPropertyType = EUserPropertyType;
  isSendNowMsg: boolean = false;
  isShow: boolean = false;
  selectedScheduledMsg: ITrudiScheduledMsgInfo;
  public listOfFiles = [];
  public listContactCards = [];
  scheduleDate: string;
  scheduledMessageConfigs = {
    header: {
      title: 'Scheduled message',
      icon: 'trudiAvt',
      closeIcon: 'smallCloseBlack'
    }
  };
  editScheduledMsgConfig = {
    'body.prefillTitle': '',
    'footer.buttons.nextButtonType': EFooterButtonType.NORMAL,
    'footer.buttons.sendType': ISendMsgType.EVENT_EDIT_SCHEDULED_MSG,
    'body.prefillReceiversList': [],
    'body.prefillMediaFiles': false,
    'body.prefillSender': '',
    'body.hasEmailSignature': true,
    'body.defaultSendOption': null,
    'body.isFromInlineMsg': false,
    'body.receiverTypes': '',
    'header.closeIcon': null,
    'otherConfigs.disabledReceivers': true,
    'otherConfigs.isScheduleForSend': true,
    'otherConfigs.isShowGreetingContent': true
  };
  specialButtonActions: string[] = [
    CreditorInvoicingButtonAction.UNPAID_SCHEDULE_TENANT_REMINDER_OVERDUE_INVOICE,
    CreditorInvoicingButtonAction.UNPAID_SCHEDULE_TENANT_REMINDER_PAYMENT_DUE,
    CreditorInvoicingButtonAction.PARTPAID_SCHEDULE_TENANT_REMINDER
  ];
  constructor(
    private trudiScheduledMsgService: TrudiScheduledMsgService,
    private navigatePopupService: NavigatePopUpsService,
    private taskService: TaskService,
    private sendMessageService: SendMessageService,
    private trudiService: TrudiService,
    private maintenanceRequestService: MaintenanceRequestService,
    private leaseRenewalService: LeaseRenewalService,
    private tenancyInvoicingService: TenancyInvoicingService,
    private landlordTenantService: TenantLandlordRequestService,
    private routineInspectionService: RoutineInspectionService
  ) {}

  ngOnDestroy(): void {
    this.trudiScheduledMsgService.listScheduledMsg.next(null);
    this.$destroy.next(true);
    this.$destroy.complete();
  }

  get popupState() {
    return this.trudiScheduledMsgService.getPopupState();
  }

  ngOnInit(): void {
    this.trudiScheduledMsgService.selectedScheduledMsg
      .pipe(takeUntil(this.$destroy))
      .subscribe((res) => {
        if (res) {
          this.selectedScheduledMsg = res;
          this.editScheduledMsgConfig = {
            ...this.editScheduledMsgConfig,
            'body.prefillTitle': res.data?.conversationTitle,
            'body.isFromInlineMsg': res.data?.isFromInline,
            'body.prefillSender': res.data?.sendFrom,
            'body.hasEmailSignature': res?.hasEmailSignature,
            'body.defaultSendOption':
              res.data?.isSendFromEmail && sendOptionType.EMAIL
          };
          this.listContactCards = this.sendMessageService.formatContactsList(
            res.data?.options?.contacts
          );
          this.listOfFiles = (res.data?.files || []).map((file) => ({
            ...file,
            fileType: file.fileType?.name ?? file.fileType,
            name: file.title || file.fileName,
            size: file.fileSize,
            isHideRemoveIcon: false
          }));
        }
      });

    this.trudiScheduledMsgService.listScheduledMsg$
      .pipe(takeUntil(this.$destroy))
      .subscribe((data) => {
        if (data) {
          this.listModalScheduleMsg = data.map((x) => ({
            ...x,
            hasEmailSignature: this.checkHasSignature(x.data.message)
          }));
          if (!data.length) {
            this.onQuit.emit();
          }
        }
      });
    this.trudiScheduledMsgService.selectedReceiver
      .pipe(takeUntil(this.$destroy))
      .subscribe((data) => {
        if (data) {
          this.editScheduledMsgConfig = {
            ...this.editScheduledMsgConfig,
            'body.prefillReceiversList': data ?? [],
            'body.receiverTypes': data[0]?.type
          };
        }
      });
  }

  checkHasSignature(message: string) {
    let signature: boolean = false;
    const htmlContent = HTMLParser.parse(message);
    const hasSignature = htmlContent?.querySelector('#email-signature');
    signature = hasSignature ? true : false;

    return signature;
  }

  onCloseScheduleMsg() {
    this.changePopupState(EPopupAction.NEXT);
    this.trudiScheduledMsgService.setPopupState({
      scheduledMessage: false,
      sendMessage: true
    });
    this.onQuit.emit();
  }

  changePopupState(action: EPopupAction) {
    this.navigatePopupService.changePopupState({
      action,
      data: this.popupQueue
    });
  }

  handleBack() {
    this.trudiScheduledMsgService.setPopupState({
      editScheduledMessage: false,
      scheduledMessage: true
    });
  }

  handleConfirmChangeScheduledMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.trudiScheduledMsgService.setPopupState({
          editScheduledMessage: false,
          scheduledMessage: true
        });
        break;
      case ESentMsgEvent.COMPLETED:
        break;
      default:
        break;
    }
  }

  handleOnBackScheduleMessage() {
    this.trudiScheduledMsgService.setPopupState({
      rescheduleMsg: false,
      scheduledMessage: true
    });
  }

  handleSelectDate(event) {
    const body = {
      reminderTime: event,
      message: this.selectedScheduledMsg.data.message,
      conversationTitle: this.selectedScheduledMsg.data.conversationTitle,
      files: this.selectedScheduledMsg?.data?.files,
      options: this.selectedScheduledMsg?.data?.options,
      isSendFromEmail: this.selectedScheduledMsg.data.isSendFromEmail
    };
    this.trudiScheduledMsgService
      .editScheduledMsg(this.selectedScheduledMsg.id, body)
      .pipe(
        switchMap((res) => {
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
            this.selectedScheduledMsg.taskId,
            this.selectedScheduledMsg.conversationId
          );
        })
      )
      .subscribe({
        complete: () => {
          this.selectedScheduledMsg = null;
        }
      });
  }

  scheduleSpecialFlowDate() {
    if (!this.selectedScheduledMsg?.data.action) {
      this.scheduleDate = '';
    }

    switch (
      this.taskService.currentTask$.value?.trudiResponse?.setting?.taskNameId
    ) {
      case TaskNameId.routineInspection:
        if (
          this.selectedScheduledMsg?.data.action ===
          RoutineInspectionButtonAction.SEND_A_REMINDER_TO_TENANT_SCHEDULED
        ) {
          this.scheduleDate =
            this.routineInspectionService.routineInspectionResponse.value?.variable.startTime;
        }
        break;
      case TaskNameId.invoiceTenant:
        if (
          this.specialButtonActions.includes(
            this.selectedScheduledMsg?.data.action
          )
        ) {
          const invoiceData =
            this.tenancyInvoicingService.tenancyInvoicingResponse?.value
              ?.data[0];
          this.scheduleDate =
            invoiceData?.syncJob.invoices[0]?.tenancyInvoice.dueDate;
        }
        break;
      default:
        break;
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
}
