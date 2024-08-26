import { ERentManagerButtonComponent } from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import {
  ECalendarEvent,
  EComponentTypes,
  EDynamicType,
  EStepAction
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

export interface IListDynamic {
  title?: string;
  isDisplay?: boolean;
  communicationStepType?: EStepAction;
  dynamicType?: EDynamicType;
  menu?: {
    title: string;
    param: string;
  }[];
  subTitle?: string;
  componentType?: EComponentTypes | ERentManagerButtonComponent;
  calendarEventType?: ECalendarEvent;
}

export const RM_LIST_DYNAMIC_PARAMETERS: IListDynamic[] = [
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.SEND_ATTACHMENT,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Form name (title of the modal)',
        param: 'form_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.SCHEDULE_REMINDER,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Schedule date',
        param: 'schedule_date'
      },
      {
        title: 'Schedule time',
        param: 'schedule_time'
      },
      {
        title: 'Event name',
        param: 'event_name'
      },
      {
        title: 'Event date',
        param: 'event_date'
      },
      {
        title: 'Event time',
        param: 'event_time'
      }
    ]
  },
  {
    title: 'Pre-screen',
    communicationStepType: EStepAction.SEND_CONVERSATION_FILES,
    isDisplay: false,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'File name',
        param: 'file_name'
      },
      {
        title: 'File sender',
        param: 'file_sender_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.SEND_CONTACT_CARD,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Contact name',
        param: 'contact_name'
      },
      {
        title: 'Contact address',
        param: 'contact_address'
      },
      {
        title: 'Contact email address',
        param: 'contact_email_address'
      },
      {
        title: 'Contact phone number',
        param: 'contact_phone_number'
      },
      {
        title: 'Contact card',
        param: 'contact_information'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.SEND_CALENDAR_EVENT,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Event name',
        param: 'calendar_event_name'
      },
      {
        title: 'Event date',
        param: 'calendar_event_date'
      },
      {
        title: 'Event time',
        param: 'calendar_event_time'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_LEASE_TERMS,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Lease duration period',
        param: 'lease_duration_period'
      },
      {
        title: 'Duration period type',
        param: 'duration_period_type'
      },
      {
        title: 'Rental state',
        param: 'rental_state'
      },
      {
        title: 'Rent amount',
        param: '$lease_rent_amount'
      },
      {
        title: 'Payment period',
        param: 'lease_payment_period'
      },
      {
        title: 'Bond state',
        param: 'bond_state'
      },
      {
        title: 'Bond amount',
        param: '$bond_amount'
      },
      {
        title: 'Bond increase amount to be paid',
        param: '$bond_increase_paid'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_CONDITIONS_FOR_REQUEST_APPROVAL,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Conditions copy',
        param: 'conditions_copy'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_PET_BOND,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Pet bond amount',
        param: '$pet_bond_amount'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_AMOUNT_OWING_TO_VACATE,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Vacate tenant name',
        param: 'vacate_tenant_name'
      },
      {
        title: 'Rent owing',
        param: '$rent_owing'
      },
      {
        title: 'Outstanding invoices and fees',
        param: '$outstanding_invoices_fees'
      },
      {
        title: 'Amount owing note',
        param: 'amount_owning_note'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_INSPECTION_ACTIONS,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Tenant notes',
        param: 'tenant_notes'
      },
      {
        title: 'Tenant actions',
        param: 'tenant_actions'
      },
      {
        title: 'Owner notes',
        param: 'owner_notes'
      },
      {
        title: 'Follow-up items',
        param: 'follow_up_items'
      },
      {
        title: 'Form name (title of the modal)',
        param: 'inspection_form_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.BOND_RETURN_SUMMARY,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Bond amount returned',
        param: '$bond_amount_returned'
      },
      {
        title: 'Bond amount deducted',
        param: '$bond_amount_deducted'
      },
      {
        title: 'Reason for bond deduction',
        param: 'reason_bond_deduction'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_BREAK_LEASE_FEES,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Break-lease fee',
        param: '$break_lease_fee'
      },
      {
        title: 'Advertising fees',
        param: '$advertising_fees'
      },
      {
        title: 'Other fees',
        param: 'other_fees_name'
      },
      {
        title: 'Other fees amount',
        param: '$other_fees_amount'
      },
      {
        title: 'Form name (title of the modal)',
        param: 'break_lease_form_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.LETTING_RECOMMENDATIONS,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Letting type',
        param: 'letting_type'
      },
      {
        title: 'Recommended rental amount',
        param: '$recommended_rental_amount'
      },
      {
        title: 'Payment period',
        param: 'letting_payment_period'
      },
      {
        title: 'Recommended lease duration',
        param: 'recommended_lease_duration'
      },
      {
        title: 'Period type',
        param: 'letting_period_type'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.APPLICATIONS_SHORTLIST,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Application name 1',
        param: 'application_name_1'
      },
      {
        title: 'Application summary 1',
        param: 'application_summary_1'
      },
      {
        title: 'Application name 2',
        param: 'application_name_2 '
      },
      {
        title: 'Application summary 2',
        param: 'application_summary_2'
      },
      {
        title: 'Application name 3',
        param: 'application_name_3'
      },
      {
        title: 'Application summary 3',
        param: 'application_summary_3'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.BOND_AMOUNT_DUE,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Bond amount due',
        param: '$bond_amount_due'
      },
      {
        title: 'Form name (title of the modal)',
        param: 'bond_form_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.ENTRY_REPORT_DEADLINE,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Entry report deadline',
        param: 'report_deadline'
      },
      {
        title: 'Form name (title of the modal)',
        param: 'report_form_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.NOTICE_TO_LEAVE,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Notice to leave date',
        param: 'notice_to_leave_date'
      },
      {
        title: 'Reason for notice',
        param: 'reason_for_notice'
      },
      {
        title: 'Today date',
        param: 'today_date'
      },
      {
        title: 'Form name (title of the modal)',
        param: 'notice_form_name'
      }
    ]
  },
  {
    title: 'Issue',
    subTitle: 'Rent Manager component',
    isDisplay: false,
    componentType: EComponentTypes.ISSUE,
    dynamicType: EDynamicType.RM_COMPONENT,
    menu: [
      {
        title: 'Issue title',
        param: 'issue_title'
      },
      {
        title: 'Schedule date',
        param: 'issue_schedule_date'
      },
      {
        title: 'Due date',
        param: 'issue_due_date'
      },
      {
        title: 'Open date',
        param: 'issue_open_date'
      },
      {
        title: 'Open time',
        param: 'issue_open_time'
      },
      {
        title: 'Close date',
        param: 'issue_close_date'
      },
      {
        title: 'Close time',
        param: 'issue_close_time'
      },
      {
        title: 'Status',
        param: 'issue_status'
      },
      {
        title: 'Category',
        param: 'issue_category'
      },
      {
        title: 'Priority',
        param: 'issue_priority'
      },
      {
        title: 'Project',
        param: 'issue_project'
      },
      {
        title: 'Vendor',
        param: 'issue_vendor'
      },
      {
        title: 'Job',
        param: 'issue_job'
      },
      {
        title: 'Description',
        param: 'issue_description'
      },
      {
        title: 'Resolution',
        param: 'issue_resolution'
      },
      {
        title: 'Inventory item',
        param: 'inventory_item'
      },
      {
        title: 'Checklist description',
        param: 'checklist_description'
      },
      {
        title: 'Note description',
        param: 'issue_note_description'
      }
    ]
  },
  {
    title: 'Note',
    subTitle: 'Rent Manager component',
    isDisplay: false,
    componentType: ERentManagerButtonComponent.NOTES,
    dynamicType: EDynamicType.RM_COMPONENT,
    menu: [
      {
        title: 'Note description',
        param: 'note_description'
      }
    ]
  },
  {
    title: 'Vacate Details',
    subTitle: 'Rent Manager component',
    isDisplay: false,
    componentType: EComponentTypes.VACATE_DETAIL,
    dynamicType: EDynamicType.RM_COMPONENT,
    menu: [
      {
        title: 'Tenant',
        param: 'vacate_tenant'
      },
      {
        title: 'Move in',
        param: 'move_in_date'
      },
      {
        title: 'Move out',
        param: 'move_out_date'
      },
      {
        title: 'Notice',
        param: 'notice_date'
      },
      {
        title: 'Expected move out',
        param: 'expected_move_out'
      }
    ]
  },
  {
    title: 'Lease renewal',
    subTitle: 'Rent Manager component',
    isDisplay: false,
    componentType: EComponentTypes.LEASE_RENEWAL,
    dynamicType: EDynamicType.RM_COMPONENT,
    menu: [
      {
        title: 'Lease start',
        param: 'lease_renewal_start'
      },
      {
        title: 'Lease end',
        param: 'lease_renewal_end'
      },
      {
        title: 'Lease sign',
        param: 'lease_renewal_sign'
      },
      {
        title: 'Lease term',
        param: 'lease_renewal_term'
      },
      {
        title: 'Rent period',
        param: 'lease_rent_period'
      },
      {
        title: 'Due day',
        param: 'lease_due_day'
      },
      {
        title: 'Property charge',
        param: 'lease_property_charge'
      },
      {
        title: 'Unit charge',
        param: 'lease_unit_charge'
      },
      {
        title: 'Unit type charge',
        param: 'lease_unit_type_charge'
      },
      {
        title: 'Tenant charge',
        param: 'lease_tenant_charge'
      }
    ]
  },
  {
    title: 'Inspection',
    subTitle: 'Rent Manager component',
    isDisplay: false,
    componentType: EComponentTypes.INSPECTION,
    dynamicType: EDynamicType.RM_COMPONENT,
    menu: [
      {
        title: 'Tenant',
        param: 'inspection_tenant'
      },
      {
        title: 'Status',
        param: 'inspection_status'
      },
      {
        title: 'Type',
        param: 'inspection_type'
      },
      {
        title: 'Inspection date',
        param: 'inspection_date'
      },
      {
        title: 'Scheduled date',
        param: 'scheduled_inspection_date'
      },
      {
        title: 'Description',
        param: 'inspection_description'
      },
      {
        title: 'Notes',
        param: 'inspection_notes'
      },
      {
        title: 'Inspection area',
        param: 'inspection_area'
      },
      {
        title: 'Inspection item',
        param: 'inspection_item'
      },
      {
        title: 'Inspection item details',
        param: 'inspection_item_details'
      }
    ]
  },
  {
    title: 'New tenant',
    subTitle: 'Rent Manager component',
    isDisplay: false,
    componentType: ERentManagerButtonComponent.NEW_TENANT,
    dynamicType: EDynamicType.RM_COMPONENT,
    menu: [
      {
        title: 'New tenant first name',
        param: 'new_tenant_first_name'
      },
      {
        title: 'New tenant last name',
        param: 'new_tenant_last_name'
      },
      {
        title: 'New tenant address',
        param: 'new_tenant_address'
      },
      {
        title: 'Tenant move in',
        param: 'tenant_move_in_date'
      },
      {
        title: 'Tenant move out',
        param: 'tenant_move_out_date'
      },
      {
        title: 'Tenant notice',
        param: 'tenant_notice_date'
      },
      {
        title: 'Tenant expected move out',
        param: 'tenant_expected_move_out'
      },
      {
        title: 'Tenant lease start',
        param: 'tenant_lease_start'
      },
      {
        title: 'Tenant lease end',
        param: 'tenant_lease_end'
      },
      {
        title: 'Tenant lease sign',
        param: 'tenant_lease_sign'
      },
      {
        title: 'Tenant lease term',
        param: 'tenant_lease_term'
      },
      {
        title: 'New tenant contact name',
        param: 'tenant_contact_name'
      },
      {
        title: 'Deposit type',
        param: 'deposit_type'
      },
      {
        title: 'Deposit amount',
        param: 'deposit_amount'
      },
      {
        title: 'Deposit date',
        param: 'deposit_date'
      },
      {
        title: 'Tenant rent period',
        param: 'tenant_rent_period'
      },
      {
        title: 'Tenant due day',
        param: 'tenant_due_day'
      },
      {
        title: 'Tax type ID',
        param: 'tax_type_ID'
      },
      {
        title: 'Subsidies',
        param: 'tenant_subsidies'
      },
      {
        title: 'Property charge of new tenant',
        param: 'property_charge_of_new_tenant'
      },
      {
        title: 'Unit charge of new tenant',
        param: 'unit_charge_of_new_tenant'
      },
      {
        title: 'Unit type charge of new tenant',
        param: 'unit_type_charge_of_new_tenant'
      },
      {
        title: 'Tenant charge of new tenant',
        param: 'tenant_charge_of_new_tenant'
      },
      {
        title: 'One time charges',
        param: 'one_time_charges'
      },
      {
        title: 'User defined fields',
        param: 'user_defined_fields'
      }
    ]
  },
  {
    title: 'Breach notice',
    isDisplay: false,
    dynamicType: EDynamicType.CALENDER_EVENT,
    calendarEventType: ECalendarEvent.BREACH_NOTICE_REMEDY_DATE,
    menu: [
      {
        title: 'Breach reason',
        param: 'breach_reason'
      },
      {
        title: 'Breach remedy date',
        param: 'remedy_date'
      }
    ]
  },
  {
    title: 'Entry notice',
    isDisplay: false,
    dynamicType: EDynamicType.CALENDER_EVENT,
    calendarEventType: ECalendarEvent.ENTRY_NOTICE_ENTRY_DATE,
    menu: [
      {
        title: 'Entry reason',
        param: 'entry_reason'
      },
      {
        title: 'Entry time',
        param: 'entry_time'
      },
      {
        title: 'Entry date',
        param: 'entry_date'
      }
    ]
  },
  {
    title: 'Custom event',
    isDisplay: false,
    dynamicType: EDynamicType.CALENDER_EVENT,
    calendarEventType: ECalendarEvent.CUSTOM_EVENT,
    menu: [
      {
        title: 'Event name',
        param: 'custom_event_name'
      },
      {
        title: 'Event date',
        param: 'custom_event_date'
      },
      {
        title: 'Event time',
        param: 'custom_event_time'
      }
    ]
  },
  {
    title: 'Request summary',
    isDisplay: true,
    menu: [
      {
        title: 'Request summary',
        param: 'request_summary'
      }
    ]
  },
  {
    title: 'Recipient',
    isDisplay: true,
    menu: [
      {
        title: "User's first name",
        param: 'user_first_name'
      },
      {
        title: "User's full name",
        param: 'user_full_name'
      },
      {
        title: "User's role",
        param: 'user_role'
      }
    ]
  },
  {
    title: 'Property',
    isDisplay: true,
    menu: [
      {
        title: 'Short property address (unit/no, street)',
        param: 'short_property_address'
      },
      {
        title: 'Full property address',
        param: 'full_property_address'
      },
      {
        title: 'Region',
        param: 'property_region'
      }
    ]
  },
  {
    title: 'Company',
    isDisplay: true,
    menu: [
      {
        title: 'Company name',
        param: 'company_name'
      },
      {
        title: 'Company address',
        param: 'company_address'
      },
      {
        title: 'Company phone number',
        param: 'company_phone_number'
      },
      {
        title: 'Company website',
        param: 'company_link'
      },
      {
        title: 'Company office hours',
        param: 'company_working_hours'
      },
      {
        title: 'Company account name',
        param: 'company_account_name'
      },
      {
        title: 'Company BSB',
        param: 'company_BSB'
      },
      {
        title: 'Company account number',
        param: 'company_account_number'
      },
      {
        title: 'Sender name',
        param: 'sender_name'
      },
      {
        title: 'Sender role',
        param: 'sender_role'
      }
    ]
  },
  {
    title: 'Tenant',
    isDisplay: true,
    menu: [
      {
        title: 'Name',
        param: 'tenant_name'
      },
      {
        title: 'Tenant ID',
        param: 'tenant_id'
      },
      {
        title: 'Lease start',
        param: 'lease_start'
      },
      {
        title: 'Lease end ',
        param: 'lease_end'
      },
      {
        title: 'Rent amount',
        param: '$rent_amount'
      },
      {
        title: 'Rent period',
        param: 'rent_period'
      },
      {
        title: 'Due day',
        param: 'due_day'
      },
      {
        title: 'Tenant charge',
        param: 'tenant_charge'
      }
    ]
  },
  {
    title: 'Landlord',
    isDisplay: true,
    menu: [
      {
        title: 'Name',
        param: 'owner_name'
      }
    ]
  }
];

