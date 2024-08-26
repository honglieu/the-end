import { Inject, Injectable } from '@angular/core';
import {
  STORE_CACHE_MEMORY_LIMIT,
  StoreMemoryCacheService
} from '@core/store/shared';
import { IAgentUserProperties } from '@/app/user/list-property-contact-view/model/main';

@Injectable()
export class TenantOwnerRmMemoryCacheService extends StoreMemoryCacheService<
  IAgentUserProperties[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
