import { Injectable } from '@angular/core';
import { IRentManagerNote } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/interfaces/rent-manager-notes.interface';
import { BehaviorSubject } from 'rxjs';
import { IPersonalInTab } from '@shared/types/user.interface';
@Injectable()
export class RentManagerNotesService {
  private isShowBackBtnBS = new BehaviorSubject(false);
  public isShowBackBtn$ = this.isShowBackBtnBS.asObservable();
  public listExistedNotesBS = new BehaviorSubject([] as IRentManagerNote[]);
  public listExistedNotes$ = this.listExistedNotesBS.asObservable();
  public entityDataBS = new BehaviorSubject({} as IPersonalInTab);
  public entityData$ = this.entityDataBS.asObservable();
  public setIsShowBackBtnBS(value) {
    this.isShowBackBtnBS.next(value);
  }

  public setListExistedNotesBS(value) {
    this.listExistedNotesBS.next(value);
  }

  public setEntityDataBS(value) {
    this.entityDataBS.next(value);
  }

  public clear() {
    this.listExistedNotesBS.next([]);
    this.entityDataBS.next({} as IPersonalInTab);
  }
}
