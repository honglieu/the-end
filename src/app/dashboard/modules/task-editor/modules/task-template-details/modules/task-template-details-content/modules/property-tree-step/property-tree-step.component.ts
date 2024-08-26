import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ESelectStepType,
  EStatusStep,
  EStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { IPropertyTreeStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { PropertyTreeStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/property-tree-step-form.service';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { PermissionService } from '@services/permission.service';
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
  selector: 'property-tree-step',
  templateUrl: './property-tree-step.component.html',
  styleUrls: ['./property-tree-step.component.scss']
})
export class PropertyTreeStepComponent implements OnInit, OnDestroy {
  showDrawer = false;
  public editStep = false;
  public isDisableForm = false;
  private destroy$ = new Subject<void>();
  public currentCrmSystemId: string;
  public crmLogo: string = '';
  public canEdit: boolean = false;
  public userType: string = '';
  public isConsoleUser: boolean = false;
  public isJiggling: boolean = false;

  constructor(
    private ptFormService: PropertyTreeStepFormService,
    private stepManagementService: StepManagementService,
    private templateTreeService: TemplateTreeService,
    public permissionService: PermissionService,
    private taskEditorService: TaskEditorService,
    private taskTemplateService: TaskTemplateService,
    private userService: UserService,
    private sharedService: SharedService,
    private companyService: CompanyService
  ) {}

  generateStepObject(data) {
    const step: IPropertyTreeStep = {
      key: uuid4() as string,
      title: data.stepName,
      type: ETypeElement.STEP,
      action: data.actionType,
      stepType: EStepType.PROPERTY_TREE,
      status: EStatusStep.PENDING,
      isRequired: data.isRequired,
      componentType: data.componentType,
      crmSystemId: this.currentCrmSystemId || null
    };

    if (this.ptFormService.initialValue.value) {
      step.key = this.ptFormService.initialValue.value.key;
      step.status = this.ptFormService.initialValue.value.status;
    }

    return step;
  }

  ngOnInit(): void {
    this.userService.userInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.userType = user.type;
      });
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    this.stepManagementService.selectedStepTypeValue$.subscribe((type) => {
      this.showDrawer = type === ESelectStepType.PROPERTY_TREE_ACTION;
      if (!this.showDrawer) this.isJiggling = false;
    });

    this.ptFormService.initialValue$.subscribe((value) => {
      this.editStep = !!value;
      if (!this.editStep) this.ptFormService.buildForm();
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
            this.isDisableForm = false;
            this.canEdit = true;
          } else {
            this.canEdit = this.permissionService.hasFunction(
              'TASK_EDITOR.TASKS.EDIT'
            );
            this.isDisableForm =
              this.taskEditorService.checkToDisableTaskEditor(rs.addOns || []);
          }
        }
      });
  }

  handleOk() {
    const targetedNode = this.stepManagementService.getTargetedNode();

    this.ptStepForm.markAllAsTouched();
    if (this.ptStepForm.invalid) {
      return;
    }

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
    this.ptFormService.resetForm();
  }

  handleDelete() {
    this.templateTreeService.deleteStep(this.ptFormService.initialValue.value);
    this.handleCancel();
  }

  handleCancel(fromClickOutsideDrawer: boolean = false) {
    if (fromClickOutsideDrawer) {
      this.isJiggling =
        this.stepManagementService.shouldWarningUnsavedChanges();
      if (this.isJiggling) return;
    }
    this.showDrawer = false;
    this.stepManagementService.setIsEditingForm(false);
    this.stepManagementService.setSelectStepType(null);
    this.ptFormService.resetForm();
  }

  get ptStepForm() {
    return this.ptFormService.ptStepForm;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
