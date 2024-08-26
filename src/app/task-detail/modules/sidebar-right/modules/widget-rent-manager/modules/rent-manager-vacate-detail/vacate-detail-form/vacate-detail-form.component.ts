import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  Observable,
  Subject,
  combineLatest,
  filter,
  map,
  take,
  takeUntil
} from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  ERentManagerAction,
  ERentManagerButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import {
  getFilteredAndMappedTenancies,
  tenancyRMFilter
} from '@/app/user/utils/user.type';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { RentManagerVacateDetailService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-vacate-detail/rent-manager-vacate-detail.service';
import { FormVacateDetailService } from './vacate-detail-form.service';
import { SharedService } from '@services/shared.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';

@Component({
  selector: 'vacate-detail-form',
  templateUrl: './vacate-detail-form.component.html',
  styleUrls: ['./vacate-detail-form.component.scss']
})
export class VacateDetailFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public vacateDetailForm: FormGroup;
  public visiblePopup$: Observable<boolean>;
  public tenancies;
  public vacateDetail;
  public eSyncStatus = ESyncStatus;
  public submitted: boolean = false;
  public syncStatus = ESyncStatus.NOT_SYNC;
  public lastSyncTime;
  isArchiveMailbox: boolean;
  isConsole: boolean;

  constructor(
    private formVacateDetailService: FormVacateDetailService,
    private propertiesService: PropertiesService,
    private widgetRMService: WidgetRMService,
    private taskService: TaskService,
    private rentManagerVacateDetailService: RentManagerVacateDetailService,
    private eventCalendarService: EventCalendarService,
    private toastrService: ToastrService,
    private trudiService: TrudiService,
    private stepService: StepService,
    private inboxService: InboxService,
    private sharedService: SharedService,
    private showSidebarRightService: ShowSidebarRightService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {
    this.vacateDetailForm = this.formVacateDetailService.form;
    this.vacateDetailForm.markAsPristine();
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.getTenancies();
    this.setVisiblePopup();
    this.setVacateDetail();
    this.setTenancies();
    this.prefillDate();
    this.onFormControlValueChanges();
  }

  public onSubmit() {
    if (this.isArchiveMailbox) return;
    this.submitted = true;
    if (this.formVacateDetailService.validate()) {
      const vacateDetail = this.beforeSync();

      const taskId = this.taskService.currentTaskId$.getValue();
      const payload = {
        taskId,
        variables: vacateDetail
      };

      this.syncVacateDetail(payload);

      this.closePopup();
      this.showSidebarRightService.handleToggleSidebarRight(true);
    }
  }

  public closePopup() {
    this.widgetRMService.setPopupWidgetState(null);
  }

  private setVacateDetail() {
    this.widgetRMService
      .getRMWidgetStateByType(RMWidgetDataField.VACATE_DETAIL)
      .pipe(
        takeUntil(this.destroy$),
        map((vacateDetails) => Array.isArray(vacateDetails) && vacateDetails[0])
      )
      .subscribe((vacateDetail) => {
        this.vacateDetail = this.transformVacateDetail(vacateDetail) || {};
        this.patchFormData(this.vacateDetail);
        this.syncStatus = this.vacateDetail?.status || ESyncStatus.NOT_SYNC;
        this.lastSyncTime = this.vacateDetail?.updatedAt;
        if (this.vacateDetail.status == ESyncStatus.INPROGRESS) {
          this.vacateDetailForm.disable({ emitEvent: false, onlySelf: true });
        } else {
          this.vacateDetailForm.enable({ emitEvent: false, onlySelf: true });
        }
        if (this.tenancyIdControl.value && this.tenancyIdControl.valid) {
          this.tenancyIdControl.disable({ emitEvent: false, onlySelf: true });
        }
        if (
          this.vacateDetail?.id &&
          this.vacateDetail.status != ESyncStatus.PENDING
        ) {
          this.updateSyncStatus();
        }
      });
  }

  private transformVacateDetail(vacateDetail) {
    if (!vacateDetail) return vacateDetail;

    const transform = (date) =>
      date ? new Date(new Date(date).setHours(0, 0, 0, 0)) : date;

    const dateProps = [
      'moveInDate',
      'vacateDate',
      'noticeDate',
      'expectedMoveOutDate'
    ];

    return vacateDetail;
  }

  private onFormControlValueChanges() {
    const dateControls = [
      this.moveInDateControl,
      this.vacateDateControl,
      this.noticeDateControl,
      this.expectedMoveOutDateControl
    ];

    combineLatest([
      this.moveInDateControl.valueChanges,
      this.vacateDateControl.valueChanges
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([startDate, endDate]) => {
        if (!startDate || !endDate) return;
        const isValidDate =
          new Date(endDate).setHours(0, 0, 0, 0) >=
          new Date(startDate).setHours(0, 0, 0, 0);
        if (isValidDate) {
          this.moveInDateControl.setErrors(null);
          this.vacateDateControl.setErrors(null);
        }
      });
  }

  private updateSyncStatus() {
    this.vacateDetailForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncStatus = ESyncStatus.UN_SYNC;
        this.lastSyncTime = new Date();
      });
  }

  private setTenancies() {
    this.propertiesService.peopleList$
      .pipe(
        map((data) => getFilteredAndMappedTenancies(data, tenancyRMFilter)),
        takeUntil(this.destroy$)
      )
      .subscribe((tenancies) => {
        this.tenancies = tenancies;
      });
  }

  private getTenancies() {
    this.propertiesService.getPeopleInSelectPeople(
      this.propertiesService.currentPropertyId.getValue()
    );
  }

  private prefillDate() {
    this.tenancyIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tenancyId) => {
        const tenancy = this.tenancies?.find((t) => t.id == tenancyId);
        const lease = tenancy?.userPropertyGroupLeases?.find(
          (l) => l.idUserPropertyGroup == tenancyId
        );
        this.moveInDateControl.setValue(lease?.moveInDate);
        this.vacateDateControl.setValue(lease?.vacateDate);
        this.expectedMoveOutDateControl.setValue(lease?.expectedMoveOutDate);
        this.noticeDateControl.setValue(lease?.noticeDate);
      });
  }

  private setVisiblePopup() {
    this.visiblePopup$ = this.widgetRMService.getPopupWidgetState().pipe(
      map((state) => state == ERentManagerType.VACATE_DETAIL),
      takeUntil(this.destroy$)
    );
  }

  private refreshCalenderWidget() {
    this.taskService.currentTaskId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((taskId) => {
        this.eventCalendarService.refreshListEventCalendarWidget(taskId);
      });
  }

  private patchFormData(vacateDetail) {
    if (!vacateDetail) return;
    const {
      tenancyId = null,
      moveInDate = null,
      vacateDate = null,
      noticeDate = null,
      expectedMoveOutDate = null
    } = vacateDetail;
    this.vacateDetailForm.patchValue({
      tenancyId,
      moveInDate:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          moveInDate
        ),
      vacateDate:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          vacateDate
        ),
      noticeDate:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          noticeDate
        ),
      expectedMoveOutDate:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          expectedMoveOutDate
        )
    });
  }

  private updateVacateDetailWidget(data) {
    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.VACATE_DETAIL,
      'UPDATE',
      data
    );
  }

  private beforeSync() {
    const vacateFormValue = this.formVacateDetailService.form.getRawValue();
    const mapVacateDetail = {
      ...vacateFormValue,
      moveInDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(
        vacateFormValue.moveInDate
      ),
      noticeDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(
        vacateFormValue.noticeDate
      ),
      vacateDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(
        vacateFormValue.vacateDate
      ),
      expectedMoveOutDate:
        this.agencyDateFormatService.expectedTimezoneStartOfDay(
          vacateFormValue.expectedMoveOutDate
        )
    };
    const vacateDetail = {
      id: this.vacateDetail.id,
      ...mapVacateDetail,
      tenancy: this.tenancies.find(
        (tenancy) => tenancy.id == vacateFormValue.tenancyId
      ),
      status: ESyncStatus.INPROGRESS
    };
    this.updateVacateDetailWidget([vacateDetail]);
    return mapVacateDetail;
  }

  private syncVacateDetail(payload) {
    const response$ = new Subject<any>();
    const errorMessage$ = new Subject<string>();

    // update widget
    response$.pipe(take(1)).subscribe((vacateDetail) => {
      if (vacateDetail.status == ESyncStatus.COMPLETED) {
        this.refreshCalenderWidget();
      }
      const newVacate = {
        ...vacateDetail,
        firstTimeSyncSuccess: vacateDetail.status == ESyncStatus.COMPLETED
      };
      this.updateVacateDetailWidget([newVacate]);
    });

    // update step button
    response$.pipe(take(1)).subscribe((vacateDetail) => {
      const trudiBtnResponeData =
        this.trudiService.getTrudiResponse?.getValue();
      const currentStep = this.stepService.currentRMStep.getValue();
      if (vacateDetail?.status === ESyncStatus.COMPLETED) {
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
    });

    // handle error
    errorMessage$.pipe(take(1), filter(Boolean)).subscribe((message) => {
      this.toastrService.error(message);
    });

    const mapSyncReponse = (response) => {
      const dataSync = response.body?.dataSync || {};
      return {
        data: {
          ...(dataSync || {}),
          status: dataSync?.status,
          tenancy: this.tenancies?.find((t) => t?.id == dataSync?.tenancyId),
          noticeDate: dataSync?.noticeDate || null,
          expectedMoveOutDate: dataSync?.expectedMoveOutDate || null
        },
        errorMessage: response.body?.errorMessage
      };
    };

    this.rentManagerVacateDetailService
      .syncToRentManager(payload)
      .pipe(map(mapSyncReponse), take(1))
      .subscribe({
        next: (response) => {
          response$.next(response.data);
          errorMessage$.next(response?.errorMessage);
        },
        error: (response) => {
          errorMessage$.next(response?.error?.message);
          const vacateDetail = {
            ...this.vacateDetail,
            status: ESyncStatus.FAILED,
            updatedAt: this.vacateDetail.updatedAt || new Date(),
            firstTimeSyncSuccess: false
          };
          this.updateVacateDetailWidget([vacateDetail]);
        }
      });
  }

  private transformDate(date) {
    if (!date) return date;

    const dateLocal = new Date(date);
    const dateUTC = Date.UTC(
      dateLocal.getUTCFullYear(),
      dateLocal.getUTCMonth(),
      dateLocal.getUTCDate(),
      0,
      0,
      0,
      0
    );

    return new Date(dateUTC);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.formVacateDetailService.form.enable();
    this.formVacateDetailService.form.reset();
  }

  get tenancyIdControl() {
    return this.vacateDetailForm.get('tenancyId');
  }

  get moveInDateControl() {
    return this.vacateDetailForm.get('moveInDate');
  }

  get vacateDateControl() {
    return this.vacateDetailForm.get('vacateDate');
  }

  get noticeDateControl() {
    return this.vacateDetailForm.get('noticeDate');
  }

  get expectedMoveOutDateControl() {
    return this.vacateDetailForm.get('expectedMoveOutDate');
  }
}
