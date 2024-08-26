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
  EFooterButtonType,
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ChatGptService } from '@services/chatGpt.service';
import { dropdownList } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { FormControl, Validators } from '@angular/forms';
import { ICapturePetBond } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { CURRENCYNUMBER } from '@services/constants';
import { formatCurrency } from '@shared/feature/function.feature';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { takeUntil } from 'rxjs';
import { PreventButtonService } from '@trudi-ui';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'capture-pet-bond',
  templateUrl: './capture-pet-bond.component.html',
  styleUrls: ['./capture-pet-bond.component.scss']
})
export class CapturePetBondComponent
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
    this.screens = [EPopupType.prescreen];
  }
  public stepPopupState = {
    prescreen: false,
    sendMessage: false
  };
  public amountControl: FormControl;
  public prescreenTitle;
  public checkSubmit = true;
  public maskPattern = CURRENCYNUMBER;
  public currentModal$ = this.messageFlowService.currentModal$;
  public buttonKey = EButtonStepKey.CAPTURE_PET_BOND;
  public modalId = StepKey.communicationStep.capturePetBond;

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({ prescreen: false, sendMessage: false });
      this.enableProcess();
    }
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  enableProcess() {
    this.initForm();
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.prescreen);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ prescreen: true });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['model']?.currentValue) {
      this.modelData = this.model;
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        'body.prefillTitle': this.modelData?.fields.msgTitle,
        'footer.buttons.showBackBtn': true,
        'footer.buttons.nextButtonType': EFooterButtonType.DROPDOWN,
        'footer.buttons.dropdownList': dropdownList,
        trudiButton: this.modelData
      };
    }
  }

  initForm() {
    const { amount, preScreenIsRequired, title } = (
      this.model?.fields?.customControl as Partial<ICapturePetBond>
    )?.preScreen;
    this.prescreenTitle = title;
    this.amountControl = new FormControl(
      amount,
      preScreenIsRequired ? Validators.required : null
    );
  }

  override handlePopupState(state: Partial<typeof this.stepPopupState>): void {
    this.stepPopupState = { ...this.stepPopupState, ...state };
  }

  override resetPopupState(): void {
    for (const state in this.stepPopupState) {
      this.stepPopupState[state] = false;
    }
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.stopProcess();
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

  closePopup() {
    this.stopProcess();
  }

  stopProcess() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.amountControl?.reset();
    this.amountControl?.markAsPristine();
    this.amountControl?.markAsUntouched();
    this.resetPopupState();
  }

  next() {
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
    this.amountControl?.markAsTouched();
    if (this.amountControl?.errors) {
      this.checkSubmit = false;
      this.addMarkUnTouchedEvent(this.amountControl);
      return;
    }
    const amount = this.amountControl.value;
    this.trudiDynamicParameterService.setDynamicParametersKey({
      $pet_bond_amount: formatCurrency(amount)
    });
    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        capturePetBond: {
          bondAmount: amount
        }
      }
    };
    this.handlePopupState({ sendMessage: true, prescreen: false });
    this.openSendMsgModal();
  }

  openSendMsgModal() {
    this.prefillConfig({
      listOfFiles: this.model?.fields?.files,
      rawMsg: this.model?.fields.msgBody,
      reiFormData: null
    });
    this.messageFlowService
      .openSendMsgModal(this.sendMessageConfigs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            this.onBackFromSendMsg();
            this.PreventButtonService.setCurrentModalActive(this.buttonKey);
            break;
          case ESendMessageModalOutput.MessageSent:
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );
            this.onSendMsg(rs.data);
            break;
          case ESendMessageModalOutput.Quit:
            this.stopProcess();
            break;
        }
      });
  }

  onBackFromSendMsg() {
    this.handlePopupState({ sendMessage: false, prescreen: true });
  }
}
