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

const lock = {
  isLocked: false,
  queue: [],

  // Acquire the lock
  acquire: function () {
    return new Promise((resolve) => {
      if (!this.isLocked) {
        // If the lock is available, immediately acquire it
        this.isLocked = true;
        resolve();
      } else {
        // If the lock is already acquired, enqueue the request
        this.queue.push(resolve);
      }
    });
  },

  // Release the lock
  release: function () {
    if (this.queue.length > 0) {
      // If there are pending requests in the queue, let the next one acquire the lock
      const next = this.queue.shift();
      next();
    } else {
      // If the queue is empty, release the lock
      this.isLocked = false;
    }
  }
};

module.exports = {
  setupElectronFire,
  lock
};
