import {
  Component,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Output,
  EventEmitter
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { differenceInCalendarDays } from 'date-fns';
import dayjs from 'dayjs';
import { Subject, takeUntil, filter } from 'rxjs';
import { ApiService } from '@services/api.service';
import { MAX_INPUT_URL_LENGTH, SHORT_ISO_DATE } from '@services/constants';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import { TenantVacateService } from '@/app/tenant-vacate/services/tenant-vacate.service';
import {
  ESelectedReason,
  ITenantVacateForm
} from '@/app/tenant-vacate/utils/tenantVacateType';
import { WidgetFormPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-form.service';
import { TaskService } from '@services/task.service';
import {
  EPropertyTreeType,
  TypeVacate
} from '@/app/task-detail/utils/functions';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { VacateDetailService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/vacate-detail.service';

@Component({
  selector: 'tenant-vacate-form',
  templateUrl: './tenant-vacate-form.component.html',
  styleUrls: ['./tenant-vacate-form.component.scss']
})
export class TenantVacateFormComponent implements OnInit, OnDestroy, OnChanges {
  private componentDestroyed$ = new Subject<void>();
  @Input() listTenant = [];
  @Input() tenanciesOptions: { id: string; label: string }[] = [];
  @Input() dataVacateDetail: ITenantVacateForm;
  @Input() vacateTypeInput: string;
  @Input() dataTerminationDate: {};

  @Input() readonly: boolean = false;
  @Input() readonlyTenancy: boolean = false;
  @Input() isShowTermidate: boolean = false;
  @Output() changeTerminationDateStatus = new EventEmitter();

  public tenantVacateForm: FormGroup;
  public typeVacate = TypeVacate;
  public dataFormChanged: ITenantVacateForm;
  public MAX_INPUT_URL_LENGTH = MAX_INPUT_URL_LENGTH;
  public currentTerminationDate: string = '';
  public originalLeaseStartDate: string;
  public errorMessage: string;

  // get value form
  get tenantForm() {
    return this.widgetFormPTService?.tenantVacateForm;
  }
  get tenancy() {
    return this.tenantForm.get('tenancy');
  }
  get vacateType() {
    return this.tenantForm.get('vacateType');
  }
  get terminationDate() {
    return this.tenantForm.get('terminationDate');
  }
  get noticeDate() {
    return this.tenantForm.get('noticeDate');
  }
  get vacateDate() {
    return this.tenantForm.get('vacateDate');
  }
  get chargeToDate() {
    return this.tenantForm.get('chargeToDate');
  }
  get description() {
    return this.tenantForm.get('description');
  }

  constructor(
    public userService: UserService,
    public apiService: ApiService,
    public tenantVacateService: TenantVacateService,
    public trudiService: TrudiService,
    private widgetFormPTService: WidgetFormPTService,
    public taskService: TaskService,
    private WidgetPTService: WidgetPTService,
    private agencyDateFormatService: AgencyDateFormatService,
    public vacateDetailService: VacateDetailService
  ) {}

  ngOnInit(): void {
    this.WidgetPTService.getPopupWidgetState()
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((data) => {
        if (data === EPropertyTreeType.VACATE_DETAIL) {
          this.isShowTermidate =
            this.vacateTypeInput === ESelectedReason.TERMINATION;
        }
      });

    this.tenantVacateService.noticeToLeaveDate
      .pipe(takeUntil(this.componentDestroyed$), filter(Boolean))
      .subscribe((res) => {
        if (
          this.tenantVacateService.getTenantVacateDetail?.getValue()?.status !==
          LeaseRenewalSyncStatus.COMPLETED
        ) {
          this.currentTerminationDate = res;
          this.terminationDate.setValue(res);
        }
      });

    this.tenantVacateService.isGetDataVariable
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        if (res) {
          this.tenantVacateService.vacateData.next(this.getDataForm());
        }
      });

    this.tenancy.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((tenancyId) => {
        if (this.tenanciesOptions.length) {
          this.vacateDetailService.changeTenant(
            { id: tenancyId },
            this.listTenant
          );
        }
      });

    this.vacateDetailService.errorMessage
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((errorMessage) => {
        if (errorMessage) {
          this.errorMessage = errorMessage;
        }
      });
  }

  changeTypeVacate(e) {
    this.checkFormChanged();
    if (e.value === ESelectedReason.TERMINATION) {
      this.isShowTermidate = true;
      this.changeTerminationDateStatus.emit(this.isShowTermidate);
      this.widgetFormPTService.addTerminationDateControl(
        this.tenantVacateService.getTenantVacateDetail?.getValue()
      );
      this.vacateDetailService.updateFormControl('terminationDate', true);
      if (
        this.currentTerminationDate &&
        this.tenantVacateService.getTenantVacateDetail?.getValue().status !==
          LeaseRenewalSyncStatus.COMPLETED
      ) {
        this.terminationDate.setValue(this.currentTerminationDate);
      }
    } else {
      this.isShowTermidate = false;
      this.widgetFormPTService.clearTerminationDateControl();
    }
  }

  formatDateISO(date) {
    return date ? dayjs(date).format(SHORT_ISO_DATE) : null;
  }

  disabledFutureDate = (current: Date): boolean =>
    differenceInCalendarDays(current, this.getToday()) > 0;

  getToday(): Date {
    return this.agencyDateFormatService.initTimezoneToday().nativeDate;
  }

  checkFormChanged() {
    this.tenantForm.valueChanges.subscribe((value) => {
      this.dataFormChanged = value;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { isShowTermidate } = changes;
    if (isShowTermidate?.currentValue) {
      this.isShowTermidate = isShowTermidate.currentValue;
    }
  }

  getDataForm() {
    return this.tenantForm.value;
  }

  changeTenant(event: { id: string; label?: string }) {
    this.vacateDetailService.changeTenant(event, this.listTenant);
  }

  ngOnDestroy() {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
