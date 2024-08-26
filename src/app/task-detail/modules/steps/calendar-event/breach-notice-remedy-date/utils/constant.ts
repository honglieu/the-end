import { ActionSendMsgDropdown } from './breach-notice.type';
import { ESendMsgAction } from './breach-notice.enum';

export const DROP_DOWN_BREACH_NOTICE: ActionSendMsgDropdown[] = [
  {
    id: 0,
    icon: '/assets/icon/time.svg',
    buttonIcon: '/assets/icon/fill-time.svg',
    action: ESendMsgAction.Schedule
  },
  {
    id: 1,
    icon: '/assets/icon/complete-icon-outline.svg',
    buttonIcon: '/assets/icon/send-arrow.svg',
    action: ESendMsgAction.SendAndResolve
  },
  {
    id: 2,
    icon: '/assets/icon/send-arrow-blank.svg',
    buttonIcon: '/assets/icon/send-arrow.svg',
    action: ESendMsgAction.Send
  }
];
