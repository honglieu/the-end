import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, map, takeUntil } from 'rxjs';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  ERentManagerAction,
  ERentManagerButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { RentManagerVacateDetailService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-vacate-detail/rent-manager-vacate-detail.service';

@Component({
  selector: 'vacate-detail-rm-widget',
  templateUrl: './vacate-detail-rm-widget.component.html',
  styleUrls: ['./vacate-detail-rm-widget.component.scss']
})
export class VacateDetailRmWidgetComponent implements OnInit {
  destroyed$ = new Subject();
  constructor(
    private widgetRMService: WidgetRMService,
    private rentManagerVacateDetailService: RentManagerVacateDetailService,
    private taskSerice: TaskService,
    private toastrService: ToastrService,
    private trudiService: TrudiService,
    private stepService: StepService
  ) {}

  public vacateDetail;

  ngOnInit(): void {
    this.widgetRMService
      .getRMWidgetStateByType(RMWidgetDataField.VACATE_DETAIL)
      .pipe(
        takeUntil(this.destroyed$),
        map((data) => (Array.isArray(data) ? data[0] : null))
      )
      .subscribe((vacateDetail: any) => {
        this.vacateDetail = vacateDetail;
      });
  }

  public retrySync() {
    this.updateVacate([
      { ...this.vacateDetail, status: ESyncStatus.INPROGRESS }
    ]);
    const payload = {
      taskId: this.taskSerice.currentTaskId$.getValue(),
      variables: {
        tenancyId: this.vacateDetail?.tenancy?.id,
        moveInDate: this.widgetRMService.transformDate(
          this.vacateDetail?.moveInDate
        ),
        vacateDate: this.widgetRMService.transformDate(
          this.vacateDetail?.vacateDate
        ),
        noticeDate: this.widgetRMService.transformDate(
          this.vacateDetail?.noticeDate
        ),
        expectedMoveOutDate: this.widgetRMService.transformDate(
          this.vacateDetail?.expectedMoveOutDate
        )
      }
    };
    this.rentManagerVacateDetailService.syncToRentManager(payload).subscribe({
      next: (response) => {
        const vacateDetail = response?.body?.dataSync;
        if (vacateDetail) {
          const newVacate = {
            ...(this.vacateDetail || {}),
            updatedAt: vacateDetail.updatedAt,
            status: vacateDetail.status,
            isSuccessful: vacateDetail.isSuccessful,
            firstTimeSyncSuccess: vacateDetail.status == ESyncStatus.COMPLETED
          };
          this.updateVacate([newVacate]);
          if (vacateDetail.status == ESyncStatus.COMPLETED) {
            this.updateStep();
          }
        }
        const errorMessage = response.body.errorMessage;
        if (errorMessage) {
          this.toastrService.error(errorMessage);
        }
      },
      error: (response) => {
        if (response?.error?.message) {
          this.toastrService.error(response?.error?.message);
        }
        const vacate = {
          ...(this.vacateDetail || {}),
          updatedAt: new Date(),
          status: ESyncStatus.FAILED,
          firstTimeSyncSuccess: false
        };
        this.updateVacate([vacate]);
      }
    });
  }

  public removeWidget() {
    if (this.vacateDetail?.id) {
      const taskId = this.taskSerice.currentTaskId$.getValue();
      this.rentManagerVacateDetailService
        .remoteVacateDetail(taskId)
        .subscribe((res) => {
          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.VACATE_DETAIL,
            'REMOVE',
            res
          );
        });
    } else {
      this.widgetRMService.setRMWidgetStateByType(
        RMWidgetDataField.VACATE_DETAIL,
        'REMOVE',
        []
      );
    }
  }

  public openVacateDetailForm() {
    this.widgetRMService.setPopupWidgetState(ERentManagerType.VACATE_DETAIL);
  }

  private updateVacate(data) {
    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.VACATE_DETAIL,
      'UPDATE',
      data
    );
  }

  private updateStep() {
    const trudiBtnResponeData = this.trudiService.getTrudiResponse?.getValue();
    const currentStep = this.stepService.currentRMStep.getValue();
    if (trudiBtnResponeData?.isTemplate) {
      this.stepService.setChangeBtnStatusFromRMWidget(true);
      this.stepService.updateButtonStatusTemplate(
        currentStep?.id,
        ERentManagerButtonComponent.VACATE_DETAIL,
        currentStep
          ? ERentManagerAction[currentStep?.action.toUpperCase()]
          : ERentManagerAction.RM_NEW_COMPONENT
      );
    }
  }
}
