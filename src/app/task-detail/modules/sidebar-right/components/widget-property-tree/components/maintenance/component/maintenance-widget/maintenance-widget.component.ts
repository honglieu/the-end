import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { IMaintenanceSyncData } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-sync-data.interface';
import { Subject } from 'rxjs';
import { MaintenanceSyncPtService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-sync-pt.service';
import { IMaintenanceInvoice } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { IMaintenanceRequest } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-request.interface';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';

@Component({
  selector: 'maintenance-widget',
  templateUrl: './maintenance-widget.component.html',
  styleUrls: ['./maintenance-widget.component.scss']
})
export class MaintenanceWidgetComponent implements OnInit, OnDestroy {
  @Input() requestCard: IMaintenanceRequest;
  @Input() invoiceCard: IMaintenanceInvoice;
  private $destroyed: Subject<void> = new Subject<void>();
  public ESyncPropertyTree = ESyncStatus;
  public maintenanceSyncData: IMaintenanceSyncData =
    this.maintenanceSyncDataService.getMaintenanceRequestDefaultValue;
  constructor(
    private maintenanceSyncDataService: MaintenanceSyncPtService,
    public trudiDynamicParamater: TrudiDynamicParameterService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy() {
    this.$destroyed.next();
    this.$destroyed.complete();
  }
}
