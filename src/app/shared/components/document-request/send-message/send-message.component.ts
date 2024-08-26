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
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { lastValueFrom, Observable, Subject } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { conversations, properties } from 'src/environments/environment';
import { ApiService } from '@services/api.service';
import {
  MAX_TEXT_MESS_LENGTH,
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
import { TaskStatusType } from '@shared/enum/task.enum';
import { TaskItemDropdown } from '@shared/types/task.interface';
import { ETrudiType } from '@shared/enum/trudi';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { EMessageType } from '@shared/enum/messageType.enum';
import {
  InfoAdditionButtonAction,
  TrudiBody,
  TrudiButton,
  TrudiFowardLandlordSelected,
  TrudiResponse
} from '@shared/types/trudi.interface';
import { SharedService } from '@services/shared.service';
import { ControlPanelService } from '@/app/control-panel/control-panel.service';
import { Suppliers } from '@shared/types/agency.interface';
import { SendMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { MessageService } from '@services/message.service';
import { IFile } from '@shared/types/file.interface';
import { SendMesagePopupOpenFrom } from '@shared/enum/share.enum';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '@services/loading.service';
import { HeaderService } from '@services/header.service';

@Component({
  selector: 'app-document-request-send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.scss']
})
export class DocumentRequestSendMessageComponent implements OnInit, OnDestroy {
  @Output() isCloseModal = new EventEmitter<boolean>();
  @Output() isBackModal = new EventEmitter<boolean>();
  @Output() isBackModalSendQuote = new EventEmitter<boolean>();
  @Output() isOpenQuitConfirmDocumentRequestModal = new EventEmitter<boolean>();
  @Output() isOpenSuccessModal = new EventEmitter<boolean>();
  @Output() isOpenActionLink = new EventEmitter<boolean>();
  @Output() isOpenPopupFileDocumentRequest = new EventEmitter<boolean>();
  @Output() isOpenSelectPeople = new EventEmitter<boolean>();
  @Output() moveToNextStep = new EventEmitter<number>();
  @Output() removeFileItem = new EventEmitter<number>();
  @Output() setSendFromId = new EventEmitter<string>();
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
    | InfoAdditionButtonAction[];
  // @Input() infoAddition: InfoAdditionButtonAction;
  @Input() forwardButtons: TrudiButton[];
  @Input() noBackBtn: boolean = false;
  @Input() noTicket: boolean = false;
  @Input() noAddFile: boolean = false;
  @Input() likeToSaySelectedIndex: number;
  @Input()
  listConversationForwardLandlord: getListLandlordConversationByTaskResponse[] =
    [];
  @Input() isBackSendQuote = true;
  @Input() isSendQuote = false;
  @Input() textContentSendMsg = '';
  @Input() listTenantConversation: TrudiFowardLandlordSelected[];
  @Input() trudiBody: TrudiBody;
  @Input() typeViaEmail: IPeopleFromViaEmail['type'] = 'SEND_LANDLORD';

  public messagesType = EMessageType;
  public TYPE_TRUDI = ETrudiType;
  public forwardButtonAction = ForwardButtonAction;
  readonly MAX_TEXT_MESS_LENGTH = MAX_TEXT_MESS_LENGTH;
  readonly SEND_MESSAGE_POPUP_OPEN_FROM = SEND_MESSAGE_POPUP_OPEN_FROM;
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
  public openedFromMessageTab = false;
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
  public allowResolvedTextbox = false;
  public listConversationWithLandlord: TrudiFowardLandlordSelected[];
  public TYPE_MAINTENANCE = SendMaintenanceType;
  allowResolvedSwitch = true;
  includePeople = true;
  resolvedText = '';
  resolvedValid = true;
  scrollTimeout!: NodeJS.Timer;
  isMsgSummaryEmpty = false;
  resolvedCheckbox = false;
  selectedTrudi = false;
  isItemTaskTicket: any;
  textEditTicket: string;
  isNoHeaderTitle = false;

  inputTaskFocused = false;
  searchTaskInputEmpty = false;
  selectedTask: TaskItemDropdown;
  taskNameList: TaskItemDropdown[];
  private trudiResponse: TrudiResponse;

  numberOfReceiverVariable = '';
  isOpenFromConvOfSendQuoteLandlordFlowVariable: boolean;
  isOpenFromFileOfSendQuoteLandlordFlowVariable: boolean;
  showAddFile: boolean;

  ticketDetail;
  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private fileUploadService: FileUploadService,
    public popupService: PopupService,
    private propertyService: PropertiesService,
    public fileService: FilesService,
    private userService: UserService,
    private readonly conversationService: ConversationService,
    public taskService: TaskService,
    private readonly elementRef: ElementRef,
    private sharedService: SharedService,
    private controlPanelService: ControlPanelService,
    private messageService: MessageService,
    private toastService: ToastrService,
    private loadingService: LoadingService,
    private headerService: HeaderService
  ) {}

  targetChange(e: TargetFromFormMessage) {
    this.selectedTrudi = e.id === trudiUserId;
    this.selectedSender = e.id;
    this.setSendFromId.emit(this.selectedSender);
    this.replaceVariable();
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
    this.conversationService.trudiResponseConversation
      .pipe(takeUntil(this.subscribers))
      .subscribe((res) => {
        if (!res) {
          return;
        }
        this.trudiResponse = res.trudiResponse;
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
    }
    this.selectedSender = trudiUserId;
    this.replaceVariable();
    this.getDataFromService();
    this.popupService.sendMessageData.next(null);
    this.fgText = this.fb.group({
      topic: this.fb.control(''),
      titleText: this.fb.control('', [
        Validators.required,
        Validators.maxLength(30)
      ]),
      contentText: this.fb.control('', [
        Validators.required,
        Validators.maxLength(250)
      ])
    });
  }

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

  getListSupplierName(list: any[]) {
    if (list?.length === 1) {
      return this.sharedService
        .displayName(list[0].firstName, list[0].lastName)
        ?.trim();
    }
    return '';
  }

  numberOfReceiver() {
    const landlord = this.getNumberOfUserByType(EUserPropertyType.LANDLORD);
    const tenant = this.getNumberOfUserByType(EUserPropertyType.TENANT);
    const supplier = this.getNumberOfUserByType(EUserPropertyType.SUPPLIER);
    return this.messageService.getNumberOfReceiver(landlord, tenant, supplier);
  }

  getNumberOfUserByType(type: EUserPropertyType) {
    const numberOfUser = this.listOfUser.filter(
      (el) => el.type === type && el.checked
    ).length;
    if (!numberOfUser) {
      return '';
    }
    return (
      numberOfUser +
      ' ' +
      type.toLocaleLowerCase() +
      this.sharedService.isPlural(numberOfUser)
    );
  }

  getNamesFromList(list: any[]) {
    if (list.length === 1) {
      return this.sharedService
        .displayName(list[0].firstName, list[0].lastName)
        ?.trim();
    }
    let listOfUserName: string[] = [];
    this.listOfUser.forEach((el) => {
      listOfUserName.push(
        this.sharedService.displayName(el.firstName, el.lastName)?.trim()
      );
    });
    return listOfUserName.join(', ');
  }

  replaceVariable() {
    const currentSender = this.sender.findIndex(
      (el) => el.id === this.selectedSender
    );
    this.contentText = this.textContentSendMsg;
    this.handleReplaceText();
    this.contentText = this.contentText?.replace(
      /{property manager name}/g,
      this.sender[currentSender].name + ', ' + this.sender[currentSender].title
    );
  }

  handleReplaceText() {
    const trudiData =
      this.conversationService.trudiResponseConversation.getValue();
    const trudiVariable =
      trudiData.trudiResponse?.data &&
      trudiData.trudiResponse?.data[0]?.body?.variable;
    if (!trudiVariable) return;
    for (const [key, value] of Object.entries(trudiVariable)) {
      if (this.contentText.includes(key)) {
        const reg = new RegExp(key, 'g');
        this.contentText = this.contentText.trim().replace(reg, value);
      }
    }
  }

  setReceiverInSendQuoteLandlordFlow(
    button: TrudiButton,
    agencyName: string,
    title: string
  ) {
    this.contentText = this.dataMessageTrudi || button.textForward;

    const listSupplier = [];
    this.listOfFiles.forEach((item) => {
      if (!listSupplier.some((el) => el.id === item.user?.id)) {
        listSupplier.push({
          id: item.user?.id,
          name: item.user?.lastName
        });
      }
    });

    let nameOfLandlord = '';
    let listUserQuote = this.listConversationForwardLandlord;
    // remove item has duplicate id
    listUserQuote = listUserQuote.filter(
      (v, i, a) => a.findIndex((v2) => v2.id === v.id) === i
    );

    if (listUserQuote.length > 0) {
      nameOfLandlord = listUserQuote
        .map(
          (item, index) =>
            `${item.firstName ? item.firstName + ' ' : ''}${item.lastName}${
              index === listUserQuote.length - 2 ? ' and' : ','
            }`
        )
        .join(' ')
        .slice(0, -1);
    } else {
      nameOfLandlord = this.listOfUser
        .map(
          (item, index) =>
            `${item.firstName ? item.firstName + ' ' : ''}${item.lastName}${
              index === this.listOfUser.length - 2 ? ' and' : ','
            }`
        )
        .join(' ')
        .slice(0, -1);
    }
    this.contentText = this.contentText
      .trim()
      .replace(/@landlordFirstName/g, nameOfLandlord);
    this.contentText = this.contentText
      .split(/@numberOfQuote/g)
      .join(`${this.listOfFiles.length > 1 ? 'quotes' : 'quote'}`);
    this.contentText = this.contentText.replace(
      /@numberOfSupplier/g,
      listSupplier
        .map(
          (item, index) =>
            `${item.name}${index === listSupplier.length - 2 ? ' and' : ','}`
        )
        .join(' ')
        .slice(0, -1)
    );
    this.contentText = this.contentText.replace(/@agentName/g, agencyName);
    this.contentText = this.contentText.replace(/@agentTitle/g, title);
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

  findTopic(topicId: string): string {
    return this.fulllistofConversationCategory.find((el) => el.id === topicId)
      ?.name;
  }

  onTextboxChange(value: string): void {
    this.isMsgSummaryEmpty = !(value.length > 0);
    this.checkHasResolved();
  }

  public getTicketDetails(id) {
    const categoryDetail = this.listofTicketCategory.find((el) => el.id === id);
    if (!categoryDetail) {
      return {};
    }
    return categoryDetail;
  }

  topicChanged(event) {
    if (event) {
      this.fgText.get('topic').setValue(event);
    }
  }

  titleChanged(event) {
    if (event) {
      this.fgText.get('titleText').setValue(event);
    }
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

  public openQuitConfirmModal() {
    this.isOpenQuitConfirmDocumentRequestModal.emit(true);
    // this.popupService.setFromMessageModal(status);
    // !this.sendEmail && this.popupService.includePeople$.next(true);
    // const title = this.notEditTopicTitle
    //   ? this.conversationTitle
    //   : this.titleText;
    // this.popupService.sendMessageData.next({
    //   openFrom: SendMesagePopupOpenFrom.quit,
    //   sender: this.selectedSender,
    //   messageText: this.contentText,
    //   title: title,
    //   task: this.selectedTask,
    //   files: this.listOfFiles,
    //   markAsResolved: this.allowResolvedTextbox,
    //   users: this.listOfUser,
    //   forwardButton: this.forwardAction,
    // });
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
        this.sharedService.isStatusStepQuote$.next(false);
        this.isBackModalSendQuote.next(true);
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
    if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.userIndex) {
      return this.selectedTask && this.contentText;
    }

    if (
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi ||
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.conv ||
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.appChat ||
      (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.file &&
        [
          ForwardButtonAction.sendQuoteLandlord,
          ForwardButtonAction.sendInvoicePT
        ].includes(this.forwardAction))
    ) {
      return this.contentText;
    }

    // if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.conv) {
    //   return (this.titleText && this.contentText);
    // }
    return this.selectedTopic && this.titleText && this.contentText;
  }

  public openActionLink(status) {
    this.isOpenActionLink.next(status);
  }

  public openFile(status) {
    this.isOpenPopupFileDocumentRequest.emit(status);
    const title = this.notEditTopicTitle
      ? this.conversationTitle
      : this.titleText;
    this.popupService.sendMessageData.next({
      openFrom: SendMesagePopupOpenFrom.file,
      sender: this.selectedSender,
      messageText: this.contentText,
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

  public removeFile(i: number) {
    this.listOfFiles.splice(i, 1);
    this.removeFileItem.emit(i);
  }

  public loadNewButtons(newButtons: TrudiButton[]) {
    const findButton = newButtons?.find(
      (button) => button.action === ForwardButtonAction.tkLandlord
    );
    findButton &&
      (this.listConversationWithLandlord = findButton?.conversation);
    this.controlPanelService.reloadForwardRequestList.next(newButtons);
    this.conversationService.reloadConversationList.next(true);
    this.taskService.reloadTaskArea$.next(true);
  }

  public async openInviteSuccessModal(status) {
    const trudiResponseConversation =
      this.conversationService.trudiResponseConversation.value;
    const propertyId = this.propertyService.currentPropertyId.value;
    const currentConversation =
      this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.trudi
        ? trudiResponseConversation
        : this.conversationService.currentConversation?.value;
    this.loadingService.onLoading();
    let body = {
      conversationId: currentConversation?.id,
      actionLinks: [],
      files: [],
      textMessage: {
        message: this.contentText,
        isSendFromEmail: this.conversationService.checkIsSendFromEmail(
          currentConversation?.id
        ),
        userId: this.selectedSender
      },
      isResolveConversation: this.allowResolvedTextbox,
      trudiResponse: {},
      ...(!this.isMsgSummaryEmpty && { summary: this.resolvedText })
    };

    await Promise.all(
      this.listOfFiles.map(async (el) => {
        const fileToSend = el[0];
        const data = await this.fileUploadService.uploadFile2(
          fileToSend,
          propertyId
        );
        body.files.push({
          documentTypeId: el.topicId,
          title: el.title,
          fileName: fileToSend.name,
          fileSize: fileToSend.size,
          fileType: fileToSend.type,
          mediaLink: data.Location,
          propertyId
        });
      })
    );
    this.apiService
      .postAPI(conversations, 'v2/message', body)
      .pipe(
        takeUntil(this.subscribers),
        tap(() => {
          this.headerService.moveCurrentTaskToInprogress();
        })
      )
      .subscribe((res) => {
        this.controlPanelService.sendMsgDocumentRequestQA.next(true);
        if (
          body.conversationId ===
          this.conversationService.currentConversation?.getValue()?.id
        ) {
          this.conversationService.messagesSentViaEmail.next(res);
        }
        const Q_A_STEP_0 = 0;
        const Q_A_STEP_1 = 1;

        this.conversationService
          .completedTrudiResponseStep(
            this.conversationService.currentConversation.getValue().id,
            Q_A_STEP_0
          )
          .pipe(
            switchMap(() =>
              this.conversationService.completedTrudiResponseStep(
                this.conversationService.currentConversation.getValue().id,
                Q_A_STEP_1
              )
            )
          )
          .subscribe();
        this.markResolvedConversation(
          body.isResolveConversation,
          body.textMessage.userId
        );
        this.sharedService.isResetListFile.next(true);
        this.closeModalAndReset(status);
        this.loadingService.stopLoading();
      });
  }

  skipContact(body: any) {
    if (!body || !body.message?.length) return;
    if (this.forwardAction !== this.forwardButtonAction.askSupplierQuote)
      return;
    body.message.forEach((item: any) => {
      if (!item?.options?.contacts) return;
      item.options.contacts = [];
    });
  }

  closeModalAndReset(showSuccessModal = false) {
    this.isOpenSuccessModal.next(showSuccessModal);
    this.isCloseModal.next(true);
    this.resetField();
  }

  async updateCompleteOfListButtonInTrudiResponse(
    trudiResponseConversation: UserConversation,
    btnIndex: number
  ) {
    // trudiResponseConversation.trudiResponse.data[0].body.button[btnIndex] = {
    // 	...trudiResponseConversation.trudiResponse.data[0].body.button[btnIndex],
    // 	isCompleted: true,
    //   status: TrudiButtonEnum.COMPLETED
    // };
    const response = await lastValueFrom(
      this.conversationService.completedButtonStep(
        this.conversationService.trudiResponseConversation.getValue().id,
        this.forwardAction,
        this.trudiStep
      )
    );
    if (!response?.data) {
      this.toastService.error(`Error`);
      return;
    }
    trudiResponseConversation.trudiResponse.data = response.data;
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
      openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.appChat &&
      forwardAction === ForwardButtonAction.sendQuoteLandlord
    ) {
      return messageContent.replace(
        /{receiver name}/g,
        this.sharedService.displayName(user.firstName, user.lastName)
      );
    }
    return '';
  }

  getCategoryByTopic(topicId) {
    return this.fulllistofConversationCategory.find(
      (el) => el.topicId === topicId
    );
  }

  loadFile(document: any) {
    this.propertyService.openFile(document);
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

  reopenTaskIfCompleted() {
    if (this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.userIndex) {
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
  }

  getThumbnailMP4(link: string) {
    return link + '#t=5';
  }

  getFileType(type: string) {
    const fileType = type;
    if (fileType.includes('/pdf')) {
      return 'pdf';
    }
    if (fileType.includes('/mp4')) {
      return 'mp4';
    }
    if (fileType.includes('image/')) {
      return 'image';
    }
    if (fileType.includes('video/')) {
      return 'video';
    }
    return 'other';
  }

  /*get getTopic() {
    return this.fgText.get('topic').value;
  }*/

  get getTitle() {
    return this.fgText.get('titleText').value;
  }

  /*get getContent() {
    return this.fgText.get('contentText').value;
  }*/

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
    this.selectedTask = null;
    this.openFrom === SEND_MESSAGE_POPUP_OPEN_FROM.userIndex &&
      this.resetSearchInput();
  }

  resetSearchInput() {
    const searchInput = this.elementRef.nativeElement.querySelector(
      '.sender#task-select ng-select input'
    );
    searchInput.value = '';
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

  ngOnDestroy(): void {
    this.subscribers.next();
    this.subscribers.complete();
    clearTimeout(this.scrollTimeout);
  }

  getTextTicket(text: string) {
    this.textEditTicket = text;
    this.isItemTaskTicket.options.text = text;
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
    this.conversationService.updateConversationStatus$.next({
      status: EMessageType.solved,
      option: null,
      user,
      addMessageToHistory: false
    });
  }
}
