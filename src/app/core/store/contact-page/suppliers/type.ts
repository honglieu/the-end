import { SupplierProperty } from '@shared/types/users-supplier.interface';
import { ParamsSuppliers } from '@/app/user/utils/user.type';
import { EntityState } from '@ngrx/entity';

export interface IDBISupplier {
  list: SupplierProperty[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface SupplierReducerState extends EntityState<SupplierProperty> {
  firstInitial: boolean;
  fetching: boolean;
  fetchingMore: boolean;
  error: unknown;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isCompletedScroll: boolean;
  payload: Partial<ParamsSuppliers>;
}
