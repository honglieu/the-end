import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { StepBaseComponent } from './../step-base/step-base.component';
import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TrudiService } from '@services/trudi.service';
import { TaskService } from '@services/task.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { FilesService } from '@services/files.service';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ChatGptService } from '@services/chatGpt.service';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { takeUntil } from 'rxjs';
import { EButtonStepKey, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'send-basic-email',
  templateUrl: './send-basic-email.component.html'
})
export class SendBasicEmailComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  public buttonKey = EButtonStepKey.SEND_BASIC_EMAIL;

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
    public override toastCustomService: ToastCustomService,
    private PreventButtonService: PreventButtonService
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

  override ngOnInit() {
    super.ngOnInit();
    this.messageFlowService.triggerCloseMsg$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetPopupState();
        this.PreventButtonService.deleteProcess(
          this.buttonKey,
          EButtonType.STEP
        );
      });
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({ isTrudiSendMessage: false });
      this.enableProcess();
    }
  }

  enableProcess() {
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    this.prefillVariables();
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.isTrudiSendMessage, () =>
        this.openSendMsgModal()
      );
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ isTrudiSendMessage: true });
    this.openSendMsgModal();
  }

  openSendMsgModal() {
    this.prefillConfig({
      listOfFiles: this.model?.fields?.files,
      rawMsg: this.textForwardMessg
    });
    this.messageFlowService
      .openSendMsgModal(this.sendMessageConfigs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            this.onBack();
            break;
          case ESendMessageModalOutput.MessageSent:
            this.onSendMsg(rs.data);
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );
            break;
          case ESendMessageModalOutput.Quit:
            this.resetPopupState();
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );
            break;
        }
      });
  }

  prefillVariables() {
    this.textForwardMessg = this.model.fields.msgBody;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        'header.title': 'Bulk send email',
        'header.isChangeHeaderText': true,
        'body.prefillTitle': this.model.fields.msgTitle,
        'body.prefillReceivers': true,
        'footer.buttons.showBackBtn': false,
        trudiButton: this.model
      };
    }
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
}
