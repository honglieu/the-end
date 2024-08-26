import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, filter, takeUntil } from 'rxjs';
import { DEFAULT_CHAR_TRUDI_TEXTAREA_FIELD } from '@services/constants';
import { SharedAgencySettingsService } from '@/app/dashboard/modules/agency-settings/components/shared/shared-agency-settings.service';
import { SharedAgencySettingsFormService } from '@/app/dashboard/modules/agency-settings/components/shared/shared-agency-settings-form.service';
import { IOptionConfig } from '@/app/dashboard/modules/agency-settings/utils/interface';
import { ActionSectionPolicies } from '@/app/dashboard/modules/agency-settings/utils/template';
import { ETypeInput } from '@/app/dashboard/modules/agency-settings/utils/enum';

@Component({
  selector: 'app-checkbox-polices-item',
  templateUrl: './checkbox-polices-item.component.html',
  styleUrls: ['./checkbox-polices-item.component.scss']
})
export class CheckboxPolicesItemComponent implements OnInit, OnDestroy {
  @Input() option: IOptionConfig;
  @Input() section: ActionSectionPolicies;
  @Input() menu: string;
  @Input() disabled: boolean;
  @Input() sameGroupData: string[];
  private destroy$ = new Subject<void>();
  public fb: FormBuilder = new FormBuilder();
  public formGroup: FormGroup;
  public templateComponent = [];
  readonly typeInput = ETypeInput;
  readonly DEFAULT_CHAR_TRUDI_TEXTAREA_FIELD =
    DEFAULT_CHAR_TRUDI_TEXTAREA_FIELD;
  public isTheLastOptionInThisGroup = false;
  public isTextarea: boolean = false;
  public isBrowserSafari: boolean = false;
  public controlLastOption = new FormControl(true);

  constructor(
    private sharedAgencySettingsService: SharedAgencySettingsService,
    private sharedAgencySettingsFormService: SharedAgencySettingsFormService
  ) {}
  ngOnInit(): void {
    this.isBrowserSafari = this.isSafariBrowser();
    this.sharedAgencySettingsFormService.formData[this.option.id] =
      this.fb.group({});
    this.formGroup = this.fb.group({});
    this.formGroup.addControl(this.option.id, new FormControl(false));
    this.templateComponent = this.option.text
      .split(/[${}]/g)
      .filter(Boolean)
      .map((item) => {
        if (this.option.config && this.option.config[item]) {
          this.formGroup.addControl(
            item,
            new FormControl(this.option.config[item].defaultValue ?? '')
          );
          return { ...this.option.config[item], controlName: item };
        }
        return { type: ETypeInput.TEXT_DEFAULT, text: item };
      });

    this.isTextarea = this.templateComponent.some(
      (item) => item.type === this.typeInput.INPUT_TEXTAREA
    );

    this.sharedAgencySettingsFormService.setForm(
      this.option.id,
      this.formGroup
    );
    this.formGroup
      .get(this.option.id)
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (this.option.children?.length) {
          this.handleChildOptions(res);
        }
        if (!res) this.resetAllControl();
        this.formGroup.value[this.option.id] = res;
        this.onUpdateOption();
      });

    this.sharedAgencySettingsService.optionChanges.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.isTheLastOptionInThisGroup =
            this.sharedAgencySettingsService.isTheLastSelectedOption(
              this.option.id,
              this.menu,
              this.section,
              this.sameGroupData
            );
        }
      });

    this.sharedAgencySettingsService.currentResponseCheckbox$
      .pipe(filter(Boolean), takeUntil(this.destroy$))
      .subscribe((res) => {
        const isSelected = !!res[this.option.id];
        this.formGroup
          .get(this.option.id)
          ?.setValue(isSelected, { emitEvent: false });

        if (isSelected) {
          const optionConfig = this.option?.config || {};
          Object.keys(optionConfig).forEach((item) => {
            const targetValue =
              res[this.option.id]?.value?.[item] ??
              this.option.config[item].defaultValue;
            this.formGroup
              .get(item)
              ?.setValue(targetValue, { emitEvent: false });
          });
          this.isTheLastOptionInThisGroup =
            this.sharedAgencySettingsService.isTheLastSelectedOption(
              this.option.id,
              this.menu,
              this.section,
              this.sameGroupData
            );
        } else {
          this.resetAllControl();
        }
      });
  }

  isSafariBrowser() {
    return (
      navigator.userAgent.indexOf('Safari') > -1 &&
      navigator.userAgent.indexOf('Chrome') <= -1
    );
  }

  resetAllControl() {
    Object.keys(this.option?.config || {}).forEach((item) => {
      this.formGroup
        .get(item)
        ?.setValue(this.option.config[item].defaultValue, { emitEvent: false });
    });
  }

  handleOptionLast() {
    this.controlLastOption.setValue(true, { emitEvent: false });
  }

  onTriggerBlurEvent(controlName: string) {
    const isEmptyInput = this.formGroup.get(controlName)?.value === '';
    const defaultValue = this.option.config?.[controlName]?.defaultValue;
    if (isEmptyInput && defaultValue) {
      this.formGroup.get(controlName)?.setValue(defaultValue);
    }
    this.onUpdateOption();
  }

  onUpdateOption() {
    const optionId = this.option.id;
    this.sharedAgencySettingsService.handleUpdateOption(
      optionId,
      this.formGroup.value,
      this.sharedAgencySettingsFormService.formData[optionId]?.get(optionId)
        ?.value
    );
  }

  handleChildOptions(res: boolean) {
    if (res) {
      const childOptionId = this.option.children[0];
      this.onUpdateChildOption(childOptionId.id, true);
    } else {
      this.option.children.forEach((childOptionId) => {
        if (
          this.sharedAgencySettingsFormService.isCheckBoxSelected(
            childOptionId.id
          )
        ) {
          this.onUpdateChildOption(childOptionId.id, false);
        }
      });
    }
  }

  onUpdateChildOption(childOptionId: string, isSelected: boolean) {
    this.sharedAgencySettingsFormService
      .getForm(childOptionId)
      .get(childOptionId)
      .setValue(isSelected);
    this.sharedAgencySettingsService.handleUpdateOption(
      childOptionId,
      {
        [childOptionId]: isSelected
      },
      this.sharedAgencySettingsFormService.formData[this.option.id]?.get(
        this.option.id
      )?.value
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
