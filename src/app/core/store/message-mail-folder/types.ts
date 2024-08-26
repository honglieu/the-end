import {
  EmailItem,
  IEmailQueryParams,
  IMessagesResponse
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { EntityState } from '@ngrx/entity';

export interface MessagesMailFolder extends EmailItem {}
export interface MessagesMailFolderResponse extends IMessagesResponse {
  error?: unknown;
}

export interface MessagesMailFolderReducerState
  extends EntityState<MessagesMailFolder> {
  fetching: boolean;
  fetchingMore?: boolean;
  total?: number;
  currentPage?: number;
  scrollBottomIndex?: number;
  scrollTopIndex?: number;
  messages: Array<MessagesMailFolder>;
  res?: MessagesMailFolderResponse;
  payload: Partial<IEmailQueryParams>;
}
