import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ITenantAmountVacate } from '@/app/tenant-vacate/utils/tenantVacateType';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { CURRENCYNUMBER } from '@services/constants';
import { formatCurrency } from '@shared/feature/function.feature';
import { takeUntil } from 'rxjs';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
interface StepPopupType {
  trudiSendMessage: boolean;
  bondSummaryPopup: boolean;
}

@Component({
  selector: 'bond-return-summary',
  templateUrl: './bond-return-summary.component.html',
  styleUrls: ['./bond-return-summary.component.scss']
})
export class BondReturnSummaryComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  public bondSummaryForm: FormGroup;
  public maskPattern = CURRENCYNUMBER;
  public stepPopupState: StepPopupType = {
    trudiSendMessage: false,
    bondSummaryPopup: false
  };
  public buttonKey = EButtonStepKey.BOND_RETURN_SUMMARY;
  public modalId = StepKey.communicationStep.bondReturnSummary;
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
      this.resetForm();
      this.handlePopupState({
        bondSummaryPopup: false,
        trudiSendMessage: false
      });
      this.enableProcess();
    }
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  enableProcess() {
    this.buildForm();
    this.textForwardMessg = this.model.fields.msgBody;
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.bondSummaryPopup);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ bondSummaryPopup: true });
  }

  handleCloseEventModal() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.handlePopupState({
      trudiSendMessage: false,
      bondSummaryPopup: false
    });
    this.resetData();
    this.resetForm();
  }

  handleConfirmEventModal() {
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
    if (this.bondDeductControl?.value) {
      this.reasonDeductControl.updateValueAndValidity();
    } else {
      this.reasonDeductControl.setValue(null);
      this.reasonDeductControl.updateValueAndValidity();
    }
    this.bondSummaryForm.markAllAsTouched();
    if (this.bondSummaryForm.invalid) {
      return;
    }
    this.reasonDeductControl.markAsPristine();
    this.reasonDeductControl.markAsUntouched();

    this.prefillVariables({
      firstField: this.bondTenantControl.value,
      secondField: this.bondDeductControl.value,
      thirdField: this.reasonDeductControl.value
    });
    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        bondReturnSummary: {
          bondTenant: this.bondTenantControl.value,
          bondDeduct: this.bondDeductControl.value,
          reasonDeduct: this.reasonDeductControl.value
        }
      }
    };
    this.handlePopupState({ bondSummaryPopup: false, trudiSendMessage: true });
    this.openSendMsgModal();
  }

  prefillVariables(value: ITenantAmountVacate) {
    this.trudiDynamicParameterService.setDynamicParametersKey({
      $bond_amount_returned: formatCurrency(value?.firstField),
      $bond_amount_deducted: formatCurrency(value?.secondField),
      reason_bond_deduction: value?.thirdField
    });
  }

  buildForm() {
    const isRequired = !!this.model.fields.customControl.isRequired;
    this.bondSummaryForm = new FormGroup({
      bondTenant: new FormControl(
        null,
        isRequired ? [Validators.required] : []
      ),
      bondDeduct: new FormControl(null),
      reasonDeduct: new FormControl({ value: null, disabled: true }, [
        Validators.required
      ])
    });
    this.bondDeductControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs && this.reasonDeductControl.disabled) {
          this.reasonDeductControl.markAsUntouched();
          this.reasonDeductControl.markAsPristine();
          this.reasonDeductControl.enable();
        }
        if (!rs && this.reasonDeductControl.enabled) {
          this.reasonDeductControl.disable();
        }
      });
  }

  handleBackSendMsg() {
    this.handlePopupState({ bondSummaryPopup: true, trudiSendMessage: false });
  }

  handleQuitSendMsg() {
    this.resetForm();
    this.handlePopupState({ trudiSendMessage: false });
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
            this.handlePopupState({
              trudiSendMessage: false,
              bondSummaryPopup: false
            });
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );
            break;
        }
      });
  }

  resetForm() {
    this.bondSummaryForm.reset();
    this.bondSummaryForm.markAsPristine();
    this.bondSummaryForm.markAsUntouched();
    this.bondSummaryForm.updateValueAndValidity();
  }

  override handlePopupState(state: {}) {
    this.stepPopupState = { ...this.stepPopupState, ...state };
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.handlePopupState({
          trudiSendMessage: false,
          bondSummaryPopup: false
        });
        this.resetData();
        this.resetForm();
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

  get bondTenantControl() {
    return this.bondSummaryForm.get('bondTenant') as FormControl;
  }

  get bondDeductControl() {
    return this.bondSummaryForm.get('bondDeduct') as FormControl;
  }

  get reasonDeductControl() {
    return this.bondSummaryForm.get('reasonDeduct') as FormControl;
  }
}
