import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  EPropertyTreeContactType,
  ERentManagerContactType,
  EStepAction
} from './../enums/task-editor.enums';

export const STEP_TYPE_DATA = [
  {
    id: EStepAction.SEND_BASIC_EMAIL,
    label: 'Send basic email',
    type: 'BASIC'
  },
  {
    id: EStepAction.SEND_ATTACHMENT,
    label: 'Send attachment',
    type: 'BASIC'
  },
  {
    id: EStepAction.SCHEDULE_REMINDER,
    label: 'Schedule reminder',
    type: 'BASIC'
  },
  {
    id: EStepAction.SEND_CONVERSATION_FILES,
    label: 'Send conversation files',
    type: 'BASIC'
  },
  {
    id: EStepAction.SEND_REQUEST,
    label: 'Send request',
    type: 'BASIC'
  },
  {
    id: EStepAction.SEND_CONTACT_CARD,
    label: 'Send contact card',
    type: 'BASIC'
  },
  {
    id: EStepAction.CAPTURE_LEASE_TERMS,
    label: 'Capture lease terms',
    type: 'ADVANCE'
  },
  {
    id: EStepAction.CAPTURE_CONDITIONS_FOR_REQUEST_APPROVAL,
    label: 'Capture conditions for request approval',
    type: 'ADVANCE'
  },
  {
    id: EStepAction.SEND_CALENDAR_EVENT,
    label: 'Send calendar event',
    type: 'BASIC'
  },
  {
    id: EStepAction.CAPTURE_PET_BOND,
    label: 'Capture pet bond',
    type: 'ADVANCE'
  },
  {
    id: EStepAction.CAPTURE_INSPECTION_ACTIONS,
    label: 'Capture inspection actions',
    type: 'ADVANCE'
  },
  {
    id: EStepAction.BOND_RETURN_SUMMARY,
    label: 'Bond return summary',
    type: 'ADVANCE'
  },
  {
    id: EStepAction.CAPTURE_AMOUNT_OWING_TO_VACATE,
    label: 'Capture amount owing to vacate',
    type: 'ADVANCE'
  },
  {
    id: EStepAction.CAPTURE_BREAK_LEASE_FEES,
    label: 'Capture break lease fees',
    type: 'ADVANCE'
  },
  {
    id: EStepAction.NOTICE_TO_LEAVE,
    label: 'Notice to leave',
    type: 'ADVANCE'
  },
  {
    id: EStepAction.LETTING_RECOMMENDATIONS,
    label: 'Letting recommendations',
    type: 'ADVANCE'
  },
  {
    id: EStepAction.APPLICATIONS_SHORTLIST,
    label: 'Applications shortlist',
    type: 'ADVANCE'
  },
  {
    id: EStepAction.BOND_AMOUNT_DUE,
    label: 'Bond amount due',
    type: 'ADVANCE'
  },
  {
    id: EStepAction.ENTRY_REPORT_DEADLINE,
    label: 'Entry report deadline',
    type: 'ADVANCE'
  }
];

export const generateStepTypeData = (crm: ECRMSystem) => {
  let disabledStep = [];
  return STEP_TYPE_DATA.map((item) => {
    if (disabledStep.includes(item.id)) {
      return {
        ...item,
        disabled: true
      };
    }
    return item;
  });
};

export const generateSendToData = (
  crm: ECRMSystem,
  isSendTo?: boolean,
  isShowToText: boolean = true
) => {
  let result = [];

  switch (crm) {
    case ECRMSystem.PROPERTY_TREE:
      result = [
        {
          id: EPropertyTreeContactType.ALL_ACTIVE_LANDLORDS,
          label: 'All active owners'
        },
        {
          id: EPropertyTreeContactType.ALL_PROSPECTIVE_TENANTS,
          label: 'All prospective tenants'
        },
        {
          id: EPropertyTreeContactType.ALL_ACTIVE_TENANTS,
          label: 'All active tenants'
        },
        {
          id: EPropertyTreeContactType.ALL_VACATING_TENANTS,
          label: 'All vacating tenants'
        },
        {
          id: EPropertyTreeContactType.ALL_VACATED_TENANTS,
          label: 'All vacated tenants'
        },
        {
          id: EPropertyTreeContactType.ANY_LANDLORD_IN_TASK,
          label: 'Any owner in task',
          subLabel: '(previous conversation must exist in task)'
        },
        {
          id: EPropertyTreeContactType.ANY_TENANT_IN_TASK,
          label: 'Any tenant in task',
          subLabel: '(previous conversation must exist in task)'
        },
        {
          id: EPropertyTreeContactType.ANY_SUPPLIER_IN_TASK,
          label: 'Any supplier in task',
          subLabel: '(previous conversation must exist in task)'
        }
      ];
      break;
    case ECRMSystem.RENT_MANAGER:
      result = [
        {
          id: ERentManagerContactType.ALL_CURRENT_LANDLORDS,
          label: 'All current owners'
        },
        {
          id: ERentManagerContactType.ALL_FUTURE_LANDLORDS,
          label: 'All future owners'
        },
        {
          id: ERentManagerContactType.ALL_PAST_LANDLORDS,
          label: 'All past owners'
        },
        {
          id: ERentManagerContactType.ALL_CURRENT_TENANTS,
          label: 'All current tenants'
        },
        {
          id: ERentManagerContactType.ALL_FUTURE_TENANTS,
          label: 'All future tenants'
        },
        {
          id: ERentManagerContactType.ALL_PAST_TENANTS,
          label: 'All past tenants'
        },
        {
          id: ERentManagerContactType.ANY_LANDLORD_IN_TASK,
          label: 'Any owner in task',
          subLabel: '(previous conversation must exist in task)'
        },
        {
          id: ERentManagerContactType.ANY_TENANT_IN_TASK,
          label: 'Any tenant in task',
          subLabel: '(previous conversation must exist in task)'
        },
        {
          id: ERentManagerContactType.ANY_TENANT_PROSPECT_IN_TASK,
          label: 'Any tenant prospect in task',
          subLabel: '(previous conversation must exist in task)'
        },
        {
          id: ERentManagerContactType.ANY_LANDLORD_PROSPECT_IN_TASK,
          label: 'Any owner prospect in task',
          subLabel: '(previous conversation must exist in task)'
        },
        {
          id: ERentManagerContactType.ANY_SUPPLIER_IN_TASK,
          label: 'Any supplier in task',
          subLabel: '(previous conversation must exist in task)'
        }
      ];
      break;
    default:
      break;
  }

  if (isSendTo) {
    result = result.map((r) => ({
      ...r,
      label: isShowToText ? `To: ${r.label}` : r.label
    }));
  }
  return result;
};
