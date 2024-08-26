import { StepBaseComponent } from './../step-base/step-base.component';
import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TrudiService } from '@services/trudi.service';
import { TaskService } from '@services/task.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { FilesService } from '@services/files.service';
import { PropertiesService } from '@services/properties.service';
import { takeUntil } from 'rxjs';
import {
  ESentMsgEvent,
  ISelectedReceivers,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ChatGptService } from '@services/chatGpt.service';
import { EContactCardType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { UserService } from '@services/user.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { PreventButtonService } from '@trudi-ui';
import { EButtonStepKey, EButtonType } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'send-contact-card',
  templateUrl: './send-contact-card.component.html'
})
export class SendContactCardComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  public listContactCard: ISelectedReceivers[];
  public showSendMsgPopup: boolean = false;
  public buttonKey = EButtonStepKey.SEND_CONTACT_CARD;

  constructor(
    public override taskService: TaskService,
    public override trudiService: TrudiService,
    public override sendMessageService: SendMessageService,
    public override conversationService: ConversationService,
    public override toastService: ToastrService,
    public override filesService: FilesService,
    public override stepService: StepService,
    public taskDetailService: TaskDetailService,
    public propertyService: PropertiesService,
    public override chatGptService: ChatGptService,
    public override trudiDynamicParameterService: TrudiDynamicParameterService,
    private userService: UserService,
    private agencyService: AgencyService,
    private trudiSendMsgService: TrudiSendMsgService,
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

  override ngOnInit() {
    super.ngOnInit();
    this.messageFlowService.triggerCloseMsg$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleCloseModal();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        'footer.buttons.nextTitle': 'Send',
        'footer.buttons.showBackBtn': false,
        'body.prefillMediaFiles': false,
        'body.prefillTitle': this.model?.fields?.msgTitle,
        'body.contactCard.required':
          this.model?.fields?.customControl?.isRequired,
        trudiButton: this.model
      };
    }
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({ isTrudiSendMessage: false });
      this.enableProcess();
    }
  }

  enableProcess() {
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);

    if (
      this.model?.fields?.customControl['contactCardType'] ===
      EContactCardType.CONTACT_TYPE
    ) {
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        'body.prefillContactCardTypes':
          this.model?.fields?.customControl['contactData']
      };
    }
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
    this.trudiSendMsgService.setPopupState({
      sendMessage: true
    });
    this.openSendMsgModal();
  }

  handleOnSendMsg(event: ISendMsgTriggerEvent) {
    this.handlePopupState({ isTrudiSendMessage: false });
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
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
      listOfFiles: this.model?.fields?.files,
      rawMsg: this.model?.fields?.msgBody,
      listContactCard: this.listContactCard
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
            this.handleOnSendMsg(rs.data);
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );
            break;
          case ESendMessageModalOutput.Quit:
            this.handleCloseModal();
            break;
        }
      });
  }

  handleCloseModal() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.handlePopupState({ isTrudiSendMessage: false });
  }
}
