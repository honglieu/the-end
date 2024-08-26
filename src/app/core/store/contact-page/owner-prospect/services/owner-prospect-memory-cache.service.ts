import { Inject, Injectable } from '@angular/core';
import {
  STORE_CACHE_MEMORY_LIMIT,
  StoreMemoryCacheService
} from '@core/store/shared';
import { UserProperty } from '@shared/types/users-by-property.interface';

@Injectable()
export class OwnerProspectMemoryCacheService extends StoreMemoryCacheService<
  UserProperty[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
