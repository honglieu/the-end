import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, catchError, of, switchMap } from 'rxjs';
import { WidgetPTService } from './widget-property.service';
import { LeaseRenewalSyncStatus, TrudiButtonEnumStatus } from '@shared/enum';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { TenantVacateApiService } from '@/app/tenant-vacate/services/tenant-vacate-api.service';
import { ToastrService } from 'ngx-toastr';
import { ETenantVacateButtonAction } from '@/app/tenant-vacate/utils/tenantVacateType';
import { TrudiService } from '@services/trudi.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import dayjs from 'dayjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { WidgetFormPTService } from './widget-property-form.service';
import { SHORT_ISO_DATE } from '@services/constants';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { dateRangeValidator } from '@shared/validators/date-range-validator';
import { IPersonalInTab, Personal } from '@shared/types/user.interface';

@Injectable({
  providedIn: 'root'
})
export class VacateDetailService {
  public syncStatusPtWidgetTenantVacate = new BehaviorSubject(null);
  public listWidgetTenantVacate = new BehaviorSubject([]);
  public popupStateVacateDetails = new BehaviorSubject({
    showTenantVacateModal: false
  });
  public syncPTStatus: LeaseRenewalSyncStatus = LeaseRenewalSyncStatus.WAITING;
  public originalLeaseStartDate: string;
  public errorMessage = new Subject<string>();
  constructor(
    private stepService: StepService,
    private propertyService: PropertiesService,
    private taskService: TaskService,
    private widgetPTService: WidgetPTService,
    private tenantVacateApiService: TenantVacateApiService,
    private toastService: ToastrService,
    private trudiService: TrudiService,
    private calendarEventWidgetService: EventCalendarService,
    private agencyDateFormatService: AgencyDateFormatService,
    private widgetFormPTService: WidgetFormPTService
  ) {}

  handleSyncPtWidgetTenantVacate(payload) {
    const currentStep = this.stepService.currentPTStep.getValue();
    const tenanciesOptions = this.propertyService.peopleList
      ?.getValue()
      ?.tenancies.filter(
        (tenant) => tenant?.id === payload?.tenantVacateDetail?.tenancyId
      );
    const taskId = this.taskService.currentTaskId$.getValue();

    const {
      chargeToDate,
      description,
      noticeDate,
      tenancyId,
      terminationDate,
      vacateDate
    } = payload?.tenantVacateDetail;

    const listWidgetTenantVacate = [
      {
        tenancy: {
          name: tenanciesOptions[0]?.name,
          id: tenanciesOptions[0]?.id
        },
        chargeToDate,
        description,
        noticeDate,
        previousVacateDate: payload?.previousVacateDate,
        status: LeaseRenewalSyncStatus.INPROGRESS,
        tenancyId,
        vacateType: payload?.tenantVacateType,
        tenantVacateType: payload?.tenantVacateType,
        terminationDate,
        vacateDate
      }
    ];

    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.TENANT_VACATES,
      'UPDATE',
      [listWidgetTenantVacate?.[0]] || []
    );

    this.syncStatusPtWidgetTenantVacate.next(LeaseRenewalSyncStatus.INPROGRESS);

    const syncPayload = payload && {
      ...payload,
      tenantVacateDetail: this.formatTenantVacatePayload(
        payload.tenantVacateDetail
      )
    };

