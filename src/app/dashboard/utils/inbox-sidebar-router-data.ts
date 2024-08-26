import { EFolderType } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { TaskStatusType } from '@shared/enum/task.enum';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';

export const MESSAGE_INBOX_ROUTE_DATA = {
  id: '1',
  name: 'Email',
  type: EFolderType.EMAIL,
  status: TaskStatusType.inprogress,
  icon: 'mailThin',
  unReadMsgCount: 0,
  total: null,
  hoverTotal: null,
  routerLink: ERouterLinkInbox.MSG_INPROGRESS,
  folderType: EFolderType.EMAIL
};

export const APP_MESSAGE_ROUTE_DATA = {
  id: '2',
  name: 'Trudi® App',
  title: 'Trudi® App',
  type: EFolderType.APP_MESSAGES,
  status: TaskStatusType.inprogress,
  icon: 'TrudiSmartphone',
  unReadMsgCount: 0,
  total: null,
  hoverTotal: null,
  routerLink: ERouterLinkInbox.APP_MESSAGES,
  folderType: EFolderType.APP_MESSAGES
};

export const VOICE_MAIL_INBOX_ROUTE_DATA = {
  id: '3',
  name: 'Voicemail',
  title: 'Voicemail',
  type: EFolderType.VOICEMAIL_MESSAGES,
  status: TaskStatusType.inprogress,
  icon: 'voiceMail2',
  unReadMsgCount: 0,
  total: null,
  hoverTotal: null,
  routerLink: ERouterLinkInbox.VOICEMAIL_MESSAGES,
  folderType: EFolderType.VOICEMAIL_MESSAGES
};

export const SMS_ROUTE_DATA = {
  id: '4',
  name: 'SMS',
  title: 'SMS',
  type: EFolderType.SMS,
  status: TaskStatusType.inprogress,
  icon: 'sms',
  unReadMsgCount: 0,
  total: null,
  hoverTotal: null,
  routerLink: ERouterLinkInbox.SMS_MESSAGES,
  folderType: EFolderType.SMS
};

export const FACEBOOK_INBOX_ROUTE_DATA = {
  id: '5',
  name: 'Messenger',
  title: 'Messenger',
  type: EFolderType.MESSENGER,
  status: TaskStatusType.inprogress,
  icon: 'Messenger',
  unReadMsgCount: 0,
  total: null,
  hoverTotal: null,
  routerLink: ERouterLinkInbox.MESSENGER,
  folderType: EFolderType.MESSENGER
};

export const WHATSAPP_INBOX_ROUTE_DATA = {
  id: '6',
  name: 'WhatsApp',
  title: 'WhatsApp',
  type: EFolderType.WHATSAPP,
  status: TaskStatusType.inprogress,
  icon: 'Whatsapp',
  unReadMsgCount: 0,
  total: null,
  hoverTotal: null,
  routerLink: ERouterLinkInbox.WHATSAPP,
  folderType: EFolderType.WHATSAPP
};
