import { IFile } from '@shared/types/file.interface';
import {
  LeaseRenewalDecision,
  LeaseRenewalRequestButtonAction
} from '@shared/enum/lease-renewal-Request.enum';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { KeywordIntent, PreviewConversation } from './conversation.interface';
import { MaintenanceJobResponse } from './send-maintenance.interface';
import {
  EDirectionSort,
  ETrudiRaiseByType,
  ETrudiType
} from '@shared/enum/trudi';
import {
  PetRequestButtonAction,
  PetRequestState,
  PetRequestStatus
} from '@shared/enum/petRequest.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { ReiFormData } from './rei-form.interface';
import { TrudiSuggestion } from './trudi-suggestion.interface';
import { TaskNameId } from '@shared/enum/task.enum';
import {
  IFileInvoice,
  ITaskDetail,
  PhotoType,
  TaskName,
  TaskItemDropdown
} from './task.interface';
import { EEmergencyButtonAction } from '@/app/emergency-maintenance/utils/emergencyType';
import {
  EInvoiceStatus,
  TenancyInvoice,
  TenancyInvoiceSyncJob
} from './tenancy-invoicing.interface';
import { UnhappyStatus } from './unhappy-path.interface';
import {
  ESmokeAlarmButtonAction,
  IPropertyNoteForm
} from '@/app/smoke-alarm/utils/smokeAlarmType';
import { EGeneralComplianceButtonAction } from '@/app/general-compliance/utils/generalComplianceType';
import { Suppliers } from './agency.interface';
import {
  ETenantVacateButtonAction,
  IInspectionForm,
  ITenantVacateForm
} from '@/app/tenant-vacate/utils/tenantVacateType';
import { ReminderTimeDetail } from './routine-inspection.interface';
import {
  LeasingDecision,
  LeasingRequestButtonAction,
  LeasingStepIndex,
  LeasingStepTitle
} from '@shared/enum/leasing-request.enum';
import { IngoingInspectionStatus } from '@shared/enum/ingoing-inspection.enum';
import {
  IngoingInspectionCard,
  IngoingInspectionSync
} from './ingoing-inspection.interface';
import {
  IAddTenancyJob,
  IPreferredContactMethod
} from '@/app/leasing/utils/leasingType';
import { Compliance } from './compliance.interface';
import { IWidgetLease } from '@/app/task-detail/utils/functions';
import { BreachNoticeRequestButton } from '@/app/breach-notice/utils/breach-notice.type';
import {
  BreachNoticeRequestButtonAction,
  BreachNoticeStepTitle
} from '@/app/breach-notice/utils/breach-notice.enum';
import { OutgoingInspectionSync } from './outgoing-inspection.interface';
import { PaymentPeriod, PeriodType } from '@/app/leasing/utils/leasing.enum';
import { EStepAction } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import {
  EConversationType,
  ECreatedFrom,
  EMessageProperty
} from '@shared/enum';
import { ENoteToolbarAction } from '@/app/task-detail/modules/internal-note/utils/internal-note.enum';

export interface Header {
  text: string;
  ptNotification: PropertyTreeNotification;
  ticket: TrudiResponseTicket;
  email: string;
  phoneNumber: string;
  identifiedEmail?: string;
}

export interface Options {
  ticketCategoryId: string;
  text: string;
  status: string;
  mediaUploadUI: boolean;
  conversationTopic: string;
}

export interface TrudiResponseTicket {
  id: string;
  userId: string;
  message: string;
  createdAt: Date;
  options: Options;
  messageType: string;
  ticketFiles: any[];
  firstName: string;
  lastName: string;
  googleAvatar?: string;
  userCreateTicketTitle: string;
  isPrimary: boolean;
  type: string;
}

export interface TrudiResponseTaskTicket extends TrudiResponseTicket {
  userCreateTicketFirstName: string;
  userCreateTicketLastName: string;
  userCreateTicketAvatar: string;
}

export interface PropertyTreeNotification {
  title: string;
  note: string;
}

export interface InfoAdditionButtonAction {
  title?: string;
  address: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  website?: string;
  disabled?: boolean;
  mobileNumber: string;
  type?: EUserPropertyType;
}

export interface TrudiButtonBase {
  type: string;
  text?: string;
  name?: string;
  action: string | EStepAction;
  status: TrudiButtonEnumStatus;
  isCompleted?: boolean;
  reminderTimes?: ReminderTimeDetail[];
}

