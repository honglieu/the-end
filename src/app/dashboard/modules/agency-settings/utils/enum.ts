import { IFile } from '@shared/types/file.interface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ElementRef } from '@angular/core';
import { UserTypeEnum } from '@/app/shared/enum/user.enum';

export enum ECustomiseVoicemailOption {
  ALWAYS = 'ALWAYS',
  OUTSIDE_OFFICE_HOURS = 'OUTSIDE_OFFICE_HOURS',
  CUSTOM_TIME = 'CUSTOM_TIME',
  OFF = 'OFF'
}

export enum EAgencySettingsTabTitle {
  VOICEMAIL = 'Voicemail',
  BILLING = 'Billing',
  OUTGOING_EMAILS = 'Outgoing emails',
  SMS = 'SMS',
  MOBILE_APP = 'Trudi® Mobile App'
}

export interface IVoicemailCustomiseOptionProps {
  label: string;
  value: string;
  template?: ElementRef;
}

export interface IVoicemailCustomHoursData {
  startTime: string;
  endTime: string;
}

export interface IVoicemailSetting {
  id: string;
  redirectNumber: string;
  customizeValue: ICustomiseValue;
  customizeType: ECustomiseVoicemailOption;
  company: IVoicemailCompany;
}

export interface ICustomiseValue {
  [key: string]: { [key: string]: IVoicemailCustomHoursData }[];
}

export interface IVoicemailCompany {
  id: string;
  areaCode: string;
  voiceMailPhoneNumber: string;
  voicemail: boolean;
}

export interface IVoicemailAgencySetting {
  areaCode: string;
  voiceMailPhoneNumber: string;
  voicemail: boolean;
}

export interface IUpdateVoicemailSettingBody {
  idVoicemailSetting: string;
  customizeValue?: ICustomiseValue;
  customizeType?: ECustomiseVoicemailOption;
  redirectNumber?: string;
}

export interface IPolicyDetectedRequest {
  companyId: string;
  propertyId?: string;
  messsagesContent: string;
}

export interface IPolicyDetectedResponse {
  newPolicyDetected: string;
  type: string;
  policyType: string;
  reusableSentenceToBeStored: string;
  policyTitle: string;
  threeApplicableQuestions: string[];
}

export interface IAiReplyPolicy {
  id?: string;
  name?: string;
  companyId?: string;
  policyQuestions?: IPolicyQuestios[];
  answer?: string;
  createdAt?: Date;
  updatedAt?: Date;
  enable?: boolean;
  selected?: boolean;
  answerId?: string;
  questionId?: string;
  question?: string;
  rawMessage?: string;
  rawAnswer?: string;
  rawQuestion?: string;
}

export interface IPolicyParam {
  search: string;
  columnName: string;
  sortOrder: string;
}

export interface IPolicyQuestios {
  id?: string;
  question?: string;
  defaultReplyId?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface IPolicyOrderBy {
  column: string;
  order: string;
}

export interface IPayloadGetPolicy {
  orderBy?: IPolicyOrderBy;
  search?: string;
  lastValue?: string;
  limit?: number;
}

export interface IPolicyCustoms {
  id?: string;
  name?: string;
  reply?: string;
  additionalData: IAdditionalPolicy;
  properties: IPropertyOrTagPolicy[];
  tags: IPropertyOrTagPolicy[];
  isSelected?: boolean;
  updatedAt?: string;
  createdAt?: string;
}

export interface IPropertyOrTagPolicy {
  id: string;
  streetline?: string;
  name?: string;
}

export interface IAddPolicyPayload {
  name?: string;
  defaultReply?: string;
  additionalData: IAdditionalPolicy;
  questions: IQuestionPolicy[];
  policyCustoms?: IPolicyCustoms[];
}

export interface IEditPolicyPayload {
  policyId?: string;
  name?: string;
  defaultReply?: string;
  additionalData: IAdditionalPolicy;
  questions: IQuestionPolicy[];
  policyCustoms?: IPolicyCustoms[];
}

export interface IQuestionPolicy {
  id?: string;
  question?: string;
  existName?: boolean;
  similarPolicies?: ISimilarPolicies[];
  isAddNewQuestion?: boolean;
  isInvalidSimilarPolicies?: boolean;
}

export interface ISimilarPolicies {
  id: string;
  name: string;
}

export interface IAdditionalPolicy {
  uploadFile: IFile[];
  contactCard: ISelectedReceivers[];
}

export interface IPolicyDetail {
  id?: string;
  name: string;
  additionalData?: IAdditionalPolicy;
  defaultReply: string;
  policyQuestions: IQuestionPolicy[];
  updatedAt?: string;
  lastUpdatedBy?: IUserUpdated;
  isSelected?: boolean;
  policyCustoms?: IPolicyCustoms[];
  isSuccess?: boolean;
}

export interface IUserUpdated {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type?: UserTypeEnum;
  isConsoleUpdate?: boolean;
}

export enum ETypeInput {
  TEXT_DEFAULT = 'text',
  INPUT_NUMBER = 'input-number',
  INPUT_SELECTED = 'input-selected',
  INPUT_TEXTAREA = 'input-textarea',
  INPUT_TEXT = 'input-text'
}

export enum EUploadAgencyStep {
  VIEW = 1,
  UPLOAD = 2,
  REMOVE = 3
}
