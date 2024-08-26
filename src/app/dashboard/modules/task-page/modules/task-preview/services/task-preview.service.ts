import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskPreviewService {
  private triggerOpenTaskFormCalenderSession = new BehaviorSubject<boolean>(
    false
  );
  public triggerOpenTaskFormCalenderSession$ =
    this.triggerOpenTaskFormCalenderSession.asObservable();
  constructor() {}

  public setTriggerOpenTaskFormCalender(value: boolean) {
    this.triggerOpenTaskFormCalenderSession.next(value);
  }
}
