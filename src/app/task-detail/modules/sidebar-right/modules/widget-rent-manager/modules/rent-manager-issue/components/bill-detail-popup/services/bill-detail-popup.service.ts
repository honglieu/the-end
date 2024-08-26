import { TaskService } from './../../../../../../../../../../services/task.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, of, switchMap } from 'rxjs';
import { EUserPayloadType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { GetListUserPayload } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { IInputToGetSupplier } from '@shared/types/users-supplier.interface';
import { RentManagerIssueApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-api.service';

interface IListUserPayload extends GetListUserPayload {
  userType?: EUserPayloadType[];
}

@Injectable()
export class BillDetailPopupService {
  constructor(
    private rentManagerIssueApiService: RentManagerIssueApiService,
    private taskService: TaskService
  ) {}

  private getListUserPayloadBS = new BehaviorSubject<IListUserPayload>(null);
  private getListVendorPayloadBS = new BehaviorSubject<IInputToGetSupplier>(
    null
  );

  private isLoadingBS = new BehaviorSubject(false);
  public isLoading$ = this.isLoadingBS.asObservable();

  getListUser() {
    return this.getListUserPayloadBS.pipe(
      distinctUntilChanged(),
      switchMap((rs) => {
        if (rs) return this.rentManagerIssueApiService.getListUserApi(rs);
        return of(null);
      })
    );
  }

  fetchListUser(body: Partial<IListUserPayload>) {
    this.getListUserPayloadBS.next({
      ...this.getListUserPayloadBS.value,
      ...body
    });
  }

  fetchListVendor(body: Partial<IInputToGetSupplier>) {
    this.getListVendorPayloadBS.next({
      ...this.getListVendorPayloadBS.value,
      ...body
    });
  }
  getListVendor() {
    return this.getListVendorPayloadBS.pipe(
      distinctUntilChanged(),
      switchMap((res) => {
        if (!res) return of();
        return this.rentManagerIssueApiService.getListSuppliers({
          ...res,
          propertyId: this.taskService.currentTask$.value?.property?.id || '',
          agencyId: this.taskService.currentTask$.value.agencyId
        });
      })
    );
  }
}
