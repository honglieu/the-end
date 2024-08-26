export enum ERentManagerIssuePopup {
  RM_ISSUE_POPUP = 'RM_ISSUE_POPUP',
  RM_ISSUE_PURCHASE_ORDER_POPUP = 'RM_ISSUE_PURCHASE_ORDER_POPUP',
  RM_ISSUE_BILL_POPUP = 'RM_ISSUE_BILL_POPUP',
  RM_ISSUE_INVOICE_DETAILS_POPUP = 'RM_ISSUE_INVOICE_DETAILS_POPUP'
}

export enum ERentManagerIssueTab {
  DETAILS = 'DETAILS',
  WORK_ORDER = 'WORK_ORDER',
  CHECKLIST = 'CHECKLIST',
  HISTORY_NOTES = 'HISTORY_NOTES'
}

export enum EBillType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  INVOICE_DETAIL = 'INVOICE_DETAIL',
  VENDOR_BILL = 'VENDOR_BILL',
  OWNER_BILL = 'OWNER_BILL'
}

export enum EWorkOrderActionType {
  DELETE = 'DELETE',
  DUPLICATE = 'DUPLICATE',
  VIEW_PURCHASE_ORDER = 'VIEW_PURCHASE_ORDER',
  VIEW_INVOICE_DETAIL = 'VIEW_INVOICE_DETAIL',
  VIEW_VENDOR_BILL = 'VIEW_VENDOR_BILL',
  VIEW_OWNER_BILL = 'VIEW_OWNER_BILL'
}
export enum ERentManagerIssueCheckListStatus {
  COMPLETED = 'COMPLETED',
  INPROGRESS = 'INPROGRESS'
}

export enum EUserType {
  VENDOR = 'SUPPLIER',
  OWNER = 'LANDLORD',
  TENANT = 'TENANT',
  TENANCY = 'TENANCY',
  OWNERSHIP = 'OWNERSHIP'
}

export enum EUserPayloadType {
  TENANT_PROSPECT = 'TENANT_PROSPECT',
  TENANT_PROPERTY = 'TENANT_PROPERTY',
  TENANT_UNIT = 'TENANT_UNIT',
  LANDLORD = 'LANDLORD'
}

export enum EAccountType {
  TENANT = 'TENANT',
  OWNER = 'OWNER',
  PROSPECT = 'PROSPECT'
}

export enum ERentManagerIssueIndexTab {
  TAB_DETAILS = 0,
  TAB_WORK_ORDER = 1,
  TAB_CHECKLIST = 2,
  TAB_HISTORY_NOTES = 3
}

export enum ERentManagerHistoryCategoryType {
  ALL = 'ALL',
  ARCHITECTURAL_REQUEST = 'ARCHITECTURAL_REQUEST',
  ASSET = 'ASSET',
  BILL = 'BILL',
  ESTIMATE = 'ESTIMATE',
  ISSUE = 'ISSUE',
  JOB = 'JOB',
  OWNER_PROSPECT = 'OWNER_PROSPECT',
  PROPERTY = 'PROPERTY',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  TENANT_PROSPECT = 'TENANT_PROSPECT',
  UNIT = 'UNIT',
  VENDOR = 'VENDOR'
}

export const CHECK_BILLS = {
  [EBillType.INVOICE_DETAIL]: 'Invoice detail',
  [EBillType.OWNER_BILL]: 'Owner bill',
  [EBillType.PURCHASE_ORDER]: 'Purchase order',
  [EBillType.VENDOR_BILL]: 'Vendor bill'
};

export const ACCOUNT_TYPE_LABEL = {
  [EAccountType.TENANT]: 'Tenant',
  [EAccountType.PROSPECT]: 'Tenant prospect',
  [EAccountType.OWNER]: 'Owner'
};