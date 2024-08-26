import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Suppliers } from '@shared/types/agency.interface';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { Injectable } from '@angular/core';
import { IAddToTaskConfig } from '@/app/task-detail/interfaces/task-detail.interface';
import { UserProperty } from '@shared/types/users-by-property.interface';

export class TaskDetailService {
  private detailViewMode: BehaviorSubject<EViewDetailMode> =
    new BehaviorSubject<EViewDetailMode>(EViewDetailMode.CONVERSATION);
  private taskType: BehaviorSubject<string> = new BehaviorSubject(null);
  private listSupplierActive: BehaviorSubject<Suppliers[]> =
    new BehaviorSubject([]);
  public triggerShowMsgInfoDropdown: Subject<string> = new Subject<string>();
  private addToTaskConfigBS: BehaviorSubject<IAddToTaskConfig> =
    new BehaviorSubject(null);
  private isCloseMenuThreeDotsBS: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  constructor() {}

  setViewMode(mode: EViewDetailMode): void {
    this.detailViewMode.next(mode);
  }

  get viewMode(): Observable<EViewDetailMode> {
    return this.detailViewMode.asObservable();
  }

  get addToTaskConfig$(): Observable<IAddToTaskConfig> {
    return this.addToTaskConfigBS.asObservable();
  }

  get isCloseMenuThreeDots$(): Observable<boolean> {
    return this.isCloseMenuThreeDotsBS.asObservable();
  }

  closeMenuThreeDots() {
    this.isCloseMenuThreeDotsBS.next(true);
  }

  getTaskType() {
    return this.taskType.asObservable();
  }

  setTaskType(value: string) {
    return this.taskType.next(value);
  }

  setAddToTaskConfig(value: IAddToTaskConfig) {
    this.addToTaskConfigBS.next(value);
  }

  getListSupplierActive() {
    return this.listSupplierActive.asObservable();
  }

  setListSupplierActive(value: Suppliers[]) {
    return this.listSupplierActive.next(value);
  }

  getStatusRemoveTaskToPayload(status) {
    switch (status) {
      case 'RESOLVED':
        return 'COMPLETED';
      default:
        return 'INPROGRESS';
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class ShowSidebarRightService {
  private isShowSidebarRight: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public isShowSidebarRight$ = this.isShowSidebarRight.asObservable();

  constructor() {}
  handleToggleSidebarRight(value) {
    this.isShowSidebarRight.next(value);
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileDrawerService {
  private isUserProfileDrawerVisibleSubject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public isUserProfileDrawerVisible$: Observable<boolean> =
    this.isUserProfileDrawerVisibleSubject.asObservable();

  private dataUser: BehaviorSubject<UserProperty> = new BehaviorSubject(null);
  public dataUser$: Observable<UserProperty> = this.dataUser.asObservable();
  private trigerRefreshListProperty: BehaviorSubject<boolean> =
    new BehaviorSubject(null);
  public trigerRefreshListProperty$: Observable<boolean> =
    this.trigerRefreshListProperty.asObservable();

  setTrigerRefreshListProperty(value) {
    this.trigerRefreshListProperty.next(value);
  }

  getIsUserProfileDrawerVisible() {
    return this.isUserProfileDrawerVisibleSubject.getValue();
  }

  clear() {
    this.toggleUserProfileDrawerVisibility(false, null);
  }

  toggleUserProfileDrawerVisibility(isVisible: boolean, data?: UserProperty) {
    this.isUserProfileDrawerVisibleSubject.next(isVisible);
    this.dataUser.next(data);
  }
}
