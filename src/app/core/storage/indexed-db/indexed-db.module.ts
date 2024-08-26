import { NgModule } from '@angular/core';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import {
  TrudiIndexedDBIndexKey,
  TrudiIndexedDBStorageKey
} from './indexed-db-storage-key.enum';

const DB_NAME = 'trudi';
/**
 * Increment version number for new store or migration
 */
const DB_VERSION = 10;

/**
 * @description Add migration for existing store
 * @note don't need write migration for new store (just increment DB_VERSION)
 * @see https://www.npmjs.com/package/ngx-indexed-db
 */
export function migrationFactory() {
  return {};
}

const dbConfig: DBConfig = {
  name: DB_NAME,
  version: DB_VERSION,
  // TODO: split objectStoresMeta to separate file
  objectStoresMeta: [
    {
      store: TrudiIndexedDBStorageKey.MESSAGE,
      storeConfig: { keyPath: `conversationId`, autoIncrement: false },
      storeSchema: [
        {
          name: 'mailBoxId, type, status',
          keypath: ['mailBoxId', 'type', 'status'],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.MESSAGE_MAIL_FOLDER,
      storeConfig: { keyPath: `id`, autoIncrement: false },
      storeSchema: [
        {
          name: `${TrudiIndexedDBIndexKey.MAIL_BOX_ID}, ${TrudiIndexedDBIndexKey.EXTERNAL_ID}`,
          keypath: [
            TrudiIndexedDBIndexKey.MAIL_BOX_ID,
            TrudiIndexedDBIndexKey.EXTERNAL_ID
          ],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.CONVERSATION,
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        {
          name: 'id',
          keypath: 'id',
          options: { unique: true }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.TASK_FOLDER,
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        {
          name: 'id',
          keypath: 'id',
          options: { unique: true }
        },
        {
          name: 'mailBoxId',
          keypath: 'mailBoxId',
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.TASK_GROUP,
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        {
          name: 'taskFolderId',
          keypath: 'taskFolderId',
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.TASK_LIST,
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        {
          name: 'taskGroupId',
          keypath: 'taskGroupId',
          options: { unique: false }
        },
        {
          name: 'taskFolderId',
          keypath: 'taskFolderId',
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.CONVERSATIONS,
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        {
          name: TrudiIndexedDBIndexKey.TASK_ID,
          keypath: TrudiIndexedDBIndexKey.TASK_ID,
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.CALENDAR_EVENTS,
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        {
          name: TrudiIndexedDBIndexKey.TASK_ID,
          keypath: TrudiIndexedDBIndexKey.TASK_ID,
          options: { unique: false }
        },
        {
          name: TrudiIndexedDBIndexKey.EVENT_ID,
          keypath: TrudiIndexedDBIndexKey.EVENT_ID,
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.TENANTS_OWNERS_PT,
      storeConfig: {
        keyPath: TrudiIndexedDBIndexKey.PROPERTY_ID,
        autoIncrement: false
      },
      storeSchema: [
        {
          name: `${TrudiIndexedDBIndexKey.PROPERTY_ID}, ${TrudiIndexedDBIndexKey.COMPANY_ID}`,
          keypath: [
            TrudiIndexedDBIndexKey.PROPERTY_ID,
            TrudiIndexedDBIndexKey.COMPANY_ID
          ],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.TENANTS_OWNERS_RM,
      storeConfig: {
        keyPath: TrudiIndexedDBIndexKey.PROPERTY_ID,
        autoIncrement: false
      },
      storeSchema: [
        {
          name: `${TrudiIndexedDBIndexKey.PROPERTY_ID}, ${TrudiIndexedDBIndexKey.COMPANY_ID}`,
          keypath: [
            TrudiIndexedDBIndexKey.PROPERTY_ID,
            TrudiIndexedDBIndexKey.COMPANY_ID
          ],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.SUPPLIER,
      storeConfig: { keyPath: TrudiIndexedDBIndexKey.ID, autoIncrement: false },
      storeSchema: [
        {
          name: `${TrudiIndexedDBIndexKey.ID}, ${TrudiIndexedDBIndexKey.COMPANY_ID}`,
          keypath: [
            TrudiIndexedDBIndexKey.ID,
            TrudiIndexedDBIndexKey.COMPANY_ID
          ],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.OTHER_CONTACT,
      storeConfig: { keyPath: TrudiIndexedDBIndexKey.ID, autoIncrement: false },
      storeSchema: [
        {
          name: `${TrudiIndexedDBIndexKey.ID}, ${TrudiIndexedDBIndexKey.COMPANY_ID}`,
          keypath: [
            TrudiIndexedDBIndexKey.ID,
            TrudiIndexedDBIndexKey.COMPANY_ID
          ],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.TENANT_PROSPECT,
      storeConfig: {
        keyPath: TrudiIndexedDBIndexKey.PROPERTY_ID,
        autoIncrement: false
      },
      storeSchema: [
        {
          name: `${TrudiIndexedDBIndexKey.PROPERTY_ID}, ${TrudiIndexedDBIndexKey.COMPANY_ID}`,
          keypath: [
            TrudiIndexedDBIndexKey.PROPERTY_ID,
            TrudiIndexedDBIndexKey.COMPANY_ID
          ],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.OWNER_PROSPECT,
      storeConfig: {
        keyPath: TrudiIndexedDBIndexKey.USER_ID,
        autoIncrement: false
      },
      storeSchema: [
        {
          name: `${TrudiIndexedDBIndexKey.USER_ID}, ${TrudiIndexedDBIndexKey.COMPANY_ID}`,
          keypath: [
            TrudiIndexedDBIndexKey.USER_ID,
            TrudiIndexedDBIndexKey.COMPANY_ID
          ],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.CALENDAR_DASHBOARD,
      storeConfig: {
        keyPath: [TrudiIndexedDBIndexKey.ID, TrudiIndexedDBIndexKey.TYPE],
        autoIncrement: false,
        options: { unique: true }
      },
      storeSchema: [
        {
          name: `${TrudiIndexedDBIndexKey.DATE}, ${TrudiIndexedDBIndexKey.TYPE}, ${TrudiIndexedDBIndexKey.COMPANY_ID}`,
          keypath: [
            TrudiIndexedDBIndexKey.DATE,
            TrudiIndexedDBIndexKey.TYPE,
            TrudiIndexedDBIndexKey.COMPANY_ID
          ],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.MAIL_FOLDER,
      storeConfig: {
        keyPath: ['internalId', 'mailBoxId'],
        autoIncrement: false
      },
      storeSchema: [
        {
          name: 'internalId',
          keypath: 'internalId',
          options: { unique: true }
        },
        {
          name: TrudiIndexedDBIndexKey.MAIL_BOX_ID,
          keypath: TrudiIndexedDBIndexKey.MAIL_BOX_ID,
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.APP_MESSAGE,
      storeConfig: { keyPath: `conversationId`, autoIncrement: false },
      storeSchema: [
        {
          name: 'mailBoxId, type, status',
          keypath: ['mailBoxId', 'type', 'status'],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.VOICE_MAIL,
      storeConfig: { keyPath: `id`, autoIncrement: false },
      storeSchema: [
        {
          name: 'mailBoxId, type, status',
          keypath: ['mailBoxId', 'type', 'status'],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.SMS,
      storeConfig: { keyPath: `conversationId`, autoIncrement: false },
      storeSchema: [
        {
          name: 'mailBoxId, type, status',
          keypath: ['mailBoxId', 'type', 'status'],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.TASK_CONVERSATIONS,
      storeConfig: {
        keyPath: TrudiIndexedDBIndexKey.TASK_ID,
        autoIncrement: false
      },
      storeSchema: []
    },
    {
      store: TrudiIndexedDBStorageKey.TASK_DETAIL,
      storeConfig: {
        keyPath: TrudiIndexedDBIndexKey.ID,
        autoIncrement: false
      },
      storeSchema: []
    },
    {
      store: TrudiIndexedDBStorageKey.TASK_ITEMS,
      storeConfig: {
        keyPath: TrudiIndexedDBIndexKey.TASK_ID,
        autoIncrement: false
      },
      storeSchema: []
    },
    {
      store: TrudiIndexedDBStorageKey.TASK_USER_CONVERSATION,
      storeConfig: {
        keyPath: TrudiIndexedDBIndexKey.TASK_ID,
        autoIncrement: false
      },
      storeSchema: []
    },
    {
      store: TrudiIndexedDBStorageKey.FACEBOOK,
      storeConfig: { keyPath: `id`, autoIncrement: false },
      storeSchema: [
        {
          name: 'mailBoxId, type, status',
          keypath: ['mailBoxId', 'type', 'status'],
          options: { unique: false }
        }
      ]
    },
    {
      store: TrudiIndexedDBStorageKey.WHATSAPP,
      storeConfig: { keyPath: `id`, autoIncrement: false },
      storeSchema: [
        {
          name: 'mailBoxId, type, status',
          keypath: ['mailBoxId', 'type', 'status'],
          options: { unique: false }
        }
      ]
    }
  ],
  migrationFactory
};

@NgModule({
  imports: [NgxIndexedDBModule.forRoot(dbConfig)],
  exports: [NgxIndexedDBModule]
})
export class TrudiIndexedDBModule {}
