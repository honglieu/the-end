import { ConnectionPositionPair } from '@angular/cdk/overlay';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { IInvoiceStatus } from '@shared/types/invoice.interface';
import { InvoiceStatus } from '@shared/enum/tenancy-invoicing.enum';
import { ETenantVacateButtonAction } from '@/app/tenant-vacate/utils/tenantVacateType';
import { BreachNoticeRequestButtonAction } from '@/app/breach-notice/utils/breach-notice.enum';
import { CreditorInvoicingButtonAction } from '@shared/enum/creditor-invoicing.enum';
import { EStepAction } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { RoutineInspectionButtonAction } from '@shared/enum/routine-inspection.enum';
import { EEventType } from '@shared/enum/calendar.enum';
import { EToastType } from '@/app/toast/toastType';

export const maintenanceTopicId = '4ca38f67-4a4e-41ad-b834-4d529f283091';

export const trudiUserId = 'ecf293b8-4cce-49dd-9cb0-b4f391aaee59';
export const NO_PORTFOLIO_USER_ID = '469697d2-bcf2-42c2-8a64-806a7811401e';
export const documentTypeQuoteId = '33db2b6c-5f88-4323-8dad-f0682838e5f4';
export const documentTypeInvoiceId = '34db2b6c-5f88-4323-8dad-f0682838e5f4';
export const defaultGuid = '00000000-0000-0000-0000-000000000000';

export const uuidv4Regex = new RegExp(
  '/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/'
);
export const listImageTypeDot = ['.png', '.jpeg', '.webp', '.gif', '.jpg'];
export const AREA_IMAGE_VALID_TYPE = [
  '.png',
  '.jpeg',
  '.bmp',
  '.gif',
  '.jpg',
  '.tif',
  '.tiff'
];
export const listAgencyLogoTypeDot = ['.png', '.jpeg'];
export const listVideoTypeDot = [
  '.mp4',
  '.3gpp',
  '.wmv',
  '.avi',
  '.mov',
  '.3gp'
];
export const listAudioTypeDot = ['.mp3'];
export const listDocumentTypeDot = [
  '.docx',
  '.pdf',
  '.doc',
  '.xls',
  '.xlsx',
  '.xlsm'
];
export const listCalendarTypeDot = ['.ics', '.ical'];

export const listVideoTypeSlash = [
  '/quicktime',
  '/mp4',
  '/3gpp',
  '/x-msvideo',
  '/x-ms-wmv',
  '/avi',
  '/mov'
];
export const listImageTypeSlash = ['/png', '/jpeg', '/webp', '/gif', '/jpg'];
export const listAudioTypeSlash = ['/mp3', '/mpeg'];
export const listThumbnailExtension = ['photo', 'video', 'audio', 'file'];
export const base64PNGImagePrefix = 'data:image/png;base64,';

export const listFileDisplayThumbnail = ['.mp4', '.3gp', '.mov'];
export const listPhotoDisplayThumbnail = [
  '.png',
  '.jpeg',
  '.webp',
  '.gif',
  '.jpg',
  '.bmp'
];

export const LIST_ATTACH_TYPE_USER_DEFINED = [
  '.pdf',
  '.png',
  '.xlsx',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.ppt',
  '.bevm',
  '.bpm',
  '.csc',
  '.eml',
  '.gif',
  '.htm',
  '.html',
  '.iif',
  '.msg',
  '.pptx',
  '.rmaw',
  '.rmct',
  '.rmd',
  '.rmf',
  '.rmt',
  '.rmsb',
  '.rmtx',
  '.rrtx',
  '.rtf'
];
export const LIST_IMAGE_TYPE_USER_DEFINED = [
  '.png',
  '.jpg',
  '.tif',
  '.jpeg',
  '.gif',
  '.bmp',
  '.tiff'
];

export const ACCEPT_ONLY_SUPPORTED_FILE = [
  ...listImageTypeDot,
  ...listVideoTypeDot,
  ...listAudioTypeDot,
  ...listDocumentTypeDot,
  ...listCalendarTypeDot
].join(', ');

export const ACCEPT_ONLY_SUPPORTED_FILE_WHATSAPP = [
  ...['.png', '.jpeg', '.webp', '.jpg'],
  ...['.mp3'],
  ...['.pdf', '.doc', '.docx', '.pptx', '.xlsx'],
  ...['.mp4'],
  ...['.vcf']
].join(', ');

