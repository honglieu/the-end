import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import { VacateDetailPayload } from './rent-manager-vacate-detail.type';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

@Injectable()
export class RentManagerVacateDetailService {
  constructor(private apiService: ApiService) {}

  syncToRentManager(payload: VacateDetailPayload) {
    return this.apiService.post<
      VacateDetailPayload,
      { dataSync: any; status: ESyncStatus; errorMessage?: string }
    >(`${conversations}tenant-vacate/sync-rm-vacate-tenancy`, payload);
  }

  remoteVacateDetail(taskId) {
    return this.apiService.deleteAPI(
      conversations,
      `/tenant-vacate/remove-sync-to-property-tree`,
      { taskId }
    );
  }
}
