import { SendMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { TrudiResponse } from '@shared/types/trudi.interface';

export interface IMaintenanceRequest {
  agencyId?: string;
  id?: string;
  resultId?: string;
  status?: SendMaintenanceType;
  syncStatus?: ESyncStatus;
  summary?: string;
  updatedAt?: string;
  updateFromSocket?: boolean;
  trudiResponse?: TrudiResponse;
  firstTimeSyncSuccess?: boolean;
  propertyId?: string;
  action?: string;
  ptData?: {
    integrator_operation_id: string;
    reference: string;
    status: string;
    summary: string;
    action: string;
    isSuccessful: boolean;
  };
}
