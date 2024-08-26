import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import {
  EComplianceType,
  EManagedBy
} from '@/app/compliance/utils/compliance.enum';
import {
  ALARM_TYPE_LIST,
  AUTHOR_RECEVIED_LIST,
  MANAGEDBY_LIST
} from '@/app/compliance/constants/complianceConstants';
import { MAX_TEXT_NOTE_LENGTH, SHORT_ISO_DATE } from '@services/constants';
import { AgencyService } from '@services/agency.service';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { ComplianceFormService } from '@/app/compliance/services/compliance-form.service';
import { TaskService } from '@services/task.service';
import { ICategoryItem } from '@/app/compliance/utils/compliance.type';
import { ComplianceService } from '@/app/compliance/services/compliance.service';
import { TrudiService } from '@services/trudi.service';
import dayjs from 'dayjs';
import { TaskNameId } from '@shared/enum/task.enum';
import { Personal } from '@shared/types/user.interface';
import { PropertiesService } from '@services/properties.service';
import { EEventStatus } from '@shared/enum/calendar.enum';

@Component({
  selector: 'compliance-form',
  templateUrl: './compliance-form.component.html',
  styleUrls: ['./compliance-form.component.scss']
})
export class ComplianceFormComponent implements OnInit {
  @Input() listCategoryByTask: ICategoryItem[];
  @Input() tenanciesOptions: Personal[] = [];
  @Input() taskNameId: string;
  @Input() currentDataEdit;
  @Input() isShowSmokeAlarmField: boolean = false;
  @Input() syncInprogress: boolean = false;
  @Input() accountOptions = [];

  private unsubscribe = new Subject<void>();
  readonly eManagedBy = EManagedBy;
  readonly eComplianceType = EComplianceType;
  public alarmTypeList = ALARM_TYPE_LIST;
  public managedByList = MANAGEDBY_LIST;
  public authorList = AUTHOR_RECEVIED_LIST;
  public defaultDate: Date = new Date();
  public datePickerStatusStartDate: string;
  public datePickerStatusEndDate: string;
  public datePickerStatusEffectDate: string;
  readonly MAX_TEXT_NOTE_LENGTH = MAX_TEXT_NOTE_LENGTH;
  public isEdit: boolean = false;
  public disableForm: boolean = false;

  get complianceFormControl() {
    return this.complianceFormService?.complianceForm;
  }

  get tenancyControl() {
    return this.getControl('tenancyControl');
  }

  get complianceItemControl() {
    return this.getControl('complianceItemControl');
  }

  get smokeAlarmTypeControl() {
    return this.getControl('smokeAlarmTypeControl');
  }

  get managedByControl() {
    return this.getControl('managedByControl');
  }

  get servicesByControl() {
    return this.getControl('servicesByControl');
  }

  get authorReceivedControl() {
    return this.getControl('authorReceivedControl');
  }

  get noteControl() {
    return this.getControl('noteControl');
  }

  get expiredDateControl() {
    return this.getControl('expiredDateControl');
  }

  get lastServiceDateControl() {
    return this.getControl('lastServiceDateControl');
  }

  get nextServiceDateControl() {
    return this.getControl('nextServiceDateControl');
  }

  get isShowServiceField() {
    return this.managedByControl?.value === this.eManagedBy.AGENT;
  }

  constructor(
    public agencyService: AgencyService,
    public complianceFormService: ComplianceFormService,
    public taskService: TaskService,
    public complianceService: ComplianceService,
    public trudiService: TrudiService,
    private propertyService: PropertiesService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.complianceService.currentDataEdit,
      this.complianceFormControl.valueChanges
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([dataEdit, currentVal]) => {
        if (!currentVal || !dataEdit) return;
        this.handleStatusUnsyncChange(dataEdit, currentVal);
      });
    const tenancies = this.propertyService.peopleList.value?.tenancies;
    if (
      !this.isEdit ||
      (this.isEdit && !this.currentDataEdit?.idUserPropertyGroup)
    ) {
      this.tenancyControl.setValue(
        tenancies?.length === 1 ? tenancies[0]?.id : null
      );
    }