export const MAILBOX_VALID_FILE_TYPE = ['eml', 'msg'];
export const HISTORY_NOTES_FILE_VALID_TYPE = [
  'pdf',
  'png',
  'xlsx',
  'doc',
  'docx',
  'jpg',
  'jpeg',
  'ppt',
  'bevm',
  'bpm',
  'csc',
  'eml',
  'gif',
  'htm',
  'html',
  'iif',
  'msg',
  'pptx',
  'rmaw',
  'rmct',
  'rmd',
  'rmf',
  'rmt',
  'rmsb',
  'rmtx',
  'rrtx',
  'rtf'
]
  .map((item) => '.' + item)
  .join(', ');

export const FILE_VALID_TYPE = ACCEPT_ONLY_SUPPORTED_FILE.split(', ').map(
  (item) => item.replace(/\./g, '')
);

export const FILE_VALID_TYPE_WHATSAPP =
  ACCEPT_ONLY_SUPPORTED_FILE_WHATSAPP.split(', ').map((item) =>
    item.replace(/\./g, '')
  );

export const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/jpg',
  'video/mp4',
  'video/wmv',
  'video/x-ms-wmv',
  'video/quicktime',
  'video/avi',
  'video/mov',
  'video/3gp',
  'video/3gpp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'audio/mpeg',
  'audio/mp3',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroenabled.12',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
// mapping follow https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
// or https://www.contractsfinder.service.gov.uk/apidocumentation/ResourceModel?modelName=FileType
// also follow backend support
export const MIME_TYPE_MAPPING: Record<string, string> = {
  //document
  doc: 'application/msword',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  //audio
  mp3: 'audio/mp3',
  mpeg: 'audio/mpeg',

  //image
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  ics: 'text/calendar',

  //video
  '3gp': 'video/3gpp',
  avi: 'video/avi',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  wmv: 'video/x-ms-wmv',

  //excel file
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xlsm: 'application/vnd.ms-excel.sheet.macroenabled.12',
  xls: 'application/vnd.ms-excel'
};

export const ACCEPT_ONLY_SUPPORTED_FILE_REIFORM = listDocumentTypeDot.map(
  (item) => item.replace(/\./g, '')
);
export const REIFORM_SUPPORTED_FILE_ACCEPT = listDocumentTypeDot.join(', ');

export const ACCEPT_ONLY_PDF = ['.pdf'];
export const LINEFEED_START_END_PATTERN = /^\s+|\s+$/g;
export const consoleUserRole = ['agent', 'admin', 'supervisor', 'lead'];
export const CONVERSATION_STATUS = {
  ALL: 'ALL',
  OPEN: 'OPEN',
  ARCHIVE: 'ARCHIVE',
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  SCHEDULE: 'SCHEDULE',
  SOLVED: 'SOLVED',
  LOCKED: 'LOCKED',
  AGENT_EXPECTATION: 'AGENT_EXPECTATION',
  REOPEN: 'REOPEN',
  AGENT_JOIN: 'AGENT_JOIN'
};

export const CONVERSATION_ASSIGNED_TO = {
  ALL: 'ALL',
  AGENT: 'AGENT',
  TRUDI: 'TRUDI'
};

export const SUPPORTED_FILE_CAROUSEL = [
  ...listImageTypeDot,
  ...listVideoTypeDot,
  ...listAudioTypeDot,
  ...listDocumentTypeDot
].map((item) => item.replace(/\./g, ''));

export const SYNC_PT_FAIL = 'Fail to sync';
export const SYNC_PT_SUCCESSFULLY = 'Synced successfully';
export const SYNC_FAILED = 'Sync failed';

export const NO_PROPERTY = 'No property';

export const DEBOUNCE_SOCKET_TIME = 500;

export const DEFAULT_TEXT_MESS_HEIGHT = 32;

export const MAX_TEXT_MESS_LENGTH = 2000;

export const MAX_TEXT_NOTE_LENGTH = 4000;

export const MAX_TITLE_LENGTH = 75;

export const MAX_INPUT_URL_LENGTH = 255;

export const LAZY_LOAD_TASK = 50;

export const CALL_TYPE = 'CALL_TYPE';

export const VIDEO_CALL_DATA = 'VIDEO_CALL_DATA';

