import { UsersByProperty } from '@shared/types/users-by-property.interface';
import { ParamsTenantLandlordsProspect } from '@/app/user/utils/user.type';
import { EntityState } from '@ngrx/entity';

export interface IDBTenantProspect extends UsersByProperty {}

export interface TenantProspectReducerState extends EntityState<any> {
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
