import { Suppliers } from '@shared/types/agency.interface';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';

@Component({
  selector: 'supplier-conducting-work',
  templateUrl: './supplier-conducting-work.component.html',
  styleUrls: ['./supplier-conducting-work.component.scss']
})
export class SupplierConductingWorkComponent implements OnInit {
  @Input() visible: boolean;
  @Input() supplierList: Suppliers[];
  @Input() headerText: string;
  @Input() openFrom: ForwardButtonAction;
  @Input() hasBackBtn = false;
  @Output() nextSupplierConducting = new EventEmitter<Suppliers[]>();
  @Output() closeSupplierConducting = new EventEmitter<boolean>();
  @Output() onBack = new EventEmitter<boolean>();

  public disabledNextButton = true;
  constructor() {}

  ngOnInit(): void {
    this.supplierList = this.supplierList?.map((ele) => ({
      ...ele,
      checked: false
    }));
  }

  onCheckboxChange(event: boolean, i: number) {
    switch (this.openFrom) {
      case ForwardButtonAction.supToTenant:
      case ForwardButtonAction.createWorkOrder:
        this.supplierList.map((sup) => (sup.checked = false));
        this.supplierList[i].checked = event;
        break;
      default:
        break;
    }
    this.disabledNextButton = !this.supplierList.some((item) => item.checked);
  }

  onClose() {
    this.supplierList = [];
    this.disabledNextButton = true;
    this.closeSupplierConducting.next(true);
  }

  onNext() {
    const checkedSupplier = this.supplierList.filter((value) => value.checked);
    this.nextSupplierConducting.next(checkedSupplier);
    this.disabledNextButton = true;
    this.supplierList = this.supplierList?.map((ele) => ({
      ...ele,
      checked: false
    }));
  }

  handleBack() {
    this.onBack.next(true);
  }
}
