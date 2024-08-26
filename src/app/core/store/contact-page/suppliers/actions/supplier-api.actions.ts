import { createActionGroup, props } from '@ngrx/store';
import { IDBISupplier } from '@core/store/contact-page/suppliers/type';
import { ParamsSuppliers } from '@/app/user/utils/user.type';
import { SupplierProperty } from '@shared/types/users-supplier.interface';

export const supplierApiActions = createActionGroup({
  source: 'Supplier API',
  events: {
    'Get Supplier Success': props<{
      data?: IDBISupplier;
      payload?: ParamsSuppliers;
    }>(),
    'Get New Page Success': props<{ suppliers?: Array<SupplierProperty> }>(),
    'Get Supplier Failure': props<{ error: unknown }>()
  }
});
