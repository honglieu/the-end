import { Inject, Injectable } from '@angular/core';
import { StoreMemoryCacheService } from '@core/store/shared';
import { STORE_CACHE_MEMORY_LIMIT } from '@core/store/shared/config';
import { IMessage } from '@shared/types/message.interface';

@Injectable()
export class VoicemailDetailMessagesMemoryCacheService extends StoreMemoryCacheService<
  Partial<IMessage>[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
