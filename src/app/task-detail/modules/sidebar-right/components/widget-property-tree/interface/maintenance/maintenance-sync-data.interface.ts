import { IMaintenanceRequest } from './maintenance-request.interface';
import { IMaintenanceInvoice } from './maintenance-invoice.interface';

export interface IMaintenanceSyncData {
  maintenanceRequest: {
    groupTitle: string;
    data?: IMaintenanceRequest[];
  };
  maintenanceInvoice: {
    groupTitle: string;
    data?: IMaintenanceInvoice[];
  };
}