export const LAZY_LOAD_CALENDAR = 250;

export const DEFAULT_CHAR_TRUDI_NUMBER_FIELD = 13;

export const DEFAULT_CHAR_TRUDI_TEXTAREA_FIELD = 300;

export const MAX_FILE_SIZE = 25;

export type OverlayPositionType =
  | 'top'
  | 'topCenter'
  | 'topLeft'
  | 'topRight'
  | 'right'
  | 'rightTop'
  | 'rightBottom'
  | 'bottom'
  | 'bottomCenter'
  | 'bottomLeft'
  | 'bottomRight'
  | 'left'
  | 'leftTop'
  | 'leftBottom';

export const POSITION_MAP: {
  [key in OverlayPositionType]: ConnectionPositionPair;
} = {
  top: new ConnectionPositionPair(
    { originX: 'center', originY: 'top' },
    { overlayX: 'center', overlayY: 'bottom' }
  ),
  topCenter: new ConnectionPositionPair(
    { originX: 'center', originY: 'top' },
    { overlayX: 'center', overlayY: 'bottom' }
  ),
  topLeft: new ConnectionPositionPair(
    { originX: 'start', originY: 'top' },
    { overlayX: 'start', overlayY: 'bottom' }
  ),
  topRight: new ConnectionPositionPair(
    { originX: 'end', originY: 'top' },
    { overlayX: 'end', overlayY: 'bottom' }
  ),
  right: new ConnectionPositionPair(
    { originX: 'end', originY: 'center' },
    { overlayX: 'start', overlayY: 'center' }
  ),
  rightTop: new ConnectionPositionPair(
    { originX: 'end', originY: 'top' },
    { overlayX: 'start', overlayY: 'top' }
  ),
  rightBottom: new ConnectionPositionPair(
    { originX: 'end', originY: 'bottom' },
    { overlayX: 'start', overlayY: 'bottom' }
  ),
  bottom: new ConnectionPositionPair(
    { originX: 'center', originY: 'bottom' },
    { overlayX: 'center', overlayY: 'top' }
  ),
  bottomCenter: new ConnectionPositionPair(
    { originX: 'center', originY: 'bottom' },
    { overlayX: 'center', overlayY: 'top' }
  ),
  bottomLeft: new ConnectionPositionPair(
    { originX: 'start', originY: 'bottom' },
    { overlayX: 'start', overlayY: 'top' }
  ),
  bottomRight: new ConnectionPositionPair(
    { originX: 'end', originY: 'bottom' },
    { overlayX: 'end', overlayY: 'top' }
  ),
  left: new ConnectionPositionPair(
    { originX: 'start', originY: 'center' },
    { overlayX: 'end', overlayY: 'center' }
  ),
  leftTop: new ConnectionPositionPair(
    { originX: 'start', originY: 'top' },
    { overlayX: 'end', overlayY: 'top' }
  ),
  leftBottom: new ConnectionPositionPair(
    { originX: 'start', originY: 'bottom' },
    { overlayX: 'end', overlayY: 'bottom' }
  )
};

