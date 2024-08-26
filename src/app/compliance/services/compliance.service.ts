import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { Compliance } from '@shared/types/compliance.interface';
import { ICategoryItem } from '@/app/compliance/utils/compliance.type';
import { ESelectOpenComplianceItemPopup } from '@/app/compliance/utils/compliance.enum';
import { ESelectRadioComplianceItemPopup } from '@/app/compliance/utils/compliance.enum';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  public invoiceDataUpdate$: BehaviorSubject<any> = new BehaviorSubject(null);
  private currentCompliance: BehaviorSubject<Compliance> = new BehaviorSubject(
    null
  );
  public showPopup$: BehaviorSubject<ESelectOpenComplianceItemPopup> =
    new BehaviorSubject(null);
  public currentDataEdit = new BehaviorSubject<Compliance | ICategoryItem>(
    null
  );
  public unSyncChangeStatus$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  private selectComplianceTypeState$: BehaviorSubject<ESelectRadioComplianceItemPopup> =
    new BehaviorSubject<ESelectRadioComplianceItemPopup>(null);
  public syncStatus$ = new BehaviorSubject<SyncMaintenanceType | string>('');
  public complianceSelected = new BehaviorSubject<ICategoryItem>(null);
  public showSmokeType$: BehaviorSubject<boolean> = new BehaviorSubject(null);

  constructor(private widgetPTService: WidgetPTService) {}

  set updateComplianceResponse(data: Compliance[]) {
    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.COMPLIANCES,
      'UPDATE',
      data?.sort(
        (a, b) =>
          new Date(b.syncDate).getTime() - new Date(a.syncDate).getTime()
      )
    );
  }

  getCurrentCompliance(): Observable<Compliance> {
    return this.currentCompliance.asObservable();
  }

  setCurrentCompliance(compliance: Compliance) {
    this.currentCompliance.next(compliance);
  }

  getSelectComplianceTypeState(): Observable<ESelectRadioComplianceItemPopup> {
    return this.selectComplianceTypeState$.asObservable();
  }

  setSelectComplianceTypeState(value: ESelectRadioComplianceItemPopup) {
    this.selectComplianceTypeState$.next(value);
  }
}