export const PT_LIST_DYNAMIC_PARAMETERS: IListDynamic[] = [
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.SEND_ATTACHMENT,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Form name (title of the modal)',
        param: 'form_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.SCHEDULE_REMINDER,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Schedule date',
        param: 'schedule_date'
      },
      {
        title: 'Schedule time',
        param: 'schedule_time'
      },
      {
        title: 'Event name',
        param: 'event_name'
      },
      {
        title: 'Event date',
        param: 'event_date'
      },
      {
        title: 'Event time',
        param: 'event_time'
      }
    ]
  },
  {
    title: 'Pre-screen',
    communicationStepType: EStepAction.SEND_CONVERSATION_FILES,
    isDisplay: false,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'File name',
        param: 'file_name'
      },
      {
        title: 'File sender',
        param: 'file_sender_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.SEND_CONTACT_CARD,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Contact name',
        param: 'contact_name'
      },
      {
        title: 'Contact address',
        param: 'contact_address'
      },
      {
        title: 'Contact email address',
        param: 'contact_email_address'
      },
      {
        title: 'Contact phone number',
        param: 'contact_phone_number'
      },
      {
        title: 'Contact card',
        param: 'contact_information'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.SEND_CALENDAR_EVENT,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Event name',
        param: 'calendar_event_name'
      },
      {
        title: 'Event date',
        param: 'calendar_event_date'
      },
      {
        title: 'Event time',
        param: 'calendar_event_time'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_LEASE_TERMS,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Lease duration period',
        param: 'lease_duration_period'
      },
      {
        title: 'Duration period type',
        param: 'duration_period_type'
      },
      {
        title: 'Rental state',
        param: 'rental_state'
      },
      {
        title: 'Rent amount',
        param: '$lease_rent_amount'
      },
      {
        title: 'Payment period',
        param: 'lease_payment_period'
      },
      {
        title: 'Bond state',
        param: 'bond_state'
      },
      {
        title: 'Bond amount',
        param: '$bond_amount'
      },
      {
        title: 'Bond increase amount to be paid',
        param: '$bond_increase_paid'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_CONDITIONS_FOR_REQUEST_APPROVAL,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Conditions copy',
        param: 'conditions_copy'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_PET_BOND,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Pet bond amount',
        param: '$pet_bond_amount'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_AMOUNT_OWING_TO_VACATE,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Vacate tenancy name',
        param: 'vacate_tenancy_name'
      },
      {
        title: 'Rent owing',
        param: '$rent_owing'
      },
      {
        title: 'Outstanding invoices and fees',
        param: '$outstanding_invoices_fees'
      },
      {
        title: 'Amount owing note',
        param: 'amount_owning_note'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_INSPECTION_ACTIONS,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Tenant notes',
        param: 'tenant_notes'
      },
      {
        title: 'Tenant actions',
        param: 'tenant_actions'
      },
      {
        title: 'Owner notes',
        param: 'owner_notes'
      },
      {
        title: 'Follow-up items',
        param: 'follow_up_items'
      },
      {
        title: 'Form name (title of the modal)',
        param: 'inspection_form_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.BOND_RETURN_SUMMARY,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Bond amount returned',
        param: '$bond_amount_returned'
      },
      {
        title: 'Bond amount deducted',
        param: '$bond_amount_deducted'
      },
      {
        title: 'Reason for bond deduction',
        param: 'reason_bond_deduction'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.CAPTURE_BREAK_LEASE_FEES,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Break-lease fee',
        param: '$break_lease_fee'
      },
      {
        title: 'Advertising fees',
        param: '$advertising_fees'
      },
      {
        title: 'Other fees',
        param: 'other_fees_name'
      },
      {
        title: 'Other fees amount',
        param: '$other_fees_amount'
      },
      {
        title: 'Form name (title of the modal)',
        param: 'break_lease_form_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.LETTING_RECOMMENDATIONS,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Letting type',
        param: 'letting_type'
      },
      {
        title: 'Recommended rental amount',
        param: '$recommended_rental_amount'
      },
      {
        title: 'Payment period',
        param: 'letting_payment_period'
      },
      {
        title: 'Recommended lease duration',
        param: 'recommended_lease_duration'
      },
      {
        title: 'Period type',
        param: 'letting_period_type'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.APPLICATIONS_SHORTLIST,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Application name 1',
        param: 'application_name_1'
      },
      {
        title: 'Application summary 1',
        param: 'application_summary_1'
      },
      {
        title: 'Application name 2',
        param: 'application_name_2 '
      },
      {
        title: 'Application summary 2',
        param: 'application_summary_2'
      },
      {
        title: 'Application name 3',
        param: 'application_name_3'
      },
      {
        title: 'Application summary 3',
        param: 'application_summary_3'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.BOND_AMOUNT_DUE,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Bond amount due',
        param: '$bond_amount_due'
      },
      {
        title: 'Form name (title of the modal)',
        param: 'bond_form_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.ENTRY_REPORT_DEADLINE,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Entry report deadline',
        param: 'report_deadline'
      },
      {
        title: 'Form name (title of the modal)',
        param: 'report_form_name'
      }
    ]
  },
  {
    title: 'Pre-screen',
    isDisplay: false,
    communicationStepType: EStepAction.NOTICE_TO_LEAVE,
    dynamicType: EDynamicType.COMMUNICATION_STEP,
    menu: [
      {
        title: 'Notice to leave date',
        param: 'notice_to_leave_date'
      },
      {
        title: 'Reason for notice',
        param: 'reason_for_notice'
      },
      {
        title: 'Today date',
        param: 'today_date'
      },
      {
        title: 'Form name (title of the modal)',
        param: 'notice_form_name'
      }
    ]
  },
  {
    title: 'Vacate detail',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.VACATE_DETAIL,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Vacate type',
        param: 'vacate_type'
      },
      {
        title: 'Notice date',
        param: 'notice_date'
      },
      {
        title: 'Vacate date',
        param: 'vacate_date'
      },
      {
        title: 'Termination date',
        param: 'termination_date'
      },
      {
        title: 'Charge to date ',
        param: 'charge_to_date'
      },
      {
        title: 'Description',
        param: 'vacate_description'
      }
    ]
  },
  {
    title: 'New tenancy',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.NEW_TENANCY,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Tenancy name',
        param: 'leasing_tenancy_name'
      },
      {
        title: 'Original lease start',
        param: 'leasing_original_lease_start'
      },
      {
        title: 'Lease start',
        param: 'leasing_lease_start'
      },
      {
        title: 'Lease end',
        param: 'leasing_lease_end'
      },
      {
        title: 'Lease period',
        param: 'leasing_lease_period'
      },
      {
        title: 'Period type',
        param: 'leasing_period_type'
      },
      {
        title: 'Rental amount',
        param: '$leasing_rent_amount'
      },
      {
        title: 'Payment period',
        param: 'leasing_payment_period'
      },
      {
        title: 'Rent start date',
        param: 'rent_start_date'
      },
      {
        title: 'Rent description',
        param: 'rent_description'
      },
      {
        title: 'Next rent review',
        param: 'next_rent_review'
      },
      {
        title: 'Bond account name',
        param: 'bond_account_name'
      },
      {
        title: 'Bond required amount',
        param: '$bond_required_amount'
      },
      {
        title: 'Bond amount lodged direct',
        param: '$bond_amount_lodged_direct'
      }
    ]
  },
  {
    title: 'Lease renewal',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.LEASE_RENEWAL,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Lease start',
        param: 'pt_lease_start'
      },
      {
        title: 'Lease end',
        param: 'pt_lease_end'
      },
      {
        title: 'Rent (change amount)',
        param: '$rent_change_amount'
      },
      {
        title: 'Period type',
        param: 'lease_period_type'
      },
      {
        title: 'Rent change effective date',
        param: 'rent_change_effective_date'
      },
      {
        title: 'Signed lease document',
        param: 'signed_lease_document_name'
      }
    ]
  },
  {
    title: 'Note',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.NOTE,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Note description',
        param: 'note_description'
      }
    ]
  },
  {
    title: 'Routine Inspection',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.ROUTINE_INSPECTION,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Inspection date',
        param: 'routine_inspection_date'
      },
      {
        title: 'Start time',
        param: 'routine_inspection_start_time'
      },
      {
        title: 'End time',
        param: 'routine_inspection_end_time'
      },
      {
        title: 'Tenant notes',
        param: 'routine_tenant_notes'
      },
      {
        title: 'Actions',
        param: 'routine_tenant_actions'
      },
      {
        title: 'Owner notes',
        param: 'routine_owner_notes'
      },
      {
        title: 'Follow-up items',
        param: 'routine_follow_up_items'
      },
      {
        title: 'Reschedule inspection link',
        param: 'via this link'
      }
    ]
  },
  {
    title: 'Ingoing Inspection',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.INGOING_INSPECTION,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Inspection date',
        param: 'ingoing_inspection_date'
      },
      {
        title: 'Start time',
        param: 'ingoing_inspection_start_time'
      },
      {
        title: 'End time',
        param: 'ingoing_inspection_end_time'
      },
      {
        title: 'Tenant notes',
        param: 'ingoing_tenant_notes'
      },
      {
        title: 'Actions',
        param: 'ingoing_tenant_actions'
      },
      {
        title: 'Owner notes',
        param: 'ingoing_owner_notes'
      },
      {
        title: 'Follow-up items',
        param: 'ingoing_follow_up_items'
      }
    ]
  },
  {
    title: 'Outgoing Inspection',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.OUTGOING_INSPECTION,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Inspection date',
        param: 'outgoing_inspection_date'
      },
      {
        title: 'Start time',
        param: 'outgoing_inspection_start_time'
      },
      {
        title: 'End time',
        param: 'outgoing_inspection_end_time'
      },
      {
        title: 'Tenant notes',
        param: 'outgoing_tenant_notes'
      },
      {
        title: 'Actions',
        param: 'outgoing_tenant_actions'
      },
      {
        title: 'Owner notes',
        param: 'outgoing_owner_notes'
      },
      {
        title: 'Follow-up items',
        param: 'outgoing_follow_up_items'
      }
    ]
  },
  {
    title: 'Compliance item',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.COMPLIANCE,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Compliance item',
        param: 'compliance_item'
      },
      {
        title: 'Managed by',
        param: 'item_managed_by'
      },
      {
        title: 'Serviced by',
        param: 'item_serviced_by'
      },
      {
        title: 'Authority form received',
        param: 'authority_form_received_state'
      },
      {
        title: 'Expiry date',
        param: 'expiry_date'
      },
      {
        title: 'Last service date',
        param: 'last_service_date'
      },
      {
        title: 'Next service date',
        param: 'next_service_date'
      }
    ]
  },
  {
    title: 'Maintenance request',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.MAINTENANCE_REQUEST,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Maintenance summary',
        param: 'maintenance_summary'
      }
    ]
  },
  {
    title: 'Creditor invoice',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.CREDITOR_INVOICE,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Creditor name',
        param: 'creditor_name'
      },
      {
        title: 'Invoice description',
        param: 'creditor_invoice_description'
      },
      {
        title: 'Invoice amount',
        param: '$creditor_invoice_amount'
      },
      {
        title: 'Due date',
        param: 'creditor_due_date'
      },
      {
        title: 'Invoice status',
        param: 'creditor_invoice_status'
      },
      {
        title: 'Invoice reference',
        param: 'creditor_invoice_reference'
      },
      {
        title: 'Tenancy invoice description',
        param: 'linked_tenancy_invoice_description'
      },
      {
        title: 'Tenancy invoice amount',
        param: '$linked_tenancy_invoice_amount'
      },
      {
        title: 'Tenancy due date',
        param: 'linked_tenancy_due_date'
      },
      {
        title: 'Tenancy invoice status',
        param: 'linked_tenancy_invoice_status'
      },
      {
        title: 'Tenancy name',
        param: 'linked_tenancy_name_invoice'
      }
    ]
  },
  {
    title: 'Tenancy invoice',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.TENANCY_INVOICE,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Invoice description',
        param: 'tenancy_invoice_description'
      },
      {
        title: 'Invoice amount',
        param: '$tenancy_invoice_amount'
      },
      {
        title: 'Due date',
        param: 'tenancy_due_date'
      },
      {
        title: 'Invoice status',
        param: 'tenancy_invoice_status'
      },
      {
        title: 'Tenancy name',
        param: 'tenancy_name_invoice'
      },
      {
        title: 'Account name',
        param: 'account_name'
      }
    ]
  },
  {
    title: 'Maintenance invoice',
    subTitle: 'Property Tree component',
    isDisplay: false,
    componentType: EComponentTypes.MAINTENANCE_INVOICE,
    dynamicType: EDynamicType.PT_COMPONENT,
    menu: [
      {
        title: 'Creditor name',
        param: 'maintenance_creditor_name'
      },
      {
        title: 'Invoice description',
        param: 'maintenance_invoice_description'
      },
      {
        title: 'Invoice reference',
        param: 'maintenance_invoice_reference'
      },
      {
        title: 'Invoice amount',
        param: '$maintenance_invoice_amount'
      },
      {
        title: 'Due date',
        param: 'maintenance_due_date'
      }
    ]
  },
  {
    title: 'Breach notice',
    isDisplay: false,
    dynamicType: EDynamicType.CALENDER_EVENT,
    calendarEventType: ECalendarEvent.BREACH_NOTICE_REMEDY_DATE,
    menu: [
      {
        title: 'Breach reason',
        param: 'breach_reason'
      },
      {
        title: 'Breach remedy date',
        param: 'remedy_date'
      }
    ]
  },
  {
    title: 'Entry notice',
    isDisplay: false,
    dynamicType: EDynamicType.CALENDER_EVENT,
    calendarEventType: ECalendarEvent.ENTRY_NOTICE_ENTRY_DATE,
    menu: [
      {
        title: 'Entry reason',
        param: 'entry_reason'
      },
      {
        title: 'Entry time',
        param: 'entry_time'
      },
      {
        title: 'Entry date',
        param: 'entry_date'
      }
    ]
  },
  {
    title: 'Custom event',
    isDisplay: false,
    dynamicType: EDynamicType.CALENDER_EVENT,
    calendarEventType: ECalendarEvent.CUSTOM_EVENT,
    menu: [
      {
        title: 'Event name',
        param: 'custom_event_name'
      },
      {
        title: 'Event date',
        param: 'custom_event_date'
      },
      {
        title: 'Event time',
        param: 'custom_event_time'
      }
    ]
  },
  {
    title: 'Request summary',
    isDisplay: true,
    menu: [
      {
        title: 'Request summary',
        param: 'request_summary'
      }
    ]
  },
  {
    title: 'Recipient',
    isDisplay: true,
    menu: [
      {
        title: "User's first name",
        param: 'user_first_name'
      },
      {
        title: "User's full name",
        param: 'user_full_name'
      },
      {
        title: "User's role",
        param: 'user_role'
      }
    ]
  },
  {
    title: 'Property',
    isDisplay: true,
    menu: [
      {
        title: 'Short property address (unit/no, street)',
        param: 'short_property_address'
      },
      {
        title: 'Full property address',
        param: 'full_property_address'
      },
      {
        title: 'Region',
        param: 'property_region'
      },
      {
        title: 'Expenditure limit',
        param: '$maintenance_expenditure_limit'
      },
      {
        title: 'Key number',
        param: 'key_number'
      },
      {
        title: 'Key description',
        param: 'key_description'
      },
      {
        title: 'Next inspection date',
        param: 'next_inspection_date'
      },
      {
        title: 'Next inspection start time',
        param: 'next_inspection_start_time'
      },
      {
        title: 'Next inspection end time',
        param: 'next_inspection_end_time'
      },
      {
        title: 'Authority start date',
        param: 'authority_start_date'
      },
      {
        title: 'Authority end date',
        param: 'authority_end_date'
      }
    ]
  },
  {
    title: 'Company',
    isDisplay: true,
    menu: [
      {
        title: 'Company name',
        param: 'company_name'
      },
      {
        title: 'Company address',
        param: 'company_address'
      },
      {
        title: 'Company phone number',
        param: 'company_phone_number'
      },
      {
        title: 'Company website',
        param: 'company_link'
      },
      {
        title: 'Company office hours',
        param: 'company_working_hours'
      },
      {
        title: 'Company account name',
        param: 'company_account_name'
      },
      {
        title: 'Company BSB',
        param: 'company_BSB'
      },
      {
        title: 'Company account number',
        param: 'company_account_number'
      },
      {
        title: 'Sender name',
        param: 'sender_name'
      },
      {
        title: 'Sender role',
        param: 'sender_role'
      }
    ]
  },
  {
    title: 'Tenancy',
    isDisplay: true,
    menu: [
      {
        title: 'Name',
        param: 'tenancy_name'
      },
      {
        title: 'Tenancy ID',
        param: 'tenancy_id'
      },
      {
        title: 'Lease start',
        param: 'lease_start'
      },
      {
        title: 'Lease end ',
        param: 'lease_end'
      },
      {
        title: 'Rent amount',
        param: '$rent_amount'
      },
      {
        title: 'Lease period',
        param: 'lease_period'
      },
      {
        title: 'Period type',
        param: 'period_type'
      },
      {
        title: 'Bond amount required',
        param: '$bond_amount_required'
      },
      {
        title: 'Next rent amount',
        param: '$next_rent_amount'
      },
      {
        title: 'Next rent review',
        param: 'tenant_next_rent_review'
      },
      {
        title: 'Rent arrears amount',
        param: '$effective_rent_arrears_amount'
      },
      {
        title: 'Days rent in arrears',
        param: 'day_rent_in_arrears'
      },
      {
        title: 'Rent paid to date',
        param: 'effective_rent_paid_to_date'
      },
      {
        title: 'Moving out date',
        param: 'moving_out_date'
      },
      {
        title: 'Total outstanding invoices',
        param: '$total_outstanding_invoices'
      }
    ]
  },
  {
    title: 'Landlord',
    isDisplay: true,
    menu: [
      {
        title: 'Name',
        param: 'owner_name'
      }
    ]
  }
];