export const FEATURE_LIST = [
  {
    label: 'Shared mailboxes',
    toolTipText:
      'Allows team member collaboration across the same email account. Assign messages and tasks to track work across your team.'
  },
  {
    label: 'Automated enquiry handling',
    toolTipText:
      'Automatic contact recognition and assignment to the correct team member.'
  },
  {
    label: 'AI-generated replies',
    toolTipText:
      'With consideration of regional legislation, your own company policies and tenancy-related data, Trudi® is trained to generate replies to even the most complex enquiries from tenants, owners and suppliers. '
  },
  {
    label: 'Send emails from company email address',
    toolTipText:
      'Send emails from your own email domain - so your customers know that it’s you.'
  },
  {
    label: 'Tasks',
    toolTipText:
      'Powerful workflows for every essential property management task.'
  },
  {
    label: 'Smart invoices & forms',
    toolTipText:
      'Save time with invoicing - Trudi® scans your invoice PDFs and automatically extracts the relevant data ready for you to check. Trudi® integrates with your form provider so you can create, send and track signatures on forms, straight from your inbox.'
  },
  {
    label: 'Calendar & reminders',
    toolTipText:
      'A holistic view of your portfolio events in a single calendar view. Control which reminders you receive for key events such as lease renewals and inspections.'
  },
  {
    label: '3rd party integrations',
    toolTipText: 'Integrates with your favorite 3rd party software'
  },
  {
    label: 'Language translation',
    toolTipText:
      'Have Trudi® translate any enquiries received in different languages.'
  },
  {
    label: 'Insights',
    toolTipText:
      'Get insights on how your team are performing and efficiency gains from using Trudi®'
  },
  {
    label: 'Outgoing calls & transcripts',
    toolTipText:
      'Placing calls through the Trudi® platform ensures that every phone call is transcribed into text and saved as a PDF for your records.'
  },
  {
    label: 'Voicemail',
    toolTipText:
      'Have Trudi® take a voicemail message to keep you focused throughout the day.'
  },
  {
    label: 'Tenant App',
    toolTipText:
      'Your own tenant app for tenants. Customized with your company’s branding.'
  },
  {
    label: 'Support',
    toolTipText: 'Our team is here to help.'
  }
];
export const STATER_LIST = [
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: '',
    label: 'Limited per month'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'iconCloseV2',
    label: null,
    class: 'close-icon'
  },
  {
    iconName: 'iconCloseV2',
    label: null,
    class: 'close-icon'
  },
  {
    iconName: 'iconCloseV2',
    label: null,
    class: 'close-icon'
  },
  {
    iconName: 'iconCloseV2',
    label: null,
    class: 'close-icon'
  },
  {
    iconName: 'iconCloseV2',
    label: null,
    class: 'close-icon'
  },
  {
    iconName: '',
    label: 'Email only'
  }
];
export const PRO_LIST = [
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: '',
    label: 'Unlimited'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: '',
    label: 'Customize task workflows'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'iconCloseV2',
    label: null,
    class: 'close-icon'
  },
  {
    iconName: 'iconCloseV2',
    label: null,
    class: 'close-icon'
  },
  {
    iconName: '',
    label: 'Phone + email support'
  }
];
export const ELITE_LIST = [
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: '',
    label: 'Unlimited'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: '',
    label: 'Customize task workflows'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: '',
    label: 'Bespoke integrations'
  },
  {
    iconName: 'check',
    label: null,
    class: 'close-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'close-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'close-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: 'check',
    label: null,
    class: 'check-icon'
  },
  {
    iconName: '',
    label: 'Dedicated support manager'
  }
];
export const SELECT_PEOPLE_POPUP_OPEN_FROM = {
  conv: 'conversation',
  file: 'file',
  tic: 'ticket',
  task: 'task',
  trudi: 'trudi',
  appChat: 'appChat',
  email: 'email',
  index: 'index'
};

export const POPUP_FORWARD_LANDLORD_LIKE_TO_SAY = {
  askForApproval: 'Ask for approval to repair under $380 expenditure limit',
  adviseQuotes: 'Advise that quotes will be obtained (no call-out-fee)',
  requestApproval: 'Request approval to obtain quotes with call-out-fee',
  confirmPlans: 'Confirm if landlord plans to attend to maintenance himself'
};

export const SEND_MESSAGE_POPUP_OPEN_FROM = {
  user: 'user',
  userIndex: 'user-index',
  file: 'file',
  appChat: 'appChat',
  conv: 'conversation',
  trudi: 'trudi',
  sidebar: 'sidebar'
};
export const DAY_NOT_REPLY = 1;
export const PHONE_NUMBER_START_GROUP_1 = /^(\d{1})(\d{4})(\d{4})$/;
export const PHONE_NUMBER_START_GROUP_2 = /^(\d{2})(\d{4})(\d{4})$/;
export const PHONE_NUMBER_START_GROUP_3 = /(\d{3})(\d{3})(\d{4})/;
export const PHONE_NUMBER_START_GROUP_4 = /^(\d{4})(\d{3})(\d{3})$/;
export const PHONE_NUMBER_START_4_GROUP_3 = /(\d{3})(\d{3})(\d{3})/;
export const PHONE_NUMBER_START_3_GROUP_4 =
  /(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,3})/;
