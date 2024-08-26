import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import {
  ESelectInvoiceType,
  EPopupOption
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/popup.enum';

@Injectable({
  providedIn: 'root'
})
export class InvoicePopupManagerService {
  public selectExistInvoiceForm: FormGroup;
  private currentPopupBS = new BehaviorSubject<ESelectInvoiceType>(null);
  public currentPopup$ = this.currentPopupBS.asObservable();
  private showSelectInvoiceModalBS = new BehaviorSubject<boolean>(false);
  public showSelectInvoiceModal$ = this.showSelectInvoiceModalBS.asObservable();
  constructor(private fg: FormBuilder) {}

  public buildSelectForm() {
    return (this.selectExistInvoiceForm = this.fg.group({
      userChoice: [EPopupOption.CREATE_NEW],
      selectedInvoice: [null]
    }));
  }

  public setCurrentPopup(popupType: ESelectInvoiceType) {
    this.currentPopupBS.next(popupType);
    return this;
  }

  public setShowSelectInvoiceModal(show: boolean) {
    this.showSelectInvoiceModalBS.next(show);
  }
}
