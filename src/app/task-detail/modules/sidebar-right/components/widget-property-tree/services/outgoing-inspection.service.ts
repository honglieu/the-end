import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  RoutineInspectionData,
  InspectionSyncData
} from '@shared/types/routine-inspection.interface';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import { WidgetPTService } from './widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { TrudiService } from '@services/trudi.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';

@Injectable()
export class OutgoingInspectionSyncService {
  public selectedOutgoingInspections$: BehaviorSubject<
    InspectionSyncData | RoutineInspectionData
  > = new BehaviorSubject<InspectionSyncData | RoutineInspectionData>(null);
  public isSyncOutgoingInSpection = new BehaviorSubject(false);
  constructor(
    private apiService: ApiService,
    public widgetPTService: WidgetPTService,
    private trudiService: TrudiService
  ) {}

  syncOutgoingInspection(data) {
    return this.apiService.postAPI(
      conversations,
      'widget/inspection/sync-to-pt',
      data
    );
  }

  reTrySyncOutgoingInspection(data) {
    return this.apiService.postAPI(
      conversations,
      'widget/inspection/retry',
      data
    );
  }

  editOutgoingInspection(data, taskId: string) {
    return this.apiService.putAPI(
      conversations,
      `widget/inspection/${taskId}`,
      data
    );
  }

  removeOutgoingInspection(id: string) {
    return this.apiService.deleteAPI(conversations, `widget/inspection/${id}`);
  }

  getFullListOutgoingInspection(taskId: string) {
    return this.apiService.getAPI(
      conversations,
      `/widget/inspection/get-list-inspection?taskId=${taskId}&type=Outgoing`
    );
  }

  getEventInspectionList(
    taskId: string
  ): Observable<{ inspections: RoutineInspectionData[] }> {
    return this.apiService.getAPI(
      conversations,
      `widget/inspection/get-list-existing-inspections?taskId=${taskId}&type=Outgoing`
    );
  }

  updateListOutgoingInspection(data: InspectionSyncData, id: string) {
    const prevData = this.widgetPTService.outgoingInspections.getValue();
    let newData = [...prevData.filter((one) => one.id !== id)].map((item) => {
      if (item?.firstTimeSyncSuccess) {
        return { ...item, firstTimeSyncSuccess: false };
      }
      return item;
    });
    if (data) {
      newData = [data, ...newData];
      this.widgetPTService.setPTWidgetStateByType(
        PTWidgetDataField.OUTGOING_INSPECTION,
        'UPDATE',
        newData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      return;
    }
    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.OUTGOING_INSPECTION,
      'REMOVE',
      newData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  }

  updateStatusBtn() {
    const trudiBtnResponse = this.trudiService.getTrudiResponse.getValue();
    trudiBtnResponse?.data[0]?.body?.decisions?.forEach((decision) => {
      decision?.button?.forEach((button) => {
        if (button?.action?.includes('schedule_exit_inspection')) {
          button.isCompleted = true;
          button.status = TrudiButtonEnumStatus.COMPLETED;
        }
      });
    });
    this.trudiService.updateTrudiResponse = trudiBtnResponse;
  }

  setSelectedOutgoingInspection(
    data: InspectionSyncData | RoutineInspectionData
  ) {
    this.selectedOutgoingInspections$.next(data);
  }

  getSelectedOutgoingInspection(): Observable<
    InspectionSyncData | RoutineInspectionData
  > {
    return this.selectedOutgoingInspections$.asObservable();
  }
}
