import {
  EPropertyTreeContactType,
  ERentManagerContactType
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { EUserPropertyType } from '@shared/enum/user.enum';

export const MAP_TYPE_RECEIVER_TO_LABEL = {
  [ERentManagerContactType.ALL_CURRENT_LANDLORDS]: 'All current owners',
  [ERentManagerContactType.ALL_FUTURE_LANDLORDS]: 'All future owners',
  [ERentManagerContactType.ALL_PAST_LANDLORDS]: 'All past owners',
  [ERentManagerContactType.ALL_CURRENT_TENANTS]: 'All current tenants',
  [ERentManagerContactType.ALL_FUTURE_TENANTS]: 'All future tenants',
  [ERentManagerContactType.ALL_PAST_TENANTS]: 'All past tenants',

  [EPropertyTreeContactType.ALL_ACTIVE_LANDLORDS]: 'All active owners',
  [EPropertyTreeContactType.ALL_PROSPECTIVE_TENANTS]: 'All prospective tenants',
  [EPropertyTreeContactType.ALL_ACTIVE_TENANTS]: 'All active tenants',
  [EPropertyTreeContactType.ALL_VACATING_TENANTS]: 'All vacating tenants',
  [EPropertyTreeContactType.ALL_VACATED_TENANTS]: 'All vacated tenants',
  [ERentManagerContactType.ANY_TENANT_PROSPECT_IN_TASK]:
    'Any tenant prospect in task',
  [ERentManagerContactType.ANY_LANDLORD_PROSPECT_IN_TASK]:
    'Any owner prospect in task',

  [ERentManagerContactType.ANY_LANDLORD_IN_TASK]: 'Any owner in task',
  [ERentManagerContactType.ANY_TENANT_IN_TASK]: 'Any tenant in task',
  [ERentManagerContactType.ANY_SUPPLIER_IN_TASK]: 'Any supplier in task'
};

export const MAP_TYPE_RECEIVER_TO_SUBLABEL = {
  [ERentManagerContactType.ANY_TENANT_PROSPECT_IN_TASK]:
    '(previous conversation must exist in task)',
  [ERentManagerContactType.ANY_LANDLORD_PROSPECT_IN_TASK]:
    '(previous conversation must exist in task)',

  [ERentManagerContactType.ANY_LANDLORD_IN_TASK]:
    '(previous conversation must exist in task)',
  [ERentManagerContactType.ANY_TENANT_IN_TASK]:
    '(previous conversation must exist in task)',
  [ERentManagerContactType.ANY_SUPPLIER_IN_TASK]:
    '(previous conversation must exist in task)'
};

export const MAP_TYPE_RECEIVER_TO_DISPLAY = {
  [EUserPropertyType.TENANT_PROSPECT]: 'TENANT PROSPECT',
  [EUserPropertyType.LANDLORD_PROSPECT]: 'OWNER PROSPECT',
  [EUserPropertyType.LANDLORD]: EUserPropertyType.OWNER,
  [EUserPropertyType.TENANT_RM]: 'TENANT'
};

export const MAP_GROUP_TYPE_RECEIVER_TO_DISPLAY = {
  ...MAP_TYPE_RECEIVER_TO_DISPLAY,
  [EUserPropertyType.OTHER]: 'OTHER CONTACTS'
};

export const emptyUUID = '00000000-0000-0000-0000-000000000000';

export const EMPTY_MESSAGE =
  '<em style="color: #999999;">No preview is available</em>';

export const FAKE_LOADING_LIST_PROPERTIES = {
  id: '',
  streetline: '',
  address: '',
  country: '',
  createdAt: '',
  postCode: '',
  state: '',
  status: '',
  streetNumber: '',
  suburb: '',
  unitNo: '',
  unreadcount: '',
  updatedAt: '',
  region: {
    id: '',
    name: ''
  },
  disabled: true
};
