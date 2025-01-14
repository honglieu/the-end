export enum ForwardButtonAction {
  tkLandlord = 'forward_ticket_landlord',
  tkTenant = 'forward_ticket_tenant',
  tkSupplier = 'forward_ticket_supplier',
  sendMaintenance = 'send_maintenance_request_pt',
  closeTask = 'complete_task',
  joinCoversation = 'join_conversation',
  editSuggestedYes = 'edit_suggested_response_yes',
  editSuggestedNo = 'edit_suggested_response_no',
  editMessage = 'edit_message',
  sendMessage = 'send_message',
  askSupplierQuote = 'ask_supplier_quote',
  sendQuoteLandlord = 'send_quote_landlord',
  supToTenant = 'send_supplier_to_tenant',
  tell_tenant = 'tell_tenant',
  sendInvoicePT = 'send_invoice_pt',
  createWorkOrder = 'create_work_order',
  notifyLandlord = 'notify_landlord_completion',
  notifyTenantCompletion = 'notify_tenant_completion',
  notifyTenant = 'notify_tenant_quote_reject',
  completePtMaintenance = 'complete_pt_maintenance',
  attachmentFile = 'attachment_file',
  notifyLandlordTenantAttend = 'notify_landlord_tenant_attending',
  sendJobPt = 'send_maintenance_job_pt'
}