export interface TrudiButton extends TrudiButtonBase {
  statusToShow: Array<string>;
  color?: string;
  isProPlan?: boolean;
  nextStep?: number;
  hint?: string;
  syncStatus?: string;
  isFrozen: boolean;
  textForward?: string;
  textForwards?:
    | string[]
    | {
        isSavedEdit: boolean;
        textForward: string;
      }[];
  conversation?: TrudiFowardLandlordSelected[];
  tenant?: InfoAdditionButtonAction;
  disable?: boolean;
  index: number;
  isSavedEdit?: boolean;
  option?: {
    index: number;
    textForwards: string[];
    title: string;
    textForward: string;
  }[];
  reiFormInfor?: ReiFormData;
  componentType?: string;
  isRequired?: boolean;
  disabled?: boolean;
  id?: string;
}

export interface TrudiResponseVariable {
  firstName: string;
  propertyAddress: string;
  agencyName: string;
  endDate: string;
  consoleUserName: string;
  theirTitle: string;
  files: IFile[];
}

export interface PetRequestTrudiReceiver {
  id: string;
  firstName: string;
  lastName: string;
  userPropertyType: EUserPropertyType;
  conversationId?: string;
  action?: PetRequestButtonAction;
  raiseBy?: string;
}

export interface MaintenanceDecision {
  button: TrudiButton[];
  decision: string;
  index: number;
  text: string;
  dataE2e?: string;
  syncJob?: TenancyInvoiceSyncJob;
}
export interface TrudiBody {
  text?: string;
  button: TrudiButton[];
  decisions: MaintenanceDecision[];
  decisionText?: string;
  suggestions?: TrudisSggestions;
  newSuggestion?: NewSuggestion;
  variable: TrudiResponseVariable;
  isOnceTimeChoice?: boolean;
  listKeywords?: KeywordIntent[];
  isSavedEdit?: boolean;
  unhappyStatus?: UnhappyStatus;
  isUnHappyPath?: boolean;
  isSuperHappyPath?: boolean;
  isUnindentifiedEmail?: boolean;
  isUnindentifiedPhoneNumber?: boolean;
  isUnindentifiedProperty?: boolean;
  isUnVerifiedPhoneNumber?: boolean;
  propertyIdSelected?: string;
  userIdSelected?: string;
  isProvidedOtp?: boolean;
}

export interface TrudisSggestions {
  data: TrudiData[];
  setting: Setting;
  type: string;
}

export interface NoteSync {
  syncStatus: string;
  status: string;
  raiseOn: string;
  lastTimeSync: string;
  description: string;
  categoryId: string;
  noteEntityType: string;
  error: string;
}

export interface TrudiData {
  step: number;
  isCompleted: boolean;
  header: Header;
  body: TrudiBody;
  complianceCategoryId: string;
  maintenanceJob: MaintenanceJobResponse;
  decisionIndex?: number;
  isConfirmDecision?: boolean;
  noteSync?: NoteSync;
  isCompliance?: boolean;
  variable?: TrudiVariable;
  taskDetail: ITaskDetail | TaskDetailPet;
  invoice?: TenancyInvoice[];
  invoices?: TenancyInvoice[];
  invoiceStatus: EInvoiceStatus;
  reason?: string;
  contact?: Suppliers;
  invoiceSyncJob?: TenancyInvoiceSyncJob;
  syncJob: TenancyInvoiceSyncJob;
  region?: Regions;
  listComplianceSyncFail?: Compliance[];
  syncPTOutGoingInspection: {
    data?: IInspectionForm;
    syncStatus?: string;
    errorMessSync?: string;
  };
  outgoingInspectionCard: OutgoingInspectionAppointmentCard;
  outGoingInspectionSyncJob?: OutgoingInspectionSync;
}

export interface Regions {
  id: string;
  name: string;
  alias?: string[];
}

export interface TrudiVariable {
  files: PhotoType[];
  maintenanceObject: any;
  maintenanceJob: MaintenanceJobResponse;
  receivers: TrudiReceivers[];
  raiseByUser: InfoAdditionButtonAction;
  raiseByAgent?: InfoAdditionButtonAction[];
  text: string;
  petType: string;
  emergencyEvent?: string;
  params?: {};
  tenancyId?: string;
  tenancy?: TrudiVariableTenancy;
  endTime: string;
  startTime: string;
  noteId?: string;
  dataComplaine?: IPropertyNoteForm;
  vacateDetail?: ITenantVacateForm;
  vacateDateVariable: IPropertyNoteForm;
  breachRemedyEventId?: string;
}
export interface TrudiVariableTenancy {
  idPropertyTree: string;
  name: string;
  userPropertyGroupLeases: UserPropertyGroupLeases;
}

