import { Inject, Injectable } from '@angular/core';
import { StoreMemoryCacheService } from '@core/store/shared';
import { STORE_CACHE_MEMORY_LIMIT } from '@core/store/shared/config';
import { EmailItem } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';

@Injectable()
export class MessagesMailFolderMemoryCacheService extends StoreMemoryCacheService<
  EmailItem[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
