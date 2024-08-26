import { PhotoType } from '@shared/types/task.interface';

export interface IEmergencyTaskDetail {
  description: string;
  emergencyEventList: string[];
  emergencyEvent: string;
  photos: PhotoType[];
}

export enum EEmergencyButtonAction {
  createJobInPT = 'create_maintenance_job_in_property_tree',
  notifyTenantEmergency = 'notify_tenant_that_emergency',
  adviseLandlordEmergency = 'advise_landlord_of_emergency_maintenance',
  askSupplierQuote = 'ask_suppliers_to_quote',
  sendLandlordQuote = 'send_landlord_approved_quote',
  createWorkOrderSupplier = 'create_work_order_to_supplier',
  notifyTenantQuote = 'notify_tenant_of_quote_approval',
  sendInvoiceToPT = 'send_invoice_to_property_tree',
  notifyLandlordCompletion = 'notify_landlord_of_completion',
  notifyTenantCompletion = 'notify_tenant_of_completion',
  completePtMaintenance = 'complete_maintenance_job_in_property_tree',
  requestTradesmanDetailAndInvoiceTenant = 'request_tradesman_details_and_invoice_from_tenant',
  sendInvoiceToLandlord = 'send_invoice_to_landlord',
  notifyTenantReimbursement = 'notify_tenant_of_reimbursement',
  placeCallToTenant = 'place_call_to_tenant'
}

export enum EDecisionIndex {
  PROCEEDING,
  ORGANIZED,
  DOWNGRADE
}

export enum EEmergencyTypeInReceiver {
  tenant = 'tenant',
  conversation = 'conversation'
}

export interface PlaceCallPopUpState {
  confirmCall?: boolean;
  confirmDelete?: boolean;
  agentJoin?: boolean;
}

export interface UserCallData {
  firstName: string;
  lastName: string;
  conversationId: string;
  phone: string;
}
