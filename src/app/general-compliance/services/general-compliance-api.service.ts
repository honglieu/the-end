import { Injectable } from '@angular/core';
import { of, switchMap } from 'rxjs';
import { ApiService } from '@services/api.service';
import { TrudiService } from '@services/trudi.service';
import { Observable } from 'rxjs';
import { TrudiResponse } from '@shared/types/trudi.interface';
import { conversations, users } from 'src/environments/environment';
import { EGeneralComplianceButtonAction } from '@/app/general-compliance/utils/generalComplianceType';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';

@Injectable({
  providedIn: 'root'
})
export class GeneralComplianceAPIService {
  constructor(
    private apiService: ApiService,
    private trudiService: TrudiService
  ) {}

  confirmGeneralComplianceDecision(body: {
    taskId: string;
    decisionIndex: string;
    reason: string;
  }): Observable<TrudiResponse> {
    return this.apiService.postAPI(
      conversations,
      'general-compliance/confirm-decision',
      body
    );
  }

  updateButtonStatus(
    taskId: string,
    action: EGeneralComplianceButtonAction,
    status: TrudiButtonEnumStatus
  ) {
    return this.apiService
      .postAPI(conversations, 'general-compliance/update-button-status', {
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
    return this.apiService.postAPI(
      conversations,
      'general-compliance/save-variable',
      {
        taskId,
        receivers,
        taskDetail
      }
    );
  }

  getListSupplierFromPT() {
    return this.apiService.getAPI(users, `get-all-suppliers-pt`);
  }
}
