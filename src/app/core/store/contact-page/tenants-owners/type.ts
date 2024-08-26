import { IAgentUserProperties } from '@/app/user/list-property-contact-view/model/main';
import { ParamsTenantsLandlords } from '@/app/user/utils/user.type';
import { EntityState } from '@ngrx/entity';

export interface IDBIUsersByProperty {
  propertyContacts: IAgentUserProperties[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface TenantsOwnersReducerState
  extends EntityState<IAgentUserProperties> {
  firstInitial: boolean;
  fetching: boolean;
  fetchingMore: boolean;
  error: unknown;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isCompletedScroll: boolean;
  payload: Partial<ParamsTenantsLandlords>;
}
