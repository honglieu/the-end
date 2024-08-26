import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  RoutineInspectionData,
  InspectionSyncData
} from '@shared/types/routine-inspection.interface';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import { AgencyService } from '@services/agency.service';
import { WidgetPTService } from './widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';

@Injectable()
export class RoutineInspectionSyncService {
  public trudiConversationId: BehaviorSubject<string> = new BehaviorSubject('');
  public selectedRoutineInspections$: BehaviorSubject<
    InspectionSyncData | RoutineInspectionData
  > = new BehaviorSubject<InspectionSyncData | RoutineInspectionData>(null);
  public isSyncRoutineInSpection = new BehaviorSubject(false);
  constructor(
    private apiService: ApiService,
    private agencyService: AgencyService,
    public widgetPTService: WidgetPTService,
    private routineInspectionService: RoutineInspectionService
  ) {}

  syncRoutineInspection(data) {
    return this.apiService.postAPI(
      conversations,
      'widget/inspection/sync-to-pt',
      data
    );
  }

  updateSyncRoutineInspection(inspection, id: string) {
    return this.apiService.putAPI(
      conversations,
      `widget/inspection/${id}`,
      inspection
    );
  }

  reTrySyncRoutineInspection(data) {
    return this.apiService.postAPI(
      conversations,
      'widget/inspection/retry',
      data
    );
  }

  removeRoutineInspection(id: string) {
    return this.apiService.deleteAPI(conversations, `widget/inspection/${id}`);
  }

  getEventInspectionList(
    taskId: string
  ): Observable<{ inspections: RoutineInspectionData[] }> {
    return this.apiService.getAPI(
      conversations,
      `widget/inspection/get-list-existing-inspections?taskId=${taskId}&type=Routine`
    );
  }

  updateListRoutineInspection(data: InspectionSyncData, id: string) {
    const prevData = this.widgetPTService.routineInspections.getValue();
    let newData = [...prevData.filter((one) => one.id !== id)].map((item) => {
      if (item?.firstTimeSyncSuccess) {
        return { ...item, firstTimeSyncSuccess: false };
      }
      return item;
    });
    if (data) {
      newData = [data, ...newData];
      this.widgetPTService.setPTWidgetStateByType(
        PTWidgetDataField.ROUTINE_INSPECTION,
        'UPDATE',
        newData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      return;
    }
    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.ROUTINE_INSPECTION,
      'REMOVE',
      newData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  }

  updateStatusBtn() {
    const trudiBtnResponse =
      this.routineInspectionService.routineInspectionResponse.getValue();
    if (
      trudiBtnResponse?.data?.[0]?.body?.Scheduled?.button?.[0]?.isCompleted ===
      false
    ) {
      trudiBtnResponse.data[0].body.Scheduled.button[0].isCompleted = true;
      trudiBtnResponse.data[0].body.Scheduled.button[0].status =
        TrudiButtonEnumStatus.COMPLETED;
      this.routineInspectionService.routineInspectionResponse.next(
        trudiBtnResponse
      );
    }
  }

  setSelectedRoutineInspection(
    data: InspectionSyncData | RoutineInspectionData
  ) {
    this.selectedRoutineInspections$.next(data);
  }

  getSelectedRoutineInspection(): Observable<
    InspectionSyncData | RoutineInspectionData
  > {
    return this.selectedRoutineInspections$.asObservable();
  }
}
