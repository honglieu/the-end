export enum ComplianceStatus {
  COMPLETED = 'Completed',
  OPEN = 'Open'
}

export enum EManagedBy {
  AGENT = 'Agent',
  OWNER = 'Owner',
  STRATA = 'Strata'
}

export enum EComplianceType {
  SMOKE_ALARM = 'SmokeAlarm',
  GENERAL = 'General',
  OTHER = ''
}

export enum ESelectRadioComplianceItemPopup {
  CREATE_NEW = 'CREATE_NEW',
  SELECT_EXISTING = 'SELECT_EXISTING'
}

export enum ESelectOpenComplianceItemPopup {
  CREATE_COMPLIANCE = 'CREATE_COMPLIANCE',
  UPDATE_COMPLIANCE = 'UPDATE_COMPLIANCE',
  SYNC_COMPLIANCE = 'SYNC_COMPLIANCE',
  CLOSE_POPUP = 'CLOSE_POPUP'
}
