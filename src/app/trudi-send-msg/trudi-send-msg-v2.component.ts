import { convertUTCToLocalDateTime } from '@/app/core/time/timezone.helper';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  Subject,
  combineLatest,
  first,
  of,
  switchMap,
  takeUntil,
  firstValueFrom
} from 'rxjs';
import { BreachNoticeService } from '@/app/breach-notice/services/breach-notice.service';
import { BreachNoticeRequestButtonAction } from '@/app/breach-notice/utils/breach-notice.enum';
import {
  IConversationParticipant,
  ITasksForPrefillDynamicData
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  IListDynamic,
  PT_LIST_DYNAMIC_PARAMETERS,
  RM_LIST_DYNAMIC_PARAMETERS
} from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import { REGEX_PARAM_TASK_EDITOR } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import {
  ECRMState,
  ECalendarEvent,
  EDynamicType,
  EStepAction
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { ICommunicationStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  ActionSendMsgDropdown,
  ESendMsgAction,
  ISendMsgBody
} from '@/app/routine-inspection/utils/routineType';
import { ActionDefaultScheduleButton } from '@services/constants';
import {
  ConversationService,
  EReloadConversationSource
} from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { HeaderService } from '@services/header.service';
import { ReiFormService } from '@services/rei-form.service';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { SendMessageService } from '@services/send-message.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import {
  EPopupAction,
  NavigatePopUpsService,
  PopupQueue
} from '@/app/share-pop-up/services/navigate-pop-ups.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { EEventStatus } from '@shared/enum/calendar.enum';
import { CreditorInvoicingButtonAction } from '@shared/enum/creditor-invoicing.enum';
import { EMailBoxStatus, EMailBoxType } from '@shared/enum/inbox.enum';
import { RegionId } from '@shared/enum/region.enum';
import { RoutineInspectionButtonAction } from '@shared/enum/routine-inspection.enum';
import { TaskNameId, TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { IFile } from '@shared/types/file.interface';
import { ReiFormData } from '@shared/types/rei-form.interface';
import { CurrentUser, IMailBox } from '@shared/types/user.interface';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TenantVacateService } from '@/app/tenant-vacate/services/tenant-vacate.service';
import { ETenantVacateButtonAction } from '@/app/tenant-vacate/utils/tenantVacateType';
import {
  EDefaultBtnDropdownOptions,
  ITrudiScheduledMsgInfo
} from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import { TrudiScheduledMsgService } from './../trudi-scheduled-msg/services/trudi-scheduled-msg.service';
import { TrudiDynamicParameterService } from './services/trudi-dynamic-paramater.service';
import { TrudiSendMsgFormService } from './services/trudi-send-msg-form.service';
import {
  IGetDynamicFieldsDataMessageScratchPayload,
  TrudiSendMsgUserService
} from './services/trudi-send-msg-user.service';
import { TrudiSendMsgService } from './services/trudi-send-msg.service';
import { EFallback } from './utils/dynamic-parameter';
import {
  getCalendarEventData,
  getCalendarEventFromSelectedTasks,
  getListSenderMailBox,
  getUniqReceiverData,
  getUserFromParticipants,
  roundToNearestInterval,
  updateConfigs
} from './utils/helper-functions';
import { defaultConfigs, popupQueue } from './utils/trudi-send-msg-config';
import { ECreateMessageFrom } from './utils/trudi-send-msg.enum';
import {
  EFooterButtonType,
  ESentMsgEvent,
  ETrudiSendMsgBtn,
  IContactInfo,
  IDefaultValueTrudiSendMsg,
  IFromUserMailBox,
  ISelectedReceivers,
  ISendManyMsgPayload,
  ISendMsgConfigs,
  ISendMsgPayload,
  ISendMsgResponseV2,
  ISendMsgTriggerEvent,
  ISendMsgType
} from './utils/trudi-send-msg.interface';
import { isArray } from 'lodash-es';
import { convertTime12to24 } from '@/app/leasing/utils/functions';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { PropertiesService } from '@services/properties.service';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { CompanyService } from '@services/company.service';
import { DRAFT_SAVED } from '@services/messages.constants';
import { SocketType } from '@shared/enum';

@Component({
  selector: 'trudi-send-msg-v2',
  templateUrl: './trudi-send-msg-v2.component.html',
  styleUrls: ['./trudi-send-msg-v2.component.scss'],
  providers: [TrudiSendMsgUserService]
})
export class TrudiSendMsgV2Component implements OnInit, OnChanges, OnDestroy {
  constructor(
    private trudiSendMsgService: TrudiSendMsgService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiScheduledMsgService: TrudiScheduledMsgService,
    private navigatePopupService: NavigatePopUpsService,
    public conversationService: ConversationService,
    public taskService: TaskService,
    public tenancyInvoicingService: TenancyInvoicingService,
    private agencyService: AgencyService,
    private userService: UserService,
    private sendMessageService: SendMessageService,
    private routineInspectionService: RoutineInspectionService,
    private headerService: HeaderService,
    private reiFormService: ReiFormService,
    private breachNoticeService: BreachNoticeService,
    private filesService: FilesService,
    private widgetPTService: WidgetPTService,
    private trudiService: TrudiService,
    private tenantVacateService: TenantVacateService,
    public inboxService: InboxService,
    private sharedService: SharedService,
    private inboxSidebarService: InboxSidebarService,
    private agencyDateFormatService: AgencyDateFormatService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    public stepService: StepService,
    public uploadFromCRMService: UploadFromCRMService,
    public trudiDynamicParameterService: TrudiDynamicParameterService,
    private toastService: ToastrService,
    private trudiSendMsgUserService: TrudiSendMsgUserService,
    public cdr: ChangeDetectorRef,
    private propertyService: PropertiesService,
    private mailboxSettingService: MailboxSettingService,
    private toastCustomService: ToastCustomService,
    private companyService: CompanyService
  ) {}
  @ViewChild('dropdown') dropdown: ElementRef;
  @ViewChild('footerTemplate') footerTemplate: ElementRef;
  @Input() configs: ISendMsgConfigs = cloneDeep(defaultConfigs);
  @Input() rawMsg: string = ''; //configs
  @Input() listOfFiles: IFile[] = []; //configs
  @Input() listContactCard: ISelectedReceivers[] = []; //configs
  @Input() prefillVariables: Record<string, string> = {}; //configs
  @Input() reiformData: ReiFormData; //configs
  //to do
  @Input() openFrom: EUserPropertyType = null; //configs
  @Input() defaultBtnOption: EDefaultBtnDropdownOptions; //configs
  //to do
  @Input() typeMessage: string; //configs
  @Input() listDynamicFieldData: string[] = []; //configs
  @Input() selectedTasks: ITasksForPrefillDynamicData[] = []; //configs
  @Input() prefillData: ICommunicationStep; //configs
  @Input() mailBoxIdFromCalender: string = ''; //configs
  @Input() listUser: ISelectedReceivers[] = []; //?
  @Input() isAppUser: boolean = false; //should remove
  @Input() isSyncedAttachment: boolean = true; // ?
  @Input() threadId: string = null; //config
  @Input() attachmentSync = {}; //config
  @Input() expandable: boolean = true; //config
  @Input() isInternalNote: boolean = false; //config
  @Input() appendBody: boolean = false; //config
  @Output() onBack = new EventEmitter();
  @Output() onQuit = new EventEmitter();
  @Output() onSendMsg = new EventEmitter<ISendMsgTriggerEvent>();
  @Output() onNextDropdown = new EventEmitter();
  @Output() onSendScheduleVacate = new EventEmitter();
  public listSenderMailBox: IFromUserMailBox[] = [];
  public isConsole: boolean;
  public selectTimeSchedule: string;
  public currentBody: ISendMsgBody;
  popupQueue: PopupQueue = popupQueue;
  isSendingMsg: boolean = false;
  isPortalUser: boolean = false;
  public defaultOptionDropdown: number = 0;
  public selectedScheduledMsg: ITrudiScheduledMsgInfo;
  public template: string = '';
  public scheduleDate: string;
  public vacateDate: string;
  public additionalInfo: string;
  public isDateUnknown: boolean = false;
  public dueDateTooltipText: string;
  public currentMailBoxId: string;
  public listMailBoxs: IMailBox[] = [];
  public currentMailBox: IMailBox;
  public hasAddAccount: boolean = false;
  public syncMailBoxStatus: EMailBoxStatus;
  readonly EMailBoxStatus = EMailBoxStatus;
  readonly mailBoxType = EMailBoxType;
  // enum
  ModalPopupPosition = ModalPopupPosition;
  EFooterButtonType = EFooterButtonType;
  ETrudiSendMsgBtn = ETrudiSendMsgBtn;
  EUserPropertyType = EUserPropertyType;
  private unsubscribe = new Subject<void>();
  attachmentTextEditorConfigs = {
    'header.title': 'Add contact card'
  };
  isDisableSendBtn: boolean = false;
  public isShowMissingDataModal: boolean = false;
  public invalidParamsMap: Record<string, Array<ISelectedReceivers>>;
  public listDynamicParams: IListDynamic[] = [];
  public selectedTaskIds: string[] = [];
  public isAllowKeepGoingToSendMessage: boolean = false;
  public currentAction = {} as ActionSendMsgDropdown;
  public listParamData = [];
  public listProperties: UserPropertyInPeople[] = [];
  public isFullScreenModal: boolean = false;
  public currentUser: CurrentUser;
  public isRmEnvironment: boolean = false;
  public ECreateMessageFrom = ECreateMessageFrom;
  public isValidMsg: boolean = false;
  public currentPropertyId: string = '';
  public toolbarTinyTemplate;
  public toolbarTinyContext;
  public shouldInitSelectRecipientsModal: boolean = false;

