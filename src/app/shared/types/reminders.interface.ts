import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';

export interface ListReminderDay {
  value: string;
  minutes?: number;
}

export interface ListReminder {
  groupName: string;
  values: Reminder[];
}

export interface KindOfNoti {
  email: string;
  desktop: string;
}

interface Reminder {
  name: string;
  enableDesktop: boolean;
}

export enum ReminderGroupName {
  LEASE_RENEWALS = 'Lease renewals',
  ARREARS = 'Arrears',
  INSPECTIONS = 'Inspections',
  COMPLIANCE = 'Compliance',
  NEW_TENANCIES = 'New tenancies',
  VACATES = 'Vacates',
  INVOICES = 'Invoices',
  TENANT_NOTICES = 'Tenant notices'
}

export const listSelectReminderDay: ListReminderDay[] = [
  { value: '90 days' },
  { value: '60 days' },
  { value: '30 days' },
  { value: '14 days' },
  { value: '7 days' },
  { value: '5 days' },
  { value: '3 days' },
  { value: '1 day' },
  { value: '0 days' },
  { value: '-1 day' },
  { value: '-3 days' },
  { value: '-5 days' },
  { value: '-7 days' },
  { value: '-14 days' }
];

export const listNameReminderSettingShow: Record<string, string[]> = {
  [ECrmSystemId.PROPERTY_TREE]: [
    'Lease expiry in',
    'Routine inspection in',
    'Incoming inspection in',
    'Outgoing inspection in',
    'Compliance expiry in',
    'Compliance next service in',
    'Lease commencement in',
    'Vacate date in',
    'Tenant invoice due',
    'Breach notice remedy date due in',
    'Entry notice entry date due in',
    'Tenant in arrears by'
  ],
  [ECrmSystemId.RENT_MANAGER]: [
    'Lease expiry in',
    'Inspection in',
    'Move in',
    'Lease commencement in',
    'Move out in',
    'Open for',
    'Tenant invoice due date in',
    'Breach notice remedy date due in',
    'Entry notice entry date due in'
  ]
};

export const listSelectRemiderSetting: ListReminderDay[] = [
  {
    value: '1 minute',
    minutes: 1
  },
  {
    value: '30 minutes',
    minutes: 30
  },
  {
    value: '1 hour',
    minutes: 60
  },
  {
    value: '6 hours',
    minutes: 360
  },
  {
    value: '12 hours',
    minutes: 720
  },
  {
    value: '1 day',
    minutes: 1440
  },
  {
    value: '2 days',
    minutes: 2880
  },
  {
    value: '3 days',
    minutes: 4320
  },
  {
    value: '7 days',
    minutes: 10080
  }
];

export const listSelectReminderMe: ListReminderDay[] = [
  {
    value: '1 hour',
    minutes: 60
  },
  {
    value: '3 hours',
    minutes: 180
  },
  {
    value: '1 day',
    minutes: 1440
  },
  {
    value: '3 days',
    minutes: 4320
  },
  {
    value: '7 days',
    minutes: 10080
  },
  {
    value: '14 days',
    minutes: 20160
  },
  {
    value: '30 days',
    minutes: 43200
  }
];
