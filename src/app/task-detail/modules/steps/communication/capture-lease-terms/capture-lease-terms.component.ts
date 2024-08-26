import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { FilesService } from '@services/files.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ChatGptService } from '@services/chatGpt.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PropertiesService } from '@services/properties.service';
import {
  bondAtData,
  leasePeriodTypeData,
  rentedAtData
} from '@/app/task-detail/modules/steps/constants/constants';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { IWidgetLease } from '@/app/task-detail/utils/functions';
import { switchMap, of, takeUntil, map, combineLatest } from 'rxjs';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ICaptureLeaseTerms } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import {
  FrequencyRental,
  ICaptureLeaseTermResponse
} from '@shared/types/trudi.interface';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { formatCurrency } from '@shared/feature/function.feature';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { TrudiButtonEnumStatus } from '@shared/enum';

@Component({
  selector: 'capture-lease-terms',
  templateUrl: './capture-lease-terms.component.html',
  styleUrls: ['./capture-lease-terms.component.scss']
})
export class CaptureLeaseTermsComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  public preScreenIsRequired: boolean;
  public title: string;
  public widgetLeaseData: IWidgetLease;
  public buttonKey = EButtonStepKey.CAPTURE_LEASE_TERMS;
  public modalId = StepKey.communicationStep.captureLeaseTerms;
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      const preScreen = this.model?.fields.customControl['preScreen'];
      this.preScreenIsRequired = preScreen['preScreenIsRequired'];
      this.title = preScreen['title'];
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        trudiButton: this.model,
        'body.prefillTitle': this.model.fields.msgTitle,
        'body.prefillReceivers': true,
        'footer.buttons.showBackBtn': true
      };
    }
  }
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
    private propertyService: PropertiesService,
    private widgetPTService: WidgetPTService,
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
  public leaseTermsForm: FormGroup;
  public rentedAtData = rentedAtData;
  public leasePeriodTypeData = leasePeriodTypeData;
  public bondAtData = bondAtData;
  public captureLeaseTermsResponse: ICaptureLeaseTermResponse;
  get leasePeriod() {
    return this.leaseTermsForm.get('leasePeriod');
  }

  get leasePeriodType() {
    return this.leaseTermsForm.get('leasePeriodType')?.value;
  }

  get rentedAt() {
    return this.leaseTermsForm.get('rentedAt')?.value;
  }

  get rentAmount() {
    return this.leaseTermsForm.get('rentAmount');
  }

  get frequency() {
    return this.leaseTermsForm.get('frequency')?.value;
  }

  get bondAt() {
    return this.leaseTermsForm.get('bondAt')?.value;
  }

  get bondAmount() {
    return this.leaseTermsForm.get('bondAmount');
  }

  get bondIncreaseAmount() {
    return this.leaseTermsForm.get('bondIncreaseAmount');
  }

  initForm() {
    const { preScreen } = this.model.fields
      .customControl as Partial<ICaptureLeaseTerms>;
    const validators = preScreen?.preScreenIsRequired
      ? [Validators.required]
      : [];

    const bondIncreaseAmountControl = new FormControl(null, validators);
    const notApplicableControl = new FormControl(false);

    notApplicableControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value) {
          bondIncreaseAmountControl.setValue(0);
        }
      });

    bondIncreaseAmountControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (notApplicableControl.value && +value !== 0) {
          notApplicableControl.setValue(false);
        }
      });

    this.leaseTermsForm = new FormGroup({
      leasePeriod: new FormControl(null, validators),
      leasePeriodType: new FormControl(null, validators),
      rentedAt: new FormControl(this.rentedAtData[2].value, validators),
      rentAmount: new FormControl(null, validators),
      frequency: new FormControl(null, validators),
      bondAt: new FormControl(this.bondAtData[2].value),
      bondAmount: new FormControl(null, validators),
      bondIncreaseAmount: bondIncreaseAmountControl,
      isNotApplicable: notApplicableControl
    });
    this.setPrefillFormData();
  }
  getCaptureLeasTermsRespone() {
    this.stepService.captureLeaseTermData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.captureLeaseTermsResponse = res;
      });
  }
  setPrefillFormData() {
    combineLatest([
      this.stepService.captureLeaseTermData$,
      this.stepService.getConfirmEssential(),
      this.widgetPTService.getPTWidgetStateByType<IWidgetLease[]>(
        PTWidgetDataField.LEASE_RENEWAL
      )
    ])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([captureLeaseTermData, confirmEssential, ptWidgetState]) => {
          this.captureLeaseTermsResponse = captureLeaseTermData;

          if (ptWidgetState && ptWidgetState.length) {
            const leaseData = ptWidgetState.find(
              (i) => i.status == LeaseRenewalSyncStatus.COMPLETED
            );
            if (leaseData) {
              this.widgetLeaseData = leaseData;
              const tenancyId = leaseData.tenancyId;
              return this.propertyService.peopleList$.pipe(
                map(
                  (people) =>
                    people?.tenancies?.find((item) => item.id === tenancyId)
                      ?.userPropertyGroupLeases[0]
                )
              );
            }
          }

          if (confirmEssential) {
            return this.propertyService.peopleList$.pipe(
              map((people) => {
                if (!people) return;
                const peopleFound = people.tenancies.find(
                  (item) => item.id === confirmEssential.tenancy
                );

                return {
                  ...peopleFound?.userPropertyGroupLeases[0],
                  bondAmountRequired: peopleFound?.bondAmountRequired
                };
              })
            );
          }

          return of(null);
        })
      )
      .subscribe((prefillDefaultData) => {
        const setPrefillData = {
          leasePeriod:
            this.captureLeaseTermsResponse?.leasePeriod ??
            null ??
            prefillDefaultData?.leasePeriod ??
            null,
          leasePeriodType:
            this.captureLeaseTermsResponse?.leasePeriodType ||
            prefillDefaultData?.leasePeriodType ||
            null,
          frequency:
            this.captureLeaseTermsResponse?.frequency ||
            this.widgetLeaseData?.frequency ||
            prefillDefaultData?.frequency,
          rentAmount:
            this.captureLeaseTermsResponse?.rentAmount ??
            null ??
            this.widgetLeaseData?.rent ??
            null ??
            prefillDefaultData?.rentAmount ??
            null,
          rentedAt:
            this.captureLeaseTermsResponse?.rentedAt ||
            this.rentedAtData[2].value,
          bondAt:
            this.captureLeaseTermsResponse?.bondAt || this.bondAtData[2].value,
          bondAmount:
            this.captureLeaseTermsResponse?.bondAmount ??
            prefillDefaultData?.bondAmountRequired ??
            null,
          bondIncreaseAmount:
            this.captureLeaseTermsResponse?.bondIncreaseAmount ?? null,
          isNotApplicable: this.captureLeaseTermsResponse?.isNotApplicable
        };
        this.leaseTermsForm.patchValue(setPrefillData);
      });
  }
  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({
        isPopupCaptureLease: false,
        isTrudiSendMessage: false
      });
      this.resetPopupState();
      this.enableProcess();
    }
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  enableProcess() {
    this.initForm();
    const isCompletedStep =
      this.model.status === TrudiButtonEnumStatus.COMPLETED ||
      this.model.status === TrudiButtonEnumStatus.SCHEDULED;

    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey,
        isHasPrefillData: !!this.captureLeaseTermsResponse,
        isCompletedStep
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.isPopupCaptureLease);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ isPopupCaptureLease: true });
  }
  stopProcess() {
    this.leaseTermsForm?.reset();
    this.leaseTermsForm?.markAsPristine();
    this.leaseTermsForm?.markAsUntouched();
    this.resetPopupState();
  }
  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        if (event.isDraft) {
          this.stopProcess();
          return;
        }
        this.saveDataLeaseTerms(event);
        this.handleSendMsgToast(event);
        this.stopProcess();
        break;
      default:
        break;
    }
  }

  saveDataLeaseTerms(event: ISendMsgTriggerEvent) {
    const taskId = this.taskService.currentTask$.value.id;
    this.stepService
      .saveTrudiResponseData(this.leaseTermsForm.value, null, taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.complete(event);
        this.stepService.updateCaptureLeaseTermData(res.leaseTerm);
      });
  }
  nextModal() {
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
    this.handlePopupState({
      isPopupCaptureLease: false,
      isTrudiSendMessage: true
    });
    this.textForwardMessg = this.model.fields.msgBody;
    this.leasePeriod?.value &&
      this.leasePeriod.setValue(Number(this.leasePeriod?.value));
    this.bondAmount?.value &&
      this.bondAmount.setValue(Number(this.bondAmount?.value));
    this.bondIncreaseAmount?.value &&
      this.bondIncreaseAmount.setValue(Number(this.bondIncreaseAmount?.value));
    this.rentAmount?.value &&
      this.rentAmount.setValue(Number(this.rentAmount?.value));
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    this.trudiDynamicParameterService.setDynamicParametersKey({
      lease_duration_period: !isNaN(parseFloat(this.leasePeriod?.value))
        ? `${this.leasePeriod?.value}`
        : null,
      duration_period_type:
        this.leasePeriod?.value === 1
          ? this.leasePeriodType?.toLowerCase()?.slice(0, -1)
          : this.leasePeriodType?.toLowerCase(),
      rental_state: this.rentedAt,
      $lease_rent_amount: formatCurrency(this.rentAmount.value),
      lease_payment_period: this.getFrequencyLabel(this.frequency),
      bond_state: this.bondAt,
      $bond_amount: formatCurrency(this.bondAmount.value),
      $bond_increase_paid: formatCurrency(this.bondIncreaseAmount.value)
    });
    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        captureLeaseTerm: {
          leasePeriod: this.leasePeriod?.value,
          leasePeriodType: this.leasePeriodType?.toLowerCase(),
          rentAmount: this.rentAmount?.value
            ? '$' + this.rentAmount?.value
            : null,
          rentState: this.rentedAt,
          paymentPeriod: this.frequency?.toLowerCase(),
          bondState: this.bondAt,
          bondAmount: !isNaN(parseFloat(this.bondAmount?.value))
            ? `$${this.bondAmount?.value}`
            : null,
          bondIncreaseAmount: !isNaN(parseFloat(this.bondIncreaseAmount?.value))
            ? `$${this.bondIncreaseAmount?.value}`
            : null
        }
      }
    };
    this.prefillConfig({
      listOfFiles: this.model?.fields?.files,
      prefillVariables: this.prefillVariable,
      rawMsg: this.textForwardMessg,
      reiFormData: null
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
            this.onQuit();
            break;
        }
      });
  }
  onQuit() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.handlePopupState({
      isPopupCaptureLease: false,
      isTrudiSendMessage: false
    });
    this.stopProcess();
  }
  cancelModal() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.handlePopupState({
      isPopupCaptureLease: false,
      isTrudiSendMessage: false
    });
    this.stopProcess();
  }
  handleBackSendMsg() {
    this.handlePopupState({
      isPopupCaptureLease: true,
      isTrudiSendMessage: false
    });
  }
  getFrequencyLabel(frequency: string) {
    switch (frequency) {
      case FrequencyRental.DAILY:
        return 'per day';
      case FrequencyRental.WEEKLY:
        return 'per week';
      case FrequencyRental.FORTNIGHT:
        return 'per fortnight';
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
}
