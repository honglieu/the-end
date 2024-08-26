import { EMailBoxType, ProtectionImapType } from '@shared/enum/inbox.enum';

export interface ProtectionIMAP {
  label: string;
  value: ProtectionImapType;
}

export interface ServerIMAP {
  host: string;
  port: string;
  protection: string;
}

export interface ImapForm {
  mailBoxId: string;
  email: string;
  name: string;
  picture: string;
  password: string;
  inboxServer: ServerIMAP;
  outboxServer: ServerIMAP;
  type: EMailBoxType;
}
