import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HelpCentreService {
  private isShowHelpCentre: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );

  public getIsShowHelpCentre() {
    return this.isShowHelpCentre.asObservable();
  }

  public getValueIsShowHelpCentre() {
    return this.isShowHelpCentre.getValue();
  }

  public setShowHelpCentre(value: boolean) {
    this.isShowHelpCentre.next(value);
  }

  handleCloseZendeskWidget(): void {
    if (window.zE && typeof window.zE.hide === 'function') {
      window.zE && window.zE('webWidget', 'reset');
      window.zE && window.zE('webWidget', 'close');
      this.isShowHelpCentre.next(false);
      document
        .getElementById('help-center')
        ?.children[0]?.classList?.remove('help-center-item');
    }
  }
}
