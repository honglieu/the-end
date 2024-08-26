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
import { LeasingService } from '@services/leasing.service ';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { ACCEPT_ONLY_SUPPORTED_FILE } from '@services/constants';
import {
  ReiFormData,
  ReiFormLink,
  REIFormState
} from '@shared/types/rei-form.interface';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import dayjs from 'dayjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { CompanyService } from '@services/company.service';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'entry-report-deadline',
  templateUrl: './entry-report-deadline.component.html',
  styleUrls: ['./entry-report-deadline.component.scss']
})
export class EntryReportDeadlineComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  override textForwardMessg: string;
  public isProcessing: boolean;
  public popupModalPosition = ModalPopupPosition;
  public returnDueDate: string;
  public isNextFromSkipAttachDocument: boolean = false;
  public ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;
  public isNextFromAttachEntryNote: boolean = false;
  public listFileUpload = [{ title: '', listFile: [] }];
  public reiFormLink: ReiFormLink;
  public reiFormData: ReiFormData = {};
  public reiFormState: REIFormState = {
    documentStatus: false,
    formName: true
  };
  public isHideReviewAttachmentBottomWrapper: boolean = false;
  public listFile = [];
  public modelEntryTitle: string = '';
  public modelAttachmentTitle: string = '';
  public entryRequired: boolean = false;
  public fileRequired: boolean = false;
  public reiFormBadge: string;
  public isShowUploadReiFormBox: boolean = true;
  public buttonKey = EButtonStepKey.ENTRY_REPORT_DEADLINE;
  public modalId = StepKey.communicationStep.entryReportDeadline;

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
    private agencyDateFormatService: AgencyDateFormatService,
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

  ngOnChanges(changes: SimpleChanges) {
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
    this.modelEntryTitle = customControl['preScreen']['title'];
    this.modelAttachmentTitle = `Please attach: ${
      customControl['attachment']['title']
    } ${isRequiredAttachment ? '(Required)' : '(Optional)'}`;
    if (!!customControl['preScreen']['preScreenIsRequired']) {
      this.entryRequired = true;
    }
    if (!!customControl['attachment']['attachmentIsRequired']) {
      this.fileRequired = true;
    }
    this.trudiDynamicParameterService.setDynamicParametersKey({
      report_form_name: this.reiFormBadge
    });
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.handlePopupState({ returnFormDate: false });
      this.resetPopup();
      this.enableProcess();
    }
  }

  enableProcess() {
    this.isProcessing = true;
    this.modelData = this.model;
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    this.trudiDynamicParameterService.setDynamicParametersKey({
      report_form_name: this.reiFormBadge
    });
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.returnFormDate);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ returnFormDate: true });
    this.prefillVariablesMsg();
  }

  saveReturnDueDate(value: string) {
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.getValue();
    this.returnDueDate = value;
    this.trudiDynamicParameterService.setDynamicParametersKey({
      report_deadline: this.returnDueDate
        ? dayjs(this.returnDueDate).format(DATE_FORMAT_DAYJS)
        : null
    });
    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        entryReportDeadline: {
          entryDeadlineDate: this.returnDueDate
        }
      }
    };
    this.handlePopupState({ returnFormDate: false, attachEntryNote: true });
  }

  endProcessing() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.isProcessing = false;
    this.resetPopup();
  }

  resetPopup() {
    for (const key in this.popupState) {
      if (Object.prototype.hasOwnProperty.call(this.popupState, key)) {
        this.popupState[key] = false;
      }
    }
    this.resetData();
    this.returnDueDate = '';
  }

  handleNextAttachNote(event) {
    if (event) {
      this.isNextFromSkipAttachDocument = true;
      this.handlePopupState({
        attachEntryNote: false,
        isTrudiSendMessage: true
      });
      this.listFile = this.mapDynamicFiles();
      this.openSendMsgModal();
    } else {
      this.isNextFromSkipAttachDocument = false;
    }
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
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
  }

  onConfirmFromReviewAttachment(reiFormData: ReiFormData) {
    const formFileAttachment = reiFormData?.formDetail?.formFiles;
    const reiFormSigner = reiFormData?.formDetail?.signers;
    this.reiFormData = reiFormData;
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
        report_form_name: this.reiFormBadge
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

  handleBackUploadAttachments() {
    this.listFile = [];
    this.listFileUpload = [];
    this.resetData();
    this.handlePopupState({ attachEntryNote: true, uploadAttachments: false });
    this.PreventButtonService.setCurrentModalActive(this.buttonKey);
  }

  handleSubmitFile() {
    this.listFile = this.filesService.mapFilesUpload(
      this.listFileUpload.flatMap((item) => item.listFile)
    );
    const dynamicFiles = this.mapDynamicFiles();
    this.listFile = [...this.listFile, ...dynamicFiles];
    if (this.listFile.length > 0) {
      this.trudiDynamicParameterService.setDynamicParametersKey({
        report_form_name: this.reiFormBadge
      });
    }
    this.handlePopupState({
      uploadAttachments: false,
      isTrudiSendMessage: true
    });
    this.openSendMsgModal();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  openSendMsgModal() {
    this.prefillConfig({
      listOfFiles: this.listFile,
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
            this.PreventButtonService.deleteProcess(
              this.buttonKey,
              EButtonType.STEP
            );
            this.onSendMsg(rs.data);
            break;
          case ESendMessageModalOutput.Quit:
            this.resetPopupState();
            break;
        }
      });
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
    } else if (this.listFileUpload[0]?.listFile?.length >= 1) {
      this.handlePopupState({
        uploadAttachments: true,
        isTrudiSendMessage: false
      });
    } else {
      this.handlePopupState({
        attachEntryNote: true,
        isTrudiSendMessage: false
      });
    }
  }

  prefillVariablesMsg() {
    this.textForwardMessg = this.model.fields.msgBody;
  }

  override resetPopupState() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.returnDueDate = null;
    this.isProcessing = false;
    super.resetPopupState();
  }
}
