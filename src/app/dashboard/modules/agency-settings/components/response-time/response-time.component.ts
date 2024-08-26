import { Component, OnDestroy, OnInit } from '@angular/core';
import { PermissionService } from '@services/permission.service';
import { SharedAgencySettingsService } from '@/app/dashboard/modules/agency-settings/components/shared/shared-agency-settings.service';
import { SharedAgencySettingsApiService } from '@/app/dashboard/modules/agency-settings/components/shared/shared-agency-settings-api.service';
import { Subject, debounceTime, filter, takeUntil } from 'rxjs';
import {
  ActionSectionPolicies,
  TemplateOptionsData
} from '@/app/dashboard/modules/agency-settings/utils/template';
import {
  IBaseOptionDto,
  IConfigNgSelect
} from '@/app/dashboard/modules/agency-settings/utils/interface';
import { DEBOUNCE_TIME } from '@/app/dashboard/modules/agency-settings/utils/constants';
import { ETypeInput } from '@/app/dashboard/modules/agency-settings/utils/enum';

@Component({
  selector: 'response-time',
  templateUrl: './response-time.component.html',
  styleUrls: ['./response-time.component.scss']
})
export class ResponseTimeComponent implements OnInit, OnDestroy {
  public templateData = TemplateOptionsData;
  public orderedMaintenanceComplianceKeys;
  public newTemplateData: [];
  public config: IConfigNgSelect;
  public isReadonly: boolean;
  public isLoading: boolean = false;
  private destroy$: Subject<void> = new Subject<void>();
  readonly typeInput = ETypeInput;

  constructor(
    private permissionService: PermissionService,
    private sharedAgencySettingsApiService: SharedAgencySettingsApiService,
    private sharedAgencySettingsService: SharedAgencySettingsService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.getSelectedOptions();
    this.handleCallApiUpdateOption();
    this.orderedMaintenanceComplianceKeys = [
      ActionSectionPolicies.NonUrgentEnquiries,
      ActionSectionPolicies.UrgentEnquiries
    ];
    this.handleUpdateRole();
    this.newTemplateData = this.transformData(this.templateData.ResponseTime);
  }

  getSelectedOptions() {
    this.sharedAgencySettingsApiService
      .getSelectedOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.sharedAgencySettingsService.setResponseCheckbox(response);
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  handleCallApiUpdateOption() {
    this.sharedAgencySettingsService.optionChanges.valueChanges
      .pipe(
        debounceTime(DEBOUNCE_TIME),
        filter((item) => !!item.length),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        const changedOptions = value;
        const createOption: IBaseOptionDto[] = [];
        const removeOptionIds: string[] = [];

        changedOptions.forEach((changedOption) => {
          if (changedOption.isSelected)
            createOption.push({
              optionId: changedOption.id,
              value: changedOption.value
            });

          if (!changedOption.isSelected) removeOptionIds.push(changedOption.id);
        });

        createOption.length &&
          this.sharedAgencySettingsApiService
            .upsertOptions(createOption)
            .subscribe();

        removeOptionIds?.length &&
          this.sharedAgencySettingsApiService
            .removeOptions({
              optionIds: removeOptionIds
            })
            .subscribe();
        this.sharedAgencySettingsService.optionChanges.value = [];
      });
  }

  handleUpdateRole() {
    this.isReadonly = !this.permissionService.hasFunction(
      'POLICIES.RESPONSE_TIME.EDIT'
    );
  }

  getItemsUpToLastValue(initValue, lastValue) {
    return Array.from({ length: lastValue - initValue + 1 }, (_, index) => ({
      id: initValue + index,
      text: initValue + index
    }));
  }

  transformData(data: any) {
    const transformedData: any = {};

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const dataSection = data[key];

        if (dataSection.sections) {
          const transformedSections = dataSection.sections.map((subSection) => {
            const transformedOptions = subSection.options.map((option) => ({
              value: option.id,
              label: option.text
            }));
            return {
              formControlName: subSection.formRadioControl,
              subTitleChild: subSection.subTitleChild,
              isRadioButton: subSection.isRadioButton,
              options: transformedOptions
            };
          });

          transformedData[key] = {
            isRadioButton: dataSection?.isRadioButton,
            subTitle: dataSection?.subTitle,
            section: transformedSections
          };
        } else {
          transformedData[key] = dataSection;
        }
      }
    }

    return transformedData;
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
