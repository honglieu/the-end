import { TaskStatusType } from '@shared/enum/task.enum';
import { EToastSocketTitle } from '@/app/toast-custom/toastCustomType';

export const CREATE_MESSAGE_SUCCESSFULLY = 'Created message successfully';
export const CONVERSATION_DELETED = 'Conversation deleted';
export const MESSAGE_DELETED = 'Message deleted';
export const MESSAGE_RESOLVED = 'Message resolved';
export const MESSAGE_REOPENED = 'Message reopened';
export const MESSAGE_MOVED = 'Messages moved';
export const MESSAGE_MOVED_TO_IN_PROGRESS = 'Message moved to in progress';
export const TASK_DELETED = 'Task deleted';
export const TASK_COMPLETED = 'Task completed';
export const TASK_REOPENED = 'Task reopened';
export const CONVERT_TO_TASK = 'Message converted to task';
export const CREATE_TASK_SUCCESSFULLY = 'Task created';
export const UNABLE_SYNC_PROPERTY_TREE = 'Unable to create invoice';
export const UNABLE_ADD_NOTE_PROPERTY_TREE = 'Unable to create note';
export const FORWARD_EMAIL_SUCCESSFULLY = 'Forward email successfully';
export const MESSAGE_MOVED_TO_TASK = 'Message moved to task';
export const MESSAGE_MOVING_TO_TASK = 'Message moving';
export const MESSAGES_MOVING_TO_TASK = 'Messages moving';
const MESSAGE_MOVING_PROCESSING = {
  moving: {
    singleMessage: 'Message moving',
    multipleMessages: 'Messages moving'
  },
  processing: {
    singleMessage: 'Message processing',
    multipleMessages: 'Messages processing'
  }
};
export const getTitleToastMovingProcessing = (
  threadIds: string[],
  status?: string
) => {
  const isMultipleMessages = threadIds.length > 1;
  const titleType =
    status === TaskStatusType.inprogress ? 'processing' : 'moving';
  const messageType = isMultipleMessages ? 'multipleMessages' : 'singleMessage';
  return MESSAGE_MOVING_PROCESSING[titleType][messageType];
};
export const CREATE_CONVERSATION_SUCCESSFULLY =
  'Created conversation successfully';
export const CHANGE_SUCCESSFULLY_SAVED = 'Change successfully saved.';
export const APPOINTMENT_AVAILABILITY_SAVED = 'Appointment availability saved';
export const CHANGE_SUCCESSFULLY_ERROR = 'Change error.';
export const OUT_OF_OFFICE_RESPONSE_ON = 'Out of office responder ON';
export const OUT_OF_OFFICE_RESPONSE_OFF = 'Out of office responder OFF';
export const INVITE_MEMBER_SENDING = 'Invites sending';
export const INVITE_MEMBER_SUCCESSFULLY = 'Invite sent';
export const INVITE_MEMBER_ERROR =
  'Invites failed to send.</br>Please refresh and try again!';
export const TASK_CANCELLED = 'Task cancelled';
export const TENANCY_HAS_BEEN_CONFIRMED = 'Tenancy has been confirmed';
export const CREATE_TASK_EDITOR = 'Task created';
export const INVITE_SENT = 'Invite sent';
export const INVITE_SENT_FAILED =
  'Invites failed to send.</br>Please refresh and try again!';
export const ASSIGN_TO_MESSAGE = 'You have been assigned to this message';
export const ASSIGN_TO_TASK = 'You have been assigned to this task';
export const CREATE_FROM_TEMPLATE = 'Task template created';
export const MAIL_BOX_SYNC_FAILED = 'Connection failed. Please try again.';
export const MAIL_BOX_SYNC_SUCCESSFULLY = 'Mailbox connected';
export const MAIL_BOX_DISCONNECT = 'Connection failed.';
export const UPGRADE_REQUEST_SENT = 'Upgrade request sent';
export const CALENDAR_CONNECT_SUCCESSFULLY = 'Calendar connected';
export const INTEGRATE_IMAP_MAILBOX_FAILED =
  'Integration failed. Please try again';
export const INTEGRATE_IMAP_MAILBOX_SUCCESSFUL = 'Connection successful';
export const INTEGRATING_MAILBOX = 'Mailbox integrating...';
export const CALENDAR_CONNECT_TITLE = 'Connect your calendar';
export const GET_CALENDAR_FAILED_CONNECT_TITLE = (provider: string) => {
  return `Failed to sync to ${
    provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase()
  } calendar`;
};
export const GET_CALENDAR_DISCONNECT_TITLE = (provider: string) => {
  return `We've lost connection to your ${
    provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase()
  } calendar`;
};
export const CALENDAR_CONNECT_DESCRIPTION =
  'Receive calendar invites for appointments and events for properties within your portfolio/s';
export const CALENDAR_FAILED_CONNECT_DESCRIPTION =
  'Your calendar is not updated with the latest events';
export const CALENDAR_DISCONNECT_DESCRIPTION =
  'You cannot receive any appointments and events until this issue is resolved';
export const MOVE_MESSAGE_FAIL = 'Move to folder failed. Please try again.';
export const MOVE_MESSAGE_TO_FOlDER = 'Message moved to folder';
export const SHARED_MAIL_BOX_FAILED =
  'Creation of mailbox failed. Please try again.';
export const CAN_NOT_MOVE = '0 messages moved';
export const DRAFT_SAVED = 'Draft saved';
export const APP_DRAFT_SAVED = 'App message saved as draft';
export const GET_TITLE_REPORT_SPAM = (
  isReport: boolean,
  isGmail: boolean,
  lengthSuccess: number
) => {
  const gmailTitle =
    lengthSuccess > 1
      ? lengthSuccess + EToastSocketTitle.MESSAGES_SPAM
      : EToastSocketTitle.MESSAGE_SPAM;
  const outlookTitle =
    lengthSuccess > 1
      ? lengthSuccess + EToastSocketTitle.MESSAGES_SPAM_OUTLOOK
      : EToastSocketTitle.MESSAGE_SPAM_OUTLOOK;
  const notSpamGmailTitle =
    lengthSuccess > 1
      ? lengthSuccess + EToastSocketTitle.MESSAGES_NOT_SPAM
      : EToastSocketTitle.MESSAGE_NOT_SPAM;
  const notSpamOutlookTitle =
    lengthSuccess > 1
      ? lengthSuccess + EToastSocketTitle.MESSAGES_NOT_SPAM_OUTLOOK
      : EToastSocketTitle.MESSAGE_NOT_SPAM_OUTLOOK;

  if (isReport) {
    return isGmail ? gmailTitle : outlookTitle;
  } else {
    return isGmail ? notSpamGmailTitle : notSpamOutlookTitle;
  }
};
