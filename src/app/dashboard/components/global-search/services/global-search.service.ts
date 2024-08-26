import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { IGlobalSearchPayload } from '@/app/dashboard/components/global-search/interfaces/global-search.interface';
import { EConversationType, TaskStatusType } from '@shared/enum';
const defaultGlobalSearchPayload: IGlobalSearchPayload = {
  mailBoxIds: [],
  propertyManagerIds: [],
  assigneeIds: [],
  search: '',
  messageStatus: [TaskStatusType.inprogress],
  conversationType: EConversationType.EMAIL
};
@Injectable()
export class GlobalSearchService {
  public triggerCollapseDropdown$ = new Subject<void>();
  private globalSearchPayload = new BehaviorSubject<IGlobalSearchPayload>(
    defaultGlobalSearchPayload
  );

  get globalSearchPayload$() {
    return this.globalSearchPayload.asObservable();
  }

  setGlobalSearchPayload(payload: Partial<IGlobalSearchPayload>) {
    this.globalSearchPayload.next({
      ...this.globalSearchPayload.getValue(),
      ...payload
    });
  }

  resetGlobalSearchPayload() {
    this.globalSearchPayload.next(defaultGlobalSearchPayload);
  }

  getGlobalSearchPayload() {
    return this.globalSearchPayload.getValue();
  }
}
