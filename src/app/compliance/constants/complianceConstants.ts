import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { IPropertyNoteForm } from '@/app/smoke-alarm/utils/smokeAlarmType';

export const ALARM_TYPE_LIST = [
  { text: 'Battery', value: 'Battery' },
  { text: 'Hard Wired', value: 'HardWired' },
  { text: 'Not Installed', value: 'NotInstalled' },
  { text: 'Unknown', value: 'Unknown' }
];

export const AUTHOR_RECEVIED_LIST = [
  { text: 'Not Received', value: 'NotReceived' },
  { text: 'Received', value: 'Received' }
];

export const MANAGEDBY_LIST = [
  { text: 'Agent', value: 'Agent' },
  { text: 'Owner', value: 'Owner' },
  { text: 'Strata', value: 'Strata' }
];

export const MANAGEDBY_LIST_GENERAL = [
  { text: 'Agent', value: 'Agent' },
  { text: 'Strata', value: 'Strata' }
];

export const DATA_COMPLIANCE: Record<number, IPropertyNoteForm> = {
  0: {} as IPropertyNoteForm,
  1: {} as IPropertyNoteForm,
  2: {} as IPropertyNoteForm
};

export const SYNC_DATA = {
  '': {
    icon: 'iconCloseDangder',
    text: 'Not synced'
  },
  [SyncMaintenanceType.INPROGRESS]: {
    icon: 'syncingV2',
    text: 'Syncing'
  },
  [SyncMaintenanceType.FAILED]: {
    icon: 'syncFailV2',
    text: 'Fail to sync'
  },
  [SyncMaintenanceType.COMPLETED]: {
    icon: 'syncSuccessV2',
    text: 'Synced'
  },
  [SyncMaintenanceType.UN_SYNC]: {
    icon: 'notSynced',
    text: 'Unsynced changes'
  }
};
