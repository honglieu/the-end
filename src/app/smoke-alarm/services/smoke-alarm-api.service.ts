import { Injectable } from '@angular/core';
import { of, switchMap } from 'rxjs';
import { ApiService } from '@services/api.service';
import { TrudiService } from '@services/trudi.service';
import { Observable } from 'rxjs';
import { TrudiResponse } from '@shared/types/trudi.interface';
import { conversations, users } from 'src/environments/environment';
import { ESmokeAlarmButtonAction } from '@/app/smoke-alarm/utils/smokeAlarmType';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';

@Injectable({
  providedIn: 'root'
})
export class SmokeAlarmAPIService {
  constructor(
    private apiService: ApiService,
    private trudiService: TrudiService
  ) {}

  confirmSmokeAlarmDecision(body: {
    taskId: string;
    decisionIndex: string;
    reason: string;
  }): Observable<TrudiResponse> {
    return this.apiService.postAPI(
      conversations,
      'smoke-alarm/confirm-decision',
      body
    );
  }

  updateButtonStatus(
    taskId: string,
    action: ESmokeAlarmButtonAction,
    status: TrudiButtonEnumStatus
  ) {
    return this.apiService
      .postAPI(conversations, 'smoke-alarm/update-button-status', {
        taskId,
        action,
        status
      })
      .pipe(
        switchMap((el) => {
          if (status === TrudiButtonEnumStatus.PENDING) {
            const newReceivers =
              this.trudiService.getTrudiResponse.value?.data[0]?.variable?.receivers.filter(
                (el) => el.action !== action
              );
            return this.saveVariableResponseData(taskId, newReceivers);
          }
          return of(el);
        })
      );
  }

  saveVariableResponseData(taskId: string, receivers: any[], taskDetail?: any) {
    return this.apiService.postAPI(conversations, 'smoke-alarm/save-variable', {
      taskId,
      receivers,
      taskDetail
    });
  }

  getListSupplierFromPT() {
    return this.apiService.getAPI(users, `get-all-suppliers-pt`);
  }
}
