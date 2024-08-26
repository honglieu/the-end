import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { TrudiValidateStatus } from '@core';

@Injectable()
export class TrudiFormStatusService {
  formStatusChanges = new ReplaySubject<{
    status: TrudiValidateStatus;
    hasFeedback: boolean;
  }>(1);
}
