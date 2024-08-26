import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ACCEPT_ONLY_SUPPORTED_FILE } from '@services/constants';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { SendTenantBondLodgementTextStatus } from '@shared/enum/leasing-request.enum';
import {
  ReiFormData,
  ReiFormLink,
  REIFormState
} from '@shared/types/rei-form.interface';
import { REIFormDocumentStatus } from '@shared/enum/share.enum';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
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
import { LeasingService } from '@services/leasing.service ';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { formatCurrency } from '@shared/feature/function.feature';
import { CompanyService } from '@services/company.service';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'bond-amount-due',
  templateUrl: './bond-amount-due.component.html',
  styleUrls: ['./bond-amount-due.component.scss']
})
export class BondAmountDueComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  readonly ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;

  //Model Bond Amount Due properties
  public visibleModalBondAmount: boolean = false;
  public modelBondAmountTitle: string = '';
  public bondAmount: string = '';
  public isProcessing: boolean;

  //Model Attachment properties
  public visibleModalAttachment: boolean = false;
  public modelAttachmentTitle: string = '';

  public isNextFromAttachEntryNote: boolean = false;
  override textForwardMessg: string;
  public reiFormLink: ReiFormLink;
  public isHideReviewAttachmentBottomWrapper: boolean;
  public fileRequired: boolean = false;
  public bondAmountRequired: boolean = false;
  public listFileUpload = [{ title: '', listFile: [] }];
  public reiFormData: ReiFormData = {};
  public listFile = [];
  public reiFormState: REIFormState = {
    documentStatus: false,
    formName: true
  };
  public reiFormBadge: string;
  public isShowUploadReiFormBox: boolean = true;
  public buttonKey = EButtonStepKey.BOND_AMOUNT_DUE;
  public modalId = StepKey.communicationStep.bondAmountDue;

  constructor(
    public override trudiDynamicParameterService: TrudiDynamicParameterService,
    public override taskService: TaskService,
    public override trudiService: TrudiService,
    public override sendMessageService: SendMessageService,
    public override conversationService: ConversationService,
    public override toastService: ToastrService,
    public override filesService: FilesService,
    public override stepService: StepService,
    public override chatGptService: ChatGptService,
    private leasingService: LeasingService,
    private agencyService: AgencyService,
    private companyService: CompanyService,
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
    this.companyService.currentCompanyCRMSystemName
      .pipe(takeUntil(this.destroy$))
      .subscribe((crmName) => {
        this.isShowUploadReiFormBox = crmName == ECRMSystem.PROPERTY_TREE;
      });
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
      this.listFile = this.mapDynamicFiles();
    }
  }

  private parseModel(model?: TrudiStep): void {
    const customControl = this.model?.['fields']?.['customControl'];
    this.reiFormBadge = customControl['attachment']['title'];
    const isRequiredAttachment =
      customControl['attachment']['attachmentIsRequired'];
    this.modelBondAmountTitle = customControl['preScreen']['title'];
    this.modelAttachmentTitle = `Please attach: ${
      customControl['attachment']['title']
    } ${isRequiredAttachment ? '(Required)' : '(Optional)'}`;
    if (!!customControl['preScreen']['preScreenIsRequired']) {
      this.bondAmountRequired = true;
    }
    if (!!customControl['attachment']['attachmentIsRequired']) {
      this.fileRequired = true;
    }
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({ bondLodgement: false });
      this.resetData();
      this.enableProcess();
    }
  }

  enableProcess() {
    this.isProcessing = true;
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.bondLodgement);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ bondLodgement: true });
    this.prefillVariables();
  }

  prefillVariables() {
    this.textForwardMessg = this.model.fields.msgBody;
  }

  onNextBondLodgement(amount: string) {
    this.bondAmount = amount;
    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        bondAmountDue: {
          bondAmount: this.bondAmount
        }
      }
    };
    this.handlePopupState({ attachEntryNote: true, bondLodgement: false });
  }

  onNextAttachEntryNote() {
    this.isNextFromAttachEntryNote = true;
    this.listFile = this.mapDynamicFiles();
    this.setSendMessageText(SendTenantBondLodgementTextStatus.NO_FORM_ATTACH);
    this.handlePopupState({ attachEntryNote: false, isTrudiSendMessage: true });
    this.openSendMsgModal();
    this.resetData();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  setSendMessageText(textStatus: SendTenantBondLodgementTextStatus) {
    this.trudiDynamicParameterService.setDynamicParametersKey({
      $bond_amount_due: formatCurrency(this.bondAmount)
    });
    this.trudiDynamicParameterService.setDynamicParametersKey({
      bond_form_name: this.reiFormBadge
    });

    switch (textStatus) {
      case SendTenantBondLodgementTextStatus.NO_FORM_ATTACH:
      case SendTenantBondLodgementTextStatus.SENT_AS_ATTACHMENT:
        this.sendMessageConfigs[
          'body.tinyEditor.attachBtn.attachOptions.disabledUpload'
        ] = false;
        break;
      case SendTenantBondLodgementTextStatus.FORM_SENT_VIA_DOCUSIGN:
        this.sendMessageConfigs[
          'body.tinyEditor.attachBtn.attachOptions.disabledUpload'
        ] = true;
        break;
      default:
        break;
    }
  }

  getSelectedFile(event) {
    if (!event) return;
    this.isNextFromAttachEntryNote = false;
    for (let i = 0; i < event.length; i++) {
      this.listFileUpload = [
        {
          ...this.listFileUpload,
          title: '',
          listFile: event
        }
      ];
    }
    this.filesService.originalLocalFiles.next([...event]);
    this.handlePopupState({ attachEntryNote: false, uploadAttachments: true });
  }

  onNextToSelectREIForm() {
    this.isNextFromAttachEntryNote = false;
    this.handlePopupState({ attachEntryNote: false, selectREIDocument: true });
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  onBackAttachEntryNote() {
    this.handlePopupState({ attachEntryNote: false, bondLodgement: true });
  }

  getSelectedREIDocument(event) {
    if (event) {
      this.reiFormLink = event;
      this.isHideReviewAttachmentBottomWrapper = false;
      this.handlePopupState({
        reviewREIDocument: true,
        selectREIDocument: false
      });
    }
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  onConfirmFromReviewAttachment(reiFormData: ReiFormData) {
    this.reiFormData = reiFormData;

    switch (reiFormData.formDetail.status) {
      case REIFormDocumentStatus.DRAFT:
      case REIFormDocumentStatus.FINALIZED:
        this.setSendMessageText(
          SendTenantBondLodgementTextStatus.SENT_AS_ATTACHMENT
        );
        break;
      case REIFormDocumentStatus.SIGNED:
      case REIFormDocumentStatus.SIGNING:
        this.setSendMessageText(
          SendTenantBondLodgementTextStatus.FORM_SENT_VIA_DOCUSIGN
        );
        break;
      default:
        break;
    }

    const { fileSize, fileName, contentType } = reiFormData.formFileInfo;

    if (!reiFormData.formDetail.isSigned) {
      this.listFile = [
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
      this.trudiDynamicParameterService.setDynamicParametersKey({
        bond_form_name: this.reiFormBadge
      });
    }
    this.handlePopupState({
      reviewREIDocument: false,
      attachDraftForm: false,
      isTrudiSendMessage: true
    });
    this.openSendMsgModal();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  openSendMsgModal() {
    this.prefillConfig({
      listOfFiles: this.listFile,
      rawMsg: this.textForwardMessg,
      reiFormData: this.reiFormData
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
            this.resetPopupState();
            break;
        }
      });
  }

  handleBackUploadAttachments() {
    this.resetData();
    this.handlePopupState({ attachEntryNote: true, uploadAttachments: false });
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  handleSubmitFile() {
    this.setSendMessageText(
      SendTenantBondLodgementTextStatus.SENT_AS_ATTACHMENT
    );
    this.listFile = this.filesService.mapFilesUpload(
      this.listFileUpload.flatMap((item) => item.listFile)
    );
    const dynamicFiles = this.mapDynamicFiles();
    this.listFile = [...this.listFile, ...dynamicFiles];
    if (this.listFile.length > 0) {
      this.trudiDynamicParameterService.setDynamicParametersKey({
        bond_form_name: this.reiFormBadge
      });
    }

    this.handlePopupState({
      uploadAttachments: false,
      isTrudiSendMessage: true
    });
    this.openSendMsgModal();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  onBackSendMsg(): void {
    if (this.isNextFromAttachEntryNote) {
      this.isNextFromAttachEntryNote = false;
      this.handlePopupState({
        attachEntryNote: true,
        isTrudiSendMessage: false
      });
    } else if (this.reiFormData && Object.keys(this.reiFormData)?.length) {
      this.reiFormData = {};
      this.isHideReviewAttachmentBottomWrapper = false;
      this.handlePopupState({
        reviewREIDocument: true,
        isTrudiSendMessage: false
      });
    } else {
      this.handlePopupState({
        uploadAttachments: true,
        isTrudiSendMessage: false
      });
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

  override resetPopupState() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.bondAmount = '';
    this.isProcessing = false;
    super.resetPopupState();
  }
}
