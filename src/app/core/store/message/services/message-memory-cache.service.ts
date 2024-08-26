import { TaskItem } from '@shared/types/task.interface';
import { Inject, Injectable } from '@angular/core';
import { StoreMemoryCacheService } from '@core/store/shared';
import { STORE_CACHE_MEMORY_LIMIT } from '@core/store/shared/config';

@Injectable()
export class MessageMemoryCacheService extends StoreMemoryCacheService<
  TaskItem[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
