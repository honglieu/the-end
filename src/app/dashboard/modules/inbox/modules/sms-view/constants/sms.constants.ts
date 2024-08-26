import { TaskStatusType } from '@/app/shared/enum';

export const SMS_TAB = [
  {
    title: 'OPEN',
    unread: false,
    link: '/dashboard/inbox/sms-messages/all',
    queryParam: {
      status: TaskStatusType.inprogress,
      taskId: null,
      conversationId: null
    }
  },
  {
    title: 'RESOLVED',
    unread: false,
    link: '/dashboard/inbox/sms-messages/resolved',
    queryParam: {
      status: TaskStatusType.completed,
      taskId: null,
      conversationId: null
    }
  }
];
