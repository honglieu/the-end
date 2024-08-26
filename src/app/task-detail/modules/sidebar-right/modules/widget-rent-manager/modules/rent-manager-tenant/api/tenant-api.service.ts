import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { ConversationService } from '@services/conversation.service';
import { TaskService } from '@services/task.service';
import { conversations } from 'src/environments/environment';
import { ITenantOptions } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';

@Injectable()
export class TenantApiService {
  constructor(
    private apiService: ApiService,
    private taskService: TaskService,
    private conversationService: ConversationService
  ) {}

  getTenant(leaseId: string) {
    return this.apiService.getAPI(
      conversations,
      `widget/get-rm-tenant-by-id?ptLeaseId=${leaseId}`
    );
  }

  getNewTenantOptions(): Observable<ITenantOptions> {
    const taskId = this.taskService.currentTask$.value.id;
    return this.apiService.getAPI(
      conversations,
      `widget/get-rm-tenant-options?taskId=${taskId}`
    );
  }

  getRecurringChargesByTenancy(propertyId: string) {
    return this.apiService.getAPI(
      conversations,
      'lease-renewal/recurring-charge',
      { propertyId }
    );
  }

  getIDsFromOtherService() {
    const propertyId =
      this.conversationService.currentConversation?.getValue()?.propertyId ||
      this.taskService.currentTask$?.value?.property?.id;
    const taskId = this.taskService.currentTask$.getValue()?.id;

    return {
      propertyId,
      taskId
    };
  }

  syncNewTenant(payload) {
    return this.apiService.postAPI(
      conversations,
      'widget/leasing/sync-tenancy-to-rm',
      payload
    );
  }

  removeSyncNewTenant(id) {
    return this.apiService.deleteAPI(
      conversations,
      `widget/leasing/rm-new-tenant/${id}`
    );
  }

  retrySyncNewTenant(id) {
    return this.apiService.postAPI(
      conversations,
      `widget/leasing/retry-sync-tenancy-to-rm/${id}`,
      {}
    );
  }
}
