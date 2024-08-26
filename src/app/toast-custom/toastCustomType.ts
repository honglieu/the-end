import { EIntegrationsStatus } from '@/app/profile-setting/utils/integrations.interface';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { SocketType } from '@shared/enum/socket.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EToastType } from '@/app/toast/toastType';

export const SCHEDULE_MSG_FOR_SEND = 'Message scheduled for send';

export enum EToastCustomType {
  SUCCESS = 'toast-success',
  SUCCESS_WITHOUT_VIEW_BTN = 'toast-success-no-btn-view',
  SUCCESS_WITH_VIEW_BTN = 'toast-success-with-view-btn',
  SUCCESS_WITH_VIEW_BTN_SUB_NAV = 'toast-success-with-view-btn-nav',
  SUCCESS_WITH_UNDO_BTN = 'toast-success-with-undo-btn',
  ERROR = 'toast-error',
  ERROR_WITH_VIEW_BTN = 'toast-error-with-view-btn',
  CONFLICT_DATA = 'conflict_data',
  SUCCESS_WITH_UNDO_BTN_REMINDER = 'toast-success-with-undo-btn-reminder',
  WARNING_MERGE_REPLIES = 'toast-warning-merge-replies',
  SUCCESS_AUTOMATED_REPLY = 'toast-success-automated-reply',
  SUCCESS_WITH_VIEW_AI_REPLY_BTN = 'toast-success-view-ai-reply',
  FAILED_EXPORT_CONVERSATION_HISTORY_PDF_FILE = 'failedExportConversationHistoryPDFFile',
  FAILED_EXPORT_TASK_ACTIVITY_PDF_FILE = 'failedExportTaskActivityPDFFile',
  FAILED_CONNECT = 'failed-to-connect',
  FAILED_GENERATE_EMAIL = 'failed-generate-email',
  INFO_RELOAD_WORKFLOW = 'info-reload-workflow',
  IGNORED_STEP_WITH_UNDO_BTN = 'ignored-step-with-undo-btn'
}

export enum EToastSocketType {
  REPORT_SPAM = 'REPORT_SPAM',
  NOT_SPAM = 'NOT_SPAM',
  UNDO_SPAM = 'UNDO_SPAM'
}

export enum EToastSocketTitle {
  MESSAGE_SPAM = 'Message marked as spam',
  MESSAGE_SPAM_OUTLOOK = 'Message marked as junk',
  MESSAGE_NOT_SPAM = 'Message unmarked as spam',
  MESSAGE_NOT_SPAM_OUTLOOK = 'Message unmarked as junk',
  MESSAGES_SPAM = ' messages marked as spam',
  MESSAGES_SPAM_OUTLOOK = ' messages marked as junk',
  MESSAGES_NOT_SPAM = ' messages unmarked as spam',
  MESSAGES_NOT_SPAM_OUTLOOK = ' messages unmarked as junk',
  MESSAGE_SPAM_FAIL = 'Mark as spam failed. Please try again.'
}

export type TypeDataFortoast = {
  taskId?: string;
  taskIds?: string[];
  newTaskId?: string;
  agencyId?: string;
  companyId?: string;
  googleAvatar?: string;
  isShowToast?: boolean;
  firstName?: string;
  lastName?: string;
  type?: SocketType;
  fromUserId?: string;
  mailBoxId?: string;
  taskName?: string;
  taskType?: TaskType;
  email?: string;
  status?: TaskStatusType | EIntegrationsStatus | string;
  newStatus?: TaskStatusType;
  statusTask?: TaskStatusType;
  pushToAssignedUserIds?: string[];
  isConvertedToTask?: boolean;
  threadId?: string;
  mailFolderId?: string;
  mailMessageId?: string;
  pmName?: string;
  folderName?: string;
  title?: string;
  conversationId?: string;
  message?: string;
  targetFolderName?: string;
  targetFolderId?: string;
  isAppMessage?: boolean;
  conversationType?: EConversationType;
  isDraft?: boolean;
  defaultMessage?: string;
  defaultIcon?: EToastType;
  defaultLink?: string;
  reminderType?: string;
};
