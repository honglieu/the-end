import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { UserType } from '@services/constants';

export const DEBOUNCE_DASHBOARD_TIME = 300;

export const SCROLL_THRESHOLD = 200;

export const LIMIT_TASK_LIST = 20;

export const DEBOUNCE_SOCKET_TIME = 500;
export const SCROLL_THRESHOLD_TABLE = 100;
export const DEBOUNCE_TIME_QUERY_PARAMS = 100;

export const TIME_NOW = 'now';

export const NZ_OPTIONS_CONFIG = {
  NZ_SELECT_OPTIONS_HEIGHT: 45,
  NZ_LIMIT_OPTIONS: 7
};

export const CONSOLE_USERS = [
  UserType.ADMIN,
  UserType.AGENT,
  UserType.SUPERVISOR
];

export const USER_TYPE_IN_RM = {
  TENANT_PROPERTY: 'Tenant (property)',
  TENANT_UNIT: 'Tenant (unit)',
  TENANT_PROSPECT: 'Tenant prospect',
  LANDLORD_PROSPECT: 'Owner prospect',
  LANDLORD: 'Owner'
};

export const USER_TYPE = {
  ...USER_TYPE_IN_RM,
  EXTERNAL: 'External email'
};

export const IntegrationContentOptions = {
  [ECRMSystem.RENT_MANAGER]: {
    description:
      'Rent Manager is advanced software designed to be completely self-contained with a powerful property management database, integrated accounting, contact management, work orders, making solutions, and much more.',
    linkContent: 'How to integrate with Rent Manager',
    helpCentreLink:
      'https://support.trudi.ai/hc/en-au/articles/24218029190553-How-can-I-integrate-Rent-Manager-with-Trudi-',
    icon: {
      name: 'rentManager',
      styles: { width: '127.12px' }
    }
  },
  [ECRMSystem.PROPERTY_TREE]: {
    description:
      'MRI Property Tree is one of the leading cloud property management and trust accounting software for real estate agencies in Australia and New Zealand.',
    linkContent: 'How to integrate with Property Tree',
    helpCentreLink:
      'https://support.trudi.ai/hc/en-au/articles/24440371997721-How-can-I-integrate-Property-Tree-with-Trudi-',
    icon: {
      name: 'propertyTreeLogo',
      styles: { width: '106.95px' }
    }
  }
};
export const LINK_DESKTOP_APP = {
  Windows: {
    US: 'https://apps.microsoft.com/detail/trudi®/9NRX5K8BHNSN',
    AU: 'https://apps.microsoft.com/detail/trudi-portal/9P3DQ8CR6WGD'
  },
  MacOS: {
    US: 'https://apps.apple.com/us/app/trudi/id6468665490',
    AU: 'https://apps.apple.com/au/app/trudi/id1670886527'
  }
};
