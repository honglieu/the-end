import {
  NotificationSettingPlatform,
  NotificationSettingType
} from '@shared/enum/user.enum';

export const PORTAL_ACTIVITY_NOTIFICATION = [
  {
    label: 'New messages',
    settings: [
      {
        type: NotificationSettingType.newMessageTaskReply,
        platform: NotificationSettingPlatform.DESKTOP,
        checked: false
      }
    ]
  },
  {
    label: 'New requests',
    settings: [
      {
        type: NotificationSettingType.newRequest,
        platform: NotificationSettingPlatform.DESKTOP,
        checked: false
      }
    ]
  },
  {
    label: 'Messages, tasks and mailboxes assigned to me',
    settings: [
      {
        type: [
          NotificationSettingType.messageTaskAssignedMe,
          NotificationSettingType.newSharedMailBox
        ],
        platform: NotificationSettingPlatform.DESKTOP,
        checked: false
      }
    ]
  },
  {
    label: 'New comments and mentions',
    settings: [
      {
        type: NotificationSettingType.mentionedInternalNote,
        platform: NotificationSettingPlatform.DESKTOP,
        checked: false
      }
    ]
  },
  {
    label: 'Updates to company policies',
    settings: [
      {
        type: NotificationSettingType.companyPolicy,
        platform: NotificationSettingPlatform.DESKTOP,
        checked: false
      }
    ]
  }
];

export const PORTAL_PORTFOLIO_REMINDERS = [
  {
    label: '',
    settings: [
      {
        type: NotificationSettingType.changesToDatesOrStatuses,
        platform: NotificationSettingPlatform.DESKTOP,
        checked: false
      }
    ],
    type: NotificationSettingType.changesToDatesOrStatuses
  }
];