    combineLatest([
      this.complianceService.currentDataEdit,
      this.complianceService.complianceSelected
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([currentDataEdit, complianceSelected]) => {
        const isGeneralType =
          (currentDataEdit?.complianceCategory?.type ||
            complianceSelected?.complianceCategory?.type) ===
          EComplianceType.GENERAL;
        this.managedByList = isGeneralType
          ? MANAGEDBY_LIST.filter((item) => item.value !== EManagedBy.OWNER)
          : MANAGEDBY_LIST;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const {
      listCategoryByTask,
      tenanciesOptions,
      taskNameId,
      currentDataEdit,
      isShowSmokeAlarmField,
      syncInprogress,
      accountOptions
    } = changes;
    this.listCategoryByTask =
      listCategoryByTask?.currentValue ?? this.listCategoryByTask;

    this.tenanciesOptions =
      tenanciesOptions?.currentValue ?? this.tenanciesOptions;

    this.taskNameId = taskNameId?.currentValue ?? this.taskNameId;

    this.currentDataEdit =
      currentDataEdit?.currentValue ?? this.currentDataEdit;

    this.isShowSmokeAlarmField =
      isShowSmokeAlarmField?.currentValue ?? this.isShowSmokeAlarmField;

    this.isEdit = !!(
      this.currentDataEdit && Object.keys(this.currentDataEdit).length > 0
    );

    this.syncInprogress = syncInprogress?.currentValue ?? this.syncInprogress;

    this.accountOptions = accountOptions?.currentValue ?? this.accountOptions;

    if (
      this.syncInprogress ||
      [EEventStatus.CLOSED, EEventStatus.CANCELLED].includes(
        this.currentDataEdit.status
      )
    ) {
      this.complianceFormControl.disable();
      this.disableForm = true;
    } else {
      this.complianceFormControl.enable();
      this.disableForm = false;
    }
    if (this.isEdit && this.currentDataEdit?.id) {
      this.complianceItemControl.disable();
    }
    if (this.taskNameId === TaskNameId.generalCompliance) {
      this.managedByList = MANAGEDBY_LIST.filter(
        (item) => item.value !== EManagedBy.OWNER
      );
    }
  }

  getControl(controlName) {
    return this.complianceFormControl?.get(controlName);
  }

  checkInvalidForm() {
    if (this.complianceFormControl.invalid) {
      this.complianceFormControl.markAllAsTouched();
      return true;
    } else {
      return false;
    }
  }

  getDataForm() {
    return this.complianceFormControl.invalid
      ? null
      : this.complianceFormControl.getRawValue();
  }

  handleChangeManagedBy(e) {
    const isAgent = e.value === EManagedBy.AGENT;
    isAgent
      ? this.complianceFormService.addServiceByAndAuthorField(
          this.currentDataEdit
        )
      : this.complianceFormService.clearServiceByAndAuthorFieldControl();
    this.complianceFormService.complianceForm.updateValueAndValidity();
  }

  handleChangeCompliance(e) {
    const isSmokeAlarm = e.type === EComplianceType.SMOKE_ALARM;
    if (isSmokeAlarm) {
      this.managedByList = MANAGEDBY_LIST;
      this.complianceFormService.addSmokeAlarmTypeFieldControl(
        this.currentDataEdit
      );
    } else {
      this.managedByList = MANAGEDBY_LIST.filter(
        (item) => item.value !== EManagedBy.OWNER
      );
      this.complianceFormService.clearSmokeAlarmTypeFieldControl();
    }

    this.isShowSmokeAlarmField = isSmokeAlarm;
    this.complianceFormService.complianceForm.updateValueAndValidity();
    if (e?.compliance) {
      this.complianceFormService.patchFormCompliance(e?.compliance, e?.id);
    }
    this.complianceFormService.complianceForm.markAsUntouched();
    this.complianceFormService.complianceForm.markAsPristine();
  }

  formatDateISO(date) {
    return date ? dayjs(date).format(SHORT_ISO_DATE) : null;
  }

  handleStatusUnsyncChange(dataEdit, currentVal) {
    const {
      idUserPropertyGroup,
      smokeAlarmType,
      managedBy,
      creditorId,
      authorityForm,
      expiryDate,
      lastServiceDate,
      nextServiceDate,
      notes
    } = dataEdit ?? {};

    const {
      tenancyControl,
      smokeAlarmTypeControl,
      managedByControl,
      servicesByControl,
      authorReceivedControl,
      expiredDateControl,
      lastServiceDateControl,
      nextServiceDateControl,
      noteControl
    } = currentVal;

    const expiryDateConvert = this.formatDateISO(expiryDate);
    const lastServiceDateConvert = this.formatDateISO(lastServiceDate);
    const nextServiceDateConvert = this.formatDateISO(nextServiceDate);

    const expiredDateControlCv = this.formatDateISO(expiredDateControl);
    const lastServiceDateControlCv = this.formatDateISO(lastServiceDateControl);
    const nextServiceDateControlCv = this.formatDateISO(nextServiceDateControl);

    const isDataChanged =
      idUserPropertyGroup !== tenancyControl ||
      (smokeAlarmType ?? null) !== (smokeAlarmTypeControl ?? null) ||
      managedBy !== managedByControl ||
      (creditorId ?? null) !== (servicesByControl ?? null) ||
      (authorityForm || null) !== (authorReceivedControl || null) ||
      expiryDateConvert !== expiredDateControlCv ||
      lastServiceDateConvert !== lastServiceDateControlCv ||
      nextServiceDateConvert !== nextServiceDateControlCv ||
      notes !== noteControl;

    this.complianceService.unSyncChangeStatus$.next(isDataChanged);
  }
}
