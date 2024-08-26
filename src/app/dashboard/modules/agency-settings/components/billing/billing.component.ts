import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '@services/loading.service';
import { Subject, filter, forkJoin, takeUntil, tap } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { BillingService } from '@/app/dashboard/services/billing.service';
import { PermissionService } from '@services/permission.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import dayjs from 'dayjs';
import { billingAmountFormat } from '@/app/dashboard/modules/agency-settings/utils/functions';
import {
  IBillingInvoice,
  IBillings,
  ISummaryData,
  ITrialBilling
} from '@/app/dashboard/modules/agency-settings/utils/billing.interface';
import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import {
  EAddOnType,
  EAgencyPlan
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { isEqual } from 'lodash-es';
import { ECountry, ETaxType } from '@shared/enum/region.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

enum EPopupState {
  CONFIRM_POPUP = 'confirmPopup',
  REQUEST_POPUP = 'requestPopup',
  SUMMARY_PLAN_POPUP = 'summaryPlanPopup',
  CONFIRM_PLAN_POPUP = 'confirmPlanPopup'
}

@Component({
  selector: 'billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  providers: [LoadingService]
})
@DestroyDecorator
export class BillingComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();
  private customerPortalLogin: string;
  public popupModalPosition = ModalPopupPosition;
  public isDisabledCancel: boolean = true;
  public isDisabledLogin: boolean = true;
  public isDisabledEmail: boolean = true;
  emailForm: FormGroup;
  private previousEmail: string;
  public popupState: EPopupState;
  public EPopupState = EPopupState;
  public showInvoiceHistory = false;
  public isShowMoreInvoiceHistory = true;
  public isShowMoreBillingInvoice = true;
  public BILLING_ROW_LIMIT = 12;
  public invoiceHistoryList: IBillingInvoice[] = [];
  public currentMonthBillingList: ISummaryData[] = [];
  public nextMonthBillingList: ISummaryData[] = [];
  public dataSetupFee: ISummaryData[] = [];
  public billingData: IBillings;
  public currentBillingPropertyCount = 0;
  public nextMonthBillingPropertyCount = 0;
  public configPlans: ConfigPlan;
  public trialBilling: ITrialBilling;
  public trialDays = 0;
  public remainDays = 0;
  public readonly COUNTRY = ECountry;
  public readonly TAX_TYPE = ETaxType;
  public readonly PLAN_DATA = {
    [EAgencyPlan.PRO]: {
      title: 'Pro plan',
      img: '/assets/images/crown-filled.png'
    },
    [EAgencyPlan.ELITE]: {
      title: 'Elite plan',
      img: '/assets/icon/diamond.svg'
    },
    [EAgencyPlan.STARTER]: {
      title: 'Starter plan',
      img: null
    },
    [EAgencyPlan.CUSTOM]: {
      title: 'Custom plan',
      img: null
    }
  };
  public planModifyingText: string = '';

  get email() {
    return this.emailForm?.get('email');
  }

  setEmail(email: string) {
    this.email?.setValue(email);
  }

  constructor(
    private formBuilder: FormBuilder,
    private readonly agencyDashboardService: AgencyService,
    private permissionService: PermissionService,
    private toastService: ToastrService,
    private billingService: BillingService,
    public loadingService: LoadingService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {
    this.loadingService.onLoading();
    this.getRetrieveBillingInfo(),
      (this.emailForm = this.formBuilder.group({
        email: ['', [Validators.email]]
      }));
    this.checkPermission();
    this.getCurrentPlan();

    this.getBillingInvoices();
    this.agencyDashboardService.currentPlan$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((configPlan) => {
        if (!configPlan) return;
        this.configPlans = configPlan;
      });
  }

  resetPopupState() {
    this.popupState = null;
  }

  resetInvoiceHistoryList() {
    this.invoiceHistoryList = [...this.invoiceHistoryList].map((value) => ({
      ...value,
      expanded: false
    }));
  }

  openStripeLogin(): void {
    if (this.customerPortalLogin) {
      window.open(this.customerPortalLogin, '_blank');
    }
  }

  onSubmit() {
    const email = this.emailForm.get('email').value;
    if (this.emailForm.valid && email && email !== this.previousEmail) {
      this.billingService
        .editBillingEmail(email)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          this.toastService.success('Billing email updated');
          this.previousEmail = email;
        });
    }
    if (!email) {
      this.setEmail(this.previousEmail);
    }
  }

  onCancelAccount() {
    this.popupState = EPopupState.REQUEST_POPUP;
    this.billingService
      .cancelAccount()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe();
  }

  handlePopupRequest() {
    this.isDisabledCancel = true;
    this.resetPopupState();
  }

  getBillingInvoices() {
    forkJoin([this.getBillings(), this.getInvoices()])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          const [billings, invoices] = res || [];

          // handle billing list
          if (billings && invoices) {
            const billingDate = {
              end: billings?.period_end,
              start: billings?.period_start
            };
            let findInvoice: ISummaryData;
            invoices?.forEach((invoice) => {
              const matchedInvoice = invoice?.summaryData.find(
                (it) => isEqual(it?.period, billingDate) && !it?.oneTime
              );
              if (matchedInvoice) findInvoice = matchedInvoice;
            });
            this.currentBillingPropertyCount =
              findInvoice?.quantity ||
              invoices?.[0]?.summaryData?.[0]?.quantity ||
              0;
            this.nextMonthBillingPropertyCount =
              billings?.summaryData?.filter(
                (value) => value?.dataOnNextMonth
              )?.[0]?.quantity || 0;
          }

          this.loadingService.stopLoading();
        },
        error: () => {
          this.loadingService.stopLoading();
        }
      });
  }

  getCurrentPlan() {
    this.agencyDashboardService.synchronizePlan().subscribe((res) => {
      if (!res) return;
      this.agencyDashboardService.setCurrentPlan(res);
      this.setIsVoicemailEnabled(res);
    });
  }

  setIsVoicemailEnabled(configPlan: ConfigPlan) {
    const isVoicemailEnabled =
      configPlan.plan === EAgencyPlan.ELITE ||
      (configPlan.plan === EAgencyPlan.CUSTOM &&
        configPlan.features[EAddOnType.VOICE_MAIL].state);
    localStorage.setItem('isVoicemailEnabled', String(isVoicemailEnabled));
  }

  getBillings() {
    return this.billingService.getBillingsSubscription().pipe(
      tap((res) => {
        const { summaryData } = res || {};
        const utcOffsetInMinutes = new Date().getTimezoneOffset();
        const trialStart = res?.trial?.trial_start
          ? dayjs
              .unix(+res?.trial?.trial_start)
              .add(utcOffsetInMinutes, 'minute')
          : '';
        const trialEnd = res?.trial?.trial_end
          ? dayjs.unix(+res?.trial?.trial_end).add(utcOffsetInMinutes, 'minute')
          : '';
        this.trialBilling = {
          trial_start: trialStart?.toString(),
          trial_end: trialEnd?.toString()
        };
        this.remainDays = trialEnd
          ? trialEnd.diff(
              this.agencyDateFormatService.initTimezoneToday().nativeDate,
              'day'
            ) + 1
          : 0;
        this.trialDays = trialEnd ? trialEnd.diff(trialStart, 'day') : 0;
        const billingList = summaryData.map((value) => ({
          ...value,
          amount: billingAmountFormat(value.amount),
          coupon:
            value?.coupon?.map((e) => ({
              ...e,
              value: billingAmountFormat(e?.value || 0)
            })) || [],
          period: {
            end: !!value.period.end
              ? dayjs.unix(value.period.end as number).toString()
              : null,
            start: !!value.period.start
              ? dayjs.unix(value.period.start as number).toString()
              : null
          }
        })) as ISummaryData[];
        this.billingData = {
          ...res,
          period_start: dayjs.unix(res?.period_start as number).toString(),
          period_end: dayjs.unix(res?.period_end as number).toString(),
          total: billingAmountFormat(res?.total),
          tax: billingAmountFormat(res?.tax)
        };
        if (!!this.billingData?.coupon) {
          this.billingData.coupon.value = billingAmountFormat(
            this.billingData.coupon.value
          );
        }
        this.currentMonthBillingList = billingList.filter(
          (value) => !value?.dataOnNextMonth && !value?.oneTime
        );
        this.nextMonthBillingList = billingList.filter(
          (value) => value?.dataOnNextMonth
        );
        this.dataSetupFee = billingList.filter((value) => !!value?.oneTime);
      })
    );
  }

  getInvoices() {
    return this.billingService.getBillingInvoices().pipe(
      tap((res) => {
        if (!res) return;
        this.invoiceHistoryList = res.map((value) => {
          const invoice = {
            ...value,
            created: dayjs.unix(value?.created as number).toString(),
            tax: billingAmountFormat(value?.tax),
            total: billingAmountFormat(value?.total),
            expanded: false
          };
          if (!!invoice?.coupon) {
            invoice.coupon.value = billingAmountFormat(invoice?.coupon?.value);
          }
          return invoice;
        });
      })
    );
  }

  getRetrieveBillingInfo() {
    this.billingService
      .getRetrieveBillingInfo()
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((res) => {
        this.customerPortalLogin = res.customerPortalLogin;
        this.setEmail(res.email);
        this.previousEmail = res.email;
      });
  }

  handleInvoiceDropdown(index: number) {
    this.invoiceHistoryList = this.invoiceHistoryList?.map((value, idx) => {
      return {
        ...value,
        expanded: idx === index ? !value?.expanded : false
      };
    });
  }

  checkPermission() {
    const hasPermission = this.permissionService.hasFunction(
      'BILLING.BILLING.EDIT'
    );
    this.isDisabledLogin = !hasPermission;
    this.isDisabledEmail = !hasPermission;
    this.isDisabledCancel = !hasPermission;

    !hasPermission && this.email.disable();
  }

  handleChangePlan(requestedPlan: ConfigPlan) {
    const planIndex = Object.values(EAgencyPlan);
    this.planModifyingText =
      this.configPlans.plan === EAgencyPlan.CUSTOM ||
      planIndex.indexOf(requestedPlan.requestPlan) >
        planIndex.indexOf(this.configPlans.plan)
        ? 'upgrade'
        : 'downgrade';
    this.popupState = EPopupState.CONFIRM_PLAN_POPUP;
  }

  handleShowPacks() {
    this.popupState = EPopupState.SUMMARY_PLAN_POPUP;
  }

  isFirstMonth(item, index) {
    return (
      index === this.invoiceHistoryList.length - 1 &&
      item?.summaryData?.every(
        (it) =>
          new Date(it.period.start * 1000).getTime() >=
          new Date(item.created).getTime()
      )
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
