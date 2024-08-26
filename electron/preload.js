const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(eventName, callback) {
    ipcRenderer.on(eventName, callback);
  },
  send(eventName, ...params) {
    return ipcRenderer.send(eventName, ...params);
  },
  invoke(eventName, ...params) {
    return ipcRenderer.invoke(eventName, ...params);
  },
  removeListener(channel, listener) {
    return ipcRenderer.removeListener(channel, listener);
  },
  detectOS() {
    const isMac = os.platform() === 'darwin';
    const isWindows = os.platform() === 'win32';
    if (isMac) {
      return 'MACOS';
    } else if (isWindows) {
      return 'WINDOWS';
    } else {
      return 'LINUX';
    }
  }
});
