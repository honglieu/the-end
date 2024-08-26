export const environment = {
  production: false,
  disableLog: false
  // firebase: {
  //   messagingSenderId: '115323678122',
  //   storageBucket: 'attic-trudi-acbbe.appspot.com',
  //   databaseURL: 'https://attic-trudi-acbbe.firebaseapp.com',
  // }
};
// export const apiKey = 'https://api.stage.trulet.com';
// export const apiKey = 'https://api.stage.trulet.com';
export const apiKey = 'https://api.attic.trulet.com';
// export const apiKey = 'http://10.10.65.2:3001/'; // Minh Nhựa
// export const apiKey = 'http://172.16.100.182:3001/'; // server team a
// export const apiKey = 'http://172.16.100.185:3001/'; // console task editor
// export const apiKey = 'http://172.16.100.132:3000/'; //server team i
// export const apiKey = 'http://10.10.20.49:3001/';
// export const apiKey = 'http://10.10.60.246:3001/'; // an
// export const apiKey = 'http://10.10.63.52:3001/'; //server a Phúc

export const auth = `${apiKey}/auth/`;
export const users = `${apiKey}/users/`;
export const properties = `${apiKey}/properties/`;
export const conversations = `${apiKey}/conversations/`;
export const agencies = `${apiKey}/agencies/`;
export const syncs = `${apiKey}/syncs/`;
export const email = `${apiKey}/email/`;

export const aiApiEndpoint = 'https://ai.attic.trulet.com';
export const aiWebSocketUrl = 'wss://ai.attic.trulet.com/communication/ws';
export const voxeet = 'https://webapp.cellar.trulet.com';
export const webSocketUrl = 'wss://msg.attic.trulet.com';
// export const webSocketUrl = 'wss://message.stage.trulet.com';
export const env: string = 'sandbox';
export const gaTrackingId = 'GTM-KPWVTFZ';
export const featureVersion = '1.00';
export const currentVersion = '1.00';
export const fileLimit = 25;
export const region = 'AU';
export const showAIReplyFeature = true;

export const urlDownloadEnv = 'cdn.attic.trulet.com';

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
  init: false,
  dsn: '{SENTRY_KEY}',
  tracesSampleRate: 0.5,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
};

export const configGoogleApplication = {
  CLIENT_ID:
    '29582996394-9i5mgm6jsgfn3uec093bfkoi3jb4bnfk.apps.googleusercontent.com',
  REDIRECT_URI: 'http://localhost:4200',
  SCOPE:
    'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
};

export const configOutlookApplication = {
  APP_ID: 'b1874c1f-c450-4354-b1c6-295f908ad975',
  REDIRECT_URI: 'http://localhost:4200/outlook-callback',
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
  CLIENT_ID:
    '447973370062-titbvri87crslvn4ao8b8e7svsk86mbi.apps.googleusercontent.com',
  REDIRECT_URI: 'http://localhost:4200',
  SCOPE_CALENDAR:
    'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
};

export const configOutlookCalendar = {
  APP_ID: '7c12f65d-4acd-441a-8498-669884567ce7',
  REDIRECT_URI: 'http://localhost:4200/outlook-callback',
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
  APP_ID: '1653047075468644',
  SCOPE:
    'pages_show_list,pages_manage_metadata,pages_messaging,business_management'
};
