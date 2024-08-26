const { register, listen } = require('push-receiver');
const { ipcMain } = require('electron');
const Config = require('electron-config');

const {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_RECEIVED
} = require('./constants');

let config = new Config();
let started = false;

function setupElectronFire(webContents) {
  ipcMain.on(START_NOTIFICATION_SERVICE, async (_, senderId) => {
    let credentials = config.get('credentials');
    const savedSenderId = config.get('senderId');

    if (started) {
      webContents.send(
        NOTIFICATION_SERVICE_STARTED,
        (credentials.fcm || {}).token
      );
      return;
    }

    started = true;
    const persistentIds = config.get('persistentIds') || [];
    if (!credentials || savedSenderId !== senderId) {
      credentials = await register(senderId);
      config.set('credentials', credentials);
      config.set('senderId', senderId);
    }

    await listen(
      Object.assign({}, credentials, { persistentIds }),
      onNotification()
    );
    webContents.send(NOTIFICATION_SERVICE_STARTED, credentials.fcm.token);
  });
}

function onNotification() {
  return ({ notification, persistentId }) => {
    const persistentIds = config.get('persistentIds') || [];
    config.set('persistentIds', [...persistentIds, persistentId]);
    ipcMain.emit(NOTIFICATION_RECEIVED, notification);
  };
}

export { setupElectronFire };
