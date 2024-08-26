import { Input, Output, EventEmitter } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import { PropertiesService } from '@services/properties.service';
import { UserService } from '@services/user.service';
import {
  SupplierItemDropdown,
  Suppliers
} from '@shared/types/agency.interface';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';

@Component({
  selector: 'select-supplier-pop-up',
  templateUrl: './select-supplier-pop-up.component.html',
  styleUrls: ['./select-supplier-pop-up.component.scss']
})
export class SelectSupplierPopupComponent implements OnInit {
  @Input() showSelectSupplier = false;
  @Input() title = '';
  @Input() showBackBtn = false;
  @Input() multiple = false;
  @Output() closePopup = new EventEmitter();
  @Output() getSuppliers = new EventEmitter();
  @Output() onBack = new EventEmitter();

  private destroy$ = new Subject<void>();
  public supplierListData = [];
  public supplierForm: FormGroup;
  public listSuppliers: Suppliers[] = [];
  public listSelectedSupplier;

  constructor(
    private userService: UserService,
    private propertyService: PropertiesService,
    private taskDetailService: TaskDetailService
  ) {}

  ngOnInit(): void {
    this.supplierForm = new FormGroup({
      supplierIds: new FormControl(null, [Validators.required])
    });

    this.taskDetailService
      .getListSupplierActive()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.listSuppliers = data;
        this.supplierListData = this.userService.createSupplierList(data);
      });

    this.supplierIds.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        if (res?.length) {
          const listSelected = res?.map((el) =>
            this.listSuppliers.find((item) => item?.id === el?.topicId)
          );
          this.listSelectedSupplier = [];
          listSelected?.forEach((item) => {
            this.listSelectedSupplier?.push({
              ...item,
              checked: true,
              propertyId: this.propertyService.currentPropertyId.value
            });
          });
        } else {
          const selectedSupplier = this.listSuppliers.find(
            (item) => item?.id === res?.topicId
          );
          this.listSelectedSupplier = {
            ...selectedSupplier,
            checked: true,
            propertyId: this.propertyService.currentPropertyId.value
          };
        }
      });
  }

  handleClosePopup() {
    this.closePopup.emit();
    this.supplierForm.reset();
  }

  handleConfirm() {
    this.getSuppliers.emit(this.listSelectedSupplier);
    this.supplierIds.setValue(null);
    this.resetValidate();
  }

  handleBack() {
    this.onBack.emit();
  }

  searchSupplier(searchText: string, item: SupplierItemDropdown) {
    return (
      item.label.toLowerCase().includes(searchText.toLowerCase()) ||
      item.value.email?.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  resetValidate() {
    this.supplierIds.markAsUntouched();
    this.supplierIds.markAsPristine();
  }

  get supplierIds() {
    return this.supplierForm.get('supplierIds');
  }
}
