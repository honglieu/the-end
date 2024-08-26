import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  ESelectedReason,
  ITenantVacateForm
} from '@/app/tenant-vacate/utils/tenantVacateType';
import { WidgetFormPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-form.service';
import { Subject, map, takeUntil } from 'rxjs';
import {
  EPropertyTreeType,
  ESyncStatus,
  FORMAT_ICON_SYNC,
  TypeVacate
} from '@/app/task-detail/utils/functions';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { TenancyInvoice } from '@shared/types/tenancy-invoicing.interface';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import { ToastrService } from 'ngx-toastr';
import { TenantVacateService } from '@/app/tenant-vacate/services/tenant-vacate.service';
import dayjs from 'dayjs';
import {
  SHORT_ISO_DATE,
  TENANCY_STATUS,
  TIME_FORMAT
} from '@services/constants';
import { TaskService } from '@services/task.service';
import { ConversationService } from '@services/conversation.service';
import { TrudiService } from '@services/trudi.service';
import { PropertiesService } from '@services/properties.service';
import { AgencyService } from '@services/agency.service';
import { TrudiVariable } from '@shared/types/trudi.interface';
import { AbstractControl } from '@angular/forms';
import { Personal } from '@shared/types/user.interface';
import { FormHelper } from '@trudi-ui';
import { TenantVacateFormComponent } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/tenant-vacate-widget/components/tenant-vacate-form/tenant-vacate-form.component';
import { VacateDetailService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/vacate-detail.service';
import { SharedService } from '@services/shared.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';

@Component({
  selector: 'vacate-details-popup',
  templateUrl: './vacate-details-popup.component.html',
  styleUrls: ['./vacate-details-popup.component.scss']
})
export class VacateDetailsPopupComponent implements OnInit, OnChanges {
  @ViewChild('tenantVacateFormComponent')
  tenantVacateFormComponent: TenantVacateFormComponent;
  public syncPTStatus: LeaseRenewalSyncStatus = LeaseRenewalSyncStatus.WAITING;
  private componentDestroyed$ = new Subject<void>();
  @Input() popupState = {
    showTenantVacateModal: false
  };
  @Output() canceled = new EventEmitter<boolean>();
  @Input() visible = false;
  @Input() dataVacateDetail: ITenantVacateForm;
  @Input() showTenantVacateModal: ITenantVacateForm;
  @Output() onSync = new EventEmitter();
  @Input() lastTimeSynced: string;

  public taskId: string = '';

  public syncStatus: string = '';
  public lastTimeSync: string = '';
  public typeVacate = TypeVacate;

  public dataFormChanged: ITenantVacateForm;
  public isShowTermidate: boolean = false;

  public dataVacateVariable: ITenantVacateForm;
  public dataSyncInvoice: TenancyInvoice[] = [];
  public isConfirmDecision: boolean = false;
  public isExistedInprogress: boolean = false;
  public listTenancy: Personal[] = [];
  public region: string = '';
  public trudiVariable: TrudiVariable;
  public listFileInvoice: TenancyInvoice[];
  public dataPrefillTerminationDate = {
    region: '',
    variable: {}
  };
  public readonly: boolean = false;
  public readonlyTenancy: boolean = false;
  readonly TYPE_SYNC_STATUS = ESyncStatus;
  readonly synData = FORMAT_ICON_SYNC;
  readonly TIME_FORMAT = TIME_FORMAT;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => TIME_FORMAT + ' ' + format)
  );
  public modalId = StepKey.propertyTree.vacateDetails;

  get tenantInvoiceControl() {
    return this.widgetFormPTService.tenantVacateForm.get('tenantVacateForm');
  }
  get invoiceDescription(): AbstractControl {
    return this.tenantInvoiceControl.get('invoiceDescription');
  }

  public configs = {
    visible: false,
    closable: true,
    type: 'default',
    title: 'Vacate Details',
    iconName: 'iconTrudi',
    okText: 'Sync to Property Tree',
    cancelText: 'Cancel',
    allowCheckbox: false,
    checkboxLabel: 'checkbox label',
    hiddenCancelBtn: false
  };
  isArchiveMailbox: boolean;
  public isConsole: boolean;
  public tenanciesOptions: { id: string; label: string }[] = [];
  public listTenant = [];

  constructor(
    public trudiService: TrudiService,
    public propertyService: PropertiesService,
    public agencyService: AgencyService,
    public tenantVacateService: TenantVacateService,
    public taskService: TaskService,
    public conversationService: ConversationService,
    private vacateDetailService: VacateDetailService,
    private inboxService: InboxService,
    private widgetFormPTService: WidgetFormPTService,
    private widgetPTService: WidgetPTService,
    private toastService: ToastrService,
    private agencyDateFormatService: AgencyDateFormatService,
    private showSidebarRightService: ShowSidebarRightService,
    private sharedService: SharedService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showTenantVacateModal']?.currentValue) {
      this.disableTenancyField();
      this.handlePopupState(this.showTenantVacateModal);
      this.isShowTermidate =
        this.widgetFormPTService.tenantVacateForm?.get('vacateType')?.value ===
        ESelectedReason.TERMINATION;
      if (this.isShowTermidate) {
        this.widgetFormPTService.addTerminationDateControl(
          this.tenantVacateService.getTenantVacateDetail?.getValue()
        );
      }
    }
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.widgetFormPTService.buildFormTenantVacatePT();
    this.widgetPTService.popupWidgetState$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((state) => {
        if (state === EPropertyTreeType.VACATE_DETAIL) {
          this.handlePopupState({ showTenantVacateModal: true });
        }
      });

    this.vacateDetailService.syncStatusPtWidgetTenantVacate
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((syncStatus) => {
        this.syncPTStatus = syncStatus;
        this.readonly = syncStatus === LeaseRenewalSyncStatus.INPROGRESS;
        if (syncStatus !== LeaseRenewalSyncStatus.UN_SYNC) {
          this.readonlyTenancy = [
            LeaseRenewalSyncStatus.COMPLETED,
            LeaseRenewalSyncStatus.PENDING
          ].includes(syncStatus);
        }
      });

    this.widgetFormPTService.tenantVacateForm.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        if (
          res &&
          [
            LeaseRenewalSyncStatus.FAILED,
            LeaseRenewalSyncStatus.COMPLETED
          ].includes(this.syncPTStatus)
        ) {
          this.syncPTStatus = LeaseRenewalSyncStatus.UN_SYNC;
          this.vacateDetailService.syncStatusPtWidgetTenantVacate.next(
            this.syncPTStatus
          );
        }
      });
    this.getListTenancy();
  }

  getListTenancy() {
    this.propertyService.peopleList$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        this.listTenant = res?.tenancies || [];
        const filterList = [
          TENANCY_STATUS.active,
          TENANCY_STATUS.vacating,
          TENANCY_STATUS.vacated
        ];
        this.tenanciesOptions =
          this.vacateDetailService.getFilteredAndMappedTenancies(
            res,
            filterList
          );

        if (this.tenanciesOptions.length === 1) {
          const matchedVacateItem = this.vacateDetailService.findGroupLeaseById(
            this.tenanciesOptions[0].id,
            res.tenancies
          );
          const { idUserPropertyGroup, vacateDate } = matchedVacateItem || {};
          const dataForm = {
            tenancy: idUserPropertyGroup,
            vacateDate: vacateDate
          };
          this.widgetFormPTService.tenantVacateForm.patchValue({ ...dataForm });
        } else {
          this.widgetFormPTService.tenantVacateForm.patchValue({
            tenancy: null,
            vacateDate: null
          });
        }
        if (
          this.tenanciesOptions.length &&
          this.widgetFormPTService?.tenantVacateForm.get('tenancy').value
        ) {
          this.vacateDetailService.changeTenant(
            {
              id: this.widgetFormPTService?.tenantVacateForm.get('tenancy')
                .value
            },
            this.listTenant
          );
        }
      });
  }

  disableTenancyField() {
    const completeItem = this.widgetPTService.tenantVacates.value?.find(
      (item) => item?.status === LeaseRenewalSyncStatus.COMPLETED
    );
    const notCompleteItem =
      completeItem &&
      this.widgetPTService.tenantVacates.value?.find(
        (otherItem) =>
          otherItem?.tenancy?.id === completeItem?.tenancy?.id &&
          otherItem?.status !== LeaseRenewalSyncStatus.COMPLETED
      );
    if (notCompleteItem) {
      this.readonlyTenancy = true;
    }
  }

  changeTerminationDateStatus(terminationDateField) {
    this.isShowTermidate = terminationDateField;
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  cancel() {
    this.canceled.emit(false);
    this.handlePopupState({ showTenantVacateModal: false });
    FormHelper.resetFormGroup(this.widgetFormPTService.tenantVacateForm);
    this.preventButtonService.deleteProcess(
      EButtonStepKey.VACATE_DETAILS,
      EButtonType.STEP
    );
  }

  syncToPT() {
    if (this.isArchiveMailbox) return;
    const payload = this.getPayloadSyncToPT();
    if (payload.tenantVacateType !== ESelectedReason.TERMINATION) {
      delete payload.tenantVacateDetail.terminationDate;
      this.widgetFormPTService.tenantVacateForm.removeControl(
        'terminationDate'
      );
    }
    if (this.widgetFormPTService.tenantVacateForm.invalid) {
      this.widgetFormPTService.tenantVacateForm.markAllAsTouched();
      return;
    }
    const data = this.tenantVacateFormComponent.getDataForm();
    if (!data) {
      this.toastService.error('Fail to sync');
      return;
    }
    this.handlePopupState({ showTenantVacateModal: false });
    this.tenantVacateService.unSyncChangeStatus$.next(false);
    this.showSidebarRightService.handleToggleSidebarRight(true);
    this.onSync.emit(payload);
  }

  getPayloadSyncToPT() {
    const formData = this.tenantVacateFormComponent.getDataForm();
    const terminationDate = formData?.terminationDate
      ? dayjs(formData?.terminationDate).format(SHORT_ISO_DATE)
      : '';
    const noticeDate = formData?.noticeDate
      ? this.agencyDateFormatService.expectedTimezoneStartOfDay(
          formData?.noticeDate
        )
      : '';
    const chargeToDate = formData?.chargeToDate
      ? this.agencyDateFormatService.expectedTimezoneStartOfDay(
          formData?.chargeToDate
        )
      : '';
    const vacateDate = formData?.vacateDate
      ? this.agencyDateFormatService.expectedTimezoneStartOfDay(
          formData?.vacateDate
        )
      : '';
    this.dataSyncInvoice = this.dataSyncInvoice.map((item) => {
      return {
        ...item,
        isTicket: true
      };
    });

    return {
      taskId: this.taskService.currentTaskId$.getValue(),
      propertyId: this.propertyService.currentPropertyId.getValue(),
      tenantVacateDetail: {
        terminationDate: terminationDate || null,
        noticeDate: noticeDate,
        vacateDate: vacateDate,
        chargeToDate: chargeToDate || null,
        description: formData?.description,
        tenancyId: formData?.tenancy
      },
      tenantVacateType: formData?.vacateType
    };
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
    FormHelper.resetFormGroup(this.widgetFormPTService.tenantVacateForm);
  }
}
