import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiStatusService {
  private apiStatuses: Map<EApiNames, boolean> = new Map();
  private triggerEnableSteps: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  setApiStatus(apiName: EApiNames, status: boolean): void {
    this.apiStatuses.set(apiName, status);
    this.checkTriggerEnableSteps(apiName);
  }

  getApiStatus(apiName: EApiNames): boolean {
    return this.apiStatuses.get(apiName) || false;
  }

  checkTriggerEnableSteps(apiName: EApiNames): void {
    const requiredApis = [
      EApiNames.GetTaskById,
      EApiNames.GetAgencyProperties,
      EApiNames.GetFullDataPTWidget,
      EApiNames.PutStepDecisionTaskDetail
    ];

    if (requiredApis.includes(apiName)) {
      const status = requiredApis.every((apiName) => {
        if (this.apiStatuses.has(apiName)) {
          return this.getApiStatus(apiName);
        }
        return true;
      });
      this.triggerEnableSteps.next(status);
    }
  }

  get getTriggerEnableSteps(): Observable<boolean> {
    return this.triggerEnableSteps.asObservable();
  }
}

export enum EApiNames {
  GetTaskById = 'GetTaskById',
  GetAgencyProperties = 'GetAgencyProperties',
  GetFullDataPTWidget = 'GetFullDataPTWidget',
  PutStepDecisionTaskDetail = 'PutStepDecisionTaskDetail'
}
