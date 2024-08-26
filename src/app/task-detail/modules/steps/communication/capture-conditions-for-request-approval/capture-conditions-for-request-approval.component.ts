import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { FilesService } from '@services/files.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ChatGptService } from '@services/chatGpt.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ICaptureCondition } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { FormControl, Validators } from '@angular/forms';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { takeUntil } from 'rxjs';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'capture-conditions-for-request-approval',
  templateUrl: './capture-conditions-for-request-approval.component.html',
  styleUrls: ['./capture-conditions-for-request-approval.component.scss']
})
export class CaptureConditionsForRequestApprovalComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  constructor(
    public override taskService: TaskService,
    public override trudiService: TrudiService,
    public override sendMessageService: SendMessageService,
    public override conversationService: ConversationService,
    public override toastService: ToastrService,
    public override filesService: FilesService,
    public override stepService: StepService,
    public override chatGptService: ChatGptService,
    public override trudiDynamicParameterService: TrudiDynamicParameterService,
    private PreventButtonService: PreventButtonService,
    public override toastCustomService: ToastCustomService
  ) {
    super(
      taskService,
      trudiService,
      sendMessageService,
      conversationService,
      toastService,
      filesService,
      stepService,
      chatGptService,
      trudiDynamicParameterService,
      toastCustomService
    );
  }
  public customControlValues: ICaptureCondition;
  public conditionsControl: FormControl;
  public currentModal$ = this.messageFlowService.currentModal$;
  public buttonKey = EButtonStepKey.CAPTURE_CONDITIONS_FOR_REQUEST_APPROVAL;
  public modalId = StepKey.communicationStep.captureConditionForRequestApproval;

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({
        isPopupConditions: false,
        isTrudiSendMessage: false
      });
      this.enableProcess();
    }
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  enableProcess() {
    this.conditionsControl = new FormControl(
      '',
      this.customControlValues.isRequired
        ? [Validators.required, Validators.maxLength(1000)]
        : [, Validators.maxLength(1000)]
    );

    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.isPopupConditions);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ isPopupConditions: true });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.customControlValues = this.model.fields
        .customControl as ICaptureCondition;

      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        'body.prefillTitle': this.model.fields.msgTitle,
        'body.prefillReceivers': true,
        trudiButton: this.model
      };
    }
  }

  handleBack() {
    this.handlePopupState({
      isTrudiSendMessage: false,
      isPopupConditions: true
    });
  }

  handleNextCondition() {
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
    if (this.conditionsControl.invalid) {
      this.conditionsControl.markAsTouched();
      return;
    }

    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    this.trudiDynamicParameterService.setDynamicParametersKey({
      conditions_copy: this.conditionsControl.value
    });
    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        captureCondition: {
          condition: this.conditionsControl.value
        }
      }
    };
    this.handlePopupState({
      isTrudiSendMessage: true,
      isPopupConditions: false
    });
    this.openSendMsgModal();
  }

  onClose() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.handlePopupState({ isPopupConditions: false });
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.handlePopupState({ isTrudiSendMessage: false });
        if (event.isDraft) {
          return;
        }
        this.complete(event);
        this.handleSendMsgToast(event);
        break;
      default:
        break;
    }
  }

  openSendMsgModal() {
    this.prefillConfig({
      rawMsg: this.textForwardMessg,
      listOfFiles: this.model?.fields?.files || []
    });
    this.messageFlowService
      .openSendMsgModal(this.sendMessageConfigs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            this.handleBack();
            this.PreventButtonService.setCurrentModalActive(this.buttonKey);
            break;
          case ESendMessageModalOutput.MessageSent:
            this.onSendMsg(rs.data);
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );

            break;
          case ESendMessageModalOutput.Quit:
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );
            this.handlePopupState({ isTrudiSendMessage: false });
            break;
        }
      });
  }
}
