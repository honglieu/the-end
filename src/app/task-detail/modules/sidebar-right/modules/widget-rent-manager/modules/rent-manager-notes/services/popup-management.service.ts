import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ERentManagerNotesPopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';

@Injectable()
export class PopupManagementService {
  constructor() {}

  private currentPopupBS: BehaviorSubject<ERentManagerNotesPopup> =
    new BehaviorSubject(ERentManagerNotesPopup.SELECT_NOTES);
  public currentPopup$ = this.currentPopupBS.asObservable();

  public setCurrentPopup(value: ERentManagerNotesPopup) {
    this.currentPopupBS.next(value);
  }
}
