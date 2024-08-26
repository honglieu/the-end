import { Injectable, Injector } from '@angular/core';
import { OtherContactMemoryCacheService } from '@core/store/contact-page/other-contact/services/other-contact-memory-cache.service';
import { SupplierMemoryCacheService } from '@core/store/contact-page/suppliers/services/supplier-memory-cache.service';
import { TenantOwnerPTMemoryCacheService } from '@core/store/contact-page/tenants-owners/property-tree/services/tenant-owner-pt-memory-cache.service';
import { TenantOwnerRmMemoryCacheService } from '@core/store/contact-page/tenants-owners/rent-manager/services/tenant-owner-rm-memory-cache.service';
import { TenantProspectMemoryCacheService } from '@core/store/contact-page/tenant-prospect/services/tenant-prospect-memory-cache.service';
import { OwnerProspectMemoryCacheService } from '@core/store/contact-page/owner-prospect/services/owner-prospect-memory-cache.service';

@Injectable()
export class ContactBaseMemoryCacheService {
  private supplierCacheService: SupplierMemoryCacheService;
  private otherContactMemoryCacheService: OtherContactMemoryCacheService;
  private tenantOwnerPTMemoryCacheService: TenantOwnerPTMemoryCacheService;
  private tenantOwnerRmMemoryCacheService: TenantOwnerRmMemoryCacheService;
  private tenantProspectMemoryCacheService: TenantProspectMemoryCacheService;
  private ownerProspectMemoryCacheService: OwnerProspectMemoryCacheService;

  constructor(private injector: Injector) {
    this.supplierCacheService = this.injector.get(SupplierMemoryCacheService);
    this.otherContactMemoryCacheService = this.injector.get(
      OtherContactMemoryCacheService
    );
    this.tenantOwnerPTMemoryCacheService = this.injector.get(
      TenantOwnerPTMemoryCacheService
    );
    this.tenantOwnerRmMemoryCacheService = this.injector.get(
      TenantOwnerRmMemoryCacheService
    );
    this.tenantProspectMemoryCacheService = this.injector.get(
      TenantProspectMemoryCacheService
    );
    this.ownerProspectMemoryCacheService = this.injector.get(
      OwnerProspectMemoryCacheService
    );
  }

  public clear() {
    const clearCache = [
      this.supplierCacheService,
      this.otherContactMemoryCacheService,
      this.tenantOwnerPTMemoryCacheService,
      this.tenantOwnerRmMemoryCacheService,
      this.tenantProspectMemoryCacheService,
      this.ownerProspectMemoryCacheService
    ];

    clearCache.forEach((cache) => {
      cache.clear();
    });
  }
}
