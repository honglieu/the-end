const {
  app,
  ipcMain,
  crashReporter,
  nativeImage,
  BrowserWindow,
  Notification,
  systemPreferences,
  session,
  safeStorage,
  screen
} = require('electron');
const path = require('path');
const { setupElectronFire, lock } = require('./helpers');
const Badge = require('electron-taskbar-badge');
const { Menu, MenuItem } = require('electron');
const {
  DELETE_REMEMBER_ME,
  STORE_REMEMBER,
  ENV_REMEMBER,
  SAVE_REMEMBER_ME,
  GET_REMEMBER_ME,
  NOTIFICATION_RECEIVED,
  CHANGE_COMPANY,
  GET_CURRENT_APP_VERSION,
  APP_LOGOUT,
  COUNT_UNREAD_MESSAGE
} = require('./helpers/constants');
const { defaultEnv, appProtocol, menuTemplate } = require('./constant');

const log = require('electron-log');
const os = require('os');
const Store = require('electron-store');

const { apiHost, appBundleId, productName, storeName, portalHost } = defaultEnv;
const isWindows = os.platform() === 'win32';
const isMac = os.platform() === 'darwin';
const store = new Store({
  name: storeName,
  watch: true
});

ipcMain.handle(GET_CURRENT_APP_VERSION, async () => {
  try {
    return app.getVersion();
  } catch (error) {
    return null;
  }
});

const menu = Menu.buildFromTemplate(menuTemplate(app, isMac));
Menu.setApplicationMenu(menu);

crashReporter.start({
  submitURL: `${apiHost}/auth/electron-report/desktop-crash-report`,
  compress: false
});

let mainWindow;
let currentCompanyId;
let appNotis = [];
let startUrl = `${portalHost}?`;
let windowBadge;

const gotTheLock = app.requestSingleInstanceLock();

function createWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    title: productName,
    icon: path.join(__dirname, 'assets', 'images', 'trudi.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      spellcheck: true
    },
    autoHideMenuBar: false
  });

  mainWindow.resizable = true;
  mainWindow.maximize();
  mainWindow.show();

  if (isWindows && process.argv.length > 1) {
    const deepLinkUrl = process.argv[1];
    handleDeepLink(deepLinkUrl);
  } else {
    mainWindow.loadURL(startUrl);
  }
  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  mainWindow.on('page-title-updated', function (e) {
    e.preventDefault();
  });

  mainWindow.webContents.setWindowOpenHandler((options) => {
    const featuresArray = (options?.features || '').split(',');
    const featuresObject = {};

    for (const feature of featuresArray) {
      const [key, value] = feature.split('=');
      if (key) featuresObject[key] = value;
    }

    let needSetSize = false;
    if (!featuresObject.width && !featuresObject.height) {
      needSetSize = true;
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      featuresObject.width = width;
      featuresObject.height = height;
    }

    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        show: false,
        ...(needSetSize
          ? {
              width: parseInt(featuresObject.width),
              height: parseInt(featuresObject.height)
            }
          : {}),
        icon: path.join(__dirname, 'assets', 'images', 'trudi.png'),
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: true,
          spellcheck: true
        }
      }
    };
  });

  mainWindow.webContents.on('did-create-window', (win) => {
    win.show();
    win.center();
  });

  mainWindow.webContents.on(
    'did-fail-load',
    (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      log.error(
        `Failed to load: ${errorDescription} (${errorCode}) at ${validatedURL}`
      );
    }
  );

  mainWindow.webContents.session.setSpellCheckerLanguages([getLanguage()]);

  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    if (params.selectionText) {
      addSpellCheckOptions(menu, params);
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
    }

    if (params.editFlags.canPaste) {
      menu.append(new MenuItem({ label: 'Paste', role: 'paste' }));
    }

    if (menu.items.length > 0) {
      menu.popup();
    }
  });
}

function getLanguage() {
  try {
    const possibleLanguages =
      mainWindow.webContents.session.availableSpellCheckerLanguages;
    const systemLocale = app.getSystemLocale();

    if (possibleLanguages.includes(systemLocale)) {
      return systemLocale;
    }

    const country = systemLocale?.split('-')?.[0];
    if (possibleLanguages.includes(country)) {
      return systemLocale;
    }
  } catch (error) {
    console.error(error);
  }
  return 'en-US';
}

function addSpellCheckOptions(menu, params) {
  if (!params.misspelledWord) return;

  params.dictionarySuggestions.forEach((suggestion) => {
    menu.append(
      new MenuItem({
        label: suggestion,
        click: () => mainWindow.webContents.replaceMisspelling(suggestion)
      })
    );
  });

  menu.append(
    new MenuItem({
      label: 'Add to dictionary',
      click: () =>
        mainWindow.webContents.session.addWordToSpellCheckerDictionary(
          params.misspelledWord
        )
    })
  );
}

async function removeAppNoti(element) {
  await lock.acquire();
  try {
    const index = appNotis.indexOf(element);
    appNotis.splice(index, 1);
  } finally {
    lock.release();
  }
}

function configLog() {
  log.transports.file.level = 'info';
  log.transports.file.fileName = `${productName}.log`;
  log.info('App started');
}

function handleDeepLink(url) {
  if (url.startsWith(appProtocol.webContentProptocol)) {
    handleWebContentProtocol(url);
  }
}

