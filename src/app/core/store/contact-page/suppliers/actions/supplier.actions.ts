import { createActionGroup, props } from '@ngrx/store';
import { SupplierProperty } from '@shared/types/users-supplier.interface';

export const supplierActions = createActionGroup({
  source: 'Supplier Page',
  events: {
    'Set All': props<{ suppliers: SupplierProperty[] }>(),
    'Get Cache Success': props<{ data: SupplierProperty[] }>()
  }
});