  public isShowConfirmDraft: boolean = false;
  // getter
  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get sendOption(): AbstractControl {
    return this.sendMsgForm?.get('sendOption');
  }

  get selectedReceivers(): AbstractControl {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  get uploadFileFromCRMPopupState() {
    return this.uploadFromCRMService.getPopupState();
  }

  get selectedFilesFromCMS() {
    return this.uploadFromCRMService.getSelectedFiles();
  }

  get listOfFilesControl(): AbstractControl {
    return this.sendMsgForm?.get('listOfFiles');
  }

  get property(): AbstractControl {
    return this.sendMsgForm?.get('property');
  }

  get ccReceivers(): AbstractControl {
    return this.sendMsgForm?.get('ccReceivers');
  }

  get bccReceivers(): AbstractControl {
    return this.sendMsgForm?.get('bccReceivers');
  }

  get msgTitle(): AbstractControl {
    return this.sendMsgForm?.get('msgTitle');
  }

  get selectedContactCardControl() {
    return this.sendMsgForm?.get('selectedContactCard');
  }

  get isDisableNextBtn() {
    return (
      !this.trudiSendMsgFormService.isFilesValidate ||
      this.isSendingMsg ||
      !this.isPortalUser
    );
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  get contactCardPopupState() {
    return this.trudiAddContactCardService.getPopupState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configs']) {
      this.configs = updateConfigs(cloneDeep(defaultConfigs), this.configs);
      this.trudiSendMsgService.configs.value = this.configs;
      this.isDisableSendBtn = this.configs?.footer?.buttons?.disableSendBtn;
      this.trudiSendMsgFormService.setSignatureContentMsgValidate(
        this.configs.otherConfigs.isValidSigContentMsg
      );
    }
    if (changes['selectedTasks']?.currentValue) {
      this.selectedTaskIds = this.selectedTasks?.map((item) => item.taskId);
    }
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.checkDisableBtnNext();
    this.selectedTaskIds = this.selectedTasks?.map((item) => item.taskId);

    combineLatest([
      this.inboxService.listMailBoxs$,
      this.inboxService.getCurrentMailBoxId(),
      this.userService.userInfo$
    ]).subscribe(([listMailBoxs, mailboxId, userInfo]) => {
      if (mailboxId) {
        this.currentMailBoxId = this.mailBoxIdFromCalender
          ? this.mailBoxIdFromCalender
          : localStorage.getItem('mailBoxId') || mailboxId;
      }
      if (listMailBoxs?.length && userInfo) {
        this.listMailBoxs = listMailBoxs.filter(
          (item) =>
            item.status !== EMailBoxStatus.ARCHIVE &&
            item.status !== EMailBoxStatus.DISCONNECT
        );
        if (!this.listMailBoxs?.length) return;
        this.currentMailBox =
          this.listMailBoxs.find(
            (mailBox) => mailBox.id === this.currentMailBoxId
          ) || this.listMailBoxs[0];
        this.inboxService.setCurrentMailboxIdToResolveMsg(
          this.listMailBoxs[0]?.['id']
        );

        this.currentMailBoxId = this.currentMailBox.id;
        if (this.configs.otherConfigs.filterSenderForReply) {
          this.listMailBoxs = [this.currentMailBox];
        } else {
          this.listMailBoxs = [
            this.currentMailBox,
            ...this.listMailBoxs.filter((e) => e.id !== this.currentMailBox.id)
          ];
        }
        this.listSenderMailBox = getListSenderMailBox(
          this.configs,
          userInfo,
          this.listMailBoxs,
          this.currentMailBoxId
        );
      }
    });

    this.userService
      .checkIsPortalUser()
      .then((isPortalUser) => (this.isPortalUser = isPortalUser));

    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.currentUser = rs;
      });

