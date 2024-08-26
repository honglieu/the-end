import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ERentManagerIssuePopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';

@Injectable()
export class PopupManagementService {
  constructor() {}

  private currentPopup: BehaviorSubject<ERentManagerIssuePopup> =
    new BehaviorSubject(null);
  public currentPopup$ = this.currentPopup.asObservable();

  public setCurrentPopup(value: ERentManagerIssuePopup) {
    this.currentPopup.next(value);
  }
}
