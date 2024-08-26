const apiHost = {
  sandbox: 'http://localhost:3001',
  test: 'http://localhost:3001',
  attic: 'https://api.attic.trulet.com',
  stage: 'https://api.stage.trulet.com',
  preprod: 'https://api.preprod.trulet.com',
  prod: 'https://api.prod.trulet.com',
  produs: 'https://us.api.trudi.ai'
};

const appBundleId = {
  sandbox: 'com.trudi.portal.attic',
  test: 'com.trudi.portal.attic',
  attic: 'com.trudi.portal.attic',
  stage: 'com.trudi.portal.stage',
  preprod: 'com.trudi.portal.preprod',
  prod: 'com.trudi.portal.app',
  produs: 'com.trudi.portal.us'
};

const productName = {
  sandbox: 'Trudi® Attic',
  test: 'Trudi® Attic',
  attic: 'Trudi® Attic',
  stage: 'Trudi® Stage',
  preprod: 'Trudi® PreProd',
  prod: 'Trudi®',
  produs: 'Trudi®'
};

const portalHost = {
  sandbox: 'http://localhost:4200',
  test: 'http://localhost:4200',
  attic: 'https://portal.attic.trulet.com',
  stage: 'https://portal.stage.trudi.ai',
  preprod: 'https://portal.preprod.trudi.ai',
  prod: 'https://portal.trudi.ai',
  produs: 'https://us.portal.trudi.ai'
};

const storeName = {
  sandbox: 'trud_attic_data',
  test: 'trud_attic_data',
  attic: 'trud_attic_data',
  stage: 'trudi_stage_data',
  preprod: 'trudi_pre_prod_data',
  prod: 'trudi_data',
  produs: 'trudi_us_data'
};

const webContentProptocol = {
  sandbox: 'attic-web-content',
  test: 'attic-web-content',
  attic: 'attic-web-content',
  stage: 'stage-web-content',
  preprod: 'preprod-web-content',
  prod: 'prod-web-content',
  produs: 'produs-web-content'
};

const menuTemplate = (isMac, app) => [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        }
      ]
    : []),
  {
    label: 'File',
    submenu: [isMac ? { role: 'close' } : { role: 'quit' }]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
        ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }]
            }
          ]
        : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }])
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      ...(isMac
        ? [{ type: 'separator' }, { role: 'front' }]
        : [{ role: 'close' }])
    ]
  }
];

const env = process.env.TRUDI_ENV || 'sandbox';

module.exports = {
  defaultEnv: {
    apiHost: apiHost[env],
    appBundleId: appBundleId[env],
    productName: productName[env],
    portalHost: portalHost[env],
    storeName: storeName[env]
  },
  getEnv: (env) => ({
    apiHost: apiHost[env],
    appBundleId: appBundleId[env],
    productName: productName[env],
    portalHost: portalHost[env],
    storeName: storeName[env]
  }),
  appProtocol: {
    webContentProptocol: webContentProptocol[env]
  },
  menuTemplate,
  env
};