    this.changePopupState(EPopupAction.INIT);

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        if (value) {
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(value);
        }
      });

    this.getProperties();
    this.initForm();
    this.handleSetDefaultPopupState();
    this.handleChangeDefaultDropdownButton();
    this.handlePrefillFiles();
    this.getDataByCRM();
  }

  handleSetDefaultPopupState() {
    this.shouldInitSelectRecipientsModal =
      this.configs.footer.buttons.sendType !== ISendMsgType.EXTERNAL &&
      (this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.MULTI_TASKS ||
        this.configs.otherConfigs.createMessageFrom ===
          ECreateMessageFrom.CONTACT ||
        this.configs.otherConfigs.createMessageFrom ===
          ECreateMessageFrom.TASK_STEP);
    const canOpenSelectRecipientsModal =
      this.configs.footer.buttons.sendType !== ISendMsgType.EXTERNAL &&
      this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.MULTI_TASKS;
    if (canOpenSelectRecipientsModal) {
      this.trudiSendMsgService.setPopupState({
        sendMessage: false,
        selectRecipients: true
      });
    } else {
      this.trudiSendMsgService.setPopupState({
        sendMessage: true
      });
    }
  }

  setTemplateContext(template, context) {
    this.toolbarTinyTemplate = template;
    this.toolbarTinyContext = context;
  }

  // Init functions
  initForm() {
    this.trudiSendMsgFormService.buildFormV2(this.formDefaultValue);
    if (!!this.configs.body.defaultSendOption) {
      this.sendOption.setValue(this.configs.body.defaultSendOption);
    }
    if (this.listOfFiles) {
      this.listOfFilesControl.setValue(this.listOfFiles);
    }

    if (this.configs.otherConfigs.disabledTitle) {
      this.msgTitle.disable();
    }

    // Title will be prefilled with message title in case of sending bulk from message index
    if (
      this.configs.otherConfigs.createMessageFrom ===
      ECreateMessageFrom.MULTI_MESSAGES
    ) {
      this.msgTitle.disable();
      this.msgTitle.setValidators([]); // Temporarily remove validation, title will be filled when mapping payload
      this.trudiSendMsgService.setHiddenTextFieldTitle(true);
      this.trudiSendMsgService.setViewRecipientList(this.listUser);
    }
  }

  get formDefaultValue(): IDefaultValueTrudiSendMsg {
    return {
      selectedSender:
        this.listSenderMailBox.find(
          (sender) => sender.id === this.configs.body.prefillSender
        ) ||
        this.listSenderMailBox.find(
          (sender) =>
            sender.id === this.currentUser.id &&
            sender.mailBoxId === this.currentMailBoxId
        ),
      ccReceivers: [],
      bccReceivers: [],
      msgTitle: this.getPrefillMsgTitle(),
      selectedReceivers: [],
      listOfFiles: [],
      attachMediaFiles: [],
      isRequiredContactCard: this.configs.body.contactCard.required,
      emailSignature: this.configs.body.hasEmailSignature,
      externalSendTo: this.configs.body.prefillExternalSendTo,
      property: this.getDataPrefillProperty(),
      selectedContactCard: this.listContactCard ?? []
    };
  }

  getPrefillMsgTitle() {
    const prefillMsgTitle = this.configs?.body?.prefillTitle;
    const maxCharacter = this.configs?.body?.title?.maxCharacter;
    if (prefillMsgTitle?.length > maxCharacter) {
      return `${prefillMsgTitle.slice(0, maxCharacter - 3)}...`;
    } else {
      return prefillMsgTitle;
    }
  }

  getDataPrefillProperty() {
    if (this.configs.header.isPrefillProperty) {
      this.currentPropertyId =
        this.configs.otherConfigs.conversationPropertyId ||
        this.taskService.currentTask$?.value?.property.id;
      const matchedProperty =
        this.listProperties?.find(
          (item) => item.id === this.currentPropertyId
        ) ?? null;
      if (
        !!this.configs.otherConfigs?.conversationPropertyId &&
        this.configs.header.hideSelectProperty
      ) {
        this.configs.header.title =
          matchedProperty?.streetline || 'No property';
      }
      return matchedProperty;
    }
    return null;
  }

  getProperties() {
    this.propertyService.listPropertyAllStatus
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.listProperties = res;
      });
  }

  triggerExpandOrResizeModal() {
    this.isFullScreenModal = !this.isFullScreenModal;
  }

  setDefaultSender() {
    const selectedSender = this.listSenderMailBox.find(
      (sender) =>
        !!sender.mailBoxId &&
        sender.id === this.currentUser?.id &&
        sender.mailBoxId === this.currentMailBoxId
    );
    this.sendMsgForm?.get('selectedSender')?.setValue(selectedSender);
  }

  handlePrefillFiles() {
    this.stepService.listOfFileFromDynamic$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listFile) => {
        let isShowInspectionFiles =
          this.trudiDynamicParameterService.attachInspectionMedia(this.rawMsg);
        const fileOfInspection = listFile?.inspection;
        const fileOfTenant = listFile?.newTenant;
        if (isShowInspectionFiles && Boolean(fileOfInspection?.length)) {
          let inspectionImagesModified = fileOfInspection.map((res) => ({
            ...res,
            name: res.fileName
          }));
          this.listOfFiles = [...this.listOfFiles, ...inspectionImagesModified];
        }
        const isExistedDynamic =
          this.trudiDynamicParameterService.isExistedTenantFileDynamic(
            this.rawMsg
          );
        if (isExistedDynamic && Boolean(fileOfTenant?.length)) {
          this.listOfFiles = [...this.listOfFiles, ...fileOfTenant];
        }
      });
  }

  handleChangeDefaultDropdownButton() {
    if (this.defaultBtnOption) {
      this.defaultOptionDropdown = this.defaultBtnOption;
      return;
    }
    const isFromScheduleButton = ActionDefaultScheduleButton.includes(
      this.configs.trudiButton?.action
    );
    if (isFromScheduleButton) {
      this.defaultOptionDropdown = 0;
      this.configs.body.typeSendMsg = ESendMsgAction.Schedule;
      this.scheduleSpecialFlowDate();
      return;
    }
    this.defaultOptionDropdown = 2;
    this.configs.body.typeSendMsg = ESendMsgAction.Send;
  }

  getDateVacate() {
    this.trudiService.getTrudiResponse
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        const { decisionIndex, variable, region } = res.data[0] || {};
        const { vacateDate } =
          this.widgetPTService.tenantVacates.value[0] || {};
        const actionToCheck = this.tenantVacateService.checkSpecialRegion(
          region?.id as RegionId
        )
          ? ETenantVacateButtonAction.issueTenantVacateNotice
          : ETenantVacateButtonAction.issueTenantWrittenNotice;
        const noticeToLeaveDate = variable?.receivers?.find(
          (receiver) => receiver?.action === actionToCheck
        )?.noticeToLeaveDate;

        this.vacateDate = decisionIndex === 2 ? noticeToLeaveDate : vacateDate;
      });
  }

  // trigger buttons
  triggerNormalEvent(button: ETrudiSendMsgBtn) {
    if (this.isSendingMsg) return;
    switch (button) {
      case ETrudiSendMsgBtn.BACK:
        const canOpenSelectRecipientsModal =
          this.configs.footer.buttons.sendType !== ISendMsgType.EXTERNAL &&
          this.configs.otherConfigs.createMessageFrom ===
            ECreateMessageFrom.MULTI_TASKS;
        if (
          this.shouldInitSelectRecipientsModal &&
          canOpenSelectRecipientsModal
        ) {
          this.trudiSendMsgService.setPopupState({
            sendMessage: false,
            selectRecipients: true
          });
        } else {
          this.handleBack();
        }
        break;
      case ETrudiSendMsgBtn.NEXT:
        if (this.sendMsgForm.invalid) {
          this.sendMsgForm.markAllAsTouched();
          return;
        }
        this.handleSendMsg();
        this.trudiSendMsgFormService.setSelectedContactCard([]);
        break;
      default:
        break;
    }
  }

  onTriggerAddContactCard() {
    if (this.trudiAddContactCardService.getPopupState().addContactCard) {
      this.trudiAddContactCardService.setPopupState({
        addContactCard: false
      });
      this.trudiSendMsgService.setPopupState({
        sendMessage: true
      });
    }
  }

  onCloseUploadFromCRM() {
    this.uploadFromCRMService.setPopupState({
      uploadFileFromCRM: false
    });
    this.onCloseSendMsg();
  }

  onTriggerAddFilesFromCrm() {
    if (this.uploadFileFromCRMPopupState.uploadFileFromCRM) {
      this.uploadFromCRMService.setPopupState({
        uploadFileFromCRM: false
      });
      this.trudiSendMsgService.setPopupState({
        sendMessage: true
      });
      if (this.selectedFilesFromCMS)
        this.listOfFilesControl.setValue([
          ...this.listOfFilesControl.value,
          ...this.selectedFilesFromCMS
        ]);
    }
  }

  onCloseAddContactCard() {
    this.trudiAddContactCardService.setPopupState({
      addContactCard: false
    });
    this.onCloseSendMsg();
  }

  async triggerDropDownEvent(data: ActionSendMsgDropdown) {
    if (this.isSendingMsg) return;
    this.isSendingMsg = true;
    if (this.sendMsgForm.invalid && !data.isDraft) {
      this.sendMsgForm.markAllAsTouched();
      this.isSendingMsg = false;
      return;
    }
    // Check invalid dynamic param
    if (
      !this.isAllowKeepGoingToSendMessage &&
      this.configs.body.tinyEditor.isShowDynamicFieldFunction &&
      !data.isDraft
    ) {
      let isInvalidContent = await this.checkValidityDynamicParam(
        this.sendMsgForm.value.msgContent
      );
      this.currentAction = data;
      if (!isInvalidContent) {
        this.isSendingMsg = false;
        return;
      }
    }
    switch (data.action) {
      case ESendMsgAction.Send:
        this.handleSendMsg(data.isDraft);
        this.trudiSendMsgFormService.setSelectedContactCard([]);
        break;

      case ESendMsgAction.SendAndResolve:
        const conversation =
          this.conversationService.currentConversation?.value;
        const isOpenedFromConversation =
          this.configs?.body?.replyToMessageId?.length;
        if (isOpenedFromConversation && conversation?.scheduleMessageCount) {
          this.conversationService.isShowModalWarrningSchedule.next(true);
          this.onCloseSendMsg();
          return;
        }
        this.sendMsgForm.get('isResolveConversation').setValue(true);
        this.handleSendMsg();
        this.trudiSendMsgFormService.setSelectedContactCard([]);
        break;

      case ESendMsgAction.Schedule:
        const currentDate = dayjs(new Date());
        const selectedDate = dayjs(this.selectTimeSchedule);
        if (selectedDate.isBefore(currentDate)) {
          return;
        }
        if (this.configs.body.timeSchedule) {
          this.handleScheduleSendMessage();
        } else {
          this.trudiSendMsgService.setPopupState({
            sendMessage: false,
            selectTimeSchedule: true
          });
          this.isSendingMsg = false;
        }
        break;

      default:
        this.onNextDropdown.emit(this.sendMsgForm.value);
        break;
    }
  }

  handleBack() {
    this.onBack.emit();
    this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
  }

  getPropertyDataToPrefillDynamicParams(
    propertyId = null,
    userProperties = []
  ) {
    let { agencyId } = this.trudiSendMsgService.getIDsFromOtherService();
    let payload = {
      propertyId: propertyId,
      userProperties: userProperties
    } as IGetDynamicFieldsDataMessageScratchPayload;
    return this.trudiSendMsgUserService
      .getDynamicFieldsDataMessageScratchApi(payload)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((res) => {
          return of(res);
        })
      )
      .toPromise();
  }

  async handleScheduleSendMessage() {
    const calendarEvent = getCalendarEventFromSelectedTasks(this.selectedTasks);
    const receivers = await this.handleModifyReceiverData(
      this.selectedReceivers.value,
      true
    );
    let listFile = [...(this.sendMsgForm.get('listOfFiles').value || [])];
    listFile.forEach((file) => {
      file.extension = this.filesService.getFileExtension(
        file?.name || file[0]?.name
      );
    });
    const payload = this.trudiSendMsgService.composeScheduleMessagePayload(
      {
        ...this.sendMsgForm.getRawValue(),
        selectedReceivers: receivers,
        listOfFiles: listFile
      },
      this.configs,
      calendarEvent,
      this.template,
      this.selectedTasks
    );
    if (!payload) return;
    this.isSendingMsg = true;
    this.showToastMsg(ESentMsgEvent.SENDING);
    const numberOfMessages = receivers?.length ?? 0;
    this.sendMessageService
      .scheduleSendV3Message(payload)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.onSendMsg.emit({
            type: ISendMsgType.SCHEDULE_MSG,
            event: ESentMsgEvent.SUCCESS,
            data: response,
            receivers: receivers
          });
          this.isSendingMsg = false;
          this.showToastMsg(
            ESentMsgEvent.SUCCESS,
            numberOfMessages,
            true,
            response
          );
          this.getListJobReminders(response?.jobReminders[0].conversationId);
          this.conversationService.reloadConversationList.next(true);
        },
        error: () => {
          this.isSendingMsg = false;
          this.showToastMsg(ESentMsgEvent.ERR, numberOfMessages, true);
          this.onSendMsg.emit({
            type: ISendMsgType.SCHEDULE_MSG,
            event: ESentMsgEvent.ERR
          });
        },
        complete: () => {
          this.onSendMsg.emit({
            type: ISendMsgType.SCHEDULE_MSG,
            event: ESentMsgEvent.COMPLETED
          });
          this.configs.body.timeSchedule = null;
          this.trudiSendMsgFormService.sendMsgForm.reset();
          this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
        }
      });
  }

  // handle highline dynamic parameters and show missing data modal
  async checkValidityDynamicParam(
    msgContent,
    showWarningsModal: boolean = true // show warnings modal when trigger send message
  ) {
    this.isValidMsg = false;
    const listParams = this.getDynamicParamListFromMsg(msgContent);
    if (!listParams.length) {
      this.isValidMsg = true;
      return true;
    }
    // In the case of sending a message, the message will be sent immediately if there is no missing data
    // without needing to update highline dynamic parameters and show missing data modal.
    if (!listParams.length && showWarningsModal) {
      return true;
    }

    let listParamValues = this.listDynamicParams
      .map((item) => item.menu.map((p) => p.param))
      .flat();
    let invalidParamsMap = {};
    let listReceivers = await this.handleModifyReceiverData(
      this.selectedReceivers.value,
      true
    );
    let isInvalidReceivers: boolean = false;

    switch (this.configs?.otherConfigs?.createMessageFrom) {
      case ECreateMessageFrom.SCRATCH:
      case ECreateMessageFrom.TASK_HEADER:
        let uniqReceiverData = this.getUniqReceiverData();
        isInvalidReceivers = uniqReceiverData?.length > 1;
        break;
      case ECreateMessageFrom.MULTI_MESSAGES:
        isInvalidReceivers = !this.selectedReceivers.value?.some(
          (receiver) => receiver.participants?.length === 1
        );
        break;
      default:
    }

    let validationDynamicFieldFunctions = this.getValidationDynamicParam(
      listReceivers,
      isInvalidReceivers
    );
    listParams.forEach((param) => {
      if (!listParamValues.includes(param)) {
        return;
      }

      const validationFunction = validationDynamicFieldFunctions[param];

      if (
        !validationFunction ||
        (isArray(validationFunction) && validationFunction.length > 0)
      ) {
        invalidParamsMap[param] = validationFunction;
      }

      if (validationFunction === undefined) {
        invalidParamsMap[param] = listReceivers;
      }
    });

    // Handle invalid dynamic paramters highlighting
    this.rawMsg = this.handleUpdateStyleOfDynamicParam(
      listParams,
      invalidParamsMap,
      msgContent
    );

    this.cdr.markForCheck();
    if (!Object.keys(invalidParamsMap).length) {
      this.isValidMsg = true;
      return true;
    }

    //Show modal warnings
    if (showWarningsModal) {
      this.invalidParamsMap = invalidParamsMap;
      this.isShowMissingDataModal = true;
    }
    this.cdr.markForCheck();
    return false;
  }

  getValidationDynamicParam(listReceivers, isInvalidReceivers = false) {
    return this.trudiDynamicParameterService.validationDynamicFieldFunctions(
      listReceivers,
      this.sendMsgForm.value.selectedSender,
      this.trudiSendMsgService.currentCompany,
      getCalendarEventData(this.selectedTasks, null),
      isInvalidReceivers,
      this.configs?.otherConfigs?.createMessageFrom
    );
  }

  getDynamicParamListFromMsg(msgContent) {
    return (msgContent.match(REGEX_PARAM_TASK_EDITOR) || []).filter((item) => {
      const invalidParamRegex = new RegExp(
        /<span\sstyle="color:\svar\(--danger-500, #fa3939\);"[^\>]*>\$?\w*<\/span>/gim
      );
      const validParam = `<span style="color: var(--fg-brand, #28ad99);" contenteditable='false'>${item}</span>`;
      return (
        !!msgContent.match(invalidParamRegex) || msgContent.includes(validParam)
      );
    });
  }

  handleUpdateStyleOfDynamicParam(
    listParams,
    listInvalidParams: Object,
    msgContent
  ) {
    return listParams.reduce((text, p) => {
      const validDynamic = `<span style="color: var(--fg-brand, #28ad99);" contenteditable="false">${p}</span>`;
      const inValidDynamic = `<span style="color: var(--danger-500, #fa3939);" title="#missing_users" contenteditable="false">${p}</span>`;
      const invalidPrefixRegex = new RegExp(
        `<span\\sstyle="color:\\svar\\(--danger-500, #fa3939\\);"[^\\>]*>\\${p}<\\/span>`,
        'gim'
      );
      if (listInvalidParams[p]) {
        let listReceiverByTypeParam = listInvalidParams[p];
        if (
          this.configs?.otherConfigs.createMessageFrom ===
          ECreateMessageFrom.MULTI_MESSAGES
        ) {
          listReceiverByTypeParam = listInvalidParams[p]
            .map((item) => {
              return item?.participants;
            })
            .flat();
        }
        const missingParamUsers = getUniqReceiverData(listReceiverByTypeParam)
          .map((user) => {
            if (user.type === EUserPropertyType.EXTERNAL) {
              return user.email;
            }
            return this.sharedService.displayName(
              user.firstName,
              user.lastName
            );
          })
          .join(', ');
        const missingParamText = inValidDynamic.replace(
          '#missing_users',
          `Missing data for: ${missingParamUsers}.`
        );

        if (text.includes(validDynamic)) {
          text = text.replaceAll(validDynamic, missingParamText);
        }
        if (text.match(invalidPrefixRegex)?.length > 0) {
          text = text.replaceAll(invalidPrefixRegex, missingParamText);
        }
      }
      if (!listInvalidParams[p] && text.match(invalidPrefixRegex)?.length > 0) {
        text = text.replaceAll(invalidPrefixRegex, validDynamic);
      }
      return text;
    }, msgContent);
  }

  handleScheduleReminder() {
    const tz = this.agencyDateFormatService.getCurrentTimezone();
    if (
      this.configs?.trudiButton &&
      'fields' in this.configs.trudiButton &&
      this.configs?.trudiButton.action === EStepAction.SCHEDULE_REMINDER
    ) {
      let { reminderTime, day, event, timeline } =
        this.configs?.trudiButton?.fields?.customControl;
      let { taskData } = this.configs?.body;
      const eventDate = this.agencyDateFormatService.agencyDayJs(
        taskData?.['advanceData']?.['selectedEvent']?.['eventDateValue']
      );
      const currentDate = this.agencyDateFormatService.agencyDayJs();
      let dateTemp = null;
      let date = null;
      if (timeline === 'after') {
        dateTemp = eventDate.add(day, 'day');
      } else {
        dateTemp = eventDate.subtract(day, 'day');
      }
      const isSameOrBefore = dateTemp.isSameOrBefore(currentDate, 'day');
      if (isSameOrBefore) {
        reminderTime = currentDate.format('hh:mm a');
        date = dayjs(currentDate).format('YYYY-MM-DD');
      } else {
        date = dayjs(dateTemp).format('YYYY-MM-DD');
      }
      reminderTime = roundToNearestInterval(reminderTime);
      this.selectTimeSchedule =
        this.agencyDateFormatService.combineDateAndTimeToISO(
          date,
          hmsToSecondsOnly(convertTime12to24(reminderTime))
        );
      this.scheduleDate = convertUTCToLocalDateTime(
        eventDate.toDate(),
        tz?.value
      );
      this.additionalInfo = event;

      const eventStatus = taskData?.advanceData?.selectedEvent?.eventStatus;
      switch (event) {
        case ECalendarEvent.BREACH_NOTICE_REMEDY_DATE:
          if (eventStatus === EEventStatus.OPENED) {
            this.isDateUnknown = false;
            this.dueDateTooltipText = 'Breach Remedy Date';
          } else {
            this.selectTimeSchedule = null;
            this.scheduleDate = null;
            this.additionalInfo = null;
            this.isDateUnknown = true;
            this.dueDateTooltipText = null;
          }
          break;
        default:
          break;
      }
    }
  }

  scheduleSpecialFlowDate() {
    this.handleScheduleReminder();
    switch (
      this.taskService.currentTask$.value?.trudiResponse?.setting?.taskNameId
    ) {
      case TaskNameId.routineInspection:
        if (
          this.configs.trudiButton?.action ===
          RoutineInspectionButtonAction.SEND_A_REMINDER_TO_TENANT_SCHEDULED
        ) {
          this.scheduleDate =
            this.routineInspectionService.routineInspectionResponse.value?.variable.startTime;
        }
        break;
      case TaskNameId.tenantVacate:
        const tenantButtonActions: string[] = [
          ETenantVacateButtonAction.scheduleTenantReminderVacateInstructionsEndOfLease,
          ETenantVacateButtonAction.scheduleTenantReminderVacateInstructionsNoticeToVacate,
          ETenantVacateButtonAction.scheduleTenantReminderVacateInstructionsBreakLease
        ];
        if (tenantButtonActions.includes(this.configs.trudiButton?.action)) {
          this.getDateVacate();
          this.scheduleDate = this.vacateDate;
        }
        break;
      case TaskNameId.invoiceTenant:
        const specialButtonActions: string[] = [
          CreditorInvoicingButtonAction.UNPAID_SCHEDULE_TENANT_REMINDER_OVERDUE_INVOICE,
          CreditorInvoicingButtonAction.UNPAID_SCHEDULE_TENANT_REMINDER_PAYMENT_DUE,
          CreditorInvoicingButtonAction.PARTPAID_SCHEDULE_TENANT_REMINDER
        ];
        if (specialButtonActions.includes(this.configs.trudiButton?.action)) {
          const invoiceData =
            this.tenancyInvoicingService.tenancyInvoicingResponse?.value
              ?.data[0];
          this.scheduleDate =
            invoiceData?.syncJob.invoices[0].tenancyInvoice.dueDate;
        }
        break;
      case TaskNameId.breachNotice:
        if (
          this.configs.trudiButton?.action ===
            BreachNoticeRequestButtonAction.schedule_tenant_reminder_remedy_date ||
          this.configs.trudiButton?.action ===
            BreachNoticeRequestButtonAction.schedule_tenant_reminder_breach_notice_expired
        ) {
          if (
            this.breachNoticeService.breachRemedyEvent &&
            this.breachNoticeService.breachRemedyEvent.eventStatus ===
              EEventStatus.OPENED
          ) {
            this.scheduleDate =
              this.breachNoticeService.breachRemedyEvent?.eventDate;
            this.additionalInfo = 'Breach Remedy';
            this.isDateUnknown = false;
            this.dueDateTooltipText = 'Breach Remedy Date';
          } else {
            this.scheduleDate = null;
            this.additionalInfo = null;
            this.isDateUnknown = true;
            this.dueDateTooltipText = null;
          }
        }
        break;
      default:
        break;
    }
  }

  getListJobReminders(conversationId: string) {
    this.trudiScheduledMsgService.jobRemindersCount(conversationId).subscribe();
  }

  getContactInfos(selectedContactCard: ISelectedReceivers[]): IContactInfo[] {
    return selectedContactCard.map((element) => ({
      title: element.type.toLowerCase(),
      address: element.streetLine,
      firstName: element.firstName || '',
      lastName: element.lastName || '',
      mobileNumber: element?.mobileNumber || '',
      phoneNumber: element.phoneNumber || '',
      email: element.email || '',
      landingPage: element.landingPage || ''
    }));
  }

  // handle send msg
  async handleSendMsg(isDraft = false) {
    switch (this.configs.otherConfigs.createMessageFrom) {
      case ECreateMessageFrom.TASK_HEADER:
      case ECreateMessageFrom.SCRATCH: {
        let formData = {
          ...this.sendMsgForm.getRawValue()
        };

        if (
          this.configs.otherConfigs.createMessageFrom ===
          ECreateMessageFrom.TASK_HEADER
        ) {
          formData = {
            ...this.sendMsgForm.value,
            selectedReceivers: await this.handleModifyReceiverData(
              this.selectedReceivers.value
            )
          };
        }

        let bulkEventBody = this.trudiSendMsgService.getSendMsgBodyv2(
          formData,
          this.configs,
          getCalendarEventData(this.selectedTasks, null),
          Boolean(this.configs.body.replyQuote),
          isDraft
        );
        this.send(bulkEventBody, isDraft);
        break;
      }
      case ECreateMessageFrom.MULTI_MESSAGES:
      case ECreateMessageFrom.CONTACT:
      case ECreateMessageFrom.MULTI_TASKS:
      case ECreateMessageFrom.TASK_STEP: {
        //Todo only add conversationId to receiver data when user participate in a conversation only has 1 recipients
        let listReceivers = await this.handleModifyReceiverData(
          this.selectedReceivers.value,
          true
        );
        const formData = {
          ...this.sendMsgForm.value,
          selectedReceivers: listReceivers
        };
        let body = this.trudiSendMsgService.getSendManyMsgBodyv2(
          formData,
          this.configs,
          this.selectedTasks,
          isDraft
        );
        this.sendMany(body, isDraft);
        break;
      }
    }
  }

  send(body: ISendMsgPayload, isDraft = false) {
    this.isSendingMsg = true;
    this.showToastMsg(ESentMsgEvent.SENDING);
    this.trudiSendMsgService.sendMessageV2(body).subscribe({
      next: (res) => {
        // TODO: HANDLE AFTER HAS RESPONSE
        // TODO: remove any
        this.onSendMsg.emit({
          event: ESentMsgEvent.SUCCESS,
          data: res as ISendMsgPayload,
          mailBoxId: body?.mailBoxId,
          receivers: this.selectedReceivers.value,
          isDraft
        });
        if (
          this.configs.otherConfigs.isFromDraftFolder &&
          !(res as ISendMsgResponseV2)?.message.isDraft
        ) {
          this.toastCustomService.handleShowToastForDraft(
            res,
            SocketType.newTask,
            (res as ISendMsgResponseV2)?.task?.type || TaskType.MESSAGE,
            body?.actionFlags?.resolveConversation
              ? TaskStatusType.completed
              : TaskStatusType.inprogress,
            true
          );
        }
        this.headerService.setIsSendBulkMessage(false);
        this.conversationService.reloadConversationList.next(
          EReloadConversationSource.SendMessage
        );

        if (body?.emailMessage?.conversationId) {
          this.conversationService.notifyReloadConversationDetail(
            body?.emailMessage?.conversationId
          );
        }

        if (isDraft) {
          const data = res as ISendMsgResponseV2;
          if (
            data?.task?.type === TaskType.TASK ||
            data?.message?.replyToMessageId ||
            this.configs.otherConfigs.isFromDraftFolder
          ) {
            this.toastService.success(DRAFT_SAVED);
          } else {
            this.toastCustomService.handleShowToastForDraft(res);
          }
        }
      },
      error: () => {
        this.isSendingMsg = false;
        this.onSendMsg.emit({
          event: ESentMsgEvent.ERR
        });
      },
      complete: () => {
        this.isSendingMsg = false;
        this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
        this.reiFormService.currentReiFormData$.next(null);
        this.onSendMsg.emit({
          event: ESentMsgEvent.COMPLETED
        });
      }
    });
  }

  getUniqReceiverData() {
    let tempReceiversData = [
      ...(this.selectedReceivers?.value ?? []),
      ...(this.ccReceivers?.value ?? []),
      ...(this.bccReceivers?.value ?? [])
    ];
    return getUniqReceiverData(tempReceiversData);
  }

  sendMany(sendManyMsgPayload: ISendManyMsgPayload, isDraft = false) {
    this.isSendingMsg = true;
    this.showToastMsg(ESentMsgEvent.SENDING);
    this.trudiSendMsgService.sendManyMessageV2(sendManyMsgPayload).subscribe({
      next: (res) => {
        this.onSendMsg.emit({
          event: ESentMsgEvent.SUCCESS,
          data: res as ISendManyMsgPayload,
          mailBoxId: sendManyMsgPayload?.mailBoxId,
          receivers: this.selectedReceivers.value,
          isDraft
        });
        if (isDraft) {
          const data = res as unknown as ISendMsgResponseV2[];
          if (data?.[0]?.task?.type === TaskType.TASK) {
            this.toastService.success(DRAFT_SAVED);
            return;
          }
          if (data.length === 1) {
            this.toastCustomService.handleShowToastForDraft(data[0]);
          } else {
            this.toastService.success(DRAFT_SAVED);
          }
        }
      },
      error: () => {
        this.isSendingMsg = false;
        this.onSendMsg.emit({
          event: ESentMsgEvent.ERR
        });
      },
      complete: () => {
        this.isSendingMsg = false;
        this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
        this.reiFormService.currentReiFormData$.next(null);
        this.onSendMsg.emit({
          event: ESentMsgEvent.COMPLETED
        });
      }
    });
  }

  async handleModifyReceiverData(
    selectedReceivers,
    isAllowGetDataToCheckInValidParam = false
  ) {
    let createMessageFrom = this.configs.otherConfigs.createMessageFrom;
    // Note: Mapping data is unnecessary when the message content contains valid parameters.
    if (
      this.isAllowKeepGoingToSendMessage ||
      (this.isValidMsg &&
        (createMessageFrom === ECreateMessageFrom.SCRATCH ||
          createMessageFrom === ECreateMessageFrom.CONTACT))
    ) {
      return !this.listParamData.length
        ? selectedReceivers
        : this.listParamData;
    }

    if (createMessageFrom === ECreateMessageFrom.SCRATCH) {
      return await this.handleGetDataToPrefillForSendGroupMsg();
    }

    if (createMessageFrom === ECreateMessageFrom.CONTACT) {
      return await this.handleGetDataToPrefillForSendContact(selectedReceivers);
    }

    if (
      !this.configs.body.receiver.isShowContactType &&
      ![
        ECreateMessageFrom.MULTI_MESSAGES,
        ECreateMessageFrom.MULTI_TASKS,
        ECreateMessageFrom.TASK_HEADER,
        ECreateMessageFrom.TASK_STEP
      ].includes(createMessageFrom)
    ) {
      return selectedReceivers;
    }

    let listReceiversUpdated = [];
    let listReceivers = selectedReceivers
      .map((item) => item?.data)
      .flat()
      .filter(Boolean);

    if (!listReceivers.length) {
      listReceivers = selectedReceivers;
    }

    if (createMessageFrom === ECreateMessageFrom.MULTI_MESSAGES) {
      const processedKeys = [];
      this.listParamData = listReceivers?.reduce((result, item) => {
        const key = `${item?.id}_${item?.propertyId}`;

        if (!processedKeys.includes(key)) {
          processedKeys.push(key);

          const matchingObjects = listReceivers.filter(
            (receiver) =>
              receiver?.id === item?.id &&
              receiver?.propertyId === item?.propertyId
          );

          result = result?.concat(matchingObjects);
        }

        return result;
      }, []);
    } else {
      this.listParamData = getUniqReceiverData(listReceivers);
    }

    // Handle Unidentified participant and extra recipients for task step
    if (createMessageFrom === ECreateMessageFrom.TASK_STEP) {
      const listConversations = await firstValueFrom(
        this.conversationService.listConversationByTask
      );
      const listReceiverMapped = this.listParamData.map((receiver) => {
        const unidentifiedConversation = listConversations.find(
          (conversation) => {
            const participants = getUserFromParticipants(
              conversation.participants
            );

            return (
              participants.length === 1 &&
              participants.some(
                (participant) =>
                  participant.email === receiver.email && !participant.type
              )
            );
          }
        );

        const existConversationOfRecipient = listConversations.find(
          (conversation) => {
            const participants = getUserFromParticipants(
              conversation.participants
            );
            return (
              participants.length === 1 &&
              participants.some(
                (participant) =>
                  participant.userId === receiver.id &&
                  participant.propertyId === receiver.propertyId
              )
            );
          }
        );

        if (
          receiver.type === EUserPropertyType.UNIDENTIFIED &&
          unidentifiedConversation
        ) {
          return {
            ...receiver,
            conversationId: unidentifiedConversation?.id
          };
        }

        if (existConversationOfRecipient) {
          return {
            ...receiver,
            conversationId: existConversationOfRecipient?.id
          };
        }

        return receiver;
      });
      this.listParamData = listReceiverMapped;
      return this.listParamData;
    }

    // handle retrieves the number of messages to send on Send message for multi tasks
    if (createMessageFrom === ECreateMessageFrom.MULTI_TASKS) {
      listReceiversUpdated = this.selectedTasks.flatMap((task) =>
        this.listParamData.map((receiver) => {
          //find conversations have this receiver and have 1 participant
          const conversations = task?.conversations?.filter(
            (conversation) =>
              conversation.participants?.some(
                (participant) => participant.user?.id === receiver.id
              ) && conversation?.participants?.length === 1
          );
          return {
            ...receiver,
            ...task,
            conversations: conversations,
            conversationId: conversations[0]?.id || null,
            participants: conversations[0]?.participants
          };
        })
      );

      this.listParamData = listReceiversUpdated.filter(
        (item) =>
          item.propertyId === item.property.id ||
          item.taskId === item?.userTaskId
      );
    }

    if (createMessageFrom === ECreateMessageFrom.TASK_HEADER) {
      const dataToPrefillForTaskHeader =
        await this.handleGetDataToPrefillForSendGroupMsg();

      const receivers = [
        ...this.selectedReceivers.value,
        ...this.bccReceivers.value,
        ...this.ccReceivers.value
      ];

      this.listParamData = dataToPrefillForTaskHeader.filter((data) =>
        this.sendMsgForm.value.selectedReceivers.some(
          (val) => val.id === data.id
        )
      );

      if (receivers.length <= 1 && !this.isInternalNote) {
        this.listParamData = this.selectedTasks.flatMap((task) =>
          this.listParamData.map((receiver) => {
            const comparator = (
              receiver: ISelectedReceivers,
              participant: IConversationParticipant
            ) => {
              const isUnidentified =
                receiver.type === EUserPropertyType.UNIDENTIFIED;
              return isUnidentified
                ? participant?.user?.email === receiver?.email &&
                    !participant?.user?.type
                : participant?.user?.id === receiver.id &&
                    participant.propertyId === receiver.propertyId;
            };
            const conversations = task?.conversations?.filter((conversation) =>
              conversation?.participants?.some(
                (participant) =>
                  comparator(receiver, participant) &&
                  conversation?.participants?.length === 1
              )
            );

            return {
              ...task,
              ...receiver,
              conversationId: conversations[0]?.id || null
            };
          })
        );
      }
      return this.listParamData;
    }

    if (createMessageFrom === ECreateMessageFrom.MULTI_MESSAGES) {
      let combinedList = [];

      this.listParamData.forEach((receiver) => {
        const matchingSelectedTask = this.selectedTasks?.find(
          (task) =>
            task?.property?.id === receiver?.propertyId &&
            task?.conversations?.some(
              (conversation) => conversation?.id === receiver?.conversationId
            )
        );

        if (matchingSelectedTask) {
          // Map summary
          const summary = matchingSelectedTask.summary?.[0] || {};
          const combinedItem = {
            ...receiver,
            ...matchingSelectedTask,
            summary: summary,
            conversationId:
              matchingSelectedTask?.conversations?.find(
                (item) => item?.userId === receiver?.id
              )?.id ?? null
          };
          combinedList?.push(combinedItem);
        } else {
          combinedList?.push(receiver);
        }
      });
      this.listParamData = combinedList;
    }

    return this.listParamData;
  }

  async handleGetDataToPrefillForSendGroupMsg() {
    let receiverData = this.getUniqReceiverData();
    let propertyData = null;
    let propertyId = this.property?.value?.id;
    const taskData = this.selectedTasks?.[0] || ({} as any);
    const otherConfigs = this.configs.otherConfigs;
    if (
      otherConfigs.isForwardConversation ||
      otherConfigs.isForwardOrReplyMsg
    ) {
      const conversation = this.conversationService.currentConversation?.value;
      if (taskData?.summary?.length)
        taskData.summary =
          taskData?.summary?.find(
            (item) => item?.conversationId === conversation?.id
          ) || {};
    }
    if (propertyId) {
      propertyData = await this.getPropertyDataToPrefillDynamicParams(
        propertyId
      );
    }
    if (receiverData.length === 1) {
      this.trudiSendMsgService.dataToPrefillForSendBulk = {
        ...taskData,
        ...(propertyData
          ? { ...receiverData[0], ...propertyData }
          : receiverData[0])
      };
    } else {
      this.trudiSendMsgService.dataToPrefillForSendBulk = {
        ...taskData,
        ...(propertyData ? propertyData : {})
      };
    }

    this.listParamData = receiverData.map((data) => ({
      ...taskData,
      ...(propertyData ? { ...data, ...propertyData } : data)
    }));
    return this.listParamData;
  }

  async handleGetDataToPrefillForSendContact(selectedReceivers) {
    let userProperties = selectedReceivers.map((item) => ({
      userId: item.id,
      propertyId: item?.propertyId ?? null
    }));
    let receiversPropertyData =
      await this.getPropertyDataToPrefillDynamicParams(null, userProperties);
    this.listParamData = selectedReceivers
      .flatMap((data) =>
        receiversPropertyData.map((receiver) => ({
          ...receiver,
          ...data
        }))
      )
      .filter(
        (item) =>
          item.id === item.userId && item?.propertyId == item.property?.id
      );
    return this.listParamData;
  }

  replaceMessageTitle(body) {
    const messages = body?.message ? body?.message : body?.textMessages;

    messages?.forEach((res) => {
      const currTask = this.selectedTasks.find(
        (one) => one.taskId === res.taskId
      );
      if (!currTask) return;

      const replaceFunction = (string) =>
        string
          .replace(/\{task_name\}/g, currTask?.taskName || EFallback.UNKNOWN)
          .replace(/\{task_title\}/g, currTask?.taskTitle || EFallback.UNKNOWN)
          .replace(
            /\{short_property_address\}/g,
            currTask?.property?.shortenStreetLine || EFallback.UNKNOWN
          );

      if (body?.message) {
        res.categoryMessage = replaceFunction(res.categoryMessage);
      } else {
        res.newConversationTitle = replaceFunction(res.newConversationTitle);
      }
    });
  }

  showToastMsg(type, numberOfMessages?, isScheduleForSend = false, data?) {
    let createMessageFrom = this.configs.otherConfigs.createMessageFrom;
    if (
      createMessageFrom !== ECreateMessageFrom.MULTI_TASKS &&
      createMessageFrom !== ECreateMessageFrom.MULTI_MESSAGES
    ) {
      return;
    }
    if (
      createMessageFrom === ECreateMessageFrom.MULTI_TASKS &&
      !this.configs?.body?.receiver?.prefillSelectedTypeItem &&
      type !== ESentMsgEvent.SENDING &&
      !isScheduleForSend
    ) {
      return;
    }
    let messageLabel = `${numberOfMessages} ${
      numberOfMessages === 1 ? 'message' : 'messages'
    }`;
    switch (type) {
      case ESentMsgEvent.SENDING: {
        this.toastService.info('Message sending');
        break;
      }
      case ESentMsgEvent.ERR: {
        this.toastService.error(
          `${messageLabel}  failed to ${
            isScheduleForSend ? 'schedule' : 'send'
          }`
        );
        break;
      }
      case ESentMsgEvent.SUCCESS: {
        if (numberOfMessages === 1 && isScheduleForSend) {
          this.toastCustomService.handleShowToastForScheduleMgsSend(
            { data },
            createMessageFrom === ECreateMessageFrom.MULTI_TASKS
              ? TaskType.TASK
              : TaskType.MESSAGE,
            true
          );
        } else {
          this.toastService.success(
            `${messageLabel} ${
              isScheduleForSend ? ' scheduled for send' : 'sent'
            }`
          );
        }
        break;
      }
    }
  }

  confirmCreateLinkReiForm(taskId: string) {
    if (
      this.popupState.addReiForm ||
      this.reiFormService.listReiFormsBtn.includes(
        this.configs.trudiButton?.action
      )
    ) {
      const formIdsArr =
        this.reiFormService.createReiFormLink$.value.inPopup.map((value) =>
          value.formDetail.id.toString()
        );
      const formIds = [...new Set(formIdsArr)];
      this.reiFormService
        .confirmCreateLinkReiForm(
          formIds,
          taskId,
          this.configs.trudiButton?.action
        )
        .subscribe((reiFormLinks) => {
          this.trudiSendMsgService.resetCheckBox();
          if (reiFormLinks) {
            this.reiFormService.clearReiFormLinkPopUp();
            reiFormLinks.forEach((reiFormLink) => {
              if (reiFormLink.formDetail.isCompleted) {
                this.filesService.reloadAttachments.next(true);
              }
            });
          }
        });
    }
  }

  editScheduledMsg(msgType, data, id) {
    const body = data;
    this.trudiScheduledMsgService
      .editScheduledMsg(id, body)
      .pipe(
        switchMap(() =>
          this.trudiScheduledMsgService.getListScheduledMsg(
            this.selectedScheduledMsg.taskId,
            this.selectedScheduledMsg.conversationId
          )
        )
      )
      .subscribe({
        next: (res) => {
          this.onSendMsg.emit({
            type: msgType,
            event: ESentMsgEvent.SUCCESS
            /* data: res,
          receivers: this.selectedReceivers.value, */
          });
        },
        error: () => {
          this.onSendMsg.emit({
            type: msgType,
            event: ESentMsgEvent.ERR
          });
        },
        complete: () => {
          this.onSendMsg.emit({
            type: msgType,
            event: ESentMsgEvent.COMPLETED
          });
          this.selectedScheduledMsg = null;
          /* this.isSendingMsg = false;
        this.trudiSendMsgFormService.sendMsgForm.reset(); */
        }
      });
  }

  // handle pop-up
  onCloseSendMsg() {
    this.onQuit.emit();
    this.trudiSendMsgService.setHiddenTextFieldTitle(false);
    this.trudiSendMsgService.setViewRecipientList(null);
    this.trudiSendMsgService.resetCheckBox();
    this.trudiSendMsgService.setPopupState({
      sendMessage: false,
      closeConfirm: false,
      addReiForm: false
    });
    this.uploadFromCRMService.setSelectedFiles([]);
    this.trudiAddContactCardService.setSelectedContactCard([]);
    this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
    this.trudiSendMsgService.openFromVacateSchedule$.next(false);
    this.trudiSendMsgFormService.setSignatureContentMsgValidate(true);
  }

  onConfirmQuit(isQuit: boolean) {
    if (isQuit) {
      this.onQuit.emit();
      this.trudiSendMsgService.resetCheckBox();
      this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
    }
    this.trudiSendMsgService.setPopupState({
      sendMessage: isQuit,
      selectTimeSchedule: !isQuit,
      closeConfirm: !isQuit
    });
  }

  onBackSendMsg(isQuit: boolean) {
    if (isQuit) {
      this.onQuit.emit();
      return;
    }
    this.trudiSendMsgService.setPopupState({
      selectTimeSchedule: isQuit,
      sendMessage: !isQuit
    });
  }

  onDateTimeSelected(dateTime: string) {
    this.selectTimeSchedule = dateTime;
    this.configs.body.timeSchedule = dateTime;
  }

  changePopupState(action: EPopupAction) {
    this.navigatePopupService.changePopupState({
      action,
      data: this.popupQueue
    });
  }

  onChangeTypeSendMessage(value) {
    this.configs.body.typeSendMsg = value.action;
    if (value.action === ESendMsgAction.Schedule) {
      this.trudiSendMsgService.setPopupState({
        sendMessage: false,
        selectTimeSchedule: true
      });
      this.scheduleSpecialFlowDate();
    } else {
      this.selectTimeSchedule = null;
      this.configs.body.timeSchedule = null;
    }
  }

  setTemplate(template: string) {
    this.template = template;
  }

  checkDisableBtnNext() {
    combineLatest([
      this.inboxSidebarService.getAccountAdded(),
      this.inboxService.getSyncMailBoxStatus()
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([accountAdded, syncMailBoxStatus]) => {
        if (accountAdded) {
          this.hasAddAccount = accountAdded;
        }
        if (syncMailBoxStatus) {
          this.syncMailBoxStatus = syncMailBoxStatus;
        }
      });
  }

  getDataByCRM() {
    if (!this.configs.body.tinyEditor.isShowDynamicFieldFunction) {
      return;
    }
    this.companyService.currentCompanyCRMSystemName
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((res) => {
          return of(this.getListDynamicByCRM(res));
        })
      )
      .subscribe((res) => {
        this.listDynamicParams = res;
      });
  }

  getListDynamicByCRM(crm) {
    let tempListParamByCRM = [];
    switch (crm) {
      case ECRMState.PROPERTY_TREE:
        tempListParamByCRM = cloneDeep(PT_LIST_DYNAMIC_PARAMETERS);
        break;
      case ECRMState.RENT_MANAGER:
        tempListParamByCRM = cloneDeep(RM_LIST_DYNAMIC_PARAMETERS);
        break;
      default:
        break;
    }
    return this.handleShowListDynamic(tempListParamByCRM);
  }

  handleShowListDynamic(tempListParamByCRM) {
    const dynamicSpecificTypes = [
      'communicationStepType',
      'componentType',
      'calendarEventType'
    ];
    const validDynamicTypes = [
      EDynamicType.RM_COMPONENT,
      EDynamicType.PT_COMPONENT,
      EDynamicType.COMMUNICATION_STEP,
      EDynamicType.CALENDER_EVENT
    ];
    if (this.listDynamicFieldData?.length > 0) {
      tempListParamByCRM.forEach((item) => {
        if (validDynamicTypes.includes(item.dynamicType)) {
          item.isDisplay = dynamicSpecificTypes.some((field) =>
            this.listDynamicFieldData.includes(item[field])
          );
        }
      });
      const filterListParam = tempListParamByCRM.filter((p) => p.isDisplay);
      const sortedListParamByCRM = filterListParam.sort((a, b) => {
        const typeA =
          a.communicationStepType || a.componentType || a.calendarEventType;
        const typeB =
          b.communicationStepType || b.componentType || b.calendarEventType;

        if (a.componentType && b.componentType) {
          return (
            this.listDynamicFieldData.indexOf(typeA) -
            this.listDynamicFieldData.indexOf(typeB)
          );
        }

        if (a.calendarEventType && b.calendarEventType) {
          return (
            this.listDynamicFieldData.indexOf(typeA) -
            this.listDynamicFieldData.indexOf(typeB)
          );
        }

        if (a.componentType && b.calendarEventType) {
          return -1;
        }

        return 0;
      });
      return sortedListParamByCRM;
    }

    let titleOrder = [
      'Request summary',
      'Recipient',
      'Property',
      'Company',
      'Tenant',
      'Tenancy',
      'Landlord'
    ];
    return tempListParamByCRM.filter(
      (p) => p.isDisplay && titleOrder.includes(p?.title)
    );
  }

  handleCloseWarningMissingDataModal() {
    this.isAllowKeepGoingToSendMessage = false;
  }

  handleKeepSending() {
    this.isAllowKeepGoingToSendMessage = true;
    this.triggerDropDownEvent(this.currentAction);
  }

  handleClickBackFromSelectRecipientsModal() {
    this.onBack.emit();
    this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
  }

  handleConfirmDraft() {
    this.triggerDropDownEvent({
      action: ESendMsgAction.Send,
      isDraft: true
    } as ActionSendMsgDropdown);
  }

  ngOnDestroy(): void {
    this.trudiSendMsgFormService.sendMsgForm.reset();
    this.configs.footer.buttons.dropdownList.sort((a, b) => a.id - b.id);
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.trudiSendMsgService.openFromVacateSchedule$.next(false);
  }
}
