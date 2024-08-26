import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Used in input-group/input-number-group to make sure components in addon work well
@Injectable()
export class TrudiFormNoStatusService {
  noFormStatus = new BehaviorSubject<boolean>(false);
}
