import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { Subject, map, of, switchMap, takeUntil } from 'rxjs';
import { SYNC_DATA } from '@/app/compliance/constants/complianceConstants';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { ComplianceFormComponent } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/compliance/components/compliance-form/compliance-form.component';
import { PropertiesService } from '@services/properties.service';
import { Personal } from '@shared/types/user.interface';
import dayjs from 'dayjs';
import { TIME_FORMAT } from '@services/constants';
import { TaskService } from '@services/task.service';
import { AgencyService } from '@services/agency.service';
import { ComplianceApiService } from '@/app/compliance/services/compliance-api.service';
import { ComplianceFormService } from '@/app/compliance/services/compliance-form.service';
import { ComplianceService } from '@/app/compliance/services/compliance.service';
import { ICategoryItem } from '@/app/compliance/utils/compliance.type';
import {
  ESmokeAlarmButtonAction,
  IPropertyNoteForm
} from '@/app/smoke-alarm/utils/smokeAlarmType';
import { TrudiService } from '@services/trudi.service';
import {
  EComplianceType,
  ESelectOpenComplianceItemPopup,
  ESelectRadioComplianceItemPopup
} from '@/app/compliance/utils/compliance.enum';
import { TaskNameId } from '@shared/enum/task.enum';
import { ToastrService } from 'ngx-toastr';
import { SmokeAlarmAPIService } from '@/app/smoke-alarm/services/smoke-alarm-api.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { GeneralComplianceAPIService } from '@/app/general-compliance/services/general-compliance-api.service';
import { EGeneralComplianceButtonAction } from '@/app/general-compliance/utils/generalComplianceType';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { EPropertyTreeType } from '@/app/task-detail/utils/functions';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { EEventStatus } from '@shared/enum/calendar.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SharedService } from '@services/shared.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { PreventButtonService } from '@trudi-ui';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
@Component({
  selector: 'sync-compliance-popup',
  templateUrl: './sync-compliance-popup.component.html',
  styleUrls: ['./sync-compliance-popup.component.scss']
})
export class SyncCompliancePopupComponent implements OnInit {
  @Input() isShowPopupSync: boolean = false;
  @Input() isNextFromUpdateModal: boolean = false;
  @Input() isShowSmokeAlarmField: boolean = false;
  @Input() listCategoryByAgency: ICategoryItem[];
  @Input() accountOptions = [];
  @Input() taskNameId: TaskNameId;
  @Input() modalId: string;
  @Output() onCancel = new EventEmitter();

