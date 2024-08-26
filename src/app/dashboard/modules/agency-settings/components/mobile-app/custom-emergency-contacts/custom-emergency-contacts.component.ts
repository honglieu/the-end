import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { FormArray, FormControl } from '@angular/forms';
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  switchMap,
  takeUntil
} from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { PropertiesService } from '@services/properties.service';
import { AiPolicyService } from '@/app/dashboard/services/ai-policy.service';
import {
  ICustomEmergencyContactFormGroup,
  ExistedCustomEmergencyContactsValue,
  IEmergencyContactsFormGroup,
  IPTCustomEmergencyContactResponse,
  IRMCustomEmergencyContactResponse,
  ITypeOption,
  IEmergencyContactFormType,
  ISaveCustomEmergencyContactsPayload,
  ICustomEmergencyContact,
  IEmergencyContact
} from '@/app/dashboard/modules/agency-settings/components/mobile-app/types/emergency-contacts.interface';
import uuid4 from 'uuid4';
import { isEqual } from 'lodash-es';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { SharedAgencySettingsService } from '@/app/dashboard/modules/agency-settings/components/shared/shared-agency-settings.service';
import { CompanyService } from '@services/company.service';
import { Property } from '@shared/types/property.interface';
import { EmergencyContactsApiService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts-api.service';
import { EmergencyContactsService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts.service';
import {
  ISelectContacts,
  ITag
} from '@/app/dashboard/modules/agency-settings/utils/interface';
import { EmergencyContactsFormService } from '@/app/dashboard/modules/agency-settings/components/mobile-app/services/emergency-contacts-form.service';
import { EPropertyStatus } from '@shared/enum';

@Component({
  selector: 'custom-emergency-contacts',
  templateUrl: './custom-emergency-contacts.component.html',
  styleUrl: './custom-emergency-contacts.component.scss',
  providers: [EmergencyContactsApiService, EmergencyContactsFormService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomEmergencyContactsComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() typesList: ITypeOption[] = [];
  @Input() suppliersList: ISelectContacts[] = [];
  @Input() readonly: boolean = false;

  isLoadingCustom: boolean = true;
  isRMEnvironment: boolean = false;
  headerTitle: string = 'Custom emergency contacts';
  headerSubtitle = {
    PT: 'To exclude properties from the default emergency contact list, please add the property tag below and assign alternative emergency contact/s.',
    RM: 'To exclude properties from the default emergency contact list, please add the property below and assign alternative emergency contact/s.'
  };
  focusStateMap = {
    emergencyContactDropdown: new Map<string, boolean>(),
    propertyDropdown: new Map<string, boolean>(),
    deleteButton: new Map<string, boolean>()
  };
  propertyDataSource: (ITag | Property)[] = [];
  screenWidth: number;
  columnWidth = '320px';
  readonly EPropertyStatus = EPropertyStatus;

  private existedCustomEmergencyContactsValue: ExistedCustomEmergencyContactsValue =
    new Map();
  private subscriptions: Subscription[] = [];
  private destroy$: Subject<void> = new Subject<void>();
  public dropdownPositionForCustomItem = {};

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly toastService: ToastrService,
    private readonly companyService: CompanyService,
    private readonly agencyService: AgencyService,
    private readonly propertiesService: PropertiesService,
    private readonly aiPolicyService: AiPolicyService,
    private readonly nzContextMenuService: NzContextMenuService,
    private readonly sharedAgencySettingsService: SharedAgencySettingsService,
    private readonly emergencyContactsFormService: EmergencyContactsFormService,
    private readonly emergencyContactsService: EmergencyContactsService,
    private readonly emergencyContactsApiService: EmergencyContactsApiService
  ) {
    this.emergencyContactsFormService.buildCustomEmergencyContactsForm();
  }

  @HostListener('window:resize', ['$event'])
  getScreenSize() {
    this.screenWidth = window.innerWidth;
    if (this.screenWidth >= 1920) {
      this.columnWidth = '373px';
    } else if (this.screenWidth >= 1440) {
      this.columnWidth = '320px';
    } else {
      this.columnWidth = '240px';
    }
  }

  get customEmergencyContacts() {
    return this.emergencyContactsFormService.customEmergencyContacts;
  }

  get existedPropertyIds() {
    return this.emergencyContactsFormService.existedPropertyIds;
  }

  ngOnInit(): void {
    this.getScreenSize();
    this.subscribePropertiesData();
    this.sharedAgencySettingsService.scroll$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.focusStateMap.deleteButton.size > 0) {
          this.nzContextMenuService.close();
          this.focusStateMap.deleteButton.clear();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['typesList'] || changes['suppliersList']) &&
      !!this.customEmergencyContacts.controls.length
    ) {
      this.emergencyContactsFormService.populateListsForCustomContacts(
        this.typesList,
        this.propertyDataSource,
        this.suppliersList,
        this.isRMEnvironment
      );
    }
  }

  private subscribePropertiesData() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        switchMap((company) => {
          this.isRMEnvironment = this.agencyService.isRentManagerCRM(company);
          return this.isRMEnvironment
            ? this.propertiesService.listofActiveProp
            : this.aiPolicyService.getTags();
        }),
        filter((data) => !!data),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.propertyDataSource = data;
        if (!this.customEmergencyContacts?.length) {
          this.fetchInitialData();
        } else {
          this.isLoadingCustom = false;
          this.cdr.markForCheck();
        }
      });
  }

  private fetchInitialData(): void {
    let customEmergencyContactsObs =
      this.emergencyContactsApiService.getPTCustomerEmergencyContacts();

    if (this.isRMEnvironment) {
      customEmergencyContactsObs =
        this.emergencyContactsApiService.getRMCustomerEmergencyContacts();
    }

    customEmergencyContactsObs
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingCustom = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((data) => {
        if (!data?.length) {
          return;
        }
        data.forEach((contact) => {
          this.addContact(contact);
        });
        this.emergencyContactsFormService.populateListsForCustomContacts(
          this.typesList,
          this.propertyDataSource,
          this.suppliersList,
          this.isRMEnvironment
        );
      });
  }

  private saveEmergencyContacts(
    control: ICustomEmergencyContactFormGroup,
    refreshTypeLists: boolean = false
  ): void {
    const { groupId, propertyIds, emergencyContacts } = control.value || {};
    const { addedNew, emergencyContacts: existedEmergencyContacts } =
      this.existedCustomEmergencyContactsValue.get(groupId) || {};

    const payload = this.createSavePayload(
      groupId,
      emergencyContacts,
      existedEmergencyContacts,
      addedNew,
      propertyIds
    );

    let saveEmergencyContactsObs =
      this.emergencyContactsApiService.updatePTCustomEmergencyContacts(
        payload as unknown as IPTCustomEmergencyContactResponse
      );
    if (this.isRMEnvironment) {
      saveEmergencyContactsObs =
        this.emergencyContactsApiService.updateRMCustomEmergencyContacts(
          payload as unknown as IRMCustomEmergencyContactResponse
        );
    }

    saveEmergencyContactsObs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (
        res: Partial<
          IPTCustomEmergencyContactResponse & IRMCustomEmergencyContactResponse
        >[]
      ) =>
        this.saveSuccessHandler(
          res,
          control,
          payload,
          emergencyContacts,
          refreshTypeLists
        ),
      error: () => {}
    });
  }

  private createSavePayload(
    groupId: string,
    emergencyContacts: IEmergencyContactFormType[],
    existedEmergencyContacts: (IEmergencyContactFormType & {
      addedNew?: boolean;
    })[],
    addedNew: boolean,
    propertyIds: string[]
  ): ISaveCustomEmergencyContactsPayload {
    const contacts = emergencyContacts.map((contact) => {
      const isItemAddedNew = existedEmergencyContacts?.find(
        (item) => item.groupTypeId === contact.groupTypeId
      )?.addedNew;
      if (isItemAddedNew) {
        return {
          typeId: contact.typeId,
          supplierIds: contact.supplierIds
        };
      }
      return {
        groupTypeId: contact.groupTypeId,
        typeId: contact.typeId,
        supplierIds: contact.supplierIds
      };
    });

    const payload = { groupId, contacts };
    if (addedNew) delete payload.groupId;
    if (this.isRMEnvironment) payload['propertyIds'] = propertyIds;
    else payload['tagIds'] = propertyIds;

    return payload;
  }

  private saveSuccessHandler(
    res: Partial<
      IPTCustomEmergencyContactResponse & IRMCustomEmergencyContactResponse
    >[],
    control: ICustomEmergencyContactFormGroup,
    payload: ISaveCustomEmergencyContactsPayload,
    emergencyContacts: IEmergencyContactFormType[],
    refreshTypeLists: boolean
  ): void {
    const updatedData = !!res?.length ? res[0] : payload;
    let formattedContacts = this.formatContacts(updatedData.contacts);
    if (this.needsContactUpdate(res, updatedData.contacts, emergencyContacts)) {
      formattedContacts = this.fillMissingContacts(
        emergencyContacts,
        updatedData.contacts
      );
    }
    this.updateControlValue(control, updatedData, formattedContacts);
    this.toastService.success('Custom emergency contacts saved');
    if (refreshTypeLists) this.emergencyContactsService.refreshTypeLists();
    this.emergencyContactsFormService.populateListsForCustomContacts(
      this.typesList,
      this.propertyDataSource,
      this.suppliersList,
      this.isRMEnvironment
    );
  }

  private formatContacts(
    contacts: IEmergencyContactFormType[] | ICustomEmergencyContact[]
  ): IEmergencyContactFormType[] {
    return contacts.map(
      (contact: IEmergencyContactFormType | ICustomEmergencyContact) => ({
        groupTypeId: contact.groupTypeId,
        typeId: contact.typeId,
        suppliers: contact['users'] || [],
        supplierIds:
          contact['users']?.map((user: IEmergencyContact) => user.id) ||
          contact['supplierIds'] ||
          []
      })
    );
  }

  private needsContactUpdate(
    res: Partial<
      IPTCustomEmergencyContactResponse & IRMCustomEmergencyContactResponse
    >[],
    updatedContacts: IEmergencyContactFormType[] | ICustomEmergencyContact[],
    emergencyContacts: IEmergencyContactFormType[]
  ): boolean {
    return !!res?.length && updatedContacts.length !== emergencyContacts.length;
  }

  private fillMissingContacts(
    emergencyContacts: IEmergencyContactFormType[],
    updatedContacts: IEmergencyContactFormType[] | ICustomEmergencyContact[]
  ): IEmergencyContactFormType[] {
    let updatedList = updatedContacts.slice();
    for (let i = 0; i < emergencyContacts.length; i++) {
      if (emergencyContacts[i].groupTypeId !== updatedList[i]?.groupTypeId) {
        updatedList.splice(i, 0, emergencyContacts[i]);
      }
    }
    return this.formatContacts(updatedList);
  }

  private updateControlValue(
    control: ICustomEmergencyContactFormGroup,
    updatedData:
      | ISaveCustomEmergencyContactsPayload
      | Partial<
          IPTCustomEmergencyContactResponse & IRMCustomEmergencyContactResponse
        >,
    formattedContacts: IEmergencyContactFormType[]
  ) {
    control.setValue(
      {
        groupId: updatedData.groupId,
        properties: updatedData['properties'] || this.propertyDataSource,
        propertyIds: updatedData['tagIds'] || updatedData['propertyIds'],
        emergencyContacts: formattedContacts
      },
      { emitEvent: false }
    );
    this.existedCustomEmergencyContactsValue.set(updatedData.groupId, {
      addedNew: false,
      propertyIds: updatedData['tagIds'] || updatedData['propertyIds'] || [],
      emergencyContacts: formattedContacts.map((contact) => ({
        ...contact,
        addedNew: false
      }))
    });
  }

  private subscribeToValueChanges(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    this.customEmergencyContacts.controls.forEach((control) => {
      const emergencyContactControl = control.get(
        'emergencyContacts'
      ) as FormArray<IEmergencyContactsFormGroup>;
      const groupId = control.get('groupId').value;

      emergencyContactControl.controls.forEach((subControl) => {
        const typeSub = subControl
          .get('typeId')
          .valueChanges.pipe(debounceTime(500), distinctUntilChanged())
          .subscribe((value) => {
            const {
              groupTypeId: controlGroupTypeId,
              supplierIds: controlSupplierIds
            } = subControl.value;
            const controlPropertyIds = control.get('propertyIds').value;
            const { emergencyContacts } =
              this.existedCustomEmergencyContactsValue.get(groupId) || {};
            const existedEmergencyContact = emergencyContacts?.find(
              (contact) => contact.groupTypeId === controlGroupTypeId
            );
            const isContactChanged = existedEmergencyContact?.typeId !== value;
            if (
              !controlPropertyIds?.length ||
              !controlSupplierIds?.length ||
              !isContactChanged
            )
              return;

            this.saveEmergencyContacts(control, true);
          });

        this.subscriptions.push(typeSub);
      });
    });
  }

  private addContact(
    contactData:
      | IPTCustomEmergencyContactResponse
      | IRMCustomEmergencyContactResponse
  ): void {
    const generatedGroupTypeId = uuid4();
    this.emergencyContactsFormService.addCustomContactsToForm(
      contactData,
      generatedGroupTypeId,
      this.suppliersList
    );
    const mappedEmergencyContact = contactData?.contacts?.map((item) => ({
      groupTypeId: item.groupTypeId,
      typeId: item.typeId,
      supplierIds: item.users.map((user) => user.id),
      addedNew: false
    }));
    this.existedCustomEmergencyContactsValue.set(contactData.groupId, {
      addedNew: false,
      propertyIds: contactData['tagIds'] || contactData['propertyIds'],
      emergencyContacts: mappedEmergencyContact
    });
    this.subscribeToValueChanges();
  }

  addNewSectionEmergencyContacts(index: number) {
    if (this.readonly) return;
    const emergencyContactControl = this.customEmergencyContacts
      .at(index)
      .get('emergencyContacts') as FormArray;
    if (emergencyContactControl.controls.some((control) => control.invalid)) {
      emergencyContactControl.controls.forEach((control) =>
        control.markAllAsTouched()
      );
      return;
    }
    const generatedGroupTypeId = uuid4();
    emergencyContactControl.push(
      this.emergencyContactsFormService.createNewEmergencyContactForm(
        null,
        generatedGroupTypeId
      )
    );
    const indexGroupId = this.customEmergencyContacts
      .at(index)
      .get('groupId')?.value;
    const { addedNew, propertyIds, emergencyContacts } =
      this.existedCustomEmergencyContactsValue.get(indexGroupId) || {};
    emergencyContacts.push({
      groupTypeId: generatedGroupTypeId,
      typeId: null,
      supplierIds: [],
      addedNew: true
    });
    this.existedCustomEmergencyContactsValue.set(indexGroupId, {
      addedNew,
      propertyIds,
      emergencyContacts
    });
    this.emergencyContactsFormService.populateListsForCustomContacts(
      this.typesList,
      this.propertyDataSource,
      this.suppliersList,
      this.isRMEnvironment
    );
    this.subscribeToValueChanges();
  }

  addNewSectionCustomEmergencyContacts() {
    if (this.readonly) return;
    if (
      this.customEmergencyContacts.controls.some((control) => control.invalid)
    ) {
      this.customEmergencyContacts.controls.forEach((control) =>
        control.markAllAsTouched()
      );
      return;
    }
    const generatedGroupId = uuid4();
    const generatedGroupTypeId = uuid4();
    this.emergencyContactsFormService.addNewCustomEmergencyContact(
      generatedGroupId,
      generatedGroupTypeId,
      this.propertyDataSource,
      this.suppliersList
    );
    this.existedCustomEmergencyContactsValue.set(generatedGroupId, {
      addedNew: true,
      propertyIds: [],
      emergencyContacts: [
        {
          groupTypeId: generatedGroupTypeId,
          typeId: null,
          supplierIds: [],
          addedNew: true
        }
      ]
    });
    this.emergencyContactsFormService.populateListsForCustomContacts(
      this.typesList,
      this.propertyDataSource,
      this.suppliersList,
      this.isRMEnvironment
    );
    this.subscribeToValueChanges();
  }

  contactFocusHandler(control: IEmergencyContactsFormGroup): void {
    const { groupTypeId } = control.value || {};
    this.focusStateMap.emergencyContactDropdown.set(groupTypeId, true);
  }

  contactActionHandler(
    control: IEmergencyContactsFormGroup,
    parentControl: ICustomEmergencyContactFormGroup,
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
    const {
      groupTypeId,
      typeId: controlTypeId,
      supplierIds: controlSupplierIds
    } = control.value || {};
    const { groupId, propertyIds } = parentControl.value || {};
    !removeSingle &&
      this.focusStateMap.emergencyContactDropdown.set(groupTypeId, false);
    const { emergencyContacts } =
      this.existedCustomEmergencyContactsValue.get(groupId) || {};
    const { supplierIds: existedSupplierIds } =
      emergencyContacts?.find(
        (contact) => contact.groupTypeId === groupTypeId
      ) || {};
    const suppliersChanged = !isEqual(
      [...(existedSupplierIds || [])].sort(),
      [...controlSupplierIds].sort()
    );
    suppliersControl.markAsTouched();
    if (
      this.focusStateMap.emergencyContactDropdown.get(
        control.get('groupTypeId').value
      ) ||
      !suppliersChanged ||
      !controlTypeId ||
      !propertyIds?.length
    )
      return;
    this.saveEmergencyContacts(parentControl);
  }

  propertyFocusHandler(control: ICustomEmergencyContactFormGroup): void {
    const { groupId } = control.value || {};
    this.focusStateMap.propertyDropdown.set(groupId, true);
  }

  propertyActionHandler(
    control: ICustomEmergencyContactFormGroup,
    removeSingle: boolean = false,
    removeAll: boolean = false
  ): void {
    const propertiesControl = control.get('propertyIds') as FormControl<
      string[]
    >;
    if (removeAll) {
      propertiesControl.setValue([]);
      propertiesControl.updateValueAndValidity();
      if (propertiesControl.invalid) {
        propertiesControl.markAsTouched();
      }
      return;
    }
    const { groupId, propertyIds, emergencyContacts } = control.value || {};
    !removeSingle && this.focusStateMap.propertyDropdown.set(groupId, false);
    const { propertyIds: existedPropertyIds } =
      this.existedCustomEmergencyContactsValue.get(groupId) || {};

    const propertiesChanged = !isEqual(
      [...(existedPropertyIds || [])].sort(),
      [...propertyIds].sort()
    );
    propertiesControl.markAsTouched();
    if (
      this.focusStateMap.propertyDropdown.get(groupId) ||
      !propertiesChanged ||
      !emergencyContacts?.length ||
      emergencyContacts?.some(
        (item) => !item.typeId || !item.supplierIds?.length
      )
    )
      return;
    this.saveEmergencyContacts(control);
  }

  deleteGroupTypeHandler(
    control: IEmergencyContactsFormGroup,
    parentControl: ICustomEmergencyContactFormGroup,
    index: number
  ) {
    (parentControl.get('emergencyContacts') as FormArray).removeAt(index);
    const { emergencyContacts } =
      this.existedCustomEmergencyContactsValue.get(
        parentControl.get('groupId').value
      ) || {};
    const existedContact =
      emergencyContacts?.find(
        (item) => item.groupTypeId === control.get('groupTypeId').value
      ) || {};
    this.subscribeToValueChanges();

    if (existedContact && !existedContact['addedNew']) {
      this.emergencyContactsApiService
        .deleteCustomEmergencyContactsByGroupType(
          control.get('groupTypeId').value
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.emergencyContactsFormService.populateListsForCustomContacts(
              this.typesList,
              this.propertyDataSource,
              this.suppliersList,
              this.isRMEnvironment
            );
            this.emergencyContactsService.refreshTypeLists();
          },
          error: () => {}
        });
    }
  }

  deleteGroupHandler(
    groupControl: ICustomEmergencyContactFormGroup,
    groupIndex: number
  ) {
    this.customEmergencyContacts.removeAt(groupIndex);
    const existedContact =
      this.existedCustomEmergencyContactsValue.get(
        groupControl.get('groupId').value
      ) || {};
    this.subscribeToValueChanges();

    if (existedContact && !existedContact['addedNew']) {
      this.emergencyContactsApiService
        .deleteCustomEmergencyContactsByGroup(groupControl.get('groupId').value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.emergencyContactsFormService.populateListsForCustomContacts(
              this.typesList,
              this.propertyDataSource,
              this.suppliersList,
              this.isRMEnvironment
            );
            this.emergencyContactsService.refreshTypeLists();
            this.toastService.success('Custom emergency contacts deleted');
          },
          error: () => {}
        });
    }
  }

  addSupplierToFormHandler(
    event: ISelectContacts,
    control: IEmergencyContactsFormGroup,
    parentControl: ICustomEmergencyContactFormGroup
  ): void {
    if (event) {
      const {
        groupTypeId,
        typeId: controlTypeId,
        supplierIds: controlSupplierIds
      } = control.value || {};
      const suppliersControl = control.get('supplierIds');
      const updatedSupplierIds = [...controlSupplierIds, event.id];
      suppliersControl.setValue(updatedSupplierIds);
      const { propertyIds } =
        this.existedCustomEmergencyContactsValue.get(
          parentControl.get('groupId')?.value
        ) || {};

      if (
        this.focusStateMap.emergencyContactDropdown.get(groupTypeId) ||
        !updatedSupplierIds?.length ||
        !controlTypeId ||
        !propertyIds?.length
      )
        return;
      this.saveEmergencyContacts(parentControl);
    }
  }

  addNewTypeHandler(
    event: { name: string; id: string },
    control: IEmergencyContactsFormGroup
  ): void {
    control.patchValue({ typeId: event.id });
  }

  deleteTypeHandler(
    deletedTypeId: string,
    control: IEmergencyContactsFormGroup
  ) {
    if (control.value.typeId === deletedTypeId) {
      control.patchValue({ typeId: null });
    }
  }

  trackByFunction(_: number, item: ITag | Property) {
    return item.id;
  }

  adjustDropdownPositionForCustomItem(index: number) {
    const item = document.querySelectorAll('.custom-item').item(index);
    this.dropdownPositionForCustomItem[index] = this.getDropdownDirection(
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
    return elementRect < parentTop + parentHeight / 2 ? 'bottom' : 'top';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }
}
