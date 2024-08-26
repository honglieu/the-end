export enum PetRequestButtonAction {
  askTenantPetDetail = 'ask_tenant_pet_detail',
  sendFormTenant = 'send_pet_request_form_tenant',
  informTanentPetRequest = 'inform_tanent_pet_request',
  sendPetRequestLandlord = 'send_pet_request_landlord',
  decisionChange = 'decision-change',
  notiApproved = 'notify_tenant_pet_request_approved',
  notiDenied = 'notify_tenant_pet_request_denied',
  addNote = 'complete_pt_pet_request'
}

export enum PetRequestStatus {
  unset = 'UNSET',
  approved = 'APPROVED',
  denied = 'DENIED'
}

export enum PetRequestState {
  QLD = 'QLD',
  VIC = 'VIC',
  NSW = 'NSW',
  ACT = 'ACT',
  SA = 'SA',
  WA = 'WA',
  NT = 'NT',
  TAS = 'TAS'
}
