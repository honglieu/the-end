import { Injectable } from '@angular/core';
import { ISelectContacts } from '@/app/dashboard/modules/agency-settings/utils/interface';
import { BehaviorSubject, Subject } from 'rxjs';
import { ITypeOption } from '@/app/dashboard/modules/agency-settings/components/mobile-app/types/emergency-contacts.interface';

@Injectable()
export class EmergencyContactsService {
  private emergencyContactsType = new BehaviorSubject<ITypeOption>(null);
  private triggerRefreshSupplierLists = new Subject<ISelectContacts>();
  private triggerRefreshTypeLists = new Subject<ITypeOption>();

  get triggerRefreshSupplierLists$() {
    return this.triggerRefreshSupplierLists.asObservable();
  }

  get triggerRefreshTypeLists$() {
    return this.triggerRefreshTypeLists.asObservable();
  }

  get emergencyContactsType$() {
    return this.emergencyContactsType.asObservable();
  }

  get emergencyContactsTypeValue() {
    return this.emergencyContactsType.getValue();
  }

  setEmergencyContactsType(data: ITypeOption) {
    this.emergencyContactsType.next(data);
  }

  refreshTypeLists(data?: ITypeOption) {
    this.triggerRefreshTypeLists.next(data);
  }

  refreshSupplierLists(data?: ISelectContacts) {
    this.triggerRefreshSupplierLists.next(data);
  }
}
