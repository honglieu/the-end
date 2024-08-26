import { convertUTCToLocalDateTime } from '@/app/core/time/timezone.helper';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
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
  catchError,
  combineLatest,
  forkJoin,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { ItemDropdown } from '@shared/components/button-with-dropdown-actions/button-with-dropdown-actions.component';
import { BreachNoticeService } from '@/app/breach-notice/services/breach-notice.service';
import { BreachNoticeRequestButtonAction } from '@/app/breach-notice/utils/breach-notice.enum';
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
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import {
  ActionSendMsgDropdown,
  ESendMsgAction,
  ISendMsgBody
} from '@/app/routine-inspection/utils/routineType';
import { ActionDefaultScheduleButton } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
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
import { TaskNameId } from '@shared/enum/task.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { IFile } from '@shared/types/file.interface';
import { ReiFormData } from '@shared/types/rei-form.interface';
import { IMailBox } from '@shared/types/user.interface';
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
  roundToNearestInterval,
  updateConfigs
} from './utils/helper-functions';
import {
  defaultConfigs,
  popupQueue,
  CREATE_MESSAGE_TYPES_PREFILL_TASK_ID
} from './utils/trudi-send-msg-config';
import { ECreateMessageFrom } from './utils/trudi-send-msg.enum';
import {
  EFooterButtonType,
  ESentMsgEvent,
  ETrudiSendMsgBtn,
  IBulkMsgBody,
  IContactInfo,
  IEventEditScheduledMsg,
  ISelectedReceivers,
  ISendMsgConfigs,
  ISendMsgResponse,
  ISendMsgTriggerEvent,
  ISendMsgType,
  ISendScheduleMsgResponse,
  IV3MsgBody
} from './utils/trudi-send-msg.interface';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { isArray, uniqBy } from 'lodash-es';
import { convertTime12to24 } from '@/app/leasing/utils/functions';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { ESendMessageType } from '@shared/enum/send-message-type.enum';
import { CompanyService } from '@services/company.service';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';

