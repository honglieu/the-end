import {
  EContactType,
  EStepAction
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { ActionSendMsgDropdown } from '@/app/routine-inspection/utils/routineType';
import {
  PreviewConversation,
  IParticipant,
  UserConversation,
  Participant
} from '@shared/types/conversation.interface';
import { IFile } from '@shared/types/file.interface';
import { RoutineInspectionResponseInterface } from '@shared/types/routine-inspection.interface';
import {
  IDataApplicationShortlistVariable,
  PhotoType,
  TaskItem,
  TaskTemplate
} from '@shared/types/task.interface';
import { ITenancyInvoiceResponse } from '@shared/types/tenancy-invoicing.interface';
import {
  BreachNoticeTrudiResponse,
  LeaseRenewalRequestTrudiResponse,
  LeasingRequestTrudiResponse,
  PetRequestTrudiResponse,
  TrudiButton,
  TrudiResponse
} from '@shared/types/trudi.interface';
import {
  IUserPropertyContactType,
  TargetFromFormMessage
} from '@shared/types/user.interface';
import { ILettingRecommendationFormType } from '@/app/task-detail/modules/steps/communication/letting-recommendation/letting-recommendation.component';
import {
  IEssentialData,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import { ILeaveNoticeDetail } from '@/app/tenant-vacate/utils/tenantVacateType';
import { sendOptionType } from '@/app/trudi-send-msg/components/trudi-send-msg-header/components/trudi-send-option-menu/trudi-send-option-menu.component';
import { IGetListContactTypeResponse } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { ECreateMessageFrom, EReceiverType } from './trudi-send-msg.enum';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import {
  ITaskInfoToGetDataPrefill,
  ITaskRow,
  ITasksForPrefillDynamicData
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { IMessage } from '@shared/types/message.interface';
import { EDefaultBtnDropdownOptions } from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import { ICommunicationStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import {
  EContactCardOpenFrom,
  EMailBoxStatus,
  EMailBoxType,
  ERecognitionStatus,
  TaskType
} from '@shared/enum';
import { ReiFormData } from '@shared/types/rei-form.interface';
export enum EFooterButtonType {
  NORMAL = 'NORMAL',
  DROPDOWN = 'DROPDOWN'
}

export enum ETrudiSendMsgBtn {
  BACK = 'BACK',
  NEXT = 'NEXT',
  NEXT_DROPDOWN = 'NEXT_DROPDOWN'
}

export enum ESentMsgEvent {
  SUCCESS = 'SUCCESS',
  ERR = 'ERR',
  COMPLETED = 'COMPLETED',
  SENDING = 'SENDING'
}

export enum ETypeMessage {
  CONTACT = 'CONTACT',
  SCRATCH = 'SCRATCH'
}

export interface ISendMsgResponse {
  conversationId?: string;
}

export interface ISendMsgResponseV2 {
  conversation: PreviewConversation;
  message: IMessage;
  task: ITaskRow;
  emailMessage?: IEmailMessage;
}

export interface ISendEmailExternal {
  externalSendTo: string;
  msgContent: string;
  msgTitle: string;
}

export interface ISendMsgSchedule {
  mailboxId: string;
  jobReminders: IJobReminder[];
}

export interface IJobReminder {
  taskId: string;
  conversationId: string;
  taskType?: TaskType;
}

export interface ISendScheduleMsgResponse {
  trudiResponse?:
    | TrudiResponse
    | ITenancyInvoiceResponse
    | LeaseRenewalRequestTrudiResponse
    | PetRequestTrudiResponse
    | RoutineInspectionResponseInterface
    | LeasingRequestTrudiResponse
    | BreachNoticeTrudiResponse;
}

export enum ISendMsgType {
  BULK = 'send-bulk-message',
  BULK_EVENT = '/send-bulk-message-with-event',
  V3 = 'v3/message',
  EVENT_EDIT_SCHEDULED_MSG = 'edit-event-message',
  SCHEDULE_MSG = 'send-schedule-msg',
  V3_AND_BULK = 'v3_and_bulk',
  EXTERNAL = ' external',
  V3_EVENT = 'v3/message-with-event',
  BULK_EVENT_AND_V3_EVENT = '/send-bulk-and-v3-message-with-event',
  NEW_MESSAGE = '/new-message'
}

export interface ISendMsgBodyMap {
  [ISendMsgType.BULK]: IBulkMsgBody;
  [ISendMsgType.BULK_EVENT]: IBulkMsgBody;
  [ISendMsgType.V3]: IV3MsgBody;
  [ISendMsgType.V3_EVENT]: IV3MsgBody;
  [ISendMsgType.EVENT_EDIT_SCHEDULED_MSG]: IEventEditScheduledMsg;
  [ISendMsgType.SCHEDULE_MSG]: IEventEditScheduledMsg;
  [ISendMsgType.V3_AND_BULK]: IV3MsgBody | IBulkMsgBody;
  [ISendMsgType.EXTERNAL]: {}; // not use -> currently emitting value to parent component
  // add more types here as needed
  [ISendMsgType.BULK_EVENT_AND_V3_EVENT]: {};
  [ISendMsgType.NEW_MESSAGE]: ISendMsgResponseV2;
}

export interface IEventSendScheduledMsg {}

export interface IEventEditScheduledMsg {
  taskId?: string;
}

export interface IBulkMsgBody {
  actionLink: any[];
  file: IBodyFile[];
  message: IBulkMsg[];
  isResolveConversation: boolean;
  reminderTimes?: string[];
  action?: string;
  calendarEventId?: string;
  reiFormIds?: (string | undefined)[];
  mailBoxId: string;
  sendOption?: sendOptionType;
  taskId?: string;
}

export interface IBulkEventMsgBody extends IBulkMsgBody {
  isForwardDocument: boolean;
  isCreateMessageType: boolean;
  agencyId: string;
  summary: string;
  mailBoxId: string;
}

export interface IBodyFile {
  documentTypeId: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  mediaLink: string;
  propertyId: string;
  propertyIds: any[];
  name?: string;
  extension?: string;
  parentId?: string;
  uploading?: boolean;
  localId?: string;
}

export interface IBulkMsg {
  categoryId: string;
  propertyId: string;
  status: string;
  userId: string;
  personUserId: string;
  personUserType: string;
  personUserEmail: string;
  categoryMessage: string;
  contentMessage: string;
  taskId: string;
  contacts?: IContactInfo[];
}

export interface IContactInfo {
  title: string;
  address: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  phoneNumber: string;
  email: string;
  landingPage: string;
  tempId?: string;
  type?: string;
}

interface IOptionParams {
  contacts: IContactInfo[];
}

export interface ITextMessagesV3 {
  message: string;
  userId: string;
  isSendFromEmail: boolean;
  conversationId: string;
  optionParam: IOptionParams;
  newConversationTitle: string;
}

export interface IV3MsgBody {
  textMessages: ITextMessagesV3[];
  files: IBodyFile[];
  isResolveConversation: boolean;
  reminderTimes?: string[];
  action: string;
  stepId?: string;
  calendarEventId?: string;
  mailBoxId: string;
  agencyId?: string;
  taskId?: string;
}

export interface ISendMsgTriggerEvent {
  type?: ISendMsgType;
  event: ESentMsgEvent;
  conversationId?: string;
  mailBoxId?: string;
  data?:
    | ISendMsgResponse
    | ISendScheduleMsgResponse
    | MultiSendMsgResponse[]
    | ISendMsgResponse[]
    | ISendEmailExternal
    | ISendMsgPayload
    | ISendManyMsgPayload
    | ISendMsgResponseV2
    | ISendMsgSchedule;
  receivers?: ISelectedReceivers[];
  isDraft?: boolean;
  draftMsgId?: string;
  reminderType?: string;
}

export interface MultiSendMsgResponse {
  type: ISendMsgType;
  data: ISendMsgResponse[];
}

export interface ISendMsgHeaderConfigs {
  icon: string;
  title: string;
  closeIcon: string;
  showCloseBtn: boolean;
  showDropdown: boolean;
  hideSelectProperty: boolean;
  isPrefillProperty?: boolean;
  isChangeHeaderText?: boolean;
  viewRecipients?: boolean;
}

export interface ISendMsgConfigs {
  header: ISendMsgHeaderConfigs;
  body: {
    tinyEditor: {
      attachBtn: ITrudiSendMsgAttachBtnConfig;
      isShowDynamicFieldFunction?: boolean;
    };
    title: {
      maxCharacter: number;
    };
    isFromInlineMsg: boolean;
    receiver?: {
      isShowContactType?: boolean;
      prefillSelectedTypeItem?: boolean;
    };
    prefillReceivers: boolean;
    prefillReceiversList: ISelectedReceivers[];
    prefillContactCard?: ISelectedReceivers[];
    receiverTypes: string[] | null;
    prefillReceiverTypes?: EContactType[] | null;
    prefillContactCardTypes?: EContactType[] | null;
    prefillMediaFiles: boolean;
    prefillTitle: string;
    prefillPhotoFiles?: PhotoType[];
    contactCard: {
      required: boolean;
    };
    timeSchedule: string;
    remiderSchedule: string;
    typeSendMsg: string;
    prefillSender?: string;
    hasEmailSignature: boolean;
    prefillExternalSendTo?: string;
    applyAIGenerated?: boolean;
    taskData?: ITaskDataSendToAI;
    defaultSendOption?: sendOptionType;
    isShowNegative?: boolean;
    isMultipleDynamicParameter?: boolean;
    prefillToCcBccReceiversList?: {
      to: IReceiver[];
      bcc: IReceiver[];
      cc: IReceiver[];
    };
    replyQuote?: string;
    replyToMessageId?: string;
    replyConversationId?: string;
    taskReplyId?: string;
    autoGenerateMessage: IAutoGenerateMessage;
    draftMessageId?: string;
    actionId?: string;
    ticketId?: string;
    isReplyTicketOfConversation?: boolean;
    isUrgentTicket?: boolean;
    prefillSenderEmail?: string;
    replyToMessageAI?: string;
    sessionId?: string;
  };
  footer: {
    buttons: {
      nextButtonType: EFooterButtonType;
      backTitle: string;
      nextTitle: string;
      dropdownList?: ActionSendMsgDropdown[];
      showBackBtn: boolean;
      showConfirmRecipientBackBtn: boolean;
      sendType: ISendMsgType | '';
      disableSendBtn?: boolean;
    };
  };
  otherConfigs: {
    senderTypes?: string[];
    isCreateMessageType: boolean;
    disabledReceivers: boolean;
    disabledTitle?: boolean;
    filterSenderForReply?: boolean;
    isShareCalendarEvent: boolean;
    calendarEvent: ITrudiSendMsgCalendarEventConfig;
    createMessageFrom: ECreateMessageFrom;
    replyViaEmailFrom?: EMessageConversationType;
    isForwardConversation: boolean;
    isValidSigContentMsg: boolean;
    isFromDraftFolder: boolean;
    isForwardOrReplyMsg: boolean;
    isReplyAction: boolean;
    isScheduleForSend: boolean;
    isShowSecondaryEmail?: boolean;
    conversationPropertyId?: string;
    openFromBulkCreateTask?: boolean;
    isFromContactPage?: boolean;
    replyMessage?: IMessage;
    isProspect?: boolean;
    isAutoPrefillDocument?: boolean;
    isStep?: boolean;
    filterSenderForReplyInTask?: boolean;
    scheduleDraft?: string;
    replyMessageInTask?: string[];
    isSendForward: boolean;
    isShowGreetingContent: boolean;
    isShowGreetingSendBulkContent: boolean;
    isReplyTicket?: boolean;
  };
  inputs: ISendMsgInputs;
  serviceData: ISendMsgServiceData;
  trudiButton?: TrudiButton | TrudiStep;
}

export interface ISendMsgInputs {
  selectedTasks?: ITasksForPrefillDynamicData[];
  selectedTasksForPrefill?: ITaskInfoToGetDataPrefill[];
  conversations?: UserConversation[];
  listOfFiles?: IFile[];
  rawMsg?: string;
  prefillVariables?: Record<string, string>;
  openFrom?: string;
  defaultBtnOption?: EDefaultBtnDropdownOptions;
  typeMessage?: string;
  listDynamicFieldData?: string[];
  prefillData?: ICommunicationStep;
  mailBoxIdFromCalender?: string;
  listUser?: ISelectedReceivers[];
  isAppUser?: boolean;
  isSyncedAttachment?: boolean;
  threadId?: string;
  attachmentSync?: Object;
  listContactCard?: ISelectedReceivers[];
  isInternalNote?: boolean;
  reiformData?: ReiFormData;
  taskTemplate?: TaskTemplate;
  appendBody?: boolean;
  isForwardDocument?: boolean;
  isAppMessage?: boolean;
  isSMSMessage?: boolean;
  isMessengerMessage?: boolean;
  isWhatsAppMessage?: boolean;
}

export interface ISendMsgServiceData {
  taskService: {
    currentTask: TaskItem;
  };
  conversationService: {
    listConversationByTask: UserConversation[];
    currentConversation: UserConversation;
  };
  trudiService: {
    trudiResponse: TrudiResponse;
  };
}

export interface IDefaultValueTrudiSendMsg {
  selectedSender: TargetFromFormMessage;
  selectedReceivers: ISelectedReceivers[] | IGetListContactTypeResponse[];
  msgTitle: string;
  selectedContactCard?: ISelectedReceivers[];
  attachMediaFiles: PhotoType[];
  listOfFiles: IFile[];
  isRequiredContactCard?: boolean;
  emailSignature?: boolean;
  externalSendTo?: string;
  ccReceivers?: ISelectedReceivers[];
  bccReceivers?: ISelectedReceivers[];
  property?: UserPropertyInPeople;
  selectedTasks?: ITaskInfoToGetDataPrefill[];
}

export interface ISelectedReceivers {
  id?: string; // receiver id
  conversationId?: string;
  isPrimary?: boolean;
  type: string;
  firstName?: string | null;
  lastName?: string | null;
  group?: string;
  iviteSent?: string | null;
  lastActivity?: string | null;
  phoneNumber?: string | null;
  email?: string;
  offBoardedDate?: string | null;
  contactType?: string;
  streetLine?: string;
  isAppUser?: boolean;
  landingPage?: string;
  idUserPropertyGroup?: string;
  mobileNumber?: string | null;
  disabled?: boolean;
  propertyId?: string;
  actualPropertyId?: string;
  typeInRm?: string;
  regionName?: string;
  shortenStreetLine?: string;
  userPropertyGroupLease?: {
    rentAmount?: number;
    leaseStart?: string;
    leasePeriod?: string;
    leaseEnd?: string;
    groupType?: string;
    groupName?: string;
  };
  secondaryEmail?: ISecondaryEmail;
  address?: string;
  isTemporary?: boolean;
  trudiUserId?: string | null;
  isEmail?: boolean;
  unidentifiedContact?: boolean;
  participants?: IParticipant[] | Participant[];
  userPropertyId?: string;
  secondaryEmailId?: string;
  userPropertyGroupStatus?: string;
  originalEmailName?: string;
  userPropertyType?: string;
  userType?: string;
  userPropertyContactType?: IUserPropertyContactType;
  recognitionStatus?: ERecognitionStatus;
  isFromSelectRecipients?: boolean;
  userTaskId?: string;
  userId?: string;
  taskId?: string;
  status?: string;
  openFrom?: EContactCardOpenFrom;
  displayContactType?: string;
  userTitle?: string;
  streetline?: string;
  name?: string;
}

export interface ISecondaryEmail {
  email: string;
  id: string;
  properyId: string;
  originalEmailName: string;
}

//Receiver from multi task send message modal
export interface IProcessedReceiver extends ISelectedReceivers {
  taskId: string;
  recipients: ISelectedReceivers[];
  conversations: Pick<PreviewConversation, 'participants' | 'userId'>;
  calendarEvents: ICalendarEvent[];
}

export interface ITrudiSendMsgFormValue extends IDefaultValueTrudiSendMsg {
  emailSignature: boolean;
  msgTitle: string;
  msgContent: string;
  textContent?: string;
  isResolveConversation: boolean;
  isCreateMessageType: boolean;
  sendOption: sendOptionType;
}

export type NestedObject = Record<string, any>;
export type UserConversationOption = TypeWithFields<Partial<UserConversation>>;

export interface ITrudiSendMsgAttachBtnConfig {
  disabled: boolean;
  attachOptions?: {
    disabledUpload: boolean;
    disabledCreateReiForm: boolean;
    disabledAddContact: boolean;
  };
}

export interface ITrudiSendMsgCalendarEventConfig {
  sendCalendarEvent: boolean;
  calendarEventId?: string;
  eventName?: string;
  date?: number;
}

export type TypeWithFields<T> = Omit<T, 'id'> & {
  id?: string;
  type?: string;
  propertyId?: string;
};

// btnListDropdownOrder

export type dropdownOrderType = {
  selected: number;
  position: number[];
};

export interface IBodySendToAI {
  taskId: string;
  agencyId: string;
  sendToType: EContactType[];
  stepType: EStepAction | string;
  stepName: string;
  taskTitle: string;
  emailTitle: string;
  senderUserId: string;
  taskSummary?: string;
  taskData?: ITaskDataSendToAI;
}

export interface ITaskDataSendToAI {
  ListSupplier?: ISupplierDataToAI[];
  essentialData?: IEssentialData;
  advanceData?: IAdvanceData;
}

export interface IDataContactCardVariable {
  name: string;
  address: string;
  emailAddress: string;
  phoneNumber: string;
  information?: string;
}

export interface ISupplierDataToAI {
  supplierName: string;
  contactNumber: string;
  emailAddress: string;
  website: string;
}

export interface IAdvanceData {
  bondReturnSummary?: IBondReturnSummary;
  captureBreakLeaseFee?: ICaptureBreakLeaseFee;
  captureCondition?: ICaptureCondition;
  captureInspectionAction?: ICaptureInspectionAction;
  captureLeaseTerm?: ICaptureLeaseTerm;
  bondAmountDue?: IBondAmountDue;
  captureAmountOwingToVacate?: ICaptureAmountOwingToVacate;
  applicationShortList?: IDataApplicationShortlistVariable;
  leaveNotice?: ILeaveNoticeDetail;
  entryReportDeadline: IEntryReportDeadline;
  capturePetBond: ICapturePetBond;
  lettingRecommend: ILettingRecommendationFormType;
  selectedEvent: {
    eventDate?: string;
    eventType?: string;
    eventName?: string;
    eventDateValue?: string;
    eventStatus?: string;
  };
}
export interface IBondReturnSummary {
  bondTenant: string;
  bondDeduct?: string;
  reasonDeduct?: string;
}

export interface ICaptureBreakLeaseFee {
  breakLeaseFee?: string;
  advertisingFee?: string;
  otherFeeName?: string;
  otherFeeAmount?: string;
}

export interface ICaptureCondition {
  condition?: string;
}

export interface ICaptureInspectionAction {
  tenantNote?: string;
  tenantAction?: string;
  ownerNote?: string;
  ownerFollowUp?: string;
}

export interface ICaptureLeaseTerm {
  leasePeriod?: string;
  leasePeriodType?: string;
  rentAmount?: string;
  rentState?: string;
  paymentPeriod?: string;
  bondState?: string;
  bondAmount?: string;
  bondIncreaseAmount?: string;
}
export interface IBondAmountDue {
  bondAmount: string;
}
export interface ICaptureAmountOwingToVacate {
  rentOwing: string;
  invoiceFees: string;
  notes: string;
}

export interface IEntryReportDeadline {
  entryDeadlineDate?: string | null;
}

export interface ICapturePetBond {
  bondAmount?: string;
}

export interface ISendMsgPayload {
  mailBoxId: string;
  agencyId?: string;
  propertyId: string;
  emailMessage: IEmailMessage;
  messageReply?: IEmailMessage | IMessage;
  actionFlags: {
    resolveConversation: boolean;
    pushToAgent?: boolean;
    agentJoin?: boolean;
  };
  isAutoSaveDraft?: boolean;
  step?: {
    stepId?: string;
    stepType?: string;
    action?: string;
    status?: string;
  };
}

export interface IEmailMessage {
  id?: string;
  tempIds?: string[];
  tempId?: string;
  title: string;
  content: string;
  textContent?: string;
  quote?: string;
  userId: string;
  recipients: IReceiver[];
  files: (IBodyFile | IFile)[];
  reiFormIds: string[];
  taskId: string;
  conversationId: string;
  calendarEventIds: string[];
  contacts: IContactInfo[];
  isSendFromEmail?: boolean;
  replyToMessageId?: string;
  draftMessageId?: string;
  isDraft?: boolean;
  replyConversationId?: string;
  taskReplyId?: string;
  isFromDraftFolder?: boolean;
  stepTask?: IStepTask;
  isForwardDocument?: boolean;
  ticketId?: string;
  isReplyTicketOfConversation?: boolean;
  conversationType?: EMessageConversationType;
  isUrgentTicket?: boolean;
  messageContact?: string;
  sendOptions?: sendOptions;
}

interface sendOptions {
  time: string;
  type: string;
}

export enum EMessageConversationType {
  APP = 'APP',
  EMAIL = 'EMAIL',
  VOICE_MAIL = 'VOICE_MAIL',
  SMS = 'SMS',
  MESSENGER = 'MESSENGER',
  WHATSAPP = 'WHATSAPP'
}

export interface IStepTask {
  stepType: string;
  action: string;
}
export interface IReceiver {
  userId: string;
  userPropertyId: string;
  propertyId?: string;
  userType?: string;
  email?: string;
  secondaryEmail?: string;
  secondaryEmailId?: string;
  firstName?: string;
  lastName?: string;
  type?: EReceiverType[];
  isPrimary?: boolean;
  isTemporary?: boolean;
  name?: string;
}

export interface IFromUserMailBox extends TargetFromFormMessage {
  mailBoxId: string;
  mailBoxName: string;
  mailBoxAddress: string;
  type: EMailBoxType;
  status: EMailBoxStatus;
}

export interface ISendManyEmailMsg {
  propertyId: string;
  emailMessage: IEmailMessage;
}

export interface ISendManyMsgPayload
  extends Omit<ISendMsgPayload, 'emailMessage' | 'propertyId'> {
  emailMessages: ISendManyEmailMsg[];
  sessionId?: string;
}

export interface IAutoGenerateMessage {
  receiverIds: string[];
  description: string;
  isFollowUpReply: boolean;
}

export interface IConfirmRecipientContactGroupData {
  taskId: string;
  propertyId: string;
  streetLine?: string;
  recipients: ISelectedReceivers[];
}

export interface IContactInfoPrefill {
  propertyId: string;
  streetLine: string;
}

export interface IAutomateSimilarRepliesPayload {
  question: string;
  answer: string;
  mailBoxId: string;
}

export interface IAutomateSimilarRepliesResponse {
  answerId: string;
  questionId: string;
  hasAnswerIdSimilarRecords: boolean;
}
