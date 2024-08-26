import { convertUTCToLocalDateTime } from '@core';
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
import { cloneDeep, groupBy } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  Subject,
  combineLatest,
  first,
  of,
  switchMap,
  takeUntil,
  firstValueFrom,
  debounceTime,
  concatMap,
  BehaviorSubject
} from 'rxjs';
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
import {
  ActionSendMsgDropdown,
  ESendMsgAction,
  ISendMsgBody
} from '@/app/routine-inspection/utils/routineType';
import { ActionDefaultScheduleButton } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { ReiFormService } from '@services/rei-form.service';
import { SendMessageService } from '@services/send-message.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
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
import { EMailBoxStatus, EMailBoxType } from '@shared/enum/inbox.enum';
import { TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { CurrentUser, IMailBox } from '@shared/types/user.interface';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EDefaultBtnDropdownOptions,
  ITrudiScheduledMsgInfo
} from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import { TrudiScheduledMsgService } from '@/app/trudi-scheduled-msg/services/trudi-scheduled-msg.service';
import { TrudiDynamicParameterService } from './services/trudi-dynamic-paramater.service';
import { TrudiSendMsgFormService } from './services/trudi-send-msg-form.service';
import {
  IGetDynamicFieldsDataMessageScratchPayload,
  TrudiSendMsgUserService
} from './services/trudi-send-msg-user.service';
import { TrudiSendMsgService } from './services/trudi-send-msg.service';
import {
  findConversationLink,
  getCalendarEventData,
  getCalendarEventFromSelectedTasks,
  getDefaultTaskDetailMailBox,
  getDynamicParamListFromMsg,
  getListActiveMailBox,
  getListSenderMailBox,
  getUniqReceiverData,
  handleDisabledDynamicParamsByProperty,
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
  IContactInfoPrefill,
  IDefaultValueTrudiSendMsg,
  IFromUserMailBox,
  ISelectedReceivers,
  ISendManyMsgPayload,
  ISendMsgConfigs,
  ISendMsgResponseV2,
  ISendMsgTriggerEvent,
  ISendMsgType
} from './utils/trudi-send-msg.interface';
import { isArray } from 'lodash-es';
import { convertTime12to24 } from '@/app/leasing/utils/functions';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { PropertiesService } from '@services/properties.service';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { CompanyService } from '@services/company.service';
import { filter } from 'rxjs';
import { ResizableModalPopupComponent } from '@shared/components/resizable-modal/resizable-modal-popup';
import { TrudiSendMsgHelperFunctionsService } from '@/app/trudi-send-msg/services/trudi-send-msg-helper-functions.service';
import { TrudiConfirmRecipientService } from '@/app/trudi-send-msg/services/trudi-confirm-recipients.service';
import { TrudiSaveDraftService } from './services/trudi-save-draft.service';
import { LoadingService } from '@services/loading.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import {
  ITaskInfoToGetDataPrefill,
  ITasksForPrefillDynamicData
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { EUploadFileType } from '@shared/components/upload-from-crm/upload-from-crm.interface';
import { ICompany } from '@shared/types/company.interface';
import { HelperService } from '@services/helper.service';
import { EModalID } from '@/app/dashboard/services/modal-management.service';
import { TrudiBulkSendMsgRightComponent } from './components/trudi-bulk-send-msg-container/trudi-bulk-send-msg-right/trudi-bulk-send-msg-right.component';
import { AiInteractiveBuilderService } from '@/app/shared';

