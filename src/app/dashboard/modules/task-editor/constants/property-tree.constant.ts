import {
  EPropertyTreeButtonComponent,
  ERentManagerButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';

export enum PropertyTreeButtonGroup {
  'AVAILABLE_IN_TASK' = 'Available in task',
  'NOT_IN_THIS_TASK' = 'Not in this task'
}

export const COMPONENT_TYPE_DATA = [
  {
    id: EPropertyTreeButtonComponent.NOTE,
    label: 'Notes'
  },
  {
    id: EPropertyTreeButtonComponent.CREDITOR_INVOICE,
    label: 'Creditor invoice'
  },
  {
    id: EPropertyTreeButtonComponent.TENANCY_INVOICE,
    label: 'Tenancy invoice'
  },
  {
    id: EPropertyTreeButtonComponent.MAINTENANCE_REQUEST,
    label: 'Maintenance request'
  },
  {
    id: EPropertyTreeButtonComponent.MAINTENANCE_INVOICE,
    label: 'Maintenance invoice'
  },
  {
    id: EPropertyTreeButtonComponent.ROUTINE_INSPECTION,
    label: 'Routine inspection'
  },
  {
    id: EPropertyTreeButtonComponent.INGOING_INSPECTION,
    label: 'Ingoing inspection'
  },
  {
    id: EPropertyTreeButtonComponent.OUTGOING_INSPECTION,
    label: 'Outgoing inspection'
  },
  {
    id: EPropertyTreeButtonComponent.LEASE_RENEWAL,
    label: 'Lease renewal'
  },
  {
    id: EPropertyTreeButtonComponent.VACATE_DETAIL,
    label: 'Vacate details'
  },
  {
    id: EPropertyTreeButtonComponent.NEW_TENANCY,
    label: 'New tenancy'
  },
  {
    id: EPropertyTreeButtonComponent.COMPLIANCE,
    label: 'Compliance item'
  }
];

export const COMPONENT_TYPE_DATA_RENT_MANAGER = [
  {
    id: ERentManagerButtonComponent.NOTES,
    label: 'Notes'
  },
  {
    id: ERentManagerButtonComponent.ISSUE,
    label: 'Issue'
  },
  {
    id: ERentManagerButtonComponent.INSPECTION,
    label: 'Inspection'
  },
  {
    id: ERentManagerButtonComponent.LEASE_RENEWAL,
    label: 'Lease renewal'
  },
  {
    id: ERentManagerButtonComponent.VACATE_DETAIL,
    label: 'Vacate details'
  },
  {
    id: ERentManagerButtonComponent.NEW_TENANT,
    label: 'New tenant'
  }
];

export const ONLY_ADD_ONCE_HELP_TEXT =
  'You only can add one component of this type to a task';
export const CanAddOncePTComponent: Partial<
  Record<EPropertyTreeButtonComponent, true>
> = {
  [EPropertyTreeButtonComponent.MAINTENANCE_REQUEST]: true,
  [EPropertyTreeButtonComponent.LEASE_RENEWAL]: true,
  [EPropertyTreeButtonComponent.VACATE_DETAIL]: true,
  [EPropertyTreeButtonComponent.NEW_TENANCY]: true
};

export const CanAddOnceRMComponent: Partial<
  Record<ERentManagerButtonComponent, true>
> = {
  [ERentManagerButtonComponent.LEASE_RENEWAL]: true,
  [EPropertyTreeButtonComponent.VACATE_DETAIL]: true
};
