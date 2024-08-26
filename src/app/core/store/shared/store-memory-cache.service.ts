import { Inject, Injectable } from '@angular/core';
import { roughSizeOfObject } from '@shared/utils/helper-functions';
import { STORE_CACHE_MEMORY_LIMIT } from './config';

@Injectable()
export abstract class StoreMemoryCacheService<TCacheValue> {
  private readonly cacheMap = new Map<string, TCacheValue>();
  private cacheSizeMap: Array<{ key: string; size: number }> = [];
  private totalSize = 0;

  constructor(
    @Inject(STORE_CACHE_MEMORY_LIMIT) protected readonly memoryLimit: number
  ) {
    if (isNaN(memoryLimit)) {
      throw new Error('Memory limit must be a number');
    }
    if (memoryLimit <= 0) {
      throw new Error('Memory limit must be greater than 0');
    }
  }

  public set(key: string, value: TCacheValue): void {
    this.cacheMap.set(key, value);
    this.scheduleTask(() => {
      const size = roughSizeOfObject(value);
      this.totalSize += size;
      this.cacheSizeMap.push({ key, size });
      this.checkCacheSize();
    });
  }

  public has(key: string): boolean {
    return this.cacheMap.has(key);
  }

  public get(key: string): TCacheValue {
    return this.cacheMap.get(key);
  }

  public delete(key: string): void {
    this.cacheMap.delete(key);
    this.scheduleTask(() => {
      const index = this.cacheSizeMap.findIndex((cache) => cache.key === key);
      if (index !== -1) {
        this.totalSize -= this.cacheSizeMap[index].size;
        this.cacheSizeMap.splice(index, 1);
      }
    });
  }

  public clear(): void {
    this.cacheMap.clear();
    this.cacheSizeMap = [];
    this.totalSize = 0;
  }

  /**
   * Checks the cache size and removes caches if the total size exceeds the memory limit.
   */
  private checkCacheSize(): void {
    console.debug(
      'Total size:',
      this.totalSize,
      'Memory limit:',
      this.memoryLimit
    );
    while (this.cacheSizeMap.length > 0 && this.totalSize > this.memoryLimit) {
      const removedCache = this.cacheSizeMap.shift();
      this.totalSize -= removedCache.size;
      this.cacheMap.delete(removedCache.key);
    }
  }

  /**
   * Schedules a task to be executed when the browser is idle.
   * @param callBack The callback function to be executed when the browser is idle.
   */
  private scheduleTask(callBack: () => void): void {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(callBack);
    } else {
      window.setTimeout(callBack, 0);
    }
  }
}
