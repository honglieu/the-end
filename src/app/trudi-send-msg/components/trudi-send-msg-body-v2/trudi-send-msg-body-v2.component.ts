import {
  AfterViewInit,
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
import { NgSelectComponent } from '@ng-select/ng-select';
import {
  Subject,
  distinctUntilChanged,
  finalize,
  firstValueFrom,
  takeUntil
} from 'rxjs';
import { EStepAction } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ChatGptService, EBoxMessageType } from '@services/chatGpt.service';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { TIME_FORMAT } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { HandleInitAISummaryContent } from '@shared/feature/function.feature';
import { IFile } from '@shared/types/file.interface';
import {
  FormFile,
  FormFileInfo,
  ReiFormData
} from '@shared/types/rei-form.interface';
import { ITaskDetail } from '@shared/types/task.interface';
import { TrudiResponseVariable } from '@shared/types/trudi.interface';
import { CurrentUser, IMailBox } from '@shared/types/user.interface';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import {
  TrudiSendMsgFormService,
  validateContactCard
} from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import {
  IGetListContactTypeResponse,
  TrudiSendMsgUserService
} from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import {
  getUniqReceiverData,
  handleDisabledDynamicParamsByProperty,
  handleDisabledDynamicParamsByReceiver,
  isCheckedReceiversInList,
  replaceVariables
} from '@/app/trudi-send-msg/utils/helper-functions';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import {
  EFooterButtonType,
  IFromUserMailBox,
  ISelectedReceivers,
  ISendMsgConfigs,
  ISendMsgType,
  UserConversationOption
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { sendOptionType } from '@/app/trudi-send-msg/components/trudi-send-msg-header/components/trudi-send-option-menu/trudi-send-option-menu.component';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { IListDynamic } from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import { ICommunicationStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { ESendMsgAction } from '@/app/routine-inspection/utils/routineType';
import {
  ECreateMessageFrom,
  ECreateMessageType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ToastrService } from 'ngx-toastr';
import { ICompany } from '@shared/types/company.interface';
import { CompanyService } from '@services/company.service';
import { EMailBoxStatus, EMailBoxType } from '@shared/enum';
import { TrudiSendMsgHelperFunctionsService } from '@/app/trudi-send-msg/services/trudi-send-msg-helper-functions.service';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { HelperService } from '@services/helper.service';
import {
  SendOption,
  TinyEditorComponent
} from '@shared/components/tiny-editor/tiny-editor.component';
import dayjs from 'dayjs';
import { TrudiSelectReceiverContainerComponent } from '@/app/trudi-send-msg/components/trudi-select-receiver-container/trudi-select-receiver-container.component';

@Component({
  selector: 'trudi-send-msg-body-v2',
  templateUrl: './trudi-send-msg-body-v2.component.html',
  styleUrls: ['./trudi-send-msg-body-v2.component.scss'],
  providers: [TrudiSendMsgUserService]
})
export class TrudiSendMsgBodyV2Component
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  readonly TIME_FORMAT = TIME_FORMAT;
  readonly ISendMsgType = ISendMsgType;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  readonly ECreateMessageFrom = ECreateMessageFrom;
  constructor(
    private trudiService: TrudiService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    public trudiSendMsgService: TrudiSendMsgService,
    private conversationService: ConversationService,
    private taskService: TaskService,
    private agencyService: AgencyService,
    private elementRef: ElementRef,
    public fileService: FilesService,
    public companyEmailSignatureService: CompanyEmailSignatureService,
    public trudiSendMsgUserService: TrudiSendMsgUserService,
    private chatGptService: ChatGptService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private agencyDateFormatService: AgencyDateFormatService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private uploadFromCRMService: UploadFromCRMService,
    public cdr: ChangeDetectorRef,
    private toastrService: ToastrService,
    private companyService: CompanyService,
    private trudiSendMsgHelperFunctionsService: TrudiSendMsgHelperFunctionsService,
    private helper: HelperService,
    private trudiSaveDraftService: TrudiSaveDraftService
  ) {}

  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() rawMsg: string = '';
  @Input() openFrom;
  @Input() listOfFiles: IFile[] = [];
  @Input() listContactCard: ISelectedReceivers[] = [];
  @Input() prefillVariables: Record<string, string> | TrudiResponseVariable =
    {};
  @Input() reiformData: ReiFormData;
  @Input() listDynamicParams: IListDynamic[] = [];
  @Input() isShowEmbedDynamicFieldBtn: boolean = false;
  @Input() selectedTaskIds: string[] = [];
  @Input() prefillData: ICommunicationStep;
  @Input() listUser: ISelectedReceivers[] = [];
  @Input() isDisableSendBtn: boolean = false;
  @Input() currentUser: CurrentUser;
  @Input() currentMailBoxId: string;
  @Input() listSenderMailBox: IFromUserMailBox[];
  @Input() defaultSelectedSendOption: number = 2;
  @Input() allowInsertContactCardToContent: boolean = false;
  @Output() template = new EventEmitter<string>();
  @Output() typeSendMsg = new EventEmitter();
  @Output() onBack = new EventEmitter();
  @Output() submitToSendMsg = new EventEmitter();
  public receiversData = {};
  public isOpenFromCalendar: boolean = false;
  public isShowSendAction: boolean = false;
  public isShowBackBtn: boolean = false;
  public currentReiformData;
  public currentCompany: ICompany;
  public currentProperty = null;
  public listContactTypes: IGetListContactTypeResponse[] = [];
  public mailBoxIdFromCalender: string;
  public currentMailBox: IMailBox;
  public isSubmitted: boolean = false;
  public readonly EMailBoxStatus = EMailBoxStatus;
  public isAutoPrefillDocument: boolean = false;
  public createMessageType = ECreateMessageType;
  private scrollTimeOut: NodeJS.Timeout = null;
  public isAttachFilesCollapsed: boolean = false;
  readonly SendOption = SendOption;
  @Input() scheduleDate: string = dayjs(new Date()).format(
    this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
  );
  @Input() defaultValue: string;
  @Input() additionalInfo: string;
  @Input() isDateUnknown: boolean = false;
  @Input() dueDateTooltipText: string;
  @Input() selectedEvent: string;
  @Input() action: string;
  @ViewChild('ngSelectSender', { static: true })
  ngSelectSender: NgSelectComponent;

  @ViewChild('selectReceiver')
  selectReceiver: TrudiSelectReceiverContainerComponent;

  @ViewChild('editorContainer')
  editorContainer: TinyEditorComponent;

  listConversation: UserConversationOption[];
  @Output() dateTime = new EventEmitter<string>();
  @Output() selectTimeSchedule = new EventEmitter<string>();
  public errorMsg: boolean = false;
  public timeSecond: number;
  public date: number;

  // form getter
  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }

  get selectedSender(): AbstractControl {
    return this.sendMsgForm?.get('selectedSender');
  }

  get selectedReceivers(): AbstractControl {
    return this.sendMsgForm?.get('selectedReceivers');
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

  get msgContent(): AbstractControl {
    return this.sendMsgForm?.get('msgContent');
  }

  get emailSignature(): AbstractControl {
    return this.sendMsgForm?.get('emailSignature');
  }

  get listOfFilesControl(): AbstractControl {
    return this.sendMsgForm?.get('listOfFiles');
  }

  get listOfFilesReiFormSignRemote() {
    if (this.reiformData) return [this.reiformData];
    return this.trudiSendMsgService.getListFilesReiFormSignRemote();
  }

  get attachMediaFiles(): AbstractControl {
    return this.sendMsgForm?.get('attachMediaFiles');
  }

  get selectedContactCardControl() {
    return this.sendMsgForm?.get('selectedContactCard');
  }

  get property(): AbstractControl {
    return this.sendMsgForm?.get('property');
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }

  get listReceiver(): ISelectedReceivers[] {
    return this.trudiSendMsgService.getListReceiver();
  }

  get sendOption(): AbstractControl {
    return this.sendMsgForm?.get('sendOption');
  }

  private subscriber = new Subject<void>();
  prefillMsg: string = '';
  tenancyId: string = '';
  public isRmEnvironment: boolean = false;
  public isHasContactCard: boolean = true;
  ngOnInit(): void {
    this.isOpenFromCalendar =
      this.openFrom === EUserPropertyType.CALENDAR_EVENT_BULK_CREATE_TASKS;
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.subscriber))
      .subscribe((res) => {
        if (!res) return;
        this.currentCompany = res;
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(res);
      });
    this.subscribeTaskDetailData();
    this.initPrefillMsg();
    this.onChangeFormGroup();
    this.trudiDynamicParameterService.triggerPrefillParameter
      .pipe(takeUntil(this.subscriber))
      .subscribe((_data) => {
        setTimeout(() => {
          this.prefillDynamicParameters(_data);
        }, 0);
      });
    this.prefillDynamicParameters();
    this.subscribeControls();
    if (
      this.helper.isInboxDetail &&
      !this.configs.otherConfigs?.filterSenderForReply &&
      !this.configs.otherConfigs?.filterSenderForReplyInTask
    ) {
      this.handlePrefillCompanyMailbox();
    }
  }

  handlePrefillCompanyMailbox() {
    const companyMailbox = this.listSenderMailBox.find((value) => {
      return value.type === EMailBoxType.COMPANY;
    });
    this.selectedSender.setValue(companyMailbox);
  }

  ngAfterViewInit() {
    this.handleAutoGenerateMessageBody();
    if (!this.configs.body.replyToMessageId) {
      setTimeout(() => {
        this.selectReceiver.onClickToField();
      }, 0);
    }
  }

  // Handle auto generate message body when reply a message
  async handleAutoGenerateMessageBody() {
    const autoGenerateMessageData = this.configs?.body?.autoGenerateMessage;
    if (
      !autoGenerateMessageData ||
      !(await firstValueFrom(ChatGptService.enableSuggestReplySetting))
    )
      return;

    this.chatGptService.onLoading.next({
      type: EBoxMessageType.POPUP,
      status: true
    });
    this.chatGptService.cancelChatGpt.next(false);
    const { currentUserId, toneOfVoice } =
      this.chatGptService.generateBody.value;
    const body = {
      propertyId:
        this.conversationService.currentConversation.getValue()?.propertyId ||
        null,
      conversationId:
        this.conversationService.currentConversation.getValue()?.id ||
        this.configs.body.replyConversationId ||
        this.configs.body.replyToMessageAI ||
        null,
      currentUserId,
      receiveUserIds: autoGenerateMessageData.receiverIds,
      toneOfVoice,
      description: autoGenerateMessageData.description,
      taskData: this.trudiSendMsgService.configs.value?.body?.taskData || {},
      messageId: this.configs.body.replyToMessageId,
      isFollowUpReply: autoGenerateMessageData.isFollowUpReply,
      sessionId: this.configs.body.sessionId
    };
    this.chatGptService.onGenerate.next(null);
    this.chatGptService
      .generateSendMsg(body)
      .pipe(
        finalize(() => {
          this.chatGptService.onLoading.next({
            type: EBoxMessageType.POPUP,
            status: false
          });
        }),
        takeUntil(this.subscriber)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            const { content, files, contacts } = res || {};
            if (this.isAutoPrefillDocument) {
              this.selectedContactCardControl.setValue(contacts);
              this.handlePrefillFileToMessage(files);
            }
            const lines = this.chatGptService.processContentAI(content);
            const paragraphs = lines.map(
              (line: string) => `<p>${line || '&nbsp;'}</p>`
            );
            const outputHTML = paragraphs.join('');
            const initAISummaryContent = HandleInitAISummaryContent(outputHTML);
            this.chatGptService.replyContent.next(initAISummaryContent);
            this.chatGptService.replyFrom.next(EBoxMessageType.POPUP);
          }
          const senderControl =
            this.trudiSendMsgFormService.sendMsgForm.get('selectedSender');
          const currentSender = senderControl.value as IFromUserMailBox;
          const { mailBoxId } = currentSender;
          const newSender =
            this.trudiSendMsgService.listSenderMailBoxBS.value.find(
              (senderMailBox) =>
                senderMailBox.id === currentUserId &&
                senderMailBox.mailBoxId === mailBoxId
            );
          if (newSender) {
            senderControl.setValue(newSender);
          }
        },
        error: () => {
          this.toastrService.error('Unable to create message');
        },
        complete: () => {}
      });
  }

  handlePrefillFileToMessage(listOfFiles) {
    const listFilePrefill =
      this.trudiSendMsgHelperFunctionsService.handlePrefillFileUploaded(
        listOfFiles
      );
    this.listOfFiles = listFilePrefill;
    this.listOfFilesControl &&
      this.listOfFilesControl.setValue(listFilePrefill || []);
  }

  subscribeControls() {
    this.isHasContactCard = !!this.listContactCard?.length;
    this.sendMsgForm
      .get('selectedSender')
      .valueChanges.pipe(takeUntil(this.subscriber))
      .subscribe((value) => {
        if (value) {
          this.handleChangeSelectedSender();
        }
      });

    this.selectedReceivers.valueChanges
      .pipe(takeUntil(this.subscriber))
      .subscribe((users) => {
        const optionType = users?.some((user) => user.isAppUser)
          ? sendOptionType.APP
          : sendOptionType.EMAIL;
        this.trudiSendMsgFormService.triggerUpdateSendOption.next({
          type: optionType,
          defaultValue: this.configs.body.defaultSendOption
        });
        this.onDisabledDynamicParamsByReceiver();
        this.onDisabledDynamicParamsByProperty(); // update in case send bulk messages
      });

    this.ccReceivers.valueChanges
      .pipe(takeUntil(this.subscriber))
      .subscribe((users) => {
        const optionType = users?.some((user) => user.isAppUser)
          ? sendOptionType.APP
          : sendOptionType.EMAIL;
        this.trudiSendMsgFormService.triggerUpdateSendOption.next({
          type: optionType,
          defaultValue: this.configs.body.defaultSendOption
        });
        this.onDisabledDynamicParamsByReceiver();
      });

    this.bccReceivers.valueChanges
      .pipe(takeUntil(this.subscriber))
      .subscribe((users) => {
        const optionType = users?.some((user) => user.isAppUser)
          ? sendOptionType.APP
          : sendOptionType.EMAIL;
        this.trudiSendMsgFormService.triggerUpdateSendOption.next({
          type: optionType,
          defaultValue: this.configs.body.defaultSendOption
        });
        this.onDisabledDynamicParamsByReceiver();
      });

    this.sendOption.valueChanges
      .pipe(takeUntil(this.subscriber))
      .subscribe((option) => {
        let hasEmailSignature = option === sendOptionType.EMAIL;
        if (!hasEmailSignature) {
          hasEmailSignature = this.selectedReceivers.value?.some(
            (item) => !item.isAppUser
          );
        }
        this.companyEmailSignatureService.hasSignature.next(hasEmailSignature);
        this.companyEmailSignatureService.selectedButton.next(
          hasEmailSignature
        );
      });

    this.property.valueChanges
      .pipe(takeUntil(this.subscriber))
      .subscribe(() => {
        this.onDisabledDynamicParamsByProperty();
      });
    this.selectedContactCardControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.subscriber))
      .subscribe((value) => {
        this.isHasContactCard = !!value?.length;
        this.getPositionOfAttachData();
        const element = document.getElementById('attach-contact-card');
        this.scrollToElement(element);
      });

    this.listOfFilesControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.subscriber))
      .subscribe(() => {
        this.getPositionOfAttachData();
        const element = document.getElementById('attach-file');
        this.scrollToElement(element);
      });

    this.attachMediaFiles.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.subscriber))
      .subscribe(() => {
        this.getPositionOfAttachData();
        const element = document.getElementById('attach-file');
        this.scrollToElement(element);
      });
  }

  getPositionOfAttachData() {
    let tinyEditorBody = document.querySelector(
      '.trudi-send-msg-body .editor-container'
    ) as HTMLElement;

    if (tinyEditorBody) {
      tinyEditorBody.style.setProperty(
        'min-height',
        `${
          this.listOfFiles?.values || this.listContactCard?.values ? 310 : 500
        }px`,
        'important'
      );
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

  onDisabledDynamicParamsByProperty() {
    if (!this.configs.body.tinyEditor.isShowDynamicFieldFunction) return;

    switch (this.configs.otherConfigs.createMessageFrom) {
      case ECreateMessageFrom.SCRATCH:
      case ECreateMessageFrom.TASK_HEADER:
        this.listDynamicParams = handleDisabledDynamicParamsByProperty(
          this.listDynamicParams,
          this.property?.value,
          this.currentCompany?.agencies
        );
        break;
      case ECreateMessageFrom.MULTI_MESSAGES:
        this.listDynamicParams = handleDisabledDynamicParamsByProperty(
          this.listDynamicParams,
          this.selectedReceivers.value.some(
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

  onDisabledDynamicParamsByReceiver() {
    if (!this.configs.body.tinyEditor.isShowDynamicFieldFunction) return;

    let receiverData = this.getReceiverData() ?? [];
    this.listDynamicParams = handleDisabledDynamicParamsByReceiver(
      this.listDynamicParams,
      receiverData,
      this.configs.otherConfigs.createMessageFrom
    );
  }

  handleTriggerTrackControl() {
    this.trudiSaveDraftService.setTrackControlChange('sendMsgForm', true);
  }

  handleChangeSelectedSender() {
    this.trudiDynamicParameterService.setDynamicParamaterPm(
      this.selectedSender?.value
    );
    if (this.listOfFiles) {
      const fileNames = this.listOfFiles
        .map((item) => (item['0'] || item)?.name)
        .join(', ');
      const senderNames = this.getSenderName(
        this.listOfFiles,
        this.selectedSender?.value?.name
      ).join('; ');
      this.trudiDynamicParameterService.setDynamicParametersConversationFiles({
        file_name: String(fileNames) ?? '',
        file_sender_name: senderNames ?? ''
      });
    }
  }

  prefillDynamicParameters(isChange: boolean = false) {
    if (EStepAction[this.configs?.trudiButton?.action?.toLocaleUpperCase()]) {
      this.handleChangeSelectedSender();
      let newPrefillMsg = `${this.trudiDynamicParameterService.prefillDynamicParameters(
        this.configs?.body?.receiver?.prefillSelectedTypeItem
      )} `;
      if (newPrefillMsg === this.prefillMsg && isChange) {
        this.prefillMsg = newPrefillMsg + ' ';
      } else {
        this.prefillMsg = newPrefillMsg;
      }
      if (this.prefillMsg) {
        this.msgContent.setValue(this.prefillMsg);
        this.handleChangeOriginContent(this.prefillMsg);
        this.template.emit(this.prefillMsg);
      }
    }
  }

  getSenderName(files, senderName) {
    const userId = localStorage.getItem('userId');
    const formattedFiles = (files || []).map((file) => file['0'] || file);
    const listFileModified = formattedFiles
      .filter((file) => file.user && file.user.id !== userId)
      .map((file) => {
        file['senderName'] = [file.user?.firstName, file.user?.lastName]
          .filter(Boolean)
          .join(' ');
        return file.senderName;
      });
    return [...new Set(listFileModified)];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reiformData'] && changes['reiformData']?.currentValue) {
      this.mapReiformData(changes);
    }
    if (changes['listUser']?.currentValue) {
      this.trudiSendMsgService.setListReceiver([
        ...this.trudiSendMsgService.getListReceiver(),
        ...this.listUser
      ]);
    }
    if (changes['configs']?.currentValue) {
      this.isShowSendAction =
        this.configs.footer.buttons.nextButtonType !== EFooterButtonType.NORMAL;
      this.isShowBackBtn = this.configs.footer.buttons.showBackBtn;
      this.companyEmailSignatureService.selectedButton.next(
        this.configs.body.hasEmailSignature
      ); // check focus Email Signature. Default True

      if (
        this.configs.otherConfigs.createMessageFrom ===
        ECreateMessageFrom.SCRATCH
      ) {
        this.onDisabledDynamicParamsByProperty();
      }

      this.isAutoPrefillDocument =
        !!this.configs?.body?.autoGenerateMessage &&
        this.configs?.otherConfigs?.isAutoPrefillDocument;
    }
    if (
      changes['rawMsg']?.currentValue &&
      !this.configs.body.applyAIGenerated
    ) {
      this.initPrefillMsg();
    }

    if (changes['listOfFiles']?.currentValue) {
      this.handlePrefillFileToMessage(this.listOfFiles);
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

  mapReiformData(changes: SimpleChanges) {
    this.reiformData = { ...changes['reiformData']?.currentValue };
    if (Object.keys(this.reiformData).length) {
      this.reiformData.formDetail.formFiles =
        this.reiformData.formDetail.formFiles.map((file) => ({
          ...file,
          fileIcon: this.fileService.getFileIcon(file.filename),
          shortName: file.filename.split('.')[0]
        })) as FormFile[];
      this.reiformData.formFileInfo = {
        ...this.reiformData.formFileInfo,
        fileIcon: this.fileService.getFileIcon(
          this.reiformData?.formFileInfo.fileName
        ),
        shortName: this.reiformData.formFileInfo.fileName.split('.')[0]
      } as FormFileInfo;
    }
  }

  initPrefillMsg() {
    const photos = this.configs?.body?.prefillPhotoFiles;
    if (photos?.length) {
      this.attachMediaFiles && this.attachMediaFiles?.setValue(photos);
    }
    this.updatePrefillVariables();
  }

  handleValueChange(value: string) {
    this.msgContent.setValue(value);
    if (this.trudiSendMsgFormService.needValidateContactCard) {
      this.checkHasContactCard();
    }
  }

  handleChangeOriginContent(value: string) {
    this.trudiSendMsgFormService.setOriginMsgContent(value);
    this.msgContent.updateValueAndValidity();
  }

  subscribeTaskDetailData() {
    this.trudiService.getTrudiResponse
      .pipe(takeUntil(this.subscriber))
      .subscribe((res) => {
        if (res) {
          this.updatePrefillVariables({
            ...res.data?.[0]?.body?.variable,
            '{amount}': this.prefillVariables?.['{amount}'] ?? ''
          });
          const detailData = res.data && res.data[0]?.taskDetail;
          if ((detailData as ITaskDetail)?.variable) {
            this.updatePrefillVariables({
              ...(detailData as ITaskDetail).variable,
              '{amount}': this.prefillVariables?.['{amount}'] ?? ''
            });
          }
        }
      });
  }

  onDateTimeSelected(dateTime: string) {
    this.selectTimeSchedule.emit(dateTime);
    this.configs.body.timeSchedule = dateTime;
  }

  dropFile(event) {
    if (this.configs.body.tinyEditor.attachBtn.attachOptions.disabledUpload)
      return;
    this.listOfFilesControl.setValue([
      ...this.listOfFilesControl.value,
      ...[event]?.flatMap((item) => item)
    ]);
  }

  editorAddFileComputer() {
    const button = this.elementRef.nativeElement.querySelector(
      '#trudi-send-msg-upload-btn'
    );
    button?.click();
  }

  editorAddContactCard() {
    this.trudiSendMsgService.setPopupState({
      sendMessage: false
    });
    this.trudiAddContactCardService.setPopupState({
      addContactCard: true
    });
  }

  editorAddFileFromCrm() {
    this.trudiSendMsgService.setPopupState({
      sendMessage: false
    });
    this.uploadFromCRMService.setPopupState({
      uploadFileFromCRM: true
    });
  }

  addReiForm() {
    this.trudiSendMsgService.setPopupState({
      addReiForm: true,
      selectDocument: true,
      sendMessage: false
    });
  }

  updatePrefillVariables(
    updatedVariables?: Record<string, string> | TrudiResponseVariable
  ) {
    const taskDetailData = this.taskService.currentTask$?.getValue()
      ?.trudiResponse?.data?.[0]?.taskDetail as ITaskDetail;

    const pmVariables = {
      '{Role}': this.selectedSender?.value?.title,
      '{role}': this.selectedSender?.value?.title,
      '{Name}': this.selectedSender?.value?.name,
      '{name}': this.selectedSender?.value?.name,
      '{property manager name}': this.selectedSender?.value?.name ?? ''
    };
    const defaultVariables = {
      '{maintenance_object}': taskDetailData?.maintenanceObject ?? '',
      '{maintenance_summary}': taskDetailData?.description ?? '',
      '{expenditure_limit}': this.prefillVariables?.['{expenditure_limit}']
        ? '$' + this.prefillVariables?.['{expenditure_limit}']
        : '',
      '{maintenance expenditure limit}': this.prefillVariables?.[
        '{maintenance expenditure limit}'
      ]
        ? '$' + this.prefillVariables?.['{maintenance expenditure limit}']
        : '',
      '{amount}': this.prefillVariables?.['{amount}'] ?? '',
      '{maintenance issue}':
        this.prefillVariables?.['{maintenance issue}'] ?? '',
      '{property address}':
        this.taskService.currentTask$.value?.property?.streetline ?? '',
      '{Agency}': this.currentCompany?.name ?? '',
      '{agency}': this.currentCompany?.name ?? '',
      '{Agency Name}': this.currentCompany?.name ?? '',
      '@petType': taskDetailData?.petType?.join(', ') || '',
      '@petInfomation': taskDetailData?.description || '',
      '{content}': ''
    };
    defaultVariables['{expenditure_limit}'] = defaultVariables[
      '{expenditure_limit}'
    ]?.replace(/\$+/, '$');
    defaultVariables['{maintenance expenditure limit}'] = defaultVariables[
      '{maintenance expenditure limit}'
    ]?.replace(/\$+/, '$');
    this.prefillVariables = {
      ...this.prefillVariables,
      ...pmVariables,
      ...defaultVariables,
      ...updatedVariables
    }; // updatedVariables will overwrite the key and return the newest value
    if (
      !this.configs.body.applyAIGenerated &&
      (!EStepAction[this.configs?.trudiButton?.action?.toLocaleUpperCase()] ||
        this.configs?.body?.receiver?.prefillSelectedTypeItem)
    ) {
      this.prefillMsg =
        replaceVariables(this.prefillVariables, this.rawMsg) + ' ';
      const varibaleTemplate = this.excludeFieldsFromKeyObject(
        this.prefillVariables,
        pmVariables
      );
      this.template.emit(replaceVariables(varibaleTemplate, this.rawMsg));
    }
  }

  checkExistConversation(
    listConversation: UserConversationOption[],
    receiver: ISelectedReceivers
  ) {
    const inputReceiver = this.configs.body.prefillReceiversList.find((ir) =>
      isCheckedReceiversInList(receiver, ir, 'id')
    );
    const conversation = listConversation.find((c) =>
      isCheckedReceiversInList(receiver, c, 'userId')
    );
    return { inputReceiver, conversation };
  }

  private onChangeFormGroup() {
    this.sendMsgForm.valueChanges.subscribe((_value) => {
      this.updatePrefillVariables();
    });
  }

  onClearContact(_contact: ISelectedReceivers, indexContact: number) {
    if (this.selectedContactCardControl.value.length > 0) {
      const selectedContactCard = this.selectedContactCardControl.value.filter(
        (_it, index) => index !== indexContact
      );
      this.sendMsgForm.get('selectedContactCard').setValue(selectedContactCard);
      this.trudiSendMsgFormService.setSelectedContactCard(selectedContactCard);
      this.trudiSaveDraftService.setTrackControlChange('contact', true);
    }
  }

  ngOnDestroy() {
    this.trudiSendMsgService.setListReceiver([]);
    this.chatGptService.onLoading.next({
      type: EBoxMessageType.POPUP,
      status: false
    });
    this.chatGptService.onGenerated.next({
      type: EBoxMessageType.POPUP,
      status: false
    });
    this.subscriber.next();
    this.subscriber.complete();
    clearTimeout(this.scrollTimeOut);
  }

  isObject(obj) {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
  }

  excludeFieldsFromKeyObject(object, objectWithKeyExclude) {
    let objectClone = { ...object };
    if (!this.isObject(object) || !this.isObject(objectWithKeyExclude))
      return {};
    const keysExclude = Object.keys(objectWithKeyExclude);
    for (let keyExclude of keysExclude) {
      delete objectClone[keyExclude];
    }
    return objectClone;
  }

  isFormScheduleMsg() {
    return (
      this.configs.footer.buttons.sendType ===
      ISendMsgType.EVENT_EDIT_SCHEDULED_MSG
    );
  }

  handleClickOutsideSender() {
    if (this.ngSelectSender) {
      this.ngSelectSender?.close();
    }
  }

  handleChangeSendOption(data: ESendMsgAction) {
    this.configs.body.typeSendMsg = data;
    this.trudiSaveDraftService.setTrackControlChange('sendOption', true);
    this.typeSendMsg.emit({
      action: data
    });
  }

  backFormSendMsg() {
    this.onBack.emit();
  }

  handleChangeFormValue(key) {
    this.trudiSaveDraftService.setTrackControlChange(key, true);
  }
  checkHasContactCard() {
    try {
      if (this.allowInsertContactCardToContent) {
        this.isHasContactCard = validateContactCard(this.msgContent.value);
        if (this.isHasContactCard) {
          this.selectedContactCardControl.clearValidators();
          this.selectedContactCardControl.updateValueAndValidity();
        } else {
          if (this.configs.body.contactCard.required) {
            this.selectedContactCardControl.setErrors({
              requiredContactCard: 'Please add contact card'
            });
          } else {
            this.selectedContactCardControl.setErrors(null);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing DOM in checkHasContactCard:', error);
    }
  }
  submitToSendMessage(data) {
    this.isSubmitted = true;
    this.checkHasContactCard();
    if (this.sendMsgForm.invalid) {
      this.trudiSendMsgFormService.setNeedValidateContactCard(true);
      return;
    }
    if (!this.msgContent.value) {
      this.msgContent.setValue('<p></p>');
    }
    this.submitToSendMsg.emit({
      action: data.typeBtn
    });
    this.trudiSendMsgFormService.setNeedValidateContactCard(false);
  }

  handleClickContentOutside() {
    this.isAttachFilesCollapsed = true;
  }

  scrollToElement(element: Element) {
    if (element) {
      clearTimeout(this.scrollTimeOut);
      this.scrollTimeOut = setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }
}
