import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import dayjs from 'dayjs';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import {
  EAddOnType,
  EAgencyPlan
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { BillingService } from '@/app/dashboard/services/billing.service';
import {
  ELITE_LIST,
  FEATURE_LIST,
  PRO_LIST,
  STATER_LIST,
  TIME_FORMAT
} from '@services/constants';
import { ElectronService } from '@services/electron.service';

@Component({
  selector: 'plans-summary-pop-up',
  templateUrl: './plans-summary-pop-up.component.html',
  styleUrls: ['./plans-summary-pop-up.component.scss']
})
export class PlansSummaryPopUpComponent implements OnInit, OnChanges {
  @Input() isShowModal = false;
  @Input() currentPlan: EAgencyPlan;
  @Output() changePlan = new EventEmitter<ConfigPlan>();
  @Output() onQuit: EventEmitter<void> = new EventEmitter();
  private destroy$ = new Subject<void>();
  public readonly EAgencyPlan = EAgencyPlan;
  public readonly listFeatures = FEATURE_LIST;
  private currentAgencyId: string;
  public isLoading: boolean = false;
  public planSummaryData = [
    {
      plan: EAgencyPlan.STARTER,
      title: 'Starter',
      buttonText: 'Upgrade to Starter',
      image: null,
      checkListFeatures: STATER_LIST
    },
    {
      plan: EAgencyPlan.PRO,
      title: 'Pro',
      buttonText: 'Upgrade to Pro',
      image: '/assets/images/crown-filled.png',
      checkListFeatures: PRO_LIST
    },
    {
      plan: EAgencyPlan.ELITE,
      title: 'Elite',
      buttonText: 'Upgrade to Elite',
      image: '/assets/icon/diamond.svg',
      checkListFeatures: ELITE_LIST
    }
  ];
  constructor(
    private toastrService: ToastrService,
    private agencyService: AgencyService,
    private billingService: BillingService,
    private electronService: ElectronService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentPlan']?.currentValue) {
      let prefixButtonText =
        this.currentPlan === EAgencyPlan.CUSTOM
          ? 'Switch to '
          : 'Downgrade to ';
      this.planSummaryData = this.planSummaryData.map((planSummary) => {
        let buttonText = prefixButtonText + planSummary.title;
        if (planSummary.plan === this.currentPlan) {
          prefixButtonText = 'Upgrade to ';
          buttonText = 'Your current plan';
        }
        return {
          ...planSummary,
          buttonText
        };
      });
    }
  }

  handleChangePlan(plan: EAgencyPlan) {
    this.isLoading = true;
    const isCurrentPlanCustom = this.currentPlan === EAgencyPlan.CUSTOM;
    const currentPlanIndex = this.planSummaryData.findIndex(
      (planSummary) => planSummary.plan === this.currentPlan
    );
    const targetPlanIndex = this.planSummaryData.findIndex(
      (planSummary) => planSummary.plan === plan
    );
    const isUpgrade = isCurrentPlanCustom || targetPlanIndex > currentPlanIndex;

    this.billingService
      .requestPlan({
        plan,
        isUpgrade,
        time: dayjs().format(TIME_FORMAT),
        date: dayjs().format(
          this.agencyDateFormatService.dateFormat$.value?.DATE_FORMAT_DAYJS
        ),
        isDesktopApp: this.electronService.isElectronApp
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.agencyService.setCurrentPlan(res);
            this.setIsVoicemailEnabled(res);
          }
          this.isLoading = false;
          this.changePlan.emit(res);
        },
        error: (error) => {
          this.isLoading = false;
          this.toastrService.error(error?.error?.message || error?.message);
        }
      });
  }

  setIsVoicemailEnabled(configPlan: ConfigPlan) {
    const isVoicemailEnabled =
      configPlan.plan === EAgencyPlan.ELITE ||
      (configPlan.plan === EAgencyPlan.CUSTOM &&
        configPlan.features[EAddOnType.VOICE_MAIL].state);
    localStorage.setItem('isVoicemailEnabled', String(isVoicemailEnabled));
  }

  handleClose() {
    // just emit when click X button
    this.onQuit.emit();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
