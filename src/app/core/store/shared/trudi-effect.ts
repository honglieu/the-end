import { Injectable } from '@angular/core';

@Injectable()
export abstract class TrudiEffect {
  /**
   * queues a task to be executed during a browser's idle periods
   * @param callback the task to be executed
   * @param timeout time after browser's idle period to execute the task
   * @param cancelable should the task can be canceled when new task is scheduled?
   */
  protected scheduleLowPriorityTask(
    callback: () => void,
    { timeout = 1000, cancelable = true } = {}
  ) {
    let runningTaskId: number | NodeJS.Timeout | null = null;
    const { execute, cancel } = this.scheduleMethodFactory(() => {
      callback();
      runningTaskId = null;
    }, timeout);

    if (runningTaskId && cancelable) {
      cancel(runningTaskId as number);
    }
    runningTaskId = execute();
  }

  private scheduleMethodFactory(callback: () => void, timeout: number = 0) {
    if (typeof window.requestIdleCallback === 'function') {
      return {
        execute: () => window.requestIdleCallback(callback, { timeout }),
        cancel: window.cancelIdleCallback
      };
    }
    return {
      execute: () => setTimeout(callback, timeout),
      cancel: clearTimeout
    };
  }
}
