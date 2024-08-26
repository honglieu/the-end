import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription, takeUntil } from 'rxjs';
import {
  EStepAction,
  EStepType,
  ETypeSend
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { ChatGptService } from '@services/chatGpt.service';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { SendMessageService } from '@services/send-message.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { OutgoingInspectionNotes } from '@shared/types/outgoing-inspection.interface';
import { PhotoType, TaskItem } from '@shared/types/task.interface';
import {
  MaintenanceDecision,
  TrudiResponse
} from '@shared/types/trudi.interface';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { replaceVariables } from '@/app/trudi-send-msg/utils/helper-functions';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ISelectedReceivers,
  ISendMsgTriggerEvent,
  ISendMsgType,
  ISendScheduleMsgResponse
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  REGEX_VARIABLE,
  REGEX_VARIABLE_OLD_CONFIG
} from '@/app/task-detail/modules/steps/utils/communication.enum';
import {
  IDefaultConfirmEssential,
  ISummaryContent,
  IConfirmEssential
} from '@/app/task-detail/modules/steps/utils/communicationType';
import {
  IStepTypeIdPayload,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import {
  EActionType,
  EPopupType
} from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { DynamicParameterType } from '@/app/trudi-send-msg/utils/dynamic-parameter';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { RMWidgetDataField } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { MessageFlowService } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EModalID } from '@/app/dashboard/services/modal-management.service';
import { cloneDeep } from 'lodash-es';
import { mergeObjects } from '@/app/task-detail/modules/steps/utils/functions';
import { ReiFormData } from '@shared/types/rei-form.interface';
import { IFile } from '@shared/types/file.interface';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
interface PopupType {
  isTrudiSendMessage: boolean;
  isSelectFiles: boolean;
  isPopupAmount: boolean;
  isPopupRequireAmount: boolean;
  isPopupBreakLease: boolean;
  attachEntryNote: boolean;
  uploadAttachments: boolean;
  selectREIDocument: boolean;
  reviewREIDocument: boolean;
  attachDraftForm: boolean;
  isShowLeaveNoticeDetail: boolean;
  scheduleMessage: boolean;
  isShowInspectionNotesOrActionItems: boolean;
  createTask: boolean;
  sendContactCard: boolean;
  isShowBreachNoticeRemedyDate: boolean;
  isShowEntryNoticeEntryDate: boolean;
  bondLodgement: boolean;
  returnFormDate: boolean;
  isPopupConditions: boolean;
  isPopupCaptureLease: boolean;
  isShowApplicationShortList: boolean;
  isInspectionAction: boolean;
  selectEvent: boolean;
}

enum PopupType$ {
  BASIC_EMAIL_SEND_MESSAGE = 'BASIC_EMAIL_SEND_MESSAGE',
  CONTACT_CARD_SEND_MESSAGE = 'CONTACT_CARD_SEND_MESSAGE',
  SEND_REQUEST_SEND_MESSAGE = 'SEND_REQUEST_SEND_MESSAGE'
}

const flowOnlyOneSteps = [
  EStepAction.SEND_BASIC_EMAIL,
  EStepAction.SEND_REQUEST,
  EStepAction.SEND_CONTACT_CARD
];

@Component({
  selector: 'communication-button-base',
  template: ''
})
export class StepBaseComponent implements OnInit, OnDestroy {
  // TODO: any type update later
  @Input() hideProcessLine: boolean = false;
  @Input() model: TrudiStep;
  @ViewChild('stepView', { static: true })
  stepView: TemplateRef<HTMLElement>;

