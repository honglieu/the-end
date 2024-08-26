import { IHelpDocument } from '@/app/dashboard/modules/task-editor/interfaces/help-document.interface';
import {
  EStepAction,
  ECalendarEvent,
  EComponentTypes
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';

export const COMMUNICATION_STEPS: IHelpDocument[] = [
  {
    groupStepsTitle: 'Basic',
    steps: [
      {
        id: EStepAction.SEND_BASIC_EMAIL,
        title: 'Send basic email',
        description: 'Send a basic email communication.',
        illustration: 'communication-steps/send-basic-email.png'
      },
      {
        id: EStepAction.SEND_ATTACHMENT,
        title: 'Send attachment',
        description: `Attach a document to the email communication.<br/> Documents can be uploaded from a computer or created via your document provider (such as REI Forms).<br style="display: block; margin-top: 8px; content: ''" /> Use this to send an entry notice to a tenant.`,
        illustration: 'communication-steps/send-attachment.png',
        crmSystem: ECRMSystem.PROPERTY_TREE
      },
      {
        id: EStepAction.SEND_ATTACHMENT,
        title: 'Send attachment',
        description: `Attach a document to the email communication.<br/> Documents can be uploaded from a computer or created via your document provider (such as REI Forms).<br style="display: block; margin-top: 8px; content: ''" /> Use this to send an entry notice to a tenant.`,
        illustration: 'communication-steps/send-attachment-only.png',
        crmSystem: ECRMSystem.RENT_MANAGER
      },
      {
        id: EStepAction.SCHEDULE_REMINDER,
        title: 'Schedule reminder',
        description: `Schedule the email communication as a reminder, based on a calendar event for the property.<br style="display: block; margin-top: 8px; content: ''" /> Use this to send the tenant a reminder 3 days before an inspection is due.`,
        illustration: 'communication-steps/schedule-reminder.png'
      },
      {
        id: EStepAction.SEND_CONVERSATION_FILES,
        title: 'Send conversation files',
        description: `Select a file (PDF, image, document) that has been received on a conversation thread within that task.<br style="display: block; margin-top: 8px; content: ''" /> Use this to select multiple quote PDFs received from suppliers and forward to a landlord.`,
        illustration: 'communication-steps/send-conversation-files.png'
      },
      {
        id: EStepAction.SEND_REQUEST,
        title: 'Send request',
        description: `Attach details and photos from the ‘Request Summary’ widget to your email communication.<br style="display: block; margin-top: 8px; content: ''" /> Use this to forward a maintenance request, with photos, to a landlord or supplier.`,
        alertText:
          'You must have the ‘AI Request Summary’ feature turned on in your task settings to use this step.',
        illustration: 'communication-steps/send-request.png'
      },
      {
        id: EStepAction.SEND_CONTACT_CARD,
        title: 'Send contact card',
        description: `Attach a contact card to your email communication.<br style="display: block; margin-top: 6px; content: ''" /> Use this to send a supplier contact details of the tenant.`,
        illustration: 'communication-steps/send-contact-card.png'
      },
      {
        id: EStepAction.SEND_CALENDAR_EVENT,
        title: 'Send calendar event',
        description: `Attach a calendar invite to your email communication.<br style="display: block; margin-top: 6px; content: ''" /> Use this to send the tenant a calendar invite for a routine inspection.`,
        illustration: 'communication-steps/send-calendar-event.png'
      }
    ]
  },
  {
    groupStepsTitle: 'Advanced',
    steps: [
      {
        id: EStepAction.CAPTURE_LEASE_TERMS,
        title: 'Capture lease terms',
        description: `Input lease terms such as dates and rental amount.<br style="display: block; margin-top: 6px; content: ''" /> Use this to send the tenant or landlord suggested or approved lease terms.`,
        illustration: 'communication-steps/capture-lease-terms.png'
      },
      {
        id: EStepAction.CAPTURE_CONDITIONS_FOR_REQUEST_APPROVAL,
        title: 'Capture conditions for request approval',
        description: `Input conditions for the approval of a request, for example a pet request.<br style="display: block; margin-top: 6px; content: ''" /> Use this to update the tenant if request approved.`,
        illustration:
          'communication-steps/capture-conditions-for-request-approval.png'
      },
      {
        id: EStepAction.CAPTURE_PET_BOND,
        title: 'Capture pet bond',
        description: `Input the amount required as a pet bond.<br style="display: block; margin-top: 6px; content: ''" /> Use this to update tenant on pet request.`,
        illustration: 'communication-steps/capture-pet-bond.png'
      },
      {
        id: EStepAction.CAPTURE_INSPECTION_ACTIONS,
        title: 'Capture inspection actions',
        description: `Input inspection notes and action items for both tenants and landlords.<br style="display: block; margin-top: 6px; content: ''" /> Use this to send inspection reports.`,
        illustration: 'communication-steps/capture-inspection-actions.png'
      },
      {
        id: EStepAction.BOND_RETURN_SUMMARY,
        title: 'Bond return summary',
        description: `Input the bond amount returned to tenant and the amount being kept by the landlord.<br style="display: block; margin-top: 6px; content: ''" /> Use this to finalise a tenant vacate.`,
        illustration: 'communication-steps/bond-return-summary.png'
      },
      {
        id: EStepAction.CAPTURE_AMOUNT_OWING_TO_VACATE,
        title: 'Capture amount owing to vacate',
        description: `Input the amount owing to vacate.<br style="display: block; margin-top: 6px; content: ''" /> Use this to finalise a tenant vacate.`,
        illustration: 'communication-steps/capture-amount-owing-to-vacate.png',
        crmSystem: ECRMSystem.PROPERTY_TREE
      },
      {
        id: EStepAction.CAPTURE_AMOUNT_OWING_TO_VACATE,
        title: 'Capture amount owing to vacate',
        description: `Input the amount owing to vacate.<br style="display: block; margin-top: 6px; content: ''" /> Use this to finalise a tenant vacate.`,
        illustration:
          'communication-steps/capture-amount-owing-to-vacate-rm.png',
        crmSystem: ECRMSystem.RENT_MANAGER
      },
      {
        id: EStepAction.CAPTURE_BREAK_LEASE_FEES,
        title: 'Capture break lease fees',
        description: `Input break lease fees.<br style="display: block; margin-top: 6px; content: ''" /> Use this to send tenant cost of breaking lease.`,
        illustration: 'communication-steps/capture-break-lease-fees.png'
      },
      {
        id: EStepAction.NOTICE_TO_LEAVE,
        title: 'Notice to leave',
        description: `Input the reason a tenant is being asked to vacate the property and the vacate date.<br style="display: block; margin-top: 6px; content: ''" /> Use to populate a notice to leave form and send notice to the tenant.`,
        illustration: 'communication-steps/notice-to-leave.png'
      },
      {
        id: EStepAction.LETTING_RECOMMENDATIONS,
        title: 'Letting recommendations',
        description: `Input recommendations on the rental price and lease duration, ahead of a new letting.<br style="display: block; margin-top: 6px; content: ''" /> Use this to confirm advertised price and lease duration with landlord.`,
        illustration: 'communication-steps/letting-recommendations.png'
      },
      {
        id: EStepAction.APPLICATIONS_SHORTLIST,
        title: 'Applications shortlist',
        description: `Input details of the top 3 tenant applications.<br style="display: block; margin-top: 6px; content: ''" /> Use this to send applications shortlist to landlord.`,
        illustration: 'communication-steps/applications-shortlist.png'
      },
      {
        id: EStepAction.BOND_AMOUNT_DUE,
        title: 'Bond amount due',
        description: `Input the bond amount due.<br style="display: block; margin-top: 6px; content: ''" /> Use this to finalise a new tenant.`,
        illustration: 'communication-steps/bond-amount-due.png'
      },
      {
        id: EStepAction.ENTRY_REPORT_DEADLINE,
        title: 'Entry report deadline',
        description: `Input the date an entry report is due.<br style="display: block; margin-top: 6px; content: ''" /> Use this to send tenant details on entry report.`,
        illustration: 'communication-steps/entry-report-deadline.png'
      }
    ]
  }
];
export const PROPERTY_TREE_ACTIONS: IHelpDocument[] = [
  {
    steps: [
      {
        id: EComponentTypes.NOTE,
        title: 'Note',
        description: 'Create or update a note in Property Tree.',
        illustration: 'property-tree-steps/note.png'
      },
      {
        id: EComponentTypes.CREDITOR_INVOICE,
        title: 'Creditor invoice',
        description: 'Create a creditor invoice.',
        illustration: 'property-tree-steps/creditor-invoice.png'
      },
      {
        id: EComponentTypes.TENANCY_INVOICE,
        title: 'Tenancy invoice',
        description: 'Create a tenancy invoice.',
        illustration: 'property-tree-steps/tenancy-invoice.png'
      },
      {
        id: EComponentTypes.MAINTENANCE_REQUEST,
        title: 'Maintenance request',
        description: 'Create a maintenance request.',
        illustration: 'property-tree-steps/maintenance-request.png'
      },
      {
        id: EComponentTypes.MAINTENANCE_INVOICE,
        title: 'Maintenance invoice',
        description: 'Create a maintenance invoice.',
        illustration: 'property-tree-steps/maintenance-invoice.png'
      },
      {
        id: EComponentTypes.ROUTINE_INSPECTION,
        title: 'Routine inspection',
        description: 'Create, or update a routine inspection.',
        illustration: 'property-tree-steps/routine-inspection.png'
      },
      {
        id: EComponentTypes.INGOING_INSPECTION,
        title: 'Ingoing inspection',
        description: 'Create, or update an incoming inspection.',
        illustration: 'property-tree-steps/ingoing-inspection.png'
      },
      {
        id: EComponentTypes.OUTGOING_INSPECTION,
        title: 'Outgoing inspection',
        description: 'Create, or update an outgoing inspection.',
        illustration: 'property-tree-steps/outgoing-inspection.png'
      },
      {
        id: EComponentTypes.LEASE_RENEWAL,
        title: 'Lease renewal',
        description:
          'Add lease renewal details - eg new lease dates, rent schedule.',
        illustration: 'property-tree-steps/lease-renewal.png'
      },
      {
        id: EComponentTypes.VACATE_DETAIL,
        title: 'Vacate details',
        description: 'Add vacate details.',
        illustration: 'property-tree-steps/vacate-details.png'
      },
      {
        id: EComponentTypes.NEW_TENANCY,
        title: 'New tenancy',
        description: 'Add new tenancy contact.',
        illustration: 'property-tree-steps/new-tenancy.png'
      },
      {
        id: EComponentTypes.COMPLIANCE,
        title: 'Compliance item',
        description: 'Create, or update a compliance item.',
        illustration: 'property-tree-steps/compliance-item.png'
      }
    ]
  }
];
export const CALENDAR_EVENTS: IHelpDocument[] = [
  {
    steps: [
      {
        id: ECalendarEvent.BREACH_NOTICE_REMEDY_DATE,
        title: 'Breach notice - Remedy date',
        description: 'Create a calendar event for a breach remedy date.',
        illustration: 'calendar-steps/breach-notice.png'
      },
      {
        id: ECalendarEvent.ENTRY_NOTICE_ENTRY_DATE,
        title: 'Entry notice - Entry date',
        description: 'Create a calendar event for a property entry date.',
        illustration: 'calendar-steps/entry-notice.png'
      },
      {
        id: ECalendarEvent.CUSTOM_EVENT,
        title: 'Custom event',
        description: 'Schedule a calendar event with a custom event title.',
        illustration: 'calendar-steps/custom-event.png'
      }
    ]
  }
];
export const RENT_MANAGER: IHelpDocument[] = [
  {
    steps: [
      {
        id: EComponentTypes.NOTE,
        title: 'Notes',
        description: 'Create or update a note in Rent Manager.',
        illustration: 'rent-manager/notes.png'
      },
      {
        id: EComponentTypes.ISSUE,
        title: 'Issue',
        description: 'Create or update an issue in Rent Manager.',
        illustration: 'rent-manager/issue.png'
      },
      {
        id: EComponentTypes.INSPECTION,
        title: 'Inspection',
        description: 'Create, or update an inspection.',
        illustration: 'rent-manager/inspection.svg'
      },
      {
        id: EComponentTypes.LEASE_RENEWAL,
        title: 'Lease renewal',
        description:
          'Add lease renewal details - eg new lease dates and rental amount.',
        illustration: 'rent-manager/lease-renewal.png'
      },
      {
        id: EComponentTypes.VACATE_DETAIL,
        title: 'Vacate details',
        description: 'Add vacate details.',
        illustration: 'rent-manager/vacate-details.png'
      },
      {
        id: EComponentTypes.NEW_TENANT,
        title: 'New tenant',
        description: 'Add new tenant details',
        illustration: 'rent-manager/new-tenant.png'
      }
    ]
  }
];
