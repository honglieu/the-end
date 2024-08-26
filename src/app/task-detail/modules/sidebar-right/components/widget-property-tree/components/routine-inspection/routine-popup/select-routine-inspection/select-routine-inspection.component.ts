import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, distinctUntilChanged, of, takeUntil, tap } from 'rxjs';
import { PropertiesService } from '@services/properties.service';
import { RoutineInspectionData } from '@shared/types/routine-inspection.interface';
import { SelectItemInList } from '@shared/types/task.interface';
import { RoutineInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/routine-inspection.service';
import { TaskService } from '@services/task.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

export enum SelectType {
  CREATE_NEW = 'CREATE_NEW',
  SELECT_EXISTING = 'SELECT_EXISTING'
}

@Component({
  selector: 'select-routine-inspection',
  templateUrl: './select-routine-inspection.component.html',
  styleUrls: ['./select-routine-inspection.component.scss']
})
export class SelectRoutineInspectionComponent implements OnInit, OnDestroy {
  public listOfInspection: SelectItemInList<RoutineInspectionData>[] = [];
  private unsubscribe = new Subject<void>();
  readonly selectInspectionType = SelectType;
  public selectInspectionRequest: FormGroup;
  @Input() isShowModal: boolean = false;
  @Input() modalId: string;
  @Output() handleCloseModalSelect = new EventEmitter<void>();
  @Output() handleNextModal = new EventEmitter<void>();

  public checkboxList = [
    {
      value: this.selectInspectionType.CREATE_NEW,
      label: 'Create new inspection'
    },
    {
      value: this.selectInspectionType.SELECT_EXISTING,
      label: 'Select existing inspection'
    }
  ];
  public notFoundItemText = 'No results found';
  public selectedOption = this.selectInspectionType.CREATE_NEW;

  constructor(
    public propertyService: PropertiesService,
    public taskService: TaskService,
    public routineInspectionSyncService: RoutineInspectionSyncService,
    public widgetPTService: WidgetPTService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {
    this.selectInspectionRequest = new FormGroup({
      selectExistInspection: new FormControl(null, [Validators.required])
    });
    this.taskService.currentTaskId$
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.getListInspection(res).subscribe();
      });
  }

  isValidForm() {
    if (this.selectedOption === this.selectInspectionType.SELECT_EXISTING) {
      return !!this.selectInspectionRequest.value.selectExistInspection;
    }
    return true;
  }

  onCheckboxChange() {
    this.resetForm();
    if (
      this.listOfInspection.length === 1 &&
      this.selectedOption === this.selectInspectionType.SELECT_EXISTING
    ) {
      this.selectInspectionRequest
        .get('selectExistInspection')
        .patchValue(this.listOfInspection[0].value.id);
    }
  }

  getListInspection(taskId: string) {
    if (!taskId) return of(null);
    return this.routineInspectionSyncService
      .getEventInspectionList(taskId)
      .pipe(
        takeUntil(this.unsubscribe),
        tap((res) => {
          if (res.inspections.length) {
            const { DATE_FORMAT_DAYJS } =
              this.agencyDateFormatService.dateFormat$.getValue();
            this.listOfInspection = res.inspections.map((item) => {
              return {
                id: item?.id,
                label: `Routine Inspection - ${this.agencyDateFormatService.formatTimezoneDate(
                  item?.startTime,
                  DATE_FORMAT_DAYJS
                )} (${item?.status})`,
                group: '',
                disabled: false,
                value: item
              };
            });
          }
        })
      );
  }

  resetForm() {
    this.selectInspectionRequest.reset();
  }

  get getSelectedInspection() {
    return this.selectInspectionRequest.get('selectExistInspection');
  }

  handleCloseModal() {
    this.resetForm();
    this.handleCloseModalSelect.emit();
  }

  handleNext() {
    this.widgetPTService.setModalUpdate(false);
    if (!this.isValidForm()) {
      this.validateAllFormFields(this.selectInspectionRequest);
      return;
    }
    const selectedId = this.selectInspectionRequest.get(
      'selectExistInspection'
    )?.value;
    const selectedInspection = this.listOfInspection.find(
      (inspection) => inspection.value.id === selectedId
    )?.value;
    this.routineInspectionSyncService.setSelectedRoutineInspection(
      selectedInspection
    );
    this.resetForm();
    this.handleNextModal.emit();
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
