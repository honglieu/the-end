export const environment = {
  production: false,
  disableLog: true
  // firebase: {
  //   messagingSenderId: '115323678122',
  //   storageBucket: 'attic-trudi-acbbe.appspot.com',
  //   databaseURL: 'https://attic-trudi-acbbe.firebaseapp.com',
  // }
};

export const apiKey = 'https://api.cellar.trulet.com';
export const auth = 'https://api.cellar.trulet.com/auth/';
export const users = 'https://api.cellar.trulet.com/users/';
export const properties = 'https://api.cellar.trulet.com/properties/';
export const conversations = 'https://api.cellar.trulet.com/conversations/';
export const agencies = 'https://api.cellar.trulet.com/agencies/';
export const syncs = 'https://api.cellar.trulet.com/syncs/';
export const aiApiEndpoint = 'https://ai.attic.trulet.com';
export const aiWebSocketUrl = 'wss://ai.attic.trulet.com/communication/ws';
export const email = 'https://api.stage.trulet.com/email/';
export const voxeet = 'https://webapp.cellar.trulet.com';
export const webSocketUrl = 'wss://msg.cellar.trulet.com';
export const env: string = 'cellar';
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
  init: true,
  dsn: '{SENTRY_KEY}',
  tracesSampleRate: 0.5,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
};

export const configFacebookApplication = {
  APP_ID: '{FB_APP_ID}',
  SCOPE:
    'pages_show_list,pages_manage_metadata,pages_messaging,business_management'
};
