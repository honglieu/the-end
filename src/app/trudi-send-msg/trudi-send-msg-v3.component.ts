import { TrudiSendMsgHelperFunctionsService } from '@/app/trudi-send-msg/services/trudi-send-msg-helper-functions.service';
import {
  ChangeDetectorRef,
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Self,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import dayjs from 'dayjs';
import { cloneDeep, isArray } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  concatMap,
  debounceTime,
  filter,
  finalize,
  first,
  firstValueFrom,
  of,
  switchMap,
  takeUntil,
  distinctUntilChanged
} from 'rxjs';
import uuidv4 from 'uuid4';
import { convertUTCToLocalDateTime } from '@core';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  IListDynamic,
  PT_LIST_DYNAMIC_PARAMETERS,
  RM_LIST_DYNAMIC_PARAMETERS
} from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import {
  ECRMState,
  ECalendarEvent,
  EContactCardType,
  EDynamicType,
  EStepAction,
  ETypeSend
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { convertTime12to24 } from '@/app/leasing/utils/functions';
import {
  ActionSendMsgDropdown,
  ESendMsgAction,
  ISendMsgBody
} from '@/app/routine-inspection/utils/routineType';
import { CompanyService } from '@services/company.service';
import { ActionDefaultScheduleButton, trudiUserId } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { HeaderService } from '@services/header.service';
import { PropertiesService } from '@services/properties.service';
import { ReiFormService } from '@services/rei-form.service';
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
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { ResizableModalPopupComponent } from '@shared/components/resizable-modal/resizable-modal-popup';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { EMessageComeFromType, SocketType } from '@shared/enum';
import { EEventStatus } from '@shared/enum/calendar.enum';
import { EMailBoxStatus, EMailBoxType } from '@shared/enum/inbox.enum';
import { RegionId } from '@shared/enum/region.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { CurrentUser, IMailBox } from '@shared/types/user.interface';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TenantVacateService } from '@/app/tenant-vacate/services/tenant-vacate.service';
import { ETenantVacateButtonAction } from '@/app/tenant-vacate/utils/tenantVacateType';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { TrudiScheduledMsgService } from '@/app/trudi-scheduled-msg/services/trudi-scheduled-msg.service';
import {
  EDefaultBtnDropdownOptions,
  ITrudiScheduledMsgInfo
} from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import { TrudiDynamicParameterService } from './services/trudi-dynamic-paramater.service';
import { TrudiSendMsgFormService } from './services/trudi-send-msg-form.service';
import {
  IGetDynamicFieldsDataMessageScratchPayload,
  TrudiSendMsgUserService
} from './services/trudi-send-msg-user.service';
import { TrudiSendMsgService } from './services/trudi-send-msg.service';
import {
  extractQuoteAndMessage,
  findConversationLink,
  getCalendarEventData,
  getCalendarEventFromSelectedTasks,
  getDynamicParamListFromMsg,
  getListSenderMailBox,
  getUniqReceiverData,
  getUserFromParticipants,
  isCreateMessageOutOfTask,
  roundToNearestInterval,
  updateConfigs
} from './utils/helper-functions';
import { defaultConfigs, popupQueue } from './utils/trudi-send-msg-config';
import { ECreateMessageFrom } from './utils/trudi-send-msg.enum';
import {
  EFooterButtonType,
  ESentMsgEvent,
  ETrudiSendMsgBtn,
  IAutomateSimilarRepliesResponse,
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
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { TrudiSaveDraftService } from './services/trudi-save-draft.service';
import { MessageObject } from '@shared/types/message.interface';
import { TrudiDynamicParameterDataService } from './services/trudi-dynamic-parameter-data.service';
import { FAKE_LOADING_LIST_PROPERTIES } from './utils/trudi-send-msg.constant';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import {
  IConversationParticipant,
  ITaskInfoToGetDataPrefill,
  ITasksForPrefillDynamicData
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';

@Component({
  selector: 'trudi-send-msg-v3',
  templateUrl: './trudi-send-msg-v3.component.html',
  styleUrls: ['./trudi-send-msg-v3.component.scss'],
  providers: [
    TrudiSendMsgUserService,
    TrudiSendMsgHelperFunctionsService,
    TrudiDynamicParameterDataService
  ]
})
export class TrudiSendMsgV3Component implements OnInit, OnChanges, OnDestroy {
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
    private headerService: HeaderService,
    private reiFormService: ReiFormService,
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
    @Self()
    public trudiDynamicParameterDataService: TrudiDynamicParameterDataService,
    private toastService: ToastrService,
    @Self() private trudiSendMsgUserService: TrudiSendMsgUserService,
    public cdr: ChangeDetectorRef,
    private propertyService: PropertiesService,
    private toastCustomService: ToastCustomService,
    private companyService: CompanyService,
    private taskApiService: TaskApiService,
    @Self()
    private trudiSendMsgHelperFunctionsService: TrudiSendMsgHelperFunctionsService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private mailboxSettingService: MailboxSettingService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private facebookService: FacebookService
  ) {}
  @ViewChild('dropdown') dropdown: ElementRef;
  @ViewChild('footerTemplate') footerTemplate: ElementRef;
  @ViewChild('resizableContainer')
  resizableContainer: ResizableModalPopupComponent;
  @Input() configs: ISendMsgConfigs = cloneDeep(defaultConfigs);
  @Input() defaultBtnOption: EDefaultBtnDropdownOptions;
  @Input() listDynamicFieldData: string[] = [];
  @Input() mailBoxIdFromCalender: string = '';
  @Input() isInternalNote: boolean = false;
  @Output() back = new EventEmitter();
  @Output() quit = new EventEmitter();
  @Output() sendMsg = new EventEmitter<ISendMsgTriggerEvent>();
  @Output() nextDropDown = new EventEmitter();
  @Output() sendScheduleVacate = new EventEmitter();
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
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
    'header.title': 'Add contact card',
    'header.showCloseBtn': false
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
  public isPrefillProperty: boolean = true;
  public shouldInitSelectRecipientsModal: boolean = false;
  public fetchTasksData$ = new BehaviorSubject<ITaskInfoToGetDataPrefill[]>(
    null
  );
  private isFirstTimeSaveDraft: boolean = true;
  private listPropertiesAllStatus: UserPropertyInPeople[] = [];
  private listPropertiesSuggested: UserPropertyInPeople[] = [];
  public isLoading: boolean = false;
  public isDirtySearchProperties = false;
  private isClosingPopup: boolean = false;
  private _propertyData;
  public fakeLoadingListProperties = [FAKE_LOADING_LIST_PROPERTIES];
  public allowInsertContactCardToContent: boolean = true;

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
      !this.isPortalUser ||
      this.trudiSaveDraftService.isLoadingUploadFile
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
      if (this.configs.inputs.selectedTasksForPrefill) {
        this.fetchTasksData$.next(this.configs.inputs.selectedTasksForPrefill);
      }
      if (this.configs.body.draftMessageId) {
        this.trudiSaveDraftService.setDraftMsgId(
          this.configs.body.draftMessageId
        );
      }
    }
  }

  ngOnInit(): void {
    this.defaultBtnOption = this.configs.inputs.defaultBtnOption;
    this.isInternalNote = this.configs.inputs.isInternalNote;
    this.listDynamicFieldData = this.configs.inputs.listDynamicFieldData;
    this.mailBoxIdFromCalender = this.configs.inputs.mailBoxIdFromCalender;

    this.isConsole = this.sharedService.isConsoleUsers();
    this.checkDisableBtnNext();
    this.selectedTaskIds = this.configs.inputs.selectedTasksForPrefill?.map(
      (item) => item.taskId
    );
    //Todo freeze modal when calling api related to prefill data
    this.fetchTasksData$
      .pipe(
        takeUntil(this.unsubscribe),
        debounceTime(50),
        filter((data) => Boolean(data)),
        concatMap((tasks) => {
          return this.taskApiService.getInfoTasksForPrefillDynamicParam({
            tasks: tasks
          });
        })
      )
      .subscribe((rs) => {
        this.selectedTasks = rs;
        this.trudiDynamicParameterDataService.initDynamicData(this.configs, rs);
      });

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

        if (this.configs.otherConfigs?.senderTypes?.length) {
          this.listMailBoxs = this.listMailBoxs.filter((mailbox) =>
            this.configs.otherConfigs.senderTypes.includes(mailbox?.type)
          );
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
    this.getPropertiesSuggested();
    this.initForm();

    // no need to init data: case reply, forward, message summary (task-detail)
    !this.fetchTasksData$.value &&
      this.trudiDynamicParameterDataService.initDynamicData(this.configs);

    this.handleSetDefaultPopupState();
    this.handleChangeDefaultDropdownButton();
    this.handlePrefillFiles();
    this.getDataByCRM();
    this.subscribeFormChanges();
    this.handlePrefillPropertyFromFieldTo();

    this.trudiSendMsgFormService.valueSearchProperties$
      .pipe(
        distinctUntilChanged((prev, current) => {
          if (!prev) return false;
          return prev.trim() === current.trim();
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((value) => {
        if (value.trim().length > 0) {
          this.isDirtySearchProperties = true;
          this.listProperties = this.listPropertiesAllStatus;
        } else if (
          this.isDirtySearchProperties &&
          this.listPropertiesSuggested.length
        ) {
          this.listProperties = this.listPropertiesSuggested;
        }
      });
    this.getInvidualSupplierContactCard();
  }

  handlePrefillPropertyFromFieldTo() {
    this.selectedReceivers?.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        const selectedReceiversLast = value?.[value?.length - 1];
        if (
          value?.length &&
          this.isPrefillProperty &&
          !this.property?.value &&
          selectedReceiversLast?.propertyId
        ) {
          this.property.setValue(selectedReceiversLast.propertyId);
          this.isPrefillProperty = false;
        }
      });
  }

  sortByStreetLine(listProperty) {
    return listProperty?.sort((a, b) => {
      return a.streetline.localeCompare(b.streetline);
    });
  }

  getPropertiesSuggested() {
    this.trudiSendMsgFormService.triggerOpenDropdownProperties$
      .pipe(
        switchMap((isOpen) => {
          if (!isOpen) return of([...this.listProperties]);
          this.isLoading = true;
          const emails =
            this.selectedReceivers?.value?.map(
              (value) => value?.secondaryEmail?.email || value?.email
            ) || [];
          return this.propertyService.getPropertiesSuggestedAllStatus(emails);
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((value) => {
        const selectedReceivers = this.selectedReceivers?.value;
        const hasReceiversProperty = selectedReceivers?.some(
          (value) => value.propertyId
        );
        const listSuggested = value.filter((properties) => {
          return (
            properties.isSuggested || properties.id === this.property?.value?.id
          );
        });
        const sortListSuggested = this.sortByStreetLine(listSuggested);
        const listToAssign = hasReceiversProperty ? sortListSuggested : value;
        this.listProperties = listToAssign;
        this.listPropertiesSuggested = listToAssign;
        this.listPropertiesAllStatus = value;
        this.isLoading = false;
      });
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
    this.trudiSendMsgService.setPopupState({
      sendMessage: true
    });
  }

  setTemplateContext(template, context) {
    this.toolbarTinyTemplate = template;
    this.toolbarTinyContext = context;
  }

  // Init functions
  initForm() {
    this.trudiSaveDraftService.resetTrackControl();
    this.trudiSendMsgFormService.buildFormV2(this.formDefaultValue);
    if (!!this.configs.body.defaultSendOption) {
      this.sendOption.setValue(this.configs.body.defaultSendOption);
    }
    if (this.configs.inputs.listOfFiles) {
      const listFilePrefill =
        this.trudiSendMsgHelperFunctionsService.handlePrefillFileUploaded(
          this.configs.inputs.listOfFiles
        );
      this.configs.inputs.listOfFiles = listFilePrefill;
      this.listOfFilesControl.setValue(listFilePrefill);
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
      this.trudiSendMsgService.setViewRecipientList(
        this.configs.inputs.listUser
      );
    }

    if (
      this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.CONTACT ||
      this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.TASK_STEP
    ) {
      this.trudiSendMsgHelperFunctionsService.handlePrefillRecipientAndContactCard(
        this.configs,
        this.selectedTaskIds
      );
    }
  }

  get formDefaultValue(): IDefaultValueTrudiSendMsg {
    const { prefillSender, prefillSenderEmail } = this.configs.body;
    const selectedSenderInTask =
      this.listSenderMailBox.find(
        (sender) =>
          sender.id === prefillSender &&
          (prefillSenderEmail && trudiUserId === prefillSender
            ? sender.mailBoxAddress === prefillSenderEmail
            : true)
      ) ||
      this.listSenderMailBox.find(
        (sender) =>
          sender.id === this.currentUser.id &&
          sender.mailBoxAddress === prefillSenderEmail
      ) ||
      this.listSenderMailBox.find((value) => {
        return value.type === EMailBoxType.COMPANY;
      }) ||
      this.listSenderMailBox[0];
    const selectedSenderDefault =
      this.listSenderMailBox.find(
        (sender) =>
          sender.id === prefillSender &&
          (prefillSenderEmail && trudiUserId === prefillSender
            ? sender.mailBoxAddress === prefillSenderEmail
            : true)
      ) ||
      this.listSenderMailBox.find(
        (sender) =>
          sender.id === this.currentUser.id &&
          sender.mailBoxId === this.currentMailBoxId
      ) ||
      this.listSenderMailBox.find(
        (sender) => sender.type === EMailBoxType.COMPANY
      ) ||
      this.listSenderMailBox[0];
    return {
      selectedSender: this.configs.otherConfigs?.filterSenderForReplyInTask
        ? selectedSenderInTask
        : selectedSenderDefault,
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
      selectedContactCard: this.configs.inputs.listContactCard ?? []
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
    if (
      (this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.TASK_STEP &&
        (this.configs.trudiButton as TrudiStep)?.fields.typeSend) ||
      this.configs.inputs.prefillData?.fields?.typeSend ===
        ETypeSend.SINGLE_EMAIL
    ) {
      this.configs.header.icon = 'buildingsV2';
      this.configs.header.isPrefillProperty = true;
      this.configs.header.isChangeHeaderText = false;
      this.taskService.currentTask$?.getValue()?.property?.streetline || null,
        (this.configs.header.hideSelectProperty =
          !this.taskService.currentTask$?.getValue()?.property?.isTemporary);
      this.configs.header.title =
        this.taskService.currentTask$?.getValue()?.property?.streetline || null;
    }
    if (this.configs.header.isPrefillProperty) {
      this.currentPropertyId = this.configs?.body?.sessionId
        ? this.configs.otherConfigs.conversationPropertyId
        : this.configs.otherConfigs.conversationPropertyId ||
          this.taskService.currentTask$?.value?.property.id ||
          this.facebookService.currentFacebookTaskValue$?.property?.id;
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
        this.listProperties = res || [];
        this.listPropertiesAllStatus = res || [];
      });
  }

  triggerExpandOrResizeModal() {
    this.isFullScreenModal = !this.isFullScreenModal;
    this.resizableContainer.resizeToDefault();
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
          this.trudiDynamicParameterService.attachInspectionMedia(
            this.configs.inputs.rawMsg
          );
        const fileOfInspection = listFile?.inspection;
        const fileOfTenant = listFile?.newTenant;
        if (isShowInspectionFiles && Boolean(fileOfInspection?.length)) {
          let inspectionImagesModified = fileOfInspection.map((res) => ({
            ...res,
            name: res.fileName
          }));
          this.configs.inputs.listOfFiles = [
            ...this.configs.inputs.listOfFiles,
            ...inspectionImagesModified
          ];
        }
        const isExistedDynamic =
          this.trudiDynamicParameterService.isExistedTenantFileDynamic(
            this.configs.inputs.rawMsg
          );
        if (isExistedDynamic && Boolean(fileOfTenant?.length)) {
          this.configs.inputs.listOfFiles = [
            ...this.configs.inputs.listOfFiles,
            ...fileOfTenant
          ];
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
    if (
      isFromScheduleButton ||
      this.configs.body.typeSendMsg === ESendMsgAction.Schedule
    ) {
      this.defaultOptionDropdown = 0;
      this.configs.body.typeSendMsg = ESendMsgAction.Schedule;
      this.scheduleSpecialFlowDate();
      return;
    } else if (
      this.configs.body.typeSendMsg === ESendMsgAction.SendAndResolve
    ) {
      this.defaultOptionDropdown = 1;
      this.configs.body.typeSendMsg = ESendMsgAction.SendAndResolve;
    } else {
      this.defaultOptionDropdown = 2;
      this.configs.body.typeSendMsg = ESendMsgAction.Send;
    }
  }

  // trigger buttons
  triggerNormalEvent(button: ETrudiSendMsgBtn) {
    if (this.isSendingMsg) return;
    switch (button) {
      case ETrudiSendMsgBtn.BACK:
        this.handleBack();
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
      if (this.selectedFilesFromCMS) {
        const listFilePrefill =
          this.trudiSendMsgHelperFunctionsService.handlePrefillFileUploaded(
            this.selectedFilesFromCMS
          );
        this.listOfFilesControl.setValue([
          ...this.listOfFilesControl.value,
          ...listFilePrefill
        ]);
      }
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

    let listReceivers = await this.handleModifyReceiverData(
      this.selectedReceivers.value
    );
    const isWarrningSchedule =
      data.action === ESendMsgAction.SendAndResolve &&
      listReceivers.some((e) => !!e?.scheduleMessageCount);
    if (isWarrningSchedule) {
      this.conversationService.isShowModalWarrningSchedule.next(true);
      this.isSendingMsg = false;
      return;
    }

    // Check automate similar replies
    const isAutomateSimilar =
      this.trudiSendMsgFormService.sendMsgForm.get('automateSimilar').value;
    if (!data.isDraft && isAutomateSimilar) {
      const { msgContent } = extractQuoteAndMessage(
        this.sendMsgForm.value.msgContent
      );
      const replyMessage = this.configs.otherConfigs.replyMessage
        ?.message?.[0] as MessageObject;
      this.trudiSendMsgService
        .automateSimilarReplies({
          mailBoxId: this.currentMailBoxId,
          question: replyMessage?.value,
          answer: msgContent
        })
        .subscribe((res: IAutomateSimilarRepliesResponse) => {
          const { questionId, hasAnswerIdSimilarRecords } = res;
          this.mailboxSettingService.setQuestionId(questionId);
          this.toastCustomService.handleShowSettingAIReply();
          if (hasAnswerIdSimilarRecords) {
            this.toastCustomService.handleShowMergeToast();
          }
        });
    }

    switch (data.action) {
      case ESendMsgAction.Send:
        this.handleSendMsg(data.isDraft);
        this.trudiSendMsgFormService.setSelectedContactCard([]);
        break;

      case ESendMsgAction.SendAndResolve:
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
        this.handleScheduleSendMessage();
        this.isSendingMsg = false;
        break;

      default:
        this.nextDropDown.emit(this.sendMsgForm.value);
        break;
    }
  }

  handleBack() {
    this.back.emit();
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
      this.selectedReceivers.value
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
      this.selectedTasks,
      this.allowInsertContactCardToContent
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
          this.sendMsg.emit({
            type: ISendMsgType.SCHEDULE_MSG,
            event: ESentMsgEvent.SUCCESS,
            data: response,
            receivers: receivers,
            draftMsgId: this.trudiSaveDraftService.getDraftMsgId
          });
          this.trudiSaveDraftService.setDraftMsgId(null);
          this.isSendingMsg = false;
          this.showToastMsg(
            ESentMsgEvent.SUCCESS,
            numberOfMessages,
            true,
            response
          );
          this.conversationService.reloadConversationList.next(true);
        },
        error: () => {
          this.isSendingMsg = false;
          this.showToastMsg(ESentMsgEvent.ERR, numberOfMessages, true);
          this.sendMsg.emit({
            type: ISendMsgType.SCHEDULE_MSG,
            event: ESentMsgEvent.ERR
          });
        },
        complete: () => {
          this.sendMsg.emit({
            type: ISendMsgType.SCHEDULE_MSG,
            event: ESentMsgEvent.COMPLETED
          });
          this.configs.body.timeSchedule = null;
          this.trudiSendMsgFormService.sendMsgForm.reset();
          this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
        }
      });
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

  handleUpdateStyleOfDynamicParam(
    listParams,
    listInvalidParams: Object,
    msgContent
  ) {
    return listParams.reduce((text, p) => {
      const validDynamic = `<span style="color: var(--fg-brand, #28ad99);" contenteditable="false">${p}</span>`;
      const inValidDynamic = `<span style="color: var(--danger-500, #fa3939);" title="#missing_users" contenteditable="false">${p}</span>`;
      const invalidPrefixRegex = new RegExp(
        `<span\\sstyle="color:\\svar\\(--danger-500, #fa3939\\);"[^\\>]*>${
          p.startsWith('$') ? '\\' : ''
        }${p}<\\/span>`,
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
          .map((receiver) => {
            const isNoPropertyConversation = !this.property?.value;
            const isMatchingPropertyWithConversation =
              this.property?.value?.id === receiver.propertyId;

            return this.contactTitleByConversationPropertyPipe.transform(
              receiver,
              {
                isNoPropertyConversation,
                isMatchingPropertyWithConversation,
                showOnlyName: true
              }
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
      this.configs.body.timeSchedule = this.selectTimeSchedule;
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
  }

  getListJobReminders(conversationId: string) {
    this.trudiScheduledMsgService.jobRemindersCount(conversationId).subscribe();
  }

  // handle send msg
  async handleSendMsg(isDraft = false) {
    switch (this.configs.otherConfigs.createMessageFrom) {
      case ECreateMessageFrom.TASK_HEADER:
      case ECreateMessageFrom.SCRATCH:
      case ECreateMessageFrom.TASK_STEP: {
        let formData = {
          ...this.sendMsgForm.getRawValue()
        };

        if (
          [
            ECreateMessageFrom.TASK_HEADER,
            ECreateMessageFrom.TASK_STEP
          ].includes(this.configs.otherConfigs.createMessageFrom)
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
          isDraft,
          false,
          this.allowInsertContactCardToContent
        );
        this.send(bulkEventBody, isDraft);
        break;
      }
      case ECreateMessageFrom.MULTI_MESSAGES:
      case ECreateMessageFrom.CONTACT:
      case ECreateMessageFrom.MULTI_TASKS: {
        //Todo only add conversationId to receiver data when user participate in a conversation only has 1 recipients
        let listReceivers = await this.handleModifyReceiverData(
          this.selectedReceivers.value
        );
        const formData = {
          ...this.sendMsgForm.value,
          selectedReceivers: listReceivers
        };
        let body = this.trudiSendMsgService.getSendManyMsgBodyv2(
          formData,
          this.configs,
          this.selectedTasks,
          isDraft,
          this.allowInsertContactCardToContent
        );
        if (this.trudiSaveDraftService.getSessionId) {
          body.sessionId = this.trudiSaveDraftService.getSessionId;
        }
        this.sendMany(body, isDraft);
        break;
      }
    }
  }

  send(body, isDraft = false) {
    this.isSendingMsg = true;
    this.showToastMsg(ESentMsgEvent.SENDING);
    this.trudiSendMsgService.sendMessageV2(body).subscribe({
      next: (res) => {
        // TODO: HANDLE AFTER HAS RESPONSE
        // TODO: remove any
        if (!isDraft) {
          this.trudiSaveDraftService.setDraftMsgId(null);
          this.trudiSaveDraftService.setSessionId(null);
        }
        const data = res as ISendMsgResponseV2;
        if (
          this.configs.otherConfigs.isFromDraftFolder &&
          !data?.message.isDraft
        ) {
          this.toastCustomService.handleShowToastForDraft(
            res,
            SocketType.newTask,
            data?.task?.type || TaskType.MESSAGE,
            body?.actionFlags?.resolveConversation
              ? TaskStatusType.completed
              : TaskStatusType.inprogress,
            true
          );
        } else {
          this.sendMsg.emit({
            event: ESentMsgEvent.SUCCESS,
            data: res as ISendMsgPayload,
            mailBoxId: body?.mailBoxId,
            receivers: this.selectedReceivers.value,
            isDraft
          });
        }
        this.headerService.setIsSendBulkMessage(false);

        if (res['fileMessages']?.length) {
          this.filesService.reloadAttachments.next(true);
        }

        this.conversationService.reloadConversationList.next(true);
        if (data?.task?.id && !isDraft)
          this.confirmCreateLinkReiForm(data.task.id);
      },
      error: (err) => {
        if (err.message)
          this.toastService.error('Message is not found. Please check again.');
        this.isSendingMsg = false;
        this.sendMsg.emit({
          event: ESentMsgEvent.ERR
        });
      },
      complete: () => {
        this.isSendingMsg = false;
        this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
        this.reiFormService.currentReiFormData$.next(null);
        this.sendMsg.emit({
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
        this.sendMsg.emit({
          event: ESentMsgEvent.SUCCESS,
          data: res as ISendManyMsgPayload,
          mailBoxId: sendManyMsgPayload?.mailBoxId,
          receivers: this.selectedReceivers.value,
          isDraft
        });
        const data = res as ISendMsgResponseV2[];
        if (!isDraft && Array.isArray(data)) {
          const listTaskIds = [
            ...new Set(
              data
                .map((item) => item?.emailMessage?.taskId || item?.task?.id)
                .filter(Boolean)
            )
          ];
          listTaskIds.forEach((taskId) => {
            this.confirmCreateLinkReiForm(taskId);
          });
        }
      },
      error: () => {
        this.isSendingMsg = false;
        this.sendMsg.emit({
          event: ESentMsgEvent.ERR
        });
      },
      complete: () => {
        this.isSendingMsg = false;
        this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
        this.reiFormService.currentReiFormData$.next(null);
        this.sendMsg.emit({
          event: ESentMsgEvent.COMPLETED
        });
      }
    });
  }

  async handleModifyReceiverData(selectedReceivers) {
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
        const key = `${item?.id}_${item?.propertyId}_${
          item.secondaryEmail?.id || item.secondaryEmailId || ''
        }`;

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

    const listConversations = await firstValueFrom(
      this.conversationService.listConversationByTask
    );
    const senderMailboxId = this.sendMsgForm?.value.selectedSender?.mailBoxId;
    // Handle Unidentified participant and extra recipients for task step
    if (createMessageFrom === ECreateMessageFrom.TASK_STEP) {
      if (this.listParamData?.length === 1) {
        const listReceiverMapped = this.listParamData.map((receiver) => {
          const conversationLink = findConversationLink({
            receiver,
            task: null,
            senderMailboxId,
            listConversations,
            createMessageFrom,
            propertyId: this.property.value?.id
          });
          return {
            ...receiver,
            conversationId: conversationLink?.id || null,
            scheduleMessageCount: conversationLink?.scheduleMessageCount
          };
        });
        this.listParamData = listReceiverMapped;
      }
      return this.listParamData;
    }

    // handle retrieves the number of messages to send on Send message for multi tasks
    if (createMessageFrom === ECreateMessageFrom.MULTI_TASKS) {
      // TODO: don't use
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
        this.listParamData = this.selectedTasks?.flatMap((task) =>
          this.listParamData.map((receiver) => {
            const conversationLink = findConversationLink({
              receiver,
              task,
              senderMailboxId,
              listConversations,
              createMessageFrom,
              propertyId: this.property.value?.id
            });
            return {
              ...task,
              ...receiver,
              conversationId: conversationLink?.id || null,
              scheduleMessageCount: conversationLink?.scheduleMessageCount
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
          const combinedItem = {
            ...receiver,
            ...matchingSelectedTask,
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
    let propertyId = this.property?.value?.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taskData = this.selectedTasks?.[0] || ({} as any);
    const otherConfigs = this.configs.otherConfigs;
    let conversation = null;
    if (
      otherConfigs.isForwardConversation ||
      otherConfigs.isForwardOrReplyMsg
    ) {
      conversation = this.conversationService.currentConversation?.value;
      if (taskData?.summary?.length)
        taskData.summary =
          taskData?.summary?.find(
            (item) => item?.conversationId === conversation?.id
          ) || {};
    }
    if (propertyId && propertyId !== this._propertyData?.property?.id) {
      this._propertyData = await this.getPropertyDataToPrefillDynamicParams(
        propertyId
      );
    }
    if (receiverData.length === 1) {
      this.trudiSendMsgService.dataToPrefillForSendBulk = {
        ...taskData,
        ...(this._propertyData
          ? { ...receiverData[0], ...this._propertyData }
          : receiverData[0])
      };
    } else {
      this.trudiSendMsgService.dataToPrefillForSendBulk = {
        ...taskData,
        ...(this._propertyData ? this._propertyData : {})
      };
    }

    this.listParamData = receiverData.map((data) => ({
      ...taskData,
      scheduleMessageCount: conversation?.scheduleMessageCount,
      ...(this._propertyData ? { ...data, ...this._propertyData } : data)
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
          this.sendMsg.emit({
            type: msgType,
            event: ESentMsgEvent.SUCCESS
            /* data: res,
          receivers: this.selectedReceivers.value, */
          });
        },
        error: () => {
          this.sendMsg.emit({
            type: msgType,
            event: ESentMsgEvent.ERR
          });
        },
        complete: () => {
          this.sendMsg.emit({
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
    if (this.trudiSaveDraftService.hasControlChanges) {
      this.handleConfirmDraft();
      return;
    }
    this.quit.emit();
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
    this.trudiSaveDraftService.setListFileUploaded([]);
    this.trudiSaveDraftService.setSessionId(null);
    this.trudiSaveDraftService.setDraftMsgId(null);
  }

  onConfirmQuit(isQuit: boolean) {
    if (isQuit) {
      this.quit.emit();
      this.trudiSendMsgService.resetCheckBox();
      this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
    }
    this.trudiSendMsgService.setPopupState({
      sendMessage: isQuit,
      selectTimeSchedule: !isQuit,
      closeConfirm: !isQuit
    });
  }

  backSendMsg(isQuit: boolean) {
    if (isQuit) {
      this.quit.emit();
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

  handleShowTimeSchedule(dateTime: string) {
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
    const hiddenVariables = ['Request summary'];
    if (isCreateMessageOutOfTask(this.configs)) {
      titleOrder = titleOrder.filter((item) => !hiddenVariables.includes(item));
    }
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
    this.back.emit();
    this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
  }

  handleConfirmDraft() {
    this.trudiSaveDraftService.resetTrackControl();
    this.isClosingPopup = true;
    this.handleAutoSaveDraft(true);
    if (
      this.configs.otherConfigs.createMessageFrom ===
      ECreateMessageFrom.TASK_HEADER
    )
      return;
    this.onCloseSendMsg();
  }

  subscribeFormChanges() {
    this.trudiSaveDraftService.triggerControlChange$
      .pipe(
        debounceTime(3000),
        filter(() => !this.isClosingPopup),
        takeUntil(this.unsubscribe)
      )
      .subscribe(() => {
        if (this.isFirstTimeSaveDraft) {
          if (!this.trudiSaveDraftService.getSessionId) {
            this.trudiSaveDraftService.setSessionId(uuidv4());
          }
          !this.trudiSaveDraftService.getDraftMsgId &&
            this.trudiSaveDraftService.setDraftMsgId(uuidv4());
          this.isFirstTimeSaveDraft = false;
        }
        this.handleAutoSaveDraft();
      });
  }

  async handleAutoSaveDraft(isClose = false) {
    if (this.isConsole) return;
    this.trudiSaveDraftService.resetTrackControl();
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
          true,
          false,
          this.allowInsertContactCardToContent
        );
        if (!isClose) {
          bulkEventBody.isAutoSaveDraft = true;
        }
        this.saveDraft(bulkEventBody);
        break;
      }
    }
  }
  getInvidualSupplierContactCard() {
    const { contactData = [], contactCardType } =
      (this.configs.trudiButton as TrudiStep)?.fields?.customControl || {};
    if (
      contactCardType === EContactCardType.INDIVIDUAL_SUPPLIER &&
      contactData.length
    ) {
      this.userService
        .getListSupplier('', '', '', false, '', true, contactData)
        .subscribe((res) => {
          const listContactCard =
            res.list
              .filter((sup) => contactData.includes(sup.id))
              .map((supplier) => ({
                ...supplier,
                contactType: supplier?.type
              })) || [];
          this.selectedContactCardControl.setValue(listContactCard);
          this.trudiDynamicParameterService.triggerPrefillParameter.next(true);
        });
    }
  }
  saveDraft(body) {
    if (this.isSendingMsg) return;
    this.trudiSaveDraftService
      .saveDraft(
        body,
        !body.isAutoSaveDraft,
        this.configs.otherConfigs.isFromDraftFolder
      )
      .pipe(
        finalize(() => {
          if (
            !body.isAutoSaveDraft &&
            this.configs.otherConfigs.createMessageFrom ===
              ECreateMessageFrom.TASK_HEADER
          ) {
            this.onCloseSendMsg();
          }
        })
      )
      .subscribe();
  }

  handleChangeFormValue(key) {
    this.trudiSaveDraftService.setTrackControlChange(key, true);
  }

  ngOnDestroy(): void {
    this.trudiSaveDraftService.resetTrackControl();
    this.trudiSendMsgFormService.sendMsgForm.reset();
    this.configs.footer.buttons.dropdownList.sort((a, b) => a.id - b.id);
    this.trudiSendMsgService.setViewRecipientList(null);
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.trudiSendMsgService.setShowPreview(true);
    this.trudiSendMsgService.openFromVacateSchedule$.next(false);
    this.trudiSaveDraftService.isLoadingUploadFile = false;
  }
}
