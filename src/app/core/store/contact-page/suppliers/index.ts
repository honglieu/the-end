import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { supplierReducer } from './reducers/supplier.reducer';

export const supplierFeature = createFeature({
  name: StoreFeatureKey.SUPPLIER,
  reducer: supplierReducer
});
