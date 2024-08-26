import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import {
  ESelectStepType,
  EStatusStep,
  EStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { CalendarStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/calendar-step-form.service';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { ICalendarEventStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { PermissionService } from '@services/permission.service';
import { UserService } from '@services/user.service';
import { SharedService } from '@services/shared.service';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { CompanyService } from '@services/company.service';
import uuid4 from 'uuid4';
import { TaskTemplateHelper } from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';
@Component({
  selector: 'calendar-event-step',
  templateUrl: './calendar-event-step.component.html',
  styleUrls: ['./calendar-event-step.component.scss']
})
export class CalendarEventStepComponent implements OnInit, OnDestroy {
  showDrawer = false;
  public editStep = false;
  private destroy$ = new Subject<void>();
  public currentStepData: ICalendarEventStep;
  public invalidForm: boolean = false;
  public isDisableForm: boolean = false;
  public canEdit: boolean = false;
  public userType: string = '';
  public isConsoleUser: boolean = false;
  public isJiggling: boolean = false;

  constructor(
    private stepManagementService: StepManagementService,
    private templateTreeService: TemplateTreeService,
    private calendarStepFormService: CalendarStepFormService,
    private permissionService: PermissionService,
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
    combineLatest([
      this.stepManagementService.selectedStepTypeValue$,
      this.calendarStepFormService.currentStepData$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([type, res]) => {
        this.showDrawer = type === ESelectStepType.CALENDAR_EVENT;
        if (!this.showDrawer) this.isJiggling = false;
        if (res) {
          this.currentStepData = res;
          this.editStep = true;
        } else {
          this.calendarStepFormService.buildForm();
          this.calendarEventForm.get('isRequired').setValue(true);
          this.editStep = false;
        }
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
              this.calendarEventForm?.enable();
            } else {
              this.isDisableForm = true;
              this.calendarEventForm?.disable();
            }
          }
        }
      });
  }

  handleOk() {
    const targetedNode = this.stepManagementService.getTargetedNode();
    this.calendarEventForm.markAllAsTouched();
    if (this.calendarEventForm.invalid) {
      this.invalidForm = true;
      return;
    }

    if (this.editStep) {
      this.templateTreeService.updateNode(this.getPayloadUpdate());
    } else if (!!targetedNode) {
      const tree = TaskTemplateHelper.addNodeBelowTargetedNode(
        this.generateDataForm(this.calendarEventForm.value),
        targetedNode,
        this.templateTreeService.getCurrentTemplateTree()
      );
      this.templateTreeService.setCurrentTemplateTree(tree);
      this.stepManagementService.setTargetedNode(null);
    } else {
      this.templateTreeService.addNode(
        ETypeElement.STEP,
        this.generateDataForm(this.calendarEventForm.value)
      );
    }
    this.handleCancel();
  }

  getPayloadUpdate() {
    return {
      ...this.generateDataForm(this.calendarEventForm.value),
      key: this.currentStepData.key
    };
  }

  generateDataForm(data) {
    return {
      key: uuid4() as string,
      title: data.stepName,
      type: ETypeElement.STEP,
      stepType: EStepType.CALENDAR_EVENT,
      status: EStatusStep.PENDING,
      isRequired: data.isRequired,
      fields: {
        stepName: this.calendarEventForm.get('stepName').value,
        eventType: this.calendarEventForm.get('eventType').value,
        isRequired: this.calendarEventForm.get('isRequired').value
      }
    };
  }

  handleBack() {
    this.stepManagementService.setSelectStepType(null);
    this.stepManagementService.handleSelect(true);
  }

  handleDelete() {
    this.templateTreeService.deleteStep(this.getPayloadUpdate());
    this.stepManagementService.setSelectStepType(null);
    this.handleCancel();
  }

  handleCancel(fromClickOutsideDrawer: boolean = false) {
    if (fromClickOutsideDrawer) {
      this.isJiggling =
        this.stepManagementService.shouldWarningUnsavedChanges();
      if (this.isJiggling) return;
    }
    this.invalidForm = false;
    this.showDrawer = false;
    this.stepManagementService.setIsEditingForm(false);
    this.stepManagementService.setSelectStepType(null);
    this.calendarStepFormService.setCurrentStepData(null);
    this.calendarEventForm.markAsUntouched();
    this.calendarEventForm.markAsPristine();
  }

  get calendarEventForm() {
    return this.calendarStepFormService.calendarEventForm;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