export interface TrudiReceivers {
  id: string;
  firstName: string;
  lastName: string;
  userPropertyType: EUserPropertyType;
  conversationId?: string;
  action?:
    | ForwardButtonAction
    | EEmergencyButtonAction
    | ESmokeAlarmButtonAction
    | EGeneralComplianceButtonAction
    | ETenantVacateButtonAction;
  raiseBy?: string;
  checked: boolean;
  agencyId: string;
  companyName: string;
  contactName: string;
  createdAt: string;
  emergencyPhoneNumber: string;
  landingPage: string;
  phoneNumber: string;
  type: string;
  title: string;
  updatedAt: string;
  website: string;
  email: string;
  googleAvatar: string;
  mobileNumber: string;
  lastActivity: string;
  isPrimary: boolean;
  inviteSent: string;
  offBoarded: string;
  suppliers?: Suppliers[];
  noticeToLeaveDate?: string;
}

export interface Setting {
  categoryId: string;
  trudiResponseId: string;
  taskNameId: TaskNameId;
}

export interface Task extends TaskItemDropdown {
  id: TaskNameId;
  name: string;
  conversationCategoryId?: string;
  conversationCategoryName?: string;
  isEnable?: boolean;
  trudiResponse?: TrudiResponse;
}
export interface NewSuggestion {
  trudiResponse: TrudiSuggestion;
  convertToTask: TaskName;
  suggestedTask: TaskName[];
  type: ETrudiType;
}

export interface TrudiResponse {
  type: ETrudiType | string;
  raiseVia: ETrudiRaiseByType;
  lastIntentUpdate?: LastIntentUpdate;
  data: TrudiData[];
  setting: Setting;
  addTenancyJob?: IAddTenancyJob;
  syncData?: IWidgetLease[];
  isTemplate?: boolean;
  summaryNote?: string;
  summaryPhotos?: PhotoType[];
  hasAISummary?: boolean;
  conversations?: PreviewConversation[];
}

export interface IDataSync {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  rent: number;
  effectiveDate: string;
  currentLeaseExpires: string;
  remainingDay: string;
  frequency: string;
  category: string;
  description: string;
  file?: File[];
  errorSync: string;
}

export interface LastIntentUpdate {
  id: string;
  name: string;
  taskName: string;
  topic: string;
}

export interface PetRequestTrudiResponse {
  type: ETrudiType | string;
  data: PetRequestTrudiData[];
  setting: Setting;
  startConversationId?: string;
  isTemplate?: boolean;
}

export interface PetRequestTrudiData {
  addNoteJob: AddNoteJob;
  step: number;
  isCompleted: boolean;
  header: Header;
  body: PetRequestTrudiBody;
  taskDetail: TaskDetailPet;
  maintenanceJob: MaintenanceJobResponse;
  state: PetRequestState;
  variable: TrudiResponseVariable;
}

export interface InvoiceTrudiData {
  invoiceStatus: string;
  step: number;
  isCompleted: boolean;
  invoice: IFileInvoice[];
  body?: PetRequestTrudiBody;
  syncJob: IInvoiceSyncJob;
  variable: TrudiResponseVariable;
}
export interface IInvoiceSyncJob {
  invoices: IFileInvoice[];
  syncStatus: string;
  syncDate: string;
  errorMessSync: string;
}

export interface TaskDetailPet {
  raisedBy: PetRequestTrudiReceiver;
  userPropertyType: EUserPropertyType;
  petType: string[];
  condition?: string;
  description?: any;
  photos?: PhotoType[];
  receivers: PetRequestTrudiReceiver[];
  textForward: string;
}
export interface AddNoteJob {
  status: string;
  lastModifiedAt: string;
  categoryId: string;
  description: string;
}

export interface PetRequestTrudiBody {
  bondAmount: PetBond;
  text?: string;
  button: PetRequestButton[];
  variable: TrudiResponseVariable;
  status: PetRequestStatus;
  listKeywords?: KeywordIntent[];
}