function handleWebContentProtocol(url) {
  const webUrl = decodeURIComponent(
    url.replace(`${appProtocol.webContentProptocol}://`, '')
  );
  if (mainWindow) {
    mainWindow.show();
    mainWindow.maximize();
    mainWindow.loadURL(webUrl);
  } else {
    startUrl = webUrl;
  }
}

function setUpAppBadgeCount() {
  return;
  if (isWindows) {
    const badgeOptions = {
      fontColor: '#FFFFFF',
      font: '62px Arial',
      color: '#f44336',
      radius: 48,
      updateBadgeEvent: 'notificationCount',
      badgeDescription: 'Unread Notifications',
      invokeType: 'send',
      max: 99,
      fit: false
    };
    windowBadge = new Badge(mainWindow, badgeOptions);
  } else if (isMac) {
    app.getBadgeCount();
  }
}

function handleBadgeCountChange(count) {
  return;
  if (isWindows) {
    windowBadge.update(count);
  } else if (isMac) {
    app.setBadgeCount(count);
  }
}

function main() {
  app.setAsDefaultProtocolClient(appProtocol.webContentProptocol);
  if (isWindows) {
    if (!gotTheLock) {
      app.quit();
    }
    app.setAppUserModelId(appBundleId);
  }

  app.on('ready', () => {
    configLog();
    session.defaultSession.clearCache();
    createWindow();
    if (!isWindows) {
      systemPreferences.askForMediaAccess('camera');
      systemPreferences.askForMediaAccess('microphone');
    }
    setUpAppBadgeCount();
    setupElectronFire(mainWindow.webContents);

    ipcMain.on(CHANGE_COMPANY, (_, companyId) => {
      currentCompanyId = companyId;
    });

    ipcMain.on(NOTIFICATION_RECEIVED, (serverNotificationPayload) => {
      const { notification, data } = serverNotificationPayload;
      var image = nativeImage.createFromPath(
        path.join(__dirname, 'assets', 'images', 'trudi.png')
      );
      const notiMessage = notification.body;
      if (notiMessage && data?.companyId === currentCompanyId) {
        let appNoti = new Notification({
          title: notification.title,
          body: notiMessage,
          icon: process.platform !== 'darwin' ? image : null,
          data: data
        });

        appNoti.on('click', () => {
          removeAppNoti(appNoti);
          if (notification.click_action) {
            mainWindow.loadURL(notification.click_action);
            mainWindow.show();
          }
        });

        appNoti.on('close', () => {
          removeAppNoti(appNoti);
        });

        appNoti.show();
        appNotis.push(appNoti);
      }
    });

    ipcMain.on(SAVE_REMEMBER_ME, (event, values) => {
      try {
        const { email, password } = values;
        if (!email || !password || !safeStorage.isEncryptionAvailable()) {
          return event.sender.send(SAVE_REMEMBER_ME, {
            error: {
              message: 'Invalid save data or encrypt not available'
            }
          });
        }
        const encryptEmail = safeStorage.encryptString(email).toString('hex');
        const encryptPassword = safeStorage
          .encryptString(password)
          .toString('hex');
        const data = {
          ...values,
          email: encryptEmail,
          password: encryptPassword
        };
        store.set(STORE_REMEMBER, data);
        event.sender.send(SAVE_REMEMBER_ME, {
          error: null,
          data: data
        });
      } catch (error) {
        log.error(error);
        return event.sender.send(SAVE_REMEMBER_ME, {
          error: {
            message: `Save data ${error}`
          }
        });
      }
    });

    ipcMain.on(GET_REMEMBER_ME, (event) => {
      try {
        const { email, password } = store?.store?.[STORE_REMEMBER] || {};
        if (!email || !password) {
          return event.sender.send(GET_REMEMBER_ME, {
            error: {
              message: 'Invalid get data or encrypt not available'
            }
          });
        }
        const emailBuffer = Buffer.from(email, 'hex');
        const passwordBuffer = Buffer.from(password, 'hex');
        const decryptEmail = safeStorage
          .decryptString(emailBuffer)
          .toString('hex');
        const decryptPassword = safeStorage
          .decryptString(passwordBuffer)
          .toString('hex');

        event.sender.send(GET_REMEMBER_ME, {
          error: null,
          data: {
            ...store?.store?.[STORE_REMEMBER],
            email: decryptEmail,
            password: decryptPassword
          }
        });
      } catch (error) {
        log.error(error);
        return event.sender.send(GET_REMEMBER_ME, {
          error: {
            message: error?.message
          }
        });
      }
    });

    ipcMain.on(DELETE_REMEMBER_ME, () => {
      store?.delete(STORE_REMEMBER);
    });

    ipcMain.on(APP_LOGOUT, () => {
      handleBadgeCountChange(0);
      store?.delete(ENV_REMEMBER);
    });

    ipcMain.on(COUNT_UNREAD_MESSAGE, (_, data) => {
      handleBadgeCountChange(data);
    });
  });

  app.on('open-url', (event, url) => {
    handleDeepLink(url);
  });

  app.on('second-instance', (event, commandLine) => {
    const url = commandLine.pop();
    handleDeepLink(url);
  });
}

async function removeAppNoti(element) {
  await lock.acquire();
  try {
    const index = appNotis.indexOf(element);
    appNotis.splice(index, 1);
  } finally {
    lock.release();
  }
}

main();
