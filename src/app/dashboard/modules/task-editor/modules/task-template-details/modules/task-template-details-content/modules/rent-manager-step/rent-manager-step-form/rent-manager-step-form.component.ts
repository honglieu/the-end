import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  COMPONENT_TYPE_DATA_RENT_MANAGER,
  PropertyTreeButtonGroup
} from '@/app/dashboard/modules/task-editor/constants/property-tree.constant';
import {
  EComponentTypes,
  EStepType,
  ETypeElement,
  PopUpEnum
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import {
  ERentManagerAction,
  ERentManagerButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { IRentManagerStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { RentManagerStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/rent-manager-step-form.service';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';

export interface IRentManagerTreeStepForm {
  stepName?: string;
  actionType: ERentManagerAction;
  componentType?: ERentManagerButtonComponent;
  isRequired: boolean;
}

@Component({
  selector: 'rent-manager-step-form',
  templateUrl: './rent-manager-step-form.component.html',
  styleUrls: ['./rent-manager-step-form.component.scss']
})
export class RentManagerStepFormComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() editStep: boolean = false;
  @Input() disabled: boolean = false;
  @Input() stepType: any;
  @Input() isShowUpgradeMessage: boolean = false;
  private destroy$ = new Subject<void>();

  actions = [
    {
      value: ERentManagerAction.RM_NEW_COMPONENT,
      label: 'Create new or link existing component'
    },
    {
      value: ERentManagerAction.RM_UPDATE_COMPONENT,
      label: 'Update component'
    }
  ];

  readonly canOnlyAddOnce: ERentManagerButtonComponent[] = [
    ERentManagerButtonComponent.LEASE_RENEWAL
  ];

  items = null;
  readonly EActionShowMessageTooltip = EActionShowMessageTooltip;

  constructor(
    private rmFormService: RentManagerStepFormService,
    private templateTreeService: TemplateTreeService,
    private stepManagementService: StepManagementService,
    private taskEditorService: TaskEditorService
  ) {}

  ngOnInit(): void {
    this.rmFormService.buildForm();
    this.handleChangeActionType();
    this.subscribeComponentTypeValueChanges();

    this.rmStepForm.get('actionType').valueChanges.subscribe((value) => {
      this.rmFormService.resetField('componentType');
      this.handleChangeActionType();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    changes['editStep'] && this.handleChangeActionType();
    this.stepManagementService.selectedStepTypeValue$.subscribe((res) => {
      if (res === EStepType.RENT_MANAGER) {
        this.handleChangeActionType();
      }
    });
  }

  subscribeComponentTypeValueChanges() {
    this.rmStepForm
      .get('componentType')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((type: EComponentTypes) => {
        this.stepManagementService.setSelectedHelpDocumentStepType(type);
      });
  }

  handleChangeActionType(): void {
    const data = this.rmStepForm?.value;
    if (!data) return;

    const checkIfInList = (component: ERentManagerButtonComponent) => {
      const existingNode = this.templateTreeService.queryNode<IRentManagerStep>(
        {
          type: ETypeElement.STEP,
          stepType: EStepType.RENT_MANAGER,
          action: ERentManagerAction.RM_NEW_COMPONENT,
          componentType: component,
          key: this.editStep
            ? {
                $ne: this.initialValue.key
              }
            : undefined
        }
      );

      return !!existingNode;
    };

    if (data.actionType === ERentManagerAction.RM_NEW_COMPONENT) {
      this.items = COMPONENT_TYPE_DATA_RENT_MANAGER.map((item) => ({
        id: item.id,
        label: item.label
      }));
    } else {
      this.items = COMPONENT_TYPE_DATA_RENT_MANAGER.map((item) => ({
        id: item.id,
        label: item.label,
        helpText: null,
        disabled: !checkIfInList(item.id),
        type: checkIfInList(item.id)
          ? PropertyTreeButtonGroup.AVAILABLE_IN_TASK
          : PropertyTreeButtonGroup.NOT_IN_THIS_TASK
      })).sort((a, b) => {
        if (a.disabled && !b.disabled) return 1;
        if (!a.disabled && b.disabled) return -1;
        return 0;
      });
    }

    if (this.initialValue && this.initialValue.action === data.actionType) {
      this.rmStepForm.patchValue({
        componentType: this.initialValue.componentType
      });
    }
  }

  get rmStepForm() {
    return this.rmFormService.rmStepForm;
  }

  get initialValue() {
    return this.rmFormService.initialValue.value;
  }

  openHelpDocument() {
    this.taskEditorService.setPopupTaskEditorState(PopUpEnum.PopupHelpDocument);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
