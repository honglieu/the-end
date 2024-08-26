import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ComplianceApiService } from '@/app/compliance/services/compliance-api.service';
import { Compliance } from '@shared/types/compliance.interface';
import { ComplianceFormService } from '@/app/compliance/services/compliance-form.service';
import { EManagedBy } from '@/app/smoke-alarm/utils/smokeAlarmType';
import { ComplianceService } from '@/app/compliance/services/compliance.service';
import dayjs from 'dayjs';
import { SHORT_ISO_DATE } from '@services/constants';
import { ICategoryItem } from '@/app/compliance/utils/compliance.type';
import { AgencyService } from '@services/agency.service';
import { TaskService } from '@services/task.service';
import { ESelectOpenComplianceItemPopup } from '@/app/compliance/utils/compliance.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { ToastrService } from 'ngx-toastr';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { TrudiService } from '@services/trudi.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { EPropertyTreeType } from '@/app/task-detail/utils/functions';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { EEventStatus } from '@shared/enum/calendar.enum';
import { EButtonStepKey } from '@trudi-ui';

@Component({
  selector: 'app-widget-compliance',
  templateUrl: './widget-compliance.component.html',
  styleUrls: ['./widget-compliance.component.scss']
})
export class WidgetComplianceComponent implements OnInit, OnChanges {
  @Input() isClickSync: boolean;
  @Input() complianceItem: Compliance;
  public arrComplianceItem: Compliance[] = [];
  private unsubscribe = new Subject<void>();
  public syncStatus = '';
  public lastTimeSynced: string;
  public disableSyncBtn = false;
  public managedBy: EManagedBy;
  public complianceTaskId = '';
  public listCategoryByTask: ICategoryItem[];
  public currentDataEdit;
  public isEdit: boolean = false;
  public EComplianceStatus = EEventStatus;
  readonly EButtonStepKey = EButtonStepKey;

