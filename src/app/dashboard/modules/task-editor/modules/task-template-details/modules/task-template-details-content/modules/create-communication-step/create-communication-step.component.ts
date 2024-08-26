import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  ESelectStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { CommunicationStepFormComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/communication-step-form/communication-step-form.component';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { PermissionService } from '@services/permission.service';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { Validators } from '@angular/forms';
import { UserService } from '@services/user.service';
import { SharedService } from '@services/shared.service';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { CompanyService } from '@services/company.service';
import { EMAIL_PATTERN } from '@services/constants';
import { TaskTemplateHelper } from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';
import { hasInvalidEmail } from '@shared/components/select-receiver/utils/helper.function';

@Component({
  selector: 'create-communication-step',
  templateUrl: './create-communication-step.component.html',
  styleUrls: ['./create-communication-step.component.scss']
})
export class CreateCommunicationStepComponent implements OnInit, OnDestroy {
  @ViewChild('communicationFormView')
  communicationFormView: CommunicationStepFormComponent;
  public showCommunicationStep: boolean = false;
  private destroy$ = new Subject<void>();
  public isDisableForm = false;
  public enableBtnAction = false;
  public disableMessage = false;
  public AISettingValue = false;
  public canEdit: boolean = false;
  public isConsoleUser: boolean = false;
  public userType: string = '';
  public isDisabledNext: boolean = false;
  public isJiggling: boolean = false;

  constructor(
    private templateTreeService: TemplateTreeService,
    private stepManagementService: StepManagementService,
    private communicationFormService: CommunicationStepFormService,
    public permissionService: PermissionService,
    private taskEditorService: TaskEditorService,
    private userService: UserService,
    private sharedService: SharedService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    this.userService.userInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.userType = user.type;
      });
    this.stepManagementService.selectedStepTypeValue$
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        if (type !== ESelectStepType.COMMUNICATION_STEP) {
          this.communicationFormService.isSubmittedCommunicationForm = false; // reset isSubmittedCommunicationForm
        }
        this.showCommunicationStep =
          type === ESelectStepType.COMMUNICATION_STEP;

        if (!this.showCommunicationStep) {
          this.isJiggling = false;
        }
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs) {
          if (this.isConsoleUser && this.userType === UserTypeEnum.ADMIN) {
            this.disableMessage = false;
            this.canEdit = true;
            this.isDisableForm = false;
          } else {
            this.isDisableForm =
              this.taskEditorService.checkToDisableTaskEditor(rs.addOns || []);
            this.canEdit = this.permissionService.hasFunction(
              'TASK_EDITOR.TASKS.EDIT'
            );
            this.disableMessage = !this.canEdit;
          }
          this.enableBtnAction =
            this.canEdit && !(this.isDisableForm && this.AISettingValue);
        }
      });

    this.communicationFormService.isDisabledAddStep
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: boolean) => {
        this.isDisabledNext = res;
      });
  }

  get isSubmittedCommunicationForm() {
    return this.communicationFormService.isSubmittedCommunicationForm;
  }

  get isSubmittedAiGenerateMsgCopyForm() {
    return this.communicationFormService.isSubmittedAiGenerateMsgCopyForm;
  }

  getAiSettingValue(value: boolean) {
    this.AISettingValue = value;
    this.enableBtnAction =
      this.canEdit && !(this.isDisableForm && this.AISettingValue);
  }

  get messageCopyControl() {
    return this.communicationForm.get('messageCopy');
  }

  addValidateMsgCopyControl() {
    this.messageCopyControl.setValidators([
      Validators.required,
      this.communicationFormService.customValidateMsgContent()
    ]);
    this.messageCopyControl.updateValueAndValidity();
  }

  async onDropFile(files) {
    if (this.isDisabledNext) return;
    this.scrollBottom();
  }

  setIsDisabledNext(value: boolean) {
    this.isDisabledNext = value;
  }

  scrollBottom() {
    const body = document.querySelectorAll('.ant-drawer-body');
    if (body?.length) {
      const currentTemplate = body[body.length - 1];
      setTimeout(() => {
        currentTemplate.scroll({
          top: currentTemplate.scrollHeight,
          behavior: 'smooth'
        });
      }, 0);
    }
  }

  async handleOk() {
    const targetedNode = this.stepManagementService.getTargetedNode();
    this.addValidateMsgCopyControl();
    this.communicationFormService.isSubmittedCommunicationForm = true;
    this.communicationForm.markAllAsTouched();

    const isAllExternalEmailValid = !hasInvalidEmail([
      ...this.sendToControl.value,
      ...this.sendCcControl.value,
      ...this.sendBccControl.value
    ]);

    if (this.communicationForm.invalid || !isAllExternalEmailValid) {
      return;
    }
    this.stepManagementService.setSelectStepType(null);

    if (this.editStep) {
      this.templateTreeService.updateNode(
        this.communicationFormService.getEditingNode()
      );
    } else if (!!targetedNode) {
      const tree = TaskTemplateHelper.addNodeBelowTargetedNode(
        this.communicationFormService.getValues(),
        targetedNode,
        this.templateTreeService.getCurrentTemplateTree()
      );
      this.templateTreeService.setCurrentTemplateTree(tree);
      this.stepManagementService.setTargetedNode(null);
    } else {
      this.templateTreeService.addNode(
        ETypeElement.STEP,
        this.communicationFormService.getValues()
      );
    }
    this.communicationFormView.resetFormValues();
  }

  isEmailsValid(emailArr: string[]) {
    const emailPattern = EMAIL_PATTERN;
    const isEmailsValid = emailArr.every((item) => emailPattern.test(item));
    if (!isEmailsValid) {
      this.sendToControl.setErrors({
        emailInvalid: true
      });
      return false;
    }
    return true;
  }

  handleBack() {
    this.communicationFormView.resetFormValues();
    this.stepManagementService.setSelectStepType(null);
    !this.isDisableForm && this.stepManagementService.handleSelect(true);
  }

  handleCancel(fromClickOutsideDrawer: boolean = false) {
    if (fromClickOutsideDrawer) {
      this.isJiggling =
        this.stepManagementService.shouldWarningUnsavedChanges();
      if (this.isJiggling) return;
    }
    this.stepManagementService.setIsEditingForm(false);
    this.communicationFormView.resetFormValues();
    this.stepManagementService.setSelectStepType(null);
    this.resetFileState();
  }

  handleDelete() {
    this.templateTreeService.deleteStep(
      this.communicationFormService.getEditingNode()
    );
    this.communicationFormView.resetFormValues();
    this.stepManagementService.setSelectStepType(null);
    this.resetFileState();
  }

  get editStep() {
    return Boolean(this.communicationFormService.getSelectedStep());
  }

  get communicationForm() {
    return this.communicationFormService.getCommunicationForm;
  }

  get sendToControl() {
    return this.communicationForm?.get('sendTo');
  }

  get sendCcControl() {
    return this.communicationForm?.get('sendCc');
  }

  get sendBccControl() {
    return this.communicationForm?.get('sendBcc');
  }

  get typeSendControl() {
    return this.communicationForm?.get('typeSend');
  }

  get stepNameControl() {
    return this.communicationForm.get('stepName');
  }

  resetFileState() {
    this.communicationFormService.isDisabledAddStep.next(false);
    this.communicationFormService.fileAttach.next([]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
