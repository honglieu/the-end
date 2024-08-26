import { Component, OnDestroy, OnInit } from '@angular/core';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  skip,
  takeUntil
} from 'rxjs';
import {
  ESelectStepType,
  EStatusStep,
  EStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { FormGroup } from '@angular/forms';
import { CheckListStepFromService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/check-list-step-from.service';
import { PermissionService } from '@services/permission.service';
import { SharedService } from '@services/shared.service';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { UserService } from '@services/user.service';
import { TreeNodeOptions } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import { CompanyService } from '@services/company.service';

import uuid4 from 'uuid4';
import { TaskTemplateHelper } from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';
import { isEmpty, isEqual, values } from 'lodash-es';

@Component({
  selector: 'check-list-step',
  templateUrl: './check-list-step.component.html',
  styleUrls: ['./check-list-step.component.scss']
})
export class CheckListStepComponent implements OnInit, OnDestroy {
  public showDrawer: boolean;
  public stepName: string;
  public stepFormGroup: FormGroup;
  public currentStepData: TreeNodeOptions;
  private destroy$ = new Subject<void>();
  public editStep: boolean = false;
  public isDisableForm: boolean = false;
  public userType: string = '';
  public isConsoleUser: boolean = false;
  public canEdit: boolean = false;
  public isSubmit: boolean = true;
  public prefillStepName: string = '';
  public stepContent: string = '';
  public isJiggling: boolean = false;
  public isFocusedTextEditor: boolean = false;

  constructor(
    private stepManagementService: StepManagementService,
    private templateTreeService: TemplateTreeService,
    private checkListStepFromService: CheckListStepFromService,
    private permissionService: PermissionService,
    private sharedService: SharedService,
    private userService: UserService,
    private companyService: CompanyService
  ) {}

  ngOnInit() {
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    this.userService.userInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.userType = user.type;
      });
    combineLatest([
      this.stepManagementService.selectedStepTypeValue$,
      this.checkListStepFromService.currentStepData$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([type, currentStepData]) => {
        this.showDrawer = type === ESelectStepType.CHECK_LIST;
        if (!this.showDrawer) this.isJiggling = false;
        this.currentStepData = currentStepData;
        this.prefillStepName = currentStepData?.fields?.stepContent;
        this.editStep = !!currentStepData;
        if (
          !this.editStep &&
          values(this.checkListStepFromService?.checkListFrom?.value).every(
            isEmpty
          )
        ) {
          this.stepFormGroup = this.checkListStepFromService.buildForm();
        } else {
          this.stepFormGroup = this.checkListStepFromService?.checkListFrom;
        }
        this.stepFormGroup?.valueChanges
          .pipe(takeUntil(this.destroy$), distinctUntilChanged(isEqual))
          .subscribe((value) => {
            this.stepManagementService.setIsEditingForm(
              !values(value).every(isEmpty)
            );
          });
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
            if (hasTaskEditor && this.canEdit) {
              this.isDisableForm = false;
              this.stepFormGroup?.enable();
            } else {
              this.isDisableForm = true;
              this.stepFormGroup?.disable();
            }
          }
        }
      });
  }

  handleOk() {
    const targetedNode = this.stepManagementService.getTargetedNode();
    this.stepFormGroup.markAllAsTouched();
    this.isSubmit = false;
    if (this.stepFormGroup.invalid) return;
    if (this.editStep) {
      this.templateTreeService.updateNode(this.getPayloadUpdate());
    } else if (!!targetedNode) {
      const tree = TaskTemplateHelper.addNodeBelowTargetedNode(
        this.generateDataForm(),
        targetedNode,
        this.templateTreeService.getCurrentTemplateTree()
      );
      this.templateTreeService.setCurrentTemplateTree(tree);
      this.stepManagementService.setTargetedNode(null);
    } else {
      this.templateTreeService.addNode(
        ETypeElement.STEP,
        this.generateDataForm()
      );
    }
    this.handleCancel();
  }

  handleChangeValue(value) {
    if (!this.editStep) {
      this.stepManagementService.setIsEditingForm(!!value);
    } else {
      if (this.isFocusedTextEditor)
        this.stepManagementService.setIsEditingForm(!!value);
    }
    this.stepContent = value;
  }

  handleBack() {
    this.isSubmit = true;
    this.stepManagementService.setSelectStepType(null);
    if (!this.editStep) {
      this.stepManagementService.handleSelect(true);
    }
    this.stepFormGroup.reset();
  }

  handleDelete() {
    this.templateTreeService.deleteStep(this.getPayloadUpdate());
    this.stepManagementService.setSelectStepType(null);
    this.handleCancel();
    this.stepFormGroup.reset();
  }

  handleCancel(fromClickOutsideDrawer: boolean = false) {
    if (fromClickOutsideDrawer) {
      this.isJiggling =
        this.stepManagementService.shouldWarningUnsavedChanges();
      if (this.isJiggling) return;
    }
    this.showDrawer = false;
    this.isSubmit = true;
    this.stepManagementService.setIsEditingForm(false);
    this.stepManagementService.setSelectStepType(null);
    this.checkListStepFromService.setCurrentStepData(null);
    this.stepFormGroup.markAsUntouched();
    this.stepFormGroup.markAsPristine();
    this.stepFormGroup.reset();
  }

  getPayloadUpdate() {
    return {
      ...this.generateDataForm(),
      key: this.currentStepData.key
    };
  }

  generateDataForm() {
    const { stepName } = this.stepFormGroup.value;
    return {
      key: uuid4() as string,
      title: stepName ?? '',
      fields: {
        stepContent: this.stepContent ?? ''
      },
      type: ETypeElement.STEP,
      stepType: EStepType.CHECK_LIST,
      status: EStatusStep.PENDING
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
