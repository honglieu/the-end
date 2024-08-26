import { Inject, Injectable } from '@angular/core';
import {
  STORE_CACHE_MEMORY_LIMIT,
  StoreMemoryCacheService
} from '@core/store/shared';
import { MailFolder } from '@core/store/mail-folder/types';

@Injectable()
export class MailFolderMemoryCacheService extends StoreMemoryCacheService<
  MailFolder[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
