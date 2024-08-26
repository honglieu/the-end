import { takeUntil, Subject, switchMap, of } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RentManagerInspectionFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/services/rent-manager-inspection-form.service';
import { RentManagerInspectionApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/services/rent-manager-inspection-api.service';
import { TaskService } from '@services/task.service';
import {
  IStatus,
  ITenancy,
  IType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/interfaces/rent-manager-inspection.interface';
import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { AREA_IMAGE_VALID_TYPE } from '@services/constants';

@Component({
  selector: 'inspection-rm-form',
  templateUrl: './inspection-rm-form.component.html',
  styleUrls: ['./inspection-rm-form.component.scss']
})
export class InspectionRmFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public tenanciesOptions: ITenancy[] = [];
  public statusOptions: IStatus[] = [];
  public typeOptions: IType[] = [];
  public readonly AREA_IMAGE_VALID_TYPE = AREA_IMAGE_VALID_TYPE;
  constructor(
    private rentManagerInspectionFormService: RentManagerInspectionFormService,
    private rentManagerInspectionApiService: RentManagerInspectionApiService,
    private taskService: TaskService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.taskService.currentTask$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((currentTask) => {
          if (currentTask) {
            return this.rentManagerInspectionApiService.getRmInspectionResource(
              currentTask?.agencyId,
              currentTask?.property?.id
            );
          } else {
            return of(null);
          }
        })
      )
      .subscribe((res) => {
        if (res) {
          this.rentManagerInspectionFormService.setInspectionResourceCacheData(
            res
          );
          const { statuses, tenants, types } = res || {};
          this.tenanciesOptions =
            tenants.sort((a, b) => {
              return a.firstName === b.firstName
                ? a.lastName.localeCompare(b.lastName)
                : a.firstName.localeCompare(b.firstName);
            }) || [];
          this.statusOptions = statuses || [];
          this.typeOptions = types || [];
        }
      });
  }

  public getListFile(files, control: FormControl) {
    const fileControl = control.get('files') as FormArray;
    fileControl.clear();
    files.forEach((file) => {
      fileControl.push(this.fb.control(file));
    });
  }

  public customSearchFn(term: string, item) {
    const valueSearch = item.firstName?.trim() + ' ' + item.lastName?.trim();
    const searchByName =
      valueSearch.toLowerCase().indexOf(term.trim().toLowerCase()) > -1;
    return searchByName;
  }

  public handleDeleteAreaItem(
    areaIndex: number,
    areaItemIndex: number,
    isDisabled: boolean
  ) {
    if (isDisabled) return;
    this.rentManagerInspectionFormService.deleteAreaItem(
      areaIndex,
      areaItemIndex
    );
  }

  public addAreaItem(index: number) {
    this.rentManagerInspectionFormService.addNewArea(index);
  }

  public getAreaTitle(index: number) {
    return this.inspectionAreas.at(index).get('name') as FormControl;
  }

  public isSyncedToRm(index: number) {
    return this.inspectionAreas.at(index).get('externalId') as FormControl;
  }

  public isItemSyncedToRm(areaIndex: number, itemIndex: number) {
    return this.rentManagerInspectionFormService
      .area(areaIndex)
      .at(itemIndex)
      .get('externalId') as FormControl;
  }

  public get checkSubmitted() {
    return this.rentManagerInspectionFormService.checkSubmitted;
  }

  public get isDisabled() {
    return this.rentManagerInspectionFormService.isSyncing;
  }

  public get inspectionRmForm() {
    return this.rentManagerInspectionFormService.form;
  }

  public get inspectionDate() {
    return this.inspectionRmForm.get('inspectionDate');
  }

  public get scheduledDate() {
    return this.inspectionRmForm.get('scheduledDate');
  }

  public get inspectionAreas() {
    return this.rentManagerInspectionFormService.areas as FormArray;
  }

  public inspectionArea(index: number) {
    return this.rentManagerInspectionFormService.area(index) as FormArray;
  }

  public handleAddNewArea() {
    this.rentManagerInspectionFormService.addNewAreas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.rentManagerInspectionFormService.setInspectionResourceCacheData(null);
  }
}
