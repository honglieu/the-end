import { CompanyConsoleSettingService } from '@/app/console-setting/agencies/services/company-console-setting.service';
import { CompanyFormService } from '@/app/console-setting/agencies/services/company-form.service';
import {
  AddonTitle,
  AgencyConsoleSettingPopupAction,
  EAgencyPlan,
  PLAN_DEFAULT_ADDONS
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService as AgencyServiceDashboard } from '@/app/dashboard/services/agency.service';
import { Component, OnInit } from '@angular/core';
import {
  AgencyAddon,
  AgencyConsoleSetting
} from '@shared/types/agency.interface';
import { Subject, takeUntil } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'select-company-plan',
  templateUrl: './select-company-plan.component.html',
  styleUrls: ['./select-company-plan.component.scss']
})
export class SelectCompanyPlanComponent implements OnInit {
  private unsubscribe = new Subject<void>();
  public readonly EAgencyPlan = EAgencyPlan;

  public action: AgencyConsoleSettingPopupAction;
  public agencyData: AgencyConsoleSetting;

  public addOnsList: AgencyAddon[] = [
    {
      title: AddonTitle.AI_FEATURES,
      controlName: 'suggestedReplies'
    },
    {
      title: AddonTitle.TASK_EDITOR,
      controlName: 'taskEditor'
    },
    {
      title: AddonTitle.VOICE_MAIL,
      controlName: 'voicemail'
    },
    {
      title: AddonTitle.SMS,
      controlName: 'sms'
    },
    {
      title: AddonTitle.MOBILE_APP,
      controlName: 'mobileApp'
    },
    {
      title: AddonTitle.MESSENGER,
      controlName: 'messenger'
    },
    {
      title: AddonTitle.WHATSAPP,
      controlName: 'whatsapp'
    },
    {
      title: AddonTitle.OUTGOING_CALLS,
      controlName: 'outgoingCalls'
    },
    {
      title: AddonTitle.LANGUAGE_TRANSLATIONS,
      controlName: 'translation'
    },
    {
      title: AddonTitle.INSIGHTS,
      controlName: 'insights'
    },
    {
      title: AddonTitle.EMBEDDABLE_WIDGET,
      controlName: 'embeddable',
      comingSoon: true
    }
  ];

  public planList = [
    {
      value: EAgencyPlan.STARTER,
      label: 'Starter'
    },
    {
      value: EAgencyPlan.PRO,
      label: 'Pro'
    },
    {
      value: EAgencyPlan.ELITE,
      label: 'Elite'
    },
    {
      value: EAgencyPlan.CUSTOM,
      label: 'Custom'
    }
  ];

  constructor(
    private companyFormService: CompanyFormService,
    private agencyConsoleSettingService: CompanyConsoleSettingService,
    private agencyServiceDashboard: AgencyServiceDashboard
  ) {}

  get agencyFormGroup() {
    return this.companyFormService.companyForm;
  }

  get plan() {
    return this.agencyFormGroup?.get('plan');
  }

  get voicemail() {
    return this.agencyFormGroup?.get('voicemail');
  }

  get voiceMailPhoneNumber() {
    return this.agencyFormGroup?.get('voiceMailPhoneNumber');
  }

  get customPlanSMS() {
    return this.agencyFormGroup?.get('sms');
  }

  ngOnInit(): void {
    this.agencyConsoleSettingService.newEditModalData$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((newEditData) => {
        const { action, data } = newEditData || {};
        this.action = action || null;
        this.agencyData = data || null;
      });
    this.handlePlanFieldLogic();

    this.voiceMailPhoneNumber.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        const disabled = !value;

        this.voicemail[disabled ? 'disable' : 'enable']();
        this.customPlanSMS[disabled ? 'disable' : 'enable']();

        if (disabled) {
          this.voicemail.setValue(false);
          this.customPlanSMS.setValue(false);
        }
      });
  }

  handlePlanFieldLogic() {
    this.plan.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((value) => {
        let mapValue = {
          ...(this.agencyFormGroup.value || null),
          name: this.agencyFormGroup.value?.agencyName,
          id: this.agencyFormGroup.value?.agency,
          customer: {
            id: this.agencyFormGroup.value?.customer
          },
          ...(PLAN_DEFAULT_ADDONS[value] || null),
          configPlans: {
            plan: value
          },
          voiceMailPhoneNumber: this.agencyData?.voiceMailPhoneNumber
        };
        this.companyFormService.patchValueCompanyForm(mapValue, value);
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
