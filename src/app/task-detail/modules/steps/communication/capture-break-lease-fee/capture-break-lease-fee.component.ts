import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import { ToastrService } from 'ngx-toastr';
import { ChatGptService } from '@services/chatGpt.service';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { SendMessageService } from '@services/send-message.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  REIFormState,
  ReiFormData,
  ReiFormLink
} from '@shared/types/rei-form.interface';
import { ACCEPT_ONLY_SUPPORTED_FILE } from '@services/constants';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { takeUntil } from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { formatCurrency } from '@shared/feature/function.feature';
import { CompanyService } from '@services/company.service';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'capture-break-lease-fee',
  templateUrl: './capture-break-lease-fee.component.html',
  styleUrls: ['./capture-break-lease-fee.component.scss']
})
export class CaptureBreakLeaseFeeComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  public breakLeaseFeeform: FormGroup;
  public breakLeaseFeePopuptitle = '';
  public preScreenIsRequired;
  public attachmentIsRequired: boolean;
  public ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;
  public titleAttachNote: string;
  public reiFormLink: ReiFormLink;
  public reiFormData: ReiFormData = {};
  public isRefreshingREIStatus: boolean = false;
  public isNextFromAttachEntryNote: boolean = false;
  public isHideReviewAttachmentBottomWrapper: boolean = false;
  public reiFormInfo: ReiFormData;
  public REIFormState: REIFormState = {
    documentStatus: false,
    formName: true
  };
  public reiFormBadge: string;
  public isShowUploadReiFormBox: boolean = true;
  public buttonKey = EButtonStepKey.CAPTURE_BREAK_LEASE_FEE;
  public modalId = StepKey.communicationStep.captureBreakLeaseFee;
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
    private fb: FormBuilder,
    private agencyService: AgencyService,
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

  override ngOnInit() {
    super.ngOnInit();
    this.companyService.currentCompanyCRMSystemName
      .pipe(takeUntil(this.destroy$))
      .subscribe((crmName) => {
        this.isShowUploadReiFormBox = crmName == ECRMSystem.PROPERTY_TREE;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      const { msgTitle } = this.model.fields;
      const { preScreenIsRequired, title } =
        this.model?.fields.customControl['preScreen'];
      this.preScreenIsRequired = preScreenIsRequired;
      this.breakLeaseFeePopuptitle = title;
      this.setDocumentStatus();
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        trudiButton: this.model,
        'body.prefillTitle': msgTitle,
        'body.prefillReceivers': true,
        'footer.buttons.showBackBtn': true
      };
      this.listOfFiles = this.mapDynamicFiles();
      this.getCustomControlAttachment();
    }
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.resetPopupState();
      this.enableProcess();
    }
  }

  enableProcess() {
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    const validatorForm = this.preScreenIsRequired ? [Validators.required] : [];
    this.breakLeaseFeeform = this.fb.group({
      breakLeaseFee: new FormControl(null, validatorForm),
      advertisingFee: new FormControl(null, validatorForm),
      otherFee: new FormGroup({
        name: new FormControl(''),
        fee: new FormControl(null)
      })
    });
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.isPopupBreakLease);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ isPopupBreakLease: true });
    this.prefillVariables();
  }

  handleNextBreakLeaseFee() {
    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        captureBreakLeaseFee: {
          breakLeaseFee: !isNaN(parseFloat(this.breakLeaseFee))
            ? '$' + this.breakLeaseFee
            : null,
          advertisingFee: !isNaN(parseFloat(this.advertisingFee))
            ? '$' + this.advertisingFee
            : null,
          otherFeeName: this.otherFee?.name || '',
          otherFeeAmount: !isNaN(parseFloat(this.otherFee?.fee))
            ? '$' + this.otherFee.fee
            : null
        }
      }
    };
    this.handlePopupState({ attachEntryNote: true, isPopupBreakLease: false });
  }

  get breakLeaseFee() {
    return this.breakLeaseFeeform.get('breakLeaseFee').value;
  }

  get advertisingFee() {
    return this.breakLeaseFeeform.get('advertisingFee').value;
  }

  get otherFee() {
    return this.breakLeaseFeeform.get('otherFee').value;
  }

  prefillVariables() {
    this.textForwardMessg = this.model.fields.msgBody;
  }
  checkRequired(isRequired: boolean) {
    return isRequired ? '(Required)' : '(Optional)';
  }
  getCustomControlAttachment() {
    const { title, attachmentIsRequired } =
      this.model.fields.customControl['attachment'];

    this.reiFormBadge = title;
    this.attachmentIsRequired = attachmentIsRequired;
    this.titleAttachNote = `Please attach: ${
      this.reiFormBadge
    } ${this.checkRequired(this.attachmentIsRequired)}`;
  }
  setDocumentStatus() {
    if (
      this.model?.reiFormInfor &&
      this.model.status === TrudiButtonEnumStatus.COMPLETED
    ) {
      this.reiFormInfo = this.model?.reiFormInfor;
      this.REIFormState = { documentStatus: true, formName: false };
    } else {
      this.reiFormInfo = null;
      this.REIFormState = { documentStatus: false, formName: true };
    }
  }

  onNextAttachEntryNote() {
    this.isNextFromAttachEntryNote = true;
    this.listOfFiles = this.mapDynamicFiles();
    this.trudiDynamicParameterService.setDynamicParametersKey({
      break_lease_form_name: this.reiFormBadge
    });
    this.prefillDynamicParamBreakLease();
    this.handlePopupState({ isTrudiSendMessage: true });
    this.openSendMsgModal();
    this.resetPopupState();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  onBackAttachEntryNote() {
    this.handlePopupState({ attachEntryNote: false, isPopupBreakLease: true });
  }

  getSelectedFile(event) {
    if (!event) return;
    this.isNextFromAttachEntryNote = false;
    for (let i = 0; i < event.length; i++) {
      this.selectedFiles = [
        {
          ...this.selectedFiles,
          title: '',
          listFile: event
        }
      ];
    }
    this.filesService.originalLocalFiles.next([...event]);
    this.handlePopupState({ uploadAttachments: true, attachEntryNote: false });
  }

  onNextToSelectREIForm() {
    this.isNextFromAttachEntryNote = false;
    this.handlePopupState({ selectREIDocument: true, attachEntryNote: false });
  }

  handleBackUploadAttachments() {
    this.resetData();
    this.handlePopupState({ attachEntryNote: true, uploadAttachments: false });
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  getSelectedREIDocument(event) {
    if (event) {
      this.reiFormLink = event;
      this.isHideReviewAttachmentBottomWrapper = false;
      this.trudiDynamicParameterService.setDynamicParametersKey({
        break_lease_form_name: this.reiFormBadge
      });
      this.prefillDynamicParamBreakLease();
      this.handlePopupState({
        reviewREIDocument: true,
        selectREIDocument: false
      });
    }
  }

  handleBackAttachModal() {
    this.resetPopupState();
    this.handlePopupState({ attachEntryNote: true, selectREIDocument: false });
  }

  prefillDynamicParamBreakLease() {
    this.trudiDynamicParameterService.setDynamicParametersKey({
      $break_lease_fee: formatCurrency(this.breakLeaseFee),
      $advertising_fees: formatCurrency(this.advertisingFee),
      other_fees_name: this.otherFee?.name || '',
      $other_fees_amount: formatCurrency(this.otherFee.fee)
    });
  }

  handleBackReviewAttachment() {
    this.resetPopupState();
    this.handlePopupState({ selectREIDocument: true });
  }
  handleContinueDraftForm() {
    this.resetPopupState();
    this.handlePopupState({ attachDraftForm: true });
  }
  onConfirmFromReviewAttachment(reiFormData: ReiFormData) {
    this.reiFormData = reiFormData;
    const { fileSize, fileName, contentType } = reiFormData.formFileInfo;
    if (!reiFormData.formDetail.isSigned) {
      this.listOfFiles = [
        {
          ...reiFormData.formFileInfo,
          icon: this.filesService.getFileIcon(fileName),
          size: fileSize,
          name: fileName,
          fileType: {
            name: contentType
          },
          fileUrl: reiFormData.s3Info.url
        }
      ];
    }

    this.prefillDynamicParamBreakLease();

    this.handlePopupState({
      isTrudiSendMessage: true,
      reviewREIDocument: false,
      attachDraftForm: false
    });
    this.openSendMsgModal();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  openSendMsgModal() {
    this.prefillConfig({
      listOfFiles: this.listOfFiles,
      reiFormData: this.reiFormData,
      rawMsg: this.textForwardMessg
    });
    this.messageFlowService
      .openSendMsgModal(this.sendMessageConfigs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.Back:
            this.onBackSendMsg();
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
  handleSubmitFile() {
    this.listOfFiles = this.filesService.mapFilesUpload(
      this.selectedFiles.flatMap((item) => item.listFile)
    );
    const dynamicFiles = this.mapDynamicFiles();
    this.listOfFiles = [...this.listOfFiles, ...dynamicFiles];
    this.trudiDynamicParameterService.setDynamicParametersKey({
      break_lease_form_name: this.reiFormBadge
    });
    this.prefillDynamicParamBreakLease();
    this.handlePopupState({
      isTrudiSendMessage: true,
      uploadAttachments: false
    });
    this.openSendMsgModal();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  onBackSendMsg(): void {
    this.handlePopupState({ isTrudiSendMessage: false });
    if (this.isNextFromAttachEntryNote) {
      this.isNextFromAttachEntryNote = false;
      this.handlePopupState({ attachEntryNote: true });
    } else if (this.reiFormData && Object.keys(this.reiFormData)?.length) {
      this.reiFormData = {};
      this.isHideReviewAttachmentBottomWrapper = false;
      this.handlePopupState({ reviewREIDocument: true });
    } else {
      this.handlePopupState({ uploadAttachments: true });
    }
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.resetPopupState();
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
  onQuit() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.resetPopupState();
  }
}