export interface TrudiResponseVariable {
  '{tenant name}'?: string;
  '{maintenance issue}'?: string;
  '{landlord name}'?: string;
  '{amount}'?: string;
  '{supplier name}'?: string;
  '{property address}'?: string;
  '{receiver name}'?: string;
  '{number of quote}'?: string;
  '{number of supplier}'?: string;
  '{Name}'?: string;
  '{Role}'?: string;
  '{Agency}'?: string;
  '[tenant/landlord]': string[];
  '{agency address}': string;
  '{agency name}': string;
  '{frequency}': string;
  '{lease end}': string;
  '{lease start}': string;
  '{rent amount}': string;
  '{requester}': string;
  '{document type}': string;
}

export interface TrudiFowardLandlordSelected {
  conversationId?: string;
  userId: string;
  checked: boolean;
  firstName: string;
  groupId: string;
  id: string;
  inviteSent: string;
  isPrimary: boolean;
  lastActivity: string;
  lastName: string;
  propertyId: string;
  status: string;
  type: string;
  userPropertyId: string;
}

export interface Intents {
  id: string;
  name: string;
  taskName: string;
  topic: string;
  titleOfTopic?: string;
}

export interface ListTrudiContact {
  email?: string;
  firstName: string;
  id: string;
  lastName: string;
  property: Property;
  userPropertyId: string;
  userPropertyType: EUserPropertyType;
  userType: string;
  fullName?: string;
  propertyTypeOrAddress?: string;
  contactType?: string;
}

export interface ResponseTrudiContact {
  contacts: ListTrudiContact[];
  totalPage: number;
  currentPage: number;
}

export interface OnSearchValueEmitter {
  search: string;
  page: number;
  limit: number;
}

interface Property {
  address: string;
  id: string;
  postCode: string;
  state: string;
  streetline: string;
  suburb: string;
  unitNo: string;
  region?: Regions;
}

export interface PetRequestButton extends TrudiButtonBase {
  index: number;
  isFrozen: boolean;
  statusToShow?: PetRequestStatus[];
  textForward?: any;
  addNoteJobStatus?: SyncMaintenanceType;
  isSavedEdit?: boolean;
  reiFormInfor?: ReiFormData;
  reminderTimes: ReminderTimeDetail[];
}

export interface PetBond {
  value: string;
  isSkiped: boolean;
}

//lease renewal type
export interface LeaseRenewalRequestButton extends TrudiButtonBase {
  index: number;
  isFrozen: boolean;
  statusToShow?: LeaseRenewalDecision[];
  textForward?: string;
  textForwards?: string[];
  isSavedEdit?: boolean;
  leaseStatus?: string;
  option?: {
    index: number;
    textForwards: string[];
    title: string;
    textForward: string;
  }[];
  reiFormInfor?: ReiFormData;
  dataE2e?: string;
  leasingStepIndex?: LeasingStepIndex;
}

export interface LeasingRequestButton extends TrudiButtonBase {
  TextDocUpload?: string;
  isCompleted?: boolean;
  index: number;
  isFrozen: boolean;
  statusToShow?: LeasingDecision[];
  textForward?: string | LeasingTextForwardType;
  regionalFormName: {
    [key: string]: string;
  };
  textForwards?: string[];
  isSavedEdit?: boolean;
  leaseStatus?: string;
  option?: {
    index: number;
    textForwards: string[];
    title: string;
    textForward: string;
  }[];
  reiFormInfor?: ReiFormData;
  dataE2e?: string;
  leasingStepIndex: LeasingStepIndex;
  attachedDocuments?: string;
  emailAttachmentMessage?: string;
}

export interface LeasingTextForwardType {
  NEW_LEASE: string;
  RELET: string;
  FORM_SENT_AS_ATTACHMENT_TO_OUTGOING_MESSAGE?: string;
  FORM_SENT_VIA_DOCUSIGN?: string;
  NO_FORM_ATTACH?: string;
}

export interface LeasingRequestCategoryButton {
  button: LeasingRequestButton[];
  title: LeasingStepTitle;
  index: number;
}

export interface MaintenanceRequestButton extends TrudiButtonBase {
  index: number;
  isFrozen: boolean;
  statusToShow?: LeaseRenewalDecision[];
  textForward?: string;
  textForwards?: string[];
  isSavedEdit?: boolean;
  leaseStatus?: string;
  option?: {
    index: number;
    textForwards: string[];
    title: string;
    textForward: string;
  }[];
  reiFormInfor?: ReiFormData;
  dataE2e?: string;
}

