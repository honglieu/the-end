import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { MessageFlowService } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { SharedService } from '@services/shared.service';
import { SendOption } from '@shared/components/tiny-editor/tiny-editor.component';
import {
  EConfirmContactType,
  EConversationType,
  EMailBoxStatus,
  EMailBoxType,
  EMessageType,
  SocketType,
  TaskStatusType
} from '@shared/enum';
import { FilesService } from '@services/files.service';
import { ReiFormService } from '@services/rei-form.service';
import { TaskType } from '@shared/enum';
import { CurrentUser, IMailBox } from '@shared/types/user.interface';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { ECRMState } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  getListSenderMailBox,
  getUserFromParticipants,
  handleDisabledDynamicParamsByProperty,
  updateConfigs
} from '@/app/trudi-send-msg/utils/helper-functions';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ESentMsgEvent,
  IFromUserMailBox,
  ISelectedReceivers,
  ISendMsgConfigs,
  ISendMsgPayload,
  ISendMsgResponseV2,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
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
  SimpleChange,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { cloneDeep } from 'lodash-es';
import { NzResizeEvent } from 'ng-zorro-antd/resizable';
import {
  combineLatest,
  debounceTime,
  filter,
  Subject,
  tap,
  startWith,
  takeUntil,
  switchMap,
  of,
  catchError,
  map,
  Subscription,
  distinctUntilChanged
} from 'rxjs';
import {
  EAppMessageCreateType,
  EDeleteInLineType
} from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { ConversationService } from '@services/conversation.service';
import uuidv4 from 'uuid4';
import { UserConversation } from '@shared/types/conversation.interface';
import { TrudiSendMsgHelperFunctionsService } from '@/app/trudi-send-msg/services/trudi-send-msg-helper-functions.service';
import {
  generateLink,
  validateWhiteSpaceHtml
} from '@shared/feature/function.feature';
import {
  PT_LIST_DYNAMIC_PARAMETERS,
  RM_LIST_DYNAMIC_PARAMETERS
} from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import { CompanyService } from '@services/company.service';
import {
  EConversationStatus,
  EConversationStatusTab
} from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import { CONVERSATION_STATUS, trudiUserId } from '@services/constants';
import { TrudiDynamicParameterDataService } from '@/app/trudi-send-msg/services/trudi-dynamic-parameter-data.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { Store } from '@ngrx/store';
import { appMessageActions } from '@core/store/app-message/actions/app-message.actions';
import { IParticipant as IParticipantConversation } from '@shared/types/conversation.interface';
import {
  EToastCustomType,
  TypeDataFortoast
} from '@/app/toast-custom/toastCustomType';
import { TaskService } from '@services/task.service';
import { ICompany } from '@shared/types/company.interface';
import { HelperService } from '@services/helper.service';
import { IFile } from '@shared/types/file.interface';
import { SmsMessageListService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message.services';
import { SmsInlineMessageEditorComponent } from './components/sms-inline-message-editor/sms-inline-message-editor.component';
import {
  combineNames,
  Property,
  removeLastWhiteSpaceFromContent
} from '@/app/shared';
import { AiInteractiveBuilderService } from '@/app/shared/components/tiny-editor/services/ai-interactive-builder.service';
import { AI_INTERACTIVE_WHITE_LIST } from '@/app/dashboard/components/ai-interactive-bubble/utils/constant';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { FeaturesConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import { EAiAssistantAction } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { EModalID } from '@/app/dashboard/services/modal-management.service';
import { ToastrService } from 'ngx-toastr';
import { DRAFT_SAVED } from '@/app/services/messages.constants';
import { EToastType } from '@/app/toast/toastType';

export enum ComposeEditorType {
  NEW = 'NEW',
  REPLY = 'REPLY'
}
export const EMPTY_SPACE_REGEX = /^(<p>[&nbsp;\s]{0,}<\/p>)$/g;

export interface IAppTriggerSendMsgEvent extends ISendMsgTriggerEvent {
  isCreateAppMessage?: boolean;
  isCreateMessageFromUserProfile?: boolean;
  sendOption?: SendOption;
  tempIds?: string[];
  tempConversationId?: string;
}

@Component({
  selector: 'sms-compose-message',
  templateUrl: './sms-compose-message.component.html',
  styleUrl: './sms-compose-message.component.scss',
  providers: [
    TrudiSendMsgHelperFunctionsService,
    TrudiSaveDraftService,
    TrudiSendMsgService,
    TrudiDynamicParameterService,
    TrudiDynamicParameterDataService,
    TrudiSendMsgFormService
  ]
})
export class SmsComposeMessageComponent
  implements OnInit, OnChanges, OnDestroy
{
  @ViewChild('inlineSMSTinyEditor', { static: false })
  inlineMessageEditorComponent: SmsInlineMessageEditorComponent;
  @ViewChild('attachments', { static: false })
  attachments: ElementRef;
  @Input() configs: ISendMsgConfigs = {
    ...defaultConfigs,
    otherConfigs: {
      ...defaultConfigs?.otherConfigs,
      createMessageFrom: ECreateMessageFrom.APP_MESSAGE,
      isCreateMessageType: false
    },
    inputs: {
      ...defaultConfigs.inputs,
      isSMSMessage: true
    }
  };
  @Input() isRmEnvironment = false;
  @Input() isSubmitted = false;
  @Input() composeType: ComposeEditorType;
  @Input() activeMobileApp: boolean;
  @Input() currentConversation: UserConversation;
  @Input() currentProperty;
  @Input() deleteInlineType: EDeleteInLineType;
  @Input() taskProperty: Property = null;
  @Input() isComposeNewMsg: boolean = false;
  @Input() loadingCreateScratch: boolean = false;
  @Input() defaultValue: string;
  @Input() additionalInfo: string;
  @Input() isDateUnknown: boolean = false;
  @Input() dueDateTooltipText: string;
  @Input() selectedEvent: string;
  @Input() action: string;

  @Output() onSendMsg = new EventEmitter<IAppTriggerSendMsgEvent>();
  @Output() onMsgResize = new EventEmitter();
  public contentResizeTimeout: NodeJS.Timeout = null;
  public readonly ComposeEditorType = ComposeEditorType;
  public isCreateMessageFromUserProfile: boolean;
  private currentModal: EModalID;
  private currentMailBoxId: string;
  private subscription: Subscription;
  private listMailBoxs = [];
  private currentMailBox: IMailBox;
  private listSenderMailBox: IFromUserMailBox[] = [];
  private currentUser: CurrentUser;
  public isConsole: boolean = false;
  public isLoading = false;
  public listDynamicParams = [];
  public destroy$ = new Subject();
  public id: number;
  readonly DEFAULT_HEIGHT = 198;
  readonly DEFAULT_ATTACH_HEIGHT = 85;
  public CONTENT_MAX_HEIGHT = 500;
  public contentHeight: number = this.DEFAULT_HEIGHT;
  public minHeight: number = this.DEFAULT_HEIGHT;
  private _textBoxHeight = this.DEFAULT_HEIGHT; // height of inline send message without attachments

  private userChangedFormValue: boolean = false;
  private isDraftTab: boolean = false;
  public prefillText: string = '';
  public currentReceiverProperty: { streetline: string; id: string };
  public errorMessage: string;
  public isShowModalWarning: boolean = false;

  public appMessageCreateType: EAppMessageCreateType = null;
  public currentCompany: ICompany;
  public SendOption = SendOption;
  public triggerResizeAppCompose$ = new Subject<boolean>();
  public isShowSMSInlineMessage: boolean = false;
  public whiteList = AI_INTERACTIVE_WHITE_LIST;
  public features: FeaturesConfigPlan;

  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private agencyDashboardService: AgencyService,
    private inboxService: InboxService,
    private userService: UserService,
    private trudiSendMsgService: TrudiSendMsgService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private smsMessageListService: SmsMessageListService,
    private messageFlowService: MessageFlowService,
    private conversationService: ConversationService,
    public elementRef: ElementRef<HTMLElement>,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private trudiSendMsgHelperFunctionsService: TrudiSendMsgHelperFunctionsService,
    private toastCustomService: ToastCustomService,
    private reiFormService: ReiFormService,
    private filesService: FilesService,
    private companyService: CompanyService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private trudiDynamicParameterDataService: TrudiDynamicParameterDataService,
    private readonly store: Store,
    private taskService: TaskService,
    private helper: HelperService,
    private aiInteractiveBuilderService: AiInteractiveBuilderService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastrService
  ) {}

  get selectedReceivers() {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  get property() {
    return this.sendMsgForm?.get('property');
  }

  get msgTitle() {
    return this.sendMsgForm?.get('msgTitle');
  }

  get selectedContactCardControl() {
    return this.sendMsgForm?.get('selectedContactCard');
  }

  get selectedContactCard$() {
    return this.trudiSendMsgFormService.selectedContactCard$;
  }

  public get selectedSenderControl() {
    return this.sendMsgForm.get('selectedSender');
  }

  get isDisableSendBtn() {
    return (
      !this.features?.[EAiAssistantAction.SMS]?.state ||
      !this.trudiSendMsgFormService.isFilesValidate ||
      this.trudiSaveDraftService.isLoadingUploadFile ||
      !(
        this.msgContent?.value ||
        this.listOfFiles.value?.length ||
        this.trudiSendMsgFormService.selectedContactCard$.value?.length
      ) ||
      (validateWhiteSpaceHtml(this.msgContent.value) &&
        !this.listOfFiles?.value?.length &&
        !this.trudiSendMsgFormService.selectedContactCard$.value?.length)
    );
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  get attachmentsHeight() {
    if (!this.listOfFiles?.value?.length) return 0;
    return (
      this.attachments.nativeElement?.offsetHeight || this.DEFAULT_ATTACH_HEIGHT
    );
  }

  subscribeCurrentTask() {
    this.taskService.currentTask$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => !!res?.id),
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id)
      )
      .subscribe(() => {
        this.setConfig();
      });
  }

  ngOnInit(): void {
    this.messageFlowService.currentModal$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.currentModal = value;
      });
    this.subscribeCurrentTask();
    this.CONTENT_MAX_HEIGHT = (window.innerHeight - 52) / 2;
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (
          (this.trudiSaveDraftService.getDraftMsgId ||
            this.userChangedFormValue) &&
          !this.isLoading
        ) {
          this.resetTinyTrackControl();
          this.handleSaveDraft(false);
          this.userChangedFormValue = false;
        }
      });
    this.isConsole = this.sharedService.isConsoleUsers();
    this.trudiSendMsgFormService.buildFormV2();
    this.trudiDynamicParameterDataService.initDynamicData(this.configs, null);
    this.trudiSendMsgFormService.setSelectedContactCard([]);
    if (
      this.configs.otherConfigs.createMessageFrom ===
      ECreateMessageFrom.TASK_DETAIL
    ) {
      this.property.setValue(this.taskProperty);
    }
    this.userService
      .getUserDetail()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.currentUser = rs;
      });

    this.getListMailBox();
    this.getDynamicParamsByCrm();
    this.subscribeSelectedReceiverChange();
    this.smsMessageListService.prefillDataAppMessage$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => !!res),
        switchMap((res) => {
          if (res.draftMessageId) {
            return this.trudiSaveDraftService
              .getDraftData(res.draftMessageId)
              .pipe(
                catchError(() => of({})),
                map((data) => ({ ...res, ...data }))
              );
          }
          return of(res);
        })
      )
      .subscribe((res) => {
        const url = this.router?.url || '';
        if (
          !url.includes(EAppMessageCreateType.NewAppMessageDone) &&
          url.includes(EAppMessageCreateType.NewAppMessage) &&
          !res.isCreateMessageFromUserProfile
        ) {
          return;
        }
        const { fromScratch } = this.activatedRoute.snapshot.queryParams;
        const canPrefillContent =
          !fromScratch || this.currentConversation?.isScratchTicket;
        this.isCreateMessageFromUserProfile =
          res.isCreateMessageFromUserProfile;
        this.trudiSaveDraftService.setDraftMsgId(res.draftMessageId);
        const listFileUpload =
          this.trudiSendMsgHelperFunctionsService.handlePrefillFileUploaded(
            res.attachments || []
          );
        this.listOfFiles.setValue(listFileUpload);
        this.trudiSendMsgFormService.setSelectedContactCard(res.contacts || []);
        this.selectedContactCardControl?.setValue(res.contacts || []);
        this.msgTitle.setValue(res.title || '');
        if (canPrefillContent) {
          this.prefillText = res.content || '';
          this.msgContent.setValue(res.content || '');
        }
        if (!res.content && canPrefillContent) {
          this.inlineMessageEditorComponent?.tinyEditorComponent?.editorControl?.setValue(
            ''
          );
        }
        if (
          this.smsMessageListService.triggerSaveDraftFirstReply.getValue() &&
          this.selectedReceivers?.value?.length
        ) {
          this.smsMessageListService.triggerSaveDraftFirstReply.next(false);
          this.userChangedFormValue = true;
        }

        if (
          !this.isComposeNewMsg &&
          this.taskProperty &&
          res.receivers?.[0] &&
          res.receivers[0].propertyId !== this.taskProperty?.id
        ) {
          this.selectedReceivers?.setValue([]);
          this.handleChangeFormValue('selectedReceivers');
        } else {
          this.selectedReceivers?.setValue(res.receivers);
        }
        const sendOptions = res?.sendOptions;
        const newConfigs = {
          ...this.configs,
          otherConfigs: {
            ...this.configs.otherConfigs
          },
          body: {
            ...this.configs.body,
            typeSendMsg: sendOptions?.type || SendOption.Send
          }
        };

        this.configs = newConfigs;
        this.setConfig();
      });

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.isShowSMSInlineMessage = params['status'] === 'INPROGRESS';
        this.appMessageCreateType = params?.['appMessageCreateType'];
        if (
          params?.['appMessageCreateType'] ===
            EAppMessageCreateType.NewAppMessage &&
          !this.isCreateMessageFromUserProfile
        ) {
          if (
            !params?.['conversationId'] &&
            !params?.['taskId'] &&
            this.sendMsgForm
          ) {
            this.smsMessageListService.setPreFillCreateNewMessage({});
          }
          this.resetFormValue(true);
        }

        if (
          params?.['appMessageCreateType'] ===
            EAppMessageCreateType.NewAppMessage &&
          this.sendMsgForm
        ) {
          this.deleteInlineType = EDeleteInLineType.DRAFT_APP_MESSAGE;
        }
        if (this.subscription) {
          this.subscription.unsubscribe();
          this.userChangedFormValue = false;
        }
        this.subscribeAutoSaveDraft();

        this.isDraftTab =
          params['status'] === TaskStatusType.draft || // for app messages index
          params['tab'] === EConversationStatus.draft; // for task detail
      });

    this.handleAutoResizeSendMsgInline();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$), filter(Boolean))
      .subscribe((value) => {
        this.currentCompany = value;
      });

    this.agencyDashboardService.currentPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe((configPlan) => {
        if (!configPlan) return;
        this.features = configPlan?.features;
      });
    this.conversationService.currentConversation
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentConversation) => {
        this._textBoxHeight = this.DEFAULT_HEIGHT;
        this.listDynamicParams = handleDisabledDynamicParamsByProperty(
          this.listDynamicParams,
          !currentConversation.isTemporaryProperty,
          this.currentCompany?.agencies,
          EConversationType.SMS
        );
      });
  }

  handlePrefillDataSMSMessage(conversation: UserConversation) {
    const appUser = this.getSelectedReceiver(conversation);
    const isDraftMessage = conversation.lastMessageDraft;

    this.smsMessageListService.setPreFillCreateNewMessage({
      receivers: appUser
        ? [
            {
              ...appUser,
              id: appUser.userId,
              type: isDraftMessage ? appUser.userPropertyType : appUser.type,
              isAppUser: true,
              streetline:
                conversation.shortenStreetline || conversation.streetline
            }
          ]
        : [],
      title: conversation.categoryName,
      draftMessageId:
        isDraftMessage?.messageType === EMessageType.file
          ? isDraftMessage.bulkMessageId
          : isDraftMessage?.id
    });
  }

  handleAutoResizeSendMsgInline() {
    combineLatest([
      this.listOfFiles.valueChanges.pipe(startWith([])),
      this.trudiSendMsgFormService.selectedContactCard$,
      this.triggerResizeAppCompose$.pipe(startWith(false))
    ])
      .pipe(debounceTime(50), takeUntil(this.destroy$))
      .subscribe(() => {
        const attachmentsHeight = this.attachmentsHeight;
        this.minHeight = this.DEFAULT_HEIGHT + attachmentsHeight;
        let contentHeight = this._textBoxHeight + attachmentsHeight;

        if (contentHeight > this.CONTENT_MAX_HEIGHT) {
          this._textBoxHeight = this.CONTENT_MAX_HEIGHT - attachmentsHeight;
          contentHeight = this.CONTENT_MAX_HEIGHT;
        }

        this.onContentResize({ height: contentHeight });
      });
  }
  getListMailBox() {
    combineLatest([
      this.inboxService.listMailBoxs$,
      this.inboxService.getCurrentMailBoxId(),
      this.userService.getUserDetail()
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([listMailBoxs, mailboxId, userInfo]) => {
        if (mailboxId) {
          this.currentMailBoxId =
            localStorage.getItem('mailBoxId') || mailboxId;
        }
        if (listMailBoxs?.length && userInfo) {
          this.listMailBoxs = listMailBoxs;
          if (!this.listMailBoxs?.length) return;
          this.currentMailBox =
            this.listMailBoxs.find(
              (mailBox) => mailBox.id === this.currentMailBoxId
            ) || this.listMailBoxs[0];
          this.inboxService.setCurrentMailboxIdToResolveMsg(
            this.listMailBoxs[0]?.['id']
          );
          this.listSenderMailBox = getListSenderMailBox(
            this.configs,
            userInfo,
            this.listMailBoxs,
            this.currentMailBoxId
          );

          this.currentMailBoxId = this.currentMailBox.id;
          const selectedSender = this.listSenderMailBox.find(
            (sender) =>
              sender.type === EMailBoxType.COMPANY &&
              sender.status !== EMailBoxStatus.ARCHIVE
          );
          this.sendMsgForm.get('selectedSender')?.setValue(selectedSender);
        }
      });
  }

  getDynamicParamsByCrm() {
    this.companyService.currentCompanyCRMSystemName
      .pipe(
        takeUntil(this.destroy$),
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

  handleShowListDynamic(tempListParamByCRM: any[]) {
    let titleOrder = [
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

  resetFormValue(isResetAll = false) {
    if (isResetAll) {
      this.trudiSaveDraftService.setDraftMsgId(null);
      this.isSubmitted = false;
      this.msgTitle.setValue('');
      this.selectedReceivers?.setValue([]);
      this.configs.body = {
        ...this.configs.body,
        prefillReceiversList: []
      };
    }
    this.msgContent.setValue('');
    this.prefillText = '';
    this.inlineMessageEditorComponent?.tinyEditorComponent?.editorControl?.setValue(
      ''
    );
    this.inlineMessageEditorComponent?.tinyEditorComponent?.resetToDefault();
    this.resetTinyTrackControl();
    this.listOfFiles.setValue([]);
    this.trudiSaveDraftService.setListFileUploaded([]);
    this.selectedContactCardControl.setValue([]);
    this.trudiSaveDraftService.cacheListAttachment = [];
    this.userChangedFormValue = false;
    this.trudiSendMsgFormService.setSelectedContactCard([]);
  }

  resetTinyTrackControl() {
    if (
      this.inlineMessageEditorComponent?.tinyEditorComponent?.trackUserChange
    ) {
      this.inlineMessageEditorComponent.tinyEditorComponent.trackUserChange =
        false;
    }
  }

  setConfig() {
    this.configs = updateConfigs(cloneDeep(defaultConfigs), this.configs);
    let serviceData = this.messageFlowService.getServiceData();
    this.trudiSendMsgService.configs.value = this.configs;
    this.configs = { ...this.configs, serviceData };
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.CONTENT_MAX_HEIGHT = (window.innerHeight - 52) / 2;
    if (this.contentHeight > this.CONTENT_MAX_HEIGHT) {
      this.contentHeight = this.CONTENT_MAX_HEIGHT;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['configs']) {
      this.setConfig();
    }
    if (changes['currentConversation']?.currentValue) {
      const { status } = this.activatedRoute.snapshot.queryParams;
      const isDetailPage = this.router.url.includes('/inbox/detail/');
      const currentTab =
        this.conversationService.currentTabConversation.getValue();
      const isStatusDraft =
        this.currentConversation?.statusTask === TaskStatusType.draft;
      const isScratchTicket = this.currentConversation?.isScratchTicket;
      const linkedConversationAppLog =
        this.currentConversation?.linkedConversationAppLog;
      const isShowDeleteLinkedConverApp =
        (linkedConversationAppLog &&
          status === TaskStatusType.inprogress &&
          isStatusDraft) ||
        (isScratchTicket &&
          currentTab === EConversationStatusTab.OPEN &&
          isDetailPage);

      if (isShowDeleteLinkedConverApp) {
        this.deleteInlineType = EDeleteInLineType.CONVERSATION_LINKED_APP;
      } else if (
        (this.currentConversation?.isScratchTicket &&
          (status === TaskStatusType.draft ||
            currentTab === EConversationStatusTab.DRAFT)) ||
        (this.currentConversation?.taskType === TaskType.TASK &&
          this.currentConversation?.isScratchDraft)
      ) {
        this.deleteInlineType = EDeleteInLineType.DRAFT_APP_MESSAGE;
      } else {
        this.deleteInlineType = null;
      }

      if (this.currentConversation) {
        const {
          currentConversation: { currentValue = null, previousValue = null }
        } = changes;
        if (currentValue?.id !== previousValue?.id) {
          this.handlePrefillDataSMSMessage(this.currentConversation);
        }
        if (currentValue?.userId !== previousValue?.userId) {
          const smsUser = this.getSelectedReceiver(this.currentConversation);
          this.selectedReceivers?.setValue([smsUser]);
        }
      }
      //reset fields when conversation change
      this.resetWhenConversationChange(changes['currentConversation']);
    }

    if (changes['taskProperty']) {
      if (this.property) this.onTaskPropertyChange();
    }
  }

  getSelectedReceiver(conversation: UserConversation) {
    const smsUser =
      this.smsMessageListService.getUserRaiseMsgFromParticipants(conversation);
    const { firstName = null, lastName = null, type } = smsUser || {};
    const noPropertyUser = [
      EConfirmContactType.SUPPLIER,
      EConfirmContactType.OTHER
    ].includes(type as EConfirmContactType);
    if (noPropertyUser && (firstName || lastName)) {
      smsUser.fullName = combineNames(firstName, lastName);
    }
    return smsUser;
  }

  onTaskPropertyChange() {
    if (this.taskProperty) this.property.setValue(this.taskProperty);
    if (
      this.isComposeNewMsg &&
      this.selectedReceivers?.value?.length &&
      this.selectedReceivers?.value[0].propertyId != this.taskProperty.id
    )
      this.selectedReceivers?.setValue([]);
    this.handleChangeFormValue('selectedReceivers');
  }

  get sendMsgForm() {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get msgContent() {
    return this.sendMsgForm.get('msgContent');
  }

  getFormValue(options?: { isTrudi?: boolean }, isSaveDraft?: boolean) {
    const msgContent = (this.msgContent.value || '') as string;
    const selectedSender = {
      ...this.selectedSenderControl.value,
      id: options?.isTrudi ? trudiUserId : this.currentUser.id
    };

    return {
      ...this.sendMsgForm.value,
      msgContent: this.getMsgContentToPayload(isSaveDraft, msgContent),
      selectedSender: selectedSender
    };
  }

  getMsgContentToPayload(isSaveDraft: boolean, msgContent: string) {
    let formattedMsgContent = '';
    if (validateWhiteSpaceHtml(msgContent)) {
      formattedMsgContent = isSaveDraft ? '' : '<p></p>';
    } else {
      formattedMsgContent = msgContent;
    }

    return removeLastWhiteSpaceFromContent(
      this.removeMsgColorStyles(formattedMsgContent)
    );
  }

  removeMsgColorStyles(formattedMsgContent) {
    return formattedMsgContent
      .replace(/style="[^"]*color:[^;"]*;?[^"]*"/g, (match) => {
        return match.replace(/color:[^;"]*;?\s*/g, '');
      })
      .replace(/\s*style=""/g, '');
  }

  async handleSendMsg(
    sendType: {
      action: SendOption;
      value: string;
      isTrudi: boolean;
    },
    defaultValue?: ISendMsgPayload
  ) {
    this.isSubmitted = true;
    const tempConversationId = uuidv4();

    const { conversationId, taskId } = this.activatedRoute.snapshot.queryParams;
    if (
      !defaultValue &&
      (!this.selectedReceivers?.value?.length ||
        !(
          this.msgContent?.value ||
          this.listOfFiles.value?.length ||
          this.selectedContactCardControl.value?.length
        ) ||
        !this.msgTitle?.value?.trim())
    ) {
      return;
    }
    switch (sendType.action) {
      // @ts-ignore
      case SendOption.SendResolve:
        this.sendMsgForm.get('isResolveConversation')?.setValue(true);
      case SendOption.Send:
        const isCreateNewAppMessage = this.helper.isNewMessageCompose;
        const body = this.trudiSendMsgService.getSendMsgBodyv2(
          this.getFormValue({ isTrudi: sendType.isTrudi }),
          this.configs,
          null,
          false,
          false,
          true,
          true
        );

        const { tempId, contacts = [], files = [] } = body.emailMessage;
        const getTempIds = [
          tempId,
          ...contacts.map((contact) => contact.tempId),
          ...files.map((file: IFile) => file.tempId)
        ];
        body.emailMessage.tempIds = getTempIds;
        if (taskId && conversationId) {
          body.emailMessage.taskId = taskId;
          body.emailMessage.conversationId = conversationId;
        }
        this.isLoading = true;
        this.onSendMsg.emit({
          type: ISendMsgType.NEW_MESSAGE,
          data: body,
          isDraft: this.isDraftTab,
          event: ESentMsgEvent.SENDING,
          isCreateAppMessage: isCreateNewAppMessage,
          isCreateMessageFromUserProfile: this.isCreateMessageFromUserProfile,
          tempConversationId
        });
        this.resetFormValue(false);
        this.sendMessagev2({
          body,
          isCreateNewAppMessage,
          tempConversationId,
          sendType
        });
        break;
      case SendOption.Resend:
        this.sendMessagev2({
          body: defaultValue,
          isCreateNewAppMessage: true,
          tempConversationId,
          sendType
        });
        break;
      default:
        break;
    }
  }

  sendMessagev2({ body, isCreateNewAppMessage, tempConversationId, sendType }) {
    this.trudiSendMsgService.sendMessageV2(body).subscribe({
      next: (res: ISendMsgResponseV2) => {
        this.trudiSaveDraftService.setDraftMsgId(null);
        this.confirmCreateLinkReiForm(res.task?.id);
        this.filesService.reloadAttachments.next(true);
        this.handleShowToastMessage(sendType.action, res);
        const event = {
          type: ISendMsgType.NEW_MESSAGE,
          data: res,
          isDraft: this.isDraftTab,
          event: ESentMsgEvent.SUCCESS,
          isCreateAppMessage: isCreateNewAppMessage,
          isCreateMessageFromUserProfile: this.isCreateMessageFromUserProfile,
          tempConversationId
        };
        if (isCreateNewAppMessage) {
          this.conversationService.triggerSendMessage.next(event);
        }
        this.onSendMsg.emit(event);
        if (
          res.conversation.status === CONVERSATION_STATUS.RESOLVED &&
          this.router.url.includes('fromScratch')
        ) {
          let navigatePath = [];
          if (this.helper.isInboxDetail) {
            navigatePath = ['/dashboard', 'inbox', 'detail', res.task?.id];
          }
          this.router.navigate(navigatePath, {
            queryParams: {
              fromScratch: null,
              appMessageCreateType: null
            },
            queryParamsHandling: 'merge'
          });
        }
      },
      complete: () => {
        if (
          this.deleteInlineType === EDeleteInLineType.CONVERSATION_LINKED_APP
        ) {
          this.deleteInlineType = null;
        }
        this.store.dispatch(appMessageActions.removeTempMessage({}));
        this.isLoading = false;
        this.trudiSaveDraftService.resetTrackControl();
        this.triggerResizeAppCompose$.next(true);
      },
      error: (err) => {
        this.isLoading = false;
        if (!err?.error?.message) return;
        try {
          const tempIds = JSON.parse(err.error.message)?.tempIds || [];
          this.onSendMsg.emit({
            type: ISendMsgType.NEW_MESSAGE,
            event: ESentMsgEvent.ERR,
            isCreateAppMessage: isCreateNewAppMessage,
            isCreateMessageFromUserProfile: this.isCreateMessageFromUserProfile,
            tempIds,
            tempConversationId
          });
        } catch {}
        this.conversationService.filterTempConversations(
          (item) => item.id !== tempConversationId,
          'SCHEDULE_MSG_ERROR'
        );
      }
    });
  }

  setSender(isTrudi: boolean) {
    this.selectedSenderControl.setValue({
      ...this.selectedSenderControl.value,
      id: isTrudi ? trudiUserId : this.currentUser?.id
    });
  }

  get listOfFiles() {
    return this.sendMsgForm?.get('listOfFiles');
  }

  onClearContact(_contact: ISelectedReceivers, indexContact: number) {
    if (this.selectedContactCardControl.value.length > 0) {
      const selectedContactCard = this.selectedContactCardControl.value.filter(
        (_it, index) => index !== indexContact
      );
      this.selectedContactCardControl?.setValue(selectedContactCard);
      this.trudiSendMsgFormService.setSelectedContactCard(selectedContactCard);
      this.handleChangeFormValue('contact');
    }
  }

  onContentResize({ height, mouseEvent }: NzResizeEvent): void {
    clearTimeout(this.contentResizeTimeout);
    this.contentResizeTimeout = setTimeout(() => {
      cancelAnimationFrame(this.id);
      this.id = requestAnimationFrame(() => {
        this.contentHeight = height!;
        this._textBoxHeight = this.contentHeight - this.attachmentsHeight;
        this.onMsgResize.emit(this.contentHeight);
      });
      this.cdr.markForCheck();
    }, 200);
  }

  handleChangeFormValue(key) {
    this.trudiSaveDraftService.setTrackControlChange(key, true);
  }

  subscribeAutoSaveDraft() {
    this.subscription = this.trudiSaveDraftService.triggerControlChange$
      .pipe(
        tap(() => (this.userChangedFormValue = true)),
        filter(() => !this.loadingCreateScratch),
        debounceTime(3000),
        takeUntil(this.destroy$),
        filter(() => !this.isLoading)
      )
      .subscribe(() => {
        this.handleSaveDraft(true);
      });
  }

  handleSaveDraft(isAutoSaveDraft = false) {
    if (
      !this.userChangedFormValue ||
      this.isConsole ||
      this.loadingCreateScratch
    ) {
      return;
    }

    const { conversationId, taskId, appMessageCreateType } =
      this.activatedRoute.snapshot.queryParams;

    const draftMessageId = this.trudiSaveDraftService.getDraftMsgId;

    if (
      this.checkShouldDeleteDraft(
        isAutoSaveDraft,
        conversationId,
        taskId,
        appMessageCreateType
      )
    ) {
      this.conversationService
        .deleteDraftMsg({
          taskId,
          conversationId,
          draftMessageId,
          isFromDraftFolder: false
        })
        .subscribe(() => {
          this.trudiSaveDraftService.setDraftMsgId(null);
        });

      return;
    }

    const isCacheConversationAppLog = JSON.parse(
      JSON.stringify(this.configs || {})
    )?.serviceData?.conversationService?.currentConversation?.isAppMessageLog;

    const isNavigateBeforeSaveDraft =
      this.checkEmptyValuesForm() && !isAutoSaveDraft && !draftMessageId;
    if (isCacheConversationAppLog || isNavigateBeforeSaveDraft) return;

    if (!draftMessageId) {
      this.trudiSaveDraftService.setDraftMsgId(uuidv4());
    }
    const currentDraftId = this.trudiSaveDraftService.getDraftMsgId;
    const body = this.trudiSendMsgService.getSendMsgBodyv2(
      this.getFormValue(null, true),
      this.configs,
      null,
      false,
      true
    );

    if (taskId && conversationId) {
      body.emailMessage.taskId = taskId;
      body.emailMessage.conversationId = conversationId;
    }
    body.isAutoSaveDraft = isAutoSaveDraft;
    this.trudiSaveDraftService
      .saveDraft(body, false, false)
      .subscribe((res) => {
        this.trudiSaveDraftService.resetTrackControl();
        this.resetTinyTrackControl();
        if (!isAutoSaveDraft) {
          currentDraftId === this.trudiSaveDraftService.getDraftMsgId &&
            this.resetFormValue();

          if (!res) {
            this.toastService.success(DRAFT_SAVED);
            return;
          }
          const { conversation, task } = res as ISendMsgResponseV2;
          const { inboxType, mailBoxId } =
            this.activatedRoute.snapshot.queryParams;

          const linkPram = {
            domain: 'https://fake.url',
            path: `/inbox/sms-messages/${
              (res as ISendMsgResponseV2)?.conversation?.status ===
              TaskStatusType.resolved
                ? 'resolved'
                : 'all'
            }`,
            params: <{}>{
              status:
                (res as ISendMsgResponseV2)?.conversation?.status ===
                TaskStatusType.resolved
                  ? TaskStatusType.completed
                  : TaskStatusType.inprogress,
              inboxType,
              taskId: task.id,
              conversationId: conversation.id,
              mailBoxId
            }
          };
          const defaultLink = generateLink(linkPram);
          this.toastCustomService.openToastCustom(
            {
              conversationId: conversation.id,
              taskId: task.id,
              mailBoxId,
              taskType: TaskType.MESSAGE,
              isShowToast: true,
              defaultMessage: DRAFT_SAVED,
              defaultIcon: EToastType.SUCCESS,
              defaultLink
            },
            true
          );
        }
      });
  }

  checkShouldDeleteDraft(
    isAutoSaveDraft,
    conversationId,
    taskId,
    appMessageCreateType
  ) {
    // Conditions to delete draft
    const shouldDeleteDraft =
      ((!this.selectedReceivers?.value?.length && !this.msgTitle?.value) ||
        (conversationId && taskId && !appMessageCreateType)) &&
      !isAutoSaveDraft &&
      this.checkEmptyValuesForm() &&
      !this.currentConversation?.isScratchTicket &&
      this.trudiSaveDraftService.getDraftMsgId;

    return shouldDeleteDraft;
  }

  confirmCreateLinkReiForm(taskId: string) {
    const formIdsArr = this.reiFormService.createReiFormLink$.value.outSide.map(
      (value) => value.formDetail.id.toString()
    );
    const formIds = [...new Set(formIdsArr)];
    if (this.popupState.addReiFormOutside) {
      this.reiFormService
        .confirmCreateLinkReiForm(formIds, taskId)
        .subscribe((reiFormLinks) => {
          if (reiFormLinks) {
            this.reiFormService.clearReiFormLinkOutside();
            reiFormLinks.forEach((reiFormLink) => {
              if (reiFormLink.formDetail.isCompleted) {
                this.filesService.reloadAttachments.next(true);
              }
            });
          }
        });
    }
  }

  handleChangeTypeSendMessage(value: SendOption) {
    this.configs.body.typeSendMsg = value;
    this.trudiSaveDraftService.setTrackControlChange('sendOption', true);
    this.configs.body.timeSchedule = null;
  }

  subscribeSelectedReceiverChange() {
    this.selectedReceivers?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        const selectedReceiver = rs?.[0] as ISelectedReceivers;
        this.currentReceiverProperty = {
          streetline: selectedReceiver?.streetLine,
          id: selectedReceiver?.propertyId
        };

        if (
          this.configs.otherConfigs.createMessageFrom !==
            ECreateMessageFrom.TASK_DETAIL ||
          (this.configs.otherConfigs.createMessageFrom ===
            ECreateMessageFrom.TASK_DETAIL &&
            !this.taskProperty)
        ) {
          this.property.setValue(this.currentReceiverProperty);
        }

        if (!rs?.length) {
          this.trudiDynamicParameterService.resetAppDynamicParameter();
        }

        this.listDynamicParams = handleDisabledDynamicParamsByProperty(
          this.listDynamicParams,
          !this.currentConversation.isTemporaryProperty,
          this.currentCompany?.agencies,
          EConversationType.SMS
        );
      });
  }

  handleShowToastMessage(option: SendOption, response: ISendMsgResponseV2) {
    switch (option) {
      case SendOption.SendResolve:
        const data: TypeDataFortoast = {
          taskId: response.task.id,
          conversationId: response.conversation.id,
          isAppMessage: true,
          conversationType: EConversationType.SMS,
          isShowToast: true,
          status: TaskStatusType.resolved,
          taskType: response.task.type,
          type: SocketType.changeStatusTask
        };
        this.toastCustomService.openToastCustom(
          data,
          true,
          EToastCustomType.SUCCESS_WITH_VIEW_BTN,
          false
        );
        break;
      default:
        break;
    }
  }

  checkEmptyValuesForm() {
    const scratchDraftCheck =
      this.composeType === ComposeEditorType.NEW
        ? !this.selectedReceivers?.value.length && !this.msgTitle.value
        : true;

    return (
      scratchDraftCheck &&
      !this.msgContent?.value &&
      !this.listOfFiles?.value?.length &&
      !this.selectedContactCardControl?.value?.length
    );
  }

  resetWhenConversationChange(conversationChange: SimpleChange) {
    if (!conversationChange) return;
    const { previousValue, currentValue } = conversationChange;
    if (previousValue?.id !== currentValue?.id) {
      this.configs.body.typeSendMsg = SendOption.Send;
    }
  }

  handleContentHeightChange(height: number) {
    if (!height) return;
    const toolbarHeight = 72;
    const attachmentsHeight = this.attachmentsHeight;
    this.minHeight = this.DEFAULT_HEIGHT + attachmentsHeight;
    this.onContentResize({
      height: Math.max(
        Math.min(Number(height + toolbarHeight), this.CONTENT_MAX_HEIGHT),
        this.minHeight
      )
    });
  }

  onOutSide() {
    if (!this.currentModal) {
      this.aiInteractiveBuilderService.closeAIReplyPopover();
    }
  }

  ngOnDestroy() {
    clearTimeout(this.contentResizeTimeout);
    this.userChangedFormValue = false;
    this.trudiSaveDraftService.setDraftMsgId(null);
    this.destroy$.next(true);
    this.destroy$.complete();
    this.smsMessageListService.setPreFillCreateNewMessage(null);
    this.subscription?.unsubscribe();
  }
}
