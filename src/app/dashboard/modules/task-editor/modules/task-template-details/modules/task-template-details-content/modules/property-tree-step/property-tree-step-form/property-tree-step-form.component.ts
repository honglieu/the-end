import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import {
  COMPONENT_TYPE_DATA,
  PropertyTreeButtonGroup
} from '@/app/dashboard/modules/task-editor/constants/property-tree.constant';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { PropertyTreeStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/property-tree-step-form.service';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { IPropertyTreeStep } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import {
  EComponentTypes,
  EStepType,
  ETypeElement,
  PopUpEnum
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { distinctUntilChanged, filter, skip, Subject, takeUntil } from 'rxjs';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';
import { isEmpty, isEqual, values } from 'lodash-es';

export interface IPropertyTreeStepForm {
  stepName?: string;
  actionType: EButtonAction;
  componentType?: EPropertyTreeButtonComponent;
  isRequired: boolean;
}

@Component({
  selector: 'property-tree-step-form',
  templateUrl: './property-tree-step-form.component.html',
  styleUrls: ['./property-tree-step-form.component.scss']
})
export class PropertyTreeStepFormComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() editStep: boolean = false;
  @Input() disabled: boolean = false;
  @Input() isShowUpgradeMessage: boolean = false;
  private defaultFormValue;
  private destroy$ = new Subject<void>();
  readonly EActionShowMessageTooltip = EActionShowMessageTooltip;

  actions = [
    {
      value: EButtonAction.PT_NEW_COMPONENT,
      label: 'Create new or link existing component'
    },
    {
      value: EButtonAction.PT_UPDATE_COMPONENT,
      label: 'Update component'
    }
  ];

  items = [];

  constructor(
    private ptFormService: PropertyTreeStepFormService,
    private templateTreeService: TemplateTreeService,
    private stepManagementService: StepManagementService,
    private taskEditorService: TaskEditorService
  ) {}

  ngOnInit(): void {
    this.handleChangeActionType();
    this.defaultFormValue = this.ptStepForm?.value;
    this.subscribeComponentTypeValueChanges();
    this.ptStepForm.get('actionType').valueChanges.subscribe((value) => {
      this.ptFormService.resetField('componentType');
      this.handleChangeActionType();
    });

    this.ptStepForm?.valueChanges
      ?.pipe(takeUntil(this.destroy$), distinctUntilChanged(isEqual))
      .subscribe((value) => {
        this.stepManagementService.setIsEditingForm(
          !(
            values(value).every(isEmpty) ||
            isEqual(value, this.ptFormService.defaultData)
          )
        );
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    changes['editStep'] && this.handleChangeActionType();
    this.stepManagementService.selectedStepTypeValue$.subscribe((res) => {
      if (res === EStepType.PROPERTY_TREE) {
        this.defaultFormValue = this.ptStepForm?.value;
        this.handleChangeActionType();
      } else {
        this.defaultFormValue = this.ptFormService.defaultData;
      }
    });
  }

  subscribeComponentTypeValueChanges() {
    this.ptStepForm
      .get('componentType')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((type: EComponentTypes) => {
        this.stepManagementService.setSelectedHelpDocumentStepType(type);
      });
  }

  handleChangeActionType(): void {
    const data = this.ptStepForm?.value;
    if (!data) return;

    const checkIfInList = (component: EPropertyTreeButtonComponent) => {
      const existingNode =
        this.templateTreeService.queryNode<IPropertyTreeStep>({
          type: ETypeElement.STEP,
          stepType: EStepType.PROPERTY_TREE,
          action: EButtonAction.PT_NEW_COMPONENT,
          componentType: component,
          key: this.editStep
            ? {
                $ne: this.initialValue.key
              }
            : undefined
        });
      return !!existingNode;
    };

    if (data.actionType === EButtonAction.PT_NEW_COMPONENT) {
      this.items = COMPONENT_TYPE_DATA.map((item) => ({
        id: item.id,
        label: item.label
      }));
    } else {
      this.items = COMPONENT_TYPE_DATA.map((item) => ({
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
      this.ptStepForm.patchValue({
        componentType: this.initialValue.componentType
      });
    }
  }

  get ptStepForm() {
    return this.ptFormService.ptStepForm;
  }

  get initialValue() {
    return this.ptFormService.initialValue.value;
  }

  openHelpDocument() {
    this.taskEditorService.setPopupTaskEditorState(PopUpEnum.PopupHelpDocument);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