  constructor(
    public complianceFormService: ComplianceFormService,
    public complianceService: ComplianceService,
    public taskService: TaskService,
    public agencyService: AgencyService,
    public complianceApiService: ComplianceApiService,
    private toastService: ToastrService,
    private calendarEventWidgetService: EventCalendarService,
    private widgetPTService: WidgetPTService,
    public trudiService: TrudiService,
    public stepService: StepService,
    public trudiDynamicParamater: TrudiDynamicParameterService
  ) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['complianceItem']?.currentValue) {
      const { status, ...newItem } = this.complianceItem;
      const mapStatus =
        status === EEventStatus.OPENED ? EEventStatus.ACTIVE : status;
      if (this.complianceItem?.complianceSyncFail) {
        this.complianceItem = {
          ...newItem,
          ...newItem.complianceSyncFail,
          status: mapStatus
        };
      }
      this.complianceItem = {
        ...newItem,
        status: mapStatus
      };
    }
  }

  ngOnInit() {
    this.widgetPTService
      .getPTWidgetStateByType<Partial<Compliance[]>>(
        PTWidgetDataField.COMPLIANCES
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res?.length) {
          this.arrComplianceItem = res.map((item) => {
            const { status, ...newItem } = item;
            const mapStatus =
              status === EEventStatus.OPENED ? EEventStatus.ACTIVE : status;
            if (item?.complianceSyncFail) {
              return {
                ...newItem,
                ...newItem.complianceSyncFail,
                status: mapStatus
              };
            }
            return {
              ...newItem,
              status: mapStatus
            };
          });
        } else {
          this.arrComplianceItem = [];
        }
      });
  }

  handleRetryCompliance(value) {
    const currentStep = this.stepService.currentPTStep.getValue();
    this.arrComplianceItem = this.arrComplianceItem.map((item) => {
      let newItem = { ...item };

      if (newItem.complianceSyncFail) {
        newItem = { ...newItem, ...newItem.complianceSyncFail };
        delete newItem.complianceSyncFail;
      }

      if (newItem.complianceTaskId === value.complianceTaskId) {
        newItem.syncStatus = SyncMaintenanceType.INPROGRESS;

        if (newItem.complianceSyncFail) {
          newItem.complianceSyncFail.syncStatus =
            SyncMaintenanceType.INPROGRESS;
        }
      }

      return newItem;
    });
    this.complianceService.updateComplianceResponse = this.arrComplianceItem;
    const payload = this.getPayloadSync(value);
    this.complianceApiService.syncComplianceToPT(payload).subscribe((res) => {
      if (!res) return;
      if (res?.syncStatus === SyncMaintenanceType.FAILED) {
        this.toastService.error(res?.errorMessSync);
      }
      this.arrComplianceItem = this.arrComplianceItem.map((item) =>
        item.id === res.id
          ? {
              ...item,
              syncStatus: res.syncStatus,
              firstTimeSyncSuccess:
                res.syncStatus === SyncMaintenanceType.COMPLETED
            }
          : item
      );
      this.complianceService.syncStatus$.next(res?.syncStatus);
      this.complianceService.updateComplianceResponse = this.arrComplianceItem;
      const trudiResponeTemplate =
        this.trudiService.getTrudiResponse?.getValue();
      if (res?.syncStatus === SyncMaintenanceType.COMPLETED) {
        if (trudiResponeTemplate?.isTemplate) {
          this.stepService.updateButtonStatusTemplate(
            currentStep?.id,
            EPropertyTreeButtonComponent.COMPLIANCE,
            EButtonAction.PT_NEW_COMPONENT,
            res?.id
          );
        }
        this.calendarEventWidgetService.refreshListEventCalendarWidget(
          this.taskService.currentTaskId$.getValue()
        );
        this.complianceService.setCurrentCompliance(res);
      }
    });
  }

  getPayloadSync(item) {
    const {
      managedBy,
      creditorId,
      authorityForm,
      expiryDate,
      lastServiceDate,
      nextServiceDate,
      notes,
      idUserPropertyGroup,
      id,
      propertyId,
      smokeAlarmType,
      complianceType,
      complianceCategory,
      complianceTaskId
    } = item || {};

    return {
      complianceDetail: {
        managedBy,
        creditorId,
        authorityForm,
        expiryDate: this.convertDateToSyncPayload(expiryDate),
        lastServiceDate: this.convertDateToSyncPayload(lastServiceDate),
        nextServiceDate: this.convertDateToSyncPayload(nextServiceDate),
        notes
      },
      idUserPropertyGroup,
      complianceTaskId,
      complianceId: id,
      propertyId,
      complianceType,
      categoryId: complianceCategory?.id,
      smokeAlarmType,
      taskId: this.taskService.currentTask$.value?.id,
      agencyId: this.taskService.currentTask$.value?.agencyId
    };
  }

  handleEditCompliance(item) {
    this.complianceService.showPopup$.next(
      ESelectOpenComplianceItemPopup.SYNC_COMPLIANCE
    );
    this.complianceFormService.patchFormCompliance(item);
    const complianceControl = this.complianceFormService.complianceForm.get(
      'complianceItemControl'
    );
    item?.idUserPropertyGroup
      ? complianceControl.disable()
      : complianceControl.enable();
    this.complianceService.currentDataEdit.next(item);
    this.complianceFormService.complianceForm.markAsPristine();
    this.complianceFormService.complianceForm.markAsUntouched();
    this.widgetPTService.setPopupWidgetState(EPropertyTreeType.SYNC_COMPLIANCE);
  }

  convertDateToSyncPayload(date) {
    return date ? dayjs(date).format(SHORT_ISO_DATE) : null;
  }

  confirmCancel(data) {
    this.complianceTaskId = data?.complianceTaskId;
    const payload = {
      complianceTaskId: this.complianceTaskId,
      taskId: this.taskService.currentTask$.value.id
    };
    this.complianceApiService
      .removeComplianceFallId(payload)
      .subscribe((res) => {
        this.complianceService.updateComplianceResponse = res;
      });
  }
  trackById(_index: number, item: Compliance) {
    return item.id;
  }

  ngOnDestroy(): void {
    this.arrComplianceItem = [];
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
