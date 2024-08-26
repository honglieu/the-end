import { StoreMemoryCacheService } from '@core/store/shared';
import { Inject, Injectable } from '@angular/core';
import { STORE_CACHE_MEMORY_LIMIT } from '@core/store/shared/config';
import { CalendarEvent } from '@core/store/calendar-dashboard/types';

@Injectable()
export class CalendarDashboardCacheService extends StoreMemoryCacheService<
  CalendarEvent[]
> {
  constructor(@Inject(STORE_CACHE_MEMORY_LIMIT) memoryLimit: number) {
    super(memoryLimit);
  }
}
