import { Inject, Injectable } from '@angular/core';
import { OtherContact } from '@shared/types/other-contact.interface';
import {
  STORE_CACHE_MEMORY_LIMIT,
  StoreMemoryCacheService
} from '@core/store/shared';

@Injectable()
export class OtherContactMemoryCacheService extends StoreMemoryCacheService<
  OtherContact[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
