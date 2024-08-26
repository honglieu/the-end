import { Inject, Injectable } from '@angular/core';
import {
  STORE_CACHE_MEMORY_LIMIT,
  StoreMemoryCacheService
} from '@core/store/shared';
import { SupplierProperty } from '@shared/types/users-supplier.interface';

@Injectable()
export class SupplierMemoryCacheService extends StoreMemoryCacheService<
  SupplierProperty[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
