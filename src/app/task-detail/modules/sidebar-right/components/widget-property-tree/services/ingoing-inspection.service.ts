import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { LeasingService } from '@services/leasing.service ';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import {
  InspectionSyncData,
  RoutineInspectionData
} from '@shared/types/routine-inspection.interface';
import { conversations } from 'src/environments/environment';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { WidgetPTService } from './widget-property.service';

@Injectable()
export class IngoingInspectionSyncService {
  public selectedIngoingInspections$: BehaviorSubject<
    InspectionSyncData | RoutineInspectionData
  > = new BehaviorSubject<InspectionSyncData | RoutineInspectionData>(null);
  public isSyncIngoingInSpection = new BehaviorSubject(false);
  constructor(
    private apiService: ApiService,
    public widgetPTService: WidgetPTService,
    public leasingService: LeasingService
  ) {}

  syncIngoingInspection(data) {
    return this.apiService.postAPI(
      conversations,
      'widget/inspection/sync-to-pt',
      data
    );
  }

  reTrySyncIngoingInspection(data) {
    return this.apiService.postAPI(
      conversations,
      'widget/inspection/retry',
      data
    );
  }

  editIngoingInspection(data, taskId: string) {
    return this.apiService.putAPI(
      conversations,
      `widget/inspection/${taskId}`,
      data
    );
  }

  removeIngoingInspection(id: string) {
    return this.apiService.deleteAPI(conversations, `widget/inspection/${id}`);
  }

  getEventInspectionList(
    taskId: string
  ): Observable<{ inspections: RoutineInspectionData[] }> {
    return this.apiService.getAPI(
      conversations,
      `widget/inspection/get-list-existing-inspections?taskId=${taskId}&type=Ingoing`
    );
  }

  updateListIngoingInspection(data: InspectionSyncData, id: string) {
    const prevData = this.widgetPTService.ingoingInspections.getValue();
    let newData = [...prevData.filter((one) => one.id !== id)].map((item) => {
      if (item?.firstTimeSyncSuccess) {
        return { ...item, firstTimeSyncSuccess: false };
      }
      return item;
    });
    if (data) {
      newData = [data, ...newData];
      this.widgetPTService.setPTWidgetStateByType(
        PTWidgetDataField.INGOING_INSPECTION,
        'UPDATE',
        newData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      return;
    }
    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.INGOING_INSPECTION,
      'REMOVE',
      newData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  }

  updateStatusBtn() {
    const trudiBtnResponse =
      this.leasingService.leasingRequestResponse.getValue();
    if (
      trudiBtnResponse?.data?.[0]?.body?.leasingStep?.[2]?.button?.[3]
        ?.isCompleted === false
    ) {
      trudiBtnResponse.data[0].body.leasingStep[2].button[3].isCompleted = true;
      trudiBtnResponse.data[0].body.leasingStep[2].button[3].status =
        TrudiButtonEnumStatus.COMPLETED;
      this.leasingService.leasingRequestResponse.next(trudiBtnResponse);
    }
  }

  setSelectedIngoingInspection(
    data: InspectionSyncData | RoutineInspectionData
  ) {
    this.selectedIngoingInspections$.next(data);
  }

  getSelectedIngoingInspection(): Observable<
    InspectionSyncData | RoutineInspectionData
  > {
    return this.selectedIngoingInspections$.asObservable();
  }
}
