import { IngoingInspectionStatus } from '@shared/enum/ingoing-inspection.enum';
import { ETrudiType } from '@shared/enum/trudi';
import { LeasingRequestTrudiData } from './trudi.interface';
import { InspectionDate } from './inspection.interface';

export interface InspectionDateJob {
  startTime: string;
  endTime: string;
  tenancyId: string;
}

export interface IngoingInspectionCard {
  title: string;
  inspectionDate: InspectionDate[];
}

export interface IngoingInspectionResponseInterface {
  type: ETrudiType | string;
  data: LeasingRequestTrudiData[];
  ingoingInspectionCard: IngoingInspectionCard;
  inspectionStatus: IngoingInspectionStatus;
  ingoingInspectionSyncJob?: IngoingInspectionSync;
  rescheduleInspectionRequest?: {
    approved?: string;
    declined?: string;
  };
}

export interface IngoingInspectionSync {
  lastTimeSync?: string;
  syncStatus: string;
  syncDates: string;
  data?: InspectionDateJob;
  errorMessSync: string;
  notes: IngoingInspectionNotes;
  rescheduled: IngoingInspectionRescheduled;
  isReadGeneralNotes: boolean;
}

export interface IngoingInspectionNotes {
  generalNotes?: string;
  ownerNotes?: string;
  ownerFollowupItems?: string;
  tenantNotes?: string;
  tenantActions?: string;
}

export interface IngoingInspectionRescheduled {
  isRescheduled?: boolean;
  startTime?: string;
  endTime?: string;
}
