import { cloneDeep } from 'lodash-es';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  ICalendarEvent,
  PopUpBulkCreateTasks,
  RadioOptionSendMessage
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import {
  CalendarEventBulkTasksCreated,
  TaskTemplate
} from '@shared/types/task.interface';
import {
  ETypeMessage,
  ISelectedReceivers,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { ICommunicationStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import {
  EBulkSendMethod,
  ECreateMessageFrom
} from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { EEventType } from '@shared/enum/calendar.enum';
import {
  EModalID,
  ModalManagementService
} from '@/app/dashboard/services/modal-management.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import {
  IGetInfoTasksForPrefillDynamicBody,
  ITasksForPrefillDynamicData
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';

@Component({
  selector: 'send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.scss']
})
export class SendMessageComponent implements OnInit, OnDestroy {
  @Input() taskTemplate: TaskTemplate;
  @Input() listEvents: ICalendarEvent[] = [];
  @Input() tasksCreated: CalendarEventBulkTasksCreated[] = [];
  @Input() agencyId: string;
  @Input() confirmTypeEvent: EEventType;
  @Input() mailBoxId: string;

  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onComplete: EventEmitter<void> = new EventEmitter<void>();
  public readonly typePopup = PopUpBulkCreateTasks;
  public readonly createTaskFrom = CreateTaskByCateOpenFrom;
  private destroy$: Subject<void> = new Subject<void>();
  public displayPopup: PopUpBulkCreateTasks;
  public isShowBulkSendMethod = false;
  public selectedRadioOption: RadioOptionSendMessage;
  private generalConfigs = {
    ...cloneDeep(defaultConfigs),
    'footer.buttons.showBackBtn': false,
    'footer.buttons.showConfirmRecipientBackBtn': true,
    'header.viewRecipients': true,
    'header.isChangeHeaderText': true,
    'body.receiver.isShowContactType': true,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'body.applyAIGenerated': false,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.MULTI_TASKS,
    'header.icon': 'energy',
    'header.title': 'Bulk send email',
    'otherConfigs.openFromBulkCreateTask': true
  };
  public configsSendMessage;
  public prefillData: ICommunicationStep;
  public listTasks: ITasksForPrefillDynamicData[];
  public selectedTasks: ITasksForPrefillDynamicData[];
  public taskIds: string[] = [];
  public listContactCard: ISelectedReceivers[] = [];
  public readonly EModalID = EModalID;

  constructor(
    private _calendarService: CalendarService,
    public _trudiDynamicParameterService: TrudiDynamicParameterService,
    private _taskApiService: TaskApiService,
    public modalManagementService: ModalManagementService,
    private messageFlowService: MessageFlowService
  ) {}

  ngOnInit(): void {
    this.taskIds = this.tasksCreated.map((item) => item.taskId);
    this._calendarService
      .getPopupBulkCreateTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.displayPopup = res;
      });
    this.getInfoTasksForPrefillDynamicParam();
  }

  private getInfoTasksForPrefillDynamicParam() {
    let payload: IGetInfoTasksForPrefillDynamicBody = {
      tasks: this.tasksCreated
    };
    this._taskApiService
      .getInfoTasksForPrefillDynamicParam(payload)
      .subscribe((res) => {
        const calendarActionType = [
          EEventType.BREACH_REMEDY,
          EEventType.ENTRY_NOTICE,
          EEventType.CUSTOM_EVENT
        ];
        const filterData = res.map((obj) => ({
          ...obj,
          calendarEvents: calendarActionType.includes(this.confirmTypeEvent)
            ? obj?.calendarEvents?.filter(
                (event) => event.eventType === this.confirmTypeEvent
              ) || []
            : []
        }));
        this.listTasks = filterData;
        this.selectedTasks = filterData;
      });
  }

  public handleCancel(state: boolean) {
    if (state === false) {
      this.onCancel.emit();
    }
  }

  public handleBackFromSendMsg() {
    this.isShowBulkSendMethod = true;
  }

  handleSelectBulkSendMethod(option: EBulkSendMethod) {
    this.prefillData = null;
    this._trudiDynamicParameterService.resetTemplate();
    this.selectedRadioOption = RadioOptionSendMessage.SEND_CUSTOM_MESSAGE;
    this.configsSendMessage = {
      ...this.generalConfigs,
      'body.receiver.prefillSelected': false,
      'body.receiver.prefillSelectedTypeItem': true,
      'body.prefillTitle': null,
      'otherConfigs.openFromBulkCreateTask':
        option === EBulkSendMethod.TRIGGER_STEP_FROM_TASK,
      'inputs.mailBoxIdFromCalender': this.mailBoxId,
      'inputs.typeMessage': ETypeMessage.SCRATCH,
      'inputs.rawMsg': '',
      'inputs.taskIds': this.taskIds,
      'inputs.listContactCard': this.listContactCard,
      'inputs.prefillData': null,
      'inputs.listDynamicFieldData': [],
      'inputs.listOfFiles': [],
      'inputs.taskTemplate': this.taskTemplate,
      'inputs.openFrom':
        CreateTaskByCateOpenFrom.CALENDAR_EVENT_BULK_CREATE_TASKS,
      'inputs.selectedTasksForPrefill': this.tasksCreated
    };
    this._calendarService.setPopupBulkCreateTasks(
      PopUpBulkCreateTasks.SEND_MESSAGE
    );
    this.handleOpenSendMsg(this.configsSendMessage);
  }

  public onNextSendCustomMessage() {
    this.isShowBulkSendMethod = true;
  }

  handleCloseSelectBulkSendMethodModal(closeByXBtn: boolean) {
    this.isShowBulkSendMethod = false;
    if (closeByXBtn) {
      this.onCancel.emit();
    }
  }

  handleOpenSendMsg(config) {
    this.messageFlowService
      .openSendMsgModal(config)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            break;
          case ESendMessageModalOutput.BackFromSelectRecipients:
            this.handleBackFromSendMsg();
            break;
          case ESendMessageModalOutput.MessageSent:
            this.onCompleteSendMessage(rs.data);
            break;
          case ESendMessageModalOutput.Quit:
            this.handleCancel(false);
            break;
        }
      });
  }

  public onCompleteSendMessage({ data, event }: ISendMsgTriggerEvent) {
    this.onComplete.emit();
  }

  handleViewTasks() {
    this.modalManagementService.open(EModalID.ViewTasks);
    this._calendarService.setPopupBulkCreateTasks(
      PopUpBulkCreateTasks.VIEW_TASKS
    );
  }

  handleConfirmViewTasks(event: ITasksForPrefillDynamicData[]) {
    this.selectedTasks = event;
    this._calendarService.setPopupBulkCreateTasks(
      PopUpBulkCreateTasks.SELECT_OPTION_FOR_SEND_MESSAGE
    );
    this.modalManagementService.remove(EModalID.ViewTasks);
  }

  handleCancelViewTasks() {
    this.modalManagementService.remove(EModalID.ViewTasks);
    this._calendarService.setPopupBulkCreateTasks(
      PopUpBulkCreateTasks.SELECT_OPTION_FOR_SEND_MESSAGE
    );
  }

  ngOnDestroy(): void {
    this.modalManagementService.remove(EModalID.ViewTasks);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
