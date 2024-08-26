import { Inject, Injectable } from '@angular/core';
import {
  STORE_CACHE_MEMORY_LIMIT,
  StoreMemoryCacheService
} from '@core/store/shared';
import { IAgency } from '@shared/types/users-by-property.interface';

@Injectable()
export class TenantProspectMemoryCacheService extends StoreMemoryCacheService<
  IAgency[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
