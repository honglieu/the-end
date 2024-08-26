import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  forwardRef
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  Validators
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import { EmergencyContactsService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts.service';
import { EmergencyContactsApiService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts-api.service';
import { ITypeOption } from '@/app/dashboard/modules/agency-settings/components/mobile-app/types/emergency-contacts.interface';

@Component({
  selector: 'select-type',
  templateUrl: './select-type.component.html',
  styleUrl: './select-type.component.scss',
  providers: [
    EmergencyContactsApiService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectTypeComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectTypeComponent implements OnInit, OnDestroy {
  @Input() items: ITypeOption[];
  @Input() formControl: any;
  @Input() bindValue: string;
  @Input() bindLabel: string;
  @Input() searchable: boolean;
  @Input() clearable: boolean;
  @Input() placeholder: string;
  @Input() isDisabled: boolean;
  @Input() dropdownPosition = 'auto';

  @Output() triggerEventBlur = new EventEmitter();
  @Output() openHandler = new EventEmitter();
  @Output() newTypeAdded = new EventEmitter<{
    id: string;
    name: string;
  }>();
  public isfocus: boolean;
  @Output() typeDeleted = new EventEmitter<string>();

  showAddNewTypeForm: boolean = false;
  showEditTypeForm: boolean = false;
  isDisabledDelete: boolean = false;
  typeForm: FormGroup;
  typeId: string;
  editingItemId: string;
  isOpen: boolean | null = null;

  private destroy$ = new Subject<void>();

  get typeNameControl() {
    return this.typeForm.get('typeName');
  }

  get emergencyContactsTypeValue() {
    return this.emergencyContactsService.emergencyContactsTypeValue;
  }

  // handle control value accessor for form control value binding to this component
  _selected = [];
  _disabled: boolean = false;
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(obj: any): void {
    this._selected = obj;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }
  // end handle control value accessor for form control value binding to this component

  constructor(
    private readonly emergencyContactsService: EmergencyContactsService,
    private readonly emergencyContactsApiService: EmergencyContactsApiService,
    private readonly nzContextMenuService: NzContextMenuService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.typeForm = new FormGroup({
      typeName: new FormControl('', [Validators.required])
    });
  }

  checkForDuplicateTypeName() {
    const typeNameControl = this.typeNameControl;
    if (!typeNameControl) return true;
    const typeNameValue = typeNameControl.value;
    const isDuplicate = this.items.some(
      (item) => item.name.toLowerCase() === typeNameValue.toLowerCase().trim()
    );
    if (isDuplicate) {
      this.isOpen = true;
      typeNameControl.setErrors({ existTypeName: true });
      return true;
    } else {
      this.isOpen = null;
      typeNameControl.setErrors(null);
      return false;
    }
  }

  onClick(event: MouseEvent, item: ITypeOption, menu: NzDropdownMenuComponent) {
    event.stopPropagation();
    this.items.forEach((i) => (i.isShowDropdown = false));
    item.isShowDropdown = true;
    this.isfocus = true;
    this.isDisabledDelete = item.hasGroup;
    this.emergencyContactsService.setEmergencyContactsType(item);
    this.nzContextMenuService.create(event, menu);
  }

  showInputAddNewType() {
    this.isfocus = true;
    this.showAddNewTypeForm = true;
    this.showEditTypeForm = false;
    this.editingItemId = null;
    this.typeNameControl.setValue(null);
    this.typeNameControl.setErrors(null);
    this.typeNameControl.markAsUntouched();
    this.items.forEach((i) => (i.isShowDropdown = false));
    this.nzContextMenuService.close();
  }

  showInputEditType() {
    this.isfocus = true;
    this.showEditTypeForm = true;
    this.showAddNewTypeForm = false;
    this.editingItemId = this.emergencyContactsTypeValue.id;
    this.typeNameControl.setValue(this.emergencyContactsTypeValue.name);
  }

  addType() {
    if (!this.showAddNewTypeForm) {
      return;
    }
    const isDuplicated = this.checkForDuplicateTypeName();
    if (isDuplicated) {
      this.cdr.markForCheck();
      return;
    }
    const typeName = this.typeNameControl.value;
    this.emergencyContactsApiService
      .createEmergencyContactsType(typeName.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.newTypeAdded.emit({
            id: response.id,
            name: response.name
          });
          this.emergencyContactsService.refreshTypeLists({
            id: response.id,
            name: response.name
          });
          this.showAddNewTypeForm = false;
          this.isfocus = false;
          this.isOpen = null;
          this.typeNameControl.setValue(null);
          this.typeNameControl.setErrors(null);
          this.typeNameControl.markAsPristine();
          this.cdr.markForCheck();
        },
        error: () => {}
      });
  }

  editType() {
    if (!this.showEditTypeForm && !this.editingItemId) {
      return;
    }
    const isDuplicated = this.checkForDuplicateTypeName();
    if (isDuplicated) {
      this.cdr.markForCheck();
      return;
    }
    const typeName = this.typeNameControl.value;
    const body = {
      id: this.editingItemId,
      name: typeName.trim()
    };
    this.emergencyContactsApiService
      .updateEmergencyContactsType(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.emergencyContactsService.refreshTypeLists(body);
          this.showEditTypeForm = false;
          this.editingItemId = null;
          this.isfocus = false;
          this.isOpen = null;
          this.typeNameControl.setValue(null);
          this.typeNameControl.setErrors(null);
          this.typeNameControl.markAsPristine();
          this.cdr.markForCheck();
        },
        error: () => {}
      });
  }

  deleteType() {
    if (this.isDisabledDelete || !this.emergencyContactsTypeValue.id) {
      this.items.forEach((i) => (i.isShowDropdown = false));
      this.isDisabledDelete = false;
      return;
    }
    this.emergencyContactsApiService
      .deleteEmergencyContactsType(this.emergencyContactsTypeValue.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isfocus = false;
        this.typeDeleted.emit(this.emergencyContactsTypeValue.id);
        this.emergencyContactsService.refreshTypeLists();
        this.cdr.markForCheck();
      });
  }

  handleClickOutside() {
    if (!this.isfocus) return;
    if (this.showAddNewTypeForm && this.typeNameControl.value) {
      this.addType();
      return;
    }
    const currentName =
      this.emergencyContactsService.emergencyContactsTypeValue?.name;
    if (
      this.showEditTypeForm &&
      this.editingItemId &&
      this.typeNameControl.value &&
      this.typeNameControl.value !== currentName
    ) {
      this.editType();
      return;
    }
    this.isOpen = null;
    this.handleResetSelectType();
  }

  handleResetSelectType() {
    this.isfocus = false;
    this.editingItemId = null;
    this.showEditTypeForm = false;
    this.showAddNewTypeForm = false;
    this.nzContextMenuService.close();
    this.typeNameControl.setErrors(null);
    this.typeNameControl.markAsUntouched();
    this.items.forEach((i) => (i.isShowDropdown = false));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
