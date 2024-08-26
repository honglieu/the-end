import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { IOptionConfig } from '@/app/dashboard/modules/agency-settings/components/policies/utils/polices-interface';
import { SharedAgencySettingsService } from '@/app/dashboard/modules/agency-settings/components/shared/shared-agency-settings.service';

@Component({
  selector: 'radio-polices',
  templateUrl: './radio-polices.component.html',
  styleUrls: ['./radio-polices.component.scss']
})
export class RadioPolicesComponent implements OnInit, OnDestroy {
  @Input() option: IOptionConfig[];
  @Input() controlName: string;
  @Input() disabled: boolean = false;
  public oldSelectedId: string;
  public listCurrentOptions = [];
  public optionsSelected;
  private destroy$: Subject<void> = new Subject<void>();
  constructor(
    private sharedAgencySettingsService: SharedAgencySettingsService
  ) {}

  ngOnInit(): void {
    this.setFormData();
  }

  setFormData() {
    this.sharedAgencySettingsService.currentResponseCheckbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          for (const key in res) {
            const element = res[key];
            const matchedOption = this.option.find(
              (option) => option.value === element?.optionId
            );
            if (matchedOption) {
              this.optionsSelected = matchedOption;
              this.oldSelectedId = matchedOption.value;
              this.controlName = matchedOption.value;
            }
          }
        }
      });
  }

  handleModelChange(event) {
    this.sharedAgencySettingsService.handleUpdateOption(
      this.oldSelectedId,
      {
        [this.oldSelectedId]: false
      },
      false
    );
    this.sharedAgencySettingsService.handleUpdateOption(
      event,
      { [event]: true },
      true
    );
    this.oldSelectedId = event;
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
