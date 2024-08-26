export enum StatusSync {
  COMPLETE = 'COMPLETE',
  FAIL = 'FAIL',
  INPROGRESS = 'INPROGRESS',
  PENDING = 'PENDING'
}

export interface TitleTooltip {
  hover: DetailTooltip | null;
  click: DetailTooltip | null;
}

export interface DetailTooltip {
  header: string;
  content: string;
  subscriptionName?: string;
}

export enum FlagTypeSync {
  'SYNCING' = 'SYNCING',
  'SYNC_SUCCESS' = 'SYNC_SUCCESS',
  'SYNC_FAIL' = 'SYNC_FAIL',
  'SYNC_ABLE' = 'SYNC_ABLE'
}

export enum IconsSync {
  SYNCING = 'iconSyncing',
  SYNC_ABLE = 'iconSyncV2',
  SYNC_FAIL = 'iconSyncFail',
  SYNC_SUCCESS = 'iconSyncSuccess',
  SYNC_DOWNWARD = 'SyncIconDownward',
  SYNC_DISABLED = 'iconSyncGray',
  SYNC_TRY_AGAIN = 'tryAgainSyncIcon'
}

export interface ValueTypeSync {
  title: string;
  className: string;
  iconName: string;
}

export enum ERouterHiddenSidebar {
  CALENDAR_VIEW = 'calendar-view',
  TASK_TEMPLATE = 'task-template',
  PROFILE_SETTINGS = 'profile-settings',
  AGENCY_SETTINGS = 'agency-settings',
  CONSOLE_SETTINGS = 'console-settings',
  MAILBOX_SETTINGS = 'mailbox-settings',
  TASK_DETAIL = 'detail'
}

export interface ISubscriptionsList {
  agencyId: string;
  subscriptionName: string;
  lastTimeSync: string;
  lastStatusSync: StatusSync;
  isEnableSync?: boolean;
  lastTimeSyncComplete: string | null;
  lastTimeSyncCompleteFormatted: string | null;
  lastTimeSyncFormatted: string | null;
  iconName?: string;
  className?: string;
}
