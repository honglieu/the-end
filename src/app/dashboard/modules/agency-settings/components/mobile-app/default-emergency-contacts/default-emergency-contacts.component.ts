import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { ISelectContacts } from '@/app/dashboard/modules/agency-settings/utils/interface';
import { FormControl } from '@angular/forms';
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  finalize,
  takeUntil
} from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { isEqual } from 'lodash-es';
import uuid4 from 'uuid4';
import { EmergencyContactsApiService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts-api.service';
import {
  IDefaultEmergencyContactFormGroup,
  IDefaultEmergencyContactResponse,
  ITypeOption,
  ExistedDefaultEmergencyContactsValue
} from '@/app/dashboard/modules/agency-settings/components/mobile-app/types/emergency-contacts.interface';
import { EmergencyContactsService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts.service';
import { EmergencyContactsFormService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts-form.service';

@Component({
  selector: 'default-emergency-contacts',
  templateUrl: './default-emergency-contacts.component.html',
  styleUrl: './default-emergency-contacts.component.scss',
  providers: [EmergencyContactsApiService, EmergencyContactsFormService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class DefaultEmergencyContactsComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() typesList: ITypeOption[] = [];
  @Input() suppliersList: ISelectContacts[] = [];
  @Input() readonly: boolean = false;

  isLoadingDefault: boolean = true;
  isContactFocused: boolean = false;
  public dropdownPositionForDefaultItem = {};

  private subscriptions: Subscription[] = [];
  private destroy$: Subject<void> = new Subject<void>();
  private existedDefaultEmergencyContactsValue: ExistedDefaultEmergencyContactsValue =
    new Map();

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly toastService: ToastrService,
    private readonly emergencyContactsFormService: EmergencyContactsFormService,
    private readonly emergencyContactsService: EmergencyContactsService,
    private readonly emergencyContactsApiService: EmergencyContactsApiService
  ) {
    this.emergencyContactsFormService.buildDefaultEmergencyContactsForm();
  }

  get defaultEmergencyContacts() {
    return this.emergencyContactsFormService.defaultEmergencyContacts;
  }

  ngOnInit(): void {
    this.fetchInitialData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['typesList'] || changes['suppliersList']) &&
      !!this.defaultEmergencyContacts.controls.length
    ) {
      this.emergencyContactsFormService.populateListsForDefaultContacts(
        this.typesList,
        this.suppliersList
      );
    }
  }

  private fetchInitialData(): void {
    this.emergencyContactsApiService
      .getDefaultEmergencyContacts()
      .pipe(
        finalize(() => {
          this.isLoadingDefault = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((data: IDefaultEmergencyContactResponse[]) => {
        if (!!data?.length) {
          data.forEach((contact) => {
            this.addContact(contact);
          });
          this.emergencyContactsFormService.populateListsForDefaultContacts(
            this.typesList,
            this.suppliersList
          );
        }
        this.cdr.markForCheck();
      });
  }

  private saveEmergencyContacts(
    control: IDefaultEmergencyContactFormGroup,
    refreshTypeLists: boolean = false
  ): void {
    const { groupId, typeId, supplierIds, suppliers } = control.value || {};
    const { addedNew } =
      this.existedDefaultEmergencyContactsValue.get(groupId) || {};
    const payload = {
      typeId,
      supplierIds
    };
    if (!addedNew) {
      payload['groupId'] = groupId;
    }
    this.emergencyContactsApiService
      .updateDefaultEmergencyContacts(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: IDefaultEmergencyContactResponse[]) => {
          const updatedData = !!res?.length ? res[0] : payload;
          this.existedDefaultEmergencyContactsValue.delete(groupId);
          this.toastService.success('Default emergency contacts saved');
          control.setValue({
            groupId: updatedData['groupId'],
            typeId: updatedData['typeId'],
            supplierIds:
              updatedData['users']?.map((user) => user.id) ||
              updatedData['supplierIds'],
            suppliers: updatedData['users'] || suppliers
          });
          this.existedDefaultEmergencyContactsValue.set(
            updatedData['groupId'],
            {
              typeId: updatedData['typeId'],
              supplierIds:
                updatedData['users']?.map((user) => user.id) ||
                updatedData['supplierIds'],
              addedNew: false
            }
          );
          refreshTypeLists && this.emergencyContactsService.refreshTypeLists();
        },
        error: () => {}
      });
  }

  private subscribeToValueChanges(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    this.defaultEmergencyContacts.controls.forEach((control) => {
      const typeControl = control.get('typeId') as FormControl<string>;
      const typeSub = typeControl.valueChanges
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe((value) => {
          const { groupId, supplierIds } = control.value || {};
          this.emergencyContactsFormService.populateListsForDefaultContacts(
            this.typesList,
            this.suppliersList
          );
          const { typeId: existedTypeId } =
            this.existedDefaultEmergencyContactsValue.get(groupId) || {};
          const isContactChanged = existedTypeId !== value;
          if (!isContactChanged || !supplierIds?.length) return;
          this.saveEmergencyContacts(control, true);
        });

      this.subscriptions.push(typeSub);
    });
  }

  removeEmergencyContactsRowHandler(index: number, groupId: string): void {
    this.defaultEmergencyContacts.removeAt(index);
    const existedContact =
      this.existedDefaultEmergencyContactsValue.get(groupId) || {};
    this.subscribeToValueChanges();

    if (existedContact && !existedContact.addedNew) {
      this.emergencyContactsApiService
        .deleteDefaultEmergencyContacts(groupId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.emergencyContactsService.refreshTypeLists();
            this.emergencyContactsFormService.populateListsForDefaultContacts(
              this.typesList,
              this.suppliersList
            );
            this.existedDefaultEmergencyContactsValue.delete(groupId);
            this.toastService.success('Default emergency contacts deleted');
          },
          error: () => {}
        });
    }
  }

  addContact(contactData: IDefaultEmergencyContactResponse): void {
    const { groupId, typeId, users } = contactData || {};
    const supplierIds = users?.map((user) => user.id);
    const generatedGroupId = uuid4();
    this.emergencyContactsFormService.addDefaultContactsToForm(
      contactData,
      generatedGroupId,
      this.typesList,
      this.suppliersList
    );
    this.existedDefaultEmergencyContactsValue.set(groupId || generatedGroupId, {
      typeId,
      supplierIds,
      addedNew: !contactData
    });
    this.subscribeToValueChanges();
  }

  addSupplierToFormHandler(
    event: ISelectContacts,
    control: IDefaultEmergencyContactFormGroup
  ): void {
    if (event) {
      const { typeId: controlTypeId, supplierIds: controlSupplierIds } =
        control.value || {};
      const suppliersControl = control.get('supplierIds') as FormControl<
        string[]
      >;
      const updatedSupplierIds = [...controlSupplierIds, event.id];
      suppliersControl.setValue(updatedSupplierIds);
      if (
        this.isContactFocused ||
        !updatedSupplierIds?.length ||
        !controlTypeId
      )
        return;
      this.saveEmergencyContacts(control);
    }
  }

  contactFocusHandler(): void {
    this.isContactFocused = true;
  }

  contactActionHandler(
    control: IDefaultEmergencyContactFormGroup,
    removeSingle: boolean = false,
    removeAll: boolean = false
  ): void {
    const suppliersControl = control.get('supplierIds') as FormControl<
      string[]
    >;
    if (removeAll) {
      suppliersControl.setValue([]);
      suppliersControl.updateValueAndValidity();
      if (suppliersControl.invalid) {
        suppliersControl.markAsTouched();
      }
      return;
    }
    if (!removeSingle) {
      this.isContactFocused = false;
    }
    const {
      groupId,
      typeId: controlTypeId,
      supplierIds: controlSupplierIds
    } = control.value || {};
    const { supplierIds: existedSupplierIds } =
      this.existedDefaultEmergencyContactsValue.get(groupId) || {};
    const suppliersChanged = !isEqual(
      [...(existedSupplierIds || [])].sort(),
      [...controlSupplierIds].sort()
    );

    suppliersControl.markAsTouched();
    if (this.isContactFocused || !suppliersChanged || !controlTypeId) return;
    this.saveEmergencyContacts(control);
  }

  addNewTypeHandler(
    event: { name: string; id: string },
    control: IDefaultEmergencyContactFormGroup
  ): void {
    control.patchValue({ typeId: event.id });
  }

  deleteTypeHandler(
    deletedTypeId: string,
    control: IDefaultEmergencyContactFormGroup
  ) {
    if (control.value.typeId === deletedTypeId) {
      control.patchValue({ typeId: null });
    }
  }

  adjustDropdownPositionForDefaultItem(index: number) {
    const item = document.querySelectorAll('.default-item').item(index);
    this.dropdownPositionForDefaultItem[index] = this.getDropdownDirection(
      item,
      '#emergency-contacts'
    );

    this.cdr.markForCheck();
  }

  getDropdownDirection(element, parentSelector) {
    const elementRect = element.getBoundingClientRect().top;
    const viewportHeight = document
      .querySelector(parentSelector)
      .getBoundingClientRect();
    const parentTop = viewportHeight.top;
    const parentHeight = viewportHeight.height;
    return elementRect < parentTop + parentHeight ? 'bottom' : 'top';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }
}