  protected destroy$ = new Subject<boolean>();
  public eventInitData: EventEmitter<boolean> = new EventEmitter(false);
  public modelData: TrudiStep;
  public EModalID = EModalID;
  public popupState: PopupType = {
    isTrudiSendMessage: false,
    isSelectFiles: false,
    isPopupAmount: false,
    isPopupRequireAmount: false,
    isPopupBreakLease: false,
    attachEntryNote: false,
    uploadAttachments: false,
    selectREIDocument: false,
    reviewREIDocument: false,
    attachDraftForm: false,
    isShowLeaveNoticeDetail: false,
    scheduleMessage: false,
    isShowInspectionNotesOrActionItems: false,
    createTask: false,
    sendContactCard: false,
    isShowBreachNoticeRemedyDate: false,
    isShowEntryNoticeEntryDate: false,
    isShowApplicationShortList: false,
    bondLodgement: false,
    returnFormDate: false,
    isPopupConditions: false,
    isPopupCaptureLease: false,
    isInspectionAction: false,
    selectEvent: false
  };
  public popupState$: string = null;
  public sendMessageConfigs: any = {
    'otherConfigs.createMessageFrom': ECreateMessageFrom.TASK_STEP,
    'header.title': 'Bulk send email',
    'header.isChangeHeaderText': true,
    'header.icon': 'energy',
    'header.viewRecipients': 'true',
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'inputs.selectedTasksForPrefill': [
      {
        taskId: this.taskService.currentTask$.value?.id,
        propertyId: this.taskService.currentTask$.value?.property?.id
      }
    ],
    'otherConfigs.isStep': true,
    'otherConfigs.isShowGreetingContent': true
  };
  public textForwardMessg: string = '';
  public currentDecision: MaintenanceDecision;
  public listOfFiles: any[] = [];
  public selectedFiles = [{ title: '', listFile: [] }];
  public communicationDate: string = '';
  public isDisable: boolean = false;
  public isTenantAskedTo: boolean;
  public disableAskedToButtons: boolean = false;
  public outgoingInsepctionNotes: OutgoingInspectionNotes;
  public prefillVariable: Record<string, string>;
  public applyAIGenerated: boolean = false;
  private subscriptionConfirmEssential: Subscription;
  public isEnableSettingAI = false;
  public prevPopupKey = null;
  public hasConfirmEssential: boolean = false;
  public defaultConfirmEssential: IDefaultConfirmEssential;
  public taskItem: TaskItem;
  public messageFlowService: MessageFlowService;
  public defaultValues = {};
  public screens: EPopupType[] = [];
  public requestSummaryFiles: PhotoType[] = [];

  constructor(
    public taskService: TaskService,
    public trudiService: TrudiService,
    public sendMessageService: SendMessageService,
    public conversationService: ConversationService,
    public toastService: ToastrService,
    public filesService: FilesService,
    public stepService: StepService,
    public chatGptService: ChatGptService,
    public trudiDynamicParameterService: TrudiDynamicParameterService,
    public toastCustomService: ToastCustomService
  ) {
    this.messageFlowService = this.stepService.injector.get(MessageFlowService);
  }