export const PHONE_NUMBER_PATTERN_04 = '0000 000 000';
export const PHONE_NUMBER_PATTERN_4 = '000 000 0000';
export const PHONE_NUMBER_PATTERN_05 = '000 000 0000 0000 0000 000';
export const PHONE_NUMBER_PATTERN_OTHER = '00 0000 0000';
export const PHONE_NUMBER_PATTERN_9 = '0 0000 00000';
export const PHONE_NUMBER_PATTERN_DEFAULT = '0000000000';
export const PHONE_NUMBER_PATTERN_US = '(000) 000-0000||(00)||(0)';
export const BSB_PATTERN = '999 999';
export const ACCOUNT_NUMBER_PATTERN = '999 999 999 999 999 99';

export const AMOUNT_EXCLUDING_EST = /^0+$/;

export const READONLY_FILE = { pdf: 'application/pdf' };

export const DEFAULT_DATE_FORMAT_DAYJS = 'DD/MM/YYYY';
export const TIME_FORMAT = 'hh:mm a';
export const SHORT_ISO_DATE = 'YYYY-MM-DD';
export const SHORT_ISO_TIME_FORMAT = 'HH:mm:ss';
export const INVALID_DATE = 'invalid date';
export const CURRENCYNUMBER = 'separator.2';
export const DECIMAL_NUMBER = 'separator';
export const TIME_ZONE_UTC = 'UTC';

export const MAX_ITEM_OVERLAP_DISPLAY = 2;

export const AGENT_MANAGEMENT_ROLE_ARRAY = [
  {
    id: 'ADMIN',
    text: 'Administrator'
  },
  {
    id: 'SUPERVISOR',
    text: 'Supervisor'
  },
  {
    id: 'AGENT',
    text: 'Agent'
  }
];

