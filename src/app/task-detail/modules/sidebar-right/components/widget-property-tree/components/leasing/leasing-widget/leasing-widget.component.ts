import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AddTenancyJob,
  LeasingWidgetRequestTrudiResponse
} from '@shared/types/trudi.interface';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { Subject, takeUntil } from 'rxjs';
import { LeasingWidgetService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/leasing.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { TaskService } from '@services/task.service';
import { ToastrService } from 'ngx-toastr';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { TrudiService } from '@services/trudi.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { EButtonStepKey } from '@trudi-ui';
import { ENoteToolbarAction } from '@/app/task-detail/modules/internal-note/utils/internal-note.enum';

@Component({
  selector: 'leasing-widget',
  templateUrl: './leasing-widget.component.html',
  styleUrls: ['./leasing-widget.component.scss']
})
export class LeasingWidgetComponent implements OnInit, OnDestroy {
  public syncLeasingData: AddTenancyJob;
  public syncPropertyTree: string;
  public paymentTypes = {
    1: 'day',
    2: 'week',
    3: 'fortnight',
    4: 'month',
    5: 'quarter',
    6: 'year'
  };
  private unsubscribe = new Subject<void>();
  private leaseId: string = '';
  public taskId: string = '';
  public errorMessSync: string = '';
  public leaseItem: LeasingWidgetRequestTrudiResponse;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  readonly EButtonStepKey = EButtonStepKey;

  constructor(
    public leasingWidgetService: LeasingWidgetService,
    public widgetPTService: WidgetPTService,
    public taskService: TaskService,
    private toastService: ToastrService,
    private calendarEventWidgetService: EventCalendarService,
    public trudiService: TrudiService,
    public stepService: StepService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {
    this.getLeasingWidgetData();
    this.updateLeasingStatus();
  }

  getLeasingWidgetData() {
    const currentStep = this.stepService.currentPTStep.getValue();
    this.widgetPTService
      .getPTWidgetStateByType<LeasingWidgetRequestTrudiResponse[]>(
        PTWidgetDataField.LEASING
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((leasesData) => {
        this.leasingWidgetService.setSyncLeasingStatus(ESyncStatus.NOT_SYNC);
        const leaseItem = leasesData[0];
        this.leaseItem = leasesData[0];
        this.leasingWidgetService.setSyncLeasingData(leaseItem);
        this.syncLeasingData = leaseItem?.data;
        this.errorMessSync = leaseItem?.errorMessSync;
        this.leaseId = leaseItem?.id;
        if (leaseItem?.syncStatus) {
          this.updateSyncLeasingStatus(leaseItem?.syncStatus);
        }
        const trudiBtnResponeData =
          this.trudiService.getTrudiResponse?.getValue();
        if (leaseItem?.syncStatus === ESyncStatus.COMPLETED) {
          if (trudiBtnResponeData?.isTemplate) {
            this.stepService.setChangeBtnStatusFromPTWidget(true);
            this.stepService.updateButtonStatusTemplate(
              currentStep?.id,
              EPropertyTreeButtonComponent.NEW_TENANCY,
              EButtonAction.PT_NEW_COMPONENT
            );
          } else {
            this.leasingWidgetService.updateLeasingTrudiResponse();
          }
        }
      });
  }

  updateLeasingStatus() {
    this.leasingWidgetService.syncLeasingStatus$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => (this.syncPropertyTree = data));
  }

  openLeasingModal() {
    this.widgetPTService.setPopupWidgetState(EPropertyTreeType.NEW_TENANCY);
  }

  getPaymentPeriodText(): string {
    return this.paymentTypes[this.syncLeasingData.paymentPeriod];
  }

  updateSyncLeasingStatus(status) {
    this.leasingWidgetService.setSyncLeasingStatus(status);
  }

  handleRetry() {
    const currentStep = this.stepService.currentPTStep.getValue();
    this.updateSyncLeasingStatus(ESyncStatus.INPROGRESS);
    this.leasingWidgetService
      .retryLeasingToPT(this.leaseId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (data) => {
          this.widgetPTService.setPTWidgetStateByType(
            PTWidgetDataField.LEASING,
            'UPDATE',
            [
              {
                ...data?.lease,
                firstTimeSyncSuccess:
                  data?.lease.syncStatus === ESyncStatus.COMPLETED
              }
            ]
          );
          if (data?.lease.syncStatus === ESyncStatus.COMPLETED) {
            this.toastService.error('This tenancy already exists');
          }
          this.updateSyncLeasingStatus(data?.lease?.syncStatus);
          const trudiBtnResponeData =
            this.trudiService.getTrudiResponse?.getValue();
          if (data?.lease?.errorMessSync) {
            this.toastService.error(data?.lease?.errorMessSync);
            if (data?.lease?.syncStatus === ESyncStatus.COMPLETED) {
              this.leasingWidgetService.handleRefreshListUserProperty();
              if (trudiBtnResponeData?.isTemplate) {
                this.stepService.setChangeBtnStatusFromPTWidget(true);
                this.stepService.updateButtonStatusTemplate(
                  currentStep?.id,
                  EPropertyTreeButtonComponent.NEW_TENANCY,
                  EButtonAction.PT_NEW_COMPONENT,
                  data?.lease?.id
                );
              }
              this.calendarEventWidgetService.refreshListEventCalendarWidget(
                this.taskService.currentTaskId$.getValue()
              );
            }
          }
        }
      });
  }

  handleRemove() {
    if (this.isShowCancelBtn) {
      this.leasingWidgetService.cancelLeasingToPT(this.leaseId).subscribe({
        next: (res) => {
          if (res) {
            this.widgetPTService.setPTWidgetStateByType(
              PTWidgetDataField.LEASING,
              'UPDATE',
              [
                {
                  ...res?.lease,
                  data: {
                    ...res?.lease.data,
                    firstTimeSyncSuccess:
                      res?.lease.syncStatus === ESyncStatus.COMPLETED
                  }
                }
              ]
            );
          }
        }
      });
    } else {
      this.leasingWidgetService.removeLeasingToPT(this.leaseId).subscribe({
        next: () => {
          this.widgetPTService.setPTWidgetStateByType(
            PTWidgetDataField.LEASING,
            'REMOVE',
            []
          );
        },
        error: () => {
          console.log('error');
        },
        complete: () => {
          this.syncLeasingData = null;
        }
      });
    }
  }

  get isShowCancelBtn() {
    const { action, syncStatus } = this.leaseItem;
    return (
      syncStatus === ESyncStatus.FAILED && action === ENoteToolbarAction.ATTACH
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
