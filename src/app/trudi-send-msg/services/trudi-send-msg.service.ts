import { UserTypeInPTPipe } from './../../shared/pipes/user-type-in-pt.pipe';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, filter, tap } from 'rxjs';
import { ObservableState } from '@/app/dashboard/modules/agency-settings/components/policies/utils/models';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { ApiService } from '@services/api.service';
import { CompanyService } from '@services/company.service';
import { MIME_TYPE_MAPPING } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { FileUploadService } from '@services/fileUpload.service';
import { FilesService } from '@services/files.service';
import { HeaderService } from '@services/header.service';
import { PropertiesService } from '@services/properties.service';
import { ReiFormService } from '@services/rei-form.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import { SelectDocumentType } from '@shared/components/select-document/select-document.component';
import { ESendMessageType } from '@shared/enum/send-message-type.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { ICompany } from '@shared/types/company.interface';
import { IParticipant } from '@shared/types/conversation.interface';
import { IFile } from '@shared/types/file.interface';
import { ReiFormData } from '@shared/types/rei-form.interface';
import { PhotoType } from '@shared/types/task.interface';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { TargetFromFormMessage } from '@shared/types/user.interface';
import { RMWidgetDataField } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { conversations } from 'src/environments/environment';
import { EFallback } from '@/app/trudi-send-msg/utils/dynamic-parameter';
import {
  concatQuoteAndMessage,
  convertUserRole,
  extractQuoteAndMessage,
  filterMediaFilesChecked,
  getCalendarEventData,
  getServiceDataFromConfig,
  removePTagTemplate,
  replaceDynamicEmailMessageTitle,
  replaceMessageTitle
} from '@/app/trudi-send-msg/utils/helper-functions';
import { emptyUUID } from '@/app/trudi-send-msg/utils/trudi-send-msg.constant';
import {
  ECreateMessageFrom,
  EReceiverType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  EMessageConversationType,
  IAutomateSimilarRepliesPayload,
  IAutomateSimilarRepliesResponse,
  IBodyFile,
  IBulkEventMsgBody,
  IBulkMsg,
  IBulkMsgBody,
  IContactInfo,
  IFromUserMailBox,
  IProcessedReceiver,
  IReceiver,
  ISelectedReceivers,
  ISendManyEmailMsg,
  ISendManyMsgPayload,
  ISendMsgBodyMap,
  ISendMsgConfigs,
  ISendMsgPayload,
  ISendMsgResponseV2,
  ISendMsgType,
  ITextMessagesV3,
  ITrudiSendMsgFormValue,
  IV3MsgBody
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiDynamicParameterService } from './trudi-dynamic-paramater.service';
import { TrudiSaveDraftService } from './trudi-save-draft.service';
import { htmlContactCard } from '@/app/trudi-send-msg/utils/build-html-contact-card';
import uuid4 from 'uuid4';
import {
  getTextFromDynamicRecipientVariable,
  replaceSingleQuotes
} from '@/app/trudi-send-msg/utils/dynamic-parameter-helper-functions';
import {
  ECRMSystem,
  ECountryName
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { HelperService } from '@services/helper.service';
import { ETypeSend } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskType } from '@/app/shared/enum/task.enum';
import { TrudiButtonEnumStatus } from '@/app/shared/enum/trudiButton.enum';
import { EConversationType } from '@/app/shared/enum/conversationType.enum';

const defaultCheckboxList = [
  {
    id: SelectDocumentType.OPENEXIST,
    label: 'Open existing form',
    checked: true
  },
  {
    id: SelectDocumentType.CREATENEW,
    label: 'Create new form',
    checked: false
  }
];

const defaultSelectedOption = defaultCheckboxList.find(
  (item) => item.id === SelectDocumentType.OPENEXIST
);

@Injectable({
  providedIn: null
})
export class TrudiSendMsgService {
  // handle request send msg, format body
  public configs = new ObservableState<ISendMsgConfigs>(null);
  private popupState = {
    sendMessage: false,
    closeConfirm: false,
    addContactCard: false,
    addContactCardOutside: false,
    selectTimeSchedule: false,
    handleCallback: null,
    addReiForm: false,
    addReiFormOutside: false,
    addReiFormWidget: false,
    selectRecipients: false,
    confirmRecipients: false,
    viewRecipients: false,

    // step REI Form
    selectDocument: false,
    reviewAttachment: false,
    attachDraftForm: false,
    selectPeople: false
  };

  public validTypeRM = [
    EUserPropertyType.TENANT_PROPERTY,
    EUserPropertyType.TENANT_UNIT,
    EUserPropertyType.TENANT_PROSPECT,
    EUserPropertyType.LANDLORD_PROSPECT,
    EUserPropertyType.LANDLORD
  ];
  public isRmEnvironment: boolean = false;
  public isPTEnvironment: boolean = false;

  public checkboxList = JSON.parse(JSON.stringify(defaultCheckboxList));
  public selectedOption = JSON.parse(JSON.stringify(defaultSelectedOption));
  public isPrivate = false;

