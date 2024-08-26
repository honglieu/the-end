import { Component, OnInit } from '@angular/core';
import { Subject, defaultIfEmpty, map, takeUntil } from 'rxjs';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import { TrudiService } from '@services/trudi.service';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import { IWidgetLease } from '@/app/task-detail/utils/functions';
import { WidgetFormPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-form.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';

@Component({
  selector: 'list-widget-lease-renewal',
  templateUrl: './list-widget-lease-renewal.component.html',
  styleUrls: ['./list-widget-lease-renewal.component.scss']
})
export class ListWidgetLeaseRenewalComponent implements OnInit {
  public listWidgetLeases: IWidgetLease[];
  public idPropertyTree: string;
  private unsubscribe = new Subject<void>();
  constructor(
    public leaseRenewalService: LeaseRenewalService,
    public trudiService: TrudiService,
    public widgetFormPTService: WidgetFormPTService,
    public widgetPTService: WidgetPTService,
    public trudiDynamicParamater: TrudiDynamicParameterService
  ) {}

  ngOnInit(): void {
    this.getWidgetTrudiRes();
    this.getAllPTWidgetLease();
  }

  getWidgetTrudiRes() {
    this.leaseRenewalService.getSyncDataLeaseResponse
      .pipe(
        takeUntil(this.unsubscribe),
        map((res) => (res && Object.keys(res).length ? [res] : [])),
        defaultIfEmpty([])
      )
      .subscribe((list) => {
        this.listWidgetLeases = list;
      });
  }

  getAllPTWidgetLease() {
    this.widgetPTService
      .getPTWidgetStateByType<IWidgetLease[]>(PTWidgetDataField.LEASE_RENEWAL)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res?.[0]) {
          return;
        }

        this.listWidgetLeases = [res[0]] || [];

        const {
          endDate,
          startDate,
          rent,
          frequency,
          status,
          tenancyId,
          userPropertyGroup,
          effectiveDate,
          lastTimeSync,
          file,
          firstTimeSyncSuccess,
          idPropertyTree,
          isSuccessful
        } = this.listWidgetLeases[0] || {};

        this.leaseRenewalService.updateDataSyncResponse =
          this.widgetFormPTService.formatDataLease(
            status as LeaseRenewalSyncStatus,
            startDate,
            endDate,
            +rent,
            frequency,
            tenancyId,
            userPropertyGroup?.name,
            effectiveDate,
            lastTimeSync,
            file,
            firstTimeSyncSuccess,
            idPropertyTree,
            isSuccessful
          );
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();

    this.leaseRenewalService.updateDataSyncResponse = null;
  }
}