export const PASSWORD_PATTERN =
  /(?=.*[a-z])(?=.*[A-Z])((?=.*\d|[A-Za-z\d#$@!%&*?]))((?=.*[#$@!%&*?])|[A-Za-z\d#$@!%&*?]){8,30}/;
// code regex projected to change PASSWORD_PATTERN: ^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9$@!%&*?]).{8,30}$;
export const URL_PATTERN = new RegExp(
  '^(https?:\\/\\/)?' +
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
    '((\\d{1,3}\\.){3}\\d{1,3}))' +
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
    '(\\?[;&a-z\\d%_.~+=-]*)?' +
    '(\\#[-a-z\\d_]*)?$',
  'i'
);

export const PROTOCOL = 'https://';
export const AREA_CODE_PHONE_NUMBER = '+61';

export const WORD_ONLY = /^[A-Z a-z]+$/;
export const BSD_PATTERN_LIMIT = /^[0-9]{6}$/;
export const BSD_PATTERN_FORMAT = /^[0-9]{3} [0-9]{3}$/;
export const ACCOUNT_NUMBER_PATTERN_LIMIT = /^[0-9]{6,17}$/;
export const ACCOUNT_NUMBER_PATTERN_FORMAT = /^[0-9]{4} [0-9]{4} [0-9]{2}$/;

export const BREAK_POINTS = {
  SMALL: '834px',
  MEDIUM: '1127px',
  LARGE: '1301px'
};

export const TENANCY_STATUS = {
  prospect: 'PROSPECT',
  active: 'ACTIVE',
  vacated: 'VACATED',
  vacating: 'VACATING',
  prospective: 'PROSPECTIVE'
};

export const CONVERSATION_CATEGORIES = {
  LEASE_RENEWAL: 'c5fbe828-681f-4f02-b610-5bc3870c7aa8'
};

export const EMAIL_PATTERN = /^\w.+@[a-zA-Z_]+?(\.[a-zA-Z]{2,}){1,}$/;
export const EMAIL_URL_PATTERN =
  /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
export const EMAIL_VALIDATE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POPUP_ICON = {
  infor: `trudiAvt`,
  warn: `warning`
};

export const POPUP_TYPE = {
  infor: 'infor',
  warn: 'warn'
};

export const PetRequestREIFormDocumentName = {
  FormSendToTenantQLD: 'Request to keep a pet in a rental property',
  FormSendToTenantVIC: 'Pet request form',
  SendToLandlordQLD: 'Client instruction form',
  SendToLandlordVIC: 'Pet request form'
};

export const UserType = {
  AGENT: 'AGENT',
  USER: 'USER',
  LEAD: 'LEAD',
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  SUPPLIER: 'SUPPLIER',
  OTHER: 'OTHER',
  PAGE: 'PAGE'
};

export const RemiderTooltip =
  'Contacts with verified phone numbers sent reminder via SMS, asking them to check their email or Tenant App.';

export const UPGRADE_YOUR_ACCOUNT =
  'To add new tasks, please upgrade your account';

export const EMAIL_FORMAT_REGEX =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

export const PLAIN_LINK_REGEX =
  /(\s|\[|^|(<[^a][^>]*>))((www|http[s]?:\/\/)(?:[a-zA-Z]|[0-9]|((?![<])[$-_#@.&+])|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+)/g;

export const listOfUserTypeIndex = [
  EUserPropertyType.LANDLORD,
  EUserPropertyType.TENANT,
  EUserPropertyType.SUPPLIER,
  EUserPropertyType.EXTERNAL
];

export const UploadErrorMsg = {
  EXCEED_MAX_SIZE:
    'Your file is larger than 25MB. Please upload a smaller file.',
  UNSUPPORTED_EXTENSION: "The file is invalid. Only 'png', 'jpeg' are allowed.",
  INVALID_FILE: 'The file is invalid.',
  UNSUPPORTED_FILE: 'Unsupported file type.'
};

export const ErrorMessages = {
  RESOLVE_CONVERSATION:
    'Before you can resolve this message, please delete any scheduled messages.',
  DELETE_CONVERSATION:
    'Before you can delete this message, please delete any scheduled messages.',
  RESOLVE_TASK:
    'Before you can complete this task, please delete any scheduled messages.',
  DELETE_TASK:
    'Before you can delete this task, please delete any scheduled messages.',
  REMOVE_CONVERSATION_FROM_TASK:
    'Before you can remove this message from task, please delete any scheduled messages.'
};

export const INVOICE_STATUS_CHECK: IInvoiceStatus = {
  [InvoiceStatus.PARTPAID]: 'Part-paid',
  [InvoiceStatus.PAID]: 'Paid',
  [InvoiceStatus.UNPAID]: 'Unpaid',
  [InvoiceStatus.CANCELLED]: 'Cancelled'
};

export const ActionDefaultScheduleButton: string[] = [
  ETenantVacateButtonAction.scheduleTenantReminderVacateInstructionsNoticeToVacate,
  ETenantVacateButtonAction.scheduleTenantReminderVacateInstructionsEndOfLease,
  ETenantVacateButtonAction.scheduleTenantReminderVacateInstructionsBreakLease,
  BreachNoticeRequestButtonAction.schedule_tenant_reminder_remedy_date,
  BreachNoticeRequestButtonAction.schedule_tenant_reminder_breach_notice_expired,
  CreditorInvoicingButtonAction.UNPAID_SCHEDULE_TENANT_REMINDER_OVERDUE_INVOICE,
  CreditorInvoicingButtonAction.UNPAID_SCHEDULE_TENANT_REMINDER_PAYMENT_DUE,
  CreditorInvoicingButtonAction.PARTPAID_SCHEDULE_TENANT_REMINDER,
  EStepAction.SCHEDULE_REMINDER,
  RoutineInspectionButtonAction.SEND_A_REMINDER_TO_TENANT_SCHEDULED
];

export const TimeRegex =
  /^(0?[0-9]|1[0-2]):[0-5][0-9] (am|pm)\s?(\([a-z]*\))?$/i;

export const IntegerRegex = /^[0-9]+$/;

const EMAILPATTERN =
  /^[a-z0-9][a-z0-9-_\.]+@([a-z]|[a-z0-9]?[a-z0-9-]+[a-z0-9])\.[a-z0-9]{2,10}(?:\.[a-z]{2,10})?$/;

export const UNCATCH_API_URL = [
  '/get-status-sync',
  '/sync-properties-tree',
  '/statistic-task'
];

export const MAILBOX_ROLE_REQUIRED = 'MAILBOX_ROLE_REQUIRED';

export const FILE_VALID_INVOICE = [...listImageTypeDot, ...ACCEPT_ONLY_PDF];

export const NOTE_CATEGORIES = [
  'Smoke Alarms',
  'Keys',
  'General',
  'Property Compliance'
];

export const PHONE_PREFIXES = {
  AU: ['+61'],
  US: ['+1']
};

export const DEFAULT_CALENDAR_WIDGET_EXPIRED_DAYS = 90;

export const CALENDAR_WIDGET_EXPIRED_DAYS = {
  [EEventType.ARREAR]: 0,
  [EEventType.BREACH_REMEDY]: 1,
  [EEventType.ENTRY_NOTICE]: 1,
  [EEventType.LEASE_START]: 7,
  [EEventType.VACATE]: 7,
  [EEventType.MOVE_IN_DATE]: 7,
  [EEventType.MOVE_OUT_DATE]: 7,
  [EEventType.INGOING_INSPECTION]: 3,
  [EEventType.ISSUE]: 3,
  [EEventType.SMOKE_ALARM_EXPIRY]: 30,
  [EEventType.SMOKE_ALARM_NEXT_SERVICE]: 30,
  [EEventType.GENERAL_EXPIRY]: 30,
  [EEventType.GENERAL_NEXT_SERVICE]: 30,
  [EEventType.ROUTINE_INSPECTION]: 30,
  [EEventType.LEASE_END]: 90,
  [EEventType.OUTGOING_INSPECTION]: 3,
  [EEventType.TENANT_INVOICE_DUE_DATE]: 3,
  [EEventType.CUSTOM_EVENT]: 0,
  [EEventType.AUTHORITY_START]: 60,
  [EEventType.AUTHORITY_END]: 60,
  [EEventType.NEXT_RENT_REVIEW]: 30
};

export const CHAR_WIDTH = 8;

export const SIGNATURE_HTML = `
<div id="signature-name"><span style="white-space: pre-wrap; font-weight: 500; color: rgb(61, 61, 61); font-size: 12px; line-height: 16px;">Trudi</span></div>
<div id="signature-role"><span style="white-space: pre-wrap; font-weight: 500; color: rgb(61, 61, 61); font-size: 12px; line-height: 16px;">Virtual Assistant</span></div>
<div id="signature-address"><span style="white-space: pre-wrap; font-weight: 500; color: rgb(61, 61, 61); font-size: 12px; line-height: 16px;">#email</span></div>
<div id="spacing" style="height: 24px;"></div>`;

export const LABEL_NAME_OUTLOOK = {
  ARCHIVE: 'Archive',
  CONVERSATION_HISTORY: 'Conversation History',
  DELETED_ITEMS: 'Deleted Items',
  DRAFTS: 'Drafts',
  INBOX: 'Inbox',
  JUNK_EMAIL: 'Junk Email',
  OUTBOX: 'Outbox',
  RSS_FEEDS: 'RSS Feeds',
  SENT_ITEMS: 'Sent Items',
  SYNC_ISSUES: 'Sync Issues',
  LOCAL_FAILURES: 'Local Failures',
  CONFLICTS: 'Conflicts',
  SERVER_FAILURES: 'Server Failures'
};

export const LABEL_EXTERNAL_ID_MAIL_BOX = {
  UNREAD: 'UNREAD',
  INBOX: 'INBOX',
  CHAT: 'CHAT',
  SENT: 'SENT',
  IMPORTANT: 'IMPORTANT',
  TRASH: 'TRASH',
  DRAFT: 'DRAFT',
  SPAM: 'SPAM',
  CATEGORY_FORUMS: 'CATEGORY_FORUMS',
  CATEGORY_UPDATES: 'CATEGORY_UPDATES',
  CATEGORY_PERSONAL: 'CATEGORY_PERSONAL',
  CATEGORY_PROMOTIONS: 'CATEGORY_PROMOTIONS',
  CATEGORY_SOCIAL: 'CATEGORY_SOCIAL',
  STARRED: 'STARRED'
};

export const EXPORT_PDF_FILE_TOAST_MESSAGE = {
  task: {
    [EToastType.SYNCING]: 'Exporting task activity to PDF',
    [EToastType.SUCCESS]: 'Task activity exported to PDF',
    [EToastType.ERROR]: 'Failed to export task activity to PDF'
  },
  conversation: {
    [EToastType.SYNCING]: 'Exporting conversation history to PDF',
    [EToastType.SUCCESS]: 'Conversation history exported to PDF',
    [EToastType.ERROR]: 'Failed to export conversation history to PDF'
  }
};

export const ALLOWED_MEDIA = {
  audio: { types: ['.mp3', '.wav', '.ogg'] },
  video: { types: ['.mp4', '.webm', '.ogg'] }
};
