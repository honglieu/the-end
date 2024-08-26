import { StepService } from './../../services/step.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { FilesService } from '@services/files.service';
import { TrudiResponse } from '@shared/types/trudi.interface';
import {
  ISendMsgTriggerEvent,
  ISendMsgType,
  ISendScheduleMsgResponse
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import {
  IStepTypeIdPayload,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import { Subject, takeUntil } from 'rxjs';
import { ChatGptService } from '@services/chatGpt.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';

interface PopupType {
  isShowBreachNoticeRemedyDate: boolean;
  isShowEntryNoticeEntryDate: boolean;
}

enum PopupType$ {
  BASIC_EMAIL_SEND_MESSAGE = 'BASIC_EMAIL_SEND_MESSAGE',
  CONTACT_CARD_SEND_MESSAGE = 'CONTACT_CARD_SEND_MESSAGE',
  SEND_REQUEST_SEND_MESSAGE = 'SEND_REQUEST_SEND_MESSAGE'
}

@Component({
  selector: 'communication-button-base',
  template: ''
})
export class StepBaseComponent implements OnInit, OnDestroy {
  // TODO: any type update later
  @Input() hideProcessLine: boolean = false;
  @Input() model: TrudiStep;

  protected destroy$ = new Subject<boolean>();
  public modelData: TrudiStep;
  public popupState: PopupType = {
    isShowBreachNoticeRemedyDate: false,
    isShowEntryNoticeEntryDate: false
  };
  public popupState$: string = null;
  public sendMessageConfigs: any = {};
  public textForwardMessg: string = '';
  public prefillVariable: Record<string, string>;

  constructor(
    public taskService: TaskService,
    public trudiService: TrudiService,
    public sendMessageService: SendMessageService,
    public conversationService: ConversationService,
    public toastService: ToastrService,
    public filesService: FilesService,
    public stepService: StepService,
    public chatGptService: ChatGptService,
    public trudiDynamicParameterService: TrudiDynamicParameterService
  ) {}

  ngOnInit(): void {}

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
    } else {
      this.updateStep(TrudiButtonEnumStatus.EXECUTED, stepTypeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            if (data) {
              this.stepService.updateStatus.next(null);
              // this.stepService.updateTrudiResponse(data, EActionType.UPDATE_PT);
              this.stepService.updateStepById(this.model.id, {
                status: this.model.status
              });
              this.stepService.setChangeBtnStatusFromPTWidget(false);
            }
          },
          error: (error) => {
            this.toastService.error(error.message ?? 'error');
          }
        });
    }
  }

  updateStep(status: TrudiButtonEnumStatus, stepTypeId: IStepTypeIdPayload) {
    return this.stepService.updateStep(
      this.taskService.currentTask$.value?.id,
      this.model.id,
      this.model.action,
      status,
      this.model.stepType,
      this.model.componentType,
      null,
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
    this.filesService.originalLocalFiles.next([]);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
