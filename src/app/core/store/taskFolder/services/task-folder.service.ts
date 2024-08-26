import { ITaskFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { Inject, Injectable } from '@angular/core';
import { StoreMemoryCacheService } from '@core/store/shared';
import { STORE_CACHE_MEMORY_LIMIT } from '@core/store/shared/config';

@Injectable()
export class TaskFolderMemoryCacheService extends StoreMemoryCacheService<
  ITaskFolder[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
