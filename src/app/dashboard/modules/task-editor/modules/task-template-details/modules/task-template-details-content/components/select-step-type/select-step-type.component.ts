import { Component, OnInit } from '@angular/core';
import { ESelectStepType } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { ECRMId } from '@shared/enum/share.enum';

@Component({
  selector: 'select-step-type',
  templateUrl: './select-step-type.component.html',
  styleUrls: ['./select-step-type.component.scss']
})
export class SelectStepTypeComponent implements OnInit {
  public visible: boolean = false;
  private destroy$ = new Subject<void>();
  public crmSystemId: ECRMId;
  public ECRMId = ECRMId;

  public readonly ESelectStepType = ESelectStepType;

  constructor(
    private stepManagementService: StepManagementService,
    public currentAgencyService: AgencyService,
    private taskTemplateService: TaskTemplateService
  ) {}

  ngOnInit(): void {
    this.stepManagementService.selectStepValue$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.visible = res));

    this.taskTemplateService.taskTemplate$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.crmSystemId = res.crmSystemId as ECRMId;
        }
      });
  }

  handleCloseDrawer(type?: ESelectStepType) {
    this.stepManagementService.handleSelect(false);
    if (type) {
      this.stepManagementService.setIsDrawerJiggled(false);
      this.stepManagementService.setSelectStepType(type);
    }
  }
}
