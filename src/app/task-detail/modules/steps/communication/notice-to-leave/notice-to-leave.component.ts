import { Component, OnChanges, SimpleChanges } from '@angular/core';
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
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { EPopupType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ILeaveNoticeDetail } from '@/app/tenant-vacate/utils/tenantVacateType';
import dayjs from 'dayjs';
import { ACCEPT_ONLY_SUPPORTED_FILE } from '@services/constants';
import {
  REIFormState,
  ReiFormData,
  ReiFormLink
} from '@shared/types/rei-form.interface';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { LeasingService } from '@services/leasing.service ';
import { TenantVacateFormService } from '@/app/tenant-vacate/services/tenant-vacate-form.service';
import { takeUntil } from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { CompanyService } from '@services/company.service';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'notice-to-leave',
  templateUrl: './notice-to-leave.component.html',
  styleUrls: ['./notice-to-leave.component.scss']
})
export class NoticeToLeaveComponent
  extends StepBaseComponent
  implements OnChanges
{
  override textForwardMessg: string;
  public modelNoticeTitle: string = '';
  public modelAttachmentTitle: string = '';
  public noticeRequired: boolean = false;
  public fileRequired: boolean = false;
  public leaveNoticeReason: string;
  public noticeToLeaveDate: string;
  public ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;
  public reiFormLink: ReiFormLink;
  public isHideReviewAttachmentBottomWrapper: boolean;
  public reiFormData: ReiFormData = {};
  public listFile = [];
  public reiFormState: REIFormState = {
    documentStatus: false,
    formName: true
  };
  public isNextFromSkipAttachDocument: boolean = false;
  public isNextFromAttachNoticeLeave: boolean = false;
  public listFileUpload = [{ title: '', listFile: [] }];
  public isProcessing: boolean;
  public reiFormBadge: string;
  public isShowUploadReiFormBox: boolean = true;
  public buttonKey = EButtonStepKey.NOTICE_TO_LEAVE;
  public modalId = StepKey.communicationStep.noticeToLeave;

  get leaveNoticeDetailForm() {
    return this.tenantVacateFormService?.noticeDetailForm;
  }

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
    public tenantVacateFormService: TenantVacateFormService,
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

  get trudiData() {
    return this.trudiService.getTrudiResponse.value?.data?.[0];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['model']?.currentValue) {
      const { preScreenIsRequired, title } =
        this.model?.fields.customControl['preScreen'];
      this.noticeRequired = preScreenIsRequired;
      this.modelNoticeTitle = title;
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

  checkRequired(isRequired: boolean) {
    return isRequired ? '(Required)' : '(Optional)';
  }

  private parseModel(model?: TrudiStep): void {
    const { title, attachmentIsRequired } =
      this.model.fields.customControl['attachment'];
    this.fileRequired = attachmentIsRequired;
    this.reiFormBadge = title;
    this.modelAttachmentTitle = `Please attach: ${
      this.reiFormBadge
    } ${this.checkRequired(this.fileRequired)}`;
    this.trudiDynamicParameterService.setDynamicParametersKey({
      notice_form_name: this.reiFormBadge
    });
  }

  onBack() {
    if (this.prevPopupKey === EPopupType.confirmEssential) {
      this.resetPopupState();
      this.enableProcess();
    }
  }

  enableProcess() {
    this.isProcessing = true;
    this.modelData = this.model;
    this.trudiDynamicParameterService.setDynamicParametersKey({
      notice_form_name: this.reiFormBadge
    });
    this.trudiDynamicParameterService.setTemplate(this.model?.fields?.msgBody);
    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.isShowLeaveNoticeDetail);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ isShowLeaveNoticeDetail: true });
    this.prefillVariablesMsg();
  }

  onNextLeaveNotice(data: ILeaveNoticeDetail) {
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.getValue();
    this.leaveNoticeReason = data?.notice;
    this.noticeToLeaveDate = data?.beforeDate;
    this.trudiDynamicParameterService.setDynamicParametersKey({
      notice_to_leave_date: this.noticeToLeaveDate
        ? dayjs(this.noticeToLeaveDate).format(DATE_FORMAT_DAYJS)
        : null
    });
    this.trudiDynamicParameterService.setDynamicParametersKey({
      reason_for_notice: this.leaveNoticeReason
    });
    this.trudiDynamicParameterService.setDynamicParametersKey({
      today_date: this.agencyDateFormatService.formatTimezoneDate(
        new Date(),
        DATE_FORMAT_DAYJS
      )
    });
    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        leaveNotice: {
          notice: this.leaveNoticeReason,
          beforeDate: this.noticeToLeaveDate
        }
      }
    };
    this.handlePopupState({
      attachEntryNote: true,
      isShowLeaveNoticeDetail: false
    });
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
        notice_form_name: this.reiFormBadge
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
        notice_form_name: this.reiFormBadge
      });
    }
    this.handlePopupState({
      uploadAttachments: false,
      isTrudiSendMessage: true
    });
    this.openSendMsgModal();
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        if (event.isDraft) {
          this.resetPopupState();
          return;
        }
        this.complete(event);
        this.handleSendMsgToast(event);
        this.saveDataNoticeToLeave();
        this.resetPopupState();
        break;
      default:
        break;
    }
  }

  onNextToSelectREIForm() {
    this.isNextFromAttachNoticeLeave = false;
    this.handlePopupState({ attachEntryNote: false, selectREIDocument: true });
  }

  onNextAttachEntryNote(event) {
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

  onBackSendMsg(): void {
    if (this.isNextFromAttachNoticeLeave) {
      this.isNextFromAttachNoticeLeave = false;
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

  getSelectedFile(event) {
    if (!event) return;
    this.isNextFromAttachNoticeLeave = false;
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

  onCloseNoticePopup() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.isProcessing = false;
    this.resetPopupState();
  }

  handleSaveReiForm(reiFormData: ReiFormData) {
    const taskId = this.taskService.currentTask$.getValue()?.id;
    const action = this.model.action;
    return this.leasingService.updateLeasingReiFormInfor(
      taskId,
      action,
      reiFormData,
      this.modelData?.['leasingStepIndex']
    );
  }

  prefillVariablesMsg() {
    this.textForwardMessg = this.model.fields.msgBody;
  }

  override resetPopupState() {
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    this.isProcessing = false;
    this.leaveNoticeDetailForm.reset();
    super.resetPopupState();
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

  saveDataNoticeToLeave() {
    const taskId = this.taskService.currentTask$.value.id;
    this.stepService
      .saveTrudiResponseData(null, this.leaveNoticeDetailForm.value, taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {});
  }
}
