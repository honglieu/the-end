import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import {
  IInspectionResourcesRes,
  IRentManagerInspection,
  ISyncRmInspection
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/interfaces/rent-manager-inspection.interface';
import { conversations } from 'src/environments/environment';

@Injectable()
export class RentManagerInspectionApiService {
  constructor(private apiService: ApiService) {}

  syncRmInspection(
    body: ISyncRmInspection
  ): Observable<IRentManagerInspection> {
    return this.apiService.postAPI(
      conversations,
      'widget/service-inspection/v2/sync-inspection',
      body
    );
  }

  getRmInspectionResource(
    agencyId: string,
    propertyId: string
  ): Observable<IInspectionResourcesRes> {
    return this.apiService.getAPI(
      conversations,
      `widget/service-inspection/inspection-resources?propertyId=${propertyId}`,
      { agencyId }
    );
  }

  deleteSyncInspection(inspectionId: string, taskId: string) {
    return this.apiService.deleteAPI(
      conversations,
      `widget/service-inspection/remove-sync-inspection?inspectionId=${inspectionId}&taskId=${taskId}`
    );
  }
}
