import { Observable } from 'rxjs';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { NodeType } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/node-type.enum';
import {
  ICreatorInvoice,
  IInvoice,
  InvoiceFile
} from '@shared/types/invoice.interface';
import { ICurrentViewNoteResponse } from '@/app/task-detail/modules/internal-note/utils/internal-note.interface';
import {
  ESyncTaskType,
  TaskNameId,
  TaskStatusType,
  TaskType
} from '@shared/enum/task.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { EPropertyStatus } from '@shared/enum/user.enum';
import {
  IListConversationConfirmProperties,
  PreviewConversation
} from './conversation.interface';
import { FileType } from './file.interface';
import { ITicket, ITicketFile } from './message.interface';
import { RoutineInspectionData } from './routine-inspection.interface';
import {
  InvoiceTrudiData,
  LeaseRenewalRequestTrudiResponse,
  LeasingRequestTrudiResponse,
  PetRequestTrudiResponse,
  Setting,
  TrudiResponse
} from './trudi.interface';
import { UnhappyStatus } from './unhappy-path.interface';
import { IUserParticipant, PropertyManager } from './user.interface';
import {
  ESelectStepType,
  EStepAction,
  EStepType,
  ETaskTemplateStatus
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { IDecisionTree } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { ITaskGroup } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { Property } from './property.interface';
import { TenancyInvoice } from './tenancy-invoicing.interface';

export interface Topic {
  id: string;
  name: string;
}

export interface IListTaskTemplate {
  [ETaskTemplateStatus.PUBLISHED]: ITaskTemplateItem[];
  [ETaskTemplateStatus.ARCHIVED]: ITaskTemplateItem[];
}

export interface ITaskTemplateItem {
  id: string;
  name: string;
  aiSummary: boolean;
  parentTemplateId: string;
  taskNameRegions: TaskRegion[];
  defaultTaskFolder: {
    id: string | null;
    taskFolderId: string | null;
    isRemember: boolean;
  };
}

export interface IDefaultFolderItem {
  id: string | null;
  isRemember: boolean | null;
  taskFolderId: string | null;
}

export interface IGetTaskPayload {
  pageIndex?: number;
  pageSize?: number;
  mailBoxId?: string;
  propertyId?: string;
  agencyId: string;
}

export interface IUpdateTaskDefaultPayload {
  defaultTaskFolderMailBoxId: string;
  taskNameId: string;
  mailBoxId: string;
  taskFolderId: string;
  isRemember: boolean;
}

export interface AssignToAgent {
  id?: string;
  firstName?: string;
  lastName?: string;
  googleAvatar?: string;
  fullName?: string;
  disabled?: boolean;
}

export interface TaskList {
  my_task?: TaskItem[];
  team_task?: TaskItem[];
  my_task_and_team_task?: TaskItem[];
  data?: TaskList;
  topicMap?: TopicItem[];
  completed?: TaskItem[];
  deleted?: TaskItem[];
}

export interface TaskName {
  label?: string;
  id?: string;
  name?: string;
  topicId?: string;
  topicName?: string;
  createdAt?: string;
  updatedAt?: string;
  conversationCategoryName: string;
  conversationCategoryId: string;
  isEnable: boolean;
  taskNameRegions?: TaskRegion[];
  taskNameRegion?: TaskRegion;
  disabled?: boolean;
  order?: number;
}

export interface TaskRegion {
  id: string;
  regionId: string;
  regionName: string;
  taskNameRegionId: string;
  taskNameId?: TaskNameId;
  region?: {
    id: string;
    name: string;
    fullRegionName?: string;
  };
  parentTemplateId?: string;
}

export interface BindingValueTaskItemDropdown {
  titleName?: string;
  topicId?: string;
  aiSummary?: boolean;
}

export interface TaskItemDropdown {
  id?: string;
  label: string;
  aiSummary?: boolean;
  defaultTaskFolder?: IDefaultFolderItem;
  value?: BindingValueTaskItemDropdown;
  group?: string;
  disabled?: boolean;
  taskNameRegions?: TaskRegion[];
  regionId?: string;
  updatedAt?: Date | string;
  parentTemplateId?: string;
}

export type TaskRegionItem = Omit<TaskItemDropdown, 'regions'> & TaskRegion;

export interface TaskListItemMove {
  id: string;
  topicId: string;
  title: string;
  regionName: string;
  topicName?: string;
  propertyName: string;
  createdAt: string;
  updatedAt: string;
  status: TaskStatusType;
  statusBadge?: string | Observable<string>;
}

export interface TaskListMove {
  topicName: string;
  topicId: string;
  tasks: TaskListItemMove[];
}

// TODO: separate interface for task folder
export interface TaskItem {
  id: string;
  note?: string;
  status: TaskStatusType;
  indexTitle: string;
  title: string;
  assignToAgent: AssignToAgent;
  assignToAgents: AssignToAgent[];
  taskDetail?: TaskDetail;
  createdAt: string;
  updatedAt: string;
  topicId: string;
  topicName?: string;
  topicOrder?: number;
  property: Property;
  isRead: boolean;
  isDraft?: boolean;
  isSeen?: boolean;
  isDeleting?: boolean;
  isOpened: boolean;
  isSuperHappyPath: boolean;
  isUnHappyPath: boolean;
  isUnindentifiedEmail: boolean;
  isUnindentifiedProperty: boolean;
  unhappyStatus: UnhappyStatus;
  userPropertyType: string;
  conversations: PreviewConversation[];
  draftMessageId?: string;
  trudiResponse?:
    | LeasingRequestTrudiResponse
    | LeaseRenewalRequestTrudiResponse
    | PetRequestTrudiResponse
    | TrudiResponse;
  taskType: TaskType;
  taskFolderId: string;
  taskGroupId: string;
  titleStatus: TaskStatus;
  propertyManager: PropertyManager;
  taskNameRegion: TaskRegion;
  taskName: TaskName;
  groupType: string;
  isSelected?: boolean;
  disabled?: boolean;
  taskNameId?: TaskNameId;
  propertyStatus?: EPropertyStatus;
  propertyType?: string;
  mailBoxId?: string;
  idUserPropertyGroup?: string;
  isExistScheduledMessage?: boolean;
  isExistInternalNote?: boolean;
  unreadConversations?: string[];
  calendarEvents?: Partial<ICalendarEvent>[];
  workflow?: ITaskWorkflow;
  currentNoteViewed?: ICurrentViewNoteResponse;
  isAutoReopen?: boolean;
  msgIndex?: number;
  propertyId?: string;
  streetline?: string;
  contentMessage?: string;
  startMessageBy?: string;
  threadId?: string[] | string;
  textContent?: string;
  taskId?: string;
  agencyId?: string;
  companyId: string;
  taskGroupName?: string;
  conversationId?: string;
  isSelectedByCheckBox?: boolean;
  taskSyncs: ITaskSync[];
  shortenStreetline?: string;
  isDisallowReassignProperty: boolean;
  isAppMessageLog?: boolean;
  isResolveConversation?: boolean;
  endSession?: string;
  statusBadge?: string | Observable<string>;
  eventId?: string;
  isMessageInTask?: boolean;
  isLoading?: boolean;
  messageDate?: string;
}

export interface ITaskWorkflowItem {
  id: string;
  name: string;
  type?: NodeType;
  status?: TrudiButtonEnumStatus;
  buttons?: ITaskWorkflowItem[];
}

export interface ITaskWorkflow {
  steps: ITaskWorkflowItem[];
  decision: {
    id: string;
    name: string;
    steps: ITaskWorkflowItem[];
    decision?: {
      id: string;
      name: string;
      steps: ITaskWorkflowItem[];
    };
  };
  stepsInTask?: ITaskStepsInTask[];
}

export interface ITaskStepsInTask {
  id: string;
  action: EStepAction;
  name: string;
  status: TrudiButtonEnumStatus;
  disabled?: boolean;
  isRequired?: boolean;
  stepType: EStepType | ESelectStepType;
  type: NodeType;
}

export interface TaskStatus {
  currentDecision?: string;
  currentSubNav: string;
  isFirstSubNav: boolean;
  nextSubNav?: string;
  numberOfRemainingSubNav: number;
}
export interface SearchTask {
  term: string;
  onlyInprogress: boolean;
  onlyMyTasks: boolean;
  isIgnoreTaskLinkedAction?: boolean;
  pageIndex?: number;
  taskFolderId?: string;
  propertyId?: string;
  taskId?: string;
  propertyIds?: string[];
  taskIds?: string[];
  conversationType?: string;
}
export interface ListTaskItem {
  tasks: TaskItem[];
  totalTask: number;
}

export interface InvoicingTrudiResponse {
  type: string;
  data: InvoiceTrudiData[];
  setting: Setting;
  startConversationId?: string;
  title?: string;
}

export interface TaskDetail {
  id: string;
  userId: string;
  conversationId: string;
  message: string;
  isRead: boolean;
  type: string;
  userCreateTicketAvatar?: string;
  ticketFiles: ITicketFile[];
  userCreateTicketFirstName: string;
  userCreateTicketLastName: string;
  userCreateTicketTitle: string;
  options: string;
  messageType: string;
  propertyDocumentId?: string;
  actionLinkId?: string;
  isSendFromEmail: boolean;
  bulkMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ELinkedTask {
  contextMessage?: string;
  id: string;
  linkedTaskId: string;
  message?: string;
  messageType?: string;
  textContent?: string;
  textTranslatedContent?: string;
  options?: {
    status: string;
    text: string;
    response: EActionItemResponse;
  };
}

export interface EActionItemResponse {
  payload?: {
    ticket?: ITicket;
  };
  type?: string;
  text?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface TaskNameItem {
  id: string;
  name: string;
  description?: string;
  podId: string;
  order: number;
  taskNames: TaskName[];
}

export interface UpdateTaskItems {
  listTaskId?: string[];
}

export interface NewTaskOptions {
  leaseRenewal?: NewTaskLeaseRenewal;
  routineMaintenance?: NewTaskRoutineMaintenance;
  emergencyMaintenance?: NewTaskEmergencyMaintenance;
  petRequest?: NewTaskPetRequest;
  miscellaneous?: NewTaskMiscellaneous;
  routineInspection?: {
    inspection?: RoutineInspectionData;
  };
  tenantLandlordRequest?: {
    description: string;
    photos: PhotoType[];
  };
  smokeAlarm?: ComplianceOption;
  generalCompliance?: ComplianceOption;
  tenantVacate?: {
    tenancy: string;
  };
  ingoingInspection?: {
    id?: string;
  };
  leaseStart?: {
    tenancy?: string;
  };
  arrear?: {
    subEventId?: string;
  };
  summary?: {
    summaryNote: string;
    summaryPhotos: PhotoType[];
  };
}

interface ComplianceOption {
  complianceCategoryId: string;
  tenancy: string;
}

interface NewTaskMiscellaneous {
  topicId: string;
}

interface NewTaskRoutineMaintenance {
  maintenanceObject: string;
  maintenanceObjectList: string[];
  description: string;
  photos: PhotoType[];
}
interface NewTaskEmergencyMaintenance {
  emergencyEvent: string;
  emergencyEventList: string[];
  description: string;
  photos: PhotoType[];
}

export interface PhotoType {
  id?: string;
  fileName?: string;
  fileSize?: string;
  mediaLink?: string;
  checked?: boolean;
  mediaType?: string;
  thumbMediaLink?: string;
  fileType?: string | FileType;
  src?: string;
  formatSrc?: string;
  isUserUpload?: boolean;
  isOriginalMediaFile?: boolean;
  name?: string;
  extension?: string;
  parentId?: string;
  localId?: string;
}

export interface IFileInvoice {
  id?: string;
  checked?: boolean;
  totalAmount: string;
  gstAmount: string;
  dueDate: string;
  isInvoice: boolean;
  pdfName: string;
  pdfUrl: string;
  user: UserInvoice;
  created?: string | Date;
}

export interface UserInvoice {
  iviteSent: any;
  lastActivity: any;
  offBoardedDate: any;
  email: string;
  firstName: any;
  lastName: string;
  id: string;
  googleAvatar: any;
  type: string;
}

export interface fileTypes {
  icon: string;
  id: string;
  name: string;
}

interface NewTaskLeaseRenewal {
  tenancy: string;
}

interface NewTaskPetRequest {
  petType: string[];
  description: string;
  photos: PhotoType[];
}

export interface newTaskDetailItems {
  description: string;
  typePet: typePet[];
  imageLink: imageLink[];
}

interface typePet {
  title: string;
}
interface imageLink {
  name: string;
}

export interface IDefaultObject {
  maintenanceObject: string[];
  petType: string[];
  emergencyEvent: string[];
}

export interface ITaskDetail {
  maintenanceObject: string;
  maintenanceObjectList: string[];
  description: string;
  photos: PhotoType[];
  textForward: string;
  variable: any;
  petType?: string[];
  emergencyEvent?: string;
  emergencyEventList?: string[];
  title?: string;
}

export interface ITaskTemplate {
  description: string;
  photos: PhotoType[];
  textForward?: string;
}

export interface bodySaveInvoice {
  taskId: string;
  invoice: {
    supplierId: string;
    isCreditorInvoice: boolean;
    syncStatus: string;
    creditorInvoice: ICreatorInvoice;
  };
}

export interface bodySyncInvoice {
  taskId: string;
  propertyId: string;
  isTicket: boolean;
  invoices: IInvoice[];
}

export interface IBodyRetryInvoice {
  agencyId: string;
  invoiceId: string;
  taskId: string;
  propertyId: string;
  stepId?: string;
}

export interface IBodyCancelInvoice {
  agencyId: string;
  taskId: string;
}

export interface bodySaveTenancyInvoice {
  taskId: string;
  invoice: {
    supplierId: string;
    isCreditorInvoice: boolean;
    syncStatus: string;
    tenancyInvoice: TenancyInvoice;
    file?: InvoiceFile;
  };
}
export interface bodySyncTenancyInvoice {
  taskId: string;
  propertyId: string;
  isTicket: boolean;
  invoices: IInvoice[];
}

export interface SelectItemInList<T>
  extends Omit<TaskItemDropdown, 'id' | 'value'> {
  id: string;
  value: T;
}

export interface QueryParamsGetListMessage {
  search?: string;
  status?: string;
  assignedTo?: any[] | string;
  topic?: any[] | string;
  manager?: any[] | string;
  propertyId?: string;
  excludeUnHappyPath?: boolean;
  excludeConversation?: boolean;
  limit?: string;
  page?: string;
  onlyTask?: boolean;
  type?: string;
}

export interface TopicItem {
  id: string;
  name: string;
  order: number;
}

export interface TopicMap {
  topicIds: string[];
  topicMap: {
    [key: string]: TopicItem;
  };
}

export interface ListTaskOptions {
  search?: string;
  type?: string;
  assignedTo?: string | string[];
  propertyManagerId?: string | string[];
  topicId?: string | string[];
  topic?: string;
  manager?: string;
  propertyId?: string;
  propertyIds?: string[];
  excludeUnHappyPath?: boolean;
  excludeConversation?: boolean;
  limit?: number;
  page?: number;
  onlyTask?: boolean;
  includeCompletedTask?: boolean;
  calendarEventId?: string;
  excludeTaskId?: string;
  mailBoxId?: string;
}

export interface IConversationFiles {
  file_name?: string;
  file_sender_name?: string;
}

export interface IDataApplicationShortlistVariable {
  application_name_1: string;
  application_summary_1: string;
  application_name_2: string;
  application_summary_2: string;
  application_name_3: string;
  application_summary_3: string;
}

export interface TaskStep {
  id: string;
  type: string;
  index?: number;
  steps?: TaskStep[];
  buttons?: TaskStep[];
  decision?: string | null;
  name: string;
  action: string;
  fields?: {
    sendTo?: string[];
    msgBody?: string;
    msgTitle?: string;
    customControl?: {
      title: string;
      isRequired: boolean;
    };
    isAIGenerated?: boolean;
  };
  status: string;
  stepType: string;
  reminderTimes?: any[];
  isRequired?: boolean;
  componentType?: string;
}

export interface TaskTemplate {
  steps: TaskStep[];
  decisions: TaskStep[];
}

export interface CalendarEventBulkCreateTaskSuccess {
  template: TaskTemplate;
  events: ICalendarEvent[];
  tasks: CalendarEventBulkTasksCreated[];
}

export interface CalendarEventBulkTasksCreated {
  taskId: string;
  propertyId: string;
}

export interface TaskCreate {
  eventId: string;
  taskId: string;
  defaultTaskFolderMailBoxId?: string;
  taskNameId?: string;
  isRemember?: boolean;
  taskNameRegionId?: string;
  propertyId: string;
  assignedUserIds: string[];
  taskNameTitle: string;
  taskTitle: string;
  indexTitle: string;
  notificationId?: string;
  mailBoxId?: string;
  taskFolderId: string;
}

export interface BulkTasksCreate {
  tasks: TaskCreate[];
  sessionCreateTaskId: string;
}

export interface PayloadGetListTaskNameRegionId {
  taskNameId: string;
  regionIds: string[];
}

export interface ResponseGetTaskNameRegionId {
  taskNameRegionId: string;
  taskNameId: string;
  regionId: string;
  isDeleted: boolean;
}

export enum StatusResultBulkCreateTask {
  ERROR = 'ERROR',
  SUCCESSFULLY = 'SUCCESSFULLY'
}

export interface ITaskTypeEditor {
  [key: string]: Topic[];
}

export type IUpdateTaskBody =
  | {
      taskIds: string[];
      taskGroupId: string;
      mailBoxId: string;
    }
  | {
      taskIds: string[];
      status: string;
      mailBoxId: string;
    };

export interface IUpdateTaskResponse {
  message: string;
  isSuccessful?: boolean;
}

export interface ITaskCreateBody {
  task?: string;
  property?: string;
  title?: string;
  taskGroup?: string;
  assign?: string[];
  taskNameTitle?: string;
  folder?: string;
}

export interface IConvertMultipleToTaskResponse {
  conversationFaileds: IListConversationConfirmProperties[];
  conversationSuccess: IListConversationConfirmProperties[];
  taskTemplateId: string;
  template: IDecisionTree;
  total: number;
}

export interface ITaskPreview {
  id?: string;
  title?: string;
  indexTitle?: string;
  createdAt?: string;
  updatedAt?: string;
  property?: Partial<Property>;
  inprogress?: ITaskWorkflow;
  conversations?: Partial<PreviewConversation>[];
  calendarEvents?: ITaskPreviewCalender[];
  unreadConversations?: string[];
  internalNotes?: IPrevviewInternalNote;
  agencyId?: string;
}

export interface IInternalNoteMentions {
  id: string;
  internalNote: {
    id: string;
    taskId: string;
  };
  user: {
    firstName: string;
    lastName: string;
    id: string;
  };
}
export interface ITaskPreviewCalender {
  id: string;
  calendarEvent: ICalendarEvent;
}

export interface IPrevviewInternalNote {
  latestNoteData: {
    id: string;
    friendlyId: number;
    type: string;
    createdAt: string;
    firstName: string;
    lastName: string;
    userId: string;
    contentData: string | IUserParticipant;
    mentionsUsers: IPrevviewInternalNoteMentionsUser[];
  };
  noteParticipants: Partial<IUserParticipant>[];
  totalAttachments: string | number;
  unReadData: {
    taskId: string;
    hasUnreadNote: boolean;
    unreadCount: number;
  };
}

export interface IPrevviewInternalNoteMentionsUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  googleAvatar: string;
}

export interface ICreateBulkTaskResponse {
  errors: any[];
  successfullys: TaskItem[];
}
export interface IConfigPopup {
  actionButton: string;
  title: string;
  titleWarning: string;
  isRmEnvironment: boolean;
  showModal: boolean;
}

export interface IListConversationTask {
  listConversationTaskMove: ITaskRow[];
  listConversationTaskNotMove: ITaskRow[];
}

export interface ITaskGroupItem extends ITaskGroup {
  taskFolderName: string;
}

export interface ISelectedProperty {
  propertyId: string;
  indexItem: number;
}

export interface ITasksActivityPayload {
  tasks: ITaskActivity[];
  syncTaskType: ESyncTaskType;
  exportType?: string;
}

export interface ITaskActivity {
  taskId: string;
  propertyId?: string;
}

export interface ITaskSync {
  id: string;
  taskId: string;
  type: number;
  syncStatus: string;
  errorMessage: string;
  propertyId: string;
  syncedBy: string;
  syncedDate: string;
  createdAt: string;
}

export interface TaskDataPayloadChangeStatus {
  id: string;
  conversationId: string;
  taskType: TaskType;
}
