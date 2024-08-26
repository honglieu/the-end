import {
  EButtonAction,
  ERentManagerAction
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';

export const TASK_ARCHIVED = 'Task archived';
export const TASK_PUBLISHED = 'Task published';
export const TASK_MOVE_TO_DRAFT = 'Task moved to draft';

export const TASK_TEMPLATE_ARCHIVED = 'Task template archived';
export const TASK_TEMPLATE_PUBLISHED = 'Task template published';
export const TASK_TEMPLATE_MOVE_TO_DRAFT = 'Task template moved to draft';
export const REGEX_PARAM_TASK_EDITOR = /\$?\b\w*_\w*\b|via this link\b/g;

export const DisplayConflictStepText = {
  DYNAMIC_TYPE:
    'Email template contains dynamic field that does not exist in workflow',
  SEND_TO: 'The contact is not available',
  EVENT: 'The calendar event is not available',
  CONTACT_TYPE: 'The contact is not available',
  COMPONENT_ACTION: 'The component is not available'
};

export const ECrmSystemId = {
  PROPERTY_TREE: '61330183-0a96-484d-8cf8-4b94ececb323',
  PROPERTY_ME: '35619e3b-37f2-4d85-aeae-ecc3cc6fdf11',
  RENT_MANAGER: '59a6835d-70e8-4f98-9e2d-e6a3c997f9da',
  CONSOLE_CLOUD: 'cc4fedff-9cfa-4b9d-bb44-4ac7c2601770',
  PMX: '0f8c7dc2-11bb-4645-9a8b-c864e1cef4ea'
};

export const CRM_COMPONENT_ACTION = {
  [ECrmSystemId.PROPERTY_TREE]: {
    new: EButtonAction.PT_NEW_COMPONENT,
    update: EButtonAction.PT_UPDATE_COMPONENT
  },
  [ECrmSystemId.RENT_MANAGER]: {
    new: ERentManagerAction.RM_NEW_COMPONENT,
    update: ERentManagerAction.RM_UPDATE_COMPONENT
  }
};
