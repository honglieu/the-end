import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';

@Injectable()
export class WidgetPropertyTreeApiService {
  constructor(private apiService: ApiService) {}

  public closeInspectionEvent(body: ICloseInspectionPayload) {
    return this.apiService.postAPI(
      conversations,
      'widget/inspection/close',
      body
    );
  }

  public cancelInspectionEvent(body: ICancelInspectionPayload) {
    return this.apiService.postAPI(
      conversations,
      'widget/inspection/cancel',
      body
    );
  }
}

export interface ICloseInspectionPayload {
  inspectionId: string;
  agencyId: string;
  defaultChargeFee: boolean;
  stepId?: string;
}

export interface ICancelInspectionPayload {
  inspectionId: string;
  agencyId: string;
  stepId?: string;
}
