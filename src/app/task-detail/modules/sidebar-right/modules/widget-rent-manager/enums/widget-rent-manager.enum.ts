export enum ERentManagerType {
  ISSUE = 'ISSUE',
  LEASE_RENEWAL = 'LEASE_RENEWAL',
  UPDATE_RM_POPUP = 'UPDATE_RM_POPUP',
  NOTES = 'NOTES',
  INSPECTION = 'INSPECTION',
  VACATE_DETAIL = 'VACATE_DETAIL',
  NEW_TENANT = 'NEW_TENANT'
}

export enum EEntityType {
  PROPERTY = 'Property',
  UNITTYPE = 'UnitType',
  UNIT = 'Unit',
  TENANT = 'Tenant'
}

export enum RMWidgetDataField {
  LEASE_RENEWAL = 'leaseRenewals',
  RM_ISSUES = 'rmIssues',
  RM_NOTES = 'notes',
  RM_INSPECTIONS = 'rmInspections',
  VACATE_DETAIL = 'tenantVacates',
  NEW_TENANT = 'leasing',
  LINKED_ACTIONS = 'linkedActions'
}
