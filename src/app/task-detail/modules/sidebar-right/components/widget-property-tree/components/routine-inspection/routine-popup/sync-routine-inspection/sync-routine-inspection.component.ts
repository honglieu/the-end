import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import dayjs from 'dayjs';
import { Subject, catchError, of, takeUntil } from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { POSITION_MAP, SHORT_ISO_TIME_FORMAT } from '@services/constants';
import { PropertiesService } from '@services/properties.service';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { IMessage } from '@shared/types/message.interface';
import {
  InspectionSyncData,
  RoutineInspectionData
} from '@shared/types/routine-inspection.interface';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import {
  EInspectionStatus,
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import {
  ngOnchangeEndTime,
  ngOnchangeStartTime
} from '@/app/tenant-vacate/utils/functions';
import { RoutineInspectionFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/routine-inspection-form.service';
import { RoutineInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/routine-inspection.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';

import uuid4 from 'uuid4';
import { StepKey } from '@trudi-ui';
import { WidgetPropertyTreeApiService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-tree-api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'sync-routine-inspection',
  templateUrl: './sync-routine-inspection.component.html',
  styleUrls: ['./sync-routine-inspection.component.scss']
})
export class SyncRoutineInspectionComponent implements OnInit, OnDestroy {
  @Input() isShowModal: boolean = false;
  @Output() handleCloseModalSync = new EventEmitter<void>();
  @Output() handleBackModalSync = new EventEmitter<void>();
  private unsubscribe = new Subject<void>();
  public listOfTenancy = [];
  public rangeFrom: number = 0;
  public rangeTo: number = 0;
  public syncStatus: string = ESyncStatus.NOT_SYNC;
  public syncPropertyTree = ESyncStatus;
  public statusPropertyTree = EInspectionStatus;
  public lastTimeSynced: string | Date;
  public status: EInspectionStatus;
  public message: IMessage = null;
  public isEditInspection: boolean = false;
  public disableTimeChange: boolean = false;
  public prevData: InspectionSyncData = null;
  public ptId: string = null;
  public statusInspectionExist: string = null;
  readonly positionTimePicker = POSITION_MAP.bottomRight;
  readonly disabledStatus = ['ARCHIVED', 'PROSPECT', 'DELETED'];
  public isUpdateRoutineInspectionModal: boolean = false;
  private generalNotes: string;
  isArchiveMailbox: boolean;
  public isConsole: boolean;
  public timeZone = this.agencyDateFormatService.getCurrentTimezone();
  public modalId = StepKey.propertyTree.routineInspection;
  public isShowButtonSync = [
    EInspectionStatus.CLOSED,
    EInspectionStatus.CANCELLED
  ];
  get inspectionForm() {
    return this.routineInspectionFormService.routineInspectionForm;
  }

  get tenancyId() {
    return this.inspectionForm.get('tenancyId');
  }
  get date() {
    return this.inspectionForm.get('date');
  }
  get startTime() {
    return this.inspectionForm.get('startTime');
  }
  get endTime() {
    return this.inspectionForm.get('endTime');
  }
  get tenantNotes() {
    return this.inspectionForm.get('tenantNotes');
  }
  get action() {
    return this.inspectionForm.get('action');
  }
  get ownerNotes() {
    return this.inspectionForm.get('ownerNotes');
  }
  get followUpItems() {
    return this.inspectionForm.get('followUpItems');
  }

  constructor(
    public routineInspectionFormService: RoutineInspectionFormService,
    public propertyService: PropertiesService,
    public routineInspectionSyncService: RoutineInspectionSyncService,
    public calendarEventWidgetService: EventCalendarService,
    public taskService: TaskService,
    public stepService: StepService,
    public trudiService: TrudiService,
    private routineInspectionService: RoutineInspectionService,
    private inboxService: InboxService,
    private widgetPTService: WidgetPTService,
    private sharedService: SharedService,
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
    this.routineInspectionFormService.buildForm();
    this.propertyService.peopleList$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((people) => {
        this.listOfTenancy =
          people?.tenancies?.filter(
            (one) => !this.disabledStatus.includes(one.status)
          ) || [];
      });

    this.routineInspectionSyncService
      .getSelectedRoutineInspection()
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
            this.message = data?.message;

            if (this.syncStatus === this.syncPropertyTree.INPROGRESS) {
              this.inspectionForm.disable();
              this.disableTimeChange = true;
            } else {
              this.checkInspectionStatus(this.status);
            }
          } else {
            this.setValueFormSelectedInspection(data);
            this.isEditInspection = false;
          }
          this.ptId = data.ptId;
          this.inspectionForm.markAsUntouched();
          this.inspectionForm.markAsPristine();
          this.routineInspectionFormService.disableField(['tenancyId']);
        } else {
          this.resetForm();
          this.routineInspectionFormService.disableField([
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

    this.inspectionForm.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((change) => {
        this.lastTimeSynced = new Date();
        this.checkValueChanged();
      });

    this.widgetPTService
      .getModalUpdate()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isUpdateRoutineInspectionModal = res;
      });
  }

  checkValueChanged(isTimeChanged: boolean = false) {
    if (
      this.isEditInspection &&
      (this.inspectionForm.dirty || isTimeChanged) &&
      (this.syncStatus === this.syncPropertyTree.COMPLETED ||
        this.syncStatus === this.syncPropertyTree.FAILED)
    ) {
      this.syncStatus = this.syncPropertyTree.UN_SYNC;
    }
  }

  isValidForm() {
    return (
      this.tenancyId.value &&
      this.date.value &&
      Number.isInteger(this.startTime.value) &&
      Number.isInteger(this.endTime.value) &&
      this.inspectionForm.valid
    );
  }

  setValueFormInspection(value: InspectionSyncData) {
    const endTime =
      value?.status === EInspectionStatus.CONDUCTED
        ? value?.endTime
        : value?.message?.options?.endTime || value?.endTime;
    const startTime =
      value?.status === EInspectionStatus.CONDUCTED
        ? value?.startTime
        : value?.message?.options?.startTime || value?.startTime;
    const defaultValue = {
      tenancyId: value?.userPropertyGroup?.id,
      startTime: hmsToSecondsOnly(
        dayjs(startTime).tz(this.timeZone?.value).format(SHORT_ISO_TIME_FORMAT)
      ),
      endTime: hmsToSecondsOnly(
        dayjs(endTime).tz(this.timeZone?.value).format(SHORT_ISO_TIME_FORMAT)
      ),
      date: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        startTime
      ),
      tenantNotes: value?.notes?.tenant_notes,
      action: value?.notes?.tenant_actions,
      ownerNotes: value?.notes?.owner_notes,
      followUpItems: value?.notes?.owner_followup_items
    };
    this.routineInspectionFormService.patchFormValues(defaultValue);
    this.rangeFrom = ngOnchangeStartTime(this.startTime);
    this.rangeTo = ngOnchangeEndTime(this.endTime);
    this.checkInspectionStatus(value?.status);
  }

  checkInspectionStatus(status: string) {
    this.routineInspectionFormService.disableField(['tenancyId']);
    this.date.enable();
    this.disableTimeChange = false;
    switch (status) {
      case EInspectionStatus.CONDUCTED:
      case EInspectionStatus.CLOSED:
        this.date.disable();
        this.disableTimeChange = true;
        const fields = ['tenantNotes', 'action', 'ownerNotes', 'followUpItems'];
        if (status === EInspectionStatus.CLOSED) {
          this.routineInspectionFormService.disableField(fields);
        } else {
          this.routineInspectionFormService.enableField(fields);
        }
        break;
      case EInspectionStatus.CANCELLED:
        this.inspectionForm.disable();
        this.disableTimeChange = true;
        break;
      default:
        this.routineInspectionFormService.disableField([
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
        (tenancy) => tenancy?.id === value.idUserPropertyGroup
      )?.id,
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
    this.routineInspectionFormService.patchFormValues(defaultValue);
    this.statusInspectionExist =
      value?.status === EInspectionStatus.CONDUCTED
        ? EInspectionStatus.CONDUCTED
        : null;
    this.checkInspectionStatus(value?.status);
    this.rangeFrom = ngOnchangeStartTime(this.startTime);
    this.rangeTo = ngOnchangeEndTime(this.endTime);
  }

  handleCloseModal() {
    this.handleCloseModalSync.emit();
    this.routineInspectionSyncService.isSyncRoutineInSpection.next(false);
    this.widgetPTService.setModalUpdate(false);
  }

  handleBack() {
    if (this.isUpdateRoutineInspectionModal) {
      this.widgetPTService.setPopupWidgetState(EPropertyTreeType.UPDATE_WIDGET);
      return;
    }
    this.routineInspectionSyncService.setSelectedRoutineInspection(null);
    this.handleBackModalSync.emit();
  }

  handleSync() {
    if (this.isArchiveMailbox) return;
    const currentStep = this.stepService.currentPTStep.getValue();
    if (!this.isValidForm()) {
      this.validateAllFormFields(this.inspectionForm);
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
    } = this.routineInspectionFormService.generateRoutineInspection();
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
      type: 'Routine',
      id: this.prevData ? this.prevData.id : uuid4(),
      createdAt: this.prevData?.createdAt || new Date(),
      ptId: this.ptId,
      stepId: currentStep ? currentStep?.id : this.prevData?.stepId
    };
    this.routineInspectionSyncService.updateListRoutineInspection(
      newItem,
      newItem.id
    );
    if (!this.isEditInspection) {
      this.routineInspectionSyncService
        .syncRoutineInspection({
          startTime,
          endTime,
          tenancyId,
          taskId,
          ownerNotes,
          tenantNotes,
          action,
          followUpItems,
          type: 'Routine',
          ptId: this.ptId,
          statusInspection: this.statusInspectionExist,
          messageId: this.message?.id,
          stepId: currentStep ? currentStep?.id : this.prevData?.stepId,
          agencyId
        })
        .subscribe((res) => {
          this.routineInspectionSyncService.updateListRoutineInspection(
            {
              ...res.inspection,
              firstTimeSyncSuccess:
                res.inspection.syncStatus !== this.syncPropertyTree.FAILED
            },
            newItem.id
          );
          if (
            this.routineInspectionSyncService.isSyncRoutineInSpection.getValue() &&
            this.routineInspectionSyncService.selectedRoutineInspections$.getValue()
              ?.id === newItem.id
          ) {
            this.routineInspectionSyncService.setSelectedRoutineInspection(
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
                EPropertyTreeButtonComponent.ROUTINE_INSPECTION,
                currentStep
                  ? EButtonAction[currentStep?.action.toUpperCase()]
                  : EButtonAction.PT_NEW_COMPONENT,
                res?.inspection?.id
              );
            } else {
              this.routineInspectionSyncService.updateStatusBtn();
            }
          }
          if (this.message) {
            this.routineInspectionService.triggerSyncRoutineInSpection(
              res.inspection.syncStatus
            );
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
              type: 'Routine',
              messageId: this.message?.id,
              stepId: currentStep ? currentStep?.id : this.prevData?.stepId,
              agencyId
            }
          : {
              startTime,
              endTime,
              tenancyId,
              taskId,
              type: 'Routine',
              messageId: this.message?.id,
              stepId: currentStep ? currentStep?.id : this.prevData?.stepId,
              agencyId
            };
      this.routineInspectionSyncService
        .updateSyncRoutineInspection(body, this.prevData.id)
        .subscribe((res) => {
          this.routineInspectionSyncService.updateListRoutineInspection(
            {
              ...res.inspection,
              firstTimeSyncSuccess:
                res.inspection.syncStatus !== this.syncPropertyTree.FAILED
            },
            this.prevData.id
          );
          if (
            this.routineInspectionSyncService.isSyncRoutineInSpection.getValue() &&
            this.routineInspectionSyncService.selectedRoutineInspections$.getValue()
              ?.id === res.inspection?.id
          ) {
            this.routineInspectionSyncService.setSelectedRoutineInspection(
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
                EPropertyTreeButtonComponent.ROUTINE_INSPECTION,
                currentStep
                  ? EButtonAction[currentStep?.action.toUpperCase()]
                  : EButtonAction.PT_NEW_COMPONENT,
                res?.inspection?.id
              );
            } else {
              this.routineInspectionSyncService.updateStatusBtn();
            }
          }
          if (this.message) {
            this.routineInspectionService.triggerSyncRoutineInSpection(
              res.inspection.syncStatus
            );
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
    } = this.routineInspectionFormService.generateRoutineInspection();
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
      type: 'Routine',
      id: this.prevData ? this.prevData.id : uuid4(),
      createdAt: this.prevData?.createdAt || new Date(),
      ptId: this.ptId,
      stepId: currentStep ? currentStep?.id : this.prevData?.stepId
    };
    this.routineInspectionSyncService.updateListRoutineInspection(
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
          this.routineInspectionSyncService.updateListRoutineInspection(
            {
              ...res.inspection,
              firstTimeSyncSuccess:
                res.inspection.syncStatus !== this.syncPropertyTree.FAILED
            },
            this.prevData.id
          );
          if (
            this.routineInspectionSyncService.isSyncRoutineInSpection.getValue() &&
            this.routineInspectionSyncService.selectedRoutineInspections$.getValue()
              ?.id === res.inspection?.id
          ) {
            this.routineInspectionSyncService.setSelectedRoutineInspection(
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
                EPropertyTreeButtonComponent.ROUTINE_INSPECTION,
                EButtonAction[currentStep?.action.toUpperCase()]
              );
            } else {
              this.routineInspectionSyncService.updateStatusBtn();
            }
          }
          if (this.message) {
            this.routineInspectionService.triggerSyncRoutineInSpection(
              res.inspection.syncStatus
            );
          }
        },
        error: (error) => {
          this.toastService.error(error?.message || error?.error?.message);
        }
      });
    this.handleCloseModal();
  }

  resetForm() {
    this.inspectionForm.reset();
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

  triggerInputTouched(event: boolean, field: string) {
    if (!event) {
      this[field].markAsTouched();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
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
}