export interface LeaseRenewalRequestTrudiResponse {
  type: ETrudiType | string;
  data: LeaseRenewalRequestTrudiData[];
  leaseRenewalCard: AppointmentCard;
  setting: Setting;
  isTemplate?: boolean;
  leaseTerm?: ICaptureLeaseTermResponse;
}
export interface ICaptureLeaseTermResponse {
  rentedAt?: RentedAt;
  leasePeriod?: number;
  leasePeriodType?: LeasePeriodType;
  rentAmount?: number;
  frequency?: FrequencyRental;
  bondAt?: string;
  bondAmount?: number;
  bondIncreaseAmount?: number;
  description?: string;
  tenancyId?: string;
  isNotApplicable?: boolean;
}
export interface UserPropertyGroupLeases {
  arrearsAmount: number;
  arrearsType: string;
  bondAccountId: string | null;
  bondAmount: number | null;
  bondAmountLodgedDirect: number | null;
  bondSubmitted: string | null;
  chargeNewTenancyFee: string | null;
  daysInArrears: number;
  dueDay: number;
  endDate: string;
  frequency: string;
  id: string;
  idUserPropertyGroup: string;
  lastTaskTrigger: null;
  lastTrigger: null;
  leasePeriod: string;
  leasePeriodType: string;
  nextRentReview: null;
  originalLeaseStartDate: string;
  paidTo: string;
  rentAmount: number;
  rentDescription: null;
  rentStartDate: null;
  startDate: string;
  vacateDate: null;
  waterChargeTenant: boolean;
}

interface IUserProperty {
  id: string;
  userId: string;
  type: string;
  propertyAgreementId: string;
  status: string;
  vacatedAt: string;
  propertyId: string;
  isPrimary: boolean;
  idUserPropetyTree: string;
  idUserPropertyGroup: string;
  idMRI: string;
  isPropertyManagerContact: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    type: string;
    mobileNumber: string;
    phoneNumber: string;
  };
  property: {
    id: string;
    unitNo: string;
    streetNumber: string;
    streetline: string;
    shortenStreetline: string;
    suburb: string;
    state: string;
    postCode: string;
    country: string;
  };
}

export interface ITenancy {
  idPropertyTree: string;
  name: string;
  userPropertyGroupLeases: UserPropertyGroupLeases;
  userProperties?: IUserProperty[];
}
export interface LeasingResponseVariable {
  endTime: string;
  params: {
    '{property address}': string;
  };
  raiseByUser: {};
  receivers: [];
  startTime: string;
  tenancy: ITenancy;
}

export interface AddTenancyJob {
  doNotChargeNewTenancyFees: string;
  leaseEndDate: string;
  leasePeriod: string;
  leasePeriodType: PeriodType;
  leaseStartDate: string;
  nextRentReview: string;
  originalLeaseStartDate: string;
  paymentPeriod: PaymentPeriod;
  rentAmount: number;
  rentDescription: string;
  rentStartDate: string;
  tenancyName: string;
  securityDeposit: {
    accountId: string;
    accountName: string;
    amount: number;
    amountLodgedDirect: number;
  };
  preferredContactMethod: IPreferredContactMethod;
}
export interface LeasingRequestTrudiResponse {
  inspectionId: string;
  addTenancyJob: {
    data: AddTenancyJob;
    errorMessSync: string;
    lastTimeSync: string;
    syncDate: string;
    syncStatus: string;
    isTemplate?: boolean;
  };
  type: ETrudiType | string;
  data: LeasingRequestTrudiData[];
  ingoingInspectionSyncJob: IngoingInspectionSync;
  leaseStartCard: LeaseStartAppointmentCard;
  inspectionStatus: IngoingInspectionStatus;
  ingoingInspectionCard: IngoingInspectionCard;
  setting: Setting;
  variable: TrudiVariable;
}

export interface LeasingWidgetRequestTrudiResponse {
  action: ENoteToolbarAction;
  createdAt: string;
  data: AddTenancyJob;
  deletedAt: string;
  errorMessSync: string;
  id: string;
  propertyId: string;
  syncDate: string;
  syncStatus: string;
  taskId: string;
  updatedAt: string;
  tenancyId?: string;
  tenancy?: TrudiVariableTenancy;
  firstTimeSyncSuccess?: boolean;
}

