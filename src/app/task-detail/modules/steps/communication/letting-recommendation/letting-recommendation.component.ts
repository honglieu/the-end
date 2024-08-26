import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ChatGptService } from '@services/chatGpt.service';
import { ToastrService } from 'ngx-toastr';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { LettingRecommendationFormComponent } from '@/app/task-detail/modules/steps/communication/letting-recommendation/components/letting-recommendation-form/letting-recommendation-form.component';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  FrequencyRental,
  FrequencyRentalTime,
  LeasePeriodLetting,
  LeasePeriodType
} from '@shared/types/trudi.interface';
import { ISendRelettingData } from '@/app/leasing/utils/leasingType';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { formatCurrency } from '@shared/feature/function.feature';
import { takeUntil } from 'rxjs';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

interface StepPopupType {
  trudiSendMessage: boolean;
  lettingRecommendation: boolean;
}

export interface ILettingRecommendationFormType {
  leasePeriod: number;
  rentAmount: number;
  frequency: FrequencyRentalTime;
  leaseDuration: number;
  leasePeriodType: LeasePeriodType;
}
@Component({
  selector: 'letting-recommendation',
  templateUrl: './letting-recommendation.component.html',
  styleUrls: ['./letting-recommendation.component.scss']
})
export class LettingRecommendationComponent
  extends StepBaseComponent
  implements OnInit, OnChanges, OnDestroy
{
  @ViewChild('lettingForm') lettingForm: LettingRecommendationFormComponent;
  public stepPopupState: StepPopupType = {
    trudiSendMessage: false,
    lettingRecommendation: false
  };
  public lettingRecommendationData: ILettingRecommendationFormType;
  public buttonKey = EButtonStepKey.LETTING_RECOMMENDATIONS;
  public modalId = StepKey.communicationStep.lettingRecommendations;

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        'body.prefillTitle': this.model.fields.msgTitle,
        'body.prefillReceivers': true,
        'footer.buttons.showBackBtn': true,
        trudiButton: this.model
      };
    }
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({
        lettingRecommendation: false,
        trudiSendMessage: false
      });
      this.lettingForm.resetForm();
      this.enableProcess();
    }
    this.lettingRecommendationData = null;
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  enableProcess() {
    this.textForwardMessg = this.model.fields.msgBody;
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.lettingRecommendation);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ lettingRecommendation: true });
  }

  handleCloseEventModal() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.resetData();
    this.lettingForm && this.lettingForm.resetForm();
    this.lettingRecommendationData = null;
    this.handlePopupState({
      trudiSendMessage: false,
      lettingRecommendation: false
    });
  }

  handleConfirmEventModal() {
    if (this.lettingForm) {
      if (this.lettingForm.handleSubmitForm()) {
        this.lettingRecommendationData = this.lettingForm.handleSubmitForm();
        const {
          frequency,
          leaseDuration,
          leasePeriod,
          leasePeriodType,
          rentAmount
        } = this.lettingForm.handleSubmitForm() || {};
        this.handlePrefillMsg({
          leasePeriodType,
          leaseDuration,
          rentAmount,
          frequency,
          leasePeriod
        });
        this.sendMessageConfigs['body.taskData'] = {
          ...(this.sendMessageConfigs['body.taskData'] || {}),
          advanceData: {
            lettingRecommend: {
              leasePeriod: this.lettingRecommendationData.leasePeriod,
              rentAmount: this.lettingRecommendationData.rentAmount,
              frequency: this.lettingRecommendationData.frequency,
              leaseDuration: this.lettingRecommendationData.leaseDuration,
              leasePeriodType: this.lettingRecommendationData.leasePeriodType
            }
          }
        };
        this.handlePopupState({
          trudiSendMessage: true,
          lettingRecommendation: false
        });
        this.openSendMsgModal();
      }
    }
    this.prefillConfig({
      listOfFiles: this.model?.fields?.files,
      rawMsg: this.model?.fields?.msgBody
    });
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
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
            this.handleBackSendMsg();
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
            this.handleQuitSendMsg();
            break;
        }
      });
  }

  handlePrefillMsg(value: ISendRelettingData) {
    this.trudiDynamicParameterService.setDynamicParametersKey({
      letting_type: value?.leasePeriod
        ? value?.leasePeriod == LeasePeriodLetting.Relet
          ? 'relet'
          : 'new letting'
        : '',
      $recommended_rental_amount: formatCurrency(value?.rentAmount),
      letting_payment_period: this.getFrequencyLabel(value?.frequency),
      recommended_lease_duration: value?.leaseDuration,
      letting_period_type: value?.leasePeriodType?.toLowerCase()
    });
  }

  handleQuitSendMsg() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.lettingRecommendationData = null;
    this.lettingForm && this.lettingForm.resetForm();
    this.handlePopupState({ trudiSendMessage: false });
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.resetData();
        this.lettingForm && this.lettingForm.resetForm();
        this.lettingRecommendationData = null;
        this.handlePopupState({
          trudiSendMessage: false,
          lettingRecommendation: false
        });
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

  handleBackSendMsg() {
    this.handlePopupState({
      lettingRecommendation: true,
      trudiSendMessage: false
    });
  }

  override handlePopupState(state: {}) {
    this.stepPopupState = { ...this.stepPopupState, ...state };
  }

  getFrequencyLabel(frequency: string) {
    switch (frequency) {
      case FrequencyRental.DAILY:
        return 'per day';
      case FrequencyRental.WEEKLY:
        return 'per week';
      case FrequencyRental.WEEKLY2:
        return 'per 2 weeks';
      case FrequencyRental.MONTHLY:
        return 'per month';
      case FrequencyRental.QUARTERLY:
        return 'per quarter';
      case FrequencyRental.YEARLY:
        return 'per year';
      default:
        return '';
    }
  }

  override ngOnDestroy(): void {
    this.lettingRecommendationData = null;
  }
}
