import { EInboxAction } from '@/app/dashboard/modules/inbox/enum/inbox.enum';

export const DEFAULT_MOVE_TO_OPTIONS = [
  {
    action: EInboxAction.MOVE_MESSAGE_TO_INBOX,
    label: 'Inbox',
    disabled: false
  },
  {
    action: EInboxAction.MOVE_MESSAGE_TO_EMAIL,
    label: 'Email folder',
    disabled: false
  },
  {
    action: EInboxAction.MOVE_MESSAGE_TO_RESOLVED,
    label: 'Resolved',
    disabled: false
  },
  {
    action: EInboxAction.MOVE_MESSAGE_TO_DELETED,
    label: 'Deleted',
    disabled: false
  }
];
