import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import {
  ETypeElement,
  EStepType,
  ESelectStepType
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { INewTaskStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { NewTaskStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/new-task-step-form.service';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '@services/permission.service';
import { RegionInfo } from '@shared/types/agency.interface';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { SharedService } from '@services/shared.service';
import { UserService } from '@services/user.service';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { CompanyService } from '@services/company.service';
import uuid4 from 'uuid4';
import { TaskTemplateHelper } from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';

@Component({
  selector: 'new-task-step',
  templateUrl: './new-task-step.component.html',
  styleUrls: ['./new-task-step.component.scss']
})
export class NewTaskStepComponent implements OnInit, OnDestroy {
  showDrawer = false;
  public editStep = false;
  items = null;
  public isDisableForm = false;
  private destroy$ = new Subject<void>();
  public regions: RegionInfo[] = [];
  public canEdit: boolean = false;
  public userType: string = '';
  public isConsoleUser: boolean = false;
  public isJiggling: boolean = false;

  constructor(
    private newTaskStepFormService: NewTaskStepFormService,
    private stepManagementService: StepManagementService,
    private templateTreeService: TemplateTreeService,
    public permissionService: PermissionService,
    public injector: Injector,
    private taskTemplateService: TaskTemplateService,
    private taskEditorService: TaskEditorService,
    private userService: UserService,
    private sharedService: SharedService,
    private companyService: CompanyService
  ) {}

  generateStepObject(data) {
    const step: INewTaskStep = {
      key: uuid4() as string,
      title: data.stepName,
      type: ETypeElement.STEP,
      newTaskTemplateId: data.newTaskTemplateId,
      stepType: EStepType.NEW_TASK
    };
    if (this.newTaskStepFormService.initialValue.value) {
      step.key = this.newTaskStepFormService.initialValue.value.key;
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

    if (this.taskEditorService.isConsoleSettings) {
      this.newTaskStepFormService.newTaskStepForm
        .get('newTaskTemplateId')
        .disable();
    }
    this.stepManagementService.selectedStepTypeValue$.subscribe((type) => {
      this.showDrawer = type === ESelectStepType.NEW_TASK;
      if (!this.showDrawer) this.isJiggling = false;
    });

    this.newTaskStepFormService.initialValue$.subscribe((value) => {
      this.editStep = !!value;
      if (!this.editStep) this.newTaskStepFormService.buildForm();
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
          this.getData();
        }
      });
  }

  handleOk() {
    const targetedNode = this.stepManagementService.getTargetedNode();
    this.newTaskStepForm.markAllAsTouched();
    if (this.newTaskStepForm.invalid) return;

    if (this.editStep) {
      this.templateTreeService.updateNode(
        this.generateStepObject(this.newTaskStepForm.value)
      );
    } else if (!!targetedNode) {
      const tree = TaskTemplateHelper.addNodeBelowTargetedNode(
        this.generateStepObject(this.newTaskStepForm.value),
        targetedNode,
        this.templateTreeService.getCurrentTemplateTree()
      );
      this.templateTreeService.setCurrentTemplateTree(tree);
      this.stepManagementService.setTargetedNode(null);
    } else {
      this.templateTreeService.addNode(
        ETypeElement.STEP,
        this.generateStepObject(this.newTaskStepForm.value)
      );
    }

    this.handleCancel();
  }

  handleBack() {
    this.stepManagementService.setSelectStepType(null);
    !this.isDisableForm && this.stepManagementService.handleSelect(true);
    this.newTaskStepFormService.resetForm();
  }

  getData() {
    this.taskTemplateService.regions$
      .pipe(takeUntil(this.destroy$))
      .subscribe((regions) => {
        if (regions) {
          this.regions = regions as unknown as RegionInfo[];
        }
      });
  }

  handleDelete() {
    this.templateTreeService.deleteStep(
      this.newTaskStepFormService.initialValue.value
    );
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
    this.newTaskStepFormService.resetForm();
  }

  get newTaskStepForm() {
    return this.newTaskStepFormService.newTaskStepForm;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
