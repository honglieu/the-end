import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { PermissionService } from '@services/permission.service';
import { EBadgeSetting } from '@/app/dashboard/modules/insights/enums/insights.enum';
import { IndividualConfig, ToastrService } from 'ngx-toastr';
import { InsightsApiService } from '@/app/dashboard/modules/insights/services/insights-api.service';
import { ISettingConfig } from '@/app/dashboard/modules/insights/interfaces/insights.interface';
import { InsightsService } from '@/app/dashboard/modules/insights/services/insights.service';
import { InsightsFormService } from '@/app/dashboard/modules/insights/services/insights-form.service';
import { Subject, takeUntil } from 'rxjs';
import { CountryService } from '@/app/dashboard/services/country.service';

interface IOptionSetting {
  questionSetting: string;
  badge?: string;
  unitOfMeasure: string;
}

@Component({
  selector: 'insights-setting',
  templateUrl: './insights-setting.component.html',
  styleUrls: ['./insights-setting.component.scss']
})
export class InsightsSettingComponent implements OnInit {
  private unsubscribe = new Subject<void>();
  @Input() isLoading = true;
  public isShowSettingModal: boolean = false;
  public insightSettingsFormGroup: FormGroup;
  public listFormControlNames: string[] = [];
  public isSubmitForm: boolean = false;
  public isDisableButton = false;
  public defaultBaselineSetting: ISettingConfig;
  public currentBaselineSetting: ISettingConfig;
  private toastConfigs: Partial<IndividualConfig> = { timeOut: 3000 };
  public OPTION_SETTING_LIST: IOptionSetting[] = [
    {
      questionSetting:
        'How long, on average, would it take a member of your team to write a message to a customer?',
      unitOfMeasure: 'minutes'
    },
    {
      questionSetting:
        'How long, on average, would it take a member of your team to listen to a recording of a phone call and make details notes for your records?',
      unitOfMeasure: 'minutes',
      badge: EBadgeSetting.PRO
    },
    {
      questionSetting:
        'How long, on average, would it take a member of your team to translate a message received in another language?',
      unitOfMeasure: 'minutes',
      badge: EBadgeSetting.PRO
    },
    {
      questionSetting:
        'How long, on average, would you save if an AI assistant could intercept each incoming message and answer customer questions?',
      unitOfMeasure: 'minutes'
    },
    {
      questionSetting: 'How many hours a day do your full-time employees work?',
      unitOfMeasure: 'hours'
    },
    {
      questionSetting:
        'How many properties, on average, would a full-time team member manage?',
      unitOfMeasure: 'properties'
    }
  ];
  constructor(
    private permissionService: PermissionService,
    private toastService: ToastrService,
    private insightsApiService: InsightsApiService,
    private insightsService: InsightsService,
    private insightsFormService: InsightsFormService,
    private countryService: CountryService
  ) {}

  ngOnInit(): void {
    this.countryService.currentInformationCountry$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentInforCountry) => {
        this.OPTION_SETTING_LIST = this.OPTION_SETTING_LIST.map((option) =>
          option.questionSetting.includes('properties')
            ? {
                ...option,
                questionSetting: `How many ${currentInforCountry.propertyTextByCountry},
          on average, would a full-time team member manage?`
              }
            : option
        );
      });
    this.insightSettingsFormGroup = this.insightsFormService.buildForm();
    this.listFormControlNames =
      this.insightsFormService.getListFormControlNames();
    this.insightsService.insightsData$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        const { CURRENT, DEFAULT } = data.settings;
        this.defaultBaselineSetting = DEFAULT;
        this.currentBaselineSetting = CURRENT;
        this.insightsFormService.handlePatchFormSetting(CURRENT);
        this.checkEditPermissions();
      });
  }

  checkEditPermissions() {
    if (
      !this.permissionService.isOwner &&
      !this.permissionService.isAdministrator
    ) {
      this.isDisableButton = true;
      this.insightSettingsFormGroup.disable();
    }
  }

  handleClickSettingButton() {
    this.isShowSettingModal = true;
  }

  handleCancelSettingModal() {
    this.isShowSettingModal = false;
    this.isSubmitForm = false;
    this.insightsFormService.handlePatchFormSetting(
      this.currentBaselineSetting
    );
  }

  handleSaveSettingModal() {
    this.isSubmitForm = true;
    this.insightSettingsFormGroup.markAllAsTouched();
    if (this.insightSettingsFormGroup.valid) {
      this.isShowSettingModal = false;
      this.isSubmitForm = false;
      this.handlePatchExactNumberData();
      const currentSettingData: ISettingConfig =
        this.insightsFormService.generateInsightSettingPayload();
      this.insightsApiService
        .saveInsightSettings(currentSettingData)
        .subscribe({
          next: () => {
            this.toastService.success('Changes saved', '', this.toastConfigs);
            this.insightsService.setRefreshInsightsData();
          },
          error: () => {
            this.toastService.error('Changes failed', '', this.toastConfigs);
          }
        });
    }
  }

  handlePatchExactNumberData() {
    Object.values(this.insightSettingsFormGroup.controls).forEach(
      (formControl) => {
        formControl.patchValue(+formControl.value + '');
      }
    );
  }

  handleRevertToDefaultBaseline() {
    this.insightsFormService.handlePatchFormSetting(
      this.defaultBaselineSetting
    );
  }

  ngOnDestroy() {
    this.toastService.clear();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
