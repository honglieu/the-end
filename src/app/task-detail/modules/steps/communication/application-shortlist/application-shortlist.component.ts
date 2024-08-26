import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import { ToastrService } from 'ngx-toastr';
import { ChatGptService } from '@services/chatGpt.service';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { SendMessageService } from '@services/send-message.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { TrudiResponseVariable } from '@shared/types/trudi.interface';
import { IDataApplicationShortlistVariable } from '@shared/types/task.interface';
import { LeasingFormService } from '@/app/leasing/services/leasing-form.service';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { takeUntil } from 'rxjs';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'application-shortlist',
  templateUrl: './application-shortlist.component.html',
  styleUrls: ['./application-shortlist.component.scss']
})
export class ApplicationShortlistComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  public isRequiredApplicationField1: boolean = false;
  public isAIGenerated: boolean = false;
  public titleModal: string = 'Shortlisted Applications';
  public prefillVariablesData: Record<string, string> | TrudiResponseVariable =
    {};
  public buttonKey = EButtonStepKey.APPLICATION_SHORTLIST;
  public modalId = StepKey.communicationStep.applicationShortList;
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
    private leasingForm: LeasingFormService,
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

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({
        isShowApplicationShortList: false,
        isTrudiSendMessage: false
      });
      this.enableProcess();
    }
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  enableProcess() {
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.isShowApplicationShortList);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ isShowApplicationShortList: true });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        'body.prefillTitle': this.model.fields.msgTitle,
        'body.prefillReceivers': true,
        'footer.buttons.showBackBtn': true,
        trudiButton: this.model
      };
      this.parseModel(changes['model']?.currentValue);
      this.modelData = this.model;
    }
  }
  private parseModel(model?: TrudiStep): void {
    const customControl = model?.['fields']?.['customControl'];
    this.titleModal = customControl['title'];
    this.isRequiredApplicationField1 = customControl['preScreenIsRequired'];
    this.isAIGenerated = this.model?.['fields']?.['isAIGenerated'];
  }
  prefillVariables(value) {
    this.textForwardMessg = this.model.fields.msgBody;
    const prefillApplicationData = this.setDataApplications(value);
    this.trudiDynamicParameterService.setDynamicParametersForApplicationShortlist(
      prefillApplicationData
    );
  }
  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.handlePopupState({ isTrudiSendMessage: false });
        this.leasingForm.resetFormEventsSubject.next(true);
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
  handleCloseApplicationShortListPopup(value) {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    if (!value) {
      this.handlePopupState({ isShowApplicationShortList: false });
      return;
    }
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    this.prefillVariables(value);
    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        applicationShortList: this.setDataApplications(value)
      }
    };
    this.handlePopupState({
      isShowApplicationShortList: false,
      isTrudiSendMessage: true
    });
    this.openSendMsgModal();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }
  onQuit() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.handlePopupState({
      isTrudiSendMessage: false
    });
    this.leasingForm.resetFormEventsSubject.next(true);
  }

  openSendMsgModal() {
    this.prefillConfig({
      listOfFiles: this.model?.fields?.files || [],
      rawMsg: this.textForwardMessg
    });
    this.messageFlowService
      .openSendMsgModal(this.sendMessageConfigs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            this.handlePopupState({
              isShowApplicationShortList: true,
              isTrudiSendMessage: false
            });
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
            this.onQuit();
            break;
        }
      });
  }

  setDataApplications(value) {
    const prefillApplicationData: IDataApplicationShortlistVariable = {
      application_name_1: `${value[0]?.name || ''}`,
      application_summary_1: `${value[0]?.summary || ''}`,
      application_name_2: `${value[1]?.name || ''}`,
      application_summary_2: `${value[1]?.summary || ''}`,
      application_name_3: `${value[2]?.name || ''}`,
      application_summary_3: `${value[2]?.summary || ''}`
    };
    return prefillApplicationData;
  }
}
