export enum LeasingRequestButtonAction {
  send_landlord_rent_recommendations = 'send_landlord_rent_recommendations',
  notify_landlord_of_advertising = 'notify_landlord_of_advertising',
  send_landlord_applications_shortlist = 'send_landlord_applications_shortlist',
  notify_applicant_of_success = 'notify_applicant_of_success',
  add_new_tenancy_to_pt = 'add_new_tenancy_to_pt',
  notify_landlord_of_approved_applicant = 'notify_landlord_of_approved_applicant',
  advise_owner_deposit_received = 'advise_owner_deposit_received',
  send_tenant_new_lease = 'send_tenant_new_lease',
  send_tenant_bond_lodgement_form = 'send_tenant_bond_lodgement_form',
  notify_tenant_landlord_of_completion = 'notify_tenant/landlord_of_completion',
  schedule_entry_inspection_in_property_tree = 'schedule_entry_inspection_in_property_tree',
  send_tenant_entry_report_and_instructions = 'send_tenant_entry_report_&_instructions',
  schedule_smoke_alarm_service = 'schedule_smoke_alarm_service',
  renew_compliance_certificate = 'renew_compliance_certificate'
}

export enum LeasingDecision {
  unset = 'UNSET',
  fixedTerm = 'FIXED_TERM',
  periodic = 'PERIODIC',
  vacating = 'VACATING',
  terminated = 'TERMINATED'
}

export enum LeasingSyncStatus {
  WAITING = '',
  COMPLETED = 'COMPLETED',
  INPROGRESS = 'INPROGRESS',
  FAILED = 'FAILED'
}

export enum LeasingDecisionIndex {
  FIXEDTERM,
  PERIODIC,
  VACATING,
  TERMINATED
}

export enum LeasingSyncDateType {
  commencingDate = 'COMMENCINGDATE',
  vacatingDate = 'VACATINGDATE',
  leaseStart = 'LEASESTART',
  leaseEnd = 'LEASEEND',
  effectiveDate = 'EFFECTIVEDATE'
}

export enum LeasingTenantIntention {
  FIXED_TERM = 0,
  PERIODIC = 1,
  UNKNOWN = 2
}

export enum LeasingStepIndex {
  ADVERTISING = 0,
  APPLICATIONS = 1,
  NEW_LEASE_BOND = 2,
  ENTRY_INSPECTION = 3,
  NEXT_STEPS = 4
}

export enum LeasingStepTitle {
  ADVERTISING = 'Advertising',
  APPLICATIONS = 'Applications',
  NEW_LEASE_BOND = 'New lease & Bond',
  ENTRY_INSPECTION = 'Entry Inspection',
  NEXT_STEPS = 'Next steps'
}

export enum SendTenantBondLodgementTextStatus {
  SENT_AS_ATTACHMENT = 'FORM_SENT_AS_ATTACHMENT_TO_OUTGOING_MESSAGE',
  FORM_SENT_VIA_DOCUSIGN = 'FORM_SENT_VIA_DOCUSIGN',
  NO_FORM_ATTACH = 'NO_FORM_ATTACH'
}
