import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { MessageFlowService } from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { SharedService } from '@/app/services/shared.service';
import {
  SendOption,
  TinyEditorComponent,
  TinyEditorOpenFrom
} from '@shared/components/tiny-editor/tiny-editor.component';
import {
  EConversationType,
  EMailBoxStatus,
  EMailBoxType,
  EMessageType,
  SocketType,
  TaskStatusType
} from '@shared/enum';
import { FilesService } from '@/app/services/files.service';
import { ReiFormService } from '@/app/services/rei-form.service';
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
  IEmailMessage,
  IFromUserMailBox,
  ISelectedReceivers,
  ISendMsgConfigs,
  ISendMsgPayload,
  ISendMsgResponseV2,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  ChangeDetectionStrategy,
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
import { ToastrService } from 'ngx-toastr';
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
  distinctUntilChanged,
  BehaviorSubject
} from 'rxjs';
import { sendOptions } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-list.service';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { ConversationService } from '@/app/services/conversation.service';
import uuidv4 from 'uuid4';
import { UserConversation } from '@shared/types/conversation.interface';
import { TrudiSendMsgHelperFunctionsService } from '@/app/trudi-send-msg/services/trudi-send-msg-helper-functions.service';
import {
  ChatGptService,
  EBoxMessageType
} from '@/app/services/chatGpt.service';
import {
  generateLink,
  validateWhiteSpaceHtml
} from '@shared/feature/function.feature';
import {
  PT_LIST_DYNAMIC_PARAMETERS,
  RM_LIST_DYNAMIC_PARAMETERS
} from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import { CompanyService } from '@/app/services/company.service';
import { DRAFT_SAVED } from '@/app/services/messages.constants';
import {
  ACCEPT_ONLY_SUPPORTED_FILE_WHATSAPP,
  ErrorMessages,
  FILE_VALID_TYPE_WHATSAPP,
  trudiUserId
} from '@/app/services/constants';
import { TrudiDynamicParameterDataService } from '@/app/trudi-send-msg/services/trudi-dynamic-parameter-data.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { IParticipant as IParticipantConversation } from '@shared/types/conversation.interface';
import {
  EToastCustomType,
  TypeDataFortoast
} from '@/app/toast-custom/toastCustomType';
import { EToastType } from '@/app/toast/toastType';
import { TaskService } from '@/app/services/task.service';
import { ICompany } from '@shared/types/company.interface';
import { IFile } from '@shared/types/file.interface';
import { ESendMsgAction } from '@/app/breach-notice/utils/breach-notice.enum';
import { EDefaultBtnDropdownOptions } from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import dayjs from 'dayjs';
import { TrudiAddContactCardService } from '@/app/shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { UploadFromCRMService } from '@/app/shared/components/upload-from-crm/upload-from-crm.service';
import { Property } from '@/app/share-pop-up/create-new-task-pop-up/components/interfaces/create-new-task.interface';
import { IMessage, removeLastWhiteSpaceFromContent } from '@/app/shared';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { ReplyMessageService } from '@/app/services/reply-message.service';
import { AI_INTERACTIVE_WHITE_LIST } from '@/app/dashboard/components/ai-interactive-bubble/utils/constant';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { FeaturesConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import { EAiAssistantAction } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { WhatsappAccountService } from '@/app/dashboard/services/whatsapp-account.service';
import { WhatsappService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp.service';
import {
  PageWhatsAppType,
  WhatsAppConnectStatus
} from '@/app/dashboard/shared/types/whatsapp-account.interface';
import { RxWebsocketService } from '@/app/services';
export const EMPTY_SPACE_REGEX = /^(<p>[&nbsp;\s]{0,}<\/p>)$/g;

export interface IWhatsAppTriggerSendMsgEvent extends ISendMsgTriggerEvent {
  sendOption?: SendOption;
  tempIds?: string[];
  tempConversationId?: string;
}
@Component({
  selector: 'whatsapp-inline-editor',
  templateUrl: './whatsapp-inline-editor.component.html',
  styleUrls: ['./whatsapp-inline-editor.component.scss'],
  providers: [
    TrudiSendMsgHelperFunctionsService,
    TrudiSaveDraftService,
    TrudiSendMsgService,
    TrudiDynamicParameterService,
    TrudiDynamicParameterDataService,
    TrudiSendMsgFormService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhatsAppInlineEditorComponent
  implements OnInit, OnChanges, OnDestroy
{
  @ViewChild('editorContainer', { static: false })
  tinyEditorComponent: TinyEditorComponent;
  @Input() configs: ISendMsgConfigs = {
    ...defaultConfigs,
    otherConfigs: {
      ...defaultConfigs?.otherConfigs,
      createMessageFrom: ECreateMessageFrom.WHATSAPP
    },
    inputs: {
      ...defaultConfigs.inputs,
      isWhatsAppMessage: true
    }
  };
  @Input() currentConversation: UserConversation;
  @Input() currentProperty;

  @Output() onSendMsg = new EventEmitter<IWhatsAppTriggerSendMsgEvent>();
  @Output() onMsgResize = new EventEmitter();

  private prefillDataInlineMessage$ = new BehaviorSubject<{
    receivers?: ISelectedReceivers[];
    title?: string;
    content?: string;
    draftMessageId?: string;
    attachments?: IFile[];
    contacts?: ISelectedReceivers[];
    sendOptions?: sendOptions;
  }>(null);

  private currentMailBoxId: string;
  private subscription: Subscription;
  private triggerTypingSubject = new Subject<boolean>();
  private listMailBox = [];
  private currentMailBox: IMailBox;
  private listSenderMailBox: IFromUserMailBox[] = [];
  private currentUser: CurrentUser;
  public isConsole: boolean = false;
  public isLoading = false;
  public listDynamicParams = [];
  public destroy$ = new Subject();
  public id: number;
  readonly DEFAULT_HEIGHT = 198;
  readonly DEFAULT_ATTACHMENT_HEIGHT = 101;
  public CONTENT_MAX_HEIGHT = 500;
  public contentHeight: number = this.DEFAULT_HEIGHT;
  public minHeight: number = this.DEFAULT_HEIGHT;
  private _textBoxHeight = this.DEFAULT_HEIGHT; // height of inline send message without attachments

  private userChangedFormValue: boolean = false;
  public prefillText: string = '';
  public errorMessage: string;
  public isShowModalWarning: boolean = false;

  public currentCompany: ICompany;
  public errorMsg: boolean = false;
  public SendOption = SendOption;
  public triggerResizeWhatsappCompose$ = new Subject<boolean>();
  private selectedUser: CurrentUser;
  readonly TinyEditorOpenFrom = TinyEditorOpenFrom;
  readonly ESendMsgAction = ESendMsgAction;
  readonly ECreateMessageFrom = ECreateMessageFrom;
  readonly EDefaultBtnDropdownOptions = EDefaultBtnDropdownOptions;
  public ModalPopupPosition = ModalPopupPosition;
  public attachmentTextEditorConfigs = {
    'header.title': 'Add contact card'
  };
  public whiteList = AI_INTERACTIVE_WHITE_LIST;
  public sendOptionsToRemove = [SendOption.ScheduleForSend];
  private features: FeaturesConfigPlan;
  private isDisconnectWhatsapp: boolean = false;
  selectedWhatsapp: PageWhatsAppType;
  public FILE_VALID_TYPE_WHATSAPP = FILE_VALID_TYPE_WHATSAPP;
  public ACCEPT_ONLY_SUPPORTED_FILE_WHATSAPP =
    ACCEPT_ONLY_SUPPORTED_FILE_WHATSAPP;
  constructor(
    private cdr: ChangeDetectorRef,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private inboxService: InboxService,
    private userService: UserService,
    private trudiSendMsgService: TrudiSendMsgService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private messageFlowService: MessageFlowService,
    private conversationService: ConversationService,
    public elementRef: ElementRef<HTMLElement>,
    private trudiSaveDraftService: TrudiSaveDraftService,
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
    private taskService: TaskService,
    // private aiInteractiveBubbleAdapterService: AiInteractiveBubbleAdapterService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private uploadFromCRMService: UploadFromCRMService,
    private agencyService: AgencyService,
    public readonly whatsappAccountService: WhatsappAccountService,
    private readonly whatsappService: WhatsappService,
    private readonly websocketService: RxWebsocketService
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

  get selectedContactCard() {
    return this.trudiAddContactCardService.getSelectedContactCard();
  }

  get selectedFilesFromCMS() {
    return this.uploadFromCRMService.getSelectedFiles();
  }

  public get selectedSenderControl() {
    return this.sendMsgForm.get('selectedSender');
  }

  get isDisableSendBtn() {
    const isFilesValidate = this.trudiSendMsgFormService.isFilesValidate;
    const isLoadingUploadFile = this.trudiSaveDraftService.isLoadingUploadFile;
    const hasContentOrFilesOrContact =
      this.msgContent?.value ||
      this.listOfFiles.value?.length ||
      this.trudiSendMsgFormService.selectedContactCard$.value?.length;
    const isOnlyWhitespace =
      validateWhiteSpaceHtml(this.msgContent.value) &&
      !this.listOfFiles?.value?.length &&
      !this.trudiSendMsgFormService.selectedContactCard$.value?.length;
    const isWhatsappEnabled =
      this.features?.[EAiAssistantAction.WHATSAPP]?.state;
    const isMailboxArchived =
      this.currentMailBox?.status === EMailBoxStatus.ARCHIVE;
    const isConsole = this.isConsole;
    const isDisconnectWhatsapp = this.isDisconnectWhatsapp;
    const isSelectedWhatsappArchived =
      this.selectedWhatsapp?.status === WhatsAppConnectStatus.ARCHIVED;

    return (
      !isFilesValidate ||
      isLoadingUploadFile ||
      !hasContentOrFilesOrContact ||
      isOnlyWhitespace ||
      !isWhatsappEnabled ||
      isMailboxArchived ||
      isConsole ||
      isDisconnectWhatsapp ||
      isSelectedWhatsappArchived
    );
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  get uploadFileFromCRMPopupState() {
    return this.uploadFromCRMService.getPopupState();
  }

  get contactCardPopupState() {
    return this.trudiAddContactCardService.getPopupState();
  }

  get listOfFiles() {
    return this.sendMsgForm?.get('listOfFiles');
  }

  private subscribeCurrentTask() {
    this.taskService.currentTask$
      .pipe(
        filter((res) => !!res?.id),
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.setConfig();
      });
  }

  ngOnInit(): void {
    this.subscribeCurrentTask();
    this.CONTENT_MAX_HEIGHT = (window.innerHeight - 52) / 2;
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
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
    this.userService
      .getUserDetail()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.currentUser = rs;
      });

    this.getListMailBox();
    this.prefillDataInlineMessage$
      .pipe(
        filter((res) => !!res),
        switchMap((res) => {
          this._textBoxHeight =
            this.minHeight =
            this.contentHeight =
              this.DEFAULT_HEIGHT;
          if (res.draftMessageId) {
            return this.trudiSaveDraftService
              .getDraftData(res.draftMessageId)
              .pipe(
                catchError(() => of({})),
                map((data) => ({ ...res, ...data }))
              );
          }
          return of(res);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.trudiSaveDraftService.setDraftMsgId(res.draftMessageId);
        const listFileUpload =
          this.trudiSendMsgHelperFunctionsService.handlePrefillFileUploaded(
            res.attachments || []
          );
        this.listOfFiles.setValue(listFileUpload);
        this.msgTitle.setValue(res.title || '');
        this.prefillText = res.content || '';
        this.msgContent.setValue(res.content || '');
        if (!res.content) {
          this.tinyEditorComponent?.editorControl?.setValue('');
        }

        this.selectedReceivers.setValue(res.receivers);
        const sendOptions = res?.sendOptions;
        const newConfigs = {
          ...this.configs,
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
        if (this.subscription) {
          this.subscription.unsubscribe();
          this.userChangedFormValue = false;
        }
        this.subscribeAutoSaveDraft();
      });
    this.userService
      .getSelectedUser()
      .pipe(
        filter((user) => !!user?.id),
        takeUntil(this.destroy$)
      )
      .subscribe((user) => {
        this.selectedUser = user;
        const { id, lastName, googleAvatar, firstName, title } = user;
        const sender = {
          avatar: googleAvatar,
          id: id,
          index: 1,
          name: firstName + ' ' + lastName,
          title: title
        };
        this.trudiDynamicParameterService.setDynamicParamaterPmInline(sender);
      });

    this.getDynamicParamsByCrm();
    this.handleAutoResizeSendMsgInline();
    this.companyService
      .getCurrentCompany()
      .pipe(filter(Boolean), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.currentCompany = value;
      });
    this.agencyService.currentPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ features }) => {
        this.features = features;
      });
    this.whatsappAccountService.currentPageWhatsappActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isDisconnectWhatsapp =
          res?.status === WhatsAppConnectStatus.DISCONNECTED;
      });
    this.whatsappService.whatsappSelected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.selectedWhatsapp = res;
      });
    this.subscribeTriggerTyping();
    this.subscribeSelectedReceiverChange();
    this.subscribeSocketPmJoinConversation();
  }

  private handlePrefillDataInlineMessage(conversation: UserConversation) {
    const recipientFromParticipants = getUserFromParticipants(
      conversation.participants as IParticipantConversation[]
    )?.[0];
    const isDraftMessage = conversation.lastMessageDraft;
    this.prefillDataInlineMessage$.next({
      receivers: recipientFromParticipants
        ? [
            {
              ...recipientFromParticipants,
              id: recipientFromParticipants.userId,
              type: isDraftMessage
                ? recipientFromParticipants.userPropertyType
                : recipientFromParticipants.type,
              streetline:
                conversation.shortenStreetline || conversation.streetline,
              email: conversation.emailVerified
            }
          ]
        : [],
      title: conversation.categoryName || conversation?.name,
      draftMessageId:
        isDraftMessage?.messageType === EMessageType.file
          ? isDraftMessage.bulkMessageId
          : isDraftMessage?.id
    });
  }

  private updateHeightCompose() {
    const files = this.listOfFiles.value;
    const attachmentsHeight = files?.length
      ? this.DEFAULT_ATTACHMENT_HEIGHT
      : 0;

    this.minHeight = this.DEFAULT_HEIGHT + attachmentsHeight;
    let contentHeight = this._textBoxHeight + attachmentsHeight;

    if (contentHeight > this.CONTENT_MAX_HEIGHT) {
      this._textBoxHeight = this.CONTENT_MAX_HEIGHT - attachmentsHeight;
      contentHeight = this.CONTENT_MAX_HEIGHT;
    }
    this.contentHeight = contentHeight;
    this.onMsgResize.emit(this.contentHeight);
    this.cdr.markForCheck();
  }

  private handleAutoResizeSendMsgInline() {
    combineLatest([
      this.listOfFiles.valueChanges.pipe(startWith([])),
      this.triggerResizeWhatsappCompose$.pipe(startWith(false))
    ])
      .pipe(debounceTime(50), takeUntil(this.destroy$))
      .subscribe(([files, _]) => {
        this.updateHeightCompose();
      });
  }

  private getListMailBox() {
    combineLatest([
      this.inboxService.listMailBoxs$,
      this.inboxService.getCurrentMailBoxId(),
      this.userService.getUserDetail()
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([listMailBox, mailboxId, userInfo]) => {
        if (mailboxId) {
          this.currentMailBoxId =
            this.activatedRoute.snapshot.queryParams?.['mailBoxId'] ||
            mailboxId;
        }
        if (listMailBox?.length && userInfo) {
          this.listMailBox = listMailBox;
          if (!this.listMailBox?.length) return;
          this.currentMailBox =
            this.listMailBox.find(
              (mailBox) => mailBox.id === this.currentMailBoxId
            ) || this.listMailBox[0];
          this.inboxService.setCurrentMailboxIdToResolveMsg(
            this.listMailBox[0]?.['id']
          );
          this.listSenderMailBox = getListSenderMailBox(
            this.configs,
            userInfo,
            this.listMailBox,
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

  private getDynamicParamsByCrm() {
    this.companyService.currentCompanyCRMSystemName
      .pipe(
        takeUntil(this.destroy$),
        switchMap((res) => {
          return of(this.getListDynamicByCRM(res));
        })
      )
      .subscribe((res) => {
        this.listDynamicParams = res;
        this.setPropertySendMsgForm();
      });
  }

  private getListDynamicByCRM(crm) {
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

  private handleShowListDynamic(tempListParamByCRM: any[]) {
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

  private resetFormValue(isResetAll = false) {
    if (isResetAll) {
      this.trudiSaveDraftService.setDraftMsgId(null);
      this.msgTitle.setValue('');
      this.selectedReceivers.setValue([]);
      this.configs.body = {
        ...this.configs.body,
        prefillReceiversList: []
      };
    }
    this.msgContent.setValue('');
    this.prefillText = '';
    this.tinyEditorComponent?.editorControl?.setValue('');
    this?.tinyEditorComponent?.resetToDefault();
    this.resetTinyTrackControl();
    this.listOfFiles.setValue([]);
    this.trudiSaveDraftService.setListFileUploaded([]);
    this.selectedContactCardControl.setValue([]);
    this.trudiSaveDraftService.cacheListAttachment = [];
    this.userChangedFormValue = false;
    this.trudiSendMsgFormService.setSelectedContactCard([]);
    this._textBoxHeight =
      this.contentHeight =
      this.minHeight =
        this.DEFAULT_HEIGHT;
  }

  private resetTinyTrackControl() {
    if (this.tinyEditorComponent?.trackUserChange) {
      this.tinyEditorComponent.trackUserChange = false;
    }
  }

  private setConfig() {
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
      this.handleChangeContactFromParticipants(
        changes['currentConversation']?.previousValue?.participants,
        changes['currentConversation']?.currentValue?.participants,
        this.currentConversation
      );
      if (
        this.currentConversation &&
        (changes['currentConversation']?.currentValue?.id !==
          changes['currentConversation']?.previousValue?.id ||
          changes['currentConversation']?.currentValue?.lastMessageDraft?.id !==
            changes['currentConversation']?.previousValue?.lastMessageDraft?.id)
      ) {
        this.handlePrefillDataInlineMessage(this.currentConversation);
      }
      //reset fields when conversation change
      this.resetWhenConversationChange(changes['currentConversation']);
    }

    if (changes['currentProperty']) {
      this.setPropertySendMsgForm();
    }
  }

  handleChangeContactFromParticipants(
    prevParticipants: IParticipantConversation[],
    currParticipants: IParticipantConversation[],
    conversation: UserConversation
  ) {
    if (!prevParticipants?.length || !currParticipants?.length) return;
    const prevContact =
      getUserFromParticipants(prevParticipants)?.[0] || prevParticipants[0];
    const currContact =
      getUserFromParticipants(currParticipants)?.[0] || currParticipants[0];
    if (
      prevContact?.userId !== currContact?.userId ||
      prevContact?.userPropertyId !== currContact?.userPropertyId
    ) {
      this.selectedReceivers?.setValue([
        {
          ...currContact,
          id: currContact.userId,
          type: currContact.userPropertyType || currContact.type,
          streetline: conversation.shortenStreetline || conversation.streetline,
          email: conversation.emailVerified
        }
      ]);
    }
  }

  setPropertySendMsgForm() {
    if (this.property) {
      this.property.setValue(this.currentProperty);
    }
    if (!this.currentProperty?.id) {
      this.trudiDynamicParameterService.resetAppDynamicParameter();
    }
    this.listDynamicParams = handleDisabledDynamicParamsByProperty(
      this.listDynamicParams,
      this.property?.value?.id &&
        (this.property?.value?.streetline ||
          this.property?.value?.shortenStreetline),
      this.currentCompany?.agencies
    );
  }

  subscribeSelectedReceiverChange() {
    this.selectedReceivers.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.setPropertySendMsgForm();
      });
  }

  get sendMsgForm() {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get msgContent() {
    return this.sendMsgForm.get('msgContent');
  }

  private getFormValue(options?: { isTrudi?: boolean }, isSaveDraft?: boolean) {
    const msgContent = (this.msgContent.value || '') as string;
    const selectedSender = {
      ...this.selectedSenderControl.value,
      id: options?.isTrudi ? trudiUserId : this.currentUser.id
    };
    let formattedMsgContent = validateWhiteSpaceHtml(msgContent)
      ? ''
      : msgContent;
    return {
      ...this.sendMsgForm.value,
      msgContent:
        msgContent === ''
          ? ''
          : removeLastWhiteSpaceFromContent(formattedMsgContent),
      selectedSender: selectedSender
    };
  }

  async handleSendMsg(
    sendType: {
      typeBtn: SendOption;
      value: string;
      isTrudi: boolean;
    },
    defaultValue?: ISendMsgPayload
  ) {
    const tempConversationId = uuidv4();
    const { conversationId, taskId } = this.activatedRoute.snapshot.queryParams;
    if (
      !defaultValue &&
      (!this.selectedReceivers.value?.length ||
        !(this.msgContent?.value || this.listOfFiles.value?.length) ||
        !this.msgTitle?.value?.trim())
    ) {
      this.toastService.error(`Failed to send message`);
      return;
    }
    switch (sendType.typeBtn) {
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
          ?.setValue(sendType.typeBtn === SendOption.SendResolve);
        const body = this.trudiSendMsgService.getSendMsgBodyv2(
          this.getFormValue({ isTrudi: sendType.isTrudi }),
          this.configs,
          null,
          false,
          false,
          true
        );
        if (taskId && conversationId) {
          body.emailMessage.taskId = taskId;
          body.emailMessage.conversationId = conversationId;
        }

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
          isDraft: false,
          event: ESentMsgEvent.SENDING,
          tempConversationId
        });
        this.resetFormValue(false);
        this.sendMessageV2({
          body,
          tempConversationId,
          sendType
        });
        break;
      case SendOption.Resend:
        this.sendMessageV2({
          body: defaultValue,
          tempConversationId,
          sendType
        });
        break;
      default:
        break;
    }
  }

  private sendMessageV2({ body, tempConversationId, sendType }) {
    this.trudiSendMsgService.sendMessageV2(body).subscribe({
      next: (res: ISendMsgResponseV2) => {
        this.trudiSaveDraftService.setDraftMsgId(null);
        this.clearChatGptReply();
        this.confirmCreateLinkReiForm(res.task?.id);
        this.filesService.reloadAttachments.next(true);
        this.handleShowToastMessage(sendType.typeBtn, res);
        const event = {
          type: ISendMsgType.NEW_MESSAGE,
          data: res,
          isDraft: false,
          event: ESentMsgEvent.SUCCESS,
          tempConversationId
        };
        this.onSendMsg.emit(event);
      },
      complete: () => {
        this.clearChatGptReply();
        this.isLoading = false;
        this.trudiSaveDraftService.resetTrackControl();
        this.triggerResizeWhatsappCompose$.next(true);
      },
      error: (err) => {
        this.isLoading = false;
        if (!err?.error?.message) {
          this.toastService.error(`Failed to send message`);
          return;
        }
        try {
          const tempIds = JSON.parse(err.error.message)?.tempIds || [];
          this.onSendMsg.emit({
            type: ISendMsgType.NEW_MESSAGE,
            event: ESentMsgEvent.ERR,
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

  onContentResize({ height, mouseEvent }: NzResizeEvent): void {
    const attachmentsHeight = this.listOfFiles?.value?.length
      ? this.DEFAULT_ATTACHMENT_HEIGHT
      : 0;

    cancelAnimationFrame(this.id);
    this.id = requestAnimationFrame(() => {
      this.contentHeight = height!;
      this._textBoxHeight = this.contentHeight - attachmentsHeight;
      this.onMsgResize.emit(this.contentHeight);
      this.cdr.markForCheck();
    });
  }

  handleChangeFormValue(key) {
    this.trudiSaveDraftService.setTrackControlChange(key, true);
  }

  clearChatGptReply() {
    this.chatGptService.reset();
  }

  private subscribeAutoSaveDraft() {
    this.subscription = this.trudiSaveDraftService.triggerControlChange$
      .pipe(
        tap(() => (this.userChangedFormValue = true)),
        debounceTime(3000),
        filter(() => !this.isLoading),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.handleSaveDraft(true);
      });
  }

  private handleSaveDraft(isAutoSaveDraft = false) {
    if (!this.userChangedFormValue || this.isConsole) return;
    const { conversationId, taskId } = this.activatedRoute.snapshot.queryParams;
    const emptyValue = this.checkEmptyValuesForm();
    if (
      conversationId &&
      taskId &&
      !isAutoSaveDraft &&
      emptyValue &&
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

    const isNavigateBeforeSaveDraft =
      emptyValue &&
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
            path: '/inbox/whatsapp-messages/draft',
            params: <{}>{
              status:
                (res as ISendMsgResponseV2)?.conversation?.status ===
                TaskStatusType.resolved
                  ? TaskStatusType.completed
                  : TaskStatusType.inprogress,
              inboxType,
              taskId: task.id,
              conversationId: conversation.id,
              mailBoxId,
              channelId: conversation?.channelId
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

  private handleShowToastMessage(
    option: SendOption,
    response: ISendMsgResponseV2
  ) {
    switch (option) {
      case SendOption.SendResolve:
        const data: TypeDataFortoast = {
          taskId: response.task.id,
          conversationId: response.conversation.id,
          conversationType: EConversationType.WHATSAPP,
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

  private checkEmptyValuesForm() {
    return !this.msgContent?.value?.trim() && !this.listOfFiles?.value?.length;
  }

  private resetWhenConversationChange(conversationChange: SimpleChange) {
    if (!conversationChange) return;
    const { previousValue, currentValue } = conversationChange;
    if (previousValue?.id !== currentValue?.id) {
      this.configs.body.typeSendMsg = SendOption.Send;
    }
  }

  handleContentHeightChange(height: number) {
    if (!height) return;
    const toolbarHeight = 72;
    const attachmentsHeight = this.listOfFiles?.value?.length
      ? this.DEFAULT_ATTACHMENT_HEIGHT
      : 0;
    const AI_ALERT_HEIGHT =
      document.querySelector('.reply-gpt-alert')?.clientHeight || 0;

    this.onContentResize({
      height: Math.max(
        Math.min(
          Number(height + toolbarHeight + attachmentsHeight + AI_ALERT_HEIGHT),
          this.CONTENT_MAX_HEIGHT
        ),
        this.minHeight
      )
    });
  }

  handleValueChange(value: string) {
    this.msgContent.setValue(value);
    if (!value) {
      this.triggerTypingSubject.next(false);
      return;
    }
    this.triggerTypingSubject.next(true);
  }

  private subscribeTriggerTyping() {
    this.triggerTypingSubject
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((status) => {
        this.sendTypingSocket(status);
      });
  }

  onBlur() {
    if (this.msgContent && this.msgContent.value.length) {
      this.sendTypingSocket(false);
    }
  }

  onFocus(e) {
    if (e && this.msgContent.value.length) {
      this.sendTypingSocket();
    }
  }

  addReiForm() {
    this.trudiSendMsgService.setPopupState({
      addReiFormOutside: true,
      selectDocument: true,
      sendMessage: false
    });
  }

  onCloseAddContactCard() {
    this.trudiAddContactCardService.setPopupState({
      addContactCard: false
    });
  }

  sendTypingSocket(status = true) {
    if (
      this.currentConversation &&
      this.conversationService.isTrudiControlConversation(
        this.currentConversation
      )
    ) {
      return;
    }
    if (!this.selectedUser) return;
    const currentUserId = this.selectedUser.id;
    const user = this.selectedUser;
    const body = {
      propertyId: this.currentProperty?.id,
      createdAt: dayjs().format(),
      type: 'SEND',
      sendType: `typing ${status ? 'on' : 'off'}`,
      userType: user.type,
      firstName: user.firstName,
      lastName: user.lastName,
      googleAvatar: user.googleAvatar
    };
    this.conversationService
      .sendTyingSocketByCallingAPI(
        this.currentConversation?.id,
        currentUserId,
        body
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  editorAddContactCard() {
    this.trudiSendMsgService.setPopupState({
      sendMessage: false
    });
    this.trudiAddContactCardService.setPopupState({
      addContactCard: true
    });
  }

  editorAddFileComputer() {
    const button = this.elementRef?.nativeElement?.querySelector(
      '#trudi-send-msg-upload-btn'
    ) as HTMLElement;
    button?.click();
  }

  editorAddFileFromCrm() {
    this.trudiSendMsgService.setPopupState({
      sendMessage: false
    });
    this.uploadFromCRMService.setPopupState({
      uploadFileFromCRM: true
    });
  }

  onTriggerAddContactCard() {
    if (this.trudiAddContactCardService.getPopupState().addContactCard) {
      if (this.selectedContactCard)
        this.trudiSendMsgFormService.setSelectedContactCard([
          ...this.selectedContactCard
        ]);
      this.trudiAddContactCardService.setPopupState({
        addContactCard: false
      });
      this.trudiSendMsgService.setPopupState({
        sendMessage: true
      });
    }
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
        this.listOfFiles.setValue([
          ...this.listOfFiles.value,
          ...this.selectedFilesFromCMS
        ]);
    }
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

  onCloseUploadFromCRM() {
    this.uploadFromCRMService.setPopupState({
      uploadFileFromCRM: false
    });
  }

  ngOnDestroy() {
    this.userChangedFormValue = false;
    this.trudiSaveDraftService.setDraftMsgId(null);
    this.destroy$.next(true);
    this.destroy$.complete();
    this.prefillDataInlineMessage$.next(null);
    this.subscription?.unsubscribe();
  }
}
