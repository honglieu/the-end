import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ShowPanelService {
  public isShowPanel = new BehaviorSubject(null);

  constructor() {}

  getIsShowPanel() {
    return this.isShowPanel.asObservable();
  }

  setIsShowPanel(status: boolean) {
    this.isShowPanel.next(status);
  }
}