    this.tenantVacateApiService
      .syncPropertyNoteToPT(syncPayload)
      .pipe(
        catchError((syncToPTError) => {
          if (syncToPTError.error) {
            this.toastService.error(syncToPTError.error['message'], null, {
              enableHtml: true
            });
          }
          return of(syncToPTError);
        }),
        switchMap((syncToPTResponse) => {
          return this.tenantVacateApiService.getTaskVacateDetail(taskId);
        })
      )
      .subscribe((res) => {
        if (!res) return;
        const [vacateDetail] = res;
        if (vacateDetail) {
          if (vacateDetail.status === LeaseRenewalSyncStatus.COMPLETED) {
            this.tenantVacateApiService
              .updateButtonStatus(
                taskId,
                ETenantVacateButtonAction.sendVacateDetailToPT,
                TrudiButtonEnumStatus.COMPLETED,
                this.taskService.currentTask$.value?.agencyId,
                res?.[0]?.id
              )
              .subscribe((res) => {
                this.trudiService.updateTrudiResponse = res;
              });
          }
          this.syncPTStatus = vacateDetail?.status;
          this.syncStatusPtWidgetTenantVacate.next(vacateDetail?.status);
          if (this.syncPTStatus === LeaseRenewalSyncStatus.COMPLETED) {
            this.calendarEventWidgetService.refreshListEventCalendarWidget(
              this.taskService.currentTaskId$.getValue()
            );
            const trudiResponeTemplate =
              this.trudiService.getTrudiResponse?.getValue();
            if (trudiResponeTemplate?.isTemplate) {
              this.stepService.setChangeBtnStatusFromPTWidget(true);
              this.stepService.updateButtonStatusTemplate(
                currentStep?.id,
                EPropertyTreeButtonComponent.VACATE_DETAIL,
                currentStep
                  ? EButtonAction[currentStep?.action.toUpperCase()]
                  : EButtonAction.PT_NEW_COMPONENT,
                res?.[0]?.id
              );
            }
          }
          const newwRes = res?.map((item) => ({
            ...item,
            firstTimeSyncSuccess:
              item?.status === LeaseRenewalSyncStatus.COMPLETED
          }));

          this.widgetPTService.setPTWidgetStateByType(
            PTWidgetDataField.TENANT_VACATES,
            'UPDATE',
            [newwRes?.[0]] || []
          );
        }
      });
  }

  formatTenantVacatePayload(payload) {
    if (!payload) return payload;

    const offsetTime = dayjs().utcOffset();

    if (!payload.noticeDate || offsetTime <= 0) {
      return {
        ...payload,
        noticeDateSentToPT: payload.noticeDate
      };
    }

    const currentDate = dayjs();
    const selectedDate = dayjs(payload.noticeDate || '');

    const isTheCurrentDateSelected =
      selectedDate.format('YYYY-MM-DD') === currentDate.format('YYYY-MM-DD');
    const noticeDate = (
      isTheCurrentDateSelected ? currentDate.utc() : selectedDate
    ).format('YYYY-MM-DD');

    return {
      ...payload,
      noticeDateSentToPT: noticeDate
    };
  }

  changeTenant(event: { id: string; label?: string }, listTenant) {
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.getValue();
    const tenant = listTenant.find((item) => item.id === event.id);
    const vacateDateCombineToLocal = tenant?.userPropertyGroupLeases[0]
      ?.vacateDate
      ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          tenant?.userPropertyGroupLeases[0]?.vacateDate
        )
      : null;

    const formattedVacateDate = vacateDateCombineToLocal
      ? dayjs(vacateDateCombineToLocal).format(SHORT_ISO_DATE)
      : '';
    this.widgetFormPTService?.tenantVacateForm
      .get('vacateDate')
      .setValue(formattedVacateDate);

    const matchedVacateItem = this.findGroupLeaseById(event.id, listTenant);
    this.originalLeaseStartDate = matchedVacateItem?.originalLeaseStartDate;
    this.errorMessage.next(
      `date must be from Original lease start ` +
        dayjs(this.originalLeaseStartDate).format(DATE_FORMAT_DAYJS)
    );
    this.updateFormControl('terminationDate', true);
    this.updateFormControl('noticeDate', true);
    this.updateFormControl('vacateDate', true);
    this.updateFormControl('chargeToDate', false, true);
  }

  updateFormControl(
    controlName: string,
    required?: boolean,
    excludeEqual = false
  ) {
    const control = this.widgetFormPTService?.tenantVacateForm.get(controlName);
    if (!control) return;
    control.clearValidators();
    required && control.addValidators(Validators.required);
    if (this.originalLeaseStartDate) {
      const startDate = excludeEqual
        ? dayjs(this.originalLeaseStartDate).add(1, 'day')
        : dayjs(this.originalLeaseStartDate);
      (control as FormControl).addValidators(
        dateRangeValidator(startDate) as ValidatorFn
      );
    }
    (control as FormControl).updateValueAndValidity();
  }

  findGroupLeaseById(idTenancy: string, tenanciesItems: Personal[]) {
    return (
      tenanciesItems
        .flatMap((data) => data.userPropertyGroupLeases || [])
        .find((lease) => lease.idUserPropertyGroup === idTenancy) || {}
    );
  }

  getFilteredAndMappedTenancies(
    res: IPersonalInTab,
    filterList: string[]
  ): { id: string; label: string }[] {
    return (
      res?.tenancies.filter((tenant) => filterList.includes(tenant.status)) ||
      []
    )
      .sort((a, b) => a?.name?.localeCompare(b?.name))
      .map(({ id, name }) => ({ id, label: name }));
  }
}
