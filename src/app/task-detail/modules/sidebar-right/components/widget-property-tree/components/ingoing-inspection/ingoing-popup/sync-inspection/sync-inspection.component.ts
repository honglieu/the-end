import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectorRef
} from '@angular/core';
import { differenceInCalendarDays } from 'date-fns';
import { Subject, catchError, of, takeUntil } from 'rxjs';
import { PropertiesService } from '@services/properties.service';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { IngoingInspectionFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/ingoing-inspection-form.service';
import { FormControl, FormGroup } from '@angular/forms';
import { IngoingInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/ingoing-inspection.service';
import {
  EInspectionStatus,
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import {
  InspectionSyncData,
  RoutineInspectionData
} from '@shared/types/routine-inspection.interface';
import { POSITION_MAP, SHORT_ISO_TIME_FORMAT } from '@services/constants';
import dayjs from 'dayjs';
import {
  ngOnchangeEndTime,
  ngOnchangeStartTime
} from '@/app/tenant-vacate/utils/functions';
import { TaskService } from '@services/task.service';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiService } from '@services/trudi.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@services/shared.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { Personal } from '@shared/types/user.interface';

import uuid4 from 'uuid4';
import { WidgetPropertyTreeApiService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-tree-api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'sync-inspection',
  templateUrl: './sync-inspection.component.html',
  styleUrls: ['./sync-inspection.component.scss']
})
export class SyncInspectionComponent implements OnInit {
  @Input() modalId: string;
  @Input() isShowModal: boolean = false;
  @Output() handleCloseModalSync = new EventEmitter<void>();
  @Output() handleBackModalSync = new EventEmitter<void>();
  private unsubscribe = new Subject<void>();
  public listOfTenancy: Personal[] = [];
  readonly disabledStatus = ['ARCHIVED', 'PROSPECT', 'DELETED'];
  public rangeFrom: number = 0;
  public rangeTo: number = 0;
  public lastTimeSynced: string | Date;
  public tenancyStatus: boolean = false;
  public inputFocused = false;
  public selectedTenancy: Personal = null;
  public disableTime: boolean = false;
  public isEditInspection: boolean = false;
  public currentDate: string | Date;
  public syncStatus: string = ESyncStatus.NOT_SYNC;
  public status: EInspectionStatus = null;
  public prevData: InspectionSyncData = null;
  public ptId: string = null;
  public statusPropertyTree = EInspectionStatus;
  public statusInspectionExist: string = null;
  public syncPropertyTree = ESyncStatus;
  readonly position = POSITION_MAP.bottomRight;
  public isUpdateIngoingInspectionModal: boolean = false;
  private generalNotes: string;
  isArchiveMailbox: boolean;
  public isConsole: boolean;
  public timeZone = this.agencyDateFormatService.getCurrentTimezone();
  public isShowButtonSync = [
    EInspectionStatus.CLOSED,
    EInspectionStatus.CANCELLED
  ];

  get ingoingForm() {
    return this.ingoingInspectionFormService.ingoingInspectionForm;
  }

  get tenancyId() {
    return this.ingoingForm.get('tenancyId');
  }
  get date() {
    return this.ingoingForm.get('date');
  }
  get startTime() {
    return this.ingoingForm.get('startTime');
  }
  get endTime() {
    return this.ingoingForm.get('endTime');
  }
  get tenantNotes() {
    return this.ingoingForm.get('tenantNotes');
  }
  get action() {
    return this.ingoingForm.get('action');
  }
  get ownerNotes() {
    return this.ingoingForm.get('ownerNotes');
  }
  get followUpItems() {
    return this.ingoingForm.get('followUpItems');
  }

  constructor(
    public ingoingInspectionFormService: IngoingInspectionFormService,
    public ingoingInspectionSyncService: IngoingInspectionSyncService,
    public propertyService: PropertiesService,
    public taskService: TaskService,
    public calendarEventWidgetService: EventCalendarService,
    public stepService: StepService,
    public trudiService: TrudiService,
    private inboxService: InboxService,
    private widgetPTService: WidgetPTService,
    private sharedService: SharedService,
    protected cdr: ChangeDetectorRef,
    private showSidebarRightService: ShowSidebarRightService,
    private agencyDateFormatService: AgencyDateFormatService,
    private widgetPropertyTreeApiService: WidgetPropertyTreeApiService,
    private toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.ingoingInspectionFormService.buildForm();

    this.propertyService.peopleList$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((people) => {
        this.listOfTenancy =
          people?.tenancies?.filter(
            (one) => !this.disabledStatus.includes(one.status)
          ) || [];
      });
    this.ingoingInspectionSyncService
      .getSelectedIngoingInspection()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (data) {
          this.generalNotes = data.notes?.general;
        }
        if (data?.id) {
          if ('syncStatus' in data) {
            this.setValueFormInspection(data);
            this.syncStatus = data.syncStatus;
            this.status = data.status;
            this.lastTimeSynced = data.syncDate;
            this.prevData = data;
            this.isEditInspection = true;
            if (this.syncStatus === this.syncPropertyTree.INPROGRESS) {
              this.ingoingForm.disable();
              this.disableTime = true;
            } else {
              this.checkInspectionStatus(this.status);
            }
          } else {
            this.setValueFormSelectedInspection(data);
            this.isEditInspection = false;
          }
          this.ptId = data.ptId;
          this.ingoingForm.markAsUntouched();
          this.ingoingForm.markAsPristine();
          this.ingoingInspectionFormService.disableField(['tenancyId']);
        } else {
          this.resetForm();
          this.ingoingInspectionFormService.disableField([
            'tenantNotes',
            'action',
            'ownerNotes',
            'followUpItems'
          ]);
          this.disableTime = true;
          this.syncStatus = this.syncPropertyTree.NOT_SYNC;
          if (this.listOfTenancy.length === 1) {
            this.tenancyId.setValue(this.listOfTenancy[0].id);
            this.currentDate =
              this.listOfTenancy[0].userPropertyGroupLeases?.[0]?.originalLeaseStartDate;
            this.disableTime = false;
          }
        }
      });

    this.ingoingForm.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((change) => {
        this.lastTimeSynced = new Date();
        this.checkValueChanged();
      });

    this.widgetPTService
      .getModalUpdate()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isUpdateIngoingInspectionModal = res;
      });
  }

  checkValueChanged(isTimeChanged: boolean = false) {
    if (
      this.isEditInspection &&
      (this.ingoingForm.dirty || isTimeChanged) &&
      (this.syncStatus === ESyncStatus.COMPLETED ||
        this.syncStatus === ESyncStatus.FAILED)
    ) {
      this.syncStatus = ESyncStatus.UN_SYNC;
    }
  }

  handleCloseModal() {
    this.handleCloseModalSync.emit();
    this.ingoingInspectionSyncService.isSyncIngoingInSpection.next(false);
    this.widgetPTService.setModalUpdate(false);
  }

  handleBack() {
    if (this.isUpdateIngoingInspectionModal) {
      this.widgetPTService.setPopupWidgetState(EPropertyTreeType.UPDATE_WIDGET);
      return;
    }
    this.ingoingInspectionSyncService.setSelectedIngoingInspection(null);
    this.handleBackModalSync.emit();
  }

  isValidForm() {
    return (
      this.tenancyId.value &&
      this.date.value &&
      Number.isInteger(this.startTime.value) &&
      Number.isInteger(this.endTime.value) &&
      this.ingoingForm.valid
    );
  }

  setValueFormInspection(value: InspectionSyncData) {
    const tenancy = this.listOfTenancy?.find(
      (item) => item?.id === value?.userPropertyGroup?.id
    );
    this.currentDate =
      tenancy?.userPropertyGroupLeases?.[0]?.originalLeaseStartDate;

    const defaultValue = {
      tenancyId: value?.userPropertyGroup?.id,
      startTime: hmsToSecondsOnly(
        dayjs(value?.startTime)
          .tz(this.timeZone?.value)
          .format(SHORT_ISO_TIME_FORMAT)
      ),
      endTime: hmsToSecondsOnly(
        dayjs(value?.endTime)
          .tz(this.timeZone?.value)
          .format(SHORT_ISO_TIME_FORMAT)
      ),
      date: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        value?.startTime
      ),
      tenantNotes: value?.notes?.tenant_notes,
      action: value?.notes?.tenant_actions,
      ownerNotes: value?.notes?.owner_notes,
      followUpItems: value?.notes?.owner_followup_items
    };
    this.ingoingInspectionFormService.patchFormValues(defaultValue);
    this.rangeFrom = ngOnchangeStartTime(this.startTime);
    this.rangeTo = ngOnchangeEndTime(this.endTime);
    this.checkInspectionStatus(value?.status);
  }

  checkInspectionStatus(status: string) {
    this.ingoingInspectionFormService.disableField(['tenancyId']);
    this.date.enable();
    this.disableTime = false;
    switch (status) {
      case EInspectionStatus.CONDUCTED:
      case EInspectionStatus.CLOSED:
        this.date.disable();
        this.disableTime = true;
        const fields = ['tenantNotes', 'action', 'ownerNotes', 'followUpItems'];
        if (status === EInspectionStatus.CLOSED) {
          this.ingoingInspectionFormService.disableField(fields);
        } else {
          this.ingoingInspectionFormService.enableField(fields);
        }
        break;
      case EInspectionStatus.CANCELLED:
        this.ingoingForm.disable();
        this.disableTime = true;
        break;
      default:
        this.ingoingInspectionFormService.disableField([
          'tenantNotes',
          'action',
          'ownerNotes',
          'followUpItems'
        ]);
    }
  }

  setValueFormSelectedInspection(value: RoutineInspectionData) {
    const tenancy = this.listOfTenancy?.find(
      (item) => item?.id === value?.idUserPropertyGroup
    );
    this.currentDate =
      tenancy?.userPropertyGroupLeases?.[0]?.originalLeaseStartDate;
    const defaultValue = {
      tenancyId: value.idUserPropertyGroup,
      startTime: hmsToSecondsOnly(
        dayjs(value?.startTime)
          .tz(this.timeZone?.value)
          .format(SHORT_ISO_TIME_FORMAT)
      ),
      endTime: hmsToSecondsOnly(
        dayjs(value?.endTime)
          .tz(this.timeZone?.value)
          .format(SHORT_ISO_TIME_FORMAT)
      ),
      date: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        value?.startTime
      ),
      tenantNotes: value?.notes?.owner_notes,
      action: value?.notes?.tenant_actions,
      ownerNotes: value?.notes?.owner_notes,
      followUpItems: value?.notes?.owner_followup_items
    };
    this.ingoingInspectionFormService.patchFormValues(defaultValue);
    this.statusInspectionExist =
      value?.status === EInspectionStatus.CONDUCTED
        ? EInspectionStatus.CONDUCTED
        : null;
    this.checkInspectionStatus(value?.status);
    this.rangeFrom = ngOnchangeStartTime(this.startTime);
    this.rangeTo = ngOnchangeEndTime(this.endTime);
  }

  onTenancySelectChanged(tenancy: Personal) {
    if (!tenancy) return;
    this.currentDate =
      tenancy?.userPropertyGroupLeases?.[0]?.originalLeaseStartDate;
    this.date.reset();
    this.startTime.reset();
    this.endTime.reset();
    this.disableTime = false;
    this.selectedTenancy = tenancy;
  }

  onSearchTenancy(e) {
    if (!this.tenancyId) {
      this.ingoingForm.get('tenancyId').patchValue(null);
    }
  }

  handleSync() {
    const currentStep = this.stepService.currentPTStep.getValue();
    if (!this.isValidForm()) {
      this.validateAllFormFields(this.ingoingForm);
      return;
    }
    this.showSidebarRightService.handleToggleSidebarRight(true);

    const {
      startTime,
      endTime,
      tenancyId,
      tenantNotes,
      action,
      ownerNotes,
      followUpItems,
      agencyId,
      taskId,
      propertyId
    } = this.ingoingInspectionFormService.generateIngoingInspection();
    const newItem = {
      syncStatus: this.syncPropertyTree.INPROGRESS,
      syncDate: String(new Date()),
      errorMessSync: '',
      startTime,
      endTime,
      status: this.status,
      isRescheduled: false,
      agencyId,
      taskId,
      propertyId,
      notes: {
        general: this.generalNotes,
        owner_notes: ownerNotes,
        owner_followup_items: followUpItems,
        tenant_notes: tenantNotes,
        tenant_actions: action
      },
      userPropertyGroup: {
        id: tenancyId,
        idPropertyTree: '',
        name: this.listOfTenancy.find((tenancy) => tenancy.id == tenancyId)
          ?.name
      },
      type: 'Ingoing',
      id: this.prevData ? this.prevData.id : uuid4(),
      createdAt: this.prevData?.createdAt || new Date(),
      ptId: this.ptId,
      stepId: currentStep ? currentStep?.id : this.prevData?.stepId
    };
    this.ingoingInspectionSyncService.updateListIngoingInspection(
      newItem,
      newItem.id
    );
    if (!this.isEditInspection) {
      const payload = {
        startTime,
        endTime,
        tenancyId,
        taskId,
        ownerNotes,
        tenantNotes,
        action,
        followUpItems,
        type: 'Ingoing',
        ptId: this.ptId,
        statusInspection: this.statusInspectionExist,
        stepId: currentStep ? currentStep?.id : this.prevData?.stepId,
        agencyId
      };

      this.ingoingInspectionSyncService
        .syncIngoingInspection(payload)
        .subscribe((res) => {
          this.ingoingInspectionSyncService.updateListIngoingInspection(
            {
              ...res.inspection,
              firstTimeSyncSuccess:
                res.inspection.syncStatus !== this.syncPropertyTree.FAILED
            },
            newItem.id
          );
          if (
            this.ingoingInspectionSyncService.isSyncIngoingInSpection.getValue() &&
            this.ingoingInspectionSyncService.selectedIngoingInspections$.getValue()
              ?.id === newItem.id
          ) {
            this.ingoingInspectionSyncService.setSelectedIngoingInspection(
              res.inspection
            );
          }
          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();
          if (res.inspection.syncStatus === this.syncPropertyTree.COMPLETED) {
            this.calendarEventWidgetService.refreshListEventCalendarWidget(
              this.taskService.currentTaskId$.getValue()
            );
            if (trudiResponeTemplate?.isTemplate) {
              this.stepService.updateButtonStatusTemplate(
                res?.inspection?.stepId,
                EPropertyTreeButtonComponent.INGOING_INSPECTION,
                currentStep
                  ? EButtonAction[currentStep?.action.toUpperCase()]
                  : EButtonAction.PT_NEW_COMPONENT,
                res?.inspection?.id
              );
            } else {
              this.ingoingInspectionSyncService.updateStatusBtn();
            }
          }
        });
    } else {
      const body =
        this.prevData.status === EInspectionStatus.CONDUCTED
          ? {
              startTime,
              endTime,
              tenancyId,
              taskId,
              ownerNotes,
              tenantNotes,
              action,
              followUpItems,
              type: 'Ingoing',
              stepId: currentStep ? currentStep?.id : this.prevData?.stepId,
              agencyId
            }
          : {
              startTime,
              endTime,
              tenancyId,
              taskId,
              type: 'Ingoing',
              stepId: currentStep ? currentStep?.id : this.prevData?.stepId,
              agencyId
            };

      this.ingoingInspectionSyncService
        .editIngoingInspection(body, this.prevData.id)
        .subscribe((res) => {
          this.ingoingInspectionSyncService.updateListIngoingInspection(
            {
              ...res.inspection,
              firstTimeSyncSuccess:
                res.inspection.syncStatus !== this.syncPropertyTree.FAILED
            },
            this.prevData.id
          );
          if (
            this.ingoingInspectionSyncService.isSyncIngoingInSpection.getValue() &&
            this.ingoingInspectionSyncService.selectedIngoingInspections$.getValue()
              ?.id === res.inspection?.id
          ) {
            this.ingoingInspectionSyncService.setSelectedIngoingInspection(
              res.inspection
            );
          }
          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();
          if (res.inspection.syncStatus === this.syncPropertyTree.COMPLETED) {
            this.calendarEventWidgetService.refreshListEventCalendarWidget(
              this.taskService.currentTaskId$.getValue()
            );
            if (trudiResponeTemplate?.isTemplate) {
              this.stepService.updateButtonStatusTemplate(
                res?.inspection?.stepId,
                EPropertyTreeButtonComponent.INGOING_INSPECTION,
                currentStep
                  ? EButtonAction[currentStep?.action.toUpperCase()]
                  : EButtonAction.PT_NEW_COMPONENT,
                res?.inspection?.id
              );
            } else {
              this.ingoingInspectionSyncService.updateStatusBtn();
            }
          }
        });
    }
    this.handleCloseModal();
  }

  handleCancelOrCloseInspection(
    isCloseInspection: boolean = false,
    defaultChargeFee?: boolean
  ) {
    const currentStep = this.stepService.currentPTStep.getValue();
    this.showSidebarRightService.handleToggleSidebarRight(true);
    const {
      startTime,
      endTime,
      tenancyId,
      tenantNotes,
      action,
      ownerNotes,
      followUpItems,
      agencyId,
      taskId,
      propertyId
    } = this.ingoingInspectionFormService.generateIngoingInspection();
    const newItem = {
      syncStatus: this.syncPropertyTree.INPROGRESS,
      syncDate: String(new Date()),
      errorMessSync: '',
      startTime,
      endTime,
      status: isCloseInspection
        ? this.statusPropertyTree.CLOSED
        : this.statusPropertyTree.CANCELLED,
      defaultChargeFee,
      isRescheduled: false,
      agencyId,
      taskId,
      propertyId,
      notes: {
        general: this.generalNotes,
        owner_notes: ownerNotes,
        owner_followup_items: followUpItems,
        tenant_notes: tenantNotes,
        tenant_actions: action
      },
      userPropertyGroup: {
        id: tenancyId,
        idPropertyTree: '',
        name: this.listOfTenancy.find((tenancy) => tenancy.id == tenancyId)
          ?.name
      },
      type: 'Ingoing',
      id: this.prevData ? this.prevData.id : uuid4(),
      createdAt: this.prevData?.createdAt || new Date(),
      ptId: this.ptId,
      stepId: currentStep ? currentStep?.id : this.prevData?.stepId
    };
    this.ingoingInspectionSyncService.updateListIngoingInspection(
      newItem,
      newItem.id
    );

    const inspectionAction$ = isCloseInspection
      ? this.widgetPropertyTreeApiService.closeInspectionEvent({
          inspectionId: this.prevData.id,
          agencyId: agencyId,
          defaultChargeFee: defaultChargeFee,
          stepId: currentStep ? currentStep?.id : this.prevData?.stepId
        })
      : this.widgetPropertyTreeApiService.cancelInspectionEvent({
          inspectionId: this.prevData.id,
          agencyId: agencyId,
          stepId: currentStep ? currentStep?.id : this.prevData?.stepId
        });

    inspectionAction$
      .pipe(
        catchError((err) => {
          this.toastService.error(err?.message || err?.error?.message);
          return of(null);
        })
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          this.ingoingInspectionSyncService.updateListIngoingInspection(
            {
              ...res.inspection,
              firstTimeSyncSuccess:
                res.inspection.syncStatus !== this.syncPropertyTree.FAILED
            },
            this.prevData.id
          );
          if (
            this.ingoingInspectionSyncService.isSyncIngoingInSpection.getValue() &&
            this.ingoingInspectionSyncService.selectedIngoingInspections$.getValue()
              ?.id === res.inspection?.id
          ) {
            this.ingoingInspectionSyncService.setSelectedIngoingInspection(
              res.inspection
            );
          }
          if (res.inspection.syncStatus === this.syncPropertyTree.COMPLETED) {
            this.calendarEventWidgetService.refreshListEventCalendarWidget(
              this.taskService.currentTaskId$.getValue()
            );
            const trudiResponeTemplate =
              this.trudiService.getTrudiResponse?.getValue();
            if (trudiResponeTemplate?.isTemplate) {
              this.stepService.updateButtonStatusTemplate(
                res?.inspection?.stepId,
                EPropertyTreeButtonComponent.INGOING_INSPECTION,
                EButtonAction[currentStep?.action.toUpperCase()]
              );
            } else {
              this.ingoingInspectionSyncService.updateStatusBtn();
            }
          }
        },
        error: (error) => {
          this.toastService.error(error?.message || error?.error?.message);
        }
      });
    this.handleCloseModal();
  }

  resetForm() {
    this.ingoingForm.reset();
  }

  handleChangeStartHour(hour: number) {
    this.startTime.setValue(hour);
    this.rangeFrom = ngOnchangeStartTime(this.startTime);
    Number.isInteger(this.endTime.value) &&
      this.endTime.setValue(this.endTime.value);
    this.checkValueChanged(true);
  }

  handleChangeEndHour(hour: number) {
    this.endTime.setValue(hour);
    this.rangeTo = ngOnchangeEndTime(this.endTime);
    Number.isInteger(this.startTime.value) &&
      this.startTime.setValue(this.startTime.value);
    this.checkValueChanged(true);
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
        control.markAsDirty({ onlySelf: true });
      }
    });
  }

  triggerInputTouched(event: boolean, field: string) {
    if (!event) {
      this[field].markAsTouched();
    }
  }

  disableInspectionDate = (current: Date): boolean => {
    if (!new Date(this.currentDate) || !current) return false;
    return differenceInCalendarDays(current, new Date(this.currentDate)) > 0;
  };

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
