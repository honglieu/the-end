export const environment = {
  production: true,
  disableLog: false
  // firebase: {
  //   messagingSenderId: '329892891174',
  //   storageBucket: 'stage-trudi.appspot.com',
  //   databaseURL: 'https://stage-trudi.firebaseio.com',
  // }
};

export const apiKey = 'https://api.stage.trulet.com';
export const auth = 'https://api.stage.trulet.com/auth/';
export const users = 'https://api.stage.trulet.com/users/';
export const properties = 'https://api.stage.trulet.com/properties/';
export const conversations = 'https://api.stage.trulet.com/conversations/';
export const agencies = 'https://api.stage.trulet.com/agencies/';
export const syncs = 'https://api.stage.trulet.com/syncs/';
export const email = 'https://api.stage.trulet.com/email/';
export const aiApiEndpoint = 'https://ai.stage.trulet.com';
export const aiWebSocketUrl = 'wss://ai.stage.trulet.com/communication/ws';
export const voxeet = 'https://webapp.stage.trulet.com';
export const webSocketUrl = 'wss://message.stage.trulet.com';
export const env: string = 'stage';
export const gaTrackingId = 'GTM-K78NDND';
export const featureVersion = '1.00';
export const currentVersion = '1.00';
export const fileLimit = 25;
export const region = 'AU';
export const showAIReplyFeature = false;

export const urlDownloadEnv = 'cdn.stage.trulet.com';

export const firebaseConfig = {
  apiKey: '{FIREBASE_API_KEY}',
  authDomain: '{FIREBASE_AUTH_DOMAIN}',
  projectId: '{FIREBASE_PROJECT_ID}',
  storageBucket: '{FIREBASE_STORAGE_BUCKET}',
  messagingSenderId: '{FIREBASE_MESSAGING_SENDER_ID}',
  appId: '{FIREBASE_APP_ID}',
  measurementId: '{FIREBASE_MEASUREMENT_ID}'
};

export const keyPreview = '6f7a3fa8eeeb6bfdb39a2f5fdb4afc08';
export const sentryConfig = {
  init: true,
  dsn: '{SENTRY_KEY}',
  tracesSampleRate: 0.5,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
};

export const configGoogleApplication = {
  CLIENT_ID: '{GOOGLE_CLIENT_ID}',
  REDIRECT_URI: 'https://portal.stage.trudi.ai',
  SCOPE:
    'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
};

export const configOutlookApplication = {
  APP_ID: '{MICROSOFT_APP_ID}',
  REDIRECT_URI: 'https://portal.stage.trudi.ai/outlook-callback',
  SCOPE:
    'offline_access user.read user.readbasic.all openid profile mail.readwrite mail.send mail.readwrite.shared mail.send.shared'
};

export const outlookAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${
  configOutlookApplication.APP_ID
}&response_type=code&redirect_uri=${
  configOutlookApplication.REDIRECT_URI
}&response_mode=query&scope=${encodeURIComponent(
  configOutlookApplication.SCOPE
)}&prompt=select_account`;

export const configGoogleCalendar = {
  CLIENT_ID: '{GOOGLE_CALENDAR_CLIENT_ID}',
  REDIRECT_URI: 'https://portal.stage.trudi.ai',
  SCOPE_CALENDAR:
    'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
};

export const configOutlookCalendar = {
  APP_ID: '{OUTLOOK_CALENDAR_APP_ID}',
  REDIRECT_URI: 'https://portal.stage.trudi.ai/outlook-callback',
  SCOPE_CALENDAR:
    'offline_access mailboxsettings.read user.read openid profile calendars.readwrite'
};

export const outlookCalendarAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${
  configOutlookCalendar.APP_ID
}&response_type=code&redirect_uri=${
  configOutlookCalendar.REDIRECT_URI
}&response_mode=query&scope=${encodeURIComponent(
  configOutlookCalendar.SCOPE_CALENDAR
)}&prompt=select_account`;

export const configFacebookApplication = {
  APP_ID: '{FB_APP_ID}',
  SCOPE:
    'pages_show_list,pages_manage_metadata,pages_messaging,business_management'
};
