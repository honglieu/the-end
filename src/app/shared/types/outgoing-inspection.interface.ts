export interface OutgoingInspectionSync {
  isReadGeneralNotes: string[];
  notes: OutgoingInspectionNotes;
}

export interface OutgoingInspectionNotes {
  generalNotes?: string;
  ownerNotes?: string;
  ownerFollowupItems?: string;
  tenantNotes?: string;
  tenantActions?: string;
}

export interface IOutgoingNotesData {
  general?: string;
  owner_notes?: string;
  owner_followup_items?: string;
  tenant_notes?: string;
  tenant_actions?: string;
}
