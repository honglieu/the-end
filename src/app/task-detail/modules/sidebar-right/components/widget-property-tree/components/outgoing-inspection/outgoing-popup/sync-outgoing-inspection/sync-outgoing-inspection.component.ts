import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { Subject, catchError, of, takeUntil } from 'rxjs';
import { PropertiesService } from '@services/properties.service';
import { OutgoingInspectionFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/outgoing-inspection-form.service';
import { FormControl, FormGroup } from '@angular/forms';
import { Personal } from '@shared/types/user.interface';
import { OutgoingInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/outgoing-inspection.service';
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
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@services/shared.service';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';

import uuid4 from 'uuid4';
import { WidgetPropertyTreeApiService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-tree-api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'sync-outgoing-inspection',
  templateUrl: './sync-outgoing-inspection.component.html',
  styleUrls: ['./sync-outgoing-inspection.component.scss']
})
export class SyncOutgoingInspectionComponent implements OnInit, OnDestroy {
  @Input() isShowModal: boolean = false;
  @Input() modalId: string;
  @Output() handleCloseModalSync = new EventEmitter<void>();
  @Output() handleBackModalSync = new EventEmitter<void>();
  private unsubscribe = new Subject<void>();
  public listOfTenancy = [];
  public rangeFrom: number = 0;
  public rangeTo: number = 0;

  public lastTimeSynced: string | Date;
  public tenancyStatus: boolean = false;
  public inputFocused = false;
  public selectedTenancy: Personal = null;
  public disableTime: boolean = false;
  public isEditInspection: boolean = false;
  readonly disabledStatus = ['ARCHIVED', 'PROSPECT', 'DELETED'];
  public syncStatus: string = ESyncStatus.NOT_SYNC;
  public status: EInspectionStatus = null;
  public ptId: string = null;
  public prevData: InspectionSyncData = null;
  public statusInspectionExist: string = null;
  public statusPropertyTree = EInspectionStatus;
  public syncPropertyTree = ESyncStatus;
  readonly position = POSITION_MAP.bottomRight;
  public syncing: boolean = false;
  public isUpdateOutgoingInspectionModal: boolean = false;
  private generalNotes: string;
  isArchiveMailbox: boolean;
  public isConsole: boolean;
  public timeZone = this.agencyDateFormatService.getCurrentTimezone();
  public isShowButtonSync = [
    EInspectionStatus.CLOSED,
    EInspectionStatus.CANCELLED
  ];

  get outgoingForm() {
    return this.outgoingInspectionFormService.outgoingInspectionForm;
  }

  get tenancyId() {
    return this.outgoingForm.get('tenancyId');
  }
  get date() {
    return this.outgoingForm.get('date');
  }
  get startTime() {
    return this.outgoingForm.get('startTime');
  }
  get endTime() {
    return this.outgoingForm.get('endTime');
  }
  get tenantNotes() {
    return this.outgoingForm.get('tenantNotes');
  }
  get action() {
    return this.outgoingForm.get('action');
  }
  get ownerNotes() {
    return this.outgoingForm.get('ownerNotes');
  }
  get followUpItems() {
    return this.outgoingForm.get('followUpItems');
  }

  constructor(
    public outgoingInspectionFormService: OutgoingInspectionFormService,
    public outgoingInspectionSyncService: OutgoingInspectionSyncService,
    public propertyService: PropertiesService,
    public calendarEventWidgetService: EventCalendarService,
    public taskService: TaskService,
    public stepService: StepService,
    public trudiService: TrudiService,
    private inboxService: InboxService,
    private widgetPTService: WidgetPTService,
    private sharedService: SharedService,
    protected cdr: ChangeDetectorRef,
    private agencyDateFormatService: AgencyDateFormatService,
    private showSidebarRightService: ShowSidebarRightService,
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
    this.outgoingInspectionFormService.buildForm();
    this.propertyService.peopleList$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((people) => {
        this.listOfTenancy =
          people?.tenancies?.filter(
            (one) => !this.disabledStatus.includes(one.status)
          ) || [];
      });

    this.outgoingInspectionSyncService
      .getSelectedOutgoingInspection()
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
              this.outgoingForm.disable();
              this.disableTime = true;
            } else {
              this.checkInspectionStatus(this.status);
            }
          } else {
            this.setValueFormSelectedInspection(data);
            this.isEditInspection = false;
          }
          this.ptId = data.ptId;
          this.outgoingForm.markAsUntouched();
          this.outgoingForm.markAsPristine();
          this.outgoingInspectionFormService.disableField(['tenancyId']);
        } else {
          this.resetForm();
          this.outgoingInspectionFormService.disableField([
            'tenantNotes',
            'action',
            'ownerNotes',
            'followUpItems'
          ]);
          this.syncStatus = this.syncPropertyTree.NOT_SYNC;
          if (this.listOfTenancy.length === 1) {
            this.tenancyId.setValue(this.listOfTenancy[0].id);
          }
        }
      });

    this.outgoingForm.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((change) => {
        this.lastTimeSynced = new Date();
        this.checkValueChanged();
      });

    this.widgetPTService
      .getModalUpdate()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isUpdateOutgoingInspectionModal = res;
      });
  }

  checkValueChanged(isTimeChanged: boolean = false) {
    if (
      this.isEditInspection &&
      (this.outgoingForm.dirty || isTimeChanged) &&
      (this.syncStatus === ESyncStatus.COMPLETED ||
        this.syncStatus === ESyncStatus.FAILED)
    ) {
      this.syncStatus = ESyncStatus.UN_SYNC;
    }
  }

  handleCloseModal() {
    this.handleCloseModalSync.emit();
    this.outgoingInspectionSyncService.isSyncOutgoingInSpection.next(false);
    this.widgetPTService.setModalUpdate(false);
  }

  handleBack() {
    if (this.isUpdateOutgoingInspectionModal) {
      this.widgetPTService.setPopupWidgetState(EPropertyTreeType.UPDATE_WIDGET);
      return;
    }
    this.outgoingInspectionSyncService.setSelectedOutgoingInspection(null);
    this.handleBackModalSync.emit();
  }

  isValidForm() {
    return (
      this.tenancyId.value &&
      this.date.value &&
      Number.isInteger(this.startTime.value) &&
      Number.isInteger(this.endTime.value) &&
      this.outgoingForm.valid
    );
  }

  setValueFormInspection(value: InspectionSyncData) {
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
    this.outgoingInspectionFormService.patchFormValues(defaultValue);
    this.rangeFrom = ngOnchangeStartTime(this.startTime);
    this.rangeTo = ngOnchangeEndTime(this.endTime);
    this.checkInspectionStatus(value?.status);
  }

  checkInspectionStatus(status: string) {
    this.outgoingInspectionFormService.disableField(['tenancyId']);
    this.date.enable();
    this.disableTime = false;
    switch (status) {
      case EInspectionStatus.CONDUCTED:
      case EInspectionStatus.CLOSED:
        this.date.disable();
        this.disableTime = true;
        const fields = ['tenantNotes', 'action', 'ownerNotes', 'followUpItems'];
        if (status === EInspectionStatus.CLOSED) {
          this.outgoingInspectionFormService.disableField(fields);
        } else {
          this.outgoingInspectionFormService.enableField(fields);
        }
        break;
      case EInspectionStatus.CANCELLED:
        this.outgoingForm.disable();
        this.disableTime = true;
        break;
      default:
        this.outgoingInspectionFormService.disableField([
          'tenantNotes',
          'action',
          'ownerNotes',
          'followUpItems'
        ]);
    }
  }

  setValueFormSelectedInspection(value: RoutineInspectionData) {
    const defaultValue = {
      tenancyId: this.listOfTenancy.find(
        (tenancy) => tenancy.id === value.idUserPropertyGroup
      ).id,
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
    this.outgoingInspectionFormService.patchFormValues(defaultValue);
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
    this.selectedTenancy = tenancy;
  }

  onSearchTenancy(e) {
    if (!this.tenancyId) {
      this.outgoingForm.get('tenancyId').patchValue(null);
    }
  }

  handleSync() {
    if (this.isArchiveMailbox) return;
    const currentStep = this.stepService.currentPTStep.getValue();
    if (!this.isValidForm()) {
      this.validateAllFormFields(this.outgoingForm);
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
    } = this.outgoingInspectionFormService.generateOutgoingInspection();
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
      type: 'Outgoing',
      id: this.prevData ? this.prevData.id : uuid4(),
      createdAt: this.prevData?.createdAt || new Date(),
      ptId: this.ptId,
      stepId: currentStep ? currentStep?.id : this.prevData?.stepId
    };
    this.outgoingInspectionSyncService.updateListOutgoingInspection(
      newItem,
      newItem.id
    );
    if (!this.isEditInspection) {
      this.outgoingInspectionSyncService
        .syncOutgoingInspection({
          startTime,
          endTime,
          tenancyId,
          taskId,
          ownerNotes,
          tenantNotes,
          action,
          followUpItems,
          type: 'Outgoing',
          ptId: this.ptId,
          statusInspection: this.statusInspectionExist,
          stepId: currentStep ? currentStep?.id : this.prevData?.stepId,
          agencyId
        })
        .subscribe((res) => {
          this.outgoingInspectionSyncService.updateListOutgoingInspection(
            {
              ...res.inspection,
              firstTimeSyncSuccess:
                res.inspection.syncStatus !== this.syncPropertyTree.FAILED
            },
            newItem.id
          );
          if (
            this.outgoingInspectionSyncService.isSyncOutgoingInSpection.getValue() &&
            this.outgoingInspectionSyncService.selectedOutgoingInspections$.getValue()
              ?.id === newItem.id
          ) {
            this.outgoingInspectionSyncService.setSelectedOutgoingInspection(
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
                EPropertyTreeButtonComponent.OUTGOING_INSPECTION,
                currentStep
                  ? EButtonAction[currentStep?.action.toUpperCase()]
                  : EButtonAction.PT_NEW_COMPONENT,
                res?.inspection?.id
              );
            } else {
              this.outgoingInspectionSyncService.updateStatusBtn();
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
              agencyId,
              taskId,
              ownerNotes,
              tenantNotes,
              action,
              followUpItems,
              type: 'Outgoing',
              stepId: currentStep ? currentStep?.id : this.prevData?.stepId
            }
          : {
              startTime,
              endTime,
              tenancyId,
              agencyId,
              taskId,
              type: 'Outgoing',
              stepId: currentStep ? currentStep?.id : this.prevData?.stepId
            };
      this.outgoingInspectionSyncService
        .editOutgoingInspection(body, this.prevData.id)
        .subscribe((res) => {
          this.outgoingInspectionSyncService.updateListOutgoingInspection(
            {
              ...res.inspection,
              firstTimeSyncSuccess:
                res.inspection.syncStatus !== this.syncPropertyTree.FAILED
            },
            this.prevData.id
          );
          if (
            this.outgoingInspectionSyncService.isSyncOutgoingInSpection.getValue() &&
            this.outgoingInspectionSyncService.selectedOutgoingInspections$.getValue()
              ?.id === res.inspection?.id
          ) {
            this.outgoingInspectionSyncService.setSelectedOutgoingInspection(
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
                EPropertyTreeButtonComponent.OUTGOING_INSPECTION,
                currentStep
                  ? EButtonAction[currentStep?.action.toUpperCase()]
                  : EButtonAction.PT_NEW_COMPONENT,
                res?.inspection?.id
              );
            } else {
              this.outgoingInspectionSyncService.updateStatusBtn();
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
    } = this.outgoingInspectionFormService.generateOutgoingInspection();
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
      type: 'Outgoing',
      id: this.prevData ? this.prevData.id : uuid4(),
      createdAt: this.prevData?.createdAt || new Date(),
      ptId: this.ptId,
      stepId: currentStep ? currentStep?.id : this.prevData?.stepId
    };
    this.outgoingInspectionSyncService.updateListOutgoingInspection(
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
          this.outgoingInspectionSyncService.updateListOutgoingInspection(
            {
              ...res.inspection,
              firstTimeSyncSuccess:
                res.inspection.syncStatus !== this.syncPropertyTree.FAILED
            },
            this.prevData.id
          );
          if (
            this.outgoingInspectionSyncService.isSyncOutgoingInSpection.getValue() &&
            this.outgoingInspectionSyncService.selectedOutgoingInspections$.getValue()
              ?.id === res.inspection?.id
          ) {
            this.outgoingInspectionSyncService.setSelectedOutgoingInspection(
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
                EPropertyTreeButtonComponent.OUTGOING_INSPECTION,
                EButtonAction[currentStep?.action.toUpperCase()]
              );
            } else {
              this.outgoingInspectionSyncService.updateStatusBtn();
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
    this.outgoingForm.reset();
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

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
