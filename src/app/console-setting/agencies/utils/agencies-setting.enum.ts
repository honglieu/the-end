export enum AgencyConsoleSettingPopupAction {
  CREATE = 'CREATE',
  EDIT = 'EDIT'
}

export enum SubscriptionStatus {
  canceled = 'canceled'
}

export enum EAddOn {
  TASK_EDITOR = 'Task editor',
  VOICE_MAIL = 'Voicemail',
  SMS = 'SMS',
  MOBILE_APP = 'Mobile app',
  SUGGESTED_REPLIES = 'Suggested replies',
  OUTGOING_CALLS = 'Outgoing calls & transcripts',
  LANGUAGE_TRANSLATIONS = 'Language translations',
  EMBEDDABLE_WIDGET = 'Embeddable widget',
  INSIGHTS = 'Insights',
  AI_SUMMARY = 'AI',
  AI_FEATURES = 'AI features',
  MESSENGER = 'Messenger',
  WHATSAPP = 'WhatsApp'
}

export const AddonTitle = {
  ...EAddOn,
  MOBILE_APP: 'Tenant app',
  EMBEDDABLE_WIDGET: 'Web widget'
};

export enum EAddOnType {
  TASK_EDITOR = 'TASK_EDITOR',
  VOICE_MAIL = 'VOICE_MAIL',
  MOBILE_APP = 'MOBILE_APP',
  SUGGESTED_REPLIES = 'SUGGESTED_REPLIES',
  OUTGOING_CALLS = 'OUTGOING_CALLS',
  LANGUAGE_TRANSLATIONS = 'LANGUAGE_TRANSLATIONS',
  EMBEDDABLE_WIDGET = 'EMBEDDABLE_WIDGET',
  INSIGHTS = 'INSIGHTS',
  MESSENGER = 'MESSENGER',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP'
}

export enum ECountryName {
  AUSTRALIA = 'AUSTRALIA',
  UNITED_STATES = 'UNITED_STATES'
}

export enum ECRMSystem {
  PROPERTY_TREE = 'PROPERTY_TREE',
  RENT_MANAGER = 'RENT_MANAGER'
}

export enum ECountry {
  AUSTRALIA = 'AUSTRALIA'
}

export enum EConsoleFilterTypes {
  CRM = 'CRM',
  FEATURES = 'Features'
}

export enum EConsoleFilterParams {
  CRM = 'crm',
  FEATURES = 'feartures'
}

export enum EAgencyPlan {
  STARTER = 'STARTER',
  PRO = 'PRO',
  ELITE = 'ELITE',
  CUSTOM = 'CUSTOM'
}

export enum EPopupPlanState {
  CONFIRM_POPUP = 'confirmPopup',
  REQUEST_POPUP = 'requestPopup',
  SUMMARY_PLAN_POPUP = 'summaryPlanPopup',
  CONFIRM_PLAN_POPUP = 'confirmPlanPopup'
}

export const PLAN_DEFAULT_ADDONS = {
  [EAgencyPlan.STARTER]: {
    suggestedReplies: true,
    taskEditor: false,
    voicemail: false,
    mobileApp: false,
    outgoingCalls: false,
    translation: false,
    insights: false,
    messenger: false,
    sms: false,
    whatsapp: false
  },
  [EAgencyPlan.PRO]: {
    suggestedReplies: true,
    taskEditor: true,
    voicemail: false,
    mobileApp: false,
    outgoingCalls: true,
    translation: true,
    insights: false,
    messenger: false,
    sms: false,
    whatsapp: false
  },
  [EAgencyPlan.ELITE]: {
    suggestedReplies: true,
    taskEditor: true,
    voicemail: true,
    mobileApp: true,
    outgoingCalls: true,
    translation: true,
    insights: true,
    messenger: false,
    sms: true,
    whatsapp: false
  },
  [EAgencyPlan.CUSTOM]: {
    suggestedReplies: false,
    taskEditor: false,
    voicemail: false,
    mobileApp: false,
    outgoingCalls: false,
    translation: false,
    insights: false,
    messenger: false,
    sms: false,
    whatsapp: false
  }
};

export const COUNTRY_NAMES_MAPPING = {
  Australia: ECountryName.AUSTRALIA,
  'United States': ECountryName.UNITED_STATES
};

export enum EEmergencyContactsSection {
  DEFAULT = 'default',
  CUSTOM = 'custom'
}
