import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

interface PopupItem {
  display: boolean;
  isDone: boolean;
  name: string;
}

export interface PopupQueue {
  [key: number]: PopupItem;
}

export enum EPopupAction {
  INIT = 'INIT',
  NEXT = 'NEXT',
  BACK = 'BACK'
}

interface PopupState {
  action: EPopupAction;
  data: PopupQueue;
}

@Injectable({
  providedIn: 'root'
})
export class NavigatePopUpsService {
  private popupState = new Subject<PopupState>();
  private currentIndex = 0;
  private prevIndex = 0;

  constructor() {
    this.popupState.subscribe((res) => {
      const queueList = Object.keys(res.data);
      switch (res.action) {
        case EPopupAction.INIT: // start from 0, open index not done
          for (let index = 0; index < queueList.length; index++) {
            const popupItem = res.data[index];
            if (!popupItem.isDone) {
              popupItem.display = true;
              this.currentIndex = index;
              break;
            }
          }
          break;

        case EPopupAction.NEXT: // start from currentIndex + 1, assign current index to queueList.length in the last one
          res.data[this.currentIndex].display = false;
          this.prevIndex = this.currentIndex;
          const nextIndex =
            this.currentIndex === queueList.length - 1
              ? queueList.length
              : this.prevIndex + 1;
          for (let index = nextIndex; index < queueList.length; index++) {
            const popupItem = res.data[index];
            if (!popupItem.isDone) {
              popupItem.display = true;
              this.currentIndex = index;
              break;
            }
          }
          break;

        case EPopupAction.BACK: // start from currentIndex - 1, assign current index to - queueList.length in the first one
          res.data[this.currentIndex].display = false;
          this.prevIndex = this.currentIndex;
          const backIndex =
            this.currentIndex === 0 ? -queueList.length : this.prevIndex - 1;
          for (let index = backIndex; index >= 0; index--) {
            const popupItem = res.data[index];
            if (!popupItem.isDone) {
              popupItem.display = true;
              this.currentIndex = index;
              break;
            }
          }
          break;

        default:
          break;
      }
    });
  }

  changePopupState(state: PopupState) {
    this.popupState.next(state);
  }
}
