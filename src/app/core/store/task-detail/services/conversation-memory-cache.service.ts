import { Inject, Injectable } from '@angular/core';
import {
  STORE_CACHE_MEMORY_LIMIT,
  StoreMemoryCacheService
} from '@core/store/shared';
import { UserConversation } from '@shared/types/conversation.interface';

@Injectable()
export class TaskConversationMemoryCacheService extends StoreMemoryCacheService<
  Partial<UserConversation>[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