  ngOnInit(): void {
    this.chatGptService
      .checkEnableSetting_v2()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isEnableSetting) => {
        this.isEnableSettingAI = isEnableSetting;
        this.sendMessageConfigs = {
          ...this.sendMessageConfigs,
          'body.applyAIGenerated':
            this.model?.fields?.isAIGenerated && isEnableSetting,
          'body.prefillReceiverTypes': this.model?.fields?.sendTo
        };
      });

    this.stepService
      .getSummaryContent()
      .pipe(takeUntil(this.destroy$))
      .subscribe((summaryContent) => {
        this.requestSummaryFiles =
          this.getPrefillRequestSummaryFiles(summaryContent);
        this.trudiDynamicParameterService.setDynamicParametersRequestSummary(
          summaryContent
        );
      });

    this.prefillTitle();
    this.getDefaultConfirmEssential();
  }

  getDefaultConfirmEssential() {
    this.stepService
      .getDefaultConfirmEssential()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.defaultConfirmEssential = data;
      });
  }

  getPrefillRequestSummaryFiles(summaryContent: ISummaryContent) {
    const msg = this.model?.fields?.msgBody;
    if (!msg) return [];
    const formattedMsg = msg?.replace(/'/g, '"');
    const numberOfRequestSummary = [
      ...(formattedMsg?.match(REGEX_VARIABLE) || []),
      ...(formattedMsg?.match(REGEX_VARIABLE_OLD_CONFIG) || [])
    ]?.filter((s) => s?.includes('request_summary')).length;

    const summaryPhotos = [];
    for (let i = 0; i < numberOfRequestSummary; i++) {
      summaryPhotos.push(...(summaryContent?.summaryPhotos || []));
    }
    return summaryPhotos;
  }

  handleSendMsgToast(event) {
    const isSingleEmail =
      this.model?.fields?.typeSend === ETypeSend.SINGLE_EMAIL;
    const numberOfMessages = isSingleEmail ? 1 : event.receivers?.length ?? 1;
    if (numberOfMessages === 1) {
      this.toastCustomService.handleShowToastMessSend(event);
    } else {
      this.toastService.success(
        `${numberOfMessages} ${
          event?.type === ISendMsgType.SCHEDULE_MSG
            ? 'Messages scheduled for send'
            : 'Messages sent'
        }`
      );
    }
  }

  complete(event?: ISendMsgTriggerEvent, stepTypeId?: IStepTypeIdPayload) {
    if (event?.type === ISendMsgType.SCHEDULE_MSG) {
      this.trudiService.updateTrudiResponse = (
        event?.data as ISendScheduleMsgResponse
      )?.trudiResponse as TrudiResponse;
      const listBtn = this.stepService.getButton(
        (event?.data as ISendScheduleMsgResponse)
          ?.trudiResponse as TrudiResponse
      );
      const selectedStep = listBtn.find((one) => one.id === this.model.id);
      this.model = this.modelData = selectedStep
        ? { ...selectedStep, status: TrudiButtonEnumStatus.EXECUTED }
        : {
            ...this.model,
            status: TrudiButtonEnumStatus.EXECUTED
          };
      this.updatePrefillStep();
    } else {
      this.updateStep(TrudiButtonEnumStatus.EXECUTED, stepTypeId).subscribe({
        next: (data) => {
          if (data) {
            this.updatePrefillStep();
            this.stepService.updateStatus.next(null);
            this.stepService.updateStepById(this.model.id, {
              status: this.model.status
            });
            // this.stepService.updateTrudiResponse(data, EActionType.UPDATE_PT);
            this.stepService.setChangeBtnStatusFromPTWidget(false);
          }
        },
        error: (error) => {
          this.toastService.error(error.message ?? 'error');
        }
      });
    }
    this.stepService.setEventStep(true);
  }

  updatePrefillStep() {
    const body = {
      mailBoxId: this.taskItem?.mailBoxId,
      taskId: this.taskItem?.id,
      data: mergeObjects(this.defaultConfirmEssential, this.defaultValues)
    };
    if (this.model?.stepType !== EStepType.COMMUNICATE) return;
    this.stepService.updatePrefillStep(body).subscribe({
      next: (res) => {
        if (res) {
          this.stepService.setDefaultConfirmEssential({
            ...this.defaultConfirmEssential,
            ...res?.data
          });
        }
      },
      error: () => {}
    });
  }

  updateStep(status: TrudiButtonEnumStatus, stepTypeId: IStepTypeIdPayload) {
    return this.stepService.updateStep(
      this.taskService.currentTask$.value?.id,
      this.model.id,
      this.model.action,
      status,
      this.model.stepType,
      this.model.componentType,
      false,
      stepTypeId
    );
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  resetPopupState() {
    for (const key in this.popupState) {
      if (Object.prototype.hasOwnProperty.call(this.popupState, key)) {
        this.popupState[key] = false;
      }
    }
    this.resetData();
  }

  resetData() {
    this.listOfFiles = [];
    this.selectedFiles = [{ title: '', listFile: [] }];
    this.filesService.originalLocalFiles.next([]);
  }

  prefillTitle() {
    if (!this.model?.fields) return;
    this.taskService.currentTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((task: TaskItem) => {
        if (!task) return;
        this.taskItem = task;
        const defaultVariables = {
          '{task_title}': task?.title ?? '',
          '{short_property_address}':
            this.taskService.getShortPropertyAddress(),
          '{task_name}': task?.taskName?.name
        };
        this.sendMessageConfigs = {
          ...this.sendMessageConfigs,
          'body.prefillTitle': replaceVariables(
            defaultVariables,
            this.model.fields.msgTitle,
            {
              '{short_property_address}': 'No property address'
            }
          ),
          'inputs.selectedTasksForPrefill': [
            {
              taskId: task?.id,
              propertyId: task?.property?.id
            }
          ]
        };
      });
  }

  setDefaultConfirmEssential(data: IConfirmEssential) {
    const fieldsDefault = [
      DynamicParameterType.TENANCY,
      PTWidgetDataField.TENANCY_INVOICES,
      PTWidgetDataField.CREDITOR_INVOICES,
      PTWidgetDataField.NOTES,
      PTWidgetDataField.MAINTENANCE_INVOICE,
      PTWidgetDataField.ROUTINE_INSPECTION,
      PTWidgetDataField.INGOING_INSPECTION,
      PTWidgetDataField.OUTGOING_INSPECTION,
      PTWidgetDataField.COMPLIANCES,
      DynamicParameterType.CALENDAR_EVENT_ENTRY_NOTICE,
      DynamicParameterType.CALENDAR_EVENT_BREACH_REMEDY_DATE,
      DynamicParameterType.CALENDAR_EVENT_CUSTOM,
      RMWidgetDataField.RM_NOTES,
      RMWidgetDataField.RM_ISSUES,
      RMWidgetDataField.RM_INSPECTIONS,
      RMWidgetDataField.NEW_TENANT
    ];

    fieldsDefault.forEach((field) => {
      this.defaultValues[`${field}Id`] = data?.[field];
    });
    this.defaultValues = cloneDeep(this.defaultValues);
  }

  subscribeConfirmEssential(nextModal: string, callback?: () => void) {
    if (this.subscriptionConfirmEssential) {
      return;
    }
    this.subscriptionConfirmEssential = this.stepService
      .getConfirmEssential()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (!data) return;
        this.setDefaultConfirmEssential(data);
        if (
          nextModal &&
          !data.unactiveNextModal &&
          this.stepService.currentCommunicationStep?.value?.id === this.model.id
        ) {
          let sendMessageConfigs = { ...this.sendMessageConfigs };
          this.hasConfirmEssential = !data.hideBackBtn;
          if (flowOnlyOneSteps.includes(this.model.action as EStepAction)) {
            sendMessageConfigs['footer.buttons.showBackBtn'] =
              !data.hideBackBtn;
          }
          this.chatGptService.setSendMessageConfigAIGenerate(
            sendMessageConfigs,
            data
          );
          this.sendMessageConfigs = sendMessageConfigs;
          this.handlePopupState({ [nextModal]: true });
          this.stepService.setConfirmEssential(
            { ...data, unactiveNextModal: true },
            EActionType.ESSENTIAL_SET_BACK
          );
          if (nextModal === EPopupType.isTrudiSendMessage && !!callback) {
            callback();
          }
        }
        if (this.subscriptionConfirmEssential) {
          this.subscriptionConfirmEssential.unsubscribe();
          this.subscriptionConfirmEssential = null;
        }
      });
  }

  addMarkUnTouchedEvent(control: AbstractControl) {
    let subscription: Subscription = control.valueChanges.subscribe((rs) => {
      control.markAsUntouched();
      subscription.unsubscribe();
    });
  }

  mapDynamicFiles() {
    if (this.model?.fields?.files) {
      const dynamicFiles = this.model?.fields?.files?.map((item) => {
        return {
          ...item,
          isHideRemoveIcon: true
        };
      });
      return dynamicFiles;
    }
    return [];
  }

  prefillConfig({
    listOfFiles,
    reiFormData,
    rawMsg,
    prefillVariables,
    listContactCard
  }: PrefillConfigParam) {
    this.prefillTitle();
    this.sendMessageConfigs['inputs.listOfFiles'] = [
      ...(listOfFiles || []),
      ...this.requestSummaryFiles
    ];
    this.sendMessageConfigs['inputs.reiformData'] = reiFormData || null;
    this.sendMessageConfigs['inputs.rawMsg'] = rawMsg || '';
    this.sendMessageConfigs['inputs.prefillVariables'] = prefillVariables || {};
    this.sendMessageConfigs['inputs.listContactCard'] = listContactCard || [];
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

export interface PrefillConfigParam {
  listOfFiles?: IFile[];
  reiFormData?: ReiFormData;
  rawMsg?: string;
  prefillVariables?: Record<string, string>;
  listContactCard?: ISelectedReceivers[];
}
