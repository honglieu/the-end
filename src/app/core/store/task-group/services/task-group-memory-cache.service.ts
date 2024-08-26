import { IGetTaskByFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { StoreMemoryCacheService } from '@core/store/shared';
import { Inject, Injectable } from '@angular/core';
import { STORE_CACHE_MEMORY_LIMIT } from '@core/store/shared/config';

@Injectable()
export class TaskGroupMemoryCacheService extends StoreMemoryCacheService<
  IGetTaskByFolder[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
