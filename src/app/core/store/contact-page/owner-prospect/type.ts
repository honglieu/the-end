import {
  UserProperty,
  UsersByProperty
} from '@shared/types/users-by-property.interface';
import { ParamsTenantLandlordsProspect } from '@/app/user/utils/user.type';
import { EntityState } from '@ngrx/entity';

export interface IDBOwnerProspect extends UsersByProperty {
  userProperties: UserProperty[];
}

export interface OwnerProspectReducerState extends EntityState<UserProperty> {
  firstInitial: boolean;
  fetching: boolean;
  fetchingMore: boolean;
  error: unknown;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isCompletedScroll: boolean;
  payload: Partial<ParamsTenantLandlordsProspect>;
}
