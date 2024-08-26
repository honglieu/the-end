import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RegionId } from '@shared/enum/region.enum';
import { ITenantVacateForm } from '@/app/tenant-vacate/utils/tenantVacateType';
import { EPropertyTreeType } from '@/app/task-detail/utils/functions';

@Injectable({
  providedIn: 'root'
})
export class TenantVacateService {
  public unSyncChangeStatus$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public isGetDataVariable: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public vacateData: BehaviorSubject<ITenantVacateForm> = new BehaviorSubject(
    null
  );
  public popupWidgetState$: BehaviorSubject<EPropertyTreeType> =
    new BehaviorSubject<EPropertyTreeType>(null);
  public getTenantVacateDetail = new BehaviorSubject(null);
  public noticeToLeaveDate = new BehaviorSubject(null);

  constructor() {}

  checkSpecialRegion(regionId: RegionId) {
    return [RegionId.ACT, RegionId.QLD, RegionId.SA, RegionId.WA].includes(
      regionId
    );
  }

  getPopupWidgetState() {
    return this.popupWidgetState$.value;
  }

  setPopupWidgetState(value: EPropertyTreeType) {
    this.popupWidgetState$.next(value);
  }
}
