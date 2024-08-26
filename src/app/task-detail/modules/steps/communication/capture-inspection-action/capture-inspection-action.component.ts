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
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { of, switchMap, takeUntil } from 'rxjs';
import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { CompanyService } from '@services/company.service';
import { ESendMessageModalOutput } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { PreventButtonService } from '@trudi-ui';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

interface IInspectionNotesData {
  owner_notes?: string;
  owner_followup_items?: string;
  tenant_notes?: string;
  tenant_actions?: string;
}

enum ETopicName {
  VACATES = 'Vacates',
  INSPECTIONS = 'Inspections',
  TENANT_NOTICES = 'Tenant Notices'
}

@Component({
  selector: 'capture-inspection-action',
  templateUrl: './capture-inspection-action.component.html',
  styleUrls: ['./capture-inspection-action.component.scss']
})
export class CaptureInspectionActionComponent
  extends StepBaseComponent
  implements OnInit, OnChanges
{
  public inspectionActionForm: FormGroup;
  public inspectionActionPopupTitle = '';
  public preScreenIsRequired;
  public attachmentIsRequired: boolean;
  public inspectionNotes: IInspectionNotesData = {
    tenant_actions: '',
    tenant_notes: '',
    owner_followup_items: '',
    owner_notes: ''
  };
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
  public buttonKey = EButtonStepKey.CAPTURE_INSPECTION_ACTION;
  public modalId = StepKey.communicationStep.captureInspectionAction;
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
    private fb: FormBuilder,
    private widgetPTService: WidgetPTService,
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
    this.getInspectionActionNotes();
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
      this.inspectionActionPopupTitle = title;
      this.setDocumentStatus();
      this.sendMessageConfigs = {
        ...this.sendMessageConfigs,
        trudiButton: this.model,
        'body.prefillTitle': msgTitle,
        'body.prefillReceivers': true,
        'footer.buttons.showBackBtn': true
      };
      this.getCustomControlAttachment();
      this.listOfFiles = this.mapDynamicFiles();
    }
  }

  getInspectionActionNotes() {
    this.agencyService.topicList$
      .pipe(
        switchMap((res) => {
          if (!res) return of();

          let ptWidgetField: PTWidgetDataField = null;
          const topic = res?.taskTopics?.find((topic) =>
            topic.topicTaskNames.some(
              (task) =>
                task.taskNameId ===
                this.taskService.currentTask$.value.taskName.id
            )
          );

          switch (topic?.name) {
            case ETopicName.INSPECTIONS:
              ptWidgetField = PTWidgetDataField.ROUTINE_INSPECTION;
              break;
            case ETopicName.VACATES:
              ptWidgetField = PTWidgetDataField.OUTGOING_INSPECTION;
              break;
            case ETopicName.TENANT_NOTICES:
              ptWidgetField = PTWidgetDataField.INGOING_INSPECTION;
              break;
          }

          return this.widgetPTService.getPTWidgetStateByType<
            InspectionSyncData[]
          >(ptWidgetField);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (!res?.length) return;
        const inspectionSyncData: InspectionSyncData = res.filter(
          (data) => data.syncStatus !== ESyncStatus.FAILED
        )?.[0];
        this.inspectionNotes = {
          ...this.inspectionNotes,
          ...(inspectionSyncData?.notes || {})
        };
      });
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

    const { owner_followup_items, owner_notes, tenant_notes, tenant_actions } =
      this.inspectionNotes;

    this.inspectionActionForm = this.fb.group({
      tenantNote: new FormControl(tenant_notes, validatorForm),
      tenantAction: new FormControl(tenant_actions, validatorForm),
      ownerNote: new FormControl(owner_notes, validatorForm),
      ownerFollowUp: new FormControl(owner_followup_items, validatorForm)
    });

    if (
      this.stepService.hasEssentialParams(this.isEnableSettingAI, {
        buttonKey: this.buttonKey
      })
    ) {
      this.subscribeConfirmEssential(EPopupType.isInspectionAction);
      this.prevPopupKey = EPopupType.confirmEssential;
      return;
    }
    this.handlePopupState({ isInspectionAction: true });
    this.prefillVariables();
  }

  handleNextInspectionAction() {
    this.sendMessageConfigs['body.taskData'] = {
      ...(this.sendMessageConfigs['body.taskData'] || {}),
      advanceData: {
        captureInspectionAction: {
          tenantNote: this.tenantNote || '',
          tenantAction: this.tenantAction || '',
          ownerNote: this.ownerNote || '',
          ownerFollowUp: this.ownerFollowUp || ''
        }
      }
    };
    this.handlePopupState({ attachEntryNote: true, isInspectionAction: false });
  }

  get tenantNote() {
    return this.inspectionActionForm.get('tenantNote').value;
  }

  get tenantAction() {
    return this.inspectionActionForm.get('tenantAction').value;
  }

  get ownerNote() {
    return this.inspectionActionForm.get('ownerNote').value;
  }

  get ownerFollowUp() {
    return this.inspectionActionForm.get('ownerFollowUp').value;
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
    this.prefillVariables();
    this.trudiDynamicParameterService.setDynamicParametersKey({
      inspection_form_name: this.reiFormBadge
    });
    this.prefillDynamicParamInspectionAction();
    this.openSendMsgModal();
    this.resetPopupState();
    this.handlePopupState({ isTrudiSendMessage: true });
    this.PreventButtonService.deleteCurrentModalActive(this.buttonKey);
  }

  onBackAttachEntryNote() {
    this.handlePopupState({ attachEntryNote: false, isInspectionAction: true });
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
        inspection_form_name: this.reiFormBadge
      });
      this.prefillDynamicParamInspectionAction();
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

  prefillDynamicParamInspectionAction() {
    this.trudiDynamicParameterService.setDynamicParametersKey({
      tenant_notes: this.tenantNote || '',
      tenant_actions: this.tenantAction || '',
      owner_notes: this.ownerNote || '',
      follow_up_items: this.ownerFollowUp || ''
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

    this.prefillDynamicParamInspectionAction();

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
      inspection_form_name: this.reiFormBadge
    });
    this.prefillDynamicParamInspectionAction();
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
    this.resetPopupState();
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }
}
