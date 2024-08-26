export enum EDataE2ENavHeader {
  NAV_NOTIFICATIONS_BUTTON = 'nav-notifications-button'
}

export enum EDataE2EInbox {
  FOCUS_VIEW_TOGGLE = 'inbox-focus-view-toggle',
  ADD_GROUP_BUTTON = 'inbox-add-group-button'
}

export enum EDataE2EMailFolder {
  MOVE_TO_INBOX = 'email-details-move-to-inbox'
}

export enum EDataE2EInboxReminder {
  FOLLOW_UP = 'index-reminder-follow-up',
  WAITING_FOR_REPLY = 'index-reminder-waiting-for-reply'
}

export enum EDataE2EMoreIndexFolder {
  DRAFT_FOLDER = 'more-index-draft-folder',
  RESOLVED_FOLDER = 'more-index-resolved-folder',
  DELETED_FOLDER = 'more-index-deleted-folder'
}

export enum EDataE2ETaskDetail {
  REASSIGN_BUTTON = 'task-details-reassign-button',
  REOPEN_BUTTON = 'task-details-reopen-button',
  DELETE_BUTTON = 'task-details-delete-button'
}

export enum EDataE2EReassignModal {
  CONFIRM_BUTTON = 'reassign-conversation-property-confirm-button'
}

export enum EDataE2EMessageAction {
  REPLY = 'message-reply-button',
  REPLY_ALL = 'message-reply-all-button',
  FORWARD = 'message-forward-button',
  REPLY_VIA_APP = 'message-reply-via-app-button',
  REPLY_VIA_EMAIL = 'message-reply-via-email-button',
  OPEN_APP_CONVERSATION = 'message-open-app-conversation-button',
  OPEN_EMAIL_CONVERSATION = 'message-open-email-conversation-button'
}

export enum EDataE2EThreeDotsAction {
  FORWARD = 'message-3-dots-forward-button'
}

export enum EDataE2ESend {
  SEND = 'send-message-send-button',
  SEND_AND_RESOLVE = 'send-message-send-resolve-button',
  SEND_AND_RESCHEDULE = 'send-message-reschedule-button'
}

export enum EDataE2EConversation {
  ADD_TO_TASK = 'conversation-right-click-add-to-task',
  CREATE_NEW_TASK = 'conversation-right-click-create-new-task',
  ADD_TO_EXISTING_TASK = 'conversation-right-click-add-to-existing-task',
  MARK_AS_UNREAD = 'conversation-right-click-mark-as-unread',
  MARK_AS_READ = 'conversation-right-click-mark-as-read',
  DELETE = 'conversation-right-click-delete',
  MARK_AS_RESOLVED = 'conversation-right-click-mark-as-resolve',
  PERMANENTLY_DELETE = 'task-right-click-permanently-delete',
  CLICK_UNFLAG = 'conversation-right-click-unflag',
  CLICK_FLAG = 'conversation-right-click-flag',
  REPORT_SPAM = 'conversation-right-click-report-spam',
  REMOVE_FROM_TASK = 'conversation-right-click-remove-from-task'
}

export enum EActionSyncType {
  SYNC_SINGLE = 'nav-sync-singlesub-sync-button',
  SYNC_MULTIPLE = 'nav-sync-multisub-sync-button'
}
