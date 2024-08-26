import { EEventType } from '@/app/shared';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class FolderTaskListService {
  private calenderWidgetExpiredDaysBS = new BehaviorSubject<
    Record<EEventType, number>
  >(null);
  public calenderWidgetExpiredDays$ =
    this.calenderWidgetExpiredDaysBS.asObservable();

  constructor() {}

  setCalenderWidgetExpiredDays(value: Record<EEventType, number>) {
    this.calenderWidgetExpiredDaysBS.next(value);
  }
}
