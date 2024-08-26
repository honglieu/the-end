export interface bodySyncVacating {
  propertyId: string;
  agencyId: string;
  taskId?: string;
  variable?: variableSync;
}

export interface variableSync {
  category?: string;
  description: string;
  vacateDate: string;
}

export interface commencingSync {
  category?: string;
  description: string;
  commenceDate: string;
}

export interface VariableFixedTermLease {
  rentAmount: string;
  frequency: string;
  leaseStart: string;
  leaseEnd: string;
  effectiveDate: string;
  category?: string;
  description?: string;
  file?: any;
  tenancyId?: string;
}
