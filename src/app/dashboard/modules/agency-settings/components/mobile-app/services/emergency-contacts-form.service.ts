import { Injectable } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  ICustomEmergencyContact,
  ICustomEmergencyContactFormGroup,
  IDefaultEmergencyContactFormGroup,
  IDefaultEmergencyContactResponse,
  IEmergencyContactsFormGroup,
  IPTCustomEmergencyContactResponse,
  IRMCustomEmergencyContactResponse,
  ITypeOption
} from '@/app/dashboard/modules/agency-settings/components/mobile-app/types/emergency-contacts.interface';
import {
  ISelectContacts,
  ITag
} from '@/app/dashboard/modules/agency-settings/utils/interface';
import { Property } from '@shared/types/property.interface';
import { EEntityType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { EPropertyStatus, crmStatusType } from '@shared/enum';
import {
  sortPropertiesList,
  sortSuppliersList
} from '@/app/dashboard/modules/agency-settings/utils/functions';

@Injectable()
export class EmergencyContactsFormService {
  defaultEmergencyContactsForm: FormGroup;
  customEmergencyContactsForm: FormGroup;

  constructor(private fb: FormBuilder) {}

  get defaultEmergencyContacts() {
    return this.defaultEmergencyContactsForm.get(
      'defaultEmergencyContacts'
    ) as FormArray<IDefaultEmergencyContactFormGroup>;
  }

  get customEmergencyContacts() {
    return this.customEmergencyContactsForm?.get(
      'customEmergencyContacts'
    ) as FormArray<ICustomEmergencyContactFormGroup>;
  }

  get existedPropertyIds() {
    return [
      ...new Set(
        this.customEmergencyContacts.value.flatMap((item) => item.propertyIds)
      )
    ] as string[];
  }

  buildDefaultEmergencyContactsForm(): void {
    this.defaultEmergencyContactsForm = this.fb.group({
      defaultEmergencyContacts:
        this.fb.array<IDefaultEmergencyContactFormGroup>([])
    });
  }

  buildCustomEmergencyContactsForm() {
    this.customEmergencyContactsForm = this.fb.group({
      customEmergencyContacts: this.fb.array<ICustomEmergencyContactFormGroup>(
        []
      )
    });
  }

  addDefaultContactsToForm(
    contactData: IDefaultEmergencyContactResponse,
    generatedGroupId: string,
    typesList: ITypeOption[],
    suppliersList: ISelectContacts[]
  ): void {
    const { groupId, typeId, users } = contactData || {};
    const supplierIds = users?.map((user) => user.id);
    const contactForm = this.fb.group({
      groupId: [groupId || generatedGroupId],
      typeId: [contactData ? typeId : null, Validators.required],
      suppliers: [users || suppliersList],
      supplierIds: [contactData ? supplierIds : [], Validators.required]
    });

    if (!contactData) {
      if (
        this.defaultEmergencyContacts.controls.some(
          (control) => control.invalid
        )
      ) {
        this.defaultEmergencyContacts.controls.forEach((control) =>
          control.markAllAsTouched()
        );
        return;
      }
      const selectedTypeIds = this.defaultEmergencyContacts.value.map(
        (contact) => contact.typeId
      );
      contactForm['typesList'] = this.getUpdatedTypeOptions(
        null,
        selectedTypeIds,
        typesList
      );
      contactForm['suppliersList'] = suppliersList;
    }
    this.defaultEmergencyContacts.push(contactForm);
  }

  addCustomContactsToForm(
    contactData:
      | IPTCustomEmergencyContactResponse
      | IRMCustomEmergencyContactResponse,
    generatedGroupTypeId: string,
    suppliersList: ISelectContacts[]
  ) {
    const contactForm = this.fb.group({
      groupId: [contactData?.groupId],
      properties: [contactData['properties']],
      propertyIds: [
        contactData['tagIds'] || contactData['propertyIds'],
        Validators.required
      ],
      emergencyContacts: !!contactData?.contacts?.length
        ? this.fb.array(
            contactData?.contacts.map((emergencyContact) =>
              this.createNewEmergencyContactForm(
                emergencyContact,
                null,
                suppliersList
              )
            )
          )
        : this.fb.array([
            this.createNewEmergencyContactForm(
              null,
              generatedGroupTypeId,
              suppliersList
            )
          ])
    }) as ICustomEmergencyContactFormGroup;
    this.customEmergencyContacts.push(contactForm);
  }

  createNewEmergencyContactForm(
    emergencyContact?: ICustomEmergencyContact | null,
    generatedGroupId?: string,
    suppliersList?: ISelectContacts[]
  ) {
    return this.fb.group({
      groupTypeId: [emergencyContact?.groupTypeId || generatedGroupId],
      typeId: [emergencyContact?.typeId || null, Validators.required],
      suppliers: [emergencyContact?.users || suppliersList],
      supplierIds: [
        (!!emergencyContact?.users?.length &&
          emergencyContact.users?.map((user) => user.id)) ||
          [],
        Validators.required
      ]
    });
  }

  addNewCustomEmergencyContact(
    generatedGroupId: string,
    generatedGroupTypeId: string,
    propertiesList: (ITag | Property)[],
    suppliersList: ISelectContacts[]
  ) {
    const newSection = this.fb.group({
      groupId: [generatedGroupId],
      properties: [propertiesList],
      propertyIds: [[], Validators.required],
      emergencyContacts: this.fb.array([
        this.createNewEmergencyContactForm(
          null,
          generatedGroupTypeId,
          suppliersList
        )
      ])
    }) as ICustomEmergencyContactFormGroup;
    this.customEmergencyContacts.push(newSection);
  }

  populateListsForDefaultContacts(
    typesList: ITypeOption[],
    suppliersList: ISelectContacts[]
  ): void {
    const selectedTypeIds = this.defaultEmergencyContacts.value.map(
      (contact) => contact.typeId
    );
    this.defaultEmergencyContacts.controls.forEach((control) => {
      let suppliersListInput = [...suppliersList];
      const typeControl = control.get('typeId') as FormControl<string>;
      control['typesList'] = this.getUpdatedTypeOptions(
        typeControl.value,
        selectedTypeIds,
        typesList
      );
      if (!!control.get('suppliers')?.value?.length) {
        const controlSuppliers = control.get('suppliers')
          .value as ISelectContacts[];
        const hasArchivedSuppliers = controlSuppliers.some(
          (supplier) => supplier.status === crmStatusType.archived
        );
        suppliersListInput = suppliersListInput.filter(
          (supplier) => supplier['status'] !== crmStatusType.archived
        );
        if (hasArchivedSuppliers) {
          controlSuppliers.forEach((supplier) => {
            const existedSupplier = suppliersListInput.find(
              (inputSupplier) => inputSupplier.id === supplier.id
            );
            if (
              supplier.status === crmStatusType.archived &&
              !existedSupplier
            ) {
              suppliersListInput.push(supplier);
            }
          });
        }
        suppliersListInput = sortSuppliersList(suppliersListInput);
      }
      control['suppliersList'] = suppliersListInput;
    });
  }

  populateListsForCustomContacts(
    typesList: ITypeOption[],
    propertiesList: (ITag | Property)[],
    suppliersList: ISelectContacts[],
    isRMEnvironment: boolean
  ): void {
    this.customEmergencyContacts.controls.forEach((control) => {
      let propertiesListInput = [...propertiesList];
      const emergencyContactControl = control.get(
        'emergencyContacts'
      ) as FormArray<IEmergencyContactsFormGroup>;
      const existedTypeIds = emergencyContactControl.value.map(
        (item) => item.typeId
      );
      if (isRMEnvironment && control.get('properties')?.value) {
        const controlProperties = control.get('properties').value as Property[];
        const hasInactiveProperties = controlProperties.some(
          (property) => property.status === EPropertyStatus.inactive
        );
        propertiesListInput.filter(
          (property) => property['status'] !== EPropertyStatus.inactive
        );
        if (hasInactiveProperties) {
          controlProperties.forEach((property) => {
            const existedProperty = propertiesListInput.find(
              (inputProperty) => inputProperty.id === property.id
            );
            if (
              property.status === EPropertyStatus.inactive &&
              !existedProperty
            ) {
              propertiesListInput.push(property);
            }
          });
        }
        propertiesListInput = sortPropertiesList(
          propertiesListInput as Property[]
        );
      }
      control['propertiesList'] = this.getUpdatedPropertyOptions(
        control.get('propertyIds').value,
        propertiesListInput,
        isRMEnvironment
      );
      emergencyContactControl.controls.forEach((subControl) => {
        let suppliersListInput = [...suppliersList];
        subControl['typesList'] = this.getUpdatedTypeOptions(
          subControl.get('typeId').value,
          existedTypeIds,
          typesList
        );
        if (!!subControl.get('suppliers')?.value?.length) {
          const controlSuppliers = subControl.get('suppliers')
            .value as ISelectContacts[];
          const hasArchivedSuppliers = controlSuppliers.some(
            (supplier) => supplier.status === crmStatusType.archived
          );
          suppliersListInput = suppliersListInput.filter(
            (supplier) => supplier['status'] !== crmStatusType.archived
          );
          if (hasArchivedSuppliers) {
            controlSuppliers.forEach((supplier) => {
              const existedSupplier = suppliersListInput.find(
                (inputSupplier) => inputSupplier.id === supplier.id
              );
              if (
                supplier.status === crmStatusType.archived &&
                !existedSupplier
              ) {
                suppliersListInput.push(supplier);
              }
            });
          }
          suppliersListInput = sortSuppliersList(suppliersListInput);
        }
        subControl['suppliersList'] = suppliersListInput;
      });
    });
  }

  getUpdatedTypeOptions(
    typeId: string,
    selectedTypeIds: string[],
    typesList: ITypeOption[]
  ): ITypeOption[] {
    return typesList.map((type) => ({
      ...type,
      disabled: selectedTypeIds.includes(type.id) && type.id !== typeId
    }));
  }

  getUpdatedPropertyOptions(
    propertyIds: string[],
    propertiesList: (ITag | Property)[],
    isRMEnvironment: boolean
  ) {
    return propertiesList.map((item) => {
      const matchingDisabled =
        this.existedPropertyIds.includes(item.id) &&
        !propertyIds.includes(item.id);
      const tooltipPropertyLabel = isRMEnvironment
        ? (item as Property).sourceProperty?.type === EEntityType.UNIT
          ? 'unit'
          : 'property'
        : 'tag';
      return {
        ...item,
        value: item.id,
        label: isRMEnvironment
          ? (item as Property).streetline
          : (item as ITag).name,
        disabled:
          ((item as Property).status === EPropertyStatus.inactive &&
            !propertyIds.includes(item.id)) ||
          matchingDisabled,
        tooltip: matchingDisabled
          ? `This ${tooltipPropertyLabel} is selected in another custom emergency contact`
          : null,
        tagGroupName: (item as ITag).tagGroup?.name
      };
    });
  }
}
