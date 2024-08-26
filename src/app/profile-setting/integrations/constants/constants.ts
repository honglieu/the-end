export interface EventsToggle {
  key: string;
  eventsName: string;
  isChecked: boolean;
}

export interface IEvents {
  routineInspection?: boolean;
  outgoingInspection?: boolean;
  incomingInspection?: boolean;
  arrear?: boolean;
  leaseCommencement?: boolean;
  leaseEnd?: boolean;
  vacate?: boolean;
  compliance?: boolean;
  inspections?: boolean;
  moveIn?: boolean;
  moveOut?: boolean;
  issueOpen?: boolean;
  tenantInvoice?: boolean;
  breachNotice?: boolean;
  entryNotice?: boolean;
  other?: boolean;
}

export const eventsSyncedPT: EventsToggle[] = [
  {
    key: 'routineInspection',
    eventsName: 'Routine inspection',
    isChecked: false
  },
  {
    key: 'outgoingInspection',
    eventsName: 'Outgoing inspection',
    isChecked: false
  },
  {
    key: 'incomingInspection',
    eventsName: 'Incoming inspection',
    isChecked: false
  },
  {
    key: 'arrear',
    eventsName: 'Days in arrears',
    isChecked: false
  },
  {
    key: 'leaseCommencement',
    eventsName: 'Lease commencement',
    isChecked: false
  },
  {
    key: 'leaseEnd',
    eventsName: 'Lease end',
    isChecked: false
  },
  {
    key: 'vacate',
    eventsName: 'Vacate date',
    isChecked: false
  },
  {
    key: 'compliance',
    eventsName: 'Compliance next service or expiry',
    isChecked: false
  }
];

export const eventsSyncedRM: EventsToggle[] = [
  {
    key: 'inspections',
    eventsName: 'Inspections',
    isChecked: false
  },
  {
    key: 'leaseCommencement',
    eventsName: 'Lease commencement',
    isChecked: false
  },
  {
    key: 'moveIn',
    eventsName: 'Move in',
    isChecked: false
  },
  {
    key: 'leaseEnd',
    eventsName: 'Lease end',
    isChecked: false
  },
  {
    key: 'moveOut',
    eventsName: 'Move out',
    isChecked: false
  },
  {
    key: 'issueOpen',
    eventsName: 'Issue open date',
    isChecked: false
  },
  {
    key: 'tenantInvoice',
    eventsName: 'Tenant invoice due date',
    isChecked: false
  }
];

export const eventsCreated: EventsToggle[] = [
  {
    key: 'breachNotice',
    eventsName: 'Breach notice - remedy date',
    isChecked: false
  },
  {
    key: 'entryNotice',
    eventsName: 'Entry notice - entry date',
    isChecked: false
  },
  {
    key: 'other',
    eventsName: 'Other events',
    isChecked: false
  }
];
