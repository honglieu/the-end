import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { EPropertyTreeType } from '@/app/task-detail/utils/functions';
import {
  ECalendarEvent,
  EEventTypes
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  FrequencyRental,
  LeasePeriodType
} from '@shared/types/trudi.interface';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';

export const SYNC_STATUS = {
  INPROGRESS: 'INPROGRESS',
  FAILED: 'FAILED',
  COMPLETED: 'COMPLETED',
  UNSYNC: 'UNSYNC',
  NOTSYNC: ''
};

export const mapActionComponent = {
  [EButtonAction.PT_NEW_COMPONENT]: {
    [EPropertyTreeButtonComponent.NOTE]: 'CREATE_NOTES',
    [EPropertyTreeButtonComponent.COMPLIANCE]: 'CREATE_COMPLIANCE'
  },
  [EButtonAction.PT_UPDATE_COMPONENT]: {
    [EPropertyTreeButtonComponent.NOTE]: 'UPDATE_NOTES',
    [EPropertyTreeButtonComponent.COMPLIANCE]: 'UPDATE_COMPLIANCE'
  }
};

export const mapComponentToPTState = {
  [EPropertyTreeButtonComponent.NOTE]: PTWidgetDataField.NOTES,
  [EPropertyTreeType.UPDATE_NOTES]: PTWidgetDataField.NOTES,
  [EPropertyTreeButtonComponent.CREDITOR_INVOICE]:
    PTWidgetDataField.CREDITOR_INVOICES,
  [EPropertyTreeButtonComponent.TENANCY_INVOICE]:
    PTWidgetDataField.TENANCY_INVOICES,
  [EPropertyTreeButtonComponent.MAINTENANCE_REQUEST]:
    PTWidgetDataField.MAINTENANCE_REQUEST,
  [EPropertyTreeButtonComponent.MAINTENANCE_INVOICE]:
    PTWidgetDataField.MAINTENANCE_INVOICE,
  [EPropertyTreeButtonComponent.ROUTINE_INSPECTION]:
    PTWidgetDataField.ROUTINE_INSPECTION,
  [EPropertyTreeButtonComponent.OUTGOING_INSPECTION]:
    PTWidgetDataField.OUTGOING_INSPECTION,
  [EPropertyTreeButtonComponent.INGOING_INSPECTION]:
    PTWidgetDataField.INGOING_INSPECTION,
  [EPropertyTreeButtonComponent.LEASE_RENEWAL]: PTWidgetDataField.LEASE_RENEWAL,
  [EPropertyTreeButtonComponent.VACATE_DETAIL]:
    PTWidgetDataField.TENANT_VACATES,
  [EPropertyTreeButtonComponent.NEW_TENANCY]: PTWidgetDataField.LEASING,
  [EPropertyTreeButtonComponent.COMPLIANCE]: PTWidgetDataField.COMPLIANCES,
  [EPropertyTreeType.UPDATE_COMPLIANCE]: PTWidgetDataField.COMPLIANCES,
  [ERentManagerType.ISSUE]: RMWidgetDataField.RM_ISSUES,
  [ERentManagerType.INSPECTION]: RMWidgetDataField.RM_INSPECTIONS,
  [ERentManagerType.NOTES]: RMWidgetDataField.RM_NOTES,
  [ERentManagerType.NEW_TENANT]: RMWidgetDataField.NEW_TENANT
};
export const leasePeriodTypeData = [
  {
    label: 'Weeks',
    value: LeasePeriodType.Weeks
  },
  {
    label: 'Months',
    value: LeasePeriodType.Months
  },
  {
    label: 'Years',
    value: LeasePeriodType.Years
  }
];
export const rentedAtData = [
  {
    label: 'Increase rent to',
    value: 'increase rent to'
  },
  {
    label: 'Decrease rent to',
    value: 'decrease rent to'
  },
  {
    label: 'Maintain rent at',
    value: 'maintain rent at'
  }
];

export const frequencyData = [
  {
    label: 'Per day',
    value: FrequencyRental.DAILY
  },
  {
    label: 'Per week',
    value: FrequencyRental.WEEKLY
  },
  {
    label: 'Per fortnight',
    value: FrequencyRental.FORTNIGHT
  },
  {
    label: 'Per month',
    value: FrequencyRental.MONTHLY
  },
  {
    label: 'Per quarter',
    value: FrequencyRental.QUARTERLY
  },
  {
    label: 'Per year',
    value: FrequencyRental.YEARLY
  }
];

export const bondAtData = [
  {
    label: 'Increase bond to',
    value: 'increase bond to'
  },
  {
    label: 'Decrease bond to',
    value: 'decrease bond to'
  },
  {
    label: 'Maintain bond at',
    value: 'maintain bond at'
  }
];
export const toastComponentPT = {
  [EPropertyTreeButtonComponent.MAINTENANCE_REQUEST]:
    'Maintenance request is already linked to this task.',
  [EPropertyTreeButtonComponent.MAINTENANCE_INVOICE]:
    'You must complete the following action first: add Maintenance request.',
  [EPropertyTreeButtonComponent.LEASE_RENEWAL]:
    'Lease renewal is already linked to this task',
  [EPropertyTreeButtonComponent.VACATE_DETAIL]: 'Already added vacate details',
  [EPropertyTreeButtonComponent.NEW_TENANCY]: 'This tenancy already exists'
};

export const mapEventCalendarWidget = {
  [EEventTypes.ARREAR]: ECalendarEvent.NUMBER_OF_DAYS_IN_ARREARS,
  [EEventTypes.VACATE]: ECalendarEvent.VACATE_DATE,
  [EEventTypes.BREACH_REMEDY]: ECalendarEvent.BREACH_NOTICE_REMEDY_DATE,
  [EEventTypes.LEASE_END]: ECalendarEvent.LEASE_END_DATE,
  [EEventTypes.LEASE_START]: ECalendarEvent.LEASE_START_DATE,
  [EEventTypes.GENERAL_EXPIRY]: ECalendarEvent.COMPLIANCE_EXPIRY,
  [EEventTypes.ROUTINE_INSPECTION]: ECalendarEvent.ROUTINE_INSPECTION_DATE,
  [EEventTypes.INGOING_INSPECTION]: ECalendarEvent.INGOING_INSPECTION_DATE,
  [EEventTypes.OUTGOING_INSPECTION]: ECalendarEvent.OUTGOING_INSPECTION_DATE,
  [EEventTypes.GENERAL_NEXT_SERVICE]: ECalendarEvent.COMPLIANCE_NEXT_SERVICE,
  [EEventTypes.SMOKE_ALARM_EXPIRY]: ECalendarEvent.COMPLIANCE_EXPIRY,
  [EEventTypes.SMOKE_ALARM_NEXT_SERVICE]:
    ECalendarEvent.COMPLIANCE_NEXT_SERVICE,
  [EEventTypes.ENTRY_NOTICE]: ECalendarEvent.ENTRY_NOTICE_ENTRY_DATE,
  [EEventTypes.ISSUE_OPEN_DATE]: ECalendarEvent.ISSUE_DUE_DATE,
  [EEventTypes.TENANT_INVOICE_DUE_DATE]: ECalendarEvent.TENANT_INVOICE_DUE_DATE,
  [EEventTypes.MOVE_IN_DATE]: ECalendarEvent.MOVE_IN_DATE,
  [EEventTypes.MOVE_OUT_DATE]: ECalendarEvent.MOVE_OUT_DATE
};
