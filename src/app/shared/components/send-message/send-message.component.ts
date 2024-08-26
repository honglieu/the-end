import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { ECategoryType } from '@shared/enum/category.enum';
import { SendMessageService } from '@services/send-message.service';
import {
  getListLandlordConversationByTaskResponse,
  LastUser,
  UserConversation
} from '@shared/types/conversation.interface';
import {
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
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { from, lastValueFrom, Observable, Subject } from 'rxjs';
import { mergeMap, takeUntil, tap } from 'rxjs/operators';
import {
  conversations,
  fileLimit,
  properties
} from 'src/environments/environment';
import { ApiService } from '@services/api.service';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  FILE_VALID_TYPE,
  listOfUserTypeIndex,
  MAX_TEXT_MESS_LENGTH,
  REIFORM_SUPPORTED_FILE_ACCEPT,
  RemiderTooltip,
  SEND_MESSAGE_POPUP_OPEN_FROM,
  trudiUserId
} from '@services/constants';
import { FilesService } from '@services/files.service';
import { FileUploadService } from '@services/fileUpload.service';
import { PopupService } from '@services/popup.service';
import { PropertiesService } from '@services/properties.service';
import { UserService } from '@services/user.service';
import { ConversationService } from '@services/conversation.service';
import {
  CurrentUser,
  TargetFromFormMessage
} from '@shared/types/user.interface';
import { IMessage, IPeopleFromViaEmail } from '@shared/types/message.interface';
import { TaskService } from '@services/task.service';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  BindingValueTaskItemDropdown,
  TaskItemDropdown
} from '@shared/types/task.interface';
import { ETrudiType } from '@shared/enum/trudi';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { EMessageType } from '@shared/enum/messageType.enum';
import {
  InfoAdditionButtonAction,
  TrudiBody,
  TrudiButton,
  TrudiFowardLandlordSelected,
  TrudiResponse,
  TrudiResponseVariable
} from '@shared/types/trudi.interface';
import { SharedService } from '@services/shared.service';
import { SendBulkMessageResponse } from '@shared/types/conversation.interface';
import { ControlPanelService } from '@/app/control-panel/control-panel.service';
import { Suppliers } from '@shared/types/agency.interface';
import { EUserPropertyType, UserStatus } from '@shared/enum/user.enum';
import { MessageService } from '@services/message.service';
import { IFile, IFileType } from '@shared/types/file.interface';
import { ImgPath, SendMesagePopupOpenFrom } from '@shared/enum/share.enum';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '@services/loading.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { MaintenanceRequestService } from '@services/maintenance-request.service';
import { Router } from '@angular/router';
import { AgencyService } from '@services/agency.service';
import { TrudiSuggestion } from '@shared/types/trudi-suggestion.interface';
import { HeaderService } from '@services/header.service';
import {
  validateFileExtension,
  validateWhiteSpaceHtml
} from '@shared/feature/function.feature';
import { TinyEditorComponent } from '@shared/components/tiny-editor/tiny-editor.component';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import { ECreateMessageType } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';

