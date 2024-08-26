import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IRMIssueBillData } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue-bill-details.interface';

@Injectable()
export class RentManagerIssueBillDetailsService {
  private currentBillDetailsBS = new BehaviorSubject<IRMIssueBillData>(null);
  public currentBillDetails$ = this.currentBillDetailsBS.asObservable();
  constructor() {}

  public setBillDetails(data) {
    this.currentBillDetailsBS.next(data);
  }
}