export interface BreachNoticeCategoryButton {
  button: BreachNoticeRequestButton[];
  title: BreachNoticeStepTitle;
  index: number;
}

export interface BreachNoticeRequestTrudiBody {
  text?: string;
  breachNoticeSteps: BreachNoticeCategoryButton[];
}

export interface BreachNoticeRequestTrudiData {
  body: BreachNoticeRequestTrudiBody;
  isCompleted: boolean;
  taskDetail?: ITaskDetail;
}

export interface BreachNoticeTrudiResponse {
  notesSyncJob: {
    data: any;
    errorMessSync: string;
    lastTimeSync: string;
    syncDate: string;
    syncStatus: string;
  };
  type: ETrudiType | string;
  data: breachNoticeRequestTrudiData[];
  arrearCard: any;
  setting: Setting;
  variable: TrudiVariable;
}

export interface breachNoticeRequestTrudiData {
  isCompleted?: boolean;
  body: any;
}

export interface BreachNoticeRemedyCardBody {
  type: string;
  reason: string;
  remedyDate: Date;
  eventId?: string;
}

export interface BreachNoticeRemedyCardResponse {
  type: string;
  reason: string;
  remedyDate: string;
  active?: boolean;
}

export interface LeasingRequestButtonIndex {
  title: string;
}

export interface LeaseRenewalRequestTrudiData {
  step: number;
  isCompleted: boolean;
  isTriggerByPT: boolean;
  header: Header;
  body: LeaseRenewalRequestTrudiBody;
  maintenanceJob: MaintenanceJobResponse;
  variable: LeaseRenewalRequestTrudiVariable;
  decisionIndex: number;
  isConfirmDecision: boolean;
  leaseRenewalSync: LeaseRenewalSync;
  taskDetail: ITaskDetail;
}
export interface LeasingRequestTrudiData {
  body: LeasingRequestTrudiBody;
  isCompleted: boolean;
  taskDetail?: ITaskDetail;
}

export interface LeaseRenewalSync {
  remainingDay: number;
  regionName: string;
  firstTitle: string;
  syncStatus: string;
  status: string;
  currentLeaseExpires: string;
  secondTitle: string;
  duration: string;
  rentedAt: string;
  leaseStart: string;
  leaseEnd: string;
  effectiveDate: string;
  description: string;
  leasePeriod: number;
  leasePeriodType: string;
  category: string;
  frequency: string;
  rentAmount: number;
  vacatingDate: string;
  commencingDate?: string;
  lastTimeSync?: string;
  file: {
    title: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    mediaLink: string;
    propertyId: string;
    propertyIds: any[];
    fileNamePT: string;
    documentId: any;
    isReiForm: boolean;
  }[];
}

export interface Decision {
  index: number;
  decision: string;
  text: string;
  leaseRenewalSync?: LeaseRenewalSync;
  button: LeaseRenewalRequestButton[];
  reiFormInfor?: ReiFormData;
  leasRenewalStep?: LeaseRenewalNextStepsButton;
}

export interface LeaseRenewalNextStepsButton {
  button: LeaseRenewalRequestButton[];
}

export interface LeaseRenewalRequestTrudiBody {
  text?: string;
  decisionText?: string;
  decisionIndex: number;
  button: LeaseRenewalRequestButton[];
  variable: TrudiResponseVariable;
  status: LeaseRenewalDecision;
  decisions: Decision[];
}

export interface LeasingRequestTrudiBody {
  text?: string;
  leasingStep: LeasingRequestCategoryButton[];
}
export interface LeaseRenewalRequestTrudiVariable {
  rentedAt: RentedAt;
  leasePeriod: number;
  leasePeriodType: LeasePeriodType;
  rentAmount: number;
  frequency: FrequencyRental;
  bondAt: string;
  bondAmount: number;
  bondIncreaseAmount: number;
  description: string;
  tenancyId?: string;
  receivers: LeaseRenewalRequestTrudiVariableReceiver[];
  files: IFile[];
}

export interface LeasingRequestTrudiVariable {
  rentedAt: RentedAt;
  leasePeriod: number;
  leasePeriodType: LeasePeriodType;
  rentAmount: number;
  frequency: FrequencyRental;
  leaseDuration: number;
  tenancyId?: string;
  receivers: LeasingRequestTrudiVariableReceiver[];
  files: IFile[];
}

