import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Injectable } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { isEqual, cloneDeep } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';
import { ShareValidators } from '@shared/validators/share-validator';
import {
  IInspectionAreas,
  IInspectionResourcesRes,
  IRentManagerInspection,
  IStatus,
  ITenancy,
  IType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/interfaces/rent-manager-inspection.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

export enum EInspectionResourceType {
  STATUSES = 'statuses',
  TENANTS = 'tenants',
  TYPES = 'types'
}

@Injectable()
export class RentManagerInspectionFormService {
  private originalFormValue;
  private inspectionRmForm: FormGroup;
  private areaName = this.formBuilder.control(null, [
    Validators.required,
    ShareValidators.trimValidator
  ]);
  private inspectionResourcesCacheData: IInspectionResourcesRes = null;
  private selectedRentManagerInspection: IRentManagerInspection = null;
  private syncStatusBS = new BehaviorSubject({
    syncStatus: ESyncStatus.NOT_SYNC,
    syncDate: new Date()
  });
  public syncStatus$ = this.syncStatusBS.asObservable();
  public isSyncing = false;
  public checkSubmitted = true;

  constructor(
    private formBuilder: FormBuilder,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  public get inspectionResourceData() {
    return this.inspectionResourcesCacheData;
  }

  public setInspectionResourceCacheData(data: IInspectionResourcesRes) {
    this.inspectionResourcesCacheData = data;
  }

  public get getSelectRmInspection() {
    return this.selectedRentManagerInspection;
  }

  public setSelectRmInspection(value) {
    this.selectedRentManagerInspection = value;
  }

  public getValues() {
    return this.inspectionRmForm.value;
  }

  public getPayloadRmInspection() {
    const inspectionFormValue = cloneDeep(this.getValues());
    delete inspectionFormValue.areas;
    return {
      ...inspectionFormValue,
      concurrencyId: this.selectedRentManagerInspection?.concurrencyId,
      inspectionAreas: this.areas.value,
      scheduledDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(
        inspectionFormValue?.scheduledDate
      ),
      inspectionDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(
        inspectionFormValue?.inspectionDate
      )
    };
  }

  public get form() {
    return this.inspectionRmForm;
  }

  public setSyncStatusInspectionPopup(value) {
    this.syncStatusBS.next({
      ...this.syncStatusBS.value,
      ...value
    });
  }

  public initData(data) {
    this.selectedRentManagerInspection = data;
    const { syncStatus, syncDate } = data;
    if (syncStatus) {
      this.syncStatusBS.next({ syncStatus, syncDate });
    }
    return this;
  }

  public findSelectedResourceByType(
    type: EInspectionResourceType,
    id: string
  ): ITenancy | IType | IStatus {
    switch (type) {
      case EInspectionResourceType.TENANTS:
        return this.inspectionResourcesCacheData.tenants.find(
          (tenancy) => tenancy?.idUserPropertyGroup === id
        );
      case EInspectionResourceType.TYPES:
        return this.inspectionResourcesCacheData.types.find(
          (type) => type?.id === id
        );
      case EInspectionResourceType.STATUSES:
        return this.inspectionResourcesCacheData.statuses.find(
          (status) => status?.id === id
        );
    }
  }

  public buildForm() {
    this.inspectionRmForm = this.formBuilder.group({
      idUserPropertyGroup: [
        this.selectedRentManagerInspection?.idUserPropertyGroup ?? null
      ],
      inspectionTypeID: [
        this.selectedRentManagerInspection?.inspectionType?.id ?? null,
        [Validators.required]
      ],
      inspectionStatusID: [
        this.selectedRentManagerInspection?.inspectionStatus?.id ?? null,
        [Validators.required]
      ],
      inspectionDate: [
        this.selectedRentManagerInspection?.inspectionDate ?? null,
        [Validators.required]
      ],
      scheduledDate: [
        this.selectedRentManagerInspection?.scheduledDate ?? null
      ],
      description: [this.selectedRentManagerInspection?.description ?? null],
      notes: [this.selectedRentManagerInspection?.notes ?? null],
      areas: this.formBuilder.array(
        this.prefillListArea(
          this.selectedRentManagerInspection?.inspectionAreas || []
        )
      )
    });

    if (
      this.selectedRentManagerInspection &&
      this.selectedRentManagerInspection.syncStatus === ESyncStatus.INPROGRESS
    ) {
      this.inspectionRmForm.disable();
    }

    this.originalFormValue = this.getValues();
  }

  public clear() {
    this.syncStatusBS.next({
      syncStatus: ESyncStatus.NOT_SYNC,
      syncDate: new Date()
    });
    this.selectedRentManagerInspection = null;
  }

  public isFormChanged() {
    const isChanged = !isEqual(this.originalFormValue, this.getValues());
    return isChanged;
  }

  private prefillListArea(inspectionAreas: IInspectionAreas[]) {
    if (!inspectionAreas.length) return [];
    return inspectionAreas?.map((value, index: number) => {
      return this.formBuilder.group({
        id: [value?.id ?? null],
        inspectionId: [value?.inspectionId ?? null],
        name: [value?.name ?? null],
        externalId: [value?.externalId],
        inspectionAreaItems: this.formBuilder.array(
          inspectionAreas?.[index]?.inspectionAreaItems?.map((areaItem) => {
            return this.formBuilder.group({
              id: [areaItem?.id ?? null],
              inspectionAreaId: [areaItem?.inspectionAreaId ?? null],
              name: [
                areaItem?.name?.trim() ?? null,
                [Validators.required, ShareValidators.trimValidator]
              ],
              status: [areaItem?.status?.trim() ?? null],
              note: [areaItem?.note?.trim() ?? null],
              isActionItem: [areaItem?.isActionItem ?? false],
              isReviewNeeded: [areaItem?.isReviewNeeded ?? false],
              isSevere: [areaItem?.isSevere ?? false],
              files: this.formBuilder.array(
                areaItem?.files?.map((file) => {
                  if (file?.fileId) {
                    file['isDisabled'] = true;
                  }
                  return file;
                })
              ),
              externalId: [areaItem?.externalId]
            });
          })
        )
      });
    });
  }

  private get newArea(): FormGroup {
    return this.formBuilder.group({
      id: [null],
      inspectionAreaId: [null],
      name: [null, [Validators.required, ShareValidators.trimValidator]],
      status: [null],
      note: [null],
      isActionItem: [false],
      isReviewNeeded: [false],
      isSevere: [false],
      files: this.formBuilder.array([]),
      externalId: [null]
    });
  }

  private get newAreas(): FormGroup {
    return this.formBuilder.group({
      id: [null],
      inspectionId: [null],
      name: [null],
      externalId: [null],
      inspectionAreaItems: this.formBuilder.array([])
    });
  }

  public deleteAreas(index: number) {
    this.areas.removeAt(index);
  }

  public deleteAreaItem(areaIndex: number, areaItemIndex: number) {
    this.area(areaIndex).removeAt(areaItemIndex);
  }

  public addNewAreas() {
    this.areas.push(this.newAreas);
  }

  public addNewArea(index: number) {
    this.area(index).push(this.newArea);
  }

  public area(index: number) {
    return this.areas.at(index).get('inspectionAreaItems') as FormArray;
  }

  get areaNameControl() {
    return this.areaName as FormControl;
  }

  get areas() {
    return this.inspectionRmForm.get('areas') as FormArray;
  }

  get description() {
    return this.inspectionRmForm.get('description');
  }

  get notes() {
    return this.inspectionRmForm.get('notes');
  }

  get inspectionDate() {
    return this.inspectionRmForm.get('inspectionDate');
  }

  get scheduledDate() {
    return this.inspectionRmForm.get('scheduledDate');
  }

  get idUserPropertyGroup() {
    return this.inspectionRmForm.get('idUserPropertyGroup');
  }

  get inspectionStatusID() {
    return this.inspectionRmForm.get('inspectionStatusID');
  }

  get inspectionTypeID() {
    return this.inspectionRmForm.get('inspectionTypeID');
  }
}
