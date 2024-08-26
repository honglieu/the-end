import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  OnDestroy,
  Output
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, distinctUntilChanged, of, takeUntil, tap } from 'rxjs';
import { PropertiesService } from '@services/properties.service';
import { RoutineInspectionData } from '@shared/types/routine-inspection.interface';
import { SelectItemInList } from '@shared/types/task.interface';
import { OutgoingInspectionFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/outgoing-inspection-form.service';
import { OutgoingInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/outgoing-inspection.service';
import { TaskService } from '@services/task.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';

export enum SelectType {
  CREATE_NEW = 'CREATE_NEW',
  SELECT_EXISTING = 'SELECT_EXISTING'
}

@Component({
  selector: 'select-outgoing-inspection',
  templateUrl: './select-outgoing-inspection.component.html',
  styleUrls: ['./select-outgoing-inspection.component.scss']
})
export class SelectOutgoingInspectionComponent implements OnInit, OnDestroy {
  public listOfInspection: SelectItemInList<RoutineInspectionData>[] = [];
  public inspectionSelected: SelectItemInList<RoutineInspectionData>;
  private unsubscribe = new Subject<void>();
  readonly selectInspectionType = SelectType;
  public selectInspectionRequest: FormGroup;
  @Input() modalId: string;
  @Input() isShowModal: boolean = false;
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
    private readonly elr: ElementRef,
    public propertyService: PropertiesService,
    public taskService: TaskService,
    public outgoingInspectionFormService: OutgoingInspectionFormService,
    public outgoingInspectionSyncService: OutgoingInspectionSyncService,
    private widgetPTService: WidgetPTService,
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
    return this.outgoingInspectionSyncService
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
                label: `Outgoing Inspection - ${this.agencyDateFormatService.formatTimezoneDate(
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

  onSearchInspection(event) {
    if (!this.getSelectedInspection) {
      this.selectInspectionRequest
        .get('selectExistInspection')
        .patchValue(null);
    }
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
    const seletedInspection = this.listOfInspection.find(
      (inspection) => inspection.value.id === selectedId
    )?.value;
    if (seletedInspection) {
      this.outgoingInspectionSyncService.setSelectedOutgoingInspection(
        seletedInspection
      );
    }
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