@Component({
  selector: 'app-send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.scss']
})
export class SendMessageComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('textAreaWrapper') private textAreaWrapper: ElementRef;
  @ViewChild('tinyEditor') private tinyEditor: TinyEditorComponent;
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isBackModal = new EventEmitter<boolean>();
  @Output() isBackModalSendQuote = new EventEmitter<boolean>();
  @Output() isOpenQuitConfirmModal = new EventEmitter<{
    close: boolean;
    confirmQuit: boolean;
  }>();
  @Output() isOpenSuccessModal = new EventEmitter<boolean>();
  @Output() isOpenActionLink = new EventEmitter<boolean>();
  @Output() isOpenFile = new EventEmitter<boolean>();
  @Output() isOpenSelectPeople = new EventEmitter<boolean>();
  @Output() moveToNextStep = new EventEmitter<number>();
  @Output() removeFileItem = new EventEmitter<number>();
  @Output() setSendFromId = new EventEmitter<string>();
  @Output() submitSendMessage = new EventEmitter();
  @Input() listOfFiles: IFile[] = [];
  @Input() listOfUser = [];
  @Input() ticket: any;
  @Input() openFrom: string;
  @Input() conversationTopicId?: string;
  @Input() conversationTitle?: string;
  @Input() sendEmail? = false;
  @Input() notEditTopicTitle? = false;
  @Input() notEditTopicTrudi? = false;
  @Input() show = false;
  @Input() dataMessageTrudi = '';
  @Input() isReset = false;
  @Input() forwardAction: ForwardButtonAction;
  @Input() trudiStep: number;
  @Input() isCloseTask = false;
  @Input() nextStep?: number;
  @Input() isTypeTrudi = '';
  @Input() infoAddition:
    | CurrentUser[]
    | Suppliers[]
    | InfoAdditionButtonAction[]
    | any;
  @Input() forwardButtons: TrudiButton[];
  @Input() noBackBtn: boolean = false;
  @Input() noTicket: boolean = false;
  @Input() noAddFile: boolean = false;
  @Input() likeToSaySelectedIndex: number;
  @Input()
  listConversationForwardLandlord: getListLandlordConversationByTaskResponse[] =
    [];
  @Input() isBackSendQuote = false;
  @Input() isSendQuote = false;
  @Input() showTextForward = false;
  @Input() trudiBody: TrudiBody | TrudiSuggestion;
  @Input() typeViaEmail: IPeopleFromViaEmail['type'] = 'SEND_LANDLORD';
  @Input() trudiResponseVariable: TrudiResponseVariable;
  @Input() isFileTab = false;
  @Input() maintenanceFromAppChat: {
    isForward: boolean;
    sendQuote?: boolean;
  };
  @Input() title: string = '';
  @Input() hasTitle: boolean = false;
  @Input() numberSent: number = 0;
  @Input() isForward?: boolean = false;

  isLoading = false;
  public messagesType = EMessageType;
  public TYPE_TRUDI = ETrudiType;
  public forwardButtonAction = ForwardButtonAction;
  readonly MAX_TEXT_MESS_LENGTH = MAX_TEXT_MESS_LENGTH;
  readonly SEND_MESSAGE_POPUP_OPEN_FROM = SEND_MESSAGE_POPUP_OPEN_FROM;
  readonly RemiderTooltip = RemiderTooltip;
  readonly ImgPath = ImgPath;
  readonly ACCEPT_ONLY_SUPPORTED_FILE = ACCEPT_ONLY_SUPPORTED_FILE;
  public listofTicketCategory: any = [];
  public titleText: string;
  public selectedTopic: string;
  public selectedSender = '';
  public contentText = '';
  public selectTopicItems;
  public fulllistofConversationCategory: any = [];
  public fgText: FormGroup;
  public agentProfile: any;
  public fullCategoryList: any = [];
  public openedFromUserTab = false;
  private subscribers = new Subject<void>();
  public sendMessagePopupOpenFrom = SEND_MESSAGE_POPUP_OPEN_FROM;
  public sender: TargetFromFormMessage[] = [
    {
      index: 0,
      id: trudiUserId,
      name: 'Trudi',
      avatar: 'assets/icon/trudi-logo.svg',
      title: 'Virtual Property Assistant'
    }
  ];
  public SMSreminder: boolean = false;
  public isSMS: boolean = false;
  public allowResolvedTextbox = false;
  public listConversationWithLandlord: TrudiFowardLandlordSelected[];
  public replaceVariableValue: { key: string; value: string }[] = [];
  includePeople = true;
  resolvedText = '';
  resolvedValid = true;
  scrollTimeout!: NodeJS.Timer;
  isMsgSummaryEmpty = false;
  resolvedCheckbox = false;
  selectedTrudi = false;
  isItemTaskTicket: any;
  textEditTicket: string;
  fileTypes: any;
  public timeUpload: number;
  public selectedFile: FileList;
  public listFileUpload = [{ title: '', listFile: [] }];
  public showPopupMessage: false;

  inputTaskFocused = false;
  searchTaskInputEmpty = false;
  selectedTask: TaskItemDropdown;
  taskNameList: TaskItemDropdown[];
  private trudiResponse: TrudiResponse;

  public FILE_VALID_TYPE: string[] = FILE_VALID_TYPE;
  readonly acceptFileType = REIFORM_SUPPORTED_FILE_ACCEPT;

  numberOfReceiverVariable = '';
  isOpenFromConvOfSendQuoteLandlordFlowVariable: boolean;
  isOpenFromFileOfSendQuoteLandlordFlowVariable: boolean;
  isForwardTicketFlow: boolean;
  showAddFile: boolean;
  public isTaskType: boolean;
  public checkExistExternal = [];
  public isCreateNewConv = false;
  public isCreateNewMsg = false;
  public isChangeRoleSend = false;
  public emailSignature = new FormControl(true);
  public isAppUser: boolean = false;
  private unsubscribe = new Subject<void>();

  ticketDetail;
  EUserType = EUserPropertyType;
  public valueEditor: string = '';
  public isDisabled: boolean = false; // disable button send message when title or textEditor is empty
  public listOfUserByGroup;
  public listOfUserByGroupIndex: EUserPropertyType[] = [];
  public EUserInviteStatusType = EUserInviteStatusType;
  public titlePopup;
  public isFileLarger: boolean = false;
  public fileLimit: number = fileLimit;
  public createMessageType = ECreateMessageType;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private fileUploadService: FileUploadService,
    public popupService: PopupService,
    private propertyService: PropertiesService,
    public fileService: FilesService,
    private userService: UserService,
    private readonly conversationService: ConversationService,
    private headerService: HeaderService,
    public taskService: TaskService,
    private readonly elementRef: ElementRef,
    private sharedService: SharedService,
    private controlPanelService: ControlPanelService,
    private messageService: MessageService,
    private toastService: ToastrService,
    private loadingService: LoadingService,
    private sendMessageService: SendMessageService,
    private maintenanceService: MaintenanceRequestService,
    private router: Router,
    private agencyService: AgencyService,
    private companyEmailSignatureService: CompanyEmailSignatureService
  ) {}

  targetChange(e: TargetFromFormMessage) {
    this.selectedTrudi = e.id === trudiUserId;
    this.selectedSender = e.id;
    this.setSendFromId.emit(this.selectedSender);

    if (this.openFrom !== SEND_MESSAGE_POPUP_OPEN_FROM.appChat) {
      this.replaceVariable(this.forwardButtons);
    }

    if (this.isTypeTrudi === ETrudiType.q_a) {
      this.handleReturnMessageValue(e);
    }

    if (this.isTypeTrudi === ETrudiType.suggestion) {
      this.handleReturnSugesstionMessageValue(e);
    }
    this.isChangeRoleSend = !this.isChangeRoleSend;

    if (
      this.openFrom !== SEND_MESSAGE_POPUP_OPEN_FROM.trudi &&
      this.openFrom !== SEND_MESSAGE_POPUP_OPEN_FROM.conv
    ) {
      this.replaceMessageFile();
    }
  }

  handleReturnSugesstionMessageValue(
    mailSender: TargetFromFormMessage,
    trudiData: TrudiSuggestion = this.trudiBody as TrudiSuggestion
  ) {
    const { firstName, lastName } =
      this.conversationService.currentConversation.value;
    const agencyName = this.agencyService.currentAgency.value?.name;
    this.contentText = trudiData.data[0].body.text;
    this.contentText = this.contentText.replace(
      /{name}/,
      this.sharedService.displayName(firstName, lastName)
    );
    this.contentText = this.contentText.replace(
      /{receiver_name}/,
      this.sharedService.displayName(firstName, lastName)
    );
    this.contentText = this.contentText.replace(/{agency_name}/, agencyName);
    this.contentText = this.contentText.replace(
      /{property_manager}/,
      `${mailSender.name}, ${mailSender.title}\n${agencyName}`
    );
  }

  handleReturnMessageValue(
    mailSender: TargetFromFormMessage,
    trudiData: TrudiBody = this.trudiBody as TrudiBody
  ) {
    this.contentText = trudiData?.text;

    if (!trudiData || !trudiData.text || !trudiData.variable) {
      this.contentText = '';
    }

    for (const [key, value] of Object.entries(this.trudiResponseVariable)) {
      if (this.contentText.includes(key)) {
        this.replaceContentTextAndSaveValue(key, value);
      }
    }
    this.replaceContentTextAndSaveValue(
      '{property manager name}',
      mailSender?.name + ', ' + mailSender?.title
    );
  }

  replaceMessageFile() {
    let role;
    let namePM;
    const checkSingleUser = this.listOfUser.length === 1 && this.listOfUser[0];
    const userProp = this.listOfUser[0];
    const checkExistExternal = this.listOfUser.some(
      (el) => el.type === EUserPropertyType.EXTERNAL
    );

    const fileName = this.listOfFiles[0]?.name?.split('.')[0];
    const agencyName = this.agencyService.currentAgency.getValue()?.name;
    const user = this.userService.userInfo$?.getValue();
    if (!this.isChangeRoleSend) {
      role = user.title;
      namePM =
        this.sharedService.displayName(user.firstName, user.lastName) || '';
    } else {
      role = this.sender[0]?.title;
      namePM = this.sender[0]?.name;
    }
    const nameReceiver =
      checkSingleUser && !checkExistExternal
        ? userProp.firstName || userProp.lastName
        : checkExistExternal && checkSingleUser
        ? ''
        : '{receiver name}';
    let rawMessage = `Hi ${nameReceiver},\n\nPlease find the following file attached:\n\n •  ${fileName}\n\nIf you have any questions, please feel free to contact us.`;
    if (!nameReceiver) rawMessage = rawMessage.replace('Hi ,', 'Hi,');
    this.contentText = rawMessage;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const currentTask = this.taskService.currentTask$.getValue();
    this.handleOnchangeListOfFiles();
    this.getListFileType();
    this.numberOfReceiver();
    if (this.show) {
      this.isOpenFromConvOfSendQuoteLandlordFlowVariable =
        this.isOpenFromConvOfSendQuoteLandlordFlow();
      this.isForwardTicketFlow = this.checkIsForwardTicketFlow();
      this.showAddFile = this.isShowAddFileBtn();
      this.getListTicketCategory();
      this.getListCategoryTypes();

      if (this.hideTopicField()) {
        this.selectedTopic = this.getCategoryByTopic(currentTask?.topicId)?.id;
      }

      if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi) {
        this.selectedSender = trudiUserId;
        if (this.isTypeTrudi === ETrudiType.q_a) {
          this.handleReturnMessageValue(this.getSender(this.selectedSender));
        }
        if (this.isTypeTrudi === ETrudiType.suggestion) {
          this.handleReturnSugesstionMessageValue(
            this.getSender(this.selectedSender)
          );
        }
      }

      if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.conv) {
        this.selectedSender = trudiUserId;
      }
      if (
        [
          ForwardButtonAction.tell_tenant,
          ForwardButtonAction.notifyTenant
        ]?.includes(this.forwardAction)
      ) {
        this.listOfUser = [...this.listOfUser].filter(
          (res) => res.type === EUserPropertyType.TENANT
        );
        this.numberOfReceiverVariable = this.getNumberOfUserByType(
          EUserPropertyType.TENANT
        );
      }
    }

    if (this.hasTitle) {
      this.titleText = this.title;
    }
    if (this.isOpenFromFileOfSendQuoteLandlordFlow()) {
      this.contentText = this.dataMessageTrudi;
      this.selectedSender = trudiUserId;
      this.replaceVariable(this.forwardButtons);
      this.titleText = this.conversationTitle;
    }
    if (this.sendEmail) {
      this.contentText = '';
      this.selectedTopic = this.conversationTopicId;
      this.titleText = this.conversationTitle;
    }
    if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.file) {
      if (this.listOfFiles.length && this.listOfFiles[0]) {
        if (
          this.forwardAction === ForwardButtonAction.sendQuoteLandlord ||
          this.forwardAction === ForwardButtonAction.notifyLandlord ||
          this.forwardAction === ForwardButtonAction.notifyTenant ||
          this.forwardAction === ForwardButtonAction.sendInvoicePT
        ) {
          this.contentText = this.dataMessageTrudi;
          this.replaceVariable(this.forwardButtons);
        } else {
          this.replaceMessageFile();
        }
        this.titleText = this.getFileTypeName(
          this.listOfFiles[0].documentTypeId
        );
      }
      if (this.selectTopicItems) {
        const topic = this.selectTopicItems.find(
          (topic) => topic.text === 'Files'
        );
        if (topic) {
          this.selectedTopic = topic.id;
        }
      }
    }

    this.isReset && this.replaceVariable(this.forwardButtons);
    if (this.show && this.ticket) {
      this.ticketDetail = this.getTicketDetails(
        this.ticket.options?.ticketCategoryId
      );
      const topicTicket = this.selectTopicItems.find(
        (el) => el.text === this.ticket.options?.conversationTopic
      );
      if (topicTicket) {
        this.selectedTopic = topicTicket.id;
      }
      const ticketCategory = this.listofTicketCategory.find(
        (el) => el.id === this.ticket.options?.ticketCategoryId
      );
      if (ticketCategory) {
        this.titleText = ticketCategory.name;
      }
    }
    this.getDataFromService();
    if (changes['listOfFiles']?.currentValue) {
      this.isFileLarger = this.listOfFiles.some(
        (item) => item[0]?.size / 1024 ** 2 > this.fileLimit
      );
    }
    this.isDisabled = this.isCheckDisableSubmitButton();
  }

  handleOnchangeListOfFiles() {
    if (this.listOfFiles.length > 0) {
      this.listOfFiles = this.listOfFiles.map((item) => {
        item.icon =
          this.openFrom === 'file'
            ? this.fileService.getFileIcon(item?.name)
            : this.fileService.getFileIcon(item[0]?.name);
        if (!item.icon) {
          item.icon = this.fileService.getFileIcon(item?.name);
        }
        if (!item.icon) {
          item.icon = this.fileService.getFileIcon(item[0]?.name);
        }
        return item;
      });
    }
  }

  getListCategoryTypes() {
    const fullCategoryList = JSON.parse(
      localStorage.getItem('listCategoryTypes')
    );
    if (fullCategoryList) {
      this.fullCategoryList = fullCategoryList;
      const table = [];
      this.fulllistofConversationCategory = fullCategoryList.filter(
        (e) => e.consoleOnly === true
      );
      this.fulllistofConversationCategory.forEach((element) => {
        table.push({
          id: element.id,
          text: element.name
        });
      });
      this.selectTopicItems = table;
    }
  }

  getListTicketCategory() {
    if (!localStorage.getItem('listTicketCategories')) {
      this.apiService
        .getAPI(conversations, 'get-ticket-categories')
        .pipe(takeUntil(this.subscribers))
        .subscribe((res) => {
          this.listofTicketCategory = res;
          localStorage.setItem('listTicketCategories', JSON.stringify(res));
        });
    } else {
      this.listofTicketCategory = JSON.parse(
        localStorage.getItem('listTicketCategories')
      );
    }
  }

  ngOnInit(): void {
    this.conversationService.currentConversation
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (res && !this.listOfUser) {
          this.isAppUser = res.inviteStatus === UserStatus.ACTIVE;
        }
      });
    if (this.isTypeTrudi === ETrudiType.q_a) {
      this.handleReturnMessageValue(this.getSender(this.selectedSender));
    }
    this.taskService.currentTask$
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (!res) return;
        this.trudiResponse = res.trudiResponse as any;
        if (
          res?.trudiResponse &&
          res?.trudiResponse.type === ETrudiType.ticket
        ) {
          const findButton =
            this.trudiResponse?.data &&
            this.trudiResponse?.data[0].body?.button?.find(
              (button) => button.action === ForwardButtonAction.tkLandlord
            );

          this.listConversationWithLandlord = findButton?.conversation;

          if (this.showTextForward) {
            this.replaceVariable(this.forwardButtons);
          } else {
            this.contentText = '';
          }

          const trudiTicket = this.trudiResponse.data[0].header?.ticket;
          this.isItemTaskTicket = {
            ...trudiTicket,
            userCreateTicketFirstName: trudiTicket?.firstName,
            userCreateTicketLastName: trudiTicket?.lastName,
            userCreateTicketAvatar: trudiTicket?.googleAvatar
          };
        }
      });
    this.conversationService.trudiResponseConversation
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (!res) {
          return;
        }
        this.trudiResponse = res.trudiResponse;
        if (
          this.trudiResponse &&
          this.trudiResponse?.type === ETrudiType.ticket
        ) {
          const findButton =
            this.trudiResponse?.data &&
            this.trudiResponse?.data[0].body?.button?.find(
              (button) => button.action === ForwardButtonAction.tkLandlord
            );

          this.listConversationWithLandlord = findButton?.conversation;
          if (this.showTextForward) {
            this.replaceVariable(this.forwardButtons);
          } else {
            this.contentText = '';
          }

          const trudiTicket = this.trudiResponse.data[0].header?.ticket;
          this.isItemTaskTicket = {
            ...trudiTicket,
            userCreateTicketFirstName: trudiTicket.firstName,
            userCreateTicketLastName: trudiTicket.lastName,
            userCreateTicketAvatar: trudiTicket.googleAvatar
          };
        } else if (this.trudiResponse)
          this.enableEmailSignatureTrudiSuggestionFlow();
      });

    this.popupService.includePeople$
      .pipe(takeUntil(this.subscribers))
      .subscribe((v) => (this.includePeople = v));
    const user = this.userService.userInfo$?.getValue();
    if (user && user.id) {
      this.agentProfile = user;
      const index = this.sender.findIndex(
        (el) => el.id === this.agentProfile.id
      );
      if (index > -1) {
        this.sender.pop();
      }
      this.sender = [
        ...this.sender,
        {
          index: 1,
          id: this.agentProfile.id,
          name: this.agentProfile.firstName + ' ' + this.agentProfile.lastName,
          avatar: this.agentProfile.googleAvatar,
          title: this.agentProfile.title
        }
      ];
      !this.selectedTrudi && (this.selectedSender = this.agentProfile.id);
      // check condition when clicked on Go back button after clicked on close icon button
      if (
        this.isSendQuote ||
        this.openFrom === this.sendMessagePopupOpenFrom.trudi ||
        this.isOpenFromConvOfSendQuoteLandlordFlow() ||
        this.isOpenFromFileOfSendQuoteLandlordFlow()
      ) {
        this.selectedSender = trudiUserId;
      } else {
        !this.selectedTrudi && (this.selectedSender = this.agentProfile.id);
      }
    }
    this.getDataFromService();
    this.popupService.sendMessageData.next(null);
    this.fgText = this.fb.group({
      topic: this.fb.control(''),
      titleText: this.fb.control('', [
        Validators.required,
        Validators.maxLength(75)
      ]),
      contentText: this.fb.control('', [
        Validators.required,
        Validators.maxLength(2000)
      ])
    });
    this.isTaskType =
      this.taskService.currentTask$.value?.taskType === TaskType.TASK;
    // clear content text when variable showTextForward = false
    this.emptyContentText();
    this.showTitle();
    this.listOfUserByGroup = this.groupListOfUser(this.listOfUser);
    this.numberOfReceiver();
  }

  enableEmailSignatureTrudiSuggestionFlow() {
    const trudiResponse =
      this.conversationService.trudiResponseConversation?.value?.trudiResponse;
    const superHappyPathRaiseViaEmail =
      trudiResponse?.type === ETrudiType.super_happy_path &&
      trudiResponse.raiseVia === 'email';
    if (
      (this.trudiResponse.data?.[0]?.body?.newSuggestion?.trudiResponse ||
        superHappyPathRaiseViaEmail) &&
      this.listOfUser.length === 0
    ) {
      if (
        this.conversationService.currentConversation.value?.lastActivity == null
      ) {
        this.listOfUser = [true];
      }
    }
  }

  // TDI-719: remove Save for next time
  // ngAfterViewInit() {
  //   this.isPrefillTextMsg = this.checkPrefillTextMsg();
  //   if (this.isPrefillTextMsg) {
  //     window.addEventListener('click', (e: Event) => {
  //       // Check click outside/inside textAreaWrapper to hide/display Save Edit Checkbox
  //       if (this.textAreaWrapper.nativeElement.contains(e.target)) {
  //         this.isFocusTextArea = true;
  //       } else {
  //         this.isFocusTextArea = false;
  //       }
  //     });
  //   }
  // }

  getDataFromService() {
    if (this.popupService.sendMessageData.getValue()) {
      const {
        sender,
        title,
        task,
        messageText,
        files,
        users,
        markAsResolved,
        openFrom,
        forwardButton
      } = this.popupService.sendMessageData.getValue();
      if (
        [SendMesagePopupOpenFrom.file, SendMesagePopupOpenFrom.quit].includes(
          openFrom
        )
      ) {
        this.selectedSender = sender;
        this.contentText = messageText;
        this.conversationTitle = title;
        this.selectedTask = task;
        this.titleText = title;
        files.forEach((item) => {
          if (!this.listOfFiles.includes(item)) {
            this.listOfFiles = [...this.listOfFiles, item];
          }
        });
        this.allowResolvedTextbox = markAsResolved;
        this.listOfUser = users;
        this.forwardAction = forwardButton || this.forwardAction;
      }
    }
    this.listOfUserByGroup = this.groupListOfUser(this.listOfUser);
  }

  groupListOfUser(listOfUser) {
    const listGroup = listOfUser?.reduce((group, user) => {
      const userType = user.userPropertyType || user.type;
      if (group[userType]) {
        return {
          ...group,
          [userType]: [...group[userType], user]
        };
      }
      return {
        ...group,
        [userType]: [user]
      };
    }, {});
    this.listOfUserByGroupIndex = listOfUserTypeIndex.filter((l) =>
      Object.keys(listGroup).includes(l)
    );
    return listGroup;
  }

  checkSetDefaultMarkAsResolve(): boolean {
    return (
      [
        ForwardButtonAction.sendQuoteLandlord,
        ForwardButtonAction.sendInvoicePT
      ].includes(this.forwardAction) ||
      this.trudiResponse?.type === ETrudiType.q_a
    );
  }

  getSupplierName(list: any[]) {
    if (list?.length === 1) {
      return this.sharedService
        .displayName(list[0].firstName, list[0].lastName)
        ?.trim();
    }
    return '';
  }

  getListSupplierName(list: any[]) {
    if (list.length === 1) {
      return this.sharedService
        .displayName(list[0].firstName, list[0].lastName)
        ?.trim();
    } else {
      let listOfUserName: string[] = [];
      list.forEach((el) => {
        listOfUserName.push(
          this.sharedService.displayName(el.firstName, el.lastName)?.trim()
        );
      });
      return listOfUserName.join(', ');
    }
  }

  numberOfReceiver() {
    const landlord = this.getNumberOfUserByType(EUserPropertyType.LANDLORD);
    const tenant = this.getNumberOfUserByType(EUserPropertyType.TENANT);
    const supplier = this.getNumberOfUserByType(EUserPropertyType.SUPPLIER);
    const external = this.getNumberOfUserByType(EUserPropertyType.EXTERNAL);
    const contact = this.getNumberOfUserByType(EUserPropertyType.OTHER);
    this.numberOfReceiverVariable = this.messageService.getNumberOfReceiver(
      landlord,
      tenant,
      supplier,
      external,
      contact
    );
  }
  getNumberOfUserByType(type: EUserPropertyType) {
    const numberOfUser = this.listOfUser?.filter(
      (el) =>
        el.type === type ||
        (el.type === 'Primary ' + type && el.checked) ||
        el?.['userPropertyType'] === type
    ).length;
    if (!numberOfUser) {
      return '';
    }
    if (type == EUserPropertyType.EXTERNAL || type == EUserPropertyType.OTHER)
      return (
        numberOfUser +
        ' ' +
        (type == EUserPropertyType.EXTERNAL
          ? 'External email'
          : `${numberOfUser > 1 ? 'Other Contact' : 'Contact'}`) +
        this.sharedService.isPlural(numberOfUser)
      );
    return (
      numberOfUser +
      ' ' +
      type.toLocaleLowerCase() +
      this.sharedService.isPlural(numberOfUser)
    );
  }

  replaceContentTextAndSaveValue(key: string, value: string) {
    if (!key || !value) return;
    const reg = new RegExp(key, 'g');
    this.contentText = this.contentText.trim().replace(reg, value);
    //Check if array included obj yet
    // const findObj = this.replaceVariableValue.find(variable => JSON.stringify(variable) === JSON.stringify({key, value}));
    // if (!findObj) {
    //   this.replaceVariableValue.push({key, value});
    // }
  }

  replaceQuoteAtSendQuoteLandlord() {
    const findQuote = this.contentText.indexOf('quote/s');
    if (findQuote > -1) {
      if (!this.listOfFiles.length) return;
      const quoteText = this.listOfFiles.length > 1 ? 'quotes' : 'quote';
      this.contentText = this.contentText.replace('quotes', quoteText);
      this.contentText = this.contentText.replace('quote/s', quoteText);
    }
  }

  replaceVariable(trudiButtons: TrudiButton[]) {
    if (this.isForwardTicketFlow) {
      this.replaceTextForwardTicketFlow();
      return;
    }
    // const trudiData = this.conversationService.trudiResponseConversation.getValue();
    this.trudiResponseVariable =
      this.trudiResponseVariable ||
      (this.trudiResponse?.data && this.trudiResponse.data[0]?.body?.variable);
    const index = trudiButtons?.findIndex(
      (button) => button.action === this.forwardAction
    );
    if (index > -1) {
      const supplierFullName = this.getSupplierName(this.listOfUser);
      this.contentText = trudiButtons[index].textForward;

      switch (this.forwardAction) {
        case ForwardButtonAction.askSupplierQuote:
          if (supplierFullName) {
            this.replaceContentTextAndSaveValue(
              '{supplier name}',
              supplierFullName
            );
          }
          this.contentText = this.contentText.replace(
            /@numberOfTenant/g,
            'tenant/s'
          );
          break;
        case ForwardButtonAction.tell_tenant:
          break;
        case ForwardButtonAction.sendQuoteLandlord:
          this.setReceiverInSendQuoteLandlordFlow(trudiButtons[index]);
          break;
        case ForwardButtonAction.sendInvoicePT:
          this.contentText = this.dataMessageTrudi;
          if (this.listOfUser.length && this.listOfUser.length === 1) {
            this.replaceContentTextAndSaveValue(
              '{receiver name}',
              this.sharedService.displayName(
                this.listOfUser[0]?.firstName,
                this.listOfUser[0]?.lastName
              )
            );
          }
          const currentConv =
            this.conversationService.currentConversation.getValue();
          if (
            currentConv &&
            currentConv.propertyType === EUserPropertyType.SUPPLIER
          ) {
            this.replaceContentTextAndSaveValue(
              '{number of supplier}',
              currentConv.lastName
            );
            this.replaceContentTextAndSaveValue(
              '{selected supplier}',
              currentConv.lastName
            );
          }
          break;
        case ForwardButtonAction.supToTenant:
          const listSupplier = [...this.infoAddition].filter(
            (res) => res.type === EUserPropertyType.SUPPLIER
          );
          const suppliersFullName = this.getListSupplierName(listSupplier);
          this.replaceContentTextAndSaveValue(
            '{supplier name}',
            suppliersFullName
          );
          break;
        case ForwardButtonAction.tkLandlord:
          // If one owner, set "Hi + firstName" . More than one owner, just set "Hi".
          const landlordName =
            this.listOfUser?.length > 1
              ? ''
              : this.listOfUser[0]?.firstName || '';
          this.contentText = trudiButtons[index].option[
            this.likeToSaySelectedIndex
          ].textForward as string;
          if (landlordName) {
            this.replaceContentTextAndSaveValue(
              '{landlord name}',
              landlordName
            );
          }
          this.replaceContentTextAndSaveValue(
            '{number of quote}',
            this.replaceTheQuoteInForwardRequestToLandlordFlow()
          );
          break;
        case ForwardButtonAction.createWorkOrder:
          this.replaceContentTextAndSaveValue(
            '{supplier name}',
            supplierFullName
          );
          break;
        case ForwardButtonAction.notifyLandlord:
          const NameLandlord = this.getSupplierName(
            this.listConversationWithLandlord
          );
          if (NameLandlord) {
            this.replaceContentTextAndSaveValue(
              '{landlord name}',
              NameLandlord
            );
          }
          break;
        case ForwardButtonAction.notifyTenant:
          break;
        default:
          break;
      }
    }
    if (
      this.trudiResponseVariable &&
      Object.keys(this.trudiResponseVariable).length
    ) {
      for (const [key, value] of Object.entries(this.trudiResponseVariable)) {
        if (this.contentText.includes(key)) {
          this.replaceContentTextAndSaveValue(key, value);
        }
      }
    }

    const sender = this.getSender(this.selectedSender);
    this.replaceContentTextAndSaveValue('{Name}', sender?.name);
    this.replaceContentTextAndSaveValue('{Role}', sender?.title);
    this.replaceContentTextAndSaveValue(
      '{Agency}',
      this.agencyService.currentAgency.value?.name
    );
  }

  replaceTextForwardTicketFlow() {
    if (this.listOfUser.length === 1) {
      this.contentText = `Hi ${
        this.sharedService.displayName(
          this.listOfUser[0].firstName,
          this.listOfUser[0].lastName
        ) || ''
      }, \n\nThe ${this.ticket.options.propertyType.toLowerCase()} has a raised a ${
        this.getTicketDetails(this.ticket.options.ticketCategoryId).name
      } for ${this.ticket.options.propertyAddress}.`;
    } else {
      this.contentText = `Hi {receiver name}, \n\nThe ${this.ticket.options.propertyType.toLowerCase()} has raised a ${
        this.getTicketDetails(this.ticket.options.ticketCategoryId).name
      } for ${this.ticket.options.propertyAddress}.`;
    }
  }

  setReceiverInSendQuoteLandlordFlow(button: TrudiButton) {
    this.contentText = this.dataMessageTrudi || button.textForward;

    let listSupplier = [];

    if (this.maintenanceFromAppChat?.isForward) {
      const currentConv =
        this.conversationService.currentConversation.getValue();
      if (
        currentConv &&
        currentConv.propertyType === EUserPropertyType.SUPPLIER
      ) {
        listSupplier = [
          {
            id: currentConv?.userId,
            name: currentConv?.lastName
          }
        ];
      }
    } else {
      this.listOfFiles.forEach((item) => {
        if (!listSupplier.some((el) => el.id === item.user?.id)) {
          listSupplier.push({
            id: item.user?.id,
            name: item.user?.lastName
          });
        }
      });
    }

    if (!listSupplier.length) {
      this.replaceContentTextAndSaveValue('{number of supplier}', 'undefined');
      this.replaceContentTextAndSaveValue('{selected supplier}', 'undefined');
    }

    let nameOfLandlord = '';
    let listUserQuote = this.listConversationForwardLandlord;
    // remove item has duplicate id
    listUserQuote = listUserQuote.filter(
      (v, i, a) => a.findIndex((v2) => v2.id === v.id) === i
    );

    if (
      listUserQuote &&
      listUserQuote.length &&
      this.maintenanceFromAppChat?.sendQuote
    ) {
      if (listUserQuote.length === 1) {
        this.replaceContentTextAndSaveValue(
          '{landlord name}',
          this.sharedService.displayName(
            listUserQuote[0]?.firstName,
            listUserQuote[0]?.lastName
          )
        );
      }
    } else {
      if (this.listOfUser.length && this.listOfUser.length === 1) {
        this.replaceContentTextAndSaveValue(
          '{landlord name}',
          this.sharedService.displayName(
            this.listOfUser[0]?.firstName,
            this.listOfUser[0]?.lastName
          )
        );
      } else {
        this.replaceContentTextAndSaveValue(
          '{landlord name}',
          '{receiver name}'
        );
      }
    }

    this.replaceContentTextAndSaveValue('{landlord name}', nameOfLandlord);
    this.replaceContentTextAndSaveValue(
      '{number of quote}',
      `${this.listOfFiles.length > 1 ? 'quotes' : 'quote'}`
    );
    this.replaceQuoteAtSendQuoteLandlord();
    this.replaceContentTextAndSaveValue(
      '{number of supplier}',
      listSupplier
        .map(
          (item, index) =>
            `${item.name}${index === listSupplier.length - 2 ? ' and' : ','}`
        )
        .join(' ')
        .slice(0, -1)
    );
    this.replaceContentTextAndSaveValue(
      '{selected supplier}',
      listSupplier
        .map(
          (item, index) =>
            `${item.name}${index === listSupplier.length - 2 ? ' and' : ','}`
        )
        .join(' ')
        .slice(0, -1)
    );
  }

  checkIsForwardTicketFlow(): boolean {
    return (
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.appChat && this.ticket
    );
  }

  replaceTheQuoteInForwardRequestToLandlordFlow(): string {
    return this.controlPanelService.forwardLandlordData.quote === 1
      ? 'the quote'
      : 'the quotes';
  }

  getSender(userId: string) {
    return this.sender.find((el) => el.id === userId);
  }

  compareFn(item: TaskItemDropdown, selected: TaskItemDropdown) {
    return item === selected;
  }

  onOpenSelect(id: string, action = 'focus' || 'focusout') {
    const searchInput = this.elementRef.nativeElement.querySelector(
      `.sender#${id} ng-select input`
    );
    searchInput.setSelectionRange(
      searchInput.value.length,
      searchInput.value.length
    );
    this.inputTaskFocused = action === 'focus';
    this.searchTaskInputEmpty = searchInput.value === '' || !searchInput.value;
  }

  onTaskSelectChanged(item: TaskItemDropdown): void {
    if (item) {
      this.selectedTask = item;
    }
    const searchInput = this.elementRef.nativeElement.querySelector(
      '.sender#task-select ng-select input'
    );
    searchInput?.blur();
  }

  onSearchTask({ term }: { term: string; items: any[] }) {
    const searchInput = this.elementRef.nativeElement.querySelector(
      '.sender#task-select ng-select input'
    );
    if (searchInput.value === '' || !searchInput.value) {
      this.hideLabelSelectTask();
    }
  }

  hideLabelSelectTask() {
    const searchLabel = this.elementRef.nativeElement.querySelector(
      '.sender#task-select ng-select .ng-value-label'
    );
    searchLabel.textContent = '';
  }

  public getTicketDetails(id) {
    const categoryDetail = this.listofTicketCategory.find((el) => el.id === id);
    if (!categoryDetail) {
      return {};
    }
    return categoryDetail;
  }

  titleChanged(event) {
    if (event) {
      this.fgText.get('titleText').setValue(event);
    }
    this.isDisabled = this.isCheckDisableSubmitButton();
  }

  onCheckboxChange(e: boolean) {
    this.resolvedText = '';
    clearTimeout(this.scrollTimeout);
    this.isMsgSummaryEmpty = false;
    this.allowResolvedTextbox = e;

    this.checkHasResolved();
  }

  checkHasResolved() {
    if (!this.allowResolvedTextbox) {
      this.resolvedValid = true;
    } else {
      this.resolvedValid =
        this.resolvedText.length > 0 && this.resolvedText !== '';
    }
  }

  contentChanged(event: string) {
    this.checkHasResolved();
    if (event) {
      this.fgText.get('contentText').setValue(event);
    }
  }

  public isOpenModal(status) {
    if (!status) {
      this.isCloseModal.next(status);
    }
  }

  public openQuitConfirmModal(status) {
    this.isOpenQuitConfirmModal.next({
      close: status,
      confirmQuit: true
    });
    this.popupService.setFromMessageModal(status);
    !this.sendEmail && this.popupService.includePeople$.next(true);
    // this.resetResolvedTextbox(); // remove reset checkbox
    const title = this.notEditTopicTitle
      ? this.conversationTitle
      : this.titleText;
    this.popupService.sendMessageData.next({
      openFrom: SendMesagePopupOpenFrom.quit,
      sender: this.selectedSender,
      messageText: this.valueEditor,
      title: title,
      task: this.selectedTask,
      files: this.listOfFiles,
      markAsResolved: this.allowResolvedTextbox,
      users: this.listOfUser,
      forwardButton: this.forwardAction
    });
  }

  resetResolvedTextbox() {
    // this.allowResolvedTextbox = true;
    this.isMsgSummaryEmpty = false;
    this.resolvedCheckbox = false;
  }

  public openSelectPeopleModal(status: boolean) {
    this.resetResolvedTextbox();
    this.resolvedText = '';
    this.selectedSender = this.agentProfile.id;
    this.isOpenSelectPeople.next(status);
    this.popupService.selectPeople$.next(false);
    this.popupService.sendMessageData.next(null);
    this.popupService.isResetFile$.next(true);
    this.resetField();
    this.emptyContentText();
    this.tinyEditor.resetToDefault();
  }

  onGoBackTrudiTicket() {
    switch (this.forwardAction) {
      case ForwardButtonAction.supToTenant:
        this.openSelectPeopleModal(true);
        break;
      case ForwardButtonAction.askSupplierQuote:
        this.openSelectPeopleModal(true);
        break;
      case ForwardButtonAction.createWorkOrder:
        this.openSelectPeopleModal(true);
        break;
      case ForwardButtonAction.sendQuoteLandlord:
        if (this.maintenanceFromAppChat?.sendQuote) {
          this.openSelectPeopleModal(true);
        } else {
          this.sharedService.isStatusStepQuote$.next(false);
          this.isBackModalSendQuote.next(true);
        }
        break;
      case ForwardButtonAction.sendInvoicePT:
        this.openSelectPeopleModal(true);
        break;
      default:
        break;
    }
    if (
      this.controlPanelService.forwardLandlordData &&
      this.controlPanelService.forwardLandlordData.owner?.length &&
      this.forwardAction === ForwardButtonAction.tkLandlord
    ) {
      this.isBackModal.emit(true);
    }
    this.popupService.sendMessageData.next(null);
  }

  clickable() {
    if (
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi ||
      (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.file &&
        [
          ForwardButtonAction.sendQuoteLandlord,
          ForwardButtonAction.sendInvoicePT
        ].includes(this.forwardAction))
    ) {
      return this.valueEditor;
    }
    const isTaskType =
      this.taskService.currentTask$?.value?.taskType === TaskType.TASK;
    if (
      (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.user && !isTaskType) ||
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.appChat ||
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.conv ||
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.userIndex
    ) {
      return this.hasTitle
        ? this.titleText && this.valueEditor
        : this.valueEditor;
    }
    return this.titleText && this.valueEditor;
  }

  public openActionLink(status) {
    this.isOpenActionLink.next(status);
  }

  public openFile(status) {
    this.isOpenFile.next(status);
    const title = this.notEditTopicTitle
      ? this.conversationTitle
      : this.titleText;
    this.popupService.sendMessageData.next({
      openFrom: SendMesagePopupOpenFrom.file,
      sender: this.selectedSender,
      messageText: this.valueEditor,
      title: title,
      task: this.selectedTask,
      files: this.listOfFiles,
      markAsResolved: this.allowResolvedTextbox,
      users: this.listOfUser,
      forwardButton: this.forwardAction
    });
    this.sharedService.isStatusStepQuote$.next(true);
  }

  public getCategoryDitails(categoryId) {
    const categoryDetails =
      this.fullCategoryList.find((cat) => cat.id === categoryId) || {};
    if (categoryId === '0d2817fa-9687-11e9-bc42-526af7764f64') {
      categoryDetails.svg = 'old-rent.svg';
      categoryDetails.color = 'rgb(0, 169, 159)';
      categoryDetails.hideEdit = true;
    }
    return categoryDetails;
  }

  getListFileType() {
    if (!localStorage.getItem('listFileType')) {
      this.apiService
        .getAPI(properties, 'list-of-filetype')
        .pipe(takeUntil(this.subscribers))
        .subscribe((res: IFileType[]) => {
          this.fileTypes = res;
          localStorage.setItem('listFileType', JSON.stringify(res));
        });
    } else {
      this.fileTypes = JSON.parse(localStorage.getItem('listFileType'));
    }
  }

  fileBrowseHandler(event) {
    const [file] = event.target?.files || [];
    this.selectedFile = null;

    if (file) {
      const fileExtensionIsValid = validateFileExtension(
        file,
        this.FILE_VALID_TYPE
      );

      if (fileExtensionIsValid) {
        this.prepareFilesList(event.target.files);
        this.selectedFile = null;
      }
    }
    this.handleOnSubmitUploadAttachments();
    this.isFileLarger = this.listOfFiles.some(
      (item) => item[0]?.size / 1024 ** 2 > this.fileLimit
    );
    this.isDisabled = this.isCheckDisableSubmitButton();
  }

  handleOnSubmitUploadAttachments() {
    let additionalFiles = this.listFileUpload.flatMap((item) => item.listFile);
    additionalFiles = additionalFiles.map((item) => {
      return {
        '0': item,
        icon: item.icon
      };
    });
    this.listOfFiles = [...this.listOfFiles, ...additionalFiles];
    this.listFileUpload = [];
  }

  prepareFilesList(file: FileList) {
    this.timeUpload = Date.now();
    this.selectedFile = file;
    this.mapInfoListFile(this.selectedFile);
    this.listFileUpload = [];
    for (let index = 0; index < this.selectedFile.length; index++) {
      this.listFileUpload.push({
        title: ``,
        listFile: [this.selectedFile[index]]
      });
    }
    this.showPopupMessage = false;
  }

  mapInfoListFile(fileList) {
    if (!fileList) return;
    for (let index = 0; index < fileList.length; index++) {
      if (!fileList[index]) return;
      fileList[index].icon = this.fileService.getFileIcon(fileList[index].name);
      fileList[index].fileName = this.fileService.getFileName(
        fileList[index].name
      );
      fileList[index].extension = this.fileService.getFileExtension(
        fileList[index].name
      );
    }
  }

  public removeFile(i: number) {
    this.listOfFiles.splice(i, 1);
    this.removeFileItem.emit(i);
    this.isFileLarger = this.listOfFiles.some(
      (item) => item[0]?.size / 1024 ** 2 > this.fileLimit
    );
    this.isDisabled = this.isCheckDisableSubmitButton();
  }

  public async openInviteSuccessModal(status) {
    this.companyEmailSignatureService.enableSignatureButton.next(false);
    this.isLoading = true;
    if (this.forwardAction === ForwardButtonAction.notifyLandlordTenantAttend) {
      this.submitSendMessage.emit({
        message: this.valueEditor,
        isResolveConversation: this.allowResolvedTextbox,
        userId: this.selectedSender
      });
      this.isLoading = false;
    }
    if (
      this.sendEmail ||
      (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi &&
        !this.ticket &&
        !(this.forwardAction === this.forwardButtonAction.tell_tenant) &&
        !this.infoAddition?.length &&
        this.forwardAction !== ForwardButtonAction.notifyLandlord &&
        this.forwardAction !== ForwardButtonAction.notifyTenant) ||
      (this.isOpenFromFileOfSendQuoteLandlordFlow() &&
        this.listConversationForwardLandlord.length)
    ) {
      const propertyId = this.propertyService.newCurrentProperty?.value?.id;
      const trudiResponseConversation =
        this.conversationService.trudiResponseConversation.value;
      const buttonIdx =
        this.forwardButtons &&
        this.forwardButtons.findIndex(
          (btn) => btn.action === this.forwardAction
        );
      const currentConversation =
        this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi
          ? trudiResponseConversation
          : this.conversationService.currentConversation?.value;
      // this.loadingService.onLoading();
      let body = {
        conversationId: currentConversation?.id,
        actionLinks: [],
        files: [],
        textMessage: {
          message: this.valueEditor,
          isSendFromEmail: this.conversationService.checkIsSendFromEmail(
            currentConversation?.id
          ),
          userId: this.selectedSender
        },
        isResolveConversation: this.allowResolvedTextbox,
        trudiResponse: {},
        ...(!this.isMsgSummaryEmpty && { summary: this.resolvedText })
      };

      // send quote landlord
      if (this.isOpenFromFileOfSendQuoteLandlordFlow()) {
        const propertyId = this.propertyService.currentPropertyId.value;
        await Promise.all(
          this.listOfFiles.map(async (el) => {
            if (el.mediaLink) {
              body.files.push({
                documentTypeId: el.documentTypeId,
                title: el.name,
                fileName: `${el.name}.pdf`,
                fileSize: el.size,
                fileType: el.fileType?.name,
                mediaLink: el?.mediaLink,
                propertyId
              });
            } else {
              const { name, size, type } = el;
              const fileToSend = el[0];
              const documentTypeArr = JSON.parse(
                localStorage.getItem('listDocumentType')
              );
              const documentTypeOtherId = documentTypeArr?.find(
                (item) => item.name === 'Other'
              )?.id;
              const userPropertyIds = [];
              const data = await this.fileUploadService.uploadFile2(
                fileToSend,
                propertyId
              );
              body.files.push({
                documentTypeId: el.topicId,
                title: el.name,
                fileName: fileToSend.name,
                fileSize: fileToSend.size,
                fileType: fileToSend.type,
                mediaLink: data.Location,
                propertyId
              });
              this.propertyService.addFile2(
                propertyId,
                name,
                size,
                type,
                data.Location,
                userPropertyIds,
                documentTypeOtherId,
                name
              );
            }
          })
        );
      } else {
        await Promise.all(
          this.listOfFiles.map(async (el, index) => {
            const fileToSend = el[0];
            const data = await this.fileUploadService.uploadFile2(
              fileToSend,
              propertyId
            );
            body.files.push({
              documentTypeId: el.topicId,
              title: el.name,
              fileName: fileToSend.name,
              fileSize: fileToSend.size,
              fileType: fileToSend.type,
              mediaLink: data.Location,
              propertyId
            });
          })
        );
      }
      // this.loadingService.stopLoading();
      if (this.listConversationForwardLandlord.length > 0) {
        const v3body = {
          actionLinks: body.actionLinks,
          summary: body.summary,
          isResolveConversation: body.isResolveConversation,
          propertyDocuments: [],
          files: body.files,
          message: body.textMessage.message,
          users: this.listConversationForwardLandlord,
          userId: this.selectedSender
        };
        this.sendMessageService
          .sendV3Message(this.sendMessageService.formatV3MessageBody(v3body))
          .pipe(takeUntil(this.subscribers))
          .subscribe({
            next: async (res) => {
              await this.updateCompleteOfListButtonInTrudiResponse(
                trudiResponseConversation,
                buttonIdx
              );
              this.markResolvedConversation(
                body.isResolveConversation,
                body.textMessage.userId
              );
              this.sharedService.isResetListFile.next(true);
              // this.conversationService.reloadConversationList.next(true);
              this.closeModalAndReset(status);
            },
            error: (error) => {
              throw new Error(error.message);
            }
          });
      } else {
        this.sendMessageService
          .sendV2Message(body)
          .pipe(takeUntil(this.subscribers))
          .subscribe((res: IMessage[]) => {
            if (this.isTypeTrudi !== ETrudiType.q_a) {
              this.closeModalAndReset(status);
            }
            if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi) {
              const Q_A_STEP_0 = 0;

              if (body.isResolveConversation)
                this.conversationService.currentUserChangeConversationStatus(
                  this.messagesType.solved,
                  false
                );

              this.conversationService
                .completedTrudiResponseStep(
                  this.conversationService.trudiResponseConversation.getValue()
                    .id,
                  Q_A_STEP_0
                )
                .subscribe((res) => {
                  if (this.isTypeTrudi === ETrudiType.q_a) {
                    this.nextStep && this.moveToNextStep.emit(this.nextStep);
                  }
                  if (this.isTypeTrudi === ETrudiType.suggestion) {
                    res &&
                      this.conversationService.newTrudiResponseSuggestion.next(
                        res
                      );
                    if (body.isResolveConversation) {
                      this.headerService.headerState$.next({
                        ...this.headerService.headerState$.value,
                        currentStatus: TaskStatusType.completed
                      });
                    }
                  }
                  this.closeModalAndReset(status);
                });
            }
            this.conversationService.reloadConversationList.next(true);
            this.conversationService.messagesSentViaEmail.next(res);
            this.taskService.reloadTaskArea$.next(true);
            this.markResolvedConversation(
              body.isResolveConversation,
              body.textMessage.userId
            );
            // this.conversationService.reloadConversationList.next(true);
          });
      }

      this.isCloseTask = true;
    } else if (
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.file &&
      !this.listConversationForwardLandlord.length
    ) {
      const isTaskType =
        this.taskService.currentTask$.value.taskType === TaskType.TASK;
      const propertyId = this.propertyService.newCurrentProperty.value.id;
      const checkProperty = this.listOfUser.some(
        (el) => el.propertyId !== propertyId
      );
      this.checkExistExternal = this.listOfUser.filter(
        (el) =>
          el.type === EUserPropertyType.EXTERNAL ||
          el.type === EUserPropertyType.SUPPLIER
      );

      if (checkProperty) {
        this.isCreateNewMsg = true;
        this.isCreateNewConv = this.checkExistExternal.length ? true : false;
      } else {
        this.isCreateNewConv = true;
        this.isCreateNewMsg = false;
      }

      const body = {
        message: [],
        actionLink: [],
        file: [],
        propertyDocument: [],
        isResolveConversation: this.allowResolvedTextbox,
        isForwardDocument: this.isForward,
        ...(!this.isMsgSummaryEmpty && { summary: this.resolvedText }),
        ...((!isTaskType || checkProperty) && { isCreateMessageType: true })
      };
      // this.loadingService.onLoading();

      if (this.isFileTab) {
        const propertyIdTask =
          this.taskService.currentTask$?.value?.property?.id;
        this.listOfUser.forEach((el) => {
          if (el.checked) {
            body.message.push({
              categoryId: ECategoryType.files,
              propertyId: el.propertyId,
              status: 'OPEN',
              userId: this.selectedSender,
              personUserId: el.id,
              personUserType: el.personUserType || el.type,
              personUserEmail: el.personUserEmail,
              categoryMessage: this.titleText,
              contentMessage: this.handleReplaceMailReceiverName(
                this.valueEditor,
                el,
                this.openFrom,
                this.forwardAction
              ),
              taskId:
                !isTaskType || propertyIdTask !== el.propertyId
                  ? ''
                  : this.taskService.currentTaskId$.getValue()
            });
          }
        });
      } else {
        this.listOfUser.forEach((el) => {
          if (el.checked) {
            body.message.push({
              categoryId: ECategoryType.files,
              propertyId,
              status: 'OPEN',
              userId: this.selectedSender,
              personUserId: el.id,
              categoryMessage:
                this.forwardAction === ForwardButtonAction.sendQuoteLandlord
                  ? 'Maintenance Request'
                  : this.titleText,
              contentMessage: this.handleReplaceMailReceiverName(
                this.valueEditor,
                el,
                this.openFrom,
                this.forwardAction
              ),
              taskId: this.taskService.currentTaskId$.getValue()
            });
          }
        });
      }

      if (this.isOpenFromFileOfSendQuoteLandlordFlow()) {
        const propertyId = this.propertyService.currentPropertyId.value;
        const propertyIds = [];
        await Promise.all(
          this.listOfFiles.map(async (el) => {
            // File is already uploaded to s3, so it has mediaLink
            if (el.mediaLink) {
              body.file.push({
                documentTypeId: el.documentTypeId,
                title: el.name,
                fileName: `${el.name}.pdf`,
                fileSize: 44356,
                fileType: el.fileType?.name,
                mediaLink: el?.mediaLink,
                propertyId,
                propertyIds
              });
            } else {
              const { name, size, type } = el;
              const fileToSend = el[0];
              const documentTypeArr = JSON.parse(
                localStorage.getItem('listDocumentType')
              );
              const documentTypeOtherId = documentTypeArr?.find(
                (item) => item.name === 'Other'
              )?.id;
              const userPropertyIds = [];
              const data = await this.fileUploadService.uploadFile2(
                fileToSend,
                propertyId
              );
              // File upload to s3 because it has no mediaLink
              body.file.push({
                documentTypeId: el.topicId,
                title: el.name,
                fileName: fileToSend.name,
                fileSize: fileToSend.size,
                fileType: fileToSend.type,
                mediaLink: data.Location,
                propertyId,
                propertyIds
              });
              this.propertyService.addFile2(
                propertyId,
                name,
                size,
                type,
                data.Location,
                userPropertyIds,
                documentTypeOtherId,
                name
              );
            }
          })
        );
      } else {
        if (this.ticket)
          body.message = body.message.map((item) => ({
            ...item,
            options: this.ticket.options,
            fileIds: this.ticket.fileIds
          }));
        this.listOfFiles.forEach((item) => {
          body.propertyDocument.push({
            id: item.id,
            name: item.name,
            propertyId
          });
        });
      }
      const newBody = {
        ...body,
        message: body.message.map((item) => ({
          ...item,
          taskId: this.taskService.currentTask$.value.id
        }))
      };
      const item = isTaskType && !this.ticket ? newBody : body;
      // this.loadingService.stopLoading();
      this.conversationService
        .sendBulkMessageEvent(item)
        .pipe(
          takeUntil(this.subscribers),
          tap(() => {
            this.headerService.moveCurrentTaskToInprogress();
          })
        )
        .subscribe((res) => {
          const trudiResponseConversation =
            this.conversationService.trudiResponseConversation.value;
          switch (this.forwardAction) {
            case ForwardButtonAction.sendQuoteLandlord:
              this.listOfUser.forEach((item1) => {
                item1.conversationId = res.find(
                  (item2) => item2.personUserId === item1.id
                )?.conversationId;
              });
              // index = 4 means send_quote_landlord flow
              const currentReceivers =
                this.maintenanceService?.maintenanceRequestResponse?.value
                  ?.data[0]?.variable?.receivers;
              const receivers = [
                ...currentReceivers.filter(
                  (user) => user.action !== this.forwardAction
                ),
                ...this.listOfUser.map((el) => {
                  return { ...el, action: this.forwardAction };
                })
              ];
              this.maintenanceService
                .saveVariableResponseData(
                  this.taskService.currentTask$.value?.id,
                  receivers
                )
                .subscribe(async (res) => {
                  if (res) {
                    await this.updateCompleteOfListButtonInTrudiResponse(
                      trudiResponseConversation,
                      4
                    );
                    this.closeModalAndReset(status);
                    this.sharedService.isResetListFile.next(true);
                  }
                });
              break;
            default:
              break;
          }
          if (this.showTextForward && !this.isFileTab) {
            this.isLoading = false;
            this.maintenanceService
              .changeButtonStatus(
                this.taskService.currentTask$.value?.id,
                this.forwardAction,
                this.trudiStep,
                TrudiButtonEnumStatus.COMPLETED
              )
              .pipe(takeUntil(this.subscribers))
              .subscribe((data) => {
                // this.loadNewButtons(data.data[0].body.button as TrudiButton[]);
                this.reopenTaskIfCompletedOrDeleted();
              });
          } else {
            this.isLoading = false;
            this.reopenTaskIfCompletedOrDeleted();
          }
          this.markResolvedConversation(
            item.isResolveConversation,
            item.message[0].userId
          );
          if (
            this.isFileTab &&
            this.openFrom !== SEND_MESSAGE_POPUP_OPEN_FROM.userIndex
          ) {
            this.isLoading = false;
            this.isCloseModal.next(true);
          }
        });
    } else if (
      this.forwardAction === this.forwardButtonAction.tell_tenant &&
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi
    ) {
      // this.loadingService.onLoading();
      const trudiResponseConversationId =
        this.maintenanceService.maintenanceRequestResponse.value.data[0].variable.receivers.find(
          (el) =>
            el.raiseBy === 'USER' &&
            el.userPropertyType === EUserPropertyType.TENANT
        )?.conversationId;
      const trudiResponseConversation =
        this.conversationService.trudiResponseConversation.value;
      const body = {
        conversationId: trudiResponseConversationId,
        actionLinks: [],
        files: [],
        textMessage: {
          message: this.valueEditor,
          isSendFromEmail: this.conversationService.checkIsSendFromEmail(
            trudiResponseConversationId
          ),
          userId: this.selectedSender
        },
        isResolveConversation: this.allowResolvedTextbox,
        ...(!this.isMsgSummaryEmpty && { summary: this.resolvedText })
      };
      // this.loadingService.stopLoading();
      const messsageObservable = this.sendMessageService
        .sendV2Message(body)
        .pipe(
          takeUntil(this.subscribers),
          tap(async (res: IMessage[]) => {
            if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi) {
              await this.updateCompleteOfListButtonInTrudiResponse(
                trudiResponseConversation,
                0
              );
            }
            if (
              body.conversationId ===
              this.conversationService.currentConversation?.getValue()?.id
            ) {
              this.conversationService.messagesSentViaEmail.next(res);
            }
            this.markResolvedConversation(
              body.isResolveConversation,
              body.textMessage.userId
            );
            this.closeModalAndReset();
            // this.conversationService.reloadConversationList.next(true);
          })
        );

      // Agent join before sending Tell tenant we’re looking into it
      if (this.forwardAction === this.forwardButtonAction.tell_tenant) {
        const currentConversationId =
          this.conversationService.currentConversation?.getValue()?.id;
        this.checkIfAgentJoined(currentConversationId, messsageObservable);
      } else {
        messsageObservable.subscribe();
      }
      this.isCloseTask = true;
    } else if (
      ((this.infoAddition?.length &&
        ![
          ForwardButtonAction.askSupplierQuote,
          ForwardButtonAction.tkLandlord
        ].includes(this.forwardAction)) ||
        this.forwardAction === ForwardButtonAction.notifyLandlord ||
        this.forwardAction === ForwardButtonAction.notifyTenant) &&
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi
    ) {
      // this.loadingService.onLoading();
      const trudiResponseConversation =
        this.conversationService.trudiResponseConversation.value;
      const buttonIdx =
        this.forwardButtons &&
        this.forwardButtons.findIndex(
          (btn) => btn.action === this.forwardAction
        );
      let conversationId = trudiResponseConversation?.id;
      // Send message to existed conversation in create work order flow
      if (this.forwardAction === this.forwardButtonAction.createWorkOrder) {
        conversationId = this.listOfUser[0].conversationId;
      }
      if (this.forwardAction === ForwardButtonAction.supToTenant) {
        conversationId =
          this.maintenanceService.maintenanceRequestResponse.value?.data[0]?.variable?.receivers.find(
            (el) => el.userPropertyType === EUserPropertyType.TENANT
          )?.conversationId;
      }
      const body = {
        conversationId,
        actionLinks: [],
        files: [],
        textMessage: {
          message: this.valueEditor,
          isSendFromEmail:
            this.conversationService.checkIsSendFromEmail(conversationId),
          userId: this.selectedSender,
          optionParam: {
            contacts: []
          }
        },
        isResolveConversation: this.allowResolvedTextbox,
        ...(!this.isMsgSummaryEmpty && { summary: this.resolvedText })
      };
      if (
        this.forwardAction !== ForwardButtonAction.notifyLandlord &&
        this.forwardAction !== ForwardButtonAction.notifyTenant
      ) {
        this.infoAddition.forEach((element) => {
          body.textMessage.optionParam.contacts.push({
            title: element.title,
            address: element.address,
            firstName: element.firstName || '',
            lastName: element.lastName || '',
            mobileNumber: element.mobileNumber || '',
            phoneNumber: element.phoneNumber || '',
            email: element.email || '',
            landingPage: element.landingPage || ''
          });
        });
      }
      // this.loadingService.stopLoading();
      if (
        this.forwardAction === this.forwardButtonAction.notifyLandlord ||
        this.forwardAction === this.forwardButtonAction.notifyTenant
      ) {
        const listId: any[] = [];
        switch (this.forwardAction) {
          case this.forwardButtonAction.notifyLandlord:
            this.maintenanceService.maintenanceRequestResponse.value?.data[0]?.variable?.receivers.forEach(
              (item) => {
                if (
                  item.userPropertyType === EUserPropertyType.LANDLORD ||
                  item.type === EUserPropertyType.LANDLORD
                ) {
                  listId.push(item);
                }
              }
            );
            break;
          case this.forwardButtonAction.notifyTenant:
            listId.push(
              this.maintenanceService.maintenanceRequestResponse.value?.data[0]?.variable?.receivers.find(
                (el) =>
                  el.userPropertyType === EUserPropertyType.TENANT ||
                  el.type === EUserPropertyType.TENANT
              )
            );
            break;
          default:
            break;
        }
        let messsageObservable: Observable<IMessage[]>;
        from(listId)
          .pipe(
            mergeMap((user) => {
              body.conversationId = user.conversationId || user.id;
              body.textMessage.message = this.valueEditor;
              body.textMessage.message = body.textMessage.message.replace(
                /{landlord name}/g,
                this.sharedService.displayName(user.firstName, user.lastName)
              );
              body.textMessage.isSendFromEmail =
                this.conversationService.checkIsSendFromEmail(
                  body.conversationId
                );
              messsageObservable = this.sendMessageService.sendV2Message(body);
              return messsageObservable;
            }),
            takeUntil(this.subscribers)
          )
          .subscribe(async (res: IMessage[]) => {
            await this.updateCompleteOfListButtonInTrudiResponse(
              trudiResponseConversation,
              buttonIdx
            );
            if (
              body.conversationId ===
              this.conversationService.currentConversation?.getValue()?.id
            ) {
              this.conversationService.messagesSentViaEmail.next(res);
              this.markResolvedConversation(
                body.isResolveConversation,
                body.textMessage.userId
              );
            }
            this.closeModalAndReset(status);
            // this.conversationService.reloadConversationList.next(true);
          });
      } else {
        const currentConversationId =
          this.conversationService.currentConversation?.getValue()?.id;
        const messsageObservable = this.sendMessageService
          .sendV2Message(body)
          .pipe(
            takeUntil(this.subscribers),
            tap(async (res: IMessage[]) => {
              if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi) {
                if (
                  this.forwardAction ===
                  this.forwardButtonAction.createWorkOrder
                ) {
                  await this.updateCompleteOfListButtonInTrudiResponse(
                    trudiResponseConversation,
                    buttonIdx
                  );
                  this.closeModalAndReset(status);
                } else {
                  await this.updateCompleteOfListButtonInTrudiResponse(
                    trudiResponseConversation,
                    buttonIdx
                  );
                  this.closeModalAndReset(status);
                }
              }
              if (body.conversationId === currentConversationId) {
                this.conversationService.messagesSentViaEmail.next(res);
              }
              this.markResolvedConversation(
                body.isResolveConversation,
                body.textMessage.userId
              );
              // this.conversationService.reloadConversationList.next(true);
            }),
            tap(() => {
              this.headerService.moveCurrentTaskToInprogress();
            })
          );

        // Agent join before sending supplier detail to tenant
        if (this.forwardAction === this.forwardButtonAction.supToTenant) {
          this.checkIfAgentJoined(currentConversationId, messsageObservable);
        } else {
          messsageObservable.subscribe();
        }
      }
      this.isCloseTask = true;
    } else {
      const isTaskType =
        this.taskService.currentTask$.value?.taskType === TaskType.TASK;
      const body = {
        message: [],
        actionLink: [],
        file: [],
        isResolveConversation: this.allowResolvedTextbox,
        ...(!this.isMsgSummaryEmpty && { summary: this.resolvedText }),
        isCreateMessageType: false,
        ...(!isTaskType && { isCreateMessageType: true }),
        agencyId: '',
        isForwardDocument: this.isForward
      };
      let remainingProperties = [];
      this.listOfUser.forEach((el) => {
        if (
          el.checked ||
          el.personUserType == EUserPropertyType.EXTERNAL ||
          el.type === EUserPropertyType.SUPPLIER
        ) {
          if (remainingProperties.indexOf(el.propertyId) === -1) {
            remainingProperties.push(el.propertyId);
          }
        }
      });
      // this.loadingService.onLoading();
      await Promise.all(
        this.listOfFiles.map(async (el, index) => {
          const fileToSend = el[0];
          // Handle Forward in Send quote to Landlord flow
          let data;
          if (!fileToSend.mediaLink) {
            data = await this.fileUploadService.uploadFile2(
              fileToSend,
              remainingProperties[0]
            );
          }
          body.file.push({
            documentTypeId:
              el.topicId || fileToSend.topicId || fileToSend.topicId || '',
            title: el.title || fileToSend.title || fileToSend.name,
            fileName: fileToSend.name,
            fileSize: fileToSend.size,
            fileType: fileToSend.type || fileToSend.fileType?.name,
            mediaLink: data ? data.Location : fileToSend.mediaLink,
            propertyId: remainingProperties[0],
            propertyIds: remainingProperties.slice(1)
          });
        })
      );
      let taskId;
      const selectedTaskBindingValue = (this.selectedTask?.value ||
        this.selectedTask) as BindingValueTaskItemDropdown;
      if (this.popupService.isShowNewMessageFromIndex.getValue()) {
        body.isCreateMessageType = true;
      }
      this.listOfUser?.forEach((el) => {
        if (el.type === EUserPropertyType.OTHER) {
          const tempTaskId =
            this.openFrom !== SEND_MESSAGE_POPUP_OPEN_FROM.sidebar
              ? this.taskService.currentTaskId$.getValue()
              : '';
          body.message.push({
            categoryId:
              this.conversationService.selectedCategoryId.value ||
              ECategoryType.generalEnquiryId,
            propertyId: this.propertyService.currentPropertyId.value,
            status: 'OPEN',
            userId: this.selectedSender,
            personUserId: el.user ? el.user.id : el.userId || el.id,
            categoryMessage:
              this.openFrom !== SEND_MESSAGE_POPUP_OPEN_FROM.userIndex
                ? this.titleText
                : selectedTaskBindingValue.titleName,
            contentMessage:
              this.handleReplaceMailReceiverName(
                this.valueEditor,
                el,
                this.openFrom,
                this.forwardAction
              ) || this.valueEditor,
            taskId: tempTaskId
          });
        } else if (
          el.checked &&
          el.personUserType !== EUserPropertyType.EXTERNAL &&
          el.type !== EUserPropertyType.SUPPLIER
        ) {
          if (this.ticket) {
            if (this.openFrom === 'trudi') {
              this.ticket = {
                ...this.ticket,
                options: {
                  ...this.ticket.options,
                  text: this.textEditTicket || this.ticket.options.text
                }
              };
            }
            let options = this.ticket.options;
            if (
              this.infoAddition &&
              this.infoAddition.length &&
              (this.forwardAction === ForwardButtonAction.askSupplierQuote ||
                this.forwardAction === ForwardButtonAction.tkLandlord)
            ) {
              options = {
                ticket: this.ticket.options,
                contacts: this.infoAddition,
                text: this.ticket.options.text,
                type: 'MUlTIPLE_TASK'
              };
            }
            body.message.push({
              categoryId: this.conversationService.selectedCategoryId.value,
              propertyId: el.propertyId,
              status: 'OPEN',
              userId: this.selectedSender,
              personUserId: el.user ? el.user.id : el.id,
              categoryMessage: this.titleText,
              contentMessage:
                this.handleReplaceMailReceiverName(
                  this.valueEditor,
                  el,
                  this.openFrom,
                  this.forwardAction
                ) || this.valueEditor,
              options: options,
              fileIds: [...this.ticket.fileIds],
              taskId: this.getTaskIdForSendBulkPeopleTab(
                this.taskService.currentTaskId$.getValue()
              )
            });
            if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi) {
              switch (this.forwardAction) {
                case ForwardButtonAction.askSupplierQuote:
                  this.contentText.replace(
                    /{supplier name}/g,
                    this.sharedService.displayName(el.firstName, el.lastName)
                  );
                  break;
                case ForwardButtonAction.tkLandlord:
                  this.contentText.replace(
                    /{landlord name}/g,
                    this.sharedService.displayName(el.firstName, el.lastName)
                  );
                  break;
                default:
                  break;
              }
            }
          } else {
            //Handle taskId when create new message from task detail
            const tempTaskId =
              this.openFrom !== SEND_MESSAGE_POPUP_OPEN_FROM.sidebar
                ? this.getTaskIdForSendBulkPeopleTab(taskId)
                : '';
            body.message.push({
              categoryId:
                this.conversationService.selectedCategoryId.value ||
                ECategoryType.generalEnquiryId,
              propertyId: el.propertyId,
              status: 'OPEN',
              userId: this.selectedSender,
              personUserId: el.user ? el.user.id : el.userId || el.id,
              categoryMessage: this.titleText,
              contentMessage:
                this.handleReplaceMailReceiverName(
                  this.valueEditor,
                  el,
                  this.openFrom,
                  this.forwardAction
                ) || this.valueEditor,
              taskId: tempTaskId
            });
          }
        }
        if (
          el.personUserType === EUserPropertyType.EXTERNAL ||
          el.type === EUserPropertyType.SUPPLIER
        ) {
          let tempTaskId;
          if (
            this.isTaskType &&
            this.openFrom !== SEND_MESSAGE_POPUP_OPEN_FROM.sidebar
          ) {
            tempTaskId = this.taskService.currentTaskId$.getValue();
          } else {
            tempTaskId = '';
          }
          body.message.push({
            categoryId:
              this.conversationService.selectedCategoryId.value ||
              ECategoryType.generalEnquiryId,
            propertyId: el.propertyId,
            status: 'OPEN',
            userId: this.selectedSender,
            personUserId: el.user ? el.user.id : el.userId || el.id,
            personUserEmail: el.personUserEmail,
            personUserType: el.personUserType || el.type,
            categoryMessage: this.titleText,
            contentMessage:
              this.handleReplaceMailReceiverName(
                this.valueEditor,
                el,
                this.openFrom,
                this.forwardAction
              ) || this.valueEditor,
            fileIds: this.ticket ? [...this.ticket?.fileIds] : [],
            options: this.ticket ? this.ticket?.options : '',
            taskId: tempTaskId
          });
        }
      });
      // this.loadingService.stopLoading();
      this.conversationService
        .sendBulkMessageEvent(body)
        .pipe(
          takeUntil(this.subscribers),
          tap(() => {
            this.headerService.moveCurrentTaskToInprogress();
          })
        )
        .subscribe(
          async (res: SendBulkMessageResponse[]) => {
            if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.user) {
              this.router.navigate(['dashboard', 'detail', `${res[0].taskId}`]);
              this.closeModalAndReset();
            } else if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi) {
              const trudiResponseConversation =
                this.conversationService.trudiResponseConversation.value;
              switch (this.forwardAction) {
                case ForwardButtonAction.askSupplierQuote:
                  const listSuppliers: { conversationId; userId }[] = [];
                  res &&
                    res.forEach((el) => {
                      listSuppliers.push({
                        conversationId: el.conversationId,
                        userId: el.personUserId
                      });
                    });
                  await this.updateCompleteOfListButtonInTrudiResponse(
                    trudiResponseConversation,
                    3
                  );
                  this.submitSendMessage.emit(listSuppliers);
                  this.reopenTaskIfCompletedOrDeleted();
                  this.closeModalAndReset();
                  break;
                case ForwardButtonAction.tkLandlord:
                  this.listOfUser.forEach((item1) => {
                    item1.conversationId = res.find(
                      (item2) => item2.personUserId === item1.id
                    )?.conversationId;
                  });

                  // index = 1 means forward_ticket_landlord flow
                  let bodyUsers = {
                    taskId: this.taskService.currentTask$.value?.id,
                    data: this.listOfUser,
                    index: 1
                  };
                  this.conversationService
                    .sendUsersQuoteLandlord(bodyUsers)
                    .pipe(takeUntil(this.subscribers))
                    .subscribe(async (response) => {
                      await this.updateCompleteOfListButtonInTrudiResponse(
                        trudiResponseConversation,
                        1
                      );
                      this.reopenTaskIfCompletedOrDeleted();
                      this.closeModalAndReset();
                    });
                  break;
                default:
                  break;
              }
            } else {
              this.conversationService.reloadConversationList.next(true);
              this.taskService.reloadTaskArea$.next(true);
              this.reopenTaskIfCompletedOrDeleted();
              this.closeModalAndReset();
            }
            if (this.popupService.isShowNewMessageFromIndex.getValue()) {
              this.popupService.isShowNewMessageFromIndex.next(false);
            }
          },
          () => {
            this.conversationService.reloadConversationList.next(true);
          }
        );
    }
    this.popupService.sendMessageData.next(null);
    this.resetResolvedTextbox();
  }

  getTaskIdForSendBulkPeopleTab(taskId: string) {
    const isTaskType =
      this.taskService.currentTask$.value?.taskType === TaskType.TASK;
    if (this.openFrom !== SEND_MESSAGE_POPUP_OPEN_FROM.userIndex) {
      return isTaskType ? this.taskService.currentTaskId$.getValue() : '';
    } else {
      return taskId;
    }
  }

  saveTrudiResponseForNextTime() {
    const buttonIdx =
      this.forwardButtons &&
      this.forwardButtons.findIndex((btn) => btn.action === this.forwardAction);
    const conversation =
      this.conversationService.trudiResponseConversation?.getValue();
    let textSaveNextTime = this.contentText;
    this.replaceVariableValue.map((variable) => {
      const reg = new RegExp(variable?.value, 'g');
      textSaveNextTime = textSaveNextTime.trim().replace(reg, variable.key);
    });

    const body = {
      conversationId: conversation?.id,
      trudiResponse: {
        text: textSaveNextTime,
        stepIndex: 0,
        buttonIndex: buttonIdx,
        trudiResponseType: this.trudiResponse.type,
        optionIndex: this.likeToSaySelectedIndex
      }
    };
    this.conversationService.saveTrudiResponseForNextTime(body).subscribe({
      next: (res) => {
        if (!res) return;
        this.conversationService.getSavedNextTimeData();
      }
    });
    this.replaceVariableValue = [];
  }

  closeModalAndReset(showSuccessModal = false) {
    this.isLoading = false;
    this.isOpenSuccessModal.next(showSuccessModal);
    this.isCloseModal.next(true);
    this.submitSendMessage.next(true);
    this.resetField();
  }

  async updateCompleteOfListButtonInTrudiResponse(
    trudiResponseConversation: UserConversation,
    btnIndex: number
  ) {
    const response = await lastValueFrom(
      this.maintenanceService.changeButtonStatus(
        this.taskService.currentTask$.value?.id,
        this.forwardAction,
        0,
        TrudiButtonEnumStatus.COMPLETED
      )
    );
    if (!response?.data) {
      this.toastService.error(`Error`);
      return;
    }
    // trudiResponseConversation.trudiResponse.data = response.data;
    this.maintenanceService.maintenanceRequestResponse.next(response);
    this.conversationService.trudiResponseConversation.next(
      trudiResponseConversation
    );
    this.conversationService.updateStatusMaintenanceRequest.next(
      trudiResponseConversation
    );
  }

  checkIfAgentJoined(
    currentConversationId: string,
    messageObservable: Observable<IMessage[]>
  ) {
    if (
      (this.conversationService.agentJoined() &&
        this.selectedSender === this.userService.selectedUser.value.id) ||
      this.selectedSender === trudiUserId
    ) {
      messageObservable.subscribe();
    } else {
      const propertyId = this.propertyService.newCurrentProperty.value.id;
      this.conversationService
        .agentJoinToConversation(currentConversationId, propertyId)
        .pipe(takeUntil(this.subscribers))
        .subscribe((el) => {
          if (el) {
            this.conversationService.messagesSentViaEmail.next([el]);
            messageObservable.subscribe();
          }
        });
    }
  }
  handleReplaceMailReceiverName(
    messageContent: string,
    user: any,
    openFrom: string,
    forwardAction: ForwardButtonAction
  ): string {
    if (
      openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi &&
      forwardAction === ForwardButtonAction.askSupplierQuote
    ) {
      return messageContent.replace(/{supplier name}/g, user.lastName);
    }

    if (
      openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi &&
      forwardAction === ForwardButtonAction.tkLandlord
    ) {
      return messageContent.replace(
        /{landlord name}/g,
        this.sharedService.displayName(user.firstName, user.lastName)
      );
    }

    if (
      openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.conv &&
      forwardAction === ForwardButtonAction.sendQuoteLandlord
    ) {
      return messageContent.replace(
        /{receiver name}/g,
        this.sharedService.displayName(user.firstName, user.lastName)
      );
    }

    if (
      openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.conv &&
      forwardAction === ForwardButtonAction.sendInvoicePT
    ) {
      return messageContent.replace(
        /{receiver name}/g,
        this.sharedService.displayName(user.firstName, user.lastName)
      );
    }

    if (
      [
        SEND_MESSAGE_POPUP_OPEN_FROM.appChat,
        SEND_MESSAGE_POPUP_OPEN_FROM.file
      ].includes(openFrom) &&
      forwardAction === ForwardButtonAction.sendQuoteLandlord
    ) {
      return messageContent.replace(
        /{receiver name}/g,
        this.sharedService.displayName(user.firstName, user.lastName)
      );
    }

    if (
      SEND_MESSAGE_POPUP_OPEN_FROM.appChat &&
      !forwardAction &&
      !!this.isForwardTicketFlow
    ) {
      const checkIsExistName =
        this.sharedService.displayName(user.firstName, user.lastName) || '';
      return messageContent.replace(/{receiver name}/g, checkIsExistName);
    }
    if (SEND_MESSAGE_POPUP_OPEN_FROM.file) {
      const checkIsExistName =
        this.sharedService.displayName(user.firstName, user.lastName) || '';
      if (checkIsExistName) {
        return messageContent.replace(/{receiver name}/g, checkIsExistName);
      } else {
        return messageContent
          .replace(/{receiver name}/g, checkIsExistName)
          .replace('Hi ,', 'Hi,');
      }
    }
    return '';
  }

  getCategoryByTopic(topicId) {
    return this.fulllistofConversationCategory.find(
      (el) => el.topicId === topicId
    );
  }

  getFileTypeName(fileId: string) {
    if (!localStorage.getItem('listDocumentType')) {
      this.apiService
        .getAPI(properties, 'list-of-documenttype')
        .pipe(takeUntil(this.subscribers))
        .subscribe((res) => {
          if (res) {
            localStorage.setItem('listDocumentType', JSON.stringify(res));
            const file = res.find((data) => data.id === fileId);
            if (file) {
              return file.name;
            }
          }
        });
    } else {
      const fulllistofConversationCategory = JSON.parse(
        localStorage.getItem('listDocumentType')
      );
      const file = fulllistofConversationCategory.find(
        (data) => data.id === fileId
      );
      if (file) {
        return file.name;
      }
    }
  }

  reopenTaskIfCompletedOrDeleted() {
    if (this.popupService.isShowNewMessageFromIndex.getValue()) {
      return;
    }
    const currentTask = this.taskService.currentTask$.getValue();
    if (currentTask.status === TaskStatusType.completed) {
      this.taskService.currentTaskId$.next(currentTask.id);
      this.taskService.currentTask$.next({
        ...currentTask,
        status: TaskStatusType.inprogress
      });
      this.taskService.moveTaskItem$.next({
        task: currentTask,
        source: TaskStatusType.completed,
        destination: TaskStatusType.inprogress
      });
    }
    if (currentTask.status === TaskStatusType.deleted) {
      this.taskService.currentTaskId$.next(currentTask.id);
      this.taskService.currentTask$.next({
        ...currentTask,
        status: TaskStatusType.inprogress
      });
      this.taskService.moveTaskItem$.next({
        task: currentTask,
        source: TaskStatusType.deleted,
        destination: TaskStatusType.inprogress
      });
    }
    this.headerService.headerState$.next({
      ...this.headerService.headerState$.value,
      currentTask: {
        ...currentTask,
        status: TaskStatusType.inprogress
      },
      currentStatus: TaskStatusType.inprogress
    });
  }

  resetField() {
    this.titleText = '';
    this.contentText = '';
    this.selectedTopic = '';
    this.resolvedText = '';
    this.selectedSender =
      this.forwardAction === this.forwardButtonAction.tell_tenant
        ? this.selectedSender
        : this.agentProfile?.id;
    this.listOfFiles = [];
    this.listOfUser = [];
    this.selectedTask = null;
  }

  getLeftButtonText() {
    if (
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.user ||
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.userIndex
    ) {
      return 'Cancel';
    }
    return 'Back';
  }

  hideTopicField() {
    return (
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.conv ||
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.user ||
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi ||
      this.isOpenFromFileOfSendQuoteLandlordFlow()
    );
  }

  isShowAddFileBtn() {
    return (
      this.forwardAction !== this.forwardButtonAction.tell_tenant &&
      !this.infoAddition?.length &&
      this.forwardAction !== this.forwardButtonAction.createWorkOrder &&
      this.forwardAction !== this.forwardButtonAction.tkLandlord &&
      this.forwardAction !== this.forwardButtonAction.askSupplierQuote
    );
  }

  isOpenFromFileOfSendQuoteLandlordFlow() {
    return (
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.file &&
      [
        ForwardButtonAction.sendQuoteLandlord,
        ForwardButtonAction.sendInvoicePT
      ].includes(this.forwardAction)
    );
  }

  isOpenFromConvOfSendQuoteLandlordFlow() {
    return (
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.conv &&
      [
        ForwardButtonAction.sendQuoteLandlord,
        ForwardButtonAction.sendInvoicePT
      ].includes(this.forwardAction)
    );
  }

  onSMSreminder(status: boolean) {
    this.SMSreminder = status;
    this.isSMS = !this.isSMS;
  }

  getTextTicket(text: string) {
    this.textEditTicket = text;
    this.isItemTaskTicket.options.text = text;
  }

  getInnerHTML(val) {
    this.contentText = val.replace(/(<([^>]+)>)/gi, '');
  }

  handleEmailSignatureEmit(status: boolean) {
    this.emailSignature.setValue(status);
  }

  markResolvedConversation(
    isResolveConversation: boolean,
    userId: string,
    isNewConversation: boolean = false
  ) {
    if (!isResolveConversation) return;
    if (isNewConversation) return;
    const currentUser = this.userService.userInfo$.getValue();
    let user: LastUser = null;
    if (userId === trudiUserId) {
      user = {
        firstName: 'Trudi',
        status: 'status',
        isUserPropetyTree: false,
        lastName: '',
        avatar: 'assets/icon/trudi-logo.svg',
        id: trudiUserId,
        type: 'trudi'
      };
    } else if (userId === currentUser.id) {
      user = {
        firstName: currentUser.firstName,
        status: currentUser.status,
        isUserPropetyTree: currentUser.userProperties?.idUserPropetyTree,
        lastName: currentUser.lastName,
        avatar: currentUser.googleAvatar,
        id: currentUser.id,
        type: currentUser.type
      };
    }
    this.headerService.headerState$.next({
      ...this.headerService.headerState$.value,
      currentStatus: TaskStatusType.completed
    });
    this.conversationService.updateConversationStatus$.next({
      status: EMessageType.solved,
      option: null,
      user,
      addMessageToHistory: false
    });
  }

  handleEditorValueChange(value: string) {
    this.valueEditor = value;
    this.isDisabled = this.isCheckDisableSubmitButton();
  }

  editorAddFileComputer() {
    const button = this.elementRef.nativeElement.querySelector(
      '#send-mess-upload-btn'
    );
    button?.click();
  }

  ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
    window.removeEventListener('click', () => {});
    clearTimeout(this.scrollTimeout);
  }

  isCheckDisableSubmitButton() {
    return (
      validateWhiteSpaceHtml(this.valueEditor) ||
      this.isLoading ||
      ((this.hasTitle || this.ticket) && !this.titleText) ||
      this.isFileLarger
    );
  }

  emptyContentText() {
    if (!this.showTextForward) {
      this.contentText = '';
      this.valueEditor = '';
    }
  }

  dropFile(event) {
    if (!this.showAddFile || this.noAddFile) return;
    this.listOfFiles.push(...[event]?.flatMap((file) => file));
  }

  handleRemoveReceiver(value) {
    if (this.listOfUser.length === 1) {
      this.openQuitConfirmModal(true);
    } else {
      this.listOfUser = this.listOfUser.filter((user) => user?.id !== value);
      this.listOfUserByGroup = this.groupListOfUser(this.listOfUser);
      this.numberOfReceiver();
    }
  }
  showTitle() {
    if (!this.ticket) {
      if (!this.showTextForward)
        this.titlePopup = `Send ${
          this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.file
            ? 'File'
            : 'Message'
        }`;
      if (this.isFileTab) this.titlePopup = 'Send File';
    } else {
      this.titlePopup = 'Forward Ticket';
    }
    if (this.isOpenFromConvOfSendQuoteLandlordFlowVariable)
      this.titlePopup = `${
        this.typeViaEmail === 'SEND_LANDLORD'
          ? 'Forward Quote'
          : 'Forward invoice'
      }`;
  }
}
