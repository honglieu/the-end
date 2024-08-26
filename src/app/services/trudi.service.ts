import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ApiService } from '@services/api.service';
import {
  TrudiResponse,
  TrudiResponseType
} from '@shared/types/trudi.interface';

@Injectable({
  providedIn: 'root'
})
export class TrudiService<T extends TrudiResponseType = TrudiResponse> {
  private trudiResponse = new BehaviorSubject<T>(null);
  public isConfirmSchedule$ = new Subject<boolean>();

  constructor(private apiService: ApiService) {}

  get getTrudiResponse() {
    return this.trudiResponse;
  }

  set updateTrudiResponse(data: T) {
    this.trudiResponse.next(data);
  }
}
