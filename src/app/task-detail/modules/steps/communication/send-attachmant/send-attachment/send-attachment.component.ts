import { Component, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import { ACCEPT_ONLY_SUPPORTED_FILE } from '@services/constants';
import {
  REIFormState,
  ReiFormData,
  ReiFormLink
} from '@shared/types/rei-form.interface';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { ToastrService } from 'ngx-toastr';
import { FilesService } from '@services/files.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import {
  ISendMsgTriggerEvent,
  ESentMsgEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ICustomControl } from '@/app/task-detail/modules/steps/utils/communicationType';
import { ChatGptService } from '@services/chatGpt.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { takeUntil } from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { PhotoType } from '@shared/types/task.interface';
import { CompanyService } from '@services/company.service';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'send-attachment',
  templateUrl: './send-attachment.component.html',
  styleUrls: ['./send-attachment.component.scss']
})
export class SendAttachmentComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
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
  public isRequired: boolean;
  public reiFormBadge: string;
  public isShowUploadReiFormBox: boolean = true;
  public prefillPhotoFiles: PhotoType[] = [];
  public buttonKey = EButtonStepKey.SEND_ATTACHMENT;
  public modalId = StepKey.communicationStep.sendAttachment;
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
      this.setDocumentStatus();
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        trudiButton: this.model,
        'body.prefillTitle': this.model.fields.msgTitle,
        'body.prefillReceivers': true,
        'footer.buttons.showBackBtn': true
      };
      this.listOfFiles = this.mapDynamicFiles();
      this.getCustomControlAttachment();
    }
  }

  getCustomControlAttachment() {
    const preScreenAttachment: ICustomControl = this.model.fields.customControl;
    this.reiFormBadge = preScreenAttachment.title;
    this.isRequired = preScreenAttachment.isRequired;
    this.titleAttachNote = `Please attach: ${
      preScreenAttachment.title
    } ${this.checkRequired(preScreenAttachment.isRequired)}`;
  }

  checkRequired(isRequired: boolean) {
    return isRequired ? '(Required)' : '(Optional)';
  }

  enableProcess() {
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.attachEntryNote);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ attachEntryNote: true });
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.onQuit();
      this.enableProcess();
    }
  }

  prefillVariables() {
    this.textForwardMessg = this.model.fields.msgBody;
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
    this.listOfFiles = this.mapDynamicFiles();
    this.isNextFromAttachEntryNote = true;
    this.prefillVariables();
    this.trudiDynamicParameterService.setDynamicParametersAttachment(
      this.model.fields.customControl.title
    );
    this.handlePopupState({
      attachEntryNote: false,
      isTrudiSendMessage: true
    });
    this.openSendMsgModal();
    this.resetData();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  getSelectedFile(event) {
    if (!event) return;
    this.prefillVariables();
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
    this.handlePopupState({ attachEntryNote: false, uploadAttachments: true });
  }

  onNextToSelectREIForm() {
    this.isNextFromAttachEntryNote = false;
    this.handlePopupState({ attachEntryNote: false, selectREIDocument: true });
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
      this.trudiDynamicParameterService.setDynamicParametersAttachment(
        this.model.fields.customControl.title
      );
      this.handlePopupState({
        reviewREIDocument: true,
        selectREIDocument: false
      });
    }
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
    this.prefillVariables();
    this.handlePopupState({
      reviewREIDocument: false,
      attachDraftForm: false,
      isTrudiSendMessage: true
    });
    this.openSendMsgModal();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  handleSubmitFile() {
    this.listOfFiles = this.filesService.mapFilesUpload(
      this.selectedFiles.flatMap((item) => item.listFile)
    );
    const dynamicFiles = this.mapDynamicFiles();
    this.listOfFiles = [...this.listOfFiles, ...dynamicFiles];
    this.trudiDynamicParameterService.setDynamicParametersAttachment(
      this.model.fields.customControl.title
    );
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

  openSendMsgModal() {
    this.prefillConfig({
      listOfFiles: this.listOfFiles,
      rawMsg: this.textForwardMessg,
      prefillVariables: this.prefillVariable,
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
            this.onQuit();
            break;
        }
      });
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.onQuit();
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
