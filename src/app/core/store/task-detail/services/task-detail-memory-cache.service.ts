import { Inject, Injectable } from '@angular/core';
import {
  STORE_CACHE_MEMORY_LIMIT,
  StoreMemoryCacheService
} from '@core/store/shared';
import { TaskItem } from '@shared/types/task.interface';

@Injectable()
export class TaskDetailMemoryCacheService extends StoreMemoryCacheService<TaskItem> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
