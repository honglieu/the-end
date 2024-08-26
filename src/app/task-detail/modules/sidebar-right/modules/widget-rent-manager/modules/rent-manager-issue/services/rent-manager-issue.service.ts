import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IRmIssueData } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';

@Injectable()
export class RentManagerIssueService {
  constructor() {}

  private rmIssueData: BehaviorSubject<IRmIssueData> =
    new BehaviorSubject<IRmIssueData>(null);
  public rmIssueData$: Observable<IRmIssueData> =
    this.rmIssueData.asObservable();

  public setRmIssueData(value: IRmIssueData) {
    this.rmIssueData.next(value);
  }
}