@Component({
  selector: 'trudi-send-msg',
  templateUrl: './trudi-send-msg.component.html',
  styleUrls: ['./trudi-send-msg.component.scss'],
  providers: [TrudiSendMsgUserService]
})
export class TrudiSendMsgComponent implements OnInit, OnChanges, OnDestroy {
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
    private mailboxSettingService: MailboxSettingService,
    public stepService: StepService,
    public uploadFromCRMService: UploadFromCRMService,
    public trudiDynamicParameterService: TrudiDynamicParameterService,
    private toastService: ToastrService,
    private trudiSendMsgUserService: TrudiSendMsgUserService,
    private syncResolveMessageService: SyncResolveMessageService,
    public cdr: ChangeDetectorRef,
    private companyService: CompanyService
  ) {}
  @ViewChild('dropdown') dropdown: ElementRef;
  @Input() configs: ISendMsgConfigs = cloneDeep(defaultConfigs);
  @Input() expandable: boolean = false;
  @Input() rawMsg: string = '';
  @Input() listOfFiles: IFile[] = [];
  @Input() listContactCard: ISelectedReceivers[] = [];
  @Input() prefillVariables: Record<string, string> = {};
  @Input() reiformData: ReiFormData;
  //to do
  @Input() openFrom: EUserPropertyType = null;
  @Input() defaultBtnOption: EDefaultBtnDropdownOptions;
  //to do
  @Input() typeMessage: string;
  @Input() listDynamicFieldData: string[] = [];
  @Input() selectedTasks: ITasksForPrefillDynamicData[] = [];
  @Input() prefillData: ICommunicationStep;
  @Input() mailBoxIdFromCalender: string = '';
  @Input() listUser: ISelectedReceivers[] = [];
  @Input() isAppUser: boolean = false;
  @Input() isSyncedAttachment: boolean = true;
  @Input() threadId: string = null;
  @Input() attachmentSync = {};
  @Input() appendBody: boolean = false;

  @Output() onBack = new EventEmitter();
  @Output() onQuit = new EventEmitter();
  @Output() onSendMsg = new EventEmitter<ISendMsgTriggerEvent>();
  @Output() onNextDropdown = new EventEmitter();
  @Output() onSendScheduleVacate = new EventEmitter();
  public isConsole: boolean;
  public selectTimeSchedule: string;
  public currentBody: ISendMsgBody;
  popupQueue: PopupQueue = popupQueue;
  isSendingMsg: boolean = false;
  isPortalUser: boolean = false;
  currentAgencyId: string;
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
  public showPopover: boolean = false;
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
  public isShowModalMissingDynamicParamValue: boolean = false;
  public listParamMissingData: string[] = [];
  public listDynamicParams: IListDynamic[] = [];
  public selectedTaskIds: string[] = [];
  public isAllowKeepGoingToSendMessage: boolean = false;
  public currentAction = {} as ActionSendMsgDropdown;
  public listParamData = [];
  public isValidMsg: boolean = false;
  public isFullScreenModal: boolean = false;
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
    }
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.checkDisableBtnNext();
    this.selectedTaskIds = this.selectedTasks.map((item) => item.taskId);
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((mailBoxId) => {
          if (mailBoxId) {
            this.currentMailBoxId = this.mailBoxIdFromCalender
              ? this.mailBoxIdFromCalender
              : localStorage.getItem('mailBoxId') || mailBoxId;

            return this.inboxService.listMailBoxs$;
          } else {
            return of(null);
          }
        })
      )
      .subscribe((listMailBoxs) => {
        if (listMailBoxs?.length) {
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
          this.listMailBoxs = [
            this.currentMailBox,
            ...this.listMailBoxs.filter((e) => e.id !== this.currentMailBox.id)
          ];
        }
      });
    this.userService
      .checkIsPortalUser()
      .then((isPortalUser) => (this.isPortalUser = isPortalUser));
    this.changePopupState(EPopupAction.INIT);

    this.handleChangeDefaultDropdownButton();
    this.handlePrefillFiles();
    this.getDataByCRM();
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
        this.onBack.emit();
        this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
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

  setMailBoxId(mailBox: IMailBox) {
    this.inboxService.setCurrentMailboxIdToResolveMsg(mailBox?.id);
    this.mailboxSettingService.senderMailBoxId.next(mailBox?.id);
    this.currentMailBoxId = mailBox?.id;
    this.currentMailBox = mailBox;
    this.showPopover = false;
  }

  async triggerDropDownEvent(data: ActionSendMsgDropdown) {
    if (this.isSendingMsg) return;
    if (this.sendMsgForm.invalid) {
      this.sendMsgForm.markAllAsTouched();
      return;
    }

    // Check invalid dynamic param
    if (
      !this.isAllowKeepGoingToSendMessage &&
      this.configs.body.tinyEditor.isShowDynamicFieldFunction
    ) {
      let isInvalidContent = await this.checkValidityDynamicParam(
        this.sendMsgForm.value.msgContent
      );
      this.currentAction = data;
      if (!isInvalidContent) {
        return;
      }
    }
    switch (data.action) {
      case ESendMsgAction.Send:
        this.handleSendMsg();
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
          this.trudiSendMsgService.setPopupState({
            sendMessage: false,
            selectTimeSchedule: true
          });
          return;
        }
        if (this.configs.body.timeSchedule) {
          this.onSendScheduleMessage();
          this.trudiSendMsgService.setPopupState({ sendMessage: true });
        } else {
          this.trudiSendMsgService.setPopupState({
            sendMessage: false,
            selectTimeSchedule: true
          });
        }
        break;

      default:
        this.onNextDropdown.emit(this.sendMsgForm.value);
        break;
    }
  }

  getDynamicFieldsDataMessageScratch(selectedReceivers) {
    let { agencyId } = this.trudiSendMsgService.getIDsFromOtherService();
    let payload = {
      userProperties: this.selectedReceivers.value.map((item) => ({
        userId: item.id,
        propertyId: item?.propertyId ?? null
      }))
    } as IGetDynamicFieldsDataMessageScratchPayload;

    return this.trudiSendMsgUserService
      .getDynamicFieldsDataMessageScratchApi(payload)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((res) => {
          return of(
            selectedReceivers
              .flatMap((data) =>
                res.map((receiver) => ({
                  ...receiver,
                  ...data
                }))
              )
              .filter(
                (item) =>
                  item.id === item.userId &&
                  item?.propertyId == item.property?.id
              )
          );
        })
      )
      .toPromise();
  }

  async checkValidityDynamicParam(msgContent) {
    this.isValidMsg = false;
    const listParams = this.getDynamicParamListFromMsg(msgContent);
    if (!listParams.length) {
      this.isValidMsg = true;
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

    let validationDynamicFieldFunctions =
      this.getValidationDynamicParam(listReceivers);
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
    //Handle invalid dynamic paramters highlighting

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
    this.handleShowModalInvalidDynamicParam(invalidParamsMap);
    return false;
  }

  getCalendarEventData(taskId: string) {
    const calendarEvent = this.selectedTasks?.flatMap(
      (task) => task?.['calendarEvents']
    )?.length
      ? this.selectedTasks?.flatMap((task) => task?.['calendarEvents'])
      : this.selectedTasks?.map((task) => ({
          ...task?.['componentType'],
          taskId: task.taskId
        }));
    return (
      (taskId
        ? calendarEvent?.filter((event) => event['taskId'] === taskId)
        : calendarEvent) || []
    );
  }

  getValidationDynamicParam(listReceivers) {
    return this.trudiDynamicParameterService.validationDynamicFieldFunctions(
      listReceivers,
      this.sendMsgForm.value.selectedSender,
      this.trudiSendMsgService.currentCompany,
      this.getCalendarEventData(null)
    );
  }

  getDynamicParamListFromMsg(msgContent) {
    return (msgContent.match(REGEX_PARAM_TASK_EDITOR) || []).filter((item) => {
      const invalidParamRegex = new RegExp(
        /<span\sstyle="color:\svar\(--danger-500, #fa3939\);"[^\>]*>\w*<\/span>/gim
      );
      const validParam = `<span style="color: var(--fg-brand, #28ad99);" contenteditable="false">${item}</span>`;
      return (
        !!msgContent.match(invalidParamRegex) || msgContent.includes(validParam)
      );
    });
  }

  handleShowModalInvalidDynamicParam(
    listInvalidParams: Record<string, Array<ISelectedReceivers>>
  ) {
    this.isShowModalMissingDynamicParamValue = true;
    const listMissingDataParams = Object.entries(listInvalidParams).reduce(
      (prev, curr) => {
        const item = {
          paramName: curr[0],
          users: uniqBy(curr[1], (user) => user.id)
        };
        return [...prev, item];
      },
      []
    );
    this.listParamMissingData = listMissingDataParams;
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
        `<span\\sstyle="color:\\svar\\(--danger-500, #fa3939\\);"[^\\>]*>${p}<\\/span>`,
        'gim'
      );

      if (text.match(invalidPrefixRegex)?.length > 0) {
        text = text.replaceAll(invalidPrefixRegex, validDynamic);
      }
      if (listInvalidParams[p] && text.includes(validDynamic)) {
        const missingParamUsers = uniqBy(
          listInvalidParams[p],
          (user: ISelectedReceivers) => user.id
        )
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
        text = text.replaceAll(validDynamic, missingParamText);
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

  async onSendScheduleMessage() {
    this.isSendingMsg = true;
    let listReceivers = await this.handleModifyReceiverData(
      this.selectedReceivers.value
    );
    this.showToastMsg(ESentMsgEvent.SENDING);
    let numberOfMessages = listReceivers?.length || 0;
    this.sendMessageService
      .scheduleSendV3Message(await this.sendScheduleMessageBody(listReceivers))
      .pipe()
      .subscribe({
        next: (res) => {
          this.onSendMsg.emit({
            type: ISendMsgType.SCHEDULE_MSG,
            event: ESentMsgEvent.SUCCESS,
            data: res,
            receivers: listReceivers
          });
          this.getListJobReminders(res.jobReminders[0].conversationId);
          this.conversationService.reloadConversationList.next(true);
        },
        error: () => {
          this.showToastMsg(ESentMsgEvent.ERR, numberOfMessages, true);
          this.onSendMsg.emit({
            type: ISendMsgType.SCHEDULE_MSG,
            event: ESentMsgEvent.ERR
          });
        },
        complete: () => {
          this.showToastMsg(ESentMsgEvent.SUCCESS, numberOfMessages, true);
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

  getListJobReminders(conversationId: string) {
    this.trudiScheduledMsgService.jobRemindersCount(conversationId).subscribe();
  }

  async sendScheduleMessageBody(listReceivers) {
    const createMessageFrom = this.configs?.otherConfigs?.createMessageFrom;
    const contacts = this.sendMessageService.formatContactsList(
      this.sendMsgForm.get('selectedContactCard').value
    );

    let listFile = [...(this.sendMsgForm.get('listOfFiles').value || [])];
    listFile.forEach((file) => {
      file.extension = this.filesService.getFileExtension(
        file?.name || file[0]?.name
      );
    });
    // const listFileFilter = listFile.filter((item) => item.extension !== '.ics');
    const files = await this.trudiSendMsgService.formatFiles(listFile);

    return {
      sendFrom: this.sendMsgForm.value.selectedSender.id,
      reminderTimes: [this.selectTimeSchedule],
      taskId: this.openFrom ? null : this.taskService.currentTask$.value?.id,
      agencyId: this.taskService.currentTask$.value?.agencyId,
      receivers: listReceivers.map((data) => ({
        propertyId: data.propertyId,
        receiverId: data.id,
        template: Boolean(this.configs.trudiButton?.action)
          ? this.trudiSendMsgService.handleReplaceReceiverInMess(
              this.sendMsgForm.value ? this.sendMsgForm.value : this.template,
              data,
              this.getCalendarEventData(data.taskId)
            )
          : null,
        message: this.trudiSendMsgService.handleReplaceReceiverInMess(
          this.sendMsgForm.value,
          data,
          this.getCalendarEventData(data.taskId)
        ),
        email: data.email,
        isSendFromEmail: true,
        taskId:
          CREATE_MESSAGE_TYPES_PREFILL_TASK_ID.includes(createMessageFrom) &&
          data?.taskId
            ? data?.taskId
            : null,
        conversationId:
          CREATE_MESSAGE_TYPES_PREFILL_TASK_ID.includes(createMessageFrom) &&
          data?.conversationId
            ? data?.conversationId
            : null,
        files: this.trudiSendMsgService.getFileFromDynamicParam(
          this.sendMsgForm.value.msgContent,
          data,
          this.getCalendarEventData(data.taskId)
        )
      })),
      conversationTitle: this.sendMsgForm.value.msgTitle,
      isFromTrudiButton: Boolean(this.configs.trudiButton?.action),
      action: this.configs.trudiButton?.action || ESendMessageType.SCHEDULE,
      isFromCreateMessage: !!this.openFrom,
      files,
      options: {
        contacts
      },
      actionId: this.configs.trudiButton?.id,
      mailBoxId: this.currentMailBoxId
    };
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
  async handleSendMsg() {
    this.isSendingMsg = true;

    switch (this.configs.footer.buttons.sendType) {
      case ISendMsgType.BULK:
      case ISendMsgType.BULK_EVENT:
        let formData = this.sendMsgForm.value;
        let listReceiversModified = await this.handleModifyReceiverData(
          this.selectedReceivers.value
        );
        if (
          this.configs.otherConfigs.createMessageFrom ===
          ECreateMessageFrom.SCRATCH
        ) {
          formData = {
            ...this.sendMsgForm.value,
            selectedReceivers: listReceiversModified
          };
        }
        const bulkEventBody = await this.trudiSendMsgService.getBulkEventBody(
          formData,
          this.configs.otherConfigs.isCreateMessageType,
          this.getCalendarEventData(null)
        );
        bulkEventBody.mailBoxId = this.currentMailBoxId;
        this.send(this.configs.footer.buttons.sendType, bulkEventBody);
        break;

      case ISendMsgType.EVENT_EDIT_SCHEDULED_MSG:
        this.trudiScheduledMsgService.selectedScheduledMsg.subscribe((msg) => {
          this.selectedScheduledMsg = msg;
        });
        if (this.selectedScheduledMsg) {
          const contacts = this.sendMessageService.formatContactsList(
            this.sendMsgForm.get('selectedContactCard').value
          );

          let listFile = [...(this.sendMsgForm.get('listOfFiles').value || [])];
          listFile.forEach((file) => {
            file.extension = this.filesService.getFileExtension(
              file?.name || file[0]?.name
            );
          });
          // const listFileFilter = listFile.filter(
          //   (item) => item.extension !== '.ics'
          // );
          const files = await this.trudiSendMsgService.formatFiles(listFile);
          this.selectedScheduledMsg = this.selectedScheduledMsg;
          const data = this.sendMsgForm.get('msgContent').value;
          const conversationTitle = this.sendMsgForm.get('msgTitle').value;
          const body = {
            reminderTime: this.selectedScheduledMsg.time,
            message: data,
            conversationTitle,
            files: files,
            options: {
              contacts: contacts
            },
            sendForm: this.sendMsgForm.get('selectedSender')?.value.id,
            template: this.template,
            isSendFromEmail: true,
            mailBoxId: this.currentMailBoxId
          };
          this.editScheduledMsg(
            ISendMsgType.EVENT_EDIT_SCHEDULED_MSG,
            body,
            this.selectedScheduledMsg.id
          );
        }
        break;

      case ISendMsgType.EXTERNAL:
        this.onSendMsg.next({
          type: ISendMsgType.EXTERNAL,
          event: ESentMsgEvent.SUCCESS,
          data: this.sendMsgForm.value
        });
        break;

      default:
        let receiverListHaveConversation: ISelectedReceivers[] = [];
        let receiverListDoNotHaveConversation: ISelectedReceivers[] = [];

        if (
          this.configs.body.receiver.isShowContactType ||
          this.configs.otherConfigs.createMessageFrom ===
            ECreateMessageFrom.MULTI_MESSAGES
        ) {
          let listConversationReceivers = await this.handleModifyReceiverData(
            this.selectedReceivers.value
          );
          receiverListDoNotHaveConversation = listConversationReceivers.filter(
            (receiver) => !receiver.conversationId
          );
          receiverListHaveConversation = listConversationReceivers.filter(
            (receiver) => receiver.conversationId
          );
        } else {
          let listConversationReceivers = [];
          const listConversation =
            this.conversationService.listConversationByTask.getValue();
          if (
            this.configs?.otherConfigs?.createMessageFrom ===
            ECreateMessageFrom.TASK_HEADER
          ) {
            listConversationReceivers = await this.handleModifyReceiverData(
              this.selectedReceivers.value
            );
          } else {
            listConversationReceivers = this.selectedReceivers.value;
          }
          this.selectedReceivers.setValue(
            listConversationReceivers?.map((receiver) => {
              const hasConversation = listConversation?.find(
                (conversation) =>
                  conversation.userId === receiver.id &&
                  (!receiver.propertyId ||
                    conversation.propertyId === receiver.propertyId)
              );
              return {
                ...receiver,
                conversationId: hasConversation?.id || null
              };
            })
          );
          receiverListHaveConversation = this.selectedReceivers.value.filter(
            (receiver: ISelectedReceivers) => receiver.conversationId
          );
          receiverListDoNotHaveConversation =
            this.selectedReceivers.value.filter(
              (receiver: ISelectedReceivers) => !receiver.conversationId
            );
        }
        if (
          this.configs.otherConfigs.createMessageFrom ===
            ECreateMessageFrom.MULTI_TASKS &&
          !this.configs?.body?.receiver?.prefillSelectedTypeItem
        ) {
          this.handleSendBulkAndSendMessageV3(
            receiverListHaveConversation,
            receiverListDoNotHaveConversation,
            ISendMsgType.BULK_EVENT,
            ISendMsgType.V3_EVENT
          );
        } else {
          this.handleSendBulkAndSendMessageV3(
            receiverListHaveConversation,
            receiverListDoNotHaveConversation,
            ISendMsgType.BULK,
            ISendMsgType.V3
          );
        }
        break;
    }
  }

  async handleSendBulkAndSendMessageV3(
    receiverListHaveConversation,
    receiverListDoNotHaveConversation,
    sendBulkType = ISendMsgType.BULK,
    sendMessageV3Type = ISendMsgType.V3
  ) {
    let bulkBody = {} as IBulkMsgBody;
    let v3Body = {} as IV3MsgBody;
    if (receiverListDoNotHaveConversation.length) {
      this.headerService.setIsSendBulkMessage(true);
      bulkBody =
        this.configs.otherConfigs.createMessageFrom ===
          ECreateMessageFrom.MULTI_MESSAGES &&
        receiverListDoNotHaveConversation.length
          ? await this.trudiSendMsgService.getBulkEventBody(
              {
                ...this.sendMsgForm.value,
                selectedReceivers: (receiverListDoNotHaveConversation =
                  receiverListDoNotHaveConversation?.map((receiver) => ({
                    ...receiver,
                    taskId: null
                  })))
              },
              this.configs.otherConfigs.isCreateMessageType,
              this.getCalendarEventData(null)
            )
          : await this.trudiSendMsgService.getBulkBody(
              {
                ...this.sendMsgForm.value,
                selectedReceivers: receiverListDoNotHaveConversation
              },
              this.configs.trudiButton?.action,
              this.configs.otherConfigs.calendarEvent.sendCalendarEvent,
              this.configs.otherConfigs.calendarEvent.calendarEventId,
              this.getCalendarEventData(null)
            );
    }
    if (receiverListHaveConversation.length) {
      v3Body = await this.trudiSendMsgService.getV3Body(
        {
          ...this.sendMsgForm.value,
          selectedReceivers: receiverListHaveConversation
        },
        this.configs.trudiButton,
        this.configs.otherConfigs.calendarEvent.sendCalendarEvent,
        this.configs.otherConfigs.calendarEvent.calendarEventId,
        this.getCalendarEventData(null)
      );
    }
    if (
      receiverListHaveConversation.length &&
      receiverListDoNotHaveConversation.length
    ) {
      sendBulkType === ISendMsgType.BULK_EVENT &&
      sendMessageV3Type === ISendMsgType.V3_EVENT &&
      !this.configs?.body?.receiver?.prefillSelectedTypeItem
        ? await Promise.all([v3Body, bulkBody]).then(([v3Body, bulkBody]) => {
            this.combineSendBulkAndV3WithEvent(v3Body, bulkBody);
          })
        : await Promise.all([v3Body, bulkBody]).then(([v3Body, bulkBody]) => {
            this.combineSendV3bulk(v3Body, bulkBody);
          });
      return;
    }

    if (receiverListHaveConversation.length) {
      this.send(sendMessageV3Type, v3Body);
      return;
    }

    if (receiverListDoNotHaveConversation.length) {
      this.headerService.setIsSendBulkMessage(true);
      this.send(sendBulkType, bulkBody);
      return;
    }
  }

  async handleModifyReceiverData(
    selectedReceivers,
    isAllowGetDataToCheckInValidParam = false
  ) {
    let createMessageFrom = this.configs.otherConfigs.createMessageFrom;

    if (
      this.isAllowKeepGoingToSendMessage ||
      (this.isValidMsg && createMessageFrom === ECreateMessageFrom.SCRATCH)
    ) {
      return !this.listParamData.length
        ? selectedReceivers
        : this.listParamData;
    }
    if (
      createMessageFrom === ECreateMessageFrom.SCRATCH &&
      isAllowGetDataToCheckInValidParam
    ) {
      this.listParamData = await this.getDynamicFieldsDataMessageScratch(
        selectedReceivers
      );
      return this.listParamData;
    }
    if (
      !this.configs.body.receiver.isShowContactType &&
      createMessageFrom !== ECreateMessageFrom.MULTI_MESSAGES &&
      createMessageFrom !== ECreateMessageFrom.TASK_HEADER
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
      this.listParamData = Array.from(
        new Set(listReceivers.map((item) => item.id))
      ).map((id) => listReceivers.find((receiver) => receiver.id === id));
    }
    // handle retrieves the number of messages to send on Send message for multi tasks
    if (createMessageFrom === ECreateMessageFrom.MULTI_TASKS) {
      listReceiversUpdated = this.selectedTasks.flatMap((task) =>
        this.listParamData.map((receiver) => ({
          ...receiver,
          ...task,
          conversationId:
            task?.conversations.find((item) => item.userId === receiver.id)
              ?.id ?? null
        }))
      );
      this.listParamData = listReceiversUpdated.filter(
        (item) =>
          item.propertyId === item.property.id ||
          item.taskId === item?.userTaskId
      );
    }
    if (createMessageFrom === ECreateMessageFrom.TASK_HEADER) {
      this.listParamData = this.selectedTasks.flatMap((task) =>
        this.listParamData.map((receiver) => ({
          ...receiver,
          ...task,
          conversationId:
            task?.conversations.find((item) => item.userId === receiver.id)
              ?.id ?? null
        }))
      );
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

  combineSendBulkAndV3WithEvent(v3Body: IV3MsgBody, bulkBody: IBulkMsgBody) {
    if (this.configs.body.typeSendMsg === ESendMsgAction.Schedule) {
      this.combineSendV3bulk(v3Body, bulkBody);
      return;
    }
    this.isSendingMsg = true;
    this.showToastMsg(ESentMsgEvent.SENDING);
    this.trudiSendMsgService
      .sendBulkMessageAndV3MessageWithEvent({
        sendBulk: bulkBody,
        messageV3: v3Body
      })
      .subscribe({
        next: (res) => {
          let listTaskIds = Array.from(
            new Set<string>(
              res.sendBulk.message
                .map((m) => m.taskId)
                .concat(res.messageV3.textMessages.map((m) => m.taskId))
            )
          );
          listTaskIds.forEach((id: string) => {
            this.confirmCreateLinkReiForm(id);
          });
          this.onSendMsg.emit({
            type: ISendMsgType.BULK_EVENT_AND_V3_EVENT,
            event: ESentMsgEvent.SUCCESS
          });
          this.conversationService.reloadConversationList.next(true);
        },
        error: () => {
          this.onSendMsg.emit({
            type: ISendMsgType.BULK_EVENT_AND_V3_EVENT,
            event: ESentMsgEvent.ERR
          });
        },
        complete: () => {
          this.onSendMsg.emit({
            type: ISendMsgType.BULK_EVENT_AND_V3_EVENT,
            event: ESentMsgEvent.COMPLETED
          });
          this.isSendingMsg = false;
          this.trudiSendMsgFormService.sendMsgForm.reset();
          this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
        }
      });
  }

  combineSendV3bulk(v3Body: IV3MsgBody, bulkBody: IBulkMsgBody) {
    if (this.configs?.body?.receiver?.prefillSelectedTypeItem) {
      this.replaceMessageTitle(v3Body);
      this.replaceMessageTitle(bulkBody);
    }
    this.isSendingMsg = true;
    if (this.configs.body.typeSendMsg === ESendMsgAction.Schedule) {
      bulkBody.reminderTimes = [this.selectTimeSchedule];
      v3Body.reminderTimes = [this.selectTimeSchedule];
    }
    this.showToastMsg(ESentMsgEvent.SENDING);
    let numberOfMessages =
      v3Body.textMessages?.length + bulkBody.message?.length;
    forkJoin([
      this.trudiSendMsgService
        .sendMessage(ISendMsgType.V3, v3Body)
        .pipe(catchError((err) => of(err))),
      this.trudiSendMsgService
        .sendMessage(ISendMsgType.BULK, bulkBody)
        .pipe(catchError((err) => of(err)))
    ]).subscribe({
      next: ([resBulk, resV3]) => {
        let taskIds = Array.from(
          new Set(
            [...resBulk, ...resV3]?.map(
              (res: IBulkMsgBody | IV3MsgBody) => res.taskId
            )
          )
        );
        if (
          this.configs?.body?.receiver?.prefillSelectedTypeItem &&
          this.prefillData
        ) {
          this.stepService
            .updateStepMultipleToTask(
              taskIds,
              this.prefillData?.id,
              this.prefillData?.action,
              TrudiButtonEnumStatus.COMPLETED,
              this.prefillData?.stepType
            )
            .subscribe();
        }
        this.confirmCreateLinkReiForm(resBulk[0].taskId || resV3[0].taskId);
        const data = [
          {
            type: ISendMsgType.BULK,
            data: resBulk
          },
          {
            type: ISendMsgType.V3,
            data: resV3
          }
        ];

        this.onSendMsg.emit({
          type: ISendMsgType.V3_AND_BULK,
          event: ESentMsgEvent.SUCCESS,
          data,
          receivers: this.selectedReceivers.value
        });
        this.conversationService.reloadConversationList.next(true);
      },
      error: () => {
        this.showToastMsg(ESentMsgEvent.ERR, numberOfMessages);
        this.onSendMsg.emit({
          type: ISendMsgType.V3_AND_BULK,
          event: ESentMsgEvent.ERR
        });
      },
      complete: () => {
        this.showToastMsg(ESentMsgEvent.SUCCESS, numberOfMessages);
        this.onSendMsg.emit({
          type: ISendMsgType.V3_AND_BULK,
          event: ESentMsgEvent.COMPLETED
        });
        this.isSendingMsg = false;
        this.trudiSendMsgFormService.sendMsgForm.reset();
        this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
      }
    });
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

  send(msgType, body) {
    if (this.configs?.body?.receiver?.prefillSelectedTypeItem) {
      this.replaceMessageTitle(body);
    }
    this.isSendingMsg = true;
    if (this.configs.body.typeSendMsg === ESendMsgAction.Schedule) {
      body.reminderTimes = [this.selectTimeSchedule];
    }
    this.showToastMsg(ESentMsgEvent.SENDING);
    let numberOfMessages = body?.textMessages?.length ?? body?.message?.length;
    this.trudiSendMsgService.sendMessage(msgType, body).subscribe({
      next: (res) => {
        let taskIds = [];
        if (Array.isArray(res)) {
          taskIds = Array.from(new Set(res?.map((res) => res.taskId)));
        }
        if (body?.isResolveConversation) {
          this.headerService.setConversationAction({
            option: EMessageMenuOption.SEND_AND_RESOLVE,
            taskId: null,
            isTriggeredFromRightPanel: false,
            isTriggeredFromToolbar: true,
            messageIds: taskIds.filter(Boolean)
          });
        }

        if (
          this.configs?.body?.receiver?.prefillSelectedTypeItem &&
          this.prefillData
        ) {
          this.stepService
            .updateStepMultipleToTask(
              taskIds,
              this.prefillData?.id,
              this.prefillData?.action,
              TrudiButtonEnumStatus.COMPLETED,
              this.prefillData?.stepType
            )
            .subscribe();
        }
        this.confirmCreateLinkReiForm(res?.[0].taskId);
        let listTaskIds = Array.from(
          new Set<string>(
            (
              res as Array<IBulkMsgBody | IV3MsgBody | IEventEditScheduledMsg>
            ).map((item) => item?.taskId)
          )
        );
        listTaskIds.forEach((id) => {
          this.confirmCreateLinkReiForm(id);
        });
        this.onSendMsg.emit({
          type: msgType,
          event: ESentMsgEvent.SUCCESS,
          data: res as ISendMsgResponse | ISendScheduleMsgResponse,
          receivers: this.selectedReceivers.value,
          mailBoxId: body?.mailBoxId
        });

        this.headerService.setIsSendBulkMessage(false);
        this.conversationService.reloadConversationList.next(true);
      },
      error: () => {
        this.showToastMsg(ESentMsgEvent.ERR, numberOfMessages);
        this.onSendMsg.emit({
          type: msgType,
          event: ESentMsgEvent.ERR
        });
      },
      complete: () => {
        this.showToastMsg(ESentMsgEvent.SUCCESS, numberOfMessages);
        this.onSendMsg.emit({
          type: msgType,
          event: ESentMsgEvent.COMPLETED
        });
        this.isSendingMsg = false;
        this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
        this.reiFormService.currentReiFormData$.next(null);
      }
    });
  }

  showToastMsg(type, numberOfMessages?, isScheduleForSend = false) {
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
        this.toastService.success(
          `${messageLabel} ${
            isScheduleForSend ? ' scheduled for send' : 'sent'
          }`
        );
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
    this.trudiSendMsgService.resetCheckBox();
    this.trudiSendMsgService.setPopupState({
      sendMessage: true,
      closeConfirm: false,
      addReiForm: false
    });
    this.uploadFromCRMService.setSelectedFiles([]);
    this.trudiAddContactCardService.setSelectedContactCard([]);
    this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
    this.trudiSendMsgService.openFromVacateSchedule$.next(false);
  }

  triggerExpandOrResizeModal(value: boolean) {
    this.isFullScreenModal = value;
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
  onChangeTypeSendMessage(value: ItemDropdown) {
    this.configs.body.typeSendMsg = value.action;
    this.defaultOptionDropdown = value.id;
    if (value.action === ESendMsgAction.Schedule) {
      this.trudiSendMsgService.setPopupState({
        sendMessage: false,
        selectTimeSchedule: true
      });
      this.scheduleSpecialFlowDate();
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
  togglePopover(): void {
    if (this.configs?.body?.receiver?.prefillSelectedTypeItem) return;
    this.showPopover = !this.showPopover;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.dropdown?.nativeElement?.contains(event.target)) {
      this.showPopover = false;
    }
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
        tempListParamByCRM = PT_LIST_DYNAMIC_PARAMETERS;
        break;
      case ECRMState.RENT_MANAGER:
        tempListParamByCRM = RM_LIST_DYNAMIC_PARAMETERS;
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
    this.isShowModalMissingDynamicParamValue = false;
    this.isAllowKeepGoingToSendMessage = false;
  }

  handleKeepSending() {
    this.isShowModalMissingDynamicParamValue = false;
    this.isAllowKeepGoingToSendMessage = true;
    this.triggerDropDownEvent(this.currentAction);
  }

  ngOnDestroy(): void {
    this.trudiSendMsgFormService.sendMsgForm.reset();
    this.configs.footer.buttons.dropdownList.sort((a, b) => a.id - b.id);
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.trudiSendMsgService.openFromVacateSchedule$.next(false);
  }
}
