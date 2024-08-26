import { IEmailClientFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { EntityState } from '@ngrx/entity';

export interface MailFolder extends IEmailClientFolder {}
export interface MailFolderReducerState extends EntityState<MailFolder> {
  fetching: boolean;
  error: unknown;
  payload: Partial<MailFolderPayloadType>;
}

export type MailFolderPayloadType = {
  mailBoxId: string;
};
