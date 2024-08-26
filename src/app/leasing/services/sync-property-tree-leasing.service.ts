import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { IListAccountPT } from '@/app/leasing/utils/leasingType';

@Injectable({
  providedIn: 'root'
})
export class SyncPropertyTreeLeasingService {
  public leasingPropertySyncStatus: BehaviorSubject<
    SyncMaintenanceType | string
  > = new BehaviorSubject('');
  public showLeasingStatus: BehaviorSubject<boolean> = new BehaviorSubject(
    true
  );
  public isExpandPopupPT$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public listAccountPT$: BehaviorSubject<IListAccountPT[]> =
    new BehaviorSubject([]);
  public isShowCompletedBtn$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );

  constructor() {}
}