@Component({
  selector: 'trudi-bulk-send-msg',
  templateUrl: './trudi-bulk-send-msg.component.html',
  styleUrls: ['./trudi-bulk-send-msg.component.scss'],
  providers: [
    TrudiSendMsgUserService,
    TrudiSendMsgFormService,
    TrudiConfirmRecipientService,
    TrudiSendMsgHelperFunctionsService,
    LoadingService
  ]
})
export class TrudiBulkSendMsgComponent implements OnInit, OnChanges, OnDestroy {
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
    private reiFormService: ReiFormService,
    private filesService: FilesService,
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
    private toastCustomService: ToastCustomService,
    private companyService: CompanyService,
    private taskApiService: TaskApiService,
    private trudiSendMsgHelperFunctionsService: TrudiSendMsgHelperFunctionsService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private trudiConfirmRecipient: TrudiConfirmRecipientService,
    private inboxToolbarService: InboxToolbarService,
    private helperService: HelperService,
    private aiInteractiveBuilderService: AiInteractiveBuilderService
  ) {}
  @ViewChild('dropdown') dropdown: ElementRef;
  @ViewChild('footerTemplate') footerTemplate: ElementRef;
  @ViewChild('resizableContainer')
  resizableContainer: ResizableModalPopupComponent;
  @ViewChild('bulkSendMsgRight')
  msgRightContainer: TrudiBulkSendMsgRightComponent;
  @Input() configs: ISendMsgConfigs = cloneDeep(defaultConfigs);
  @Input() defaultBtnOption: EDefaultBtnDropdownOptions; //configs
  @Input() listDynamicFieldData: string[] = []; //configs
  @Input() mailBoxIdFromCalender: string = ''; //configs
  @Input() isInternalNote: boolean = false; //config
  @Output() onBack = new EventEmitter();
  @Output() onQuit = new EventEmitter();
  @Output() onSendMsg = new EventEmitter<ISendMsgTriggerEvent>();
  @Output() onNextDropdown = new EventEmitter();
  @Output() onSendScheduleVacate = new EventEmitter();

  private _selectedTask: ITasksForPrefillDynamicData[] = [];
  set selectedTasks(tasks: ITasksForPrefillDynamicData[]) {
    this._selectedTask = tasks;
    const uniquePropertyIds = new Set(
      tasks.map((task) => task.property.streetLine)
    );
    if (uniquePropertyIds.size === 1 && [...uniquePropertyIds][0]) {
      this.trudiSendMsgFormService.property.setValue(tasks[0].property);
    }
  }
  public get selectedTasks() {
    return this._selectedTask;
  }
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
  public isSubmitted = false;
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
  isDisabledSendBtn: boolean = false;
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
  public hasConfirmRecipientModalBackBtn = false;
  public toolbarTinySendActionTemplate;
  public toolbarTinyTemplate;
  public toolbarTinyContext;
  public isSendMsgProcessing: boolean = false;
  public currentCompany: ICompany;
  public fetchTasksData$ = new BehaviorSubject<ITaskInfoToGetDataPrefill[]>(
    null
  );
  // public isFirstTimeSaveDraft = true;

  public isShowConfirmDraft: boolean = false;
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

  get isSendSingleEmail() {
    const typeSend =
      (this.configs.trudiButton as TrudiStep)?.fields.typeSend ||
      this.configs.inputs.prefillData?.fields?.typeSend;
    return typeSend === ETypeSend.SINGLE_EMAIL;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configs']) {
      this.configs = updateConfigs(cloneDeep(defaultConfigs), this.configs);
      this.trudiSendMsgService.configs.value = this.configs;
      this.isDisabledSendBtn = this.configs?.footer?.buttons?.disableSendBtn;
      this.trudiSendMsgFormService.setSignatureContentMsgValidate(
        this.configs.otherConfigs.isValidSigContentMsg
      );
      if (this.configs.inputs.selectedTasksForPrefill) {
        this.fetchTasksData$.next(this.configs.inputs.selectedTasksForPrefill);
      }
    }
  }

  ngOnInit(): void {
    this.hasConfirmRecipientModalBackBtn =
      this.configs.footer.buttons.showConfirmRecipientBackBtn;
    this.defaultBtnOption = this.configs.inputs.defaultBtnOption;
    this.isInternalNote = this.configs.inputs.isInternalNote;
    this.listDynamicFieldData = this.configs.inputs.listDynamicFieldData;
    this.mailBoxIdFromCalender = this.configs.inputs.mailBoxIdFromCalender;
    this.isConsole = this.sharedService.isConsoleUsers();
    this.checkDisableBtnNext();
    this.selectedTaskIds = this.configs.inputs.selectedTasksForPrefill?.map(
      (item) => item.taskId
    );

    this.trudiSendMsgService.triggerStep$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs) {
          this.configs = updateConfigs(cloneDeep(defaultConfigs), rs);
          this.trudiSendMsgService.configs.value = this.configs;
          this.listDynamicFieldData = this.configs.inputs.listDynamicFieldData;
          this.msgTitle.setValue(this.configs.body.prefillTitle);
          this.listOfFilesControl.setValue(this.configs.inputs.listOfFiles);
        }
      });
    this.fetchTasksData$
      .pipe(
        takeUntil(this.unsubscribe),
        debounceTime(50),
        filter((data) => Boolean(data) && Boolean(data.length)),
        concatMap((tasks) => {
          this.trudiConfirmRecipient.setTaskLoading(true);
          return this.taskApiService.getInfoTasksForPrefillDynamicParam({
            tasks: tasks
          });
        })
      )
      .subscribe((rs) => {
        this.trudiConfirmRecipient.setTaskLoading(false);
        this.selectedTasks = rs;
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
        this.listMailBoxs = getListActiveMailBox(listMailBoxs);
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
          this.currentCompany = value;
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(value);
        }
      });

    this.getProperties();
    this.initForm();
    this.initContactForm();
    this.getInvidualSupplierContactCard();
    this.handleSetDefaultPopupState();
    this.handleChangeDefaultDropdownButton();
    this.handlePrefillFiles();
    this.getDataByCRM();
    // this.subscribeFormChanges();
    this.onDisabledDynamicParamsByProperty();
    this.selectedReceivers.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.onDisabledDynamicParamsByProperty(); // update in case send bulk messages
      });
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

  onDisabledDynamicParamsByProperty() {
    if (!this.configs.body.tinyEditor.isShowDynamicFieldFunction) return;

    switch (this.configs.otherConfigs.createMessageFrom) {
      case ECreateMessageFrom.MULTI_MESSAGES:
        this.listDynamicParams = handleDisabledDynamicParamsByProperty(
          this.listDynamicParams,
          this.selectedReceivers?.value?.some(
            (message) =>
              message.propertyId &&
              (message.streetLine || message.shortenStreetline)
          ),
          this.currentCompany?.agencies
        );
        break;
      default:
    }
  }

  getReceiverData() {
    let tempData = [
      ...(this.selectedReceivers?.value ?? []),
      ...(this.ccReceivers?.value ?? []),
      ...(this.bccReceivers?.value ?? [])
    ];
    return getUniqReceiverData(tempData);
  }

  handleSetDefaultPopupState() {
    const createFrom = this.configs.otherConfigs.createMessageFrom;
    if (createFrom === ECreateMessageFrom.MULTI_TASKS) {
      this.trudiSendMsgService.setPopupState({
        selectRecipients: true,
        sendMessage: false
      });
      return;
    }
    this.trudiSendMsgService.setPopupState({
      sendMessage: true,
      selectRecipients: false
    });
  }

  setTemplateContext(template, sendActionTemp, context) {
    this.toolbarTinySendActionTemplate = sendActionTemp;
    this.toolbarTinyTemplate = template;
    this.toolbarTinyContext = context;
  }

  // Init functions
  initForm() {
    this.trudiSaveDraftService.resetTrackControl();
    this.trudiSendMsgFormService.buildFormV2(this.formDefaultValue, true);
    if (!!this.configs.body.defaultSendOption) {
      this.sendOption.setValue(this.configs.body.defaultSendOption);
    }
    if (this.configs.inputs.listOfFiles) {
      const listFilePrefill =
        this.trudiSendMsgHelperFunctionsService.handlePrefillFileUploaded(
          this.configs.inputs.listOfFiles
        );
      this.configs.inputs.listOfFiles = listFilePrefill;
      this.listOfFilesControl.setValue(this.configs.inputs.listOfFiles);
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
      this.selectedReceivers.setValue(this.configs.inputs.listUser);
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

  initContactForm() {
    const createMessageFrom = this.configs?.otherConfigs.createMessageFrom;
    const taskDetail = this.configs?.serviceData?.taskService?.currentTask;
    switch (createMessageFrom) {
      case ECreateMessageFrom.MULTI_TASKS:
        this.trudiConfirmRecipient.buildFormArray(
          this.configs.inputs.selectedTasksForPrefill || []
        );
        break;
      case ECreateMessageFrom.CONTACT:
        const isProspect = this.configs.otherConfigs.isProspect;
        if (isProspect) {
          this.trudiConfirmRecipient.buildFormArray([
            {
              propertyId: null,
              streetLine: null
            }
          ]);
          this.selectedTasks = [
            {
              taskId: null,
              summary: null,
              conversations: [],
              property: {
                id: null,
                regionName: null,
                shortenStreetLine: null,
                streetLine: null
              },
              ownerships: null,
              tenancies: null
            }
          ];
        } else {
          const propertyMap = groupBy(
            this.configs.body.prefillReceiversList,
            'propertyId'
          );
          const properties = Object.keys(propertyMap).map((propertyId) => ({
            propertyId: propertyId,
            streetLine: propertyMap[propertyId][0]?.streetLine
          }));
          this.selectedTasks = properties.map((property) => ({
            taskId: null,
            summary: null,
            conversations: [],
            property: {
              id: property.propertyId,
              regionName: null,
              shortenStreetLine: property.streetLine,
              streetLine: property.streetLine
            },
            ownerships: null,
            tenancies: null
          }));
          this.trudiConfirmRecipient.buildFormArray(properties);
        }

        break;
      case ECreateMessageFrom.TASK_STEP:
        const currentTask = this.configs.serviceData.taskService.currentTask;
        this.selectedTasks = [
          {
            taskId: currentTask.id,
            summary: null,
            conversations: [],
            property: {
              id: currentTask.property.id,
              regionName: null,
              shortenStreetLine: currentTask.property?.shortenStreetline,
              streetLine: currentTask?.property?.streetline
            },
            taskTitle: currentTask.title || currentTask.indexTitle,
            ownerships: null,
            tenancies: null
          }
        ];
        this.trudiConfirmRecipient.buildFormArray([
          {
            propertyId: taskDetail?.property?.id,
            taskId: taskDetail.id,
            streetLine: taskDetail?.property.streetline
          } as ITaskInfoToGetDataPrefill & IContactInfoPrefill
        ]);
        break;
      default:
        break;
    }
  }

  get formDefaultValue(): IDefaultValueTrudiSendMsg {
    const defaultMailbox = [
      ECreateMessageFrom.TASK_STEP,
      ECreateMessageFrom.MULTI_TASKS
    ].includes(this.configs.otherConfigs.createMessageFrom)
      ? getDefaultTaskDetailMailBox(this.listSenderMailBox, this.configs)
      : this.listSenderMailBox.find(
          (sender) => sender.id === this.configs.body.prefillSender
        ) ||
        this.listSenderMailBox.find(
          (sender) =>
            sender.id === this.currentUser.id &&
            sender.mailBoxId === this.currentMailBoxId
        );
    return {
      selectedSender: defaultMailbox,
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
      selectedContactCard: this.configs.inputs.listContactCard ?? [],
      selectedTasks: this.configs.inputs?.selectedTasksForPrefill || []
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
      this.currentPropertyId = this.configs.otherConfigs.conversationPropertyId;
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
    if (isFromScheduleButton) {
      this.defaultOptionDropdown = 0;
      this.configs.body.typeSendMsg = ESendMsgAction.Schedule;
      this.handleScheduleReminder();
      return;
    }
    this.defaultOptionDropdown = 2;
    this.configs.body.typeSendMsg = ESendMsgAction.Send;
  }

  triggerBack() {
    if (this.isSendingMsg) return;
    this.handleBack();
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
        this.sendMsgForm.value.msgContent,
        data
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
        break;

      default:
        this.onNextDropdown.emit(this.sendMsgForm.value);
        break;
    }
  }

  handleBack() {
    this.onBack.emit(EModalID.BulkSendMsg);
    this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
  }

  handleEditConfirmRecipient() {
    this.hasConfirmRecipientModalBackBtn = true;
    this.isSendMsgProcessing = true;
    this.trudiSendMsgService.setPopupState({
      sendMessage: false,
      selectRecipients: true
    });
  }

  handleBackFromConfirm() {
    if (this.isSendMsgProcessing) {
      this.openSendMsgModal();
      return;
    }
    this.onBack.emit(EModalID.SelectRecipients);
  }

  handleCloseFromConfirm() {
    this.onCloseSendMsg();
  }

  handleNextFromConfirm() {
    this.openSendMsgModal();
    this.msgRightContainer.handleFocusEditor();
  }

  openSendMsgModal() {
    this.trudiSendMsgService.setPopupState({
      sendMessage: true,
      selectRecipients: false
    });
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
          this.trudiSendMsgService.setPopupState({
            sendMessage: false,
            closeConfirm: false,
            addReiForm: false,
            selectRecipients: false
          });
          this.configs.body.timeSchedule = null;
          this.trudiSendMsgFormService.sendMsgForm.reset();
          this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
        }
      });
  }

  // handle highline dynamic parameters and show missing data modal
  async checkValidityDynamicParam(msgContent, data: ActionSendMsgDropdown) {
    let listReceivers = await this.handleModifyReceiverData(
      this.selectedReceivers.value
    );
    const isWarrningSchedule =
      data.action === ESendMsgAction.SendAndResolve &&
      listReceivers.some((e) => !!e?.scheduleMessageCount);
    if (isWarrningSchedule) {
      this.conversationService.isShowModalWarrningSchedule.next(true);
      return false;
    }

    this.isValidMsg = false;
    const listParams = getDynamicParamListFromMsg(msgContent);
    if (!listParams.length) {
      this.isValidMsg = true;
      return true;
    }
    // In the case of sending a message, the message will be sent immediately if there is no missing data
    // without needing to update highline dynamic parameters and show missing data modal.
    if (!listParams.length) {
      return true;
    }

    let listParamValues = this.listDynamicParams
      .map((item) => item.menu.map((p) => p.param))
      .flat();
    let invalidParamsMap = {};

    let validationDynamicFieldFunctions = this.getValidationDynamicParam(
      listReceivers,
      false
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
    this.configs.inputs.rawMsg = this.handleUpdateStyleOfDynamicParam(
      listParams,
      invalidParamsMap,
      msgContent
    );

    this.cdr.detectChanges();

    if (!Object.keys(invalidParamsMap).length) {
      this.isValidMsg = true;
      return true;
    }

    //Show modal warnings
    this.invalidParamsMap = invalidParamsMap;
    this.isShowMissingDataModal = true;
    this.cdr.detectChanges();
    return false;
  }

  getValidationDynamicParam(listReceivers, isInvalidReceivers = false) {
    return this.trudiDynamicParameterService.validationDynamicFieldFunctions(
      listReceivers,
      this.sendMsgForm.value.selectedSender,
      this.trudiSendMsgService.currentCompany,
      getCalendarEventData(this.selectedTasks, null) || [],
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
        `<span\\sstyle="color:\\svar\\(--danger-500, #fa3939\\);"[^\\>]*>\\${p}<\\/span>`,
        'gim'
      );
      if (listInvalidParams[p]) {
        let listReceiverByTypeParam = listInvalidParams[p];
        switch (this.configs?.otherConfigs.createMessageFrom) {
          case ECreateMessageFrom.MULTI_MESSAGES:
            listReceiverByTypeParam = listInvalidParams[p]
              .map((item) => {
                return item?.participants;
              })
              .flat();
            break;
          case ECreateMessageFrom.MULTI_TASKS:
            if (this.isSendSingleEmail) {
              listReceiverByTypeParam = listInvalidParams[p]
                .map((item) => {
                  return item?.recipients;
                })
                .flat();
            }
            break;
        }
        const missingParamUsers = [
          ...new Set(
            getUniqReceiverData(listReceiverByTypeParam)
              .map((user) => {
                if (
                  user.type === EUserPropertyType.EXTERNAL ||
                  user.type === EUserPropertyType.UNIDENTIFIED
                ) {
                  return user.email;
                }
                return this.sharedService.displayName(
                  user.firstName,
                  user.lastName
                );
              })
              .filter(Boolean)
          )
        ].join(', ');
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

  getListJobReminders(conversationId: string) {
    this.trudiScheduledMsgService.jobRemindersCount(conversationId).subscribe();
  }

  // handle send msg
  async handleSendMsg(isDraft = false) {
    switch (this.configs.otherConfigs.createMessageFrom) {
      case ECreateMessageFrom.MULTI_MESSAGES:
      case ECreateMessageFrom.CONTACT:
      case ECreateMessageFrom.MULTI_TASKS:
      case ECreateMessageFrom.TASK_STEP: {
        //Todo only add conversationId to receiver data when user participate in a conversation only has 1 recipients
        let listReceivers = await this.handleModifyReceiverData(
          this.selectedReceivers.value
        );
        const formData = {
          ...this.sendMsgForm.value,
          selectedReceivers: listReceivers,
          ccReceivers: this.ccReceivers.value,
          bccReceivers: this.bccReceivers.value
        };
        let body = this.isSendSingleEmail
          ? this.trudiSendMsgService.getSendManyGroupMsgBody(
              formData,
              this.configs,
              this.selectedTasks,
              isDraft,
              this.allowInsertContactCardToContent
            )
          : this.trudiSendMsgService.getSendManyMsgBodyv2(
              formData,
              this.configs,
              this.selectedTasks,
              isDraft,
              this.allowInsertContactCardToContent
            );
        // if (this.trudiSaveDraftService.getSessionId) {
        //   body.sessionId = this.trudiSaveDraftService.getSessionId;
        // }
        this.trudiSendMsgService.setPopupState({
          sendMessage: false,
          closeConfirm: false,
          addReiForm: false,
          selectRecipients: false
        });
        this.aiInteractiveBuilderService.destroyAiBubble();
        this.inboxToolbarService.setInboxItem([]);
        this.sendMany(body, isDraft);
        break;
      }
    }
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
        // if (!isDraft) {
        //   this.trudiSaveDraftService.setDraftMsgId(null);
        //   this.trudiSaveDraftService.setSessionId(null);
        // }
        this.onSendMsg.emit({
          event: ESentMsgEvent.SUCCESS,
          data: res as ISendManyMsgPayload,
          mailBoxId: sendManyMsgPayload?.mailBoxId,
          receivers: this.selectedReceivers.value,
          isDraft
        });
        const data = res as ISendMsgResponseV2[];

        if (data.some((item) => item['fileMessages']?.length)) {
          this.filesService.reloadAttachments.next(true);
        }

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
      if (formIds.length > 0) {
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
  }

  async handleModifyReceiverData(selectedReceivers) {
    let createMessageFrom = this.configs.otherConfigs.createMessageFrom;
    // Note: Mapping data is unnecessary when the message content contains valid parameters.
    if (
      this.isAllowKeepGoingToSendMessage ||
      (this.isValidMsg && createMessageFrom === ECreateMessageFrom.CONTACT)
    ) {
      return !this.listParamData.length
        ? selectedReceivers
        : this.listParamData;
    }

    if (createMessageFrom === ECreateMessageFrom.CONTACT) {
      return await this.handleGetDataToPrefillForSendContact(selectedReceivers);
    }

    if (
      !this.configs.body.receiver.isShowContactType &&
      ![
        ECreateMessageFrom.MULTI_MESSAGES,
        ECreateMessageFrom.MULTI_TASKS,
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

    const listConversations = await firstValueFrom(
      this.conversationService.listConversationByTask
    );
    const senderMailboxId = this.sendMsgForm?.value.selectedSender?.mailBoxId;
    // Handle Unidentified participant and extra recipients for task step
    if (createMessageFrom === ECreateMessageFrom.TASK_STEP) {
      const dynamicTaskData = this.selectedTasks?.[0] || {};
      const listReceiverMapped = this.listParamData.map((receiver) => {
        const conversationLink = findConversationLink({
          receiver,
          task: null,
          senderMailboxId,
          listConversations,
          createMessageFrom,
          propertyId: null
        });

        return {
          ...receiver,
          ...dynamicTaskData,
          conversationId: conversationLink?.id || null,
          scheduleMessageCount: conversationLink?.scheduleMessageCount
        };
      });
      this.listParamData = listReceiverMapped;
      return this.listParamData;
    }

    // handle retrieves the number of messages to send on Send message for multi tasks
    if (createMessageFrom === ECreateMessageFrom.MULTI_TASKS) {
      listReceiversUpdated = this.selectedTasks?.flatMap((task) =>
        this.listParamData.map((receiver) => {
          //find conversations have this receiver and have 1 participant
          const conversationLink = findConversationLink({
            receiver,
            task,
            senderMailboxId,
            listConversations,
            createMessageFrom,
            propertyId: null
          });
          return {
            ...receiver,
            ...task,
            conversations: !!conversationLink ? [conversationLink] : [],
            conversationId: conversationLink?.id || null,
            scheduleMessageCount: conversationLink?.scheduleMessageCount,
            participants: conversationLink?.participants
          };
        })
      );
      //filter same recipients
      listReceiversUpdated = listReceiversUpdated.filter(
        (item) =>
          item.propertyId === item.property.id ||
          item.taskId === item?.userTaskId
      );

      if (this.isSendSingleEmail) {
        this.listParamData = this.selectedTasks
          .map((taskData) => {
            const recipients = listReceiversUpdated.filter(
              (recipient) => recipient.taskId === taskData.taskId
            );
            return {
              ...taskData,
              recipients,
              propertyId: taskData.property.id,
              conversationId:
                recipients?.length === 1 ? recipients[0].conversationId : null,
              actualPropertyId:
                recipients?.length === 1 ? recipients[0].actualPropertyId : null
            };
          })
          .filter((item) => item.recipients.length);
      } else {
        this.listParamData = listReceiversUpdated;
      }
    }

    if (createMessageFrom === ECreateMessageFrom.TASK_HEADER) {
      // TODO: don't use
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
          const conversation = matchingSelectedTask?.conversations.find(
            (conversation) => conversation?.id === receiver?.conversationId
          );
          const combinedItem = {
            ...receiver,
            ...matchingSelectedTask,
            scheduleMessageCount: conversation?.scheduleMessageCount
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

  handleShowTimeSchedule(dateTime: string) {
    this.selectTimeSchedule = dateTime;
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

  // handle pop-up
  onCloseSendMsg() {
    // if (this.trudiSaveDraftService.hasControlChanges) {
    //   this.handleConfirmDraft();
    //   return;
    // }
    this.onQuit.emit();
    this.trudiSendMsgService.setHiddenTextFieldTitle(false);
    this.trudiSendMsgService.setViewRecipientList(null);
    this.trudiSendMsgService.resetCheckBox();
    this.trudiSendMsgService.setPopupState({
      selectRecipients: false,
      sendMessage: false,
      closeConfirm: false,
      addReiForm: false
    });
    this.uploadFromCRMService.setSelectedFiles([]);
    this.trudiAddContactCardService.setSelectedContactCard([]);
    this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
    this.trudiSendMsgService.openFromVacateSchedule$.next(false);
    this.trudiSendMsgFormService.setSignatureContentMsgValidate(true);
    this.trudiSaveDraftService.setSessionId(null);
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
      this.handleScheduleReminder();
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

  ngOnDestroy(): void {
    this.trudiSendMsgFormService.sendMsgForm.reset();
    this.configs.footer.buttons.dropdownList.sort((a, b) => a.id - b.id);
    this.trudiSendMsgService.setViewRecipientList(null);
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.trudiSendMsgService.openFromVacateSchedule$.next(false);
    this.trudiSendMsgService.setHiddenTextFieldTitle(false);
  }
}
