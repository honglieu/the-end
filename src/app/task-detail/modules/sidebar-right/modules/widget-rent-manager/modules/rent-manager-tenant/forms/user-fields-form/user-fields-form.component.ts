import { Component } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { TenantFormBase } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-base';
import { TenantOptionsStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-options-state.service';
import { debounceTime, firstValueFrom, switchMap, take, takeUntil } from 'rxjs';
import { TenantFormMasterService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-master.service';
import {
  LIST_ATTACH_TYPE_USER_DEFINED,
  LIST_IMAGE_TYPE_USER_DEFINED
} from '@services/constants';
import { isEmpty } from 'lodash-es';
import {
  IEncrypted,
  IUserField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import {
  EAttachment,
  EFieldType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/enums/rent-manager-lease-renewal.enum';
import { TenantStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-state.service';

type UserFieldsForm = FormArray;

@Component({
  selector: 'user-fields-form',
  templateUrl: './user-fields-form.component.html',
  styleUrls: ['./user-fields-form.component.scss']
})
export class UserFieldsFormComponent extends TenantFormBase<UserFieldsForm> {
  originFields: IUserField[] = [];
  showFields: IUserField[] = [];
  encryptFieldList: IEncrypted[] = [];
  isEditTenant!: boolean;
  readonly EFieldType = EFieldType;
  readonly MAX_CHARACTER = 2000;
  readonly LIST_ATTACH_TYPE_USER_DEFINED = LIST_ATTACH_TYPE_USER_DEFINED;
  readonly LIST_IMAGE_TYPE_USER_DEFINED = LIST_IMAGE_TYPE_USER_DEFINED;
  disabled: boolean = false;
  public readonly yesNoOption = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' }
  ];

  imageWarningText = `Only ${LIST_IMAGE_TYPE_USER_DEFINED.filter(Boolean)
    .map((imgType) => `'${imgType}'`)
    .join(', ')} are allowed.`;
  isShowWarning: boolean = true;
  public searchForm = new FormGroup({
    searchText: new FormControl('')
  });

  constructor(
    private tenantOptionsStateService: TenantOptionsStateService,
    private tenantStateService: TenantStateService,
    private tenantFormMaster: TenantFormMasterService,
    private formBuilder: FormBuilder
  ) {
    super();
  }
  override ngOnInit(): void {
    super.ngOnInit();
    this.tenantFormMaster.isSyncing$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isSyncing) => {
        this.disabled = isSyncing;
      });
    this.tenantOptionsStateService.optionsSync$
      .pipe(
        take(1),
        switchMap((options) => {
          this.originFields = [...options?.userDefinedFields];
          this.sortByRequireField();
          this.removeEncyptFields();
          this.addMaskNumericField();
          return this.tenantStateService.tenant$.pipe(take(1));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(async (tenant) => {
        const isSyncing = await firstValueFrom(
          this.tenantFormMaster.isSyncing$
        );
        this.handlePatchValueTenant(tenant?.data?.userDefinedValues ?? []);
        this.handleAddIndex();
        this.handleAddOption();
        if (!isSyncing) {
          this.initializeFields();
        }
        this.showFields = [...this.originFields];
      });
    this.listenSearchField();
  }

  sortByRequireField() {
    this.originFields.sort((a, b) => {
      const isRequiredComparison = Number(b.isRequired) - Number(a.isRequired);
      if (isRequiredComparison !== 0) {
        return isRequiredComparison;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  addMaskNumericField() {
    this.originFields = this.originFields.map((field) => {
      if (field?.fieldType === EFieldType.NUMERIC) {
        return { ...field, maskPattern: `separator.${field?.precisionValue}` };
      }
      return { ...field };
    });
  }

  listenSearchField() {
    this.searchForm
      .get('searchText')
      .valueChanges.pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe((searchText) => this.handleSearch(searchText));
  }

  removeEncyptFields() {
    this.originFields = this.originFields.filter(
      (field) => !(field?.fieldType === EFieldType.ENCRYPTED_TEXT)
    );
  }

  handleBlurCheckAllWhitespace(idx) {
    const field = this.getFormGroupByIndex(idx)?.get('value');
    const value = field?.value;
    if (value && !value?.trim()) {
      field?.setValue('');
    }
  }

  hyperlinkValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value as string;
      if (!value) {
        return null;
      }
      const pattern = /^[^\s]+(\.[^\s]+)+$/;
      const isValid = pattern.test(value);
      return isValid ? null : { hyperlink: true };
    };
  }

  setValidatorHyperLink() {
    (this.originFields || []).forEach((field, idx) => {
      if (field?.fieldType === EFieldType.HYPERLINK) {
        const validators = [this.hyperlinkValidator()];
        if (field?.isRequired) {
          validators?.push(Validators.required);
        }
        this.getFormGroupByIndex([idx])?.get('value').setValidators(validators);
      }
    });
  }

  handleSearch(value) {
    const searchText = (value || '').toLowerCase().replace(/\s/g, '');
    if (searchText) {
      this.showFields = (this.originFields || []).filter((field) =>
        field?.name.toLowerCase().replace(/\s/g, '')?.includes(searchText)
      );
    } else {
      this.showFields = [...this.originFields];
    }
  }

  getFormGroupByIndex(idx) {
    return this.form?.get([idx]);
  }

  handleAddIndex() {
    this.originFields = (this.originFields || []).map((field, idx) => {
      return { ...field, formIndex: idx };
    });
  }

  handlePatchValueTenant(userDefinedValues) {
    if (userDefinedValues.length) {
      this.originFields = this.originFields.map((field) => {
        const fieldValue = userDefinedValues.find(
          (fieldValue) => fieldValue?.fieldId === field?.source?.externalId
        );
        const value = fieldValue?.value;
        const file = this.formatFile(fieldValue?.attachment ?? {});
        return { ...field, value, file };
      });
    } else {
      this.originFields = this.originFields.map((field) => {
        const value = field?.defaultValue;
        const file = this.formatFile(field?.attachment ?? {});
        return { ...field, value, file };
      });
    }
  }

  formatFile(file) {
    if (isEmpty(file)) return [];
    const suffix = file?.fileName?.split('.').pop();

    const mediaType =
      LIST_IMAGE_TYPE_USER_DEFINED.includes(`.${suffix}`) &&
      !suffix.includes('tif')
        ? 'photo'
        : 'file';
    const icon = mediaType === EAttachment.FILE ? `${suffix}` : `image.svg`;
    const mediaLink = file?.mediaLink;
    const fileName = file?.fileName;
    return [{ mediaType, icon, mediaLink, fileName }];
  }

  handleAddOption() {
    this.originFields = (this.originFields || []).map((field) => {
      return {
        ...field,
        option: field?.comboList?.split('|')?.reduce((acc, cur) => {
          return [...acc, { label: cur, value: cur }];
        }, [])
      };
    });
  }

  handleCheckboxChange(event, item, idx) {
    const field = this.getFormGroupByIndex(idx)?.get('selectedValues');
    const valueSelectedList = [...field?.value] || [];
    if (event) {
      valueSelectedList.push(item?.value);
    } else {
      const idx = valueSelectedList.indexOf(item?.value);
      valueSelectedList.splice(idx, 1);
    }
    field.setValue(valueSelectedList);
  }

  private initializeFields() {
    (this.originFields || []).forEach((fieldData) => {
      const formObject = {
        id: [fieldData?.source?.externalId],
        name: [fieldData?.name],
        fieldType: [fieldData?.fieldType]
      };
      switch (fieldData?.fieldType) {
        case EFieldType.FILE:
        case EFieldType.IMAGE:
          formObject['file'] = [
            fieldData?.file,
            fieldData.isRequired ? Validators.required : null
          ];
          break;
        case EFieldType.CHECKED_LIST:
          const itemsSelected = fieldData?.value?.split(',');
          formObject['selectedValues'] = [
            itemsSelected,
            fieldData.isRequired ? Validators.required : null
          ];
          break;
        case EFieldType.DROPDOWN:
          formObject['selectedValues'] = [
            fieldData?.value,
            fieldData.isRequired ? Validators.required : null
          ];
          break;
        default:
          formObject['value'] = [
            fieldData?.value,
            fieldData.isRequired ? Validators.required : null
          ];
      }
      const fieldGroup = this.formBuilder.group(formObject);
      this.form?.push(fieldGroup);
    });
    this.setValidatorHyperLink();
  }

  onGetSelectedFile(file, idx) {
    const newFile = this.formatFile({ ...file[0] });
    this.getFormGroupByIndex([idx]).get('file').patchValue(newFile);
  }

  private clearThisForm() {
    (this.form as FormArray).clear();
  }

  override ngOnDestroy() {
    this.clearThisForm();
    super.ngOnDestroy();
  }
}
