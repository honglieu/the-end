import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { crmStatusType } from '@shared/enum/supplier.enum';

@Injectable({
  providedIn: 'root'
})
export class SupplierContactSearchService {
  private selectedCRMStatus: BehaviorSubject<string> = new BehaviorSubject(
    JSON.parse(localStorage.getItem('SUPPLIER'))?.status ||
      crmStatusType.pending
  );
  private selectedAgencyIds$: BehaviorSubject<string[]> = new BehaviorSubject(
    []
  );

  getSelectedCRMStatus() {
    return this.selectedCRMStatus.asObservable();
  }

  setSelectedCRMStatus(value: string) {
    this.selectedCRMStatus.next(value);
  }

  public getSelectedAgencyIds() {
    return this.selectedAgencyIds$.asObservable();
  }

  public setSelectedAgencyIds(agencyIds: string[]) {
    this.selectedAgencyIds$.next(agencyIds);
  }
}
