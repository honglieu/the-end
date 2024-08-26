import { Injector, NgModule } from '@angular/core';
import { OtherContactMemoryCacheService } from './other-contact/services/other-contact-memory-cache.service';
import { SupplierMemoryCacheService } from './suppliers/services/supplier-memory-cache.service';
import { STORE_CACHE_MEMORY_LIMIT } from '@core/store/shared';
import { TenantOwnerPTMemoryCacheService } from './tenants-owners/property-tree/services/tenant-owner-pt-memory-cache.service';
import { TenantOwnerRmMemoryCacheService } from './tenants-owners/rent-manager/services/tenant-owner-rm-memory-cache.service';
import { TenantProspectMemoryCacheService } from './tenant-prospect/services/tenant-prospect-memory-cache.service';
import { OwnerProspectMemoryCacheService } from './owner-prospect/services/owner-prospect-memory-cache.service';
import { ContactBaseMemoryCacheService } from './contact-base/services/contact-base-memory-cachce.service';

@NgModule({
  providers: [
    {
      provide: OtherContactMemoryCacheService,
      useClass: OtherContactMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: SupplierMemoryCacheService,
      useClass: SupplierMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: TenantOwnerPTMemoryCacheService,
      useClass: TenantOwnerPTMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: TenantOwnerRmMemoryCacheService,
      useClass: TenantOwnerRmMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: TenantProspectMemoryCacheService,
      useClass: TenantProspectMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: OwnerProspectMemoryCacheService,
      useClass: OwnerProspectMemoryCacheService,
      deps: [STORE_CACHE_MEMORY_LIMIT]
    },
    {
      provide: ContactBaseMemoryCacheService,
      useClass: ContactBaseMemoryCacheService,
      deps: [Injector]
    }
  ]
})
export class ContactPageCacheModule {}
