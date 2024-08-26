import { Component, OnDestroy, OnInit } from '@angular/core';
import { SendMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { takeUntil } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { IMaintenanceRequest } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-request.interface';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { TaskService } from '@services/task.service';
import { MaintenanceSyncPtApiService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-sync-pt-api.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { EntityTypeNote } from '@shared/enum/task.enum';
import { ETypeNotesPropertyTreeWidget } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/notes/type-notes-property-tree-widget.enum';
import { EButtonStepKey } from '@trudi-ui';

@Component({
  selector: 'maintenance-request-card',
  templateUrl: './maintenance-request-card.component.html',
  styleUrls: ['./maintenance-request-card.component.scss']
})
export class MaintenanceRequestCardComponent implements OnInit, OnDestroy {
  public maintenanceRequest: IMaintenanceRequest;

  private $destroyed: Subject<void> = new Subject<void>();
  public TYPE_SYNC_MAINTENANCE = ESyncStatus;
  public TYPE_STATUS_MAINTENANCE = SendMaintenanceType;
  public isShowStatusSection: boolean = true;
  public readonly eTypeNote = ETypeNotesPropertyTreeWidget;
  public maintenanceNotes: string;
  public expenditureLimit: string;
  readonly EButtonStepKey = EButtonStepKey;

  constructor(
    private maintenanceSyncPTAPIService: MaintenanceSyncPtApiService,
    private widgetPTService: WidgetPTService,
    private taskService: TaskService,
    public stepService: StepService
  ) {}

  ngOnInit(): void {
    this.getMaintenanceRequest();
  }
  private getMaintenanceRequest() {
    const taskId = this.taskService.currentTaskId$.getValue();
    combineLatest([
      this.widgetPTService.getPTWidgetStateByType<IMaintenanceRequest[]>(
        PTWidgetDataField.MAINTENANCE_REQUEST
      ),
      this.taskService.getNoteByTaskId(taskId, EntityTypeNote.property)
    ])
      .pipe(takeUntil(this.$destroyed))
      .subscribe(([maintenanceRequests, maintenanceNotes]) => {
        if (maintenanceRequests?.length) {
          this.maintenanceRequest = maintenanceRequests[0];
        }
        if (maintenanceNotes) {
          this.maintenanceNotes = maintenanceNotes.note;
          this.expenditureLimit = maintenanceNotes.expenditureLimit;
        }
      });
  }
  get firstTimeSyncSuccess(): boolean {
    return this.maintenanceRequest?.updateFromSocket || false;
  }

  get summary(): string {
    return this.maintenanceRequest?.summary || '';
  }

  get status(): string {
    return this.maintenanceRequest?.status || SendMaintenanceType.OPEN;
  }

  get syncStatus(): string {
    return this.maintenanceRequest?.syncStatus || ESyncStatus.NOT_SYNC;
  }

  get statusClass(): string {
    switch (this.maintenanceRequest?.status) {
      case SendMaintenanceType.OPEN:
        return 'maintenance-card-success';
      case SendMaintenanceType.CANCELLED:
        return 'maintenance-card-danger';
      case SendMaintenanceType.COMPLETE:
        return 'maintenance-card-success';
    }
    return 'maintenance-card-info';
  }

  get isShowStatus(): boolean {
    const { resultId, status, syncStatus } = this.maintenanceRequest || {};
    return (
      !!resultId ||
      status !== SendMaintenanceType.OPEN ||
      (resultId && syncStatus === this.TYPE_SYNC_MAINTENANCE.INPROGRESS) // Show the status after a successful or failed synchronization
    );
  }

  public handleClickCard(): void {
    this.widgetPTService.setPopupWidgetState(
      EPropertyTreeType.MAINTENANCE_REQUEST
    );
  }

  public handleRemoveCard(): void {
    this.maintenanceSyncPTAPIService
      .removeSync()
      .pipe(takeUntil(this.$destroyed))
      .subscribe((result) => {
        this.widgetPTService.setPTWidgetStateByType(
          PTWidgetDataField.MAINTENANCE_REQUEST,
          'REMOVE',
          !!result ? [result] : []
        );
      });
  }

  public handleRetryCard(): void {
    this.maintenanceSyncPTAPIService
      .retrySync()
      .pipe(takeUntil(this.$destroyed))
      .subscribe((data) => {
        if (data && data.syncStatus) {
          this.widgetPTService.setPTWidgetStateByType(
            PTWidgetDataField.MAINTENANCE_REQUEST,
            'UPDATE',
            [data]
          );
        }
      });
  }

  ngOnDestroy() {
    this.$destroyed.next();
    this.$destroyed.complete();
  }
}
