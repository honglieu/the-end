export enum LeaseRenewalRequestButtonAction {
  confirmNegotiatedTenant = 'confirm_negotiated_terms_with_tenant',
  notifyTenantLandlordOfCompletion = 'notify_tenant_landlord_of_completion',
  sendTenantNewLeaseTerms = 'send_tenant_new_lease_terms',
  presentNegotiationsToLandlord = 'present_negotiations_to_landlord',
  decisionChange = 'decision-change',
  askTenantForIntentions = 'ask_tenant_for_intentions',
  askLandLordForIntentions = 'ask_landlord_for_intentions',
  sendVacatingDateToPropertyTree = 'send_vacating_date_to_property_tree',
  notifyLanLordOfTenantVacating = 'notify_landlord_of_tenant_vacating',
  createTenantVacate = 'create_tenant_vacate_task',
  notifyTenantVacating = 'notify_tenant_of_upcoming_termination',
  sendNewLeaseDetailToPropertyTree = 'send_new_lease_details_to_property_tree',
  notifyTenantOfPeriodicLease = 'notify_tenant_of_periodic_lease',
  createLeaseAgreementSendToTenants = 'create_lease_agreement_and_send_to_tenants',
  scheduleSmokeAlarmService = 'schedule_smoke_alarm_service',
  renewComplianceCertificate = 'renew_compliance_certificate',
  startVacatingProcess = 'start_vacating_process',
  startTermination = 'start_termination',
  confirmTenancy = 'confirm_tenancy'
}

export enum LeaseRenewalDecision {
  unset = 'UNSET',
  fixedTerm = 'FIXED_TERM',
  periodic = 'PERIODIC',
  vacating = 'VACATING',
  terminated = 'TERMINATED'
}

export enum LeaseRenewalSyncStatus {
  WAITING = '',
  COMPLETED = 'COMPLETED',
  INPROGRESS = 'INPROGRESS',
  FAILED = 'FAILED',
  UN_SYNC = 'UNSYNC',
  PENDING = 'PENDING',
  NOT_SYNC = 'NOT_SYNC'
}

export enum LeaseRenewalDecisionIndex {
  FIXEDTERM,
  PERIODIC,
  VACATING,
  TERMINATED
}

export enum LeaseRenewalSyncDateType {
  commencingDate = 'COMMENCINGDATE',
  vacatingDate = 'VACATINGDATE',
  leaseStart = 'LEASESTART',
  leaseEnd = 'LEASEEND',
  effectiveDate = 'EFFECTIVEDATE'
}

export enum LeaseRenewalTenantIntention {
  FIXED_TERM = 0,
  PERIODIC = 1,
  UNKNOWN = 2
}
