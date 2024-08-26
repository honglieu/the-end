import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, filter, map } from 'rxjs';
import {
  StatisticUnread,
  StatisticReminder
} from '@/app/dashboard/shared/types/statistic.interface';
import { IGlobalStatisticTask } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';

interface IStatisticTotalTask {
  type: string;
  value: number;
}

interface IUnreadInbox {
  [x: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticService {
  private statisticUnreadTask: BehaviorSubject<StatisticUnread> =
    new BehaviorSubject(null);

  private statisticTaskReminder: BehaviorSubject<StatisticReminder> =
    new BehaviorSubject(null);
  private statisticGlobalTask = new BehaviorSubject<IGlobalStatisticTask>(null);
  public statisticGlobalTask$ = this.statisticGlobalTask.asObservable();
  private triggerStatisticGlobalTask = new Subject<void>();
  public triggerStatisticGlobalTask$ =
    this.triggerStatisticGlobalTask.asObservable();

  // statisticTotalTask save total tasks, messages or emails on active sidebar item
  private statisticTotalTask: BehaviorSubject<IStatisticTotalTask> =
    new BehaviorSubject(null);
  public statisticTotalTask$ = this.statisticTotalTask
    .asObservable()
    .pipe(map((data) => (Boolean(data) ? data.value : null)));
  private unreadInbox$: BehaviorSubject<IUnreadInbox> = new BehaviorSubject(
    null
  );

  // statistic total task channel messagers(facebook)
  private statisticUnreadTaskChannel: BehaviorSubject<StatisticUnread> =
    new BehaviorSubject(null);

  constructor() {}

  /**
   * @param data an object in which value is the value of the total task, type is the key to distinguish the total between task types.
   * Note: - The type value of message list and email list is its status
   *       - The type value of task list is its taskTypeID
   */
  public setStatisticTotalTask(data: IStatisticTotalTask) {
    this.statisticTotalTask.next(data);
  }

  public updateStatisticTotalTask(type: string, value: number) {
    if (
      type === this.statisticTotalTask.value?.type &&
      typeof value === 'number'
    ) {
      const newValue =
        Number(this.statisticTotalTask.value.value) + Number(value);
      this.statisticTotalTask.next({
        ...this.statisticTotalTask.value,
        value: newValue >= 0 ? newValue : 0
      });
    }
  }

  public setTriggerStatisticGlobalTask() {
    this.triggerStatisticGlobalTask.next();
  }
  public setStatisticGlobalTask(data: IGlobalStatisticTask) {
    this.statisticGlobalTask.next(data);
  }

  public getStatisticUnreadTask() {
    return this.statisticUnreadTask.asObservable();
  }

  public getStatisticTaskReminder() {
    return this.statisticTaskReminder.asObservable();
  }

  public getStatisticUnreadTaskChannel() {
    return this.statisticUnreadTaskChannel.asObservable();
  }

  public setStatisticUnreadTask(data: StatisticUnread) {
    const previousData = this.statisticUnreadTask.getValue() || {};
    const newData = { ...previousData, ...data };
    this.statisticUnreadTask.next(newData);
  }

  public setStatisticTaskReminder(data: StatisticReminder) {
    this.statisticTaskReminder.next(data);
  }

  public setStatisticUnreadInbox(data: IUnreadInbox) {
    const previousData = this.unreadInbox$.getValue() || {};
    const newData = { ...previousData, ...data };
    this.unreadInbox$.next(newData);
  }

  public setStatisticUnreadTaskChannel(data: StatisticUnread) {
    const previousData = this.statisticUnreadTaskChannel.getValue() || {};
    const newData = { ...previousData, ...data };
    this.statisticUnreadTaskChannel.next(newData);
  }

  public updateStatisticUnreadInbox(mailBoxId: string, value: boolean) {
    const previousData = this.unreadInbox$.getValue() || {};
    this.unreadInbox$.next({
      ...previousData,
      [mailBoxId]: value
    });
  }

  public getStatisticUnreadInbox() {
    return this.unreadInbox$.pipe(
      map((res) => {
        return res || {};
      })
    );
  }

  public getStatisticUnreadTabsInbox(isShowMessageInTask = false) {
    const messageField = isShowMessageInTask ? 'messageInTask' : 'message';
    return this.getStatisticUnreadTask().pipe(
      map((res) => {
        if (!res) return { myInbox: false, teamInbox: false };
        const unread = {};
        for (let mailBoxId in res) {
          unread[mailBoxId] = {
            myInbox: this.checkUnreadMessage(
              res[mailBoxId].myInbox?.[messageField]
            ),
            teamInbox: this.checkUnreadMessage(
              res[mailBoxId].teamInbox?.[messageField]
            )
          };
        }
        return unread;
      })
    );
  }

  checkUnreadMessage(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (this.checkUnreadMessage(obj[key])) {
          return true;
        }
      } else if (obj[key] && obj[key] !== 0) {
        return true;
      }
    }
    return false;
  }

  hasUnreadTask(isMyTask: boolean) {
    return this.statisticGlobalTask$.pipe(
      filter((val) => !!val),
      map((statistic) => {
        const { teamInbox, myInbox } = statistic || {};
        const taskType = isMyTask ? myInbox : teamInbox;
        const hasUnreadTask = Object.values(taskType.task).some(
          (val) => val > 0
        );
        const hasInternalNote = Object.values(taskType.internalNote).some(
          (val) => val > 0
        );
        return hasUnreadTask || hasInternalNote;
      })
    );
  }
}
