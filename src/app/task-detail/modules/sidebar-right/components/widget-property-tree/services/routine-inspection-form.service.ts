import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { AgencyService } from '@services/agency.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { InspectionFormData } from '@shared/types/routine-inspection.interface';

@Injectable()
export class RoutineInspectionFormService {
  public routineInspectionForm: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    private agencyService: AgencyService,
    public taskService: TaskService,
    public propertyService: PropertiesService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  buildForm(): FormGroup {
    this.routineInspectionForm = this.formBuilder.group({
      tenancyId: new FormControl(null, Validators.required),
      date: new FormControl(null, Validators.required),
      startTime: new FormControl(null, Validators.required),
      endTime: new FormControl(null, Validators.required),
      tenantNotes: new FormControl('', Validators.maxLength(750)),
      action: new FormControl('', Validators.maxLength(750)),
      ownerNotes: new FormControl('', Validators.maxLength(750)),
      followUpItems: new FormControl('', Validators.maxLength(750))
    });
    return this.routineInspectionForm;
  }

  generateRoutineInspection() {
    return {
      tenancyId: this.routineInspectionForm.get('tenancyId').value,
      startTime: this.agencyDateFormatService.combineDateAndTimeToISO(
        this.routineInspectionForm.get('date').value,
        this.routineInspectionForm.get('startTime').value
      ),
      endTime: this.agencyDateFormatService.combineDateAndTimeToISO(
        this.routineInspectionForm.get('date').value,
        this.routineInspectionForm.get('endTime').value
      ),
      tenantNotes: this.routineInspectionForm.get('tenantNotes').value || '',
      action: this.routineInspectionForm.get('action').value || '',
      ownerNotes: this.routineInspectionForm.get('ownerNotes').value || '',
      followUpItems:
        this.routineInspectionForm.get('followUpItems').value || '',
      agencyId: this.taskService.currentTask$.getValue().agencyId,
      taskId: this.taskService.currentTaskId$.getValue(),
      propertyId: this.propertyService.currentPropertyId.getValue()
    };
  }

  patchFormValues(customValue?: InspectionFormData) {
    this.routineInspectionForm?.patchValue({
      tenancyId: customValue?.tenancyId,
      date: customValue?.date,
      startTime: customValue?.startTime,
      endTime: customValue?.endTime,
      tenantNotes: customValue?.tenantNotes?.slice(0, 750),
      action: customValue?.action?.slice(0, 750),
      ownerNotes: customValue?.ownerNotes?.slice(0, 750),
      followUpItems: customValue?.followUpItems?.slice(0, 750)
    });
  }

  disableField(fields: string[]) {
    fields.forEach((field) => {
      this.routineInspectionForm?.get(field)?.disable();
    });
  }

  enableField(fields: string[]) {
    fields.forEach((field) => {
      this.routineInspectionForm?.get(field)?.enable();
    });
  }
}
