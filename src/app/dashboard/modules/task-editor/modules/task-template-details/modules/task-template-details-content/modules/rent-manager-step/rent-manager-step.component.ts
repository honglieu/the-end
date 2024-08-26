import { Component, OnInit } from '@angular/core';
import {
  ESelectStepType,
  EStatusStep,
  EStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { IRentManagerStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { RentManagerStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/rent-manager-step-form.service';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { PermissionService } from '@services/permission.service';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { Subject, takeUntil } from 'rxjs';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { UserService } from '@services/user.service';
import { SharedService } from '@services/shared.service';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { CompanyService } from '@services/company.service';

import uuid4 from 'uuid4';
import { TaskTemplateHelper } from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';

@Component({
  selector: 'rent-manager-step',
  templateUrl: './rent-manager-step.component.html',
  styleUrls: ['./rent-manager-step.component.scss']
})
export class RentManagerStepComponent implements OnInit {
  showDrawer = false;
  public editStep = false;
  public isDisableForm = false;
  private destroy$ = new Subject<void>();
  public currentCrmSystemId: string;
  public crmLogo: string = '';
  public canEdit: boolean = false;
  public userType: string = '';
  public isConsoleUser: boolean = false;

  constructor(
    private rmFormService: RentManagerStepFormService,
    private stepManagementService: StepManagementService,
    private templateTreeService: TemplateTreeService,
    private agencyDashboardService: AgencyDashboardService,
    public permissionService: PermissionService,
    private taskTemplateService: TaskTemplateService,
    private taskEditorService: TaskEditorService,
    private userService: UserService,
    private sharedService: SharedService,
    private companyService: CompanyService
  ) {}

  generateStepObject(data) {
    const step: IRentManagerStep = {
      key: uuid4() as string,
      title: data.stepName,
      type: ETypeElement.STEP,
      action: data.actionType,
      stepType: EStepType.RENT_MANAGER,
      status: EStatusStep.PENDING,
      isRequired: data.isRequired,
      componentType: data.componentType,
      crmSystemId: this.currentCrmSystemId || null
    };

    if (this.rmFormService.initialValue.value) {
      step.key = this.rmFormService.initialValue.value.key;
      step.status = this.rmFormService.initialValue.value.status;
    }

    return step;
  }

  ngOnInit(): void {
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    this.userService.userInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.userType = user.type;
      });
    this.stepManagementService.selectedStepTypeValue$.subscribe((type) => {
      this.showDrawer = type === ESelectStepType.RENT_MANAGER_ACTION;
    });

    this.rmFormService.initialValue$.subscribe((value) => {
      this.editStep = !!value;
    });

    if (this.taskEditorService.isConsoleSettings) {
      this.taskTemplateService.taskTemplate$
        .pipe(takeUntil(this.destroy$))
        .subscribe((template) => {
          this.currentCrmSystemId = template?.crmSystemId;
        });
    }
    this.taskTemplateService.currentCrmLogoBS
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.crmLogo = res;
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs) {
          if (this.isConsoleUser && this.userType === UserTypeEnum.ADMIN) {
            this.canEdit = true;
            this.isDisableForm = false;
          } else {
            this.canEdit = this.permissionService.hasFunction(
              'TASK_EDITOR.TASKS.EDIT'
            );
            const hasTaskEditor = rs.addOns?.some(
              (item) => item === 'Task editor'
            );
            this.isDisableForm = !(hasTaskEditor && this.canEdit);
          }
        }
      });
  }

  handleOk() {
    const targetedNode = this.stepManagementService.getTargetedNode();
    this.ptStepForm.markAllAsTouched();
    if (this.ptStepForm.invalid) return;

    if (this.editStep) {
      this.templateTreeService.updateNode(
        this.generateStepObject(this.ptStepForm.value)
      );
    } else if (!!targetedNode) {
      const tree = TaskTemplateHelper.addNodeBelowTargetedNode(
        this.generateStepObject(this.ptStepForm.value),
        targetedNode,
        this.templateTreeService.getCurrentTemplateTree()
      );
      this.templateTreeService.setCurrentTemplateTree(tree);
      this.stepManagementService.setTargetedNode(null);
    } else {
      this.templateTreeService.addNode(
        ETypeElement.STEP,
        this.generateStepObject(this.ptStepForm.value)
      );
    }

    this.handleCancel();
  }

  handleBack() {
    this.stepManagementService.setSelectStepType(null);
    !this.isDisableForm && this.stepManagementService.handleSelect(true);
    this.rmFormService.resetForm();
  }

  handleDelete() {
    this.templateTreeService.deleteStep(this.rmFormService.initialValue.value);
    this.handleCancel();
  }

  handleCancel() {
    this.showDrawer = false;
    this.stepManagementService.setSelectStepType(null);
    this.rmFormService.resetForm();
  }

  get ptStepForm() {
    return this.rmFormService.rmStepForm;
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
