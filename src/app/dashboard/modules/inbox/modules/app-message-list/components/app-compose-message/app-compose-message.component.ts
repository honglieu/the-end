import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { MessageFlowService } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { SharedService } from '@services/shared.service';
import { SendOption } from '@shared/components/tiny-editor/tiny-editor.component';
import {
  EConversationType,
  EInviteStatus,
  EMailBoxStatus,
  EMailBoxType,
  EMessageType,
  EUserDetailStatus,
  EUserPropertyType,
  SocketType,
  TaskStatusType
} from '@shared/enum';
import { FilesService } from '@services/files.service';
import { ReiFormService } from '@services/rei-form.service';
import { SendMessageService } from '@services/send-message.service';
import { TaskType } from '@shared/enum';
import { CurrentUser, IMailBox } from '@shared/types/user.interface';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { TrudiScheduledMsgService } from '@/app/trudi-scheduled-msg/services/trudi-scheduled-msg.service';
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
  IContactInfo,
  IFromUserMailBox,
  ISelectedReceivers,
  ISendMsgConfigs,
  ISendMsgPayload,
  ISendMsgResponseV2,
  ISendMsgTriggerEvent,
  ISendMsgType,
  UserConversationOption
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  AfterViewInit,
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
import { ToastrService } from 'ngx-toastr';
import {
  combineLatest,
  debounceTime,
  filter,
  Subject,
  tap,
  startWith,
  takeUntil,
  first,
  switchMap,
  of,
  catchError,
  map,
  throttleTime,
  Subscription,
  finalize,
  distinctUntilChanged,
  pairwise
} from 'rxjs';
import {
  EAppMessageCreateType,
  EDeleteInLineType
} from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';
import { AppMessageListService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-list.service';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { ConversationService } from '@services/conversation.service';
import uuidv4 from 'uuid4';
import dayjs from 'dayjs';
import { UserConversation } from '@shared/types/conversation.interface';
import { TrudiSendMsgHelperFunctionsService } from '@/app/trudi-send-msg/services/trudi-send-msg-helper-functions.service';
import { InlineMessageEditorComponent } from './components/inline-message-editor/inline-message-editor.component';
import {
  ChatGptService,
  EBoxMessageType,
  IGenerateSendMsgBody
} from '@services/chatGpt.service';
import {
  HandleInitAISummaryContent,
  generateLink,
  validateWhiteSpaceHtml
} from '@shared/feature/function.feature';
import {
  PT_LIST_DYNAMIC_PARAMETERS,
  RM_LIST_DYNAMIC_PARAMETERS
} from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import { CompanyService } from '@services/company.service';
import { APP_DRAFT_SAVED } from '@services/messages.constants';
import {
  EConversationStatus,
  EConversationStatusTab
} from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import {
  CONVERSATION_STATUS,
  ErrorMessages,
  trudiUserId
} from '@services/constants';
import { TrudiDynamicParameterDataService } from '@/app/trudi-send-msg/services/trudi-dynamic-parameter-data.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { Store } from '@ngrx/store';
import { appMessageActions } from '@core/store/app-message/actions/app-message.actions';
import { IParticipant as IParticipantConversation } from '@shared/types/conversation.interface';
import {
  EToastCustomType,
  TypeDataFortoast
} from '@/app/toast-custom/toastCustomType';
import { EToastType } from '@/app/toast/toastType';
import { TaskService } from '@services/task.service';
import { ICompany } from '@shared/types/company.interface';
import { HelperService } from '@services/helper.service';
import { IFile } from '@shared/types/file.interface';
import { Property } from '@/app/shared/types';
import { TrudiAddContactCardService } from '@/app/shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { AiInteractiveBuilderService } from '@/app/shared/components/tiny-editor/services/ai-interactive-builder.service';
import { ReplyMessageService } from '@services/reply-message.service';
import { EModalID } from '@/app/dashboard/services/modal-management.service';
import { EContactTypeUserProperty } from '@/app/user/list-property-contact-view/model/main';
import { AI_INTERACTIVE_WHITE_LIST } from '@/app/dashboard/components/ai-interactive-bubble/utils/constant';
import { removeLastWhiteSpaceFromContent } from '@/app/shared';
import { isEmpty } from 'lodash-es';
import { RxWebsocketService } from '@/app/services';
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
  selector: 'app-compose-message',
  templateUrl: './app-compose-message.component.html',
  styleUrls: ['./app-compose-message.component.scss'],
  providers: [
    TrudiSendMsgHelperFunctionsService,
    TrudiSaveDraftService,
    TrudiSendMsgService,
    TrudiDynamicParameterService,
    TrudiDynamicParameterDataService,
    TrudiSendMsgFormService
  ]
})
export class AppComposeMessageComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @ViewChild('inlineTinyEditor', { static: false })
  inlineMessageEditorComponent: InlineMessageEditorComponent;
  @Input() configs: ISendMsgConfigs = {
    ...defaultConfigs,
    otherConfigs: {
      ...defaultConfigs?.otherConfigs,
      createMessageFrom: ECreateMessageFrom.APP_MESSAGE,
      isCreateMessageType: false
    },
    inputs: {
      ...defaultConfigs.inputs,
      isAppMessage: true
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
  @Input() hasGroupMessage: boolean;

  @Output() onSendMsg = new EventEmitter<IAppTriggerSendMsgEvent>();
  @Output() onMsgResize = new EventEmitter();
  @Output() onSelectedReceiversChange = new EventEmitter<ISelectedReceivers>();
  public readonly ComposeEditorType = ComposeEditorType;
  public isCreateMessageFromUserProfile: boolean;

  private currentMailBoxId: string;
  private subscription: Subscription;
  private listMailBoxs = [];
  private currentMailBox: IMailBox;
  private listSenderMailBox: IFromUserMailBox[] = [];
  public currentUser: CurrentUser;
  public isConsole: boolean = false;
  public isLoading = false;
  public listDynamicParams = [];
  public destroy$ = new Subject();
  public id: number;
  readonly DEFAULT_HEIGHT = 198;
  public CONTENT_MAX_HEIGHT = 500;
  public contentHeight: number = this.DEFAULT_HEIGHT;
  public minHeight: number = this.DEFAULT_HEIGHT;
  private _textBoxHeight = this.DEFAULT_HEIGHT; // height of inline send message without attachments
  private canEditComposeSize = false;

  private userChangedFormValue: boolean = false;
  private isDraftTab: boolean = false;
  public prefillText: string = '';
  public selectTimeSchedule: string;
  public scheduleDate: string;
  public currentReceiverProperty: { streetline: string; id: string };
  public errorMessage: string;
  public isShowModalWarning: boolean = false;
  private currentModal: EModalID;
  public EUserDetailStatus = EUserDetailStatus;
  public EInviteStatus = EInviteStatus;

  private createNewMessageTypes = [
    EAppMessageCreateType.NewAppMessage,
    EAppMessageCreateType.ReplyViaApp
  ];

  public appMessageCreateType: EAppMessageCreateType = null;
  public currentCompany: ICompany;
  public errorMsg: boolean = false;
  public timeSecond: number;
  public date: number;
  public SendOption = SendOption;
  public triggerResizeAppCompose$ = new Subject<boolean>();
  public whiteList = AI_INTERACTIVE_WHITE_LIST;
  public sendOptionsToRemove = [SendOption.ScheduleForSend];

  constructor(
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private inboxService: InboxService,
    private userService: UserService,
    private trudiSendMsgService: TrudiSendMsgService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private appMessageListService: AppMessageListService,
    private messageFlowService: MessageFlowService,
    private conversationService: ConversationService,
    public elementRef: ElementRef<HTMLElement>,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private sendMessageService: SendMessageService,
    private trudiScheduledMsgService: TrudiScheduledMsgService,
    private trudiSendMsgHelperFunctionsService: TrudiSendMsgHelperFunctionsService,
    private toastCustomService: ToastCustomService,
    private toastService: ToastrService,
    private reiFormService: ReiFormService,
    private filesService: FilesService,
    private chatGptService: ChatGptService,
    private companyService: CompanyService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private trudiDynamicParameterDataService: TrudiDynamicParameterDataService,
    private readonly store: Store,
    private taskService: TaskService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private helper: HelperService,
    private aiInteractiveBuilderService: AiInteractiveBuilderService,
    private replyMessageService: ReplyMessageService,
    private readonly websocketService: RxWebsocketService
  ) {}

  get selectedReceivers() {
    return this.sendMsgForm?.get('selectedReceivers');
  }

  get property() {
    return this.sendMsgForm?.get('property');
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
        startWith(null),
        pairwise(),
        takeUntil(this.destroy$)
      )
      .subscribe(([prevRes]) => {
        const prevQueryString = (prevRes as NavigationStart)?.url;

        const AILoadingState = this.chatGptService.onLoading.getValue();
        const isAIGenerating =
          AILoadingState?.type === EBoxMessageType.INLINE_MESSAGE &&
          AILoadingState.status;

        if (isAIGenerating) {
          this.userChangedFormValue = true;
          this.trudiSaveDraftService.setDraftMsgId(uuidv4());
        }
        if (
          (this.trudiSaveDraftService.getDraftMsgId ||
            this.userChangedFormValue) &&
          !this.isLoading &&
          (prevQueryString?.includes(EAppMessageCreateType.NewAppMessage)
            ? prevQueryString?.includes('conversationId')
            : true)
        ) {
          this.resetTinyTrackControl();
          this.handleSaveDraft(false);
          this.userChangedFormValue = false;
        }
      });
    this.subscribeChatGptGenerateForScratch();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.trudiSendMsgFormService.buildFormV3();
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
    this.subscribeSelectedReceiverChange();
    this.appMessageListService.prefillDataAppMessage$
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
          this.appMessageListService.triggerSaveDraftFirstReply.getValue() &&
          this.selectedReceivers.value?.length
        ) {
          this.appMessageListService.triggerSaveDraftFirstReply.next(false);
          this.userChangedFormValue = true;
        }
        if (!url.includes(EAppMessageCreateType.NewAppMessage)) {
          if (
            !this.isComposeNewMsg &&
            this.taskProperty &&
            res.receivers?.[0] &&
            res.receivers[0].propertyId !== this.taskProperty?.id
          ) {
            this.selectedReceivers.setValue([]);
            this.handleChangeFormValue('selectedReceivers');
          } else {
            this.selectedReceivers.setValue(res.receivers);
          }
        } else if (this.isCreateMessageFromUserProfile) {
          this.selectedReceivers.setValue(res.receivers);
        }

        const sendOptions = res?.sendOptions;
        const newConfigs = {
          ...this.configs,
          otherConfigs: {
            ...this.configs.otherConfigs,
            scheduleDraft: sendOptions?.time
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
      .pipe(startWith(null), pairwise(), takeUntil(this.destroy$))
      .subscribe(([prevParams, currentParams]) => {
        this.appMessageCreateType = currentParams?.['appMessageCreateType'];
        if (
          this.appMessageCreateType === EAppMessageCreateType.NewAppMessage &&
          currentParams?.['conversationId'] &&
          currentParams?.['taskId']
        ) {
          return;
        }

        if (
          currentParams?.['appMessageCreateType'] ===
            EAppMessageCreateType.NewAppMessage &&
          !this.isCreateMessageFromUserProfile
        ) {
          if (
            !currentParams?.['conversationId'] &&
            !currentParams?.['taskId'] &&
            this.sendMsgForm
          ) {
            this.appMessageListService.setPreFillCreateNewMessage({});
          }
          if (prevParams) {
            const isResetAllFormValue =
              prevParams['appMessageCreateType'] !==
              EAppMessageCreateType.NewAppMessage;
            this.resetFormValue(isResetAllFormValue);
          }
        }

        if (
          currentParams?.['appMessageCreateType'] ===
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
          currentParams['status'] === TaskStatusType.draft || // for app messages index
          currentParams['tab'] === EConversationStatus.draft; // for task detail
      });

    this.conversationService.triggerDeleteFromInline
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        switch (type) {
          case EDeleteInLineType.CONVERSATION_LINKED_APP:
            const conversationId = this.currentConversation?.id;
            this.handleDeleteConversationApp(conversationId);
            break;
          case EDeleteInLineType.DRAFT_APP_MESSAGE:
            this.handleDeleteDraftConversations();
            break;
          default:
            break;
        }
      });

    this.getDynamicParamsByCrm();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$), filter(Boolean))
      .subscribe((value) => {
        this.currentCompany = value;
      });
    this.subscribeSocketPmJoinConversation();
  }

  ngAfterViewInit(): void {
    this.handleAutoResizeSendMsgInline();
  }

  handlePrefillDataAppMessage(conversation: UserConversation) {
    const appUser = getUserFromParticipants(
      conversation.participants as IParticipantConversation[]
    )?.[0];
    const isDraftMessage = conversation.lastMessageDraft;
    this.appMessageListService.setPreFillCreateNewMessage({
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

  updateHeightCompose() {
    const attachmentsHeight =
      this.elementRef.nativeElement.querySelector('.attachments')
        ?.clientHeight || 0;
    const scheduleHeight =
      this.elementRef.nativeElement.querySelector('.schedule-msg')
        ?.clientHeight || 0;

    this.minHeight = this.DEFAULT_HEIGHT + attachmentsHeight + scheduleHeight;
    let contentHeight =
      this._textBoxHeight + attachmentsHeight + scheduleHeight;

    if (contentHeight > this.CONTENT_MAX_HEIGHT) {
      this._textBoxHeight =
        this.CONTENT_MAX_HEIGHT - attachmentsHeight - scheduleHeight;
      contentHeight = this.CONTENT_MAX_HEIGHT;
    }
    this.contentHeight = contentHeight;
    this.onMsgResize.emit(this.contentHeight);
  }

  handleAutoResizeSendMsgInline() {
    combineLatest([
      this.listOfFiles.valueChanges.pipe(startWith([])),
      this.trudiSendMsgFormService.selectedContactCard$,
      this.triggerResizeAppCompose$.pipe(startWith(false))
    ])
      .pipe(takeUntil(this.destroy$), debounceTime(100))
      .subscribe(() => {
        this.updateHeightCompose();
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

  subscribeChatGptGenerateForScratch() {
    if (this.composeType === ComposeEditorType.REPLY) return;
    this.chatGptService.onGenerate
      .pipe(
        takeUntil(this.destroy$),
        throttleTime(300),
        filter((data) => Boolean(data)),
        filter((data) => this.composeType === ComposeEditorType.NEW),
        switchMap((data) => {
          const receiver = this.selectedReceivers?.value[0];
          const body: IGenerateSendMsgBody = {
            ...this.chatGptService.generateBody.value,
            receiveUserIds: receiver ? [receiver?.id] : [],
            propertyId: receiver?.propertyId,
            taskData: {}
          };
          this.chatGptService.onLoading.next({
            type: EBoxMessageType.INLINE_MESSAGE,
            status: true
          });
          return this.chatGptService.generateSendMsg(body).pipe(
            map((apiResponse) => {
              return { response: apiResponse, data };
            }),
            tap(() => {
              this.chatGptService.onLoading.next({
                type: EBoxMessageType.INLINE_MESSAGE,
                status: false
              });
              this.chatGptService.onGenerate.next(null);
            }),
            catchError((err) => {
              console.error(err);
              this.toastService.error(
                'AI failed to generate reply. Please try again.'
              );
              this.chatGptService.onLoading.next({
                type: EBoxMessageType.INLINE_MESSAGE,
                status: false
              });
              this.chatGptService.onGenerate.next(null);
              return of();
            })
          );
        })
      )
      .subscribe(({ response, data }) => {
        if (!response?.content) return;
        const lines = this.chatGptService.processContentAI(response?.content);

        const paragraphs = lines.map(
          (line: string) => `<p>${line || '&nbsp;'}</p>`
        );
        const outputHTML = paragraphs.join('');
        const initAISummaryContent = HandleInitAISummaryContent(outputHTML);
        // const currentSender = this.selectedSenderControl
        //   ?.value as IFromUserMailBox;
        // const { mailBoxId } = currentSender;
        // const { currentUserId, toneOfVoice } =
        //   this.chatGptService.generateBody.value;
        // const newSender =
        //   this.trudiSendMsgService.listSenderMailBoxBS.value.find(
        //     (senderMailBox) =>
        //       senderMailBox.id === currentUserId &&
        //       senderMailBox.mailBoxId === mailBoxId
        //   );
        // if (newSender) {
        //   this.selectedSenderControl?.setValue(newSender);
        // }
        this.chatGptService.replyContent.next(initAISummaryContent);
        this.chatGptService.replyFrom.next(EBoxMessageType.INLINE_MESSAGE);
        this.chatGptService.onGenerated.next({
          type: EBoxMessageType.INLINE_MESSAGE,
          status: true
        });
      });
  }

  handleDeleteConversationApp(conversationId) {
    this.isLoading = true;
    this.conversationService
      .deleteConversationApp({
        conversationId,
        draftMessageId: this.trudiSaveDraftService.getDraftMsgId
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: () => {
          this.resetFormValue(true);
          const isIndexApp = this.router.url.includes('inbox/app-messages');
          if (isIndexApp) {
            this.router.navigate([], {
              queryParams: {
                conversationId: null,
                taskId: null,
                tempConversationId: null,
                fromScratch: null
              },
              queryParamsHandling: 'merge'
            });
            this.appMessageListService.triggerRemoveMsgDraftFromOpen.next(
              conversationId
            );
            return;
          }
          this.conversationService.reloadConversationList.next(true);
          this.router.navigate(
            ['dashboard', 'inbox', 'detail', this.currentConversation.taskId],
            {
              queryParams: {
                type: 'TASK',
                conversationId: null,
                tempConversationId: null,
                fromScratch: null
              },
              queryParamsHandling: 'merge'
            }
          );
        },
        error: (error) => {}
      });
  }

  handleDeleteDraftConversations() {
    if (this.trudiSaveDraftService.getDraftMsgId) {
      this.isLoading = true;
      this.conversationService
        .deleteDraftMsg({
          taskId: undefined,
          conversationId: undefined,
          draftMessageId: this.trudiSaveDraftService.getDraftMsgId,
          isFromDraftFolder: false,
          isDeleteQueue: true
        })
        .pipe(
          catchError(() => of(null)),
          finalize(() => (this.isLoading = false))
        )
        .subscribe(() => {
          this.resetFormValue(true);
          this.navigateToDefaultPage();
        });
    } else {
      this.resetFormValue();
      this.navigateToDefaultPage();
    }
  }

  navigateToDefaultPage() {
    switch (this.configs.otherConfigs.createMessageFrom) {
      case ECreateMessageFrom.APP_MESSAGE:
        this.router.navigate([], {
          queryParams: {
            conversationId: null,
            taskId: null,
            appMessageCreateType: null,
            tempConversationId: null,
            fromScratch: null
          },
          queryParamsHandling: 'merge'
        });
        break;
      case ECreateMessageFrom.TASK_DETAIL:
        if (this.router.url.includes('app-messages')) {
          const taskId = this.configs.serviceData.taskService.currentTask.id;
          const queryParams = {
            conversationId: null,
            conversationType: null,
            tab: EConversationStatus.open,
            tempConversationId: null,
            fromScratch: null
          };
          this.router
            .navigate([`/dashboard/inbox/detail/${taskId}`], {
              queryParams,
              queryParamsHandling: 'merge'
            })
            .then(() => {
              this.taskService.reloadTaskDetail.next(true);
            });
          return;
        }
        this.router.navigate([], {
          queryParams: {
            conversationId: null,
            appMessageCreateType: null,
            conversationType: null,
            tempConversationId: null,
            fromScratch: null
          },
          queryParamsHandling: 'merge'
        });
    }
  }

  resetFormValue(isResetAll = false) {
    if (isResetAll) {
      this.trudiSaveDraftService.setDraftMsgId(null);
      this.isSubmitted = false;
      this.selectedReceivers.setValue([]);
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
    this.trudiAddContactCardService.resetSelectedContactCard();
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

      if (
        this.currentConversation &&
        (changes['currentConversation']?.currentValue?.id !==
          changes['currentConversation']?.previousValue?.id ||
          changes['currentConversation']?.currentValue?.status !==
            changes['currentConversation']?.previousValue?.status)
      ) {
        this.handlePrefillDataAppMessage(this.currentConversation);
      }
      //reset fields when conversation change
      this.resetWhenConversationChange(changes['currentConversation']);
    }

    if (changes['taskProperty']) {
      if (this.property) this.onTaskPropertyChange();
    }
  }

  onTaskPropertyChange() {
    if (this.taskProperty) this.property.setValue(this.taskProperty);
    if (
      this.isComposeNewMsg &&
      this.selectedReceivers.value?.length &&
      this.selectedReceivers.value[0].propertyId != this.taskProperty.id
    )
      this.selectedReceivers.setValue([]);
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
    let formattedMsgContent = validateWhiteSpaceHtml(msgContent)
      ? isSaveDraft
        ? ''
        : `<p></p>`
      : msgContent;

    return {
      ...this.sendMsgForm.value,
      msgContent:
        msgContent === ''
          ? isSaveDraft
            ? ''
            : `<p></p>`
          : removeLastWhiteSpaceFromContent(formattedMsgContent),
      selectedSender: selectedSender
    };
  }

  getTitleByContactType(contact: IContactInfo) {
    switch (contact.type) {
      case EUserPropertyType.LEAD:
        return EContactTypeUserProperty.PROPERTY_MANAGER;
      case EUserPropertyType.SUPPLIER:
        return EContactTypeUserProperty.SUPPLIER;
      case EUserPropertyType.OTHER:
        return EContactTypeUserProperty.OTHER_CONTACT;
      default:
        return contact.title;
    }
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
    if (
      !defaultValue &&
      (!this.selectedReceivers.value?.length ||
        !(
          this.msgContent?.value ||
          this.listOfFiles.value?.length ||
          this.selectedContactCardControl.value?.length
        ))
    ) {
      return;
    }
    switch (sendType.action) {
      // @ts-ignore
      case SendOption.SendResolve:
        const conversation =
          this.conversationService.currentConversation?.value;
        if (conversation?.scheduleMessageCount) {
          this.errorMessage = ErrorMessages.RESOLVE_CONVERSATION;
          this.isShowModalWarning = true;
          return;
        }
      case SendOption.Send:
        this.sendMsgForm
          .get('isResolveConversation')
          ?.setValue(sendType.action === SendOption.SendResolve);
        const isCreateNewAppMessage = this.helper.isNewMessageCompose;
        const body = this.trudiSendMsgService.getSendMsgBodyv2(
          this.getFormValue({ isTrudi: sendType.isTrudi }),
          this.configs,
          null,
          false,
          false,
          true
        );

        body.emailMessage.contacts = body.emailMessage.contacts.map(
          (contact) => ({
            ...contact,
            title: this.getTitleByContactType(contact)
          })
        );

        const { tempId, contacts = [], files = [] } = body.emailMessage;
        const getTempIds = [
          tempId,
          ...contacts.map((contact) => contact.tempId),
          ...files.map((file: IFile) => file.tempId)
        ];
        body.emailMessage.tempIds = getTempIds;
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
      case SendOption.ScheduleForSend:
        const currentDate = dayjs(new Date());
        const selectedDate = dayjs(this.selectTimeSchedule);
        if (selectedDate.isBefore(currentDate)) {
          return;
        }
        if (this.configs.body.timeSchedule) {
          this.scheduleMessage({
            isTrudi: sendType?.isTrudi,
            tempConversationId
          });
        }
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
        this.clearChatGptReply();
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
        this.clearChatGptReply();
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
      this.trudiAddContactCardService.setSelectedContactCard([
        ...selectedContactCard
      ]);
      this.handleChangeFormValue('contact');
    }
  }

  onContentResize({ height, mouseEvent }: NzResizeEvent): void {
    const attachmentsHeight =
      this.elementRef.nativeElement.querySelector('.attachments')
        ?.clientHeight || 0;
    const scheduleHeight =
      this.elementRef.nativeElement.querySelector('.schedule-msg')
        ?.clientHeight || 0;
    cancelAnimationFrame(this.id);
    this.id = requestAnimationFrame(() => {
      this.contentHeight = height!;
      this._textBoxHeight =
        this.contentHeight - attachmentsHeight - scheduleHeight;
      this.onMsgResize.emit(this.contentHeight);
    });
  }

  handleChangeFormValue(key) {
    this.trudiSaveDraftService.setTrackControlChange(key, true);
  }

  clearChatGptReply() {
    this.chatGptService.reset();
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
        if (!this.currentConversation?.id) return;
        this.handleSaveDraft(true);
      });
  }

  handleSaveDraft(isAutoSaveDraft = false) {
    if (
      !this.userChangedFormValue ||
      this.isConsole ||
      this.loadingCreateScratch
    )
      return;
    const { conversationId, taskId, appMessageCreateType } =
      this.activatedRoute.snapshot.queryParams;

    if (
      (!this.selectedReceivers.value?.length ||
        (conversationId && taskId && !appMessageCreateType)) &&
      !isAutoSaveDraft &&
      this.checkEmptyValuesForm() &&
      !this.currentConversation?.isScratchTicket &&
      this.trudiSaveDraftService.getDraftMsgId
    ) {
      this.conversationService
        .deleteDraftMsg({
          taskId,
          conversationId,
          draftMessageId: this.trudiSaveDraftService.getDraftMsgId,
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
      this.checkEmptyValuesForm() &&
      !isAutoSaveDraft &&
      !this.trudiSaveDraftService.getDraftMsgId;
    if (isNavigateBeforeSaveDraft) return;

    if (!this.trudiSaveDraftService.getDraftMsgId) {
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

    if (body.emailMessage.taskId && !isAutoSaveDraft) {
      body.emailMessage.taskId =
        this.configs?.serviceData?.conversationService?.currentConversation
          ?.taskId || body.emailMessage.taskId;
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
          this.appMessageListService.triggerRemoveMsgDraftFromOpen.next(
            conversationId
          );

          if (!res) {
            this.toastService.success(APP_DRAFT_SAVED);
            return;
          }

          if (isEmpty(res)) return;

          const { conversation, task } = res as ISendMsgResponseV2;
          const { inboxType } = this.activatedRoute.snapshot.queryParams;

          const linkPram = {
            domain: 'https://fake.url',
            path: '/inbox/app-messages',
            params: <{}>{
              status:
                conversation.status === TaskStatusType.open
                  ? TaskStatusType.inprogress
                  : conversation.status,
              inboxType,
              taskId: task.id,
              conversationId: conversation.id
            }
          };
          if (task.type === TaskType.TASK) {
            linkPram.path = '/inbox/detail/' + task.id;
            linkPram.params = {
              tab: 'DRAFT',
              keepTab: true,
              pendingSelectFirst: true,
              type: TaskType.TASK,
              inboxType,
              taskId: task.id,
              conversationId: conversation.id,
              conversationType: conversation.conversationType
            };
          }
          const defaultLink = generateLink(linkPram);
          this.toastCustomService.openToastCustom(
            {
              conversationId: conversation.id,
              taskId: task.id,
              mailBoxId: task.mailBoxId,
              taskType: TaskType.MESSAGE,
              isShowToast: true,
              defaultMessage: APP_DRAFT_SAVED,
              defaultIcon: EToastType.SUCCESS,
              defaultLink
            },
            true
          );
        }
      });
  }

  showToastMsg(type, numberOfMessages?, isScheduleForSend = false, data?) {
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
            { data, conversationType: EConversationType.APP },
            TaskType.MESSAGE,
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

  scheduleMessage(options?: {
    isTrudi?: boolean;
    tempConversationId?: string;
  }) {
    // const receivers = await this.handleModifyReceiverData(
    //   this.selectedReceivers.value,
    //   true
    // );
    const receivers = this.selectedReceivers.value;
    const scheduleBody = this.trudiSendMsgService.composeScheduleMessagePayload(
      this.getFormValue({ isTrudi: options?.isTrudi }),
      this.configs,
      [],
      null,
      null
    );
    this.isLoading = true;
    this.onSendMsg.emit({
      type: ISendMsgType.SCHEDULE_MSG,
      event: ESentMsgEvent.SENDING,
      data: scheduleBody,
      receivers: receivers,
      sendOption: SendOption.ScheduleForSend,
      tempConversationId: options.tempConversationId
    });
    this.resetFormValue(this.composeType === ComposeEditorType.NEW);

    this.sendMessageService
      .scheduleSendV3Message(scheduleBody)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.trudiSaveDraftService.setDraftMsgId(null);
          this.clearChatGptReply();
          this.onSendMsg.emit({
            type: ISendMsgType.SCHEDULE_MSG,
            event: ESentMsgEvent.SUCCESS,
            data: response,
            receivers: receivers,
            sendOption: SendOption.ScheduleForSend,
            tempConversationId: options.tempConversationId
          });
          this.isLoading = false;
          this.getListJobReminders(response?.jobReminders[0].conversationId);
          this.conversationService.reloadConversationList.next(true);
        },
        error: () => {
          this.isLoading = false;
          this.onSendMsg.emit({
            type: ISendMsgType.SCHEDULE_MSG,
            event: ESentMsgEvent.ERR,
            tempConversationId: options.tempConversationId
          });
        },
        complete: () => {
          this.clearChatGptReply();
          this.onSendMsg.emit({
            type: ISendMsgType.SCHEDULE_MSG,
            event: ESentMsgEvent.COMPLETED,
            tempConversationId: options.tempConversationId
          });
          this.configs.body.timeSchedule = null;
          this.configs.body.typeSendMsg = SendOption.Send;
          this.store.dispatch(appMessageActions.removeTempMessage({}));
          this.trudiSaveDraftService.setDraftMsgId(null);
          this.trudiSendMsgService.setListFilesReiFormSignRemoteEmptry();
          this.isLoading = false;
        }
      });
  }

  handleChangeTypeSendMessage(value: SendOption) {
    this.configs.body.typeSendMsg = value;
    this.trudiSaveDraftService.setTrackControlChange('sendOption', true);
    if (value === SendOption.ScheduleForSend) {
      this.triggerResizeAppCompose$.next(true);
    } else {
      this.selectTimeSchedule = null;
      this.configs.body.timeSchedule = null;
    }
  }

  getListJobReminders(conversationId: string) {
    this.trudiScheduledMsgService.jobRemindersCount(conversationId).subscribe();
  }

  onBackSendMsg(isQuit: boolean) {
    if (isQuit) {
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

  subscribeSelectedReceiverChange() {
    this.selectedReceivers.valueChanges
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
          this.selectedReceivers.value?.some((message) => !!message.propertyId),
          this.currentCompany?.agencies
        );

        this.onSelectedReceiversChange.emit(selectedReceiver);
      });
  }

  handleShowToastMessage(option: SendOption, response: ISendMsgResponseV2) {
    switch (option) {
      case SendOption.SendResolve:
        if (this.helper.isInboxDetail) {
          this.conversationService.previousConversation$.next({
            ...response.conversation,
            isTabDraft: false
          } as UserConversationOption);
        } else {
          const data: TypeDataFortoast = {
            taskId: response.task.id,
            conversationId: response.conversation.id,
            isAppMessage: true,
            conversationType: EConversationType.APP,
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
        }
        break;
      default:
        break;
    }
  }

  checkEmptyValuesForm() {
    const scratchDraftCheck =
      this.composeType === ComposeEditorType.NEW
        ? !this.selectedReceivers.value.length
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

  handleErrorMsg(event: boolean) {
    this.errorMsg = event;
  }

  handleTimeSecond(event: number) {
    this.timeSecond = event;
  }

  handleDate(event: number) {
    this.date = event;
  }

  handleContentHeightChange(height: number) {
    if (!height) return;
    const toolbarHeight = 72;
    const attachmentsHeight =
      document.querySelector('.attachments')?.clientHeight || 0;
    const AiRelyHeight =
      document.querySelector('.reply-gpt-alert')?.clientHeight || 0;

    this.onContentResize({
      height: Math.max(
        Math.min(
          Number(height + toolbarHeight + attachmentsHeight + AiRelyHeight),
          this.CONTENT_MAX_HEIGHT
        ),
        this.minHeight
      )
    });
  }

  subscribeSocketPmJoinConversation() {
    this.websocketService.onSocketPmJoinConversation
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { userId, conversationId, isPmJoined } = res;
        if (
          conversationId !== this.currentConversation.id &&
          this.currentUser.id === userId &&
          isPmJoined
        ) {
          this.handleSaveDraft(true);
        }
      });
  }

  onOutSide() {
    if (!this.currentModal) {
      this.aiInteractiveBuilderService.closeAIReplyPopover();
    }
  }

  ngOnDestroy() {
    this.userChangedFormValue = false;
    this.trudiSaveDraftService.setDraftMsgId(null);
    this.destroy$.next(true);
    this.destroy$.complete();
    this.appMessageListService.setPreFillCreateNewMessage(null);
    this.subscription?.unsubscribe();
  }
}
