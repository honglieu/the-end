import { EWidgetSectionType } from '@shared/enum';
import { DynamicParameterType } from '@/app/trudi-send-msg/utils/dynamic-parameter';

export const BASE_PARAMETER_WIDGET = {
  [DynamicParameterType.TENANCY]: false,
  [DynamicParameterType.CALENDAR_EVENT_BREACH_REMEDY_DATE]: false,
  [DynamicParameterType.CALENDAR_EVENT_ENTRY_NOTICE]: false,
  [DynamicParameterType.CALENDAR_EVENT_CUSTOM]: false
};

export const PT_PARAMETER_WIDGET = {
  ...BASE_PARAMETER_WIDGET,
  [DynamicParameterType.PT_NOTE]: false,
  [DynamicParameterType.PT_CREDITOR_INVOICE]: false,
  [DynamicParameterType.PT_TENANCY_INVOICE]: false,
  [DynamicParameterType.PT_MAINTENANCE_INVOICE]: false,
  [DynamicParameterType.PT_ROUTINE_INSPECTION]: false,
  [DynamicParameterType.PT_OUTGOING_INSPECTION]: false,
  [DynamicParameterType.PT_INGOING_INSPECTION]: false,
  [DynamicParameterType.PT_COMPLIANCE]: false
};

export const RM_PARAMETER_WIDGET = {
  ...BASE_PARAMETER_WIDGET,
  [DynamicParameterType.RM_ISSUES]: false,
  [DynamicParameterType.RM_NOTES]: false,
  [DynamicParameterType.RM_INSPECTION]: false,
  [DynamicParameterType.RM_NEW_TENANT]: false
};

export const WIDGET_DESCRIPTION = {
  NO_LINKED_COMPONENTS: 'No linked components',
  NO_EVENTS: 'No events to display',
  NO_PROPERTY_TASK: {
    [EWidgetSectionType.PROPERTY_TREE]:
      'To sync information to Property Tree, please assign a property to this task.',
    [EWidgetSectionType.RENT_MANAGER]:
      'To sync information to Rent Manager, please assign a property to this task.',
    [EWidgetSectionType.CALENDAR]:
      'To sync with calendar events, please assign a property to this task.'
  }
};
