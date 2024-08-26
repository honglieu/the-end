import { cloneDeep, isEqual } from 'lodash-es';
import { Injectable } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  IRentManagerIssue,
  IRentManagerIssueCheckList,
  IRentManagerIssueDetailHistoryNotes,
  IRentManagerIssueWorkOrder
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import dayjs from 'dayjs';
import {
  validatorTime,
  validatorDate,
  customValidatorRequire,
  prefillWorkOrderByFormControl,
  setValidatorWhenSelectBill
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/validators/rent-manager-issue.validator';
import { ERentManagerIssueCheckListStatus } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { BehaviorSubject } from 'rxjs';
import { ERmIssueControlName } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/validators/rent-manager-issue.validator';
import { filterOutUnwantedKeys } from '@shared/feature/function.feature';
import { ESyncStatus, toStringFloat } from '@/app/task-detail/utils/functions';
import { ShareValidators } from '@shared/validators/share-validator';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { convertTime12to24 } from '@/app/trudi-send-msg/utils/helper-functions';

@Injectable()
export class RentManagerIssueFormService {
  constructor(
    private formBuilder: FormBuilder,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}
  private rentManagerIssueForm: FormGroup;
  private selectedRentManagerIssue: IRentManagerIssue = null;
  public isSubmittedRentIssueForm: boolean = false;
  private syncStatusBS = new BehaviorSubject({
    syncStatus: ESyncStatus.NOT_SYNC,
    syncDate: new Date()
  });
  public syncStatus$ = this.syncStatusBS.asObservable();
  private originalFormValue = null;

  public getSelectRMIssue() {
    return this.selectedRentManagerIssue;
  }

  public setSelectRMIssue(value: IRentManagerIssue) {
    this.selectedRentManagerIssue = value;
  }

  public setSyncStatusBS(value) {
    this.syncStatusBS.next({
      ...this.syncStatusBS.value,
      ...value
    });
  }

  public initData(value: IRentManagerIssue) {
    this.selectedRentManagerIssue = value;
    const { syncStatus, syncDate } = value;
    if (syncStatus) {
      this.syncStatusBS.next({ syncStatus, syncDate });
    }
    return this;
  }

  public buildForm() {
    try {
      this.rentManagerIssueForm = this.formBuilder.group({
        general: this.createRentManagerIssueGeneralForm(),
        workOrder: this.createRentManagerIssueWorkOrderForm(),
        details: this.createRentManagerIssueDetailsForm(),
        checklist: this.createRentManagerIssueCheckListForm(),
        historyNotes: this.createRentManagerIssueHistoryNotes()
      });

      if (this.disabled) {
        this.rentManagerIssueForm.disable();
      }
      this.originalFormValue = this.getValues();
    } catch (error) {
      console.error(error);
    }
  }

  private createRentManagerIssueGeneralForm(): FormGroup {
    let { title, scheduleDate, dueDate, openDate, closeDate, statusId } =
      this.selectedRentManagerIssue || {};

    // Set local Timezone
    dueDate = dueDate
      ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(dueDate)
      : null;
    const openDateValue = openDate
      ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(openDate)
      : this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          this.agencyDateFormatService.agencyDayJs().toISOString()
        );
    const closeDateValue = closeDate
      ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(closeDate)
      : null;
    scheduleDate = scheduleDate
      ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          scheduleDate
        )
      : null;

    const openTime = this.agencyDateFormatService
      .agencyDayJs(openDate)
      .format('hh:mm a');
    const closeTime = closeDate
      ? this.agencyDateFormatService.agencyDayJs(closeDate).format('hh:mm a')
      : null;

    return this.formBuilder.group({
      title: new FormControl(title || '', [
        Validators.required,
        ShareValidators.trimValidator
      ]),
      scheduleDate: new FormControl(scheduleDate || null, []),
      dueDate: new FormControl(dueDate || null, []),
      openDate: new FormControl(openDateValue || null, [
        Validators.required,
        validatorDate(ERmIssueControlName.CLOSE_DATE)
      ]),
      openTime: new FormControl(openTime, [
        Validators.required,
        validatorTime(ERmIssueControlName.OPEN_TIME)
      ]),
      closeDate: new FormControl(closeDateValue || null, [
        validatorDate(ERmIssueControlName.OPEN_DATE),
        customValidatorRequire(ERmIssueControlName.CLOSE_TIME)
      ]),
      closeTime: new FormControl(closeTime, [
        validatorTime(ERmIssueControlName.CLOSE_TIME),
        customValidatorRequire(ERmIssueControlName.CLOSE_DATE)
      ]),
      statusId: new FormControl(statusId || null, [])
    });
  }

  public addWorkOrderForm() {
    const workOrderArray = this.rentManagerIssueForm.get(
      'workOrder'
    ) as FormArray;

    const prefillData = {
      jobId: this.form.get('details')?.get('jobId')?.value,
      vendorId: this.form.get('details')?.get('vendorId')?.value
    };
    const newItemGroup = this.createFormGroupWorkOrderWithDefaults(prefillData);

    if (newItemGroup.get('jobId').value) {
      newItemGroup.get('jobId').disable();
    }
    if (newItemGroup.get('vendorId').value) {
      newItemGroup.get('vendorId').disable();
    }

    workOrderArray.push(newItemGroup);
    this.rentManagerIssueForm.setControl('workOrder', workOrderArray);
  }

  public removeWorkItemAtindex(lessonIndex: number) {
    const workOrderArray = this.rentManagerIssueForm.get(
      'workOrder'
    ) as FormArray;
    workOrderArray.removeAt(lessonIndex);
  }

  public duplicateWorkItemWorkOrder(form) {
    const workOrderArray = this.rentManagerIssueForm.get(
      'workOrder'
    ) as FormArray;

    const billsData = form.get('bills').value.map((value) => {
      return {
        id: '',
        type: value
      };
    });
    const newForm = this.createFormGroupWorkOrderWithDefaults({
      ...form.getRawValue(),
      bills: billsData,
      externalId: null,
      id: null
    });

    if (form.get('vendorId').disabled) {
      newForm.get('vendorId').disable();
    }
    if (form.get('jobId').disabled) {
      newForm.get('jobId').disable();
    }

    workOrderArray.push(newForm);
  }

  private createRentManagerIssueWorkOrderForm() {
    const workOrderDataList = this.selectedRentManagerIssue?.workOrder || [];
    const workOrderArray = this.formBuilder.array(
      workOrderDataList.length > 0
        ? workOrderDataList.sort(this.compareDateFn).map((workOrderData) => {
            return this.createFormGroupWorkOrderWithDefaults(workOrderData);
          })
        : []
    );
    return workOrderArray;
  }

  private createFormGroupWorkOrderWithDefaults(data: any = {}): FormGroup {
    const { syncStatus, syncDate } = this.selectedRentManagerIssue || {};
    const billsData =
      data?.bills?.filter(Boolean).map((item) => item.type) ?? [];
    const billInfo = data.bills?.filter(Boolean).map((e) => ({
      ...e,
      syncStatus: e?.syncStatus || syncStatus,
      syncDate: e?.syncDate || syncDate
    }));
    return this.formBuilder.group({
      id: new FormControl(data.id || null),
      inventoryItemId: new FormControl(data.inventoryItemId || null, [
        Validators.required
      ]),
      vendorId: new FormControl(data.vendorId || null),
      jobId: new FormControl(data.jobId || null),
      description: new FormControl(data.description || null, []),
      quantity: new FormControl(toStringFloat(data.quantity), [
        Validators.required
      ]),
      cost: new FormControl(toStringFloat(data.cost), [Validators.required]),
      salePrice: new FormControl(toStringFloat(data.salePrice), [
        Validators.required
      ]),
      totalPrice: new FormControl(data.totalPrice || 0, []),
      externalId: new FormControl(data?.externalId || null),
      bills: new FormControl(billsData || null, [
        setValidatorWhenSelectBill('bills')
      ]),
      billInfo: new FormControl(billInfo || [], []),
      isAllowValidate: new FormControl(false)
    });
  }

  private createRentManagerIssueHistoryNotes(): FormArray {
    try {
      const formGroups = this.selectedRentManagerIssue?.historyNotes
        ?.sort(this.compareDateFn)
        ?.map((historyNote) => {
          let historyNoteFiles =
            historyNote?.files.map((file) => {
              if (file?.fileId) {
                file['isDisabled'] = true;
              }
              return file;
            }) || [];
          return this.formBuilder.group({
            id: new FormControl(historyNote.id || null),
            categoryId: new FormControl(
              historyNote.categoryId,
              Validators.required
            ),
            note: new FormControl(historyNote.note, Validators.required),
            files: this.formBuilder.array(historyNoteFiles),
            externalId: new FormControl(historyNote?.externalId || null)
          });
        });
      if (formGroups) return this.formBuilder.array(formGroups);
      return this.formBuilder.array([]);
    } catch {
      return this.formBuilder.array([]);
    }
  }

  private createRentManagerIssueDetailsForm(): FormGroup {
    const {
      tenantId,
      categoryId,
      priorityId,
      projectId,
      vendorId,
      jobId,
      description,
      resolution,
      externalId,
      tenantDetail,
      externalLinkedTenantId,
      externalLinkedProspectId
    } = this.selectedRentManagerIssue?.details || {};
    return this.formBuilder.group({
      tenantId: new FormControl(tenantId || null),
      externalLinkedTenantId: new FormControl(externalLinkedTenantId || null),
      externalLinkedProspectId: new FormControl(
        externalLinkedProspectId || null
      ),
      categoryId: new FormControl(categoryId || null),
      priorityId: new FormControl(priorityId || null),
      projectId: new FormControl(projectId || null),
      vendorId: new FormControl(vendorId || null, [
        prefillWorkOrderByFormControl('vendorId')
      ]),
      externalId: new FormControl(externalId || null),
      jobId: new FormControl(jobId || null, [
        prefillWorkOrderByFormControl('jobId')
      ]),
      description: new FormControl(description || null),
      resolution: new FormControl(resolution || null),
      tenantDetail: new FormControl(tenantDetail || null)
    });
  }

  private createRentManagerIssueCheckListForm() {
    try {
      const formGroups = this.selectedRentManagerIssue?.checklist
        ?.sort(this.compareDateFn)
        .map((e) => {
          return this.formBuilder.group({
            id: new FormControl(e.id || null),
            description: new FormControl(e.description, Validators.required),
            externalId: new FormControl(e?.externalId || null),
            concurrencyId: new FormControl(e?.concurrencyId || null),
            status: new FormControl(
              e.status === ERentManagerIssueCheckListStatus.COMPLETED
            )
          });
        });
      if (formGroups) return this.formBuilder.array(formGroups);
      return this.formBuilder.array([]);
    } catch (error) {
      console.error(error);
      return this.formBuilder.array([]);
    }
  }

  public getValues() {
    const payload = {
      ...this.getGeneralValues(),
      workOrder: this.getWorkOrderValue(),
      checklist: this.checklistControlValue(),
      historyNotes: this.historyNotesControlValue(),
      details: this.getDetailsValue()
    };
    return cloneDeep(payload);
  }

  public checklistControlValue() {
    return this.rentManagerIssueForm.get('checklist').value.map((e) => {
      if (!e.concurrencyId) delete e.concurrencyId;
      return {
        ...e,
        status: e.status
          ? ERentManagerIssueCheckListStatus.COMPLETED
          : ERentManagerIssueCheckListStatus.INPROGRESS
      };
    });
  }

  historyNotesControlValue() {
    const removeDisabledField = ({ isDisabled, ...otherInfoFile }) =>
      otherInfoFile;
    return this.rentManagerIssueForm.get('historyNotes').value.map((note) => {
      const { files, ...otherInfoNote } = note;
      return {
        files: files ? files.map(removeDisabledField) : [],
        ...otherInfoNote
      };
    });
  }

  public clear() {
    this.syncStatusBS.next({
      syncStatus: ESyncStatus.NOT_SYNC,
      syncDate: new Date()
    });
    this.isSubmittedRentIssueForm = false;
    this.rentManagerIssueForm = null;
    this.selectedRentManagerIssue = null;
  }

  private getGeneralValues() {
    const generalValues = cloneDeep(this.form.value.general);
    generalValues.title = generalValues.title.trim();

    if (generalValues.openDate && generalValues.openTime) {
      generalValues['openDate'] =
        this.agencyDateFormatService.combineDateAndTimeToISO(
          generalValues.openDate,
          hmsToSecondsOnly(convertTime12to24(generalValues.openTime))
        );
    }
    if (generalValues.closeDate && generalValues.closeTime) {
      generalValues['closeDate'] =
        this.agencyDateFormatService.combineDateAndTimeToISO(
          generalValues.closeDate,
          hmsToSecondsOnly(convertTime12to24(generalValues.closeTime))
        );
    }
    if (generalValues.scheduleDate) {
      generalValues.scheduleDate = this.agencyDateFormatService
        .expectedTimezoneStartOfDay(generalValues.scheduleDate)
        .toISOString();
    }
    if (generalValues.dueDate) {
      generalValues.dueDate = this.agencyDateFormatService
        .expectedTimezoneStartOfDay(generalValues.dueDate)
        .toISOString();
    }

    delete generalValues.openTime;
    delete generalValues.closeTime;

    return filterOutUnwantedKeys(generalValues);
  }

  private getDetailsValue() {
    const detailsValue = this.form.value.details;
    delete detailsValue.tenantDetail;

    const {
      externalLinkedPropertyId,
      externalLinkedUnitId,
      externalLinkedTenantId,
      externalLinkedProspectId
    } = this.selectedRentManagerIssue?.details || {};

    if (externalLinkedPropertyId) {
      detailsValue['externalLinkedPropertyId'] = externalLinkedPropertyId;
    }
    if (externalLinkedUnitId) {
      detailsValue['externalLinkedUnitId'] = externalLinkedUnitId;
    }
    if (externalLinkedTenantId) {
      detailsValue['externalLinkedTenantId'] = externalLinkedTenantId;
    }
    if (externalLinkedProspectId) {
      detailsValue['externalLinkedProspectId'] = externalLinkedProspectId;
    }

    return filterOutUnwantedKeys(cloneDeep(detailsValue));
  }

  private getWorkOrderValue() {
    const workOrderValue = this.rentManagerIssueForm.get('workOrder').value;
    const detailsValue = this.rentManagerIssueForm.get('details').value;

    return workOrderValue.map((workOrder) => {
      const { billInfo, isAllowValidate, ...workOrderWithoutBillInfo } =
        workOrder;
      const bills = workOrder.bills.map((item) => {
        const billInfoItem = billInfo?.find((bill) => bill.type === item);
        const billItem = {
          type: item,
          id: billInfoItem?.id ?? ''
        };
        if (billInfoItem && billInfoItem?.syncDate) {
          billItem['syncDate'] = billInfoItem.syncDate;
        }
        if (billInfoItem?.syncStatus) {
          billItem['syncStatus'] = billInfoItem.syncStatus;
        }
        if (billInfoItem?.externalId) {
          billItem['externalId'] = billInfoItem.externalId;
        }
        return billItem;
      });
      const quantity = parseFloat(
        workOrderWithoutBillInfo.quantity?.toString()?.replace(/,/g, '')
      );
      const cost = parseFloat(workOrder?.cost?.toString()?.replace(/,/g, ''));
      const salePrice = parseFloat(
        workOrderWithoutBillInfo?.salePrice?.toString()?.replace(/,/g, '')
      );
      const totalPrice = parseFloat(
        workOrderWithoutBillInfo?.totalPrice?.toString()?.replace(/,/g, '')
      );
      const jobId = detailsValue?.jobId || workOrder?.jobId;
      const vendorId = detailsValue?.vendorId || workOrder?.vendorId || null;

      return {
        ...workOrderWithoutBillInfo,
        jobId,
        vendorId,
        quantity,
        cost,
        salePrice,
        totalPrice,
        bills: bills
      };
    });
  }

  public get form() {
    return this.rentManagerIssueForm;
  }

  public get disabled() {
    return this.selectedRentManagerIssue?.syncStatus === ESyncStatus.INPROGRESS;
  }

  public get isEditing() {
    return Boolean(this.selectedRentManagerIssue);
  }

  public get checklistFormControl(): FormArray {
    return this.rentManagerIssueForm.get('checklist') as FormArray;
  }

  public isRMIssueFormChanged() {
    const generalValues = this.form.get('general').value;
    const isCloseFieldsChanged =
      (generalValues.closeTime && !generalValues.closeDate) ||
      (!generalValues.closeTime && generalValues.closeDate);

    const isChanged =
      !isEqual(this.originalFormValue, this.getValues()) ||
      isCloseFieldsChanged;
    return isChanged;
  }

  compareDateFn<
    T extends
      | IRentManagerIssueCheckList
      | IRentManagerIssueDetailHistoryNotes
      | IRentManagerIssueWorkOrder
  >(a: T, b: T) {
    const diff = dayjs(a.createdAt).diff(b.createdAt);
    if (diff === 0 && a.externalId && b.externalId)
      return Number(a.externalId) - Number(b.externalId);
    return diff;
  }
}