export interface LeaseRenewalRequestTrudiVariableReceiver {
  id: string;
  firstName: string;
  lastName: string;
  userPropertyType: EUserPropertyType;
  conversationId?: string;
  action?: LeaseRenewalRequestButtonAction;
  raiseBy?: string;
  email?: string;
  type?: string;
  checked?: string;
}
export interface LeasingRequestTrudiVariableReceiver {
  id: string;
  firstName: string;
  lastName: string;
  userPropertyType: EUserPropertyType;
  conversationId?: string;
  action?: LeasingRequestButtonAction;
  raiseBy?: string;
  email?: string;
  type?: string;
  checked?: string;
}

export interface BreachNoticeTrudiVariableReceiver {
  id: string;
  firstName: string;
  lastName: string;
  userPropertyType: EUserPropertyType;
  conversationId?: string;
  action?: BreachNoticeRequestButtonAction;
  raiseBy?: string;
  email?: string;
  type?: string;
  checked?: string;
}

export enum FrequencyRental {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  WEEKLY2 = 'WEEKLY2',
  MONTHLY = 'MONTHLY',
  FORTNIGHT = 'FORNIGHT',
  YEARLY = 'YEARLY',
  QUARTERLY = 'QUARTERLY'
}

export enum LeasePeriodType {
  Weeks = 'Weeks',
  Months = 'Months',
  Years = 'Years'
}

export enum LeasePeriodLetting {
  New_letting = 1,
  Relet = 2
}

export enum RentedAt {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
  MAINTAIN = 'MAINTAIN'
}

export enum FrequencyRentalTime {
  DAILY = 'DAY',
  WEEKLY = 'WEEK',
  MONTHLY = 'MONTH',
  FORNIGHT = 'FORNIGHT',
  YEARLY = 'YEAR',
  QUARTERLY = 'QUARTER'
}

export interface AppointmentCardDate {
  startTime?: string;
  endTime?: string;
  active?: boolean;
  remainingDay?: string;
  displayDateTime?: string;
  expiredDay?: boolean;
  status?: string;
}

export interface AppointmentCard {
  taskName?: ETrudiType;
  title?: string;
  expiresDate?: AppointmentCardDate[];
}

export interface OutgoingInspectionAppointmentCard {
  title?: string;
  inspectionDate?: AppointmentCardDate[];
}

export interface LeaseStartAppointmentCardDate {
  startDate?: string;
  active?: boolean;
  remainingDay?: string;
  displayDateTime?: string;
  expiredDay?: boolean;
}

export interface LeaseStartAppointmentCard {
  taskName?: ETrudiType;
  title?: string;
  leaseStart?: LeaseStartAppointmentCardDate[];
}

export type TrudiResponseType = TrudiResponse | BreachNoticeTrudiResponse;

export interface PageOptions {
  pageIndex: number;
  pageSize: number;
  search?: string;
  agencyId?: string;
  orderBy?: string;
  order?: EDirectionSort;
  crmSystemId?: string;
}

export interface UserInformation {
  id: string;
  email: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  isPrimary?: boolean;
  userId: string;
  isTemporary: boolean;
  conversationId?: string;
  propertyId: string;
  secondaryEmail: string;
  userPropertyType: string;
  userType: string;
  newNameFormat?: string;
  type?: string;
  newRole?: string;
  userPropertyId?: string;
  userLabelObject?: IUserLabelObject;
  hideEmail?: boolean;
  originalEmailName?: string;
  property: {
    id: string;
    unitNo: string;
    streetNumber: string;
    streetline: string;
    shortenStreetline: string;
    suburb: string;
    state: string;
    postCode: string;
    country: string;
  };
  createdFrom?: ECreatedFrom;
  fromPhoneNumber?: string;
  conversationType?: EConversationType;
  channelUserId?: string;
  conversationPropertyId?: string;
  emailVerified?: string;
}

export interface IUserLabelObject {
  userLabel?: string;
  userRole?: string;
}

export interface IShowPopupNotifyNewVersion {
  heighPopup: number;
  isShowPopup: boolean;
}

export interface IMarkAsUnreadDataResponse {
  option?: EMessageMenuOption;
  conversationId: string;
  isSeen?: boolean;
  isRead?: boolean;
  propertyToUpdate?: EMessageProperty;
  propertyValue?: boolean;
}