  @ViewChild('complianceFormComponent')
  complianceFormComponent: ComplianceFormComponent;
  private unsubscribe = new Subject<void>();
  public syncData = SYNC_DATA;
  public syncPTStatus: SyncMaintenanceType | string;
  public lastTimeSynced: string = '';
  readonly SYNC_TYPE = SyncMaintenanceType;
  public listTenancyInProperty: Personal[] = [];
  public isEdit: boolean = false;
  public currentDataEdit;
  public selectStateCompliance: ESelectRadioComplianceItemPopup;
  public listCategoryFilter: ICategoryItem[];
  public changeData: boolean = false;
  readonly TIME_FORMAT = TIME_FORMAT;
  public isCreateNewItem = false;
  public isSyncedToPt: boolean = false;
  public tenanciesOptions: Personal[] = [];
  public isUpdateButton: boolean = false;
  public complianceStatus: EEventStatus;
  public complianceStatusEnum = EEventStatus;
  isArchiveMailbox: boolean;
  public isConsole: boolean;
  public buttonKey = EButtonStepKey.COMPLIANCE;
  public StepKey = StepKey;

  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => TIME_FORMAT + ' ' + format)
  );

  get syncInprogress() {
    return this.syncPTStatus === SyncMaintenanceType.INPROGRESS;
  }

  get isHiddenSyncButton() {
    return [EEventStatus.CANCELLED, EEventStatus.CLOSED].includes(
      this.complianceStatus
    );
  }

  constructor(
    public widgetPTService: WidgetPTService,
    public taskService: TaskService,
    public agencyService: AgencyService,
    public complianceApiService: ComplianceApiService,
    public complianceFormService: ComplianceFormService,
    public complianceService: ComplianceService,
    public trudiService: TrudiService,
    public smokeAlarmAPIService: SmokeAlarmAPIService,
    public stepService: StepService,
    public generalComplianceAPIService: GeneralComplianceAPIService,
    private inboxService: InboxService,
    private toastService: ToastrService,
    private calendarEventWidgetService: EventCalendarService,
    private propertiesService: PropertiesService,
    private agencyDateFormatService: AgencyDateFormatService,
    private showSidebarRightService: ShowSidebarRightService,
    private sharedService: SharedService,
    private PreventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.handleGetListTenancy();
    this.complianceService.currentDataEdit
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (Object.keys(res || {}).length > 0) {
          this.currentDataEdit = res;
          const { syncStatus, lastTimeSync, complianceCategory, id, status } =
            this.currentDataEdit;
          this.isEdit = !!(
            this.currentDataEdit && Object.keys(this.currentDataEdit).length > 0
          );
          this.complianceStatus =
            status === EEventStatus.OPENED ? EEventStatus.ACTIVE : status;
          this.isSyncedToPt = !!this.currentDataEdit?.idUserPropertyGroup;
          this.syncPTStatus = this.isSyncedToPt
            ? syncStatus ?? SyncMaintenanceType.COMPLETED
            : '';
          this.lastTimeSynced = this.isSyncedToPt ? lastTimeSync : '';
          this.listCategoryFilter = id
            ? [...this.listCategoryByAgency, complianceCategory]
            : this.listCategoryByAgency?.filter((item) => !item?.compliance);
          this.isShowSmokeAlarmField =
            this.currentDataEdit?.complianceCategory?.type ===
            EComplianceType.SMOKE_ALARM;
        } else {
          this.isEdit = false;
          this.syncPTStatus = '';
          this.lastTimeSynced = '';
          this.currentDataEdit = {};
          this.isSyncedToPt = false;
          this.isShowSmokeAlarmField = false;
          this.complianceStatus = null;
        }

        if (this.tenanciesOptions?.length === 1) {
          this.complianceFormService.complianceForm
            .get('tenancyControl')
            .setValue(this.tenanciesOptions[0]?.id);
        }
      });

    this.complianceService.syncStatus$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.syncPTStatus = res;
      });

    this.complianceService
      .getSelectComplianceTypeState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res === ESelectRadioComplianceItemPopup.CREATE_NEW) {
          this.isCreateNewItem = true;
          this.listCategoryFilter = this.listCategoryByAgency?.filter(
            (item) => !item.compliance
          );
        } else if (res === ESelectRadioComplianceItemPopup.SELECT_EXISTING) {
          this.isCreateNewItem = false;
          this.listCategoryFilter = this.listCategoryByAgency?.filter(
            (item) => item.compliance
          );
        }
      });

    this.complianceService.unSyncChangeStatus$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (
          !this.isShowPopupSync ||
          [SyncMaintenanceType.FAILED, SyncMaintenanceType.INPROGRESS].includes(
            this.syncPTStatus as SyncMaintenanceType
          )
        ) {
          this.changeData = false;
        } else {
          this.changeData = this.isSyncedToPt && res;
        }
      });

    this.complianceService.showSmokeType$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isShowSmokeAlarmField = res;
      });
  }

  handleGetListTenancy() {
    this.propertiesService.peopleList
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.tenanciesOptions = res?.tenancies;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const {
      isShowPopupSync,
      isNextFromUpdateModal,
      listCategoryByAgency,
      taskNameId
    } = changes || {};
    this.isShowPopupSync =
      isShowPopupSync?.currentValue ?? this.isShowPopupSync;

    this.isNextFromUpdateModal =
      isNextFromUpdateModal?.currentValue ?? this.isNextFromUpdateModal;

    this.listCategoryByAgency =
      listCategoryByAgency?.currentValue ?? this.listCategoryByAgency;

    this.taskNameId = taskNameId?.currentValue ?? this.taskNameId;
  }

  cancel() {
    this.isShowSmokeAlarmField = false;
    this.complianceFormService.resetForm();
    this.listCategoryFilter = this.listCategoryByAgency;
    this.onCancel.emit();
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }

  convertDateToSyncPayload(date) {
    return date
      ? this.agencyDateFormatService
          .expectedTimezoneStartOfDay(date)
          .toISOString()
      : null;
  }

  getPayloadSync() {
    const currentStep = this.stepService.currentPTStep.getValue();
    const { id, agencyId } = this.taskService.currentTask$.value;
    const {
      authorReceivedControl,
      complianceItemControl,
      expiredDateControl,
      lastServiceDateControl,
      managedByControl,
      nextServiceDateControl,
      noteControl,
      servicesByControl,
      smokeAlarmTypeControl,
      tenancyControl
    } = this.complianceFormComponent.getDataForm() || {};
    const complianceType = this.listCategoryFilter?.find(
      (item) => item.id === complianceItemControl
    )?.type;
    const complianceTaskId = this.isEdit
      ? this.currentDataEdit?.complianceTaskId
      : null;
    const complianceSelected = this.complianceService.complianceSelected.value;
    let complianceId = '';
    if (this.isEdit) {
      complianceId = this.currentDataEdit?.id || '';
    } else {
      complianceId = complianceSelected?.id || '';
    }

    return {
      complianceDetail: {
        managedBy: managedByControl,
        creditorId: servicesByControl,
        authorityForm: authorReceivedControl,
        expiryDate: this.convertDateToSyncPayload(expiredDateControl),
        lastServiceDate: this.convertDateToSyncPayload(lastServiceDateControl),
        nextServiceDate: this.convertDateToSyncPayload(nextServiceDateControl),
        notes: noteControl
      },
      complianceId,
      idUserPropertyGroup: tenancyControl,
      complianceTaskId,
      propertyId: this.propertiesService.currentPropertyId.value,
      complianceType,
      categoryId: complianceItemControl,
      smokeAlarmType: smokeAlarmTypeControl,
      taskId: id,
      stepId: currentStep ? currentStep?.id : this.currentDataEdit?.stepId,
      agencyId: agencyId
    };
  }

  syncCompliance() {
    if (
      this.complianceFormComponent.checkInvalidForm() ||
      this.isArchiveMailbox
    )
      return;
    const payload = this.getPayloadSync();
    const newItem = this.mapDataPayloadToInprogress(payload);
    this.showSidebarRightService.handleToggleSidebarRight(true);
    this.complianceService.showPopup$.next(
      ESelectOpenComplianceItemPopup.CLOSE_POPUP
    );
    let currentDataResponse =
      this.widgetPTService.compliances.getValue() as IPropertyNoteForm[];
    if (this.isEdit) {
      const foundItem = currentDataResponse?.findIndex(
        (item) =>
          item.complianceTaskId === this.currentDataEdit?.complianceTaskId
      );
      currentDataResponse = currentDataResponse?.map((item) => {
        if (item?.complianceSyncFail) {
          item = {
            ...item,
            ...item.complianceSyncFail,
            status: item.status
          };
          delete item.complianceSyncFail;
        }
        return item;
      });
      if (foundItem !== -1) {
        currentDataResponse[foundItem] = {
          ...newItem,
          complianceCategory:
            currentDataResponse[foundItem]?.complianceCategory,
          complianceTaskId: currentDataResponse[foundItem]?.complianceTaskId
        };
      }
    }
    this.widgetPTService.setPopupWidgetState(null);
    this.isShowPopupSync = false;
    const dataAddCompliance = currentDataResponse?.length
      ? [...currentDataResponse, newItem]
      : [newItem];
    this.complianceService.updateComplianceResponse = this.isEdit
      ? currentDataResponse
      : dataAddCompliance.sort((a, b) =>
          dayjs(a.lastTimeSync).isAfter(dayjs(b.lastTimeSync)) ? -1 : 1
        );
    this.complianceApiService
      .syncComplianceToPT(payload)
      .pipe(
        switchMap((res) => {
          if (!res) {
            return [];
          }

          const { syncStatus, taskId } = res;
          this.syncPTStatus = syncStatus;
          if (syncStatus === SyncMaintenanceType.FAILED) {
            this.toastService.error(res?.errorMessSync);
          }
          currentDataResponse = this.isEdit
            ? currentDataResponse.filter(
                (item) =>
                  item.complianceTaskId !==
                  this.currentDataEdit.complianceTaskId
              )
            : currentDataResponse;
          const newRes = {
            ...res,
            firstTimeSyncSuccess: syncStatus === SyncMaintenanceType.COMPLETED
          };
          this.lastTimeSynced = res?.lastTimeSync;

          this.complianceService.updateComplianceResponse = [
            ...(currentDataResponse || []),
            newRes
          ];
          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();
          if (syncStatus === SyncMaintenanceType.COMPLETED) {
            this.complianceService.setCurrentCompliance(res);
            this.calendarEventWidgetService.refreshListEventCalendarWidget(
              taskId || this.taskService.currentTaskId$.getValue()
            );
            if (trudiResponeTemplate?.isTemplate) {
              if (!this.isSyncedToPt) {
                this.stepService.updateButtonStatusTemplate(
                  res?.stepId,
                  EPropertyTreeButtonComponent.COMPLIANCE,
                  EButtonAction.PT_NEW_COMPONENT,
                  res?.id
                );
              } else {
                this.stepService.updateButtonStatusTemplate(
                  res?.stepId,
                  EPropertyTreeButtonComponent.COMPLIANCE,
                  EButtonAction.PT_UPDATE_COMPONENT,
                  res?.id
                );
              }
              return of();
            } else {
              if (this.isNextFromUpdateModal) {
                switch (this.taskNameId) {
                  case TaskNameId.smokeAlarms:
                    return this.smokeAlarmAPIService.updateButtonStatus(
                      this.taskService.currentTask$.value?.id,
                      ESmokeAlarmButtonAction.updateComplianceRegister,
                      TrudiButtonEnumStatus.COMPLETED
                    );
                  case TaskNameId.generalCompliance:
                    return this.generalComplianceAPIService.updateButtonStatus(
                      this.taskService.currentTask$.value?.id,
                      EGeneralComplianceButtonAction.updateComplianceRegister,
                      TrudiButtonEnumStatus.COMPLETED
                    );
                  default:
                    return [];
                }
              } else {
                return [];
              }
            }
          } else {
            return [];
          }
        })
      )
      .subscribe((res) => {
        if (res) {
          this.trudiService.updateTrudiResponse = res;
          this.complianceService.unSyncChangeStatus$.next(false);
          this.isNextFromUpdateModal = false;
        }
      });
  }

  back() {
    this.widgetPTService.setPopupWidgetState(
      this.isNextFromUpdateModal
        ? EPropertyTreeType.UPDATE_COMPLIANCE
        : EPropertyTreeType.CREATE_COMPLIANCE
    );
    this.isShowPopupSync = false;
    this.complianceService.setSelectComplianceTypeState(
      this.isCreateNewItem
        ? ESelectRadioComplianceItemPopup.CREATE_NEW
        : ESelectRadioComplianceItemPopup.SELECT_EXISTING
    );
  }

  mapDataPayloadToInprogress(payload) {
    const {
      complianceDetail,
      complianceId,
      propertyId,
      complianceType,
      categoryId,
      smokeAlarmType,
      taskId,
      agencyId,
      idUserPropertyGroup
    } = payload || {};
    const complianceCategory =
      this.listCategoryByAgency?.find((item) => item.id === categoryId) || {};
    return {
      ...complianceDetail,
      smokeAlarmType,
      complianceCategoryId: categoryId,
      propertyId,
      type: complianceType,
      taskId,
      agencyId,
      syncStatus: SyncMaintenanceType.INPROGRESS,
      complianceCategory,
      idUserPropertyGroup,
      status: this.currentDataEdit.status
    };
  }

  ngOnDestroy() {
    this.isShowPopupSync = false;
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
