import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { SharedAgencySettingsFormService } from './shared-agency-settings-form.service';
import {
  ActionSectionPolicies,
  TemplateOptionsData
} from '@/app/dashboard/modules/agency-settings/utils/template';
import {
  IOptions,
  IResponseCheckBox
} from '@/app/dashboard/modules/agency-settings/utils/interface';
import { ObservableState } from '@/app/dashboard/modules/agency-settings/utils/models';

@Injectable({
  providedIn: 'root'
})
export class SharedAgencySettingsService {
  public currentResponseCheckbox: BehaviorSubject<IResponseCheckBox> =
    new BehaviorSubject(null);
  public currentResponseCheckbox$ = this.currentResponseCheckbox.asObservable();
  public optionChanges = new ObservableState<IOptions[]>([]);
  private scrollSubject = new Subject<void>();
  scroll$ = this.scrollSubject.asObservable();

  constructor(
    public sharedAgencySettingsFormService: SharedAgencySettingsFormService
  ) {}

  public setResponseCheckbox(value: IResponseCheckBox) {
    return this.currentResponseCheckbox.next(value);
  }

  emitScroll(): void {
    this.scrollSubject.next();
  }

  isTheLastSelectedOption(
    optionId: string,
    menu: string,
    section: ActionSectionPolicies,
    sameGroupIds: string[]
  ) {
    const { options = [], sections = [] } =
      (menu && section && TemplateOptionsData[menu][section]) || {};

    const optionIds = [
      ...options,
      ...sections.reduce((res, { options }) => [...res, ...options], [])
    ].map(({ id }) => id);

    const optionChildrenId = [...optionIds, ...(sameGroupIds || [])];
    const numberOfSelectedOption = optionChildrenId
      .map(
        (id) =>
          !!this.sharedAgencySettingsFormService.formData[id]?.get(id)?.value
      )
      .filter(Boolean).length;

    return (
      !!this.sharedAgencySettingsFormService.formData[optionId]?.get(optionId)
        ?.value && numberOfSelectedOption === 1
    );
  }

  handleUpdateOption(optionId: string, input, isSelected?: boolean) {
    delete input[optionId];
    const newOption = { ...input };
    const allOtherChangedOptions = this.optionChanges.value.filter(
      (option) => option.id !== optionId
    );

    allOtherChangedOptions.push({
      id: optionId,
      value: newOption,
      isSelected
    });
    this.optionChanges.value = allOtherChangedOptions;
  }
}
