import { Injectable } from '@angular/core';
import { TrudiIndexedDBStorageKey } from '@/app/core';
import { StoreMemoryCacheService } from '@/app/core/store/shared';
import {
  composePropertyObject,
  EConversationType,
  EPropertyToUpdate,
  IParticipant,
  Property,
  SocketType,
  TaskItem
} from '@/app/shared';
import { RxWebsocketService } from './rx-websocket.service';
import { merge, tap } from 'rxjs';
import { PropertiesService } from './properties.service';
import { WhatsappDetailTaskMemoryCacheService } from '../core/store/whatsapp-detail';
import { FacebookDetailTaskMemoryCacheService } from '@/app/core/store/facebook-detail';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { getUserFromParticipants } from '../trudi-send-msg/utils/helper-functions';
import { VoicemailDetailTaskMemoryCacheService } from '../core/store/voice-mail-detail';

export interface CachedDataResult<T> {
  data: T | null;
  service: StoreMemoryCacheService<T> | null;
}

@Injectable({
  providedIn: 'root'
})
export class CacheUpdateService {
  constructor(
    private readonly facebookDetailTaskMemoryCacheService: FacebookDetailTaskMemoryCacheService,
    private readonly whatsappDetailTaskMemoryCacheService: WhatsappDetailTaskMemoryCacheService,
    private readonly voicemailDetailTaskMemoryCacheService: VoicemailDetailTaskMemoryCacheService,
    private readonly rxWebSocketService: RxWebsocketService,
    private readonly propertiesService: PropertiesService,
    private readonly indexedDBService: NgxIndexedDBService
  ) {}

  private getCacheFromAllServices(key: string) {
    const memoryServices = [
      this.facebookDetailTaskMemoryCacheService,
      this.whatsappDetailTaskMemoryCacheService,
      this.voicemailDetailTaskMemoryCacheService
      // Add additional memory services here
    ];

    for (const service of memoryServices) {
      const cachedData = service.get(key);
      if (cachedData) {
        return { data: cachedData, service: service };
      }
    }

    return { data: null, service: null };
  }

  private updateFieldInCache<T, U>(
    result: CachedDataResult<T>,
    storeName: TrudiIndexedDBStorageKey,
    key: string,
    field: EPropertyToUpdate,
    newValue: U
  ) {
    if (!newValue) return;
    const { data: cachedData, service } = result;

    if (!cachedData || !service) {
      throw new Error('Cached data or service is missing.');
    }

    const inputCachedData = { ...cachedData };

    switch (storeName) {
      case TrudiIndexedDBStorageKey.TASK_DETAIL:
        switch (field) {
          case EPropertyToUpdate.PROPERTY:
            inputCachedData[field] = newValue;
            break;
          case EPropertyToUpdate.PARTICIPANTS:
          case EPropertyToUpdate.USER_ID:
          case EPropertyToUpdate.IS_DETECTED_CONTACT:
            if (inputCachedData['conversations']) {
              inputCachedData['conversations'][0][field] = newValue;
            }
            break;
          default:
            break;
        }
        break;

      default:
        throw new Error(`Unsupported store name: ${storeName}`);
    }

    service.set(key, inputCachedData);
    this.updateIndexDB(storeName, inputCachedData).subscribe();
  }

  private updateIndexDB<T>(storeName: TrudiIndexedDBStorageKey, data: T) {
    return this.indexedDBService.update(storeName, data);
  }

  private deleteCachedData<T>(
    result: CachedDataResult<T>,
    storeName: TrudiIndexedDBStorageKey,
    key: string
  ) {
    const { data: cachedData, service } = result;
    if (!cachedData || !service) {
      throw new Error('Cached data or service is missing.');
    }
    service.delete(key);
    this.deleteIndexDB(storeName, key).subscribe();
  }

  private deleteIndexDB(storeName: TrudiIndexedDBStorageKey, key: string) {
    return this.indexedDBService.delete(storeName, key);
  }

  listenToSocketUpdates() {
    const combinedSocket$ = merge(
      this.rxWebSocketService.onSocketChangeConversationProperty,
      this.rxWebSocketService.onSocketAssignContact,
      this.rxWebSocketService.onSocketDeleteSecondaryContact,
      this.rxWebSocketService.onSocketMessage
    );

    return combinedSocket$.pipe(
      tap((value) => {
        const socketType = value.type as SocketType;
        switch (socketType) {
          case SocketType.changeConversationProperty:
            {
              const cachedData = this.getCacheFromAllServices(value.taskId);
              if (!cachedData.data || !cachedData.service) return;
              const originalProperty = (cachedData.data as TaskItem).property;
              const propertiesList =
                this.propertiesService.listPropertyAllStatus?.value || [];
              const updatedProperty = composePropertyObject(
                propertiesList,
                originalProperty,
                value
              );
              this.updateFieldInCache<TaskItem, Property>(
                cachedData,
                TrudiIndexedDBStorageKey.TASK_DETAIL,
                cachedData.data.id,
                EPropertyToUpdate.PROPERTY,
                updatedProperty
              );
            }
            break;

          case SocketType.assignContact:
          case SocketType.deleteInternalContact:
          case SocketType.deleteSecondaryEmail:
          case SocketType.deleteSecondaryPhone:
            {
              const cachedData = this.getCacheFromAllServices(value.taskId);
              if (!cachedData.data || !cachedData.service) return;
              const filteredParticipants = getUserFromParticipants(
                value['participants'] as IParticipant[]
              );
              this.updateFieldInCache<TaskItem, IParticipant[]>(
                cachedData,
                TrudiIndexedDBStorageKey.TASK_DETAIL,
                cachedData.data.id,
                EPropertyToUpdate.PARTICIPANTS,
                filteredParticipants
              );
              if (
                [
                  EConversationType.MESSENGER,
                  EConversationType.WHATSAPP,
                  EConversationType.VOICE_MAIL
                ].includes(
                  cachedData.data.conversations[0]?.conversationType
                ) &&
                filteredParticipants.length > 0
              ) {
                this.updateFieldInCache<TaskItem, string>(
                  cachedData,
                  TrudiIndexedDBStorageKey.TASK_DETAIL,
                  cachedData.data.id,
                  EPropertyToUpdate.USER_ID,
                  filteredParticipants[0].userId
                );
                this.updateFieldInCache<TaskItem, string>(
                  cachedData,
                  TrudiIndexedDBStorageKey.TASK_DETAIL,
                  cachedData.data.id,
                  EPropertyToUpdate.IS_DETECTED_CONTACT,
                  value['isDetectedContact']
                );
              }
            }
            break;
          case SocketType.changeStatusTask:
            {
              const cachedData = this.getCacheFromAllServices(value.taskId);
              if (!cachedData.data || !cachedData.service) return;
              this.deleteCachedData<TaskItem>(
                cachedData,
                TrudiIndexedDBStorageKey.TASK_DETAIL,
                cachedData.data.id
              );
            }
            break;
          default:
            break;
        }
      })
    );
  }
}
