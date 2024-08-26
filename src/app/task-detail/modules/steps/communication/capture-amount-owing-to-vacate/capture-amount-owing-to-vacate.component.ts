import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { StepBaseComponent } from './../step-base/step-base.component';
import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TrudiService } from '@services/trudi.service';
import { TaskService } from '@services/task.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { FilesService } from '@services/files.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ChatGptService } from '@services/chatGpt.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { ICaptureAmountOwingVacate } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import {
  EFooterButtonType,
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { ESyncStatus, IWidgetVacate } from '@/app/task-detail/utils/functions';
import { filter, takeUntil } from 'rxjs';
import { dropdownList } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  CURRENCYNUMBER,
  DEFAULT_CHAR_TRUDI_NUMBER_FIELD,
  TENANCY_STATUS
} from '@services/constants';
import dayjs from 'dayjs';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';

import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ERmCrmStatus } from '@shared/enum/user.enum';
import { PropertiesService } from '@services/properties.service';
import { Personal } from '@shared/types/user.interface';
import { ArrearsType } from '@/app/breach-notice/utils/breach-notice.enum';
import { formatCurrency } from '@shared/feature/function.feature';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { CompanyService } from '@services/company.service';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'capture-amount-owing-to-vacate',
  templateUrl: './capture-amount-owing-to-vacate.component.html',
  styleUrls: ['./capture-amount-owing-to-vacate.component.scss']
})
export class CaptureAmountOwingToVacateComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  public tenancyList = [];
  public prescreenTitle: string;
  public amountOwingVacateForm: FormGroup;
  public noticeDate: string;
  public vacateDate: string;
  public DEFAULT_CHAR_TRUDI_NUMBER_FIELD = DEFAULT_CHAR_TRUDI_NUMBER_FIELD;
  public stepPopupState = {
    prescreen: false,
    sendMessage: false
  };
  public ECRMSystem = ECRMSystem;
  public currentCRM: ECRMSystem = ECRMSystem.PROPERTY_TREE;
  public maskPattern = CURRENCYNUMBER;
  public currentModal$ = this.messageFlowService.currentModal$;
  public buttonKey = EButtonStepKey.CAPTURE_AMOUNT_OWING_TO_VACATE;
  public modalId = StepKey.communicationStep.captureAmountOwingToVacate;

  public checkSubmit = true;
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
    private widgetPTService: WidgetPTService,
    private fb: FormBuilder,
    private agencyService: AgencyService,
    private propertiesService: PropertiesService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService,
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

  public get tenancy() {
    return this.amountOwingVacateForm?.get('tenancy');
  }

  public get rentOwing() {
    return this.amountOwingVacateForm?.get('rentOwing');
  }

  public get invoiceFees() {
    return this.amountOwingVacateForm?.get('invoiceFees');
  }

  public get notes() {
    return this.amountOwingVacateForm?.get('notes');
  }

  override ngOnInit() {
    super.ngOnInit();
    this.companyService.currentCompanyCRMSystemName.subscribe((res) => {
      this.currentCRM = res;
    });
    this.propertiesService.peopleList$
      .pipe(
        filter((res) => !!res),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.tenancyList =
          res.tenancies
            ?.filter((tenancy) =>
              (this.currentCRM === ECRMSystem.PROPERTY_TREE
                ? [
                    TENANCY_STATUS.active,
                    TENANCY_STATUS.vacating,
                    TENANCY_STATUS.vacated
                  ]
                : [ERmCrmStatus.RMCurrent, ERmCrmStatus.RMPast]
              ).includes(tenancy.status)
            )
            .sort((tenancyA, tenancyB) =>
              tenancyA.name.localeCompare(tenancyB.name, 'en', {
                numeric: true
              })
            ) || [];
      });
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

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({ prescreen: false, sendMessage: false });
      this.enableProcess();
    }
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  public enableProcess() {
    this.checkSubmit = true;
    this.initForm();
    this.getVacateDetail();
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

  public initForm() {
    const { preScreenIsRequired, title } = (
      this.model.fields.customControl as Partial<ICaptureAmountOwingVacate>
    )?.preScreen;
    this.prescreenTitle = title;
    const validators = preScreenIsRequired ? Validators.required : null;
    this.amountOwingVacateForm = this.fb.group({
      tenancy: new FormControl(null),
      invoiceFees: new FormControl(null, validators),
      notes: new FormControl(null),
      rentOwing: new FormControl(null, validators)
    });
  }

  handleChangeTenancy() {
    const tenancy = this.tenancy.value as Personal;
    const rent = tenancy?.arrears?.filter((ar) => ar.type === ArrearsType.RENT);
    const invoiceFees = tenancy?.arrears?.filter(
      (ar) => ar.type === ArrearsType.FEES_INVOICES
    );
    this.rentOwing.setValue(rent?.[0]?.rent || null);
    this.invoiceFees.setValue(invoiceFees?.[0]?.invoiceFees || null);
  }

  getVacateDetail() {
    this.widgetPTService
      .getPTWidgetStateByType(PTWidgetDataField.TENANT_VACATES)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IWidgetVacate[]) => {
        if (
          [ESyncStatus.COMPLETED, ESyncStatus.PENDING].includes(
            data[0]?.['status'] as ESyncStatus
          )
        ) {
          this.vacateDate = data[0]?.['vacateDate'];
          this.noticeDate = data[0]?.['noticeDate'];
        } else {
          const vacateDate = data?.find((item) => {
            return [ESyncStatus.COMPLETED, ESyncStatus.PENDING].includes(
              item?.['status'] as ESyncStatus
            );
          });
          this.vacateDate = vacateDate?.['vacateDate'];
          this.noticeDate = vacateDate?.['noticeDate'];
        }
      });
  }

  closePopup() {
    this.resetPopupState();
    this.resetForm();
  }

  resetForm() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.amountOwingVacateForm?.reset();
    this.amountOwingVacateForm?.markAsPristine();
    this.amountOwingVacateForm?.markAsUntouched();
    this.amountOwingVacateForm?.updateValueAndValidity();
  }

  onBackFromSendMsg() {
    this.handlePopupState({
      sendMessage: false,
      prescreen: true
    });
  }

  openSendMsgModal() {
    this.prefillConfig({
      listOfFiles: this.model?.fields?.files,
      rawMsg: this.model?.fields.msgBody
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
            this.closePopup();
            break;
        }
      });
  }

  next() {
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
    if (this.amountOwingVacateForm.invalid) {
      this.checkSubmit = false;
      this.amountOwingVacateForm.markAllAsTouched();
      this.addMarkUnTouchedEvent(this.rentOwing);
      this.addMarkUnTouchedEvent(this.invoiceFees);
      return;
    }
    this.checkSubmit = true;
    this.prefillVariables();
    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        captureAmountOwingToVacate: {
          rentOwing: this.rentOwing.value,
          invoiceFees: this.invoiceFees.value,
          notes: this.notes.value
        }
      }
    };
    this.handlePopupState({
      prescreen: false,
      sendMessage: true
    });
    this.openSendMsgModal();
  }

  formatNumberVariable(number) {
    number = Number(number);
    const formattedNumber = number.toLocaleString('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formattedNumber;
  }

  prefillVariables() {
    const tenancyNameVariable =
      this.currentCRM === ECRMSystem.PROPERTY_TREE
        ? 'vacate_tenancy_name'
        : 'vacate_tenant_name';
    const formData = this.amountOwingVacateForm.getRawValue();
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.getValue();
    this.trudiDynamicParameterService.setDynamicParametersKey({
      [tenancyNameVariable]: formData.tenancy?.name || null,
      $rent_owing: formatCurrency(formData.rentOwing),
      $outstanding_invoices_fees: formatCurrency(formData.invoiceFees),
      vacate_date: this.vacateDate
        ? dayjs(this.vacateDate).format(DATE_FORMAT_DAYJS)
        : 'unknown date',
      amount_owning_note: formData.notes
    });
  }

  override handlePopupState(state: Partial<typeof this.stepPopupState>): void {
    this.stepPopupState = { ...this.stepPopupState, ...state };
  }

  override resetPopupState() {
    for (const key in this.stepPopupState) {
      this.stepPopupState[key] = false;
    }
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.closePopup();
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
