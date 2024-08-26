import { IRequestItemToDisplay } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { IRequestItemToDisplayVoiceMail } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { ITicket, ITicketFile, ITicketResponse } from '@/app/shared';

export interface ITicketLinked extends ITicket {}

export interface IResponse extends ITicketResponse {
  isTicketMessage?: boolean;
  functionCall?: string;
  isShowListEmergency?: boolean;
}

interface IConversationLinked {
  id: string;
  title: string;
  status: string;
  conversationType: string;
  mailBoxId: string;
  channelId?: string;
  property?: {
    address: string;
    id: string;
    isTemporary: boolean;
    postCode: string;
    state: string;
    streetline: string;
    suburb: string;
    unitNo: string;
  };
  propertyId: string;
  task: {
    id: string;
    title: string;
    status: string;
    type: string;
    agentTasks: IAgentTasks[];
  };
  user: IUserMessage;
}

interface IAgentTasks {
  id: string;
  userId: string;
}

export interface IUserMessage {
  id: string;
  firstName?: string;
  lastName?: string;
  isTemporary: boolean;
  email: string;
  recognitionStatus: string | null;
  secondaryEmails: ISecondaryEmail[];
}

interface ISecondaryEmail {
  id: string;
  email: string;
}

export interface ILinkedActions {
  id: string;
  replyConversationId: string | null;
  messageType: string;
  textContent: string;
  message: string;
  textTranslatedContent: string;
  contextMessage: string | null;
  sessionId: string | null;
  options: {
    response: IResponse;
    status: string;
  };
  conversation: IConversationLinked;
  task: {
    id: string;
    title: string;
    status: string;
    type: string;
  };
  dataType: string;
  ticketFiles: ITicketFile[];
  relatedMessageId?: string;
}

export type IRequestItem =
  | IRequestItemToDisplay
  | IRequestItemToDisplayVoiceMail;
