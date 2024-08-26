import { dataTable } from '@shared/types/dataTable.interface';
import { OtherContact } from '@shared/types/other-contact.interface';
import { IOtherContactFilter } from '@/app/user/utils/user.type';
import { EntityState } from '@ngrx/entity';

export interface IDBOtherContact extends dataTable<OtherContact> {}

export interface OtherContactReducerState extends EntityState<OtherContact> {
  fetching: boolean;
  fetchingMore: boolean;
  error: unknown;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isCompletedScroll: boolean;
  payload: Partial<IOtherContactFilter>;
}
