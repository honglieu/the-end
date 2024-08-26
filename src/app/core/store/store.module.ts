import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { CalendarDashboardEffects } from './calendar-dashboard';
import { CalendarDashboardCacheService } from './calendar-dashboard/services/calendar-dashboard-memory-cache.service';
import { contactBaseEffects } from './contact-page/contact-base/effects/contact-base.effects';
import { ContactPageCacheModule } from './contact-page/contact-page-cache.module';
import { OtherContactEffects } from './contact-page/other-contact/effects/other-conact.effects';
import { OwnerProspectEffects } from './contact-page/owner-prospect/effects/owner-prospect.effects';
import { SupplierEffects } from './contact-page/suppliers/effects/supplier.effects';
import { TenantProspectEffects } from './contact-page/tenant-prospect/effects/tenant-prospect.effects';
import { TenantsOwnersEffectsPT } from './contact-page/tenants-owners/property-tree/effects/tenants-owners-pt.effects';
import { TenantsOwnersEffectsRM } from './contact-page/tenants-owners/rent-manager/effects/tenants-owners-rm.effects';
import { ConversationMemoryCacheService } from './conversation';
import { ConversationEffects } from './conversation/effects/conversation.effects';
import { MessageEffects, MessageMemoryCacheService } from './message';
import { metaReducers, rootReducers } from './root.reducer';
import { STORE_CACHE_MEMORY_LIMIT } from './shared';
import { TaskGroupEffects, TaskGroupMemoryCacheService } from './task-group';
import {
  CalendarEventMemoryCacheService,
  TaskPreviewEffects,
  TaskPreviewMemoryCacheService
} from './task-preview';
import { TaskFolderMemoryCacheService } from './taskFolder';
import { TaskFolderEffects } from './taskFolder/effects/task-folder.effects';
import { MailFolderEffects } from './mail-folder/effects/mail-folder.effects';
import { MailFolderMemoryCacheService } from './mail-folder';
import { AppMessageEffects, AppMessageMemoryCacheService } from './app-message';
import { VoiceMailEffects, VoiceMailMemoryCacheService } from './voice-mail';
import { TaskDetailEffects } from './task-detail/effects/task-detail.effects';
import { TaskWorkflowMemoryCacheService } from './task-detail/services/task-workflow-memory-cache.service';
import { TaskConversationMemoryCacheService } from './task-detail';
import {
  MessagesMailFolderEffects,
  MessagesMailFolderMemoryCacheService
} from './message-mail-folder';
import { TaskDetailMemoryCacheService } from './task-detail/services/task-detail-memory-cache.service';
import { VoicemailDetailTaskMemoryCacheService } from './voice-mail-detail/services/voice-mail-detail-task-memory-cache.service';
import { VoicemailDetailMessagesMemoryCacheService } from './voice-mail-detail/services/voice-mail-detail-messages-memory-cache.service';
import { VoiceMailDetailEffects } from './voice-mail-detail/effects/voice-mail-detail.effects';
import { FacebookEffects, FacebookMemoryCacheService } from './facebook';
import {
  SmsMessageEffects,
  SmsMessageMemoryCacheService
} from '@/app/core/store/sms-message';
import {
  FacebookDetailEffects,
  FacebookDetailTaskMemoryCacheService
} from './facebook-detail';
import { FacebookDetailMessagesMemoryCacheService } from './facebook-detail/services/facebook-detail-messages-memory-cache.service';
import { WhatsappEffects, WhatsappMemoryCacheService } from './whatsapp';
import {
  WhatsappDetailEffects,
  WhatsappDetailTaskMemoryCacheService
} from './whatsapp-detail';
import { WhatsappDetailMessagesMemoryCacheService } from './whatsapp-detail/services/whatsapp-detail-messages-memory-cache.service';

@NgModule({
  imports: [
    ContactPageCacheModule,
    StoreModule.forRoot(rootReducers, {
      metaReducers,
      runtimeChecks: {
        // strictStateImmutability and strictActionImmutability are enabled by default
        strictStateImmutability: false,
        strictActionImmutability: false,
        strictStateSerializability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: true,
        strictActionTypeUniqueness: true
      }
    }),
    StoreRouterConnectingModule.forRoot(),
    EffectsModule.forRoot([
      MessageEffects,
      ConversationEffects,
      TaskFolderEffects,
      TaskGroupEffects,
      TaskPreviewEffects,
      CalendarDashboardEffects,
      TaskPreviewEffects,
      TenantsOwnersEffectsRM,
      TenantsOwnersEffectsPT,
      SupplierEffects,
      OtherContactEffects,
      TenantProspectEffects,
      OwnerProspectEffects,
      contactBaseEffects,
      MailFolderEffects,
      AppMessageEffects,
      MessagesMailFolderEffects,
      VoiceMailEffects,
      VoiceMailDetailEffects,
      TaskDetailEffects,
      FacebookEffects,
      FacebookDetailEffects,
      SmsMessageEffects,
      WhatsappEffects,
      WhatsappDetailEffects
    ])
  ],
  exports: [StoreModule, EffectsModule, StoreRouterConnectingModule],
  providers: [
    {
      provide: STORE_CACHE_MEMORY_LIMIT,
      useValue: 5242880 // 5MB
    },
    {
      provide: TaskGroupMemoryCacheService,
      useClass: TaskGroupMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: MessageMemoryCacheService,
      useClass: MessageMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: CalendarDashboardCacheService,
      useClass: CalendarDashboardCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: TaskFolderMemoryCacheService,
      useClass: TaskFolderMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: TaskPreviewMemoryCacheService,
      useClass: TaskPreviewMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: AppMessageMemoryCacheService,
      useClass: AppMessageMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: SmsMessageMemoryCacheService,
      useClass: SmsMessageMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: TaskWorkflowMemoryCacheService,
      useClass: TaskWorkflowMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: TaskConversationMemoryCacheService,
      useClass: TaskConversationMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: ConversationMemoryCacheService,
      useClass: ConversationMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: CalendarEventMemoryCacheService,
      useClass: CalendarEventMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: MailFolderMemoryCacheService,
      useClass: MailFolderMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: MessagesMailFolderMemoryCacheService,
      useClass: MessagesMailFolderMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: VoiceMailMemoryCacheService,
      useClass: VoiceMailMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: VoicemailDetailTaskMemoryCacheService,
      useClass: VoicemailDetailTaskMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: VoicemailDetailMessagesMemoryCacheService,
      useClass: VoicemailDetailMessagesMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: TaskDetailMemoryCacheService,
      useClass: TaskDetailMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: FacebookMemoryCacheService,
      useClass: FacebookMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: FacebookDetailMessagesMemoryCacheService,
      useClass: FacebookDetailMessagesMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: FacebookDetailTaskMemoryCacheService,
      useClass: FacebookDetailTaskMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: WhatsappMemoryCacheService,
      useClass: WhatsappMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: WhatsappDetailMessagesMemoryCacheService,
      useClass: WhatsappDetailMessagesMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: WhatsappDetailTaskMemoryCacheService,
      useClass: WhatsappDetailTaskMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    }
  ]
})
export class TrudiStoreModule {}
