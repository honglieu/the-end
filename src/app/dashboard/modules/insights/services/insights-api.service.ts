import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { Agent } from '@shared/types/agent.interface';
import { agencies, users } from 'src/environments/environment';
import {
  IGetInsightsDataPayload,
  IInsightEnquiryResponse,
  IInsightExportPayload,
  IInsightExportResponse,
  IInsightsData,
  IInsightsEnquiryPayload,
  IInsightsTaskDataPayload,
  ISettingConfig
} from '@/app/dashboard/modules/insights/interfaces/insights.interface';

@Injectable({
  providedIn: 'root'
})
export class InsightsApiService {
  constructor(private apiService: ApiService) {}

  getInsightsData(payload: IGetInsightsDataPayload): Observable<IInsightsData> {
    return this.apiService.postAPI(
      agencies,
      'insight/get-insight-data',
      payload
    );
  }

  getFileExport(
    body: IInsightExportPayload
  ): Observable<IInsightExportResponse> {
    return this.apiService.postAPI(agencies, 'insight/export', {
      ...body
    });
  }

  getEnquiryChart(
    payload: IInsightsEnquiryPayload
  ): Observable<IInsightEnquiryResponse> {
    return this.apiService.postAPI(
      agencies,
      'insight/get-enquiry-chart-data',
      payload
    );
  }

  getTaskData(
    payload: IInsightsTaskDataPayload
  ): Observable<IInsightEnquiryResponse> {
    return this.apiService.postAPI(agencies, 'insight/get-task-data', payload);
  }

  saveInsightSettings(payload: ISettingConfig): Observable<ISettingConfig> {
    return this.apiService.postAPI(agencies, `/insight/save-settings`, payload);
  }

  getListOfAgent(): Observable<Agent[]> {
    return this.apiService.postAPI(users, 'insight/list-of-agent', {});
  }
}