  private listReceiver$: BehaviorSubject<ISelectedReceivers[]> =
    new BehaviorSubject<ISelectedReceivers[]>([]);
  private listReceiverOutside$: BehaviorSubject<ISelectedReceivers[]> =
    new BehaviorSubject<ISelectedReceivers[]>([]);
  private listFilesReiFormOutside$: BehaviorSubject<ReiFormData[]> =
    new BehaviorSubject<ReiFormData[]>([]);
  private listFilesReiFormSignRemote$: BehaviorSubject<ReiFormData[]> =
    new BehaviorSubject<ReiFormData[]>([]);
  private activeMobileApp: boolean = true;
  public openFromVacateSchedule$ = new BehaviorSubject<boolean>(false);
  public currentMailBoxId: string;
  public listSender$: BehaviorSubject<TargetFromFormMessage[]>;
  public listSenderMailBoxBS: BehaviorSubject<IFromUserMailBox[]> =
    new BehaviorSubject<IFromUserMailBox[]>([]);
  public currentCompany: ICompany;
  public currentProperty$ = new BehaviorSubject<UserPropertyInPeople>(null);
  public dataToPrefillForSendBulk = {};
  private hiddenTextFieldTitleBS = new BehaviorSubject<boolean>(false);
  public hiddenTextFieldTitle$ = this.hiddenTextFieldTitleBS.asObservable();
  private viewRecipientListBS = new BehaviorSubject<ISelectedReceivers[]>(null);
  public viewRecipientList$ = this.viewRecipientListBS.asObservable();
  private showPreviewBS = new BehaviorSubject<boolean>(true);
  public showPreview$ = this.showPreviewBS.asObservable();
  // TODO: refactor
  private triggerStep = new Subject<ISendMsgConfigs>();
  public triggerStep$ = this.triggerStep.asObservable();
  public market: string;

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private conversationService: ConversationService,
    private taskService: TaskService,
    private trudiService: TrudiService,
    private fileUploadService: FileUploadService,
    private propertyService: PropertiesService,
    private agencyService: AgencyService,
    private userService: UserService,
    private eventCalendarService: EventCalendarService,
    private reiFormService: ReiFormService,
    private filesService: FilesService,
    private inboxService: InboxService,
    private trudiDynamicParamService: TrudiDynamicParameterService,
    private inboxToolbarService: InboxToolbarService,
    private companyService: CompanyService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private userTypeInPTPipe: UserTypeInPTPipe,
    private helper: HelperService
  ) {
    this.companyService.getActiveMobileApp().subscribe((status: boolean) => {
      this.activeMobileApp = status;
    });

    this.companyService.getCurrentCompany().subscribe((company) => {
      if (company) {
        this.currentCompany = company;
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        this.isPTEnvironment = this.companyService.isPropertyTreeCRM(company);
      }
    });
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(filter((mailBoxId) => !!mailBoxId))
      .subscribe((mailBoxId) => {
        this.currentMailBoxId = mailBoxId;
      });
    this.market =
      this.agencyService.environment.value === ECRMSystem.RENT_MANAGER
        ? ECountryName.UNITED_STATES
        : ECountryName.AUSTRALIA;
  }

  // getter setter

  getPopupState() {
    return this.popupState;
  }

  setPopupState(state: Partial<typeof this.popupState>) {
    this.popupState = {
      ...this.popupState,
      ...state
    };
  }

  resetCheckBox() {
    this.selectedOption = JSON.parse(JSON.stringify(defaultSelectedOption));
    this.checkboxList = JSON.parse(JSON.stringify(defaultCheckboxList));
    this.isPrivate = false;
  }

  resetPopupStateReiForm() {
    this.popupState = {
      ...this.popupState,
      selectDocument: false,
      reviewAttachment: false,
      attachDraftForm: false,
      selectPeople: false
    };
  }

  getListReceiver(): ISelectedReceivers[] {
    return this.listReceiver$.value;
  }

  getListReceiver$() {
    return this.listReceiver$.asObservable();
  }

  setListReceiver(value: ISelectedReceivers[]) {
    this.listReceiver$.next(value);
  }

  setContactCardList(value: ISelectedReceivers[]) {
    this.listReceiverOutside$.next(value);
  }

  getContactCardList() {
    return this.listReceiverOutside$.value;
  }

  setListFilesReiForm(value: ReiFormData[]) {
    return this.listFilesReiFormOutside$.next([
      ...this.listFilesReiFormOutside$.value,
      ...value
    ]);
  }

  setListFilesReiFormEmpty() {
    return this.listFilesReiFormOutside$.next([]);
  }

  getListFilesReiForm() {
    return this.listFilesReiFormOutside$.value;
  }

  setListFilesReiFormSignRemote(value: ReiFormData[]) {
    return this.listFilesReiFormSignRemote$.next([
      ...this.listFilesReiFormSignRemote$.value,
      ...value
    ]);
  }

  setListFilesReiFormSignRemoteEmptry() {
    return this.listFilesReiFormSignRemote$.next([]);
  }

  getListFilesReiFormSignRemote() {
    return this.listFilesReiFormSignRemote$.value;
  }

  get getCurrentProperty() {
    return this.currentProperty$.value;
  }

  setCurrentProperty(value: UserPropertyInPeople) {
    this.currentProperty$.next(value);
  }

  setHiddenTextFieldTitle(value: boolean) {
    this.hiddenTextFieldTitleBS.next(value);
  }

  triggerStepBulkSend(configs) {
    this.triggerStep.next(configs);
  }

  setViewRecipientList(value: ISelectedReceivers[]) {
    this.viewRecipientListBS.next(value);
  }

  setShowPreview(value: boolean) {
    this.showPreviewBS.next(value);
  }

  sendMessage(
    type: ISendMsgType,
    body: ISendMsgBodyMap[typeof type]
  ): Observable<ISendMsgBodyMap[typeof type]> {
    if (type === ISendMsgType.BULK || type === ISendMsgType.BULK_EVENT) {
      for (const item of (body as IBulkMsgBody).message) {
        item.contentMessage = item.contentMessage
          .replace(/(<p>&nbsp;<\/p>)+$/, '')
          .replace(/(&nbsp; )+/, '');
      }
    } else {
      for (const item of (body as IV3MsgBody).textMessages) {
        item.message = item.message
          .replace(/(<p>&nbsp;<\/p>)+$/, '')
          .replace(/(&nbsp; )+/, '');
        this.handleMessageTurnOnApp(item);
      }
    }
    return this.apiService.postAPI(conversations, type, body).pipe(
      tap(() => {
        if (!(body as ITrudiSendMsgFormValue).isCreateMessageType) {
          this.headerService.moveCurrentTaskToInprogress();
        }
      })
    );
  }

  sendBulkMessageAndV3MessageWithEvent(body) {
    for (const item of body.sendBulk.message) {
      item.contentMessage = item.contentMessage
        .replace(/(<p>&nbsp;<\/p>)+$/, '')
        .replace(/(&nbsp; )+/, '');
    }
    for (const item of body.messageV3.textMessages) {
      item.message = item.message
        .replace(/(<p>&nbsp;<\/p>)+$/, '')
        .replace(/(&nbsp; )+/, '');
      this.handleMessageTurnOnApp(item);
    }

    let payload = { ...body };
    return this.apiService
      .postAPI(conversations, ISendMsgType.BULK_EVENT_AND_V3_EVENT, payload)
      .pipe(
        tap(() => {
          if (!(body.senBulk as ITrudiSendMsgFormValue)?.isCreateMessageType) {
            this.headerService.moveCurrentTaskToInprogress();
          }
        })
      );
  }

  // utils
  async formatFiles(
    listOfFiles: (IFile | PhotoType)[] = [],
    documentType = 'Other'
  ): Promise<IBodyFile[]> {
    const listFileResponse: IBodyFile[] = [];
    if (listOfFiles?.length === 0) return listFileResponse;
    const documentTypeArr = JSON.parse(
      localStorage.getItem('listDocumentType')
    );
    const documentTypeOtherId = documentTypeArr?.find(
      (item) => item.name === documentType
    )?.id;
    const propertyId = this.propertyService.currentPropertyId.value;
    const propertyIds = [];
    await Promise.all(
      listOfFiles.map(async (el) => {
        const fileToSend = el[0] ?? el;
        if (fileToSend.mediaLink || fileToSend.fileUrl) {
          const fileName = fileToSend.name || fileToSend.fileName;
          listFileResponse.push({
            documentTypeId: fileToSend.documentTypeId || documentTypeOtherId,
            title: fileToSend.name,
            parentId: fileToSend?.parentId || '',
            fileName:
              fileToSend?.extension && !fileName?.includes(fileToSend.extension)
                ? `${fileName}${fileToSend.extension}`
                : fileName,
            fileSize: fileToSend.size || fileToSend.fileSize,
            fileType: this.getFileType(fileToSend),
            mediaLink: fileToSend?.fileUrl || fileToSend.mediaLink,
            propertyId,
            propertyIds,
            localId: el.localId
          });
        } else {
          const { name, size, type, title, topicId } = el as IFile;
          const userPropertyIds = [];
          const fileTypeOfXLSM =
            'application/vnd.ms-excel.sheet.macroEnabled.12';
          const data = await this.fileUploadService.uploadFile2(
            fileToSend,
            propertyId
          );
          // File upload to s3 because it has no mediaLink
          listFileResponse.push({
            documentTypeId: topicId || documentTypeOtherId,
            parentId: fileToSend?.parentId || '',
            title: title || fileToSend.name,
            fileName: fileToSend.name,
            fileSize: fileToSend.size,
            fileType:
              fileToSend.type === fileTypeOfXLSM
                ? fileToSend.type.toLowerCase()
                : fileToSend.type,
            mediaLink: data.Location,
            propertyId,
            propertyIds,
            localId: el.localId
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
    return listFileResponse;
  }

  /**
   * Get MIME type follow
   * @url https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
   * @param file
   * @returns file type
   */
  private getFileType(file) {
    try {
      const parts = file?.name?.split('.');
      const fileExtension = parts[parts.length - 1];
      const mimeType = MIME_TYPE_MAPPING[fileExtension];
      if (mimeType) {
        return mimeType;
      }
    } catch (error) {
      console.error(error);
    }
    return file.fileType?.name || file.fileType;
  }

  getIDsFromOtherService() {
    const currentTask = this.taskService.currentTask$?.value;
    const propertyId = currentTask?.property?.isTemporary
      ? null
      : currentTask?.property?.id;
    const { id, agencyId } = this.taskService.currentTask$.value || {};
    const categoryId =
      this.trudiService.getTrudiResponse.value?.setting?.categoryId;
    const tenancyId = this.userService.tenancyId$.value;
    const propertyType =
      this.conversationService.currentConversation?.getValue()?.propertyType;
    const taskType = this.taskService.currentTask$.getValue()?.taskType;
    const conversationId =
      this.conversationService.currentConversation?.getValue()?.id;
    return {
      propertyId,
      taskId: id,
      categoryId,
      agencyId,
      tenancyId,
      propertyType,
      taskType,
      conversationId
    };
  }

  public handleReplaceReceiverInMess(
    formData,
    receiver,
    calendarEvent,
    propertyId?: string,
    participants?
  ) {
    const firstName = receiver?.firstName || '';
    const lastName = receiver?.lastName || '';
    const fullName = firstName ? firstName + ' ' + lastName : lastName;
    const receiverName = firstName || lastName;

    const {
      firstNames = '',
      fullNames = '',
      roles = ''
    } = getTextFromDynamicRecipientVariable(participants || [], propertyId);

    // replace ' to "
    const validParamTag1 = replaceSingleQuotes(
      "<span style='color: var(--fg-brand, #28ad99);' contenteditable='false'>"
    );
    // cover miss case and old data after replace --trudi-primary to --fg-brand
    const validParamTag2 = replaceSingleQuotes(
      "<span style='color: var(--trudi-primary, #00aa9f);' contenteditable='false'>"
    );
    const validParamTag =
      '<span style="color: var(--fg-brand, #28ad99);" contenteditable="false">';
    formData.msgContent = formData.msgContent.replaceAll(
      validParamTag1,
      validParamTag
    );
    formData.msgContent = formData.msgContent.replaceAll(
      validParamTag2,
      validParamTag
    );

    // Replace fallback to string
    const fallbackTemplates = [
      {
        pattern:
          /<span style="color: var\(--danger-500, #fa3939\);" contenteditable="false">unknown<\/span>/gi,
        value: EFallback.UNKNOWN
      },
      {
        pattern:
          /<span style="color: var\(--danger-500, #fa3939\);" contenteditable="false">unavailable<\/span>/gi,
        value: EFallback.UNAVAILABLE
      },
      {
        pattern:
          /<span style="color: var\(--danger-500, #fa3939\);" contenteditable="false">N\/A<\/span>/gi,
        value: EFallback.NOT_APPLICABLE
      },
      {
        pattern:
          /<span style="color: var\(--danger-500, #fa3939\);" contenteditable="false">no conditions<\/span>/gi,
        value: EFallback.CONDITIONS_COPY
      },
      {
        pattern:
          /<span style="color: var\(--danger-500, #fa3939\);" contenteditable="false">document<\/span>/gi,
        value: EFallback.DOCUMENT
      },
      {
        pattern:
          /<span style="color: var\(--danger-500, #fa3939\);" contenteditable="false">the agreed maintenance expenditure limit<\/span>/gi,
        value: EFallback.MAINTENANCE_EXPENDITURE_LIMIT
      }
    ];
    fallbackTemplates.forEach((fallbackTemplate) => {
      formData.msgContent = formData.msgContent.replace(
        fallbackTemplate.pattern,
        fallbackTemplate.value
      );
    });

    // Convert invalid dynamic replaced data to string
    const invalidParamReplacedDataRegex = [
      /<span\sstyle='color:\svar\(--fg-danger,#e1024f\);'[^\>]* data-param='\$?\b\w*_\w*\b'>/gim,
      /<span\sstyle="color:\svar\(--fg-danger,#e1024f\);"[^\>]* data-param="\$?\b\w*_\w*\b">/gim,
      /<span\sstyle='color:\svar\(--danger-500, #fa3939\);'[^\>]* data-param='\$?\b\w*_\w*\b'>/gim,
      /<span\sstyle="color:\svar\(--danger-500, #fa3939\);"[^\>]* data-param="\$?\b\w*_\w*\b">/gim
    ];
    invalidParamReplacedDataRegex.forEach((regex) => {
      formData.msgContent = formData.msgContent.replaceAll(regex, '<span>');
    });

    // Convert invalid dynamic not replaced data to correct formatting for replace fail back
    const invalidParamNotReplacedDataRegex = [
      /<span\sstyle='color:\svar\(--fg-danger,#e1024f\);'[^\>]*>/gim,
      /<span\sstyle="color:\svar\(--fg-danger,#e1024f\);"[^\>]*>/gim,
      /<span\sstyle='color:\svar\(--danger-500, #fa3939\);'[^\>]*>/gim,
      /<span\sstyle="color:\svar\(--danger-500, #fa3939\);"[^\>]*>/gim
    ];
    invalidParamNotReplacedDataRegex.forEach((regex) => {
      formData.msgContent = formData.msgContent.replaceAll(
        regex,
        validParamTag
      );
    });

    // Replace dynamic param values for msgContent
    let replacements = [
      {
        pattern: /{user_role}/g,
        value: participants?.length
          ? roles
          : convertUserRole(receiver?.type, receiver?.contactType)
      },
      {
        pattern: /{user_first_name}/g,
        value: participants?.length
          ? firstNames
          : firstName || EFallback.UNKNOWN
      },
      {
        pattern: /{user_fullname}/g,
        value: fullName || EFallback.UNKNOWN
      },
      {
        pattern: /{user_full_name}/g,
        value: participants?.length ? fullNames : fullName || EFallback.UNKNOWN
      },
      { pattern: /{owner name}/g, value: receiverName },
      { pattern: /{tenant name}/g, value: receiverName },
      { pattern: /{receiver name}/g, value: receiverName },
      { pattern: /{receiver first name}/g, value: receiverName },
      { pattern: /{landlord name}/g, value: receiverName },
      { pattern: /{supplier name}/g, value: receiverName },
      { pattern: /{amount}/g, value: receiver?.amount || '' },
      {
        pattern: /{property address}/g,
        value: receiver?.propertyAddress || ''
      },
      {
        pattern: /{maintenance issue}/g,
        value: receiver?.maintenanceIsue || ''
      },
      {
        pattern:
          /<p><img id='[^"]*' class='image-loading' src='\/assets\/images\/loading-iframe.gif'><\/p>/g,
        value: ''
      }
    ];

    replacements = [
      ...replacements,
      ...this.trudiDynamicParamService.handleReplaceCommonDynamicParamsInMess(
        receiver,
        formData.selectedSender,
        this.currentCompany,
        calendarEvent,
        propertyId,
        participants
      )
    ];

    let optimizedContent = formData.msgContent;
    for (const replacement of replacements) {
      optimizedContent = optimizedContent.replace(
        replacement.pattern,
        replacement.value
      );
    }
    // Replace {Hi ,}
    optimizedContent = optimizedContent.replace(/Hi ,/, 'Hi,');

    return optimizedContent;
  }

  getFileFromDynamicParam(
    msgContent: string,
    receiver,
    calendarEvent
  ): IFile[] {
    let files = [];
    const params = ['request_summary', 'inspection_item_details'];

    const checkIsUseDynamicParam = (param) => {
      const validParamTag = replaceSingleQuotes(
        `<span style='color: var(--fg-brand, #28ad99);' contenteditable='false'>${param}</span>`
      );
      const inValidParamTag = replaceSingleQuotes(
        `<span style='color: var(--danger-500, #fa3939);' title='Missing data for some contacts' contenteditable='false'>${param}</span>`
      );

      if (msgContent.includes(validParamTag || inValidParamTag)) {
        return true;
      }
      return false;
    };

    params.forEach((param) => {
      if (checkIsUseDynamicParam(param)) {
        switch (param) {
          case 'request_summary':
            files = [
              ...files,
              ...(receiver?.linkedActions?.[0]?.ticketFiles || [])
            ];
            break;
          case 'inspection_item_details':
            files = [...files, ...this.getAllInspectionFiles(calendarEvent)];
            break;
        }
      }
    });

    return files.map((file) => ({
      ...file,
      title: file?.title ?? file?.name,
      fileName: file?.fileName ?? file?.name,
      fileSize: file?.fileSize ?? file?.size,
      fileType: file?.fileType?.name ?? file?.fileType
    }));
  }

  getAllInspectionFiles(calendarEvent) {
    const data = calendarEvent?.[0]?.[RMWidgetDataField.RM_INSPECTIONS]?.find(
      (item) =>
        ![ESyncStatus.INPROGRESS, ESyncStatus.FAILED].includes(
          item?.syncStatus || item?.status
        )
    );
    if (!data) return [];
    const allFiles = [];
    (data?.inspectionAreas || [])?.forEach((area) => {
      area?.inspectionAreaItems?.forEach((item) => {
        if (item?.files && item.files?.length > 0) {
          allFiles.push(...item.files);
        }
      });
    });
    return allFiles;
  }

  // public checkIsSendFromEmail(
  //   option: {
  //     sendOption?: sendOptionType;
  //     receiver?: ISelectedReceivers;
  //   } = {}
  // ): boolean {
  //   const { sendOption, receiver } = option;
  //   let sendToEmail: boolean = false;
  //   if (sendOption) {
  //     sendToEmail = sendOption === sendOptionType.EMAIL;
  //   }
  //   if (receiver && !receiver.isAppUser) {
  //     sendToEmail = true;
  //   }
  //   return sendToEmail;
  // }

  private getContactInfos(formData: ITrudiSendMsgFormValue): IContactInfo[] {
    return formData.selectedContactCard
      ? this.transformContactCardInfo(formData.selectedContactCard)
      : [];
  }

  public transformContactCardInfo(
    selectedContactCards: ISelectedReceivers[]
  ): IContactInfo[] {
    return selectedContactCards?.map((element) => ({
      title:
        this.isRmEnvironment &&
        this.validTypeRM.includes(element.type as EUserPropertyType)
          ? USER_TYPE_IN_RM[element.type as EUserPropertyType]
          : this.userTypeInPTPipe.transform(
              element.type,
              this.isPTEnvironment,
              {
                contactType: element.userPropertyContactType?.type,
                type: element.type,
                isPrimary: element.isPrimary
              },
              true
            ),
      type: element.type,
      address: element.streetLine,
      firstName: element.firstName || '',
      lastName: element.lastName || '',
      mobileNumber: element?.mobileNumber || '',
      phoneNumber: element.phoneNumber || '',
      email: element.email || '',
      landingPage: element.landingPage || '',
      id: element.id,
      userPropertyContactType: element?.userPropertyContactType,
      isPrimary: element?.isPrimary,
      propertyId: element?.propertyId,
      streetLine: element?.streetLine,
      userTitle: element?.userTitle,
      tempId: uuid4()
    }));
  }

  /* BULK */
  /**
   * @deprecated
   */
  async getBulkBody(
    formData: ITrudiSendMsgFormValue,
    action: string,
    isShareCalendarEvent?,
    calendarEventId?,
    calendarEvent?
  ): Promise<IBulkMsgBody> {
    const currentReiFormIds =
      this.reiFormService.createReiFormLink$.value.inPopup.map((value) =>
        value.formDetail.id.toString()
      );
    const reiFormIds = currentReiFormIds
      ? [...new Set(currentReiFormIds)]
      : undefined;

    let listFile = [...formData.listOfFiles];
    if (formData.attachMediaFiles?.length > 0) {
      listFile = [
        ...formData.listOfFiles,
        ...filterMediaFilesChecked(formData.attachMediaFiles)
      ] as IFile[];
    }
    listFile.forEach((file) => {
      file.extension = this.filesService.getFileExtension(
        file?.name || file[0]?.name
      );
    });
    const listFileFilter = listFile.filter((item) => item.extension !== '.ics');

    const file = await this.formatFiles(
      isShareCalendarEvent ? listFileFilter : listFile
    );
    const message = this.getBulkMessage(formData, false, calendarEvent);
    return {
      actionLink: [],
      file,
      message,
      isResolveConversation: formData.isResolveConversation,
      action,
      calendarEventId: isShareCalendarEvent
        ? calendarEventId
          ? calendarEventId
          : this.eventCalendarService.getSelectedCalendarEventId
        : null,
      reiFormIds,
      mailBoxId: this.currentMailBoxId,
      sendOption: formData.sendOption
    };
  }

  /**
   * @deprecated
   */
  private getBulkMessage(
    formData: ITrudiSendMsgFormValue,
    isCreateMessageType?: boolean,
    calendarEvent?
  ): IBulkMsg[] {
    const contacts = this.getContactInfos(formData);
    const options = contacts?.length && {
      contacts
    };
    const { categoryId, propertyId, taskId } = this.getIDsFromOtherService();

    return formData.selectedReceivers.map((receiver) => {
      return {
        categoryId,
        propertyId:
          receiver?.propertyId ||
          receiver?.property?.id ||
          (isCreateMessageType ? '' : propertyId) ||
          '',
        status: 'OPEN',
        userId: formData.selectedSender.id,
        personUserId: receiver.id,
        personUserType: receiver.type,
        personUserEmail: receiver.email,
        categoryMessage: formData.msgTitle,
        contentMessage: this.handleReplaceReceiverInMess(
          formData,
          receiver,
          calendarEvent.filter(
            (event) => (receiver?.taskId || null) === event.taskId
          )
        ),
        taskId: receiver?.taskId || (isCreateMessageType ? null : taskId),
        options,
        isSendFromEmail: true,
        files: this.getFileFromDynamicParam(
          formData.msgContent,
          receiver,
          calendarEvent.filter(
            (event) => (receiver?.taskId || null) === event.taskId
          )
        )
      };
    });
  }

  /* BULK EVENT */
  /**
   * @deprecated
   */
  async getBulkEventBody(
    formData: ITrudiSendMsgFormValue,
    isCreateMessageType = false,
    calendarEvent
  ): Promise<IBulkEventMsgBody> {
    const { agencyId } = this.getIDsFromOtherService();
    let listFile = [...formData.listOfFiles];
    if (formData.attachMediaFiles?.length > 0) {
      listFile = [
        ...formData.listOfFiles,
        ...filterMediaFilesChecked(formData.attachMediaFiles)
      ] as IFile[];
    }
    const file = await this.formatFiles(listFile);
    const message = this.getBulkMessage(
      formData,
      isCreateMessageType,
      calendarEvent
    );
    const currentReiFormIds =
      this.reiFormService.createReiFormLink$.value.inPopup.map((value) =>
        value.formDetail.id.toString()
      );
    const reiFormIds = currentReiFormIds
      ? [...new Set(currentReiFormIds)]
      : undefined;

    return {
      isCreateMessageType,
      agencyId,
      file,
      message,
      isResolveConversation: formData.isResolveConversation,
      isForwardDocument: false,
      summary: '',
      actionLink: [],
      reiFormIds,
      mailBoxId: this.currentMailBoxId,
      sendOption: formData.sendOption
    };
  }

  /* V3 */
  /**
   * @deprecated
   */
  async getV3Body(
    formData: ITrudiSendMsgFormValue,
    trudiButton,
    isShareCalendarEvent?,
    calendarEventId?,
    calendarEvent?
  ): Promise<IV3MsgBody> {
    let listFile = [...formData.listOfFiles];
    if (formData.attachMediaFiles?.length > 0) {
      listFile = [
        ...formData.listOfFiles,
        ...filterMediaFilesChecked(formData.attachMediaFiles)
      ] as IFile[];
    }
    listFile.forEach((file) => {
      file.extension = this.filesService.getFileExtension(
        file?.name || file[0]?.name
      );
    });
    const listFileFilter = listFile.filter((item) => item.extension !== '.ics');
    const files = await this.formatFiles(
      isShareCalendarEvent ? listFileFilter : listFile
    );
    const textMessages = this.getTextMessagesV3(formData, calendarEvent);
    if (formData.isResolveConversation) {
      this.inboxToolbarService.setFilterInboxList(true);
    }
    return {
      textMessages,
      files,
      isResolveConversation: formData.isResolveConversation,
      action: trudiButton?.action,
      stepId: trudiButton?.id,
      mailBoxId: this.currentMailBoxId,
      calendarEventId: isShareCalendarEvent
        ? calendarEventId
          ? calendarEventId
          : this.eventCalendarService.getSelectedCalendarEventId
        : null
    };
  }

  /**
   * @deprecated
   */
  private getTextMessagesV3(
    formData: ITrudiSendMsgFormValue,
    calendarEvent
  ): ITextMessagesV3[] {
    const contacts = this.getContactInfos(formData);
    return formData.selectedReceivers.map((receiver) => ({
      message: this.handleReplaceReceiverInMess(
        formData,
        receiver,
        calendarEvent.filter(
          (event) => (receiver?.taskId || null) === event.taskId
        )
      ),
      userId: formData.selectedSender.id,
      isSendFromEmail: true,
      conversationId: receiver.conversationId,
      newConversationTitle: formData.msgTitle,
      optionParam: {
        contacts
      },
      mailBoxId: this.currentMailBoxId,
      taskId: receiver?.taskId ?? null,
      files: this.getFileFromDynamicParam(
        formData.msgContent,
        receiver,
        calendarEvent.filter(
          (event) => (receiver?.taskId || null) === event.taskId
        )
      )
    }));
  }

  private handleMessageTurnOnApp(item: ITextMessagesV3) {
    if (!item.isSendFromEmail && !this.activeMobileApp) {
      item.isSendFromEmail = true;
    }
  }

  checkValidReceiverPrefill(receivers, validationFunction) {
    return receivers.every(validationFunction);
  }

  // Send message v2
  formattedReceivers(formData: ITrudiSendMsgFormValue) {
    return [
      ...(formData.ccReceivers || []).map((item) => ({
        ...item,
        receivertype: EReceiverType.CC
      })),
      ...(formData.bccReceivers || []).map((item) => ({
        ...item,
        receivertype: EReceiverType.BCC
      })),
      ...(formData.selectedReceivers || []).map((item) => ({
        ...item,
        receivertype: EReceiverType.TO
      }))
    ];
  }

  getReceiversInfo(receiversData) {
    receiversData = receiversData.filter((item) => {
      const isValid = item.hasOwnProperty('isValid') && item.isValid;
      const isNotInvalid = item.hasOwnProperty('isInvalid') && !item.isInvalid;
      const isUnidentified = item.type === EUserPropertyType.UNIDENTIFIED;

      return isValid || isNotInvalid || !isUnidentified;
    });
    const recipients = receiversData.reduce((acc, receiver) => {
      const receiverId = receiver.id || receiver.userId;
      const key = `${receiverId}-${receiver.propertyId}-${
        receiver.secondaryEmail?.id || receiver.secondaryEmailId || ''
      }`;
      if (!acc[key]) {
        acc[key] = {
          userId:
            receiver.type === EUserPropertyType.UNIDENTIFIED
              ? emptyUUID
              : receiverId,
          userPropertyId: receiver?.userPropertyId,
          email: receiver.secondaryEmail?.email || receiver.email,
          secondaryEmailId:
            receiver.secondaryEmailId || receiver.secondaryEmail?.id || null,
          userType: receiver.userPropertyType || receiver.type,
          type: [receiver.receivertype]
        };
      } else {
        acc[key].type.push(receiver.receivertype);
      }

      return acc;
    }, {}) as IReceiver[];
    return Object.values(recipients);
  }

  getMsgContentAndQuote(
    content,
    isHasQuote,
    isEditMessageDraft: boolean = false
  ) {
    if (!isHasQuote) return content;
    let { msgContent, quote } = extractQuoteAndMessage(content, true);
    return isEditMessageDraft
      ? msgContent + quote
      : concatQuoteAndMessage(msgContent, quote);
  }

  getSendMsgBodyv2(
    formData: ITrudiSendMsgFormValue,
    configs: ISendMsgConfigs,
    calendarEvent?,
    isHasQuote = false,
    isDraft = false,
    agentJoin = false,
    ignoreContactCardData = false
  ): ISendMsgPayload {
    const {
      taskId,
      conversationId,
      propertyId: currentPropertyId
    } = getServiceDataFromConfig(configs);
    const {
      replyToMessageId,
      draftMessageId,
      replyConversationId,
      taskReplyId
    } = configs.body;
    const {
      isCreateMessageType,
      isFromDraftFolder,
      createMessageFrom,
      isReplyAction,
      isReplyTicket
    } = configs.otherConfigs;
    const {
      isAppMessage,
      isSMSMessage,
      isMessengerMessage,
      isWhatsAppMessage
    } = configs.inputs;
    const contacts = ignoreContactCardData
      ? []
      : this.getContactInfos(formData);

    const currentReiFormIds =
      this.reiFormService.createReiFormLink$.value.inPopup.map((value) =>
        value.formDetail.id.toString()
      );

    const reiFormIds = currentReiFormIds
      ? [...new Set(currentReiFormIds)]
      : undefined;

    const typeSend =
      (configs.trudiButton as TrudiStep)?.fields.typeSend ||
      configs.inputs.prefillData?.fields?.typeSend;
    const isTaskStepSingleEmail = typeSend === ETypeSend.SINGLE_EMAIL;
    const tempReceivers = this.formattedReceivers(formData);
    const receivers = this.getReceiversInfo(tempReceivers);
    const msgContentPrefill = !isDraft
      ? this.handleReplaceReceiverInMess(
          formData,
          this.dataToPrefillForSendBulk,
          calendarEvent,
          formData.property?.id || currentPropertyId,
          isTaskStepSingleEmail ? formData.selectedReceivers : []
        )
      : formData.msgContent;
    let msgContent = this.getMsgContentAndQuote(
      msgContentPrefill,
      isHasQuote,
      !!configs.body.draftMessageId
    );

    msgContent =
      isDraft && !configs.body.draftMessageId
        ? removePTagTemplate(msgContent)
        : isAppMessage
        ? msgContent.replace(
            /^(<p>(?:&nbsp;|\s)+<\/p>\n)*|(\n<p>(?:&nbsp;|\s)+<\/p>)*$/g,
            ''
          )
        : msgContent;
    const contentCard = htmlContactCard(contacts, this.market);

    const messageContact = !isDraft ? msgContent + contentCard : '';

    // const fileFromDynamicParam = !isDraft
    //   ? this.getFileFromDynamicParam(
    //       formData.msgContent,
    //       this.dataToPrefillForSendBulk,
    //       calendarEvent
    //     )
    //   : [];
    let tempFiles = formData.listOfFiles || [];
    if (formData.attachMediaFiles?.length > 0) {
      tempFiles = [
        ...formData.listOfFiles,
        ...filterMediaFilesChecked(formData.attachMediaFiles)
      ] as IFile[];
    }
    tempFiles.forEach((file) => {
      file.extension = this.filesService.getFileExtension(
        file?.name || file[0]?.name
      );
    });
    const isShareCalendarEvent =
      !!configs?.otherConfigs.calendarEvent?.calendarEventId ||
      configs?.otherConfigs.calendarEvent?.sendCalendarEvent;
    tempFiles = isShareCalendarEvent
      ? tempFiles.filter((file) => file.extension !== '.ics')
      : tempFiles;
    // const files = await this.formatFiles(tempFiles);
    const listFileUploaded = this.trudiSaveDraftService.getListFileUploaded();
    const files = listFileUploaded.filter((file) => {
      file.tempId = uuid4();
      return tempFiles.some((item) => item.localId === file.localId);
    });
    const exsistConversationId =
      (formData.selectedReceivers?.[0] as IProcessedReceiver)?.conversationId ||
      null;
    let conversationIdPayload;
    if (
      isCreateMessageType ||
      this.isReplyOrForwardActionItem(configs) ||
      isReplyTicket
    ) {
      conversationIdPayload = '';
    } else {
      const isEditDraft = !!draftMessageId;
      if (isEditDraft) {
        conversationIdPayload = conversationId || replyConversationId;
      } else {
        conversationIdPayload = replyToMessageId
          ? conversationId || replyConversationId
          : exsistConversationId;
      }
    }

    const conversationType = this.getConversationType({
      isAppMessage,
      isMessengerMessage,
      isSMSMessage,
      isWhatsAppMessage
    });

    const messageBody: ISendMsgPayload = {
      mailBoxId: formData.selectedSender?.mailBoxId,
      propertyId: formData?.property?.id ?? '',
      emailMessage: {
        tempId: uuid4(),
        title: formData.msgTitle,
        content: msgContent,
        userId: formData.selectedSender?.id,
        recipients: receivers,
        files,
        reiFormIds,
        taskId:
          isCreateMessageType &&
          createMessageFrom !== ECreateMessageFrom.TASK_DETAIL
            ? ''
            : taskReplyId || taskId,
        conversationId: [EMessageConversationType.VOICE_MAIL].includes(
          configs.otherConfigs.replyViaEmailFrom
        )
          ? ''
          : !isAppMessage
          ? conversationIdPayload
          : conversationId,
        contacts: contacts,
        calendarEventIds: isShareCalendarEvent
          ? [configs?.otherConfigs?.calendarEvent?.calendarEventId]
          : [],
        isSendFromEmail: !isAppMessage && !isSMSMessage && !isMessengerMessage,
        replyToMessageId,
        isDraft,
        draftMessageId:
          draftMessageId || this.trudiSaveDraftService.getDraftMsgId,
        isFromDraftFolder,
        stepTask: {
          stepType: (configs.trudiButton as TrudiStep)?.stepType,
          action: (configs.trudiButton as TrudiStep)?.action
        },
        ticketId: configs.body.ticketId,
        isReplyTicketOfConversation: configs.body.isReplyTicketOfConversation,
        conversationType,
        isUrgentTicket: configs.body.isUrgentTicket,
        messageContact,
        sendOptions: {
          time: configs.body?.timeSchedule,
          type: configs.body.typeSendMsg
        }
      },
      actionFlags: {
        resolveConversation: formData.isResolveConversation,
        pushToAgent: true,
        agentJoin
      },
      step: {
        stepId: configs.trudiButton?.id
      }
    };

    if (configs.inputs?.isForwardDocument) {
      messageBody.emailMessage.isForwardDocument = true;
    }

    if (
      configs.otherConfigs.replyViaEmailFrom === EMessageConversationType.APP
    ) {
      return this.getPayloadForReplyAppMessageViaEmail(
        configs,
        formData,
        msgContent,
        receivers,
        files,
        reiFormIds,
        taskId,
        contacts,
        isDraft,
        isFromDraftFolder,
        agentJoin,
        isCreateMessageType,
        messageContact
      );
    } else {
      return messageBody;
    }
  }

  private isReplyOrForwardActionItem(configs): boolean {
    return (
      configs?.serviceData?.taskService?.currentTask?.taskType !==
        TaskType.MESSAGE &&
      [
        EMessageConversationType.VOICE_MAIL,
        EMessageConversationType.MESSENGER,
        EMessageConversationType.SMS
      ].includes(configs?.otherConfigs?.replyViaEmailFrom)
    );
  }

  getConversationType(providerObj: {
    isAppMessage: boolean;
    isSMSMessage: boolean;
    isMessengerMessage: boolean;
    isWhatsAppMessage: boolean;
  }): EMessageConversationType {
    switch (true) {
      case providerObj.isAppMessage:
        return EMessageConversationType.APP;
      case providerObj.isSMSMessage:
        return EMessageConversationType.SMS;
      case providerObj.isMessengerMessage:
        return EMessageConversationType.MESSENGER;
      case providerObj.isWhatsAppMessage:
        return EMessageConversationType.WHATSAPP;
      default:
        return EMessageConversationType.EMAIL;
    }
  }

  getCommonInformationForBulkSendMessage(
    formData: ITrudiSendMsgFormValue,
    configs: ISendMsgConfigs,
    ignoreContactCardData = false
  ) {
    //To prefill data of config from step workflow
    const { agencyId, taskId } = getServiceDataFromConfig(configs);
    const contacts = ignoreContactCardData
      ? []
      : this.getContactInfos(formData);

    const contentCard = htmlContactCard(contacts, this.market);

    let tempFiles = [...formData.listOfFiles];
    tempFiles.forEach((file) => {
      file.extension = this.filesService.getFileExtension(
        file?.name || file[0]?.name
      );
    });
    if (formData.attachMediaFiles?.length > 0) {
      tempFiles = [
        ...formData.listOfFiles,
        ...filterMediaFilesChecked(formData.attachMediaFiles)
      ] as IFile[];
    }
    const isShareCalendarEvent =
      !!configs?.otherConfigs.calendarEvent?.calendarEventId ||
      configs?.otherConfigs?.calendarEvent?.sendCalendarEvent;
    const filteredFiles = isShareCalendarEvent
      ? tempFiles.filter((file) => file.extension !== '.ics')
      : tempFiles;
    const listFileUploaded = this.trudiSaveDraftService.getListFileUploaded();
    const files = listFileUploaded.filter((file) =>
      filteredFiles.some((item) => item.localId === file.localId)
    );
    const currentReiFormIds =
      this.reiFormService.createReiFormLink$.value.inPopup.map((value) =>
        value.formDetail.id.toString()
      );

    const reiFormIds = currentReiFormIds
      ? [...new Set(currentReiFormIds)]
      : undefined;

    const trudiButton = configs.inputs.prefillData || configs.trudiButton;
    const calendarEvents = this.getCalendarEventFromConfig(configs);
    const calendarEventIds = calendarEvents.map(
      (event) => event.calendarEventId
    );
    const isCreateMessageInTask = [
      ECreateMessageFrom.TASK_HEADER,
      ECreateMessageFrom.TASK_STEP
    ].includes(configs.otherConfigs.createMessageFrom);
    const isCreateMessageType = configs.otherConfigs.isCreateMessageType;

    return {
      agencyId,
      taskId,
      contacts,
      contentCard,
      files,
      reiFormIds,
      trudiButton,
      isShareCalendarEvent,
      calendarEventIds,
      calendarEvents,
      isCreateMessageInTask,
      isCreateMessageType
    };
  }

  getSendManyMsgBodyv2(
    formData: ITrudiSendMsgFormValue,
    configs: ISendMsgConfigs,
    selectedTasks: ITasksForPrefillDynamicData[] = [],
    isDraft = false,
    ignoreContactCardData = false
  ): ISendManyMsgPayload {
    const {
      taskId,
      contentCard,
      files,
      contacts,
      reiFormIds,
      trudiButton,
      calendarEventIds,
      isCreateMessageInTask,
      calendarEvents,
      isShareCalendarEvent,
      isCreateMessageType
    } = this.getCommonInformationForBulkSendMessage(
      formData,
      configs,
      ignoreContactCardData
    );

    let emailMessages: ISendManyEmailMsg[] = (
      formData?.selectedReceivers as IProcessedReceiver[]
    ).map((receiver) => {
      const calendarEventData = getCalendarEventData(
        selectedTasks,
        receiver.taskId
      );
      const receiverTaskId = isCreateMessageType
        ? ''
        : isCreateMessageInTask
        ? taskId
        : receiver.taskId;
      const receiverFiles = this.getFileFromDynamicParam(
        formData.msgContent,
        receiver,
        calendarEventData
      );

      const msgContent = !isDraft
        ? this.handleReplaceReceiverInMess(
            formData,
            receiver,
            isShareCalendarEvent ? calendarEvents : calendarEventData,
            receiver?.actualPropertyId || receiver?.propertyId,
            !receiver?.participants?.length ||
              receiver?.participants?.length <= 1
              ? [receiver]
              : receiver?.participants
          )
        : formData.msgContent;

      const messageContact = !isDraft ? msgContent + contentCard : '';
      const recipients = this.getReceiversInfo(
        this.formattedReceivers({
          ...formData,
          selectedReceivers: [receiver]
        })
      );
      return {
        propertyId: receiver.propertyId,
        emailMessage: {
          title: formData.msgTitle,
          content: msgContent,
          userId: formData.selectedSender.id,
          recipients,
          files: [...files, ...receiverFiles],
          reiFormIds,
          taskId: receiverTaskId,
          //Check condition of send message to exist conversation
          conversationId: isCreateMessageType ? '' : receiver?.conversationId,
          contacts: contacts,
          calendarEventIds: isShareCalendarEvent ? calendarEventIds : [],
          isSendFromEmail: true,
          isDraft,
          stepTask: {
            stepType: (configs.trudiButton as TrudiStep)?.stepType,
            action: (configs.trudiButton as TrudiStep)?.action
          },
          messageContact
        }
      } as ISendManyEmailMsg;
    });

    if (!emailMessages.length && isDraft) {
      let receiverTaskId = '';
      if (!isCreateMessageType && isCreateMessageInTask) {
        receiverTaskId = taskId;
      }
      emailMessages = [
        {
          propertyId: '',
          emailMessage: {
            title: formData.msgTitle,
            content: formData.msgContent,
            userId: formData.selectedSender.id,
            recipients: [],
            files: [...files],
            reiFormIds,
            taskId: receiverTaskId,
            conversationId: '',
            contacts: contacts,
            calendarEventIds: isShareCalendarEvent ? calendarEventIds : [],
            isSendFromEmail: true,
            isDraft,
            stepTask: {
              stepType: (configs.trudiButton as TrudiStep)?.stepType,
              action: (configs.trudiButton as TrudiStep)?.action
            }
          }
        }
      ];
    } else {
      switch (configs.otherConfigs.createMessageFrom) {
        case ECreateMessageFrom.MULTI_MESSAGES:
          const sendBulkMessagePayloads =
            this.getPayloadForSendBulkMessages(formData);
          emailMessages.forEach((emailMessage, index) => {
            emailMessage.emailMessage = {
              ...emailMessage.emailMessage,
              ...sendBulkMessagePayloads[index]
            };
          });
          break;
        case ECreateMessageFrom.MULTI_TASKS:
          if (configs.body.receiver.prefillSelectedTypeItem) {
            emailMessages.forEach((emailMsg) => {
              emailMsg.emailMessage = replaceDynamicEmailMessageTitle(
                emailMsg.emailMessage,
                selectedTasks
              );
            });
          }
          break;
        default:
      }
    }

    const bodyPayload: ISendManyMsgPayload = {
      actionFlags: {
        resolveConversation: formData?.isResolveConversation,
        pushToAgent: true
      },
      emailMessages: emailMessages,
      mailBoxId: formData?.selectedSender?.mailBoxId,
      step: {
        stepId: trudiButton?.id,
        action: trudiButton?.action,
        status: TrudiButtonEnumStatus.COMPLETED,
        stepType: trudiButton?.type
      }
    };
    return bodyPayload;
  }

  // get payload for bulk send message in trigger step flow on message index and calendar page after create bulk tasks
  getSendManyGroupMsgBody(
    formData: ITrudiSendMsgFormValue,
    configs: ISendMsgConfigs,
    selectedTasks: ITasksForPrefillDynamicData[] = [],
    isDraft = false,
    ignoreContactCardData = false
  ): ISendManyMsgPayload {
    const {
      taskId,
      contentCard,
      files,
      contacts,
      reiFormIds,
      trudiButton,
      calendarEventIds,
      isCreateMessageInTask,
      calendarEvents,
      isShareCalendarEvent,
      isCreateMessageType
    } = this.getCommonInformationForBulkSendMessage(
      formData,
      configs,
      ignoreContactCardData
    );

    let emailMessages: ISendManyEmailMsg[] = (
      formData?.selectedReceivers as IProcessedReceiver[]
    ).map((message) => {
      const calendarEventData = getCalendarEventData(
        selectedTasks,
        message.taskId
      );
      const receiverTaskId = message.taskId;
      const receiverFiles = this.getFileFromDynamicParam(
        formData.msgContent,
        message,
        calendarEventData
      );

      const msgContent = !isDraft
        ? this.handleReplaceReceiverInMess(
            formData,
            message,
            isShareCalendarEvent ? calendarEvents : calendarEventData,
            message?.actualPropertyId || message?.propertyId,
            message['recipients']
          )
        : formData.msgContent;

      const messageContact = !isDraft ? msgContent + contentCard : '';
      return {
        propertyId: message.propertyId,
        emailMessage: {
          title: formData.msgTitle,
          content: msgContent,
          userId: formData.selectedSender.id,
          recipients: this.getReceiversInfo(
            this.formattedReceivers({
              ...formData,
              selectedReceivers: message['recipients']
            })
          ),
          files: [...files, ...receiverFiles],
          reiFormIds,
          taskId: receiverTaskId,
          conversationId: isCreateMessageType ? '' : message?.conversationId,
          contacts: contacts,
          calendarEventIds: isShareCalendarEvent ? calendarEventIds : [],
          isSendFromEmail: true,
          isDraft,
          stepTask: {
            stepType: (configs.trudiButton as TrudiStep)?.stepType,
            action: (configs.trudiButton as TrudiStep)?.action
          },
          messageContact
        }
      } as ISendManyEmailMsg;
    });

    if (!emailMessages.length && isDraft) {
      let receiverTaskId = '';
      if (!isCreateMessageType && isCreateMessageInTask) {
        receiverTaskId = taskId;
      }
      emailMessages = [
        {
          propertyId: '',
          emailMessage: {
            title: formData.msgTitle,
            content: formData.msgContent,
            userId: formData.selectedSender.id,
            recipients: [],
            files: [...files],
            reiFormIds,
            taskId: receiverTaskId,
            conversationId: '',
            contacts: contacts,
            calendarEventIds: isShareCalendarEvent ? calendarEventIds : [],
            isSendFromEmail: true,
            isDraft,
            stepTask: {
              stepType: (configs.trudiButton as TrudiStep)?.stepType,
              action: (configs.trudiButton as TrudiStep)?.action
            }
          }
        }
      ];
    } else {
      switch (configs.otherConfigs.createMessageFrom) {
        case ECreateMessageFrom.MULTI_TASKS:
          if (configs.body.receiver.prefillSelectedTypeItem) {
            emailMessages.forEach((emailMsg) => {
              emailMsg.emailMessage = replaceDynamicEmailMessageTitle(
                emailMsg.emailMessage,
                selectedTasks
              );
            });
          }
          break;
        default:
      }
    }

    const bodyPayload: ISendManyMsgPayload = {
      actionFlags: {
        resolveConversation: formData?.isResolveConversation,
        pushToAgent: true
      },
      emailMessages: emailMessages,
      mailBoxId: formData?.selectedSender?.mailBoxId,
      step: {
        stepId: trudiButton?.id,
        action: trudiButton?.action,
        status: TrudiButtonEnumStatus.COMPLETED,
        stepType: trudiButton?.type
      }
    };
    return bodyPayload;
  }

  getPayloadForReplyAppMessageViaEmail(
    configs: ISendMsgConfigs,
    formData: ITrudiSendMsgFormValue,
    msgContent: string,
    receivers: IReceiver[],
    files,
    reiFormIds: string[],
    taskId: string,
    contacts,
    isDraft: boolean,
    isFromDraftFolder: boolean,
    agentJoin: boolean,
    isCreateMessageType: boolean,
    messageContact: string
  ): ISendMsgPayload {
    return {
      mailBoxId: formData.selectedSender?.mailBoxId,
      propertyId: formData?.property?.id ?? '',
      emailMessage: {
        tempId: uuid4(),
        title: formData.msgTitle,
        content: msgContent,
        userId: formData.selectedSender.id,
        recipients: receivers,
        files,
        reiFormIds,
        taskId: isCreateMessageType ? '' : taskId,
        conversationId: '',
        contacts: contacts,
        calendarEventIds: [],
        isSendFromEmail: true,
        isDraft,
        draftMessageId:
          configs.body.draftMessageId ||
          this.trudiSaveDraftService.getDraftMsgId,
        isFromDraftFolder,
        stepTask: null,
        ticketId: configs.body.ticketId,
        isReplyTicketOfConversation: configs.body.isReplyTicketOfConversation,
        conversationType: EMessageConversationType.EMAIL,
        isUrgentTicket: configs.body.isUrgentTicket,
        messageContact,
        sendOptions: {
          time: configs.body?.timeSchedule,
          type: configs.body.typeSendMsg
        }
      },
      actionFlags: {
        resolveConversation: formData.isResolveConversation,
        pushToAgent: true,
        agentJoin
      }
    };
  }

  getPayloadForSendBulkMessages(formData: ITrudiSendMsgFormValue) {
    const messages: ISelectedReceivers[] =
      formData.selectedReceivers as ISelectedReceivers[];
    const isDisableRecipientParam = !messages.some(
      (receiver) => receiver.participants?.length === 1
    );

    return messages
      .map((message) => {
        if (isDisableRecipientParam || message.participants?.length > 1) {
          return {
            ...message,
            firstName: null,
            lastName: null,
            type: null,
            contactType: null
          };
        }
        const participant = (message.participants?.[0] || {}) as IParticipant;
        return {
          ...message,
          contactType: participant.contactType,
          type: participant.userPropertyType || participant.type
        };
      })
      .map((messages) => {
        return {
          title: messages?.conversationId
            ? messages['taskTitle']
            : formData.msgTitle,
          content: this.handleReplaceReceiverInMess(
            formData,
            messages,
            [],
            messages?.actualPropertyId || messages?.propertyId,
            messages.participants
          ),
          recipients: messages.participants.map((participant) => ({
            type: [EReceiverType.TO],
            userId: !participant.type ? emptyUUID : participant.userId,
            userPropertyId: participant.userPropertyId,
            userType: !participant.type
              ? EUserPropertyType.UNIDENTIFIED
              : participant.userPropertyType,
            email: participant?.email
          })),
          conversationId: messages?.conversationId
        };
      });
  }

  composeScheduleMessagePayload(
    formData: ITrudiSendMsgFormValue,
    configs: ISendMsgConfigs,
    calendarEvent: unknown[],
    template: string,
    selectedTasks: ITasksForPrefillDynamicData[] = [],
    ignoreContactCardData: boolean = false
  ) {
    const {
      taskId,
      conversationId,
      agencyId,
      propertyId: currentPropertyId
    } = getServiceDataFromConfig(configs);
    const isCreateMessageType = configs.otherConfigs.isCreateMessageType;
    const mailBoxId = formData.selectedSender?.mailBoxId;
    const propertyId = formData.property?.id || currentPropertyId || null;
    const conversationTitle = formData.msgTitle;
    const contacts = !ignoreContactCardData
      ? this.getContactInfos(formData)
      : [];

    const contentCard = htmlContactCard(contacts, this.market);
    const calendarEventIds =
      configs.otherConfigs?.calendarEvent?.calendarEventId;
    const formattedReceivers = this.formattedReceivers(formData);
    // const files = await this.formatFiles([...(formData.listOfFiles ?? [])]);
    const tempFiles = formData.listOfFiles || [];
    const listFileUploaded = this.trudiSaveDraftService.getListFileUploaded();
    const files = listFileUploaded.filter((file) => {
      return tempFiles.some((item) => item.localId === file.localId);
    });
    const commonPayload = {
      conversationId:
        configs.otherConfigs.replyViaEmailFrom ===
          EMessageConversationType.VOICE_MAIL || isCreateMessageType
          ? null
          : conversationId || configs.body?.replyConversationId,
      mailBoxId,
      propertyId,
      agencyId,
      conversationTitle,
      options: { contacts },
      files,
      action:
        (configs.trudiButton?.action || configs.inputs?.prefillData?.action) ??
        ESendMessageType.SCHEDULE,
      actionId: configs.trudiButton?.id || configs.inputs.prefillData?.id,
      isFromTrudiButton: Boolean(
        configs.trudiButton?.action || configs.inputs?.prefillData?.action
      ),
      sendFrom: formData.selectedSender.id,
      reminderTimes: [configs.body?.timeSchedule],
      replyToMessageId: configs.body?.replyToMessageId,
      draftMessageId:
        configs.body?.draftMessageId ||
        this.trudiSaveDraftService.getDraftMsgId,
      isFromDraftFolder: configs.otherConfigs?.isFromDraftFolder,
      ticketId: configs.body?.ticketId,
      ...(calendarEventIds && { calendarEventIds: [calendarEventIds] }),
      isReplyTicketOfConversation: configs.body?.isReplyTicketOfConversation,
      contentCard
    };

    const createMessageFrom = configs.otherConfigs?.createMessageFrom;
    const isHasQuote = configs?.otherConfigs?.isForwardOrReplyMsg;
    switch (createMessageFrom) {
      case ECreateMessageFrom.SCRATCH: {
        let hasTaskId =
          !!commonPayload.draftMessageId || commonPayload.conversationId;
        const { isForwardDocument } = configs.inputs;
        const isForward = isForwardDocument;
        if (
          ([
            EMessageConversationType.APP,
            EMessageConversationType.VOICE_MAIL,
            EMessageConversationType.SMS
          ].includes(configs.otherConfigs.replyViaEmailFrom) &&
            !isCreateMessageType) ||
          isForward
        ) {
          hasTaskId = true;
          commonPayload.conversationId = null;
        }
        return this.composeSchedulePayloadFromScratch(
          {
            ...formData,
            msgContent: this.getMsgContentAndQuote(
              formData.msgContent,
              isHasQuote
            )
          },
          formattedReceivers,
          commonPayload,
          configs,
          template,
          hasTaskId ? taskId : null
        );
      }
      case ECreateMessageFrom.TASK_DETAIL:
      case ECreateMessageFrom.APP_MESSAGE:
        return this.composeSchedulePayloadAppMessage(
          {
            ...formData,
            msgContent: this.getMsgContentAndQuote(
              formData.msgContent,
              isHasQuote
            )
          },
          calendarEvent,
          taskId,
          formattedReceivers,
          commonPayload,
          configs,
          template
        );
      case ECreateMessageFrom.TASK_HEADER: {
        return this.composeSchedulePayloadFormTaskHeader(
          {
            ...formData,
            msgContent: this.getMsgContentAndQuote(
              formData.msgContent,
              isHasQuote
            )
          },
          calendarEvent,
          taskId,
          formattedReceivers,
          commonPayload,
          configs,
          template
        );
      }
      case ECreateMessageFrom.TASK_STEP: {
        const typeSend =
          (configs.trudiButton as TrudiStep)?.fields.typeSend ||
          configs.inputs.prefillData?.fields?.typeSend;
        const isTaskStepSingleEmail = typeSend === ETypeSend.SINGLE_EMAIL;
        if (!isTaskStepSingleEmail) {
          return this.composeSchedulePayloadForSendBulkGroupMessage(
            calendarEvent,
            formData,
            configs,
            template,
            commonPayload,
            createMessageFrom,
            selectedTasks,
            taskId
          );
        }
        return this.composeSchedulePayloadFormTaskStepSingleEmail(
          {
            ...formData,
            msgContent: this.getMsgContentAndQuote(
              formData.msgContent,
              isHasQuote
            )
          },
          calendarEvent,
          taskId,
          formattedReceivers,
          commonPayload,
          configs,
          template
        );
      }
      case ECreateMessageFrom.MULTI_MESSAGES:
      case ECreateMessageFrom.CONTACT:
      case ECreateMessageFrom.MULTI_TASKS: {
        const typeSend =
          (configs.trudiButton as TrudiStep)?.fields.typeSend ||
          configs.inputs.prefillData?.fields?.typeSend;
        const isBulkSingleMessage = typeSend === ETypeSend.SINGLE_EMAIL;
        return isBulkSingleMessage
          ? this.composeSchedulePayloadForSendBulkSingleMessage(
              calendarEvent,
              formData,
              configs,
              template,
              commonPayload,
              createMessageFrom,
              selectedTasks,
              taskId
            )
          : this.composeSchedulePayloadForSendBulkGroupMessage(
              calendarEvent,
              formData,
              configs,
              template,
              commonPayload,
              createMessageFrom,
              selectedTasks,
              taskId
            );
      }

      default:
        return null;
    }
  }

  private composeSchedulePayloadForSendBulkGroupMessage(
    calendarEvent: unknown[],
    formData: ITrudiSendMsgFormValue,
    configs: ISendMsgConfigs,
    template: string,
    commonPayload: {
      conversationId: string;
      mailBoxId: string;
      propertyId: string;
      conversationTitle: string;
      options: { contacts: IContactInfo[] };
      files: IBodyFile[];
      action: string;
      actionId: string;
      isFromTrudiButton: boolean;
      sendFrom: string;
      reminderTimes: string[];
      contentCard?: string;
    },
    createMessageFrom: ECreateMessageFrom,
    selectedTasks: ITasksForPrefillDynamicData[] = [],
    taskId: string
  ) {
    const calendarEventMap = (calendarEvent || []).reduce((map, event) => {
      const taskId = event?.['taskId'];
      if (taskId) {
        map[taskId] = [...(map[taskId] ?? []), event];
      }
      return map;
    }, {});

    const isSendFromTaskStep =
      createMessageFrom === ECreateMessageFrom.TASK_STEP;
    const isSendFromMultiMessages =
      createMessageFrom === ECreateMessageFrom.MULTI_MESSAGES;

    const transformedReceivers = formData.selectedReceivers?.map((receiver) => {
      const calendarEventInTask = calendarEventMap[receiver.taskId] ?? [];
      const message = this.handleReplaceReceiverInMess(
        formData,
        receiver,
        calendarEventInTask,
        receiver.actualPropertyId ||
          receiver.propertyId ||
          receiver.property?.id,
        isSendFromMultiMessages ? receiver.participants : [receiver]
      );

      const messageContact = message + commonPayload.contentCard;

      const currTask = selectedTasks.find((e) => e.taskId === receiver.taskId);
      const conversationTitle = !!currTask
        ? replaceMessageTitle(commonPayload.conversationTitle, currTask)
        : commonPayload.conversationTitle;

      const isCreateMessageFromMultiMessages =
        configs.otherConfigs?.createMessageFrom ===
        ECreateMessageFrom.MULTI_MESSAGES;
      const users = this.getReceiversInfo(
        this.formattedReceivers(
          isCreateMessageFromMultiMessages
            ? {
                ...formData,
                selectedReceivers: receiver.participants
              }
            : {
                ...formData,
                selectedReceivers: [receiver]
              }
        )
      );

      return {
        users,
        // TODO: handle conversation connection
        // conversationId: configs.otherConfigs.isCreateMessageType
        //   ? null
        //   : receiver.conversationId,
        conversationId:
          isCreateMessageFromMultiMessages &&
          !configs.otherConfigs.isCreateMessageType
            ? receiver.conversationId
            : null,
        conversationTitle,
        taskId: isSendFromTaskStep ? null : receiver.taskId,
        propertyId: receiver.propertyId,
        message,
        template: Boolean(
          configs.trudiButton?.action || configs.inputs?.prefillData?.action
        )
          ? message || template
          : null,
        files: this.getFileFromDynamicParam(
          formData.msgContent,
          receiver,
          calendarEventInTask
        ),
        messageContact
      };
    });

    return {
      ...commonPayload,
      recipients: transformedReceivers,
      isSendBulk: true,
      taskId: isSendFromTaskStep ? taskId : null,
      isFromCreateMessage: [
        ECreateMessageFrom.MULTI_TASKS,
        ECreateMessageFrom.CONTACT
      ].includes(createMessageFrom),
      sessionId: this.trudiSaveDraftService.getSessionId,
      draftMessageId: null
    };
  }

  private composeSchedulePayloadForSendBulkSingleMessage(
    calendarEvent: unknown[],
    formData: ITrudiSendMsgFormValue,
    configs: ISendMsgConfigs,
    template: string,
    commonPayload: {
      conversationId: string;
      mailBoxId: string;
      propertyId: string;
      conversationTitle: string;
      options: { contacts: IContactInfo[] };
      files: IBodyFile[];
      action: string;
      actionId: string;
      isFromTrudiButton: boolean;
      sendFrom: string;
      reminderTimes: string[];
      contentCard?: string;
    },
    createMessageFrom: ECreateMessageFrom,
    selectedTasks: ITasksForPrefillDynamicData[] = [],
    taskId: string
  ) {
    const calendarEventMap = (calendarEvent || []).reduce((map, event) => {
      const taskId = event?.['taskId'];
      if (taskId) {
        map[taskId] = [...(map[taskId] ?? []), event];
      }
      return map;
    }, {});

    const isSendFromTaskStep =
      createMessageFrom === ECreateMessageFrom.TASK_STEP;

    const transformedReceivers = formData.selectedReceivers?.map((receiver) => {
      const calendarEventInTask = calendarEventMap[receiver.taskId] ?? [];
      const message = this.handleReplaceReceiverInMess(
        formData,
        receiver,
        calendarEventInTask,
        receiver.property?.id,
        receiver.recipients
      );

      const messageContact = message + commonPayload.contentCard;

      const currTask = selectedTasks.find((e) => e.taskId === receiver.taskId);
      const conversationTitle = !!currTask
        ? replaceMessageTitle(commonPayload.conversationTitle, currTask)
        : commonPayload.conversationTitle;

      return {
        users: this.getReceiversInfo(
          this.formattedReceivers({
            ...formData,
            selectedReceivers: receiver.recipients
          })
        ),
        // TODO: handle conversation connection
        // conversationId: configs.otherConfigs.isCreateMessageType
        //   ? null
        //   : receiver.conversationId,
        conversationId: null,
        conversationTitle,
        taskId: isSendFromTaskStep ? null : receiver.taskId,
        propertyId: receiver.propertyId,
        message,
        template: Boolean(
          configs.trudiButton?.action || configs.inputs?.prefillData?.action
        )
          ? message || template
          : null,
        files: this.getFileFromDynamicParam(
          formData.msgContent,
          receiver,
          calendarEventInTask
        ),
        messageContact
      };
    });

    return {
      ...commonPayload,
      recipients: transformedReceivers,
      isSendBulk: true,
      taskId: isSendFromTaskStep ? taskId : null,
      isFromCreateMessage: [
        ECreateMessageFrom.MULTI_TASKS,
        ECreateMessageFrom.CONTACT
      ].includes(createMessageFrom),
      sessionId: this.trudiSaveDraftService.getSessionId,
      draftMessageId: null
    };
  }

  private composeSchedulePayloadFormTaskHeader(
    formData: ITrudiSendMsgFormValue,
    calendarEvent: unknown[],
    taskId: string,
    formattedReceivers: IReceiver[],
    commonPayload: {
      conversationId: string;
      mailBoxId: string;
      propertyId: string;
      conversationTitle: string;
      options: { contacts: IContactInfo[] };
      files: IBodyFile[];
      action: string;
      actionId: string;
      isFromTrudiButton: boolean;
      sendFrom: string;
      reminderTimes: string[];
      draftMessageId?: string;
      contentCard?: string;
    },
    configs: ISendMsgConfigs,
    template: string
  ) {
    const message = this.handleReplaceReceiverInMess(
      formData,
      this.dataToPrefillForSendBulk,
      calendarEvent?.filter((event) => event['taskId'] === taskId) ?? []
    );

    const messageContact = message + commonPayload.contentCard;

    const { isAppMessage } = configs.inputs;
    const recipients = this.getReceiversInfo(formattedReceivers).map(
      (receiver) => {
        return {
          ...receiver,
          conversationType: isAppMessage
        };
      }
    );

    const { isReplyAction } = configs.otherConfigs;
    const isAbleToReply = isReplyAction && recipients?.length === 1;
    return {
      ...commonPayload,
      draftMessageId:
        commonPayload.draftMessageId ||
        this.trudiSaveDraftService.getDraftMsgId,
      conversationId: isAbleToReply
        ? formData.selectedReceivers?.[0]?.['conversationId']
        : null,
      taskId,
      message,
      template: Boolean(configs.trudiButton?.action)
        ? message || template
        : null,
      recipients,
      isSendBulk: false,
      isFromCreateMessage: false,
      messageContact
    };
  }

  private composeSchedulePayloadFormTaskStepSingleEmail(
    formData: ITrudiSendMsgFormValue,
    calendarEvent: unknown[],
    taskId: string,
    formattedReceivers: IReceiver[],
    commonPayload: {
      conversationId: string;
      mailBoxId: string;
      propertyId: string;
      conversationTitle: string;
      options: { contacts: IContactInfo[] };
      files: IBodyFile[];
      action: string;
      actionId: string;
      isFromTrudiButton: boolean;
      sendFrom: string;
      reminderTimes: string[];
      draftMessageId?: string;
      contentCard?: string;
    },
    configs: ISendMsgConfigs,
    template: string
  ) {
    const message = this.handleReplaceReceiverInMess(
      formData,
      this.dataToPrefillForSendBulk,
      calendarEvent?.filter((event) => event['taskId'] === taskId) ?? [],
      commonPayload.propertyId,
      formData.selectedReceivers
    );

    const messageContact = message + commonPayload.contentCard;

    const recipients = this.getReceiversInfo(formattedReceivers);
    return {
      ...commonPayload,
      conversationId:
        formattedReceivers.length === 1
          ? formattedReceivers?.[0]['conversationId']
          : null,
      draftMessageId:
        commonPayload.draftMessageId ||
        this.trudiSaveDraftService.getDraftMsgId,
      taskId,
      message,
      template: Boolean(configs.trudiButton?.action)
        ? message || template
        : null,
      recipients,
      isSendBulk: false,
      isFromCreateMessage: false,
      messageContact
    };
  }

  private composeSchedulePayloadFromScratch(
    formData: ITrudiSendMsgFormValue,
    formattedReceivers: IReceiver[],
    commonPayload: {
      conversationId: string;
      mailBoxId: string;
      propertyId: string;
      conversationTitle: string;
      options: { contacts: IContactInfo[] };
      files: IBodyFile[];
      action: string;
      actionId: string;
      isFromTrudiButton: boolean;
      sendFrom: string;
      reminderTimes: string[];
      draftMessageId: string;
      contentCard?: string;
    },
    configs: ISendMsgConfigs,
    template: string,
    taskId: string
  ) {
    const message = this.handleReplaceReceiverInMess(
      formData,
      this.dataToPrefillForSendBulk,
      []
    );

    const messageContact = message + commonPayload.contentCard;

    const hasTaskId = !!taskId;
    const isForwardFromTask = hasTaskId && configs.inputs.isForwardDocument;

    const recipients = this.getReceiversInfo(formattedReceivers);
    const isFromCreateMessage =
      [
        EMessageConversationType.VOICE_MAIL,
        EMessageConversationType.SMS
      ].includes(configs.otherConfigs.replyViaEmailFrom) || isForwardFromTask
        ? false
        : !configs.body.isFromInlineMsg;

    return {
      ...commonPayload,
      draftMessageId:
        commonPayload.draftMessageId ||
        this.trudiSaveDraftService.getDraftMsgId,
      taskId,
      message,
      template: Boolean(configs.trudiButton?.action)
        ? message || template
        : null,
      recipients,
      isFromCreateMessage: isFromCreateMessage,
      isFromInline: configs.body.isFromInlineMsg,
      isSendBulk: false,
      messageContact
    };
  }

  private composeSchedulePayloadAppMessage(
    formData: ITrudiSendMsgFormValue,
    calendarEvent: unknown[],
    taskId: string,
    formattedReceivers: IReceiver[],
    commonPayload: {
      conversationId: string;
      mailBoxId: string;
      propertyId: string;
      conversationTitle: string;
      options: { contacts: IContactInfo[] };
      files: IBodyFile[];
      action: string;
      actionId: string;
      isFromTrudiButton: boolean;
      sendFrom: string;
      reminderTimes: string[];
      draftMessageId?: string;
      isSendFromEmail?: boolean;
      contentCard?: string;
    },
    configs: ISendMsgConfigs,
    template: string
  ) {
    const message = this.handleReplaceReceiverInMess(
      formData,
      this.dataToPrefillForSendBulk,
      calendarEvent?.filter((event) => event['taskId'] === taskId) ?? []
    );

    const messageContact = message + commonPayload.contentCard;

    const { isCreateMessageType } = configs.otherConfigs;
    const recipients = this.getReceiversInfo(formattedReceivers);
    return {
      ...commonPayload,
      draftMessageId:
        commonPayload.draftMessageId ||
        this.trudiSaveDraftService.getDraftMsgId,
      taskId,
      message,
      template: Boolean(configs.trudiButton?.action)
        ? message || template
        : null,
      recipients,
      isSendBulk: false,
      isFromCreateMessage: isCreateMessageType,
      isSendFromEmail: false,
      conversationType: EConversationType.APP,
      isFromInline: !this.helper.isNewMessageCompose && true,
      messageContact
    };
  }

  sendMessageV2(
    body: ISendMsgPayload
  ): Observable<ISendMsgPayload | ISendMsgResponseV2> {
    return this.apiService.postAPI(conversations, 'new-message', body);
  }

  sendManyMessageV2(
    body: ISendManyMsgPayload
  ): Observable<ISendManyMsgPayload | ISendMsgResponseV2[]> {
    return this.apiService.postAPI(conversations, 'new-many-message', body);
  }

  getCalendarEventFromConfig(configs: ISendMsgConfigs) {
    if (
      !configs.otherConfigs?.calendarEvent?.sendCalendarEvent ||
      !configs?.otherConfigs?.calendarEvent?.calendarEventId
    )
      return [];
    return [configs?.otherConfigs.calendarEvent];
  }

  automateSimilarReplies(
    body: IAutomateSimilarRepliesPayload
  ): Observable<IAutomateSimilarRepliesResponse> {
    return this.apiService.postAPI(
      conversations,
      'create-automated-record',
      body
    );
  }
}
