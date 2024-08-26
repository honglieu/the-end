import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AgentUserService {
  isCloseAllModal = new BehaviorSubject(null);
  reloadTenantLandlordData = new BehaviorSubject(false);

  constructor() {}

  setIsCloseAllModal(state: boolean) {
    this.isCloseAllModal.next(state);
  }

  getIsCloseAllModal() {
    return this.isCloseAllModal.asObservable();
  }

  setDataFilter(key: string, data): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getDataFilter(key: string) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  handleDataFilter(event, targetData, filterType: string, filterMapping) {
    if (filterMapping[event.type]) {
      const { key, field } = filterMapping[event.type];
      targetData[key] = event.items.map((item) => item[field]);
    }

    let oldDataFilter = this.getDataFilter(filterType) || {};
    Object.keys(targetData).forEach((key) => {
      oldDataFilter[key] = oldDataFilter[key] || [];
      targetData[key].forEach((value) => {
        if (!oldDataFilter[key].includes(value)) {
          oldDataFilter[key].push(value);
        }
      });

      oldDataFilter[key] = oldDataFilter[key].filter((value) =>
        targetData[key].includes(value)
      );
    });
    this.setDataFilter(filterType, oldDataFilter);
  }
}
