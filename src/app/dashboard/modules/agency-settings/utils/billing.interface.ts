import { EAgencyPlan } from '@/app/console-setting/agencies/utils/agencies-setting.enum';

export interface IBillingPlan {
  id: string;
  object: string;
  billing_thresholds: string;
  created: number;
  metadata: {};
  plan: {
    id: string;
    object: string;
    active: boolean;
    aggregate_usage: null;
    amount: number;
    amount_decimal: number;
    billing_scheme: string;
    created: number;
    currency: string;
    interval: string;
    interval_count: number;
    livemode: boolean;
    metadata: null;
    nickname: null;
    product: string;
    tiers_mode: null;
    transform_usage: null;
    trial_period_days: null;
    usage_type: string;
  };
  price: {
    id: string;
    object: string;
    active: boolean;
    billing_scheme: string;
    created: number;
    currency: string;
    custom_unit_amount: null;
    livemode: boolean;
    lookup_key: null;
    metadata: {};
    nickname: null;
    product: string;
    recurring: {
      aggregate_usage: null;
      interval: string;
      interval_count: number;
      trial_period_days: null;
      usage_type: string;
    };
    tax_behavior: string;
    tiers_mode: null;
    transform_quantity: null;
    type: string;
    unit_amount: number;
    unit_amount_decimal: number;
  };
  quantity: number;
  subscription: string;
  tax_rates: [];
}

export interface IBillingInvoice {
  created: number | string;
  amount_due: number;
  total: number;
  totalExcludingTax: number;
  totalTaxAmounts: number;
  subtotal: number;
  account_country: string;
  invoice_pdf: string;
  status: string;
  status_transitions: {
    finalized_at: number;
    marked_uncollectible_at: null;
    paid_at: number;
    voided_at: null;
  };
  summaryData: ISummaryData[];
  tax: number;
  expanded?: boolean;
  taxSettings: ITaxSettings;
  fee: IBillingFee;
  coupon: ICoupon;
  isNextMonthAfterTrail?: boolean;
  trial: ITrialBilling;
}

export interface IBillings {
  propertyCount: number;
  amount_due: number;
  total: number;
  subtotal: number;
  account_country: string;
  period_end: number | string;
  period_start: number | string;
  summaryData: ISummaryData[];
  tax: number;
  totalExcludingTax: number;
  totalTaxAmounts: number;
  taxSettings: ITaxSettings;
  fee: IBillingFee;
  coupon: ICoupon;
  trial: ITrialBilling;
}

export interface ITrialBilling {
  trial_end: string;
  trial_start: string;
}

export interface ICoupon {
  name: string;
  unit: string;
  value: number;
  duration: string;
  percent: string;
}

export interface IBillingFee {
  amount: number;
  fee: string;
  total: string;
}

export interface ITaxSettings {
  [country: string]: {
    object: string;
    country: string;
    displayName: string;
    effectivePercentage: number;
    jurisdiction: string;
    stateDisplay: string;
    taxType: string;
  };
}

export interface ISummaryData {
  amount: number;
  quantity: number;
  dataOnNextMonth: boolean;
  oneTime: boolean;
  description: string;
  period: {
    end: number | string;
    start: number | string;
  };
  coupon: {
    duration: string | null;
    id: string | null;
    name: string | null;
    percent: number | null;
    unit: string | null;
    value: number | null;
  }[];
}

export interface IRequestPlan {
  isUpgrade: boolean;
  plan: EAgencyPlan;
  date: string;
  time: string;
  isDesktopApp: boolean;
}
