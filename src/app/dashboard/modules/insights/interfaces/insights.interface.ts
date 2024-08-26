import {
  ETimeSavedAnnotation,
  ERangeDateType,
  EAccomplishments,
  ETrendType,
  EExportType,
  EEnquiriesType
} from '@/app/dashboard/modules/insights/enums/insights.enum';
import { Agent } from '@shared/types/agent.interface';

export interface IAccomplishments {
  dataType: EAccomplishments;
  percent: number;
  total: number;
  equivalent: number;
}

export interface ITransformedTopPerforming {
  rank: number;
  firstName?: string;
  googleAvatar?: string;
  lastName?: string;
  total?: number;
  userId?: string;
}

export interface ITopPerformings {
  [key: string]: IRankings[];
}

export interface IRankings {
  data: IRanking[];
  rank: number;
}

export interface IRanking {
  firstName?: string;
  googleAvatar?: string;
  lastName?: string;
  total?: number;
  userId?: string;
}

export interface IPieChartDataConfig {
  title: string;
  color: string;
  type: ETimeSavedAnnotation;
  hours: number;
  percent: number;
  count: number;
  [key: string]: string | number | boolean;
}

export interface ITimeSavedData {
  timeCollection: string | Date;
  totalTimeSaved: number;
  isUpTrend?: ETrendType;
  percent?: number;
  dateTooltip?: string;
}

export type IPieChartData = {
  value: number;
  hours: number;
  numbers: number;
};

export type IBreakDownTimeSavedData = {
  [key in ETimeSavedAnnotation]: IPieChartData;
};

export interface IInsightsFilter {
  rangeDateType: ERangeDateType;
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface IExtraAgent extends Agent {
  groupBy: string;
  fullName: string;
}

export interface ITaskCompletedData {
  [key: string]: IInsightTaskName[];
}

export interface IGetInsightsDataPayload {
  userId?: string;
  startDate?: string;
  endDate?: string;
  type?: ERangeDateType;
}

export interface IInsightsData {
  accomplishments: IAccomplishments[];
  chartData: {
    EFFICIENCY: IEfficiencyData[];
    TIME_SAVED: ITimeSavedData[];
    PIE_CHART: IBreakDownTimeSavedData;
  };
  settings: {
    CURRENT: ISettingConfig;
    DEFAULT: ISettingConfig;
  };
  topPerforming: ITopPerformings;
}

export interface IEfficiencyData {
  timeCollection: Date | string | number;
  propertyActive: number;
  teamMembers: number;
  propertyActivePerTeam: number;
  dateTooltip?: string;
  isUpTrend?: ETrendType;
  percent?: number;
  totalProperties: number;
}

export interface IInsightExportPayload {
  startDate: string;
  endDate: string;
  userId: string;
  isUrgent: boolean;
  taskNameIds?: string[];
  type: EExportType;
}

export interface IInsightExportResponse {
  url: string;
  name: string;
}

export interface IInsightTaskName {
  id: string;
  name: string;
  status?: string;
  label?: string;
  groupBy?: string;
}

export interface IInsightStackBarResponse {
  agencyId: string;
  completed: number;
  inprogress: number;
  timeCollection: string;
}

export interface IInsightEnquiry extends IInsightStackBarResponse {
  total?: number;
}

export interface IEEnquiriesTypeFilter {
  label: string;
  value: EEnquiriesType;
}

export interface IInsightEnquiryResponse {
  chartData: IInsightEnquiry;
  conversationTypeFilter: IEEnquiriesTypeFilter[];
}

export interface IInsightsEnquiryPayload extends IGetInsightsDataPayload {
  isUrgent: boolean;
  conversationType: EEnquiriesType;
}

export interface IInsightsTaskDataPayload extends IGetInsightsDataPayload {
  taskNameIds: string[];
}
interface ISettingValue {
  value: number;
  unit: string;
}

export interface ISettingConfig {
  EMAIL_TO_CUSTOMER: ISettingValue;
  PHONE_CALL: ISettingValue;
  TRANSLATE_EMAIL: ISettingValue;
  FULL_TIME_WORK: ISettingValue;
  PROPERTIES_NATIONAL: ISettingValue;
  AI_ASSISTANT: ISettingValue;
}

export interface IUserActivities {
  isUrgent?: boolean;
  taskNameIds?: string[];
}
