import { CdkDragMove } from '@angular/cdk/drag-drop';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  SkipSelf,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import { TrudiDecisionTreeComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/trudi-decision-tree.component';
import { DecisionTreeDataService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/services/decision-tree-data.service';
import { DecisionTreeDragDropService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/services/decision-tree-drag-drop.service';
import {
  EStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TrudiTextFieldComponent } from '@trudi-ui';
import { NgModel } from '@angular/forms';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { PropertyTreeStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/property-tree-step-form.service';
import { CalendarStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/calendar-step-form.service';
import {
  ICalendarEventStep,
  ICheckListStep
} from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { NewTaskStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/new-task-step-form.service';
import {
  ETreeNodeState,
  TreeNodeOptions
} from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import { map, takeUntil } from 'rxjs/operators';
import { Subject, filter } from 'rxjs';
import { RentManagerStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/rent-manager-step-form.service';
import { CheckListStepFromService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/check-list-step-from.service';
import uuid4 from 'uuid4';
import { TaskTemplateHelper } from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';

@Component({
  selector: 'trudi-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TreeNodeComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @Input() node!: TreeNodeOptions;
  @Input() disabled: boolean = false;
  @Input() level = 0;
  @Input() indents = [];
  @Input() hasSibling: boolean;
  @Input() parentNode!: TreeNodeOptions;
  @Input() isStart: boolean;
  @Input() isEnd: boolean;
  @Input() onlyChild: boolean;
  @Input() currentCrmLogo: string = '';
  @Input() defaultDecisionKey: string;
  @ViewChildren('textField', {})
  textFields: QueryList<TrudiTextFieldComponent> = new QueryList();
  @Output() onAddChildNode = new EventEmitter();
  @Output() onRemoveNode = new EventEmitter();
  @Output() onSetDefaultNode = new EventEmitter();
  @Output() changeDefaultDecision = new EventEmitter();
  public ETypeElement = ETypeElement;
  public ETreeNodeState = ETreeNodeState;
  public stepType = EStepType;
  public currentIndents: boolean[] = [];
  public isCancelButtonClicked = false;
  public decisionIndex: number;
  public isActionStep: boolean = false;
  private oldTitle: string;

  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    @SkipSelf() public treeViewService: DecisionTreeDataService,
    @SkipSelf() private treeViewRef: TrudiDecisionTreeComponent,
    @SkipSelf() private treeViewDragDropService: DecisionTreeDragDropService,
    private templateTreeService: TemplateTreeService,
    private stepManagementService: StepManagementService,
    private communicationStepFormService: CommunicationStepFormService,
    private propertyTreeStepFormService: PropertyTreeStepFormService,
    private calendarStepFormService: CalendarStepFormService,
    private rentManagerStepFormService: RentManagerStepFormService,
    private newTaskStepFormService: NewTaskStepFormService,
    private checkListStepFromService: CheckListStepFromService
  ) {}

  ngAfterViewInit(): void {
    if (this.node.edit) {
      this.textFields.last.inputElem.nativeElement.focus();
      this.templateTreeService.setEdit(true);
    }
  }

  ngOnChanges(simpleChanges: SimpleChanges) {
    if (simpleChanges['indents']) {
      if (this.level != 0) {
        this.hasSibling
          ? (this.currentIndents = [...this.indents, true])
          : (this.currentIndents = [...this.indents, false]);
      }
    }
  }
  ngOnInit(): void {
    const crmAction = [EStepType.PROPERTY_TREE, EStepType.RENT_MANAGER];
    this.isActionStep = crmAction.includes(this.node?.stepType as any);
  }

  removeNode(node: TreeNodeOptions) {
    if (this.disabled) return;
    if (!this.isChildDecision) {
      this.templateTreeService.deleteStep(node);
    } else {
      this.onRemoveNode.emit(this.node);
    }
  }

  get isChildDecision() {
    return (
      !!this.defaultDecisionKey && this.node.type === ETypeElement.DECISION
    );
  }

  handleRemoveChildDecision(childNode: TreeNodeOptions) {
    this.node.children = this.node.children?.filter(
      (n) => n.key !== childNode.key
    );
  }

  onDragMoved(event: CdkDragMove<TreeNodeOptions>) {
    this.treeViewDragDropService.handleDragMoved(event);
  }

  disableDragMoved(node: TreeNodeOptions) {
    if (this.disabled) return;
    this.templateTreeService.deleteStep(node);
  }

  duplicateNode(node: TreeNodeOptions) {
    const newNode = this.templateTreeService.duplicateNode(node);
    this.scrollToElement(newNode);
  }

  scrollToElement(element: TreeNodeOptions) {
    const containerEl = document.querySelector('.cdk-drop-list') as HTMLElement;
    setTimeout(() => {
      const targetEl = document.querySelector(
        `[data-node-key="${element.key}"]`
      ) as HTMLElement;

      if (containerEl && targetEl) {
        const containerRect = containerEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const isOutOfView =
          targetRect.bottom > containerRect.bottom ||
          targetRect.top < containerRect.top;

        if (isOutOfView) {
          containerEl.scrollTo({
            top: targetRect.top - containerEl.offsetTop + containerEl.scrollTop,
            behavior: 'smooth'
          });
        }
      }
    }, 0);
  }

  updateNode(node: TreeNodeOptions) {
    delete node.state;
    delete node.edit;
    delete node['error'];
    this.templateTreeService.updateNode(node);
    this.templateTreeService.setEdit(false);
  }

  handleEditStep(node: TreeNodeOptions) {
    this.stepManagementService.setTargetedNode(null);
    this.stepManagementService.setIsDrawerJiggled(false);
    switch (node.stepType) {
      case EStepType.PROPERTY_TREE:
        this.propertyTreeStepFormService.buildForm(node);
        this.propertyTreeStepFormService.setInitialValue(node);
        break;
      case EStepType.COMMUNICATE:
        this.communicationStepFormService.setSelectedStep(node);
        break;
      case EStepType.CALENDAR_EVENT:
        this.calendarStepFormService.buildForm(node as ICalendarEventStep);
        this.calendarStepFormService.setCurrentStepData(
          node as ICalendarEventStep
        );
        break;
      case EStepType.RENT_MANAGER:
        this.rentManagerStepFormService.setInitialValue(node);
        break;
      case EStepType.NEW_TASK:
        this.newTaskStepFormService.buildForm(node);
        this.newTaskStepFormService.setInitialValue(node);
        break;
      case EStepType.CHECK_LIST:
        this.checkListStepFromService.buildForm(node as ICheckListStep);
        this.checkListStepFromService.setCurrentStepData(
          node as ICheckListStep
        );
        break;
      default:
        break;
    }

    this.stepManagementService.setSelectStepType(node.stepType);
  }

  cancel(node: TreeNodeOptions) {
    delete node.edit;
    delete node['error'];
    this.templateTreeService.resetNode(node, this.oldTitle);
    this.oldTitle = null;
    this.templateTreeService.setEdit(false);
    this.isCancelButtonClicked = true;
  }

  handleClickOutsideTextField(
    textField: TrudiTextFieldComponent,
    textFieldModel: NgModel,
    node: TreeNodeOptions
  ) {
    if (this.isCancelButtonClicked) return;
    if (!node.title) {
      textFieldModel.control.markAsDirty();
      textFieldModel.control.markAsTouched();
      textField.inputElem.nativeElement.focus();
      node['error'] = true;
    } else {
      this.updateNode(node);
    }
  }
  get errorNode() {
    return this.templateTreeService.currentErrorNode$.pipe(
      map((nodes) => nodes?.filter((node) => node?.key === this.node.key)),
      filter((nodes) => nodes && !!nodes?.length)
    );
  }
  editNode(node: TreeNodeOptions) {
    this.oldTitle = node.title;
    node.edit = true;
  }

  addNodeBelow(nodeType: ETypeElement) {
    //addNodeTo
    if (nodeType === ETypeElement.STEP) {
      this.stepManagementService.setTargetedNode(this.node);
      this.stepManagementService.handleSelect(true);
      return;
    }
    const newNode: TreeNodeOptions = {
      key: uuid4(),
      title: '',
      index: nodeType === ETypeElement?.DECISION ? Date.now() : undefined,
      type: nodeType,
      checked: false,
      children: [],
      componentType: null,
      edit: true
    };
    const tree = TaskTemplateHelper.addNodeBelowTargetedNode(
      newNode,
      this.node,
      this.templateTreeService.getCurrentTemplateTree()
    );
    this.templateTreeService.setCurrentTemplateTree(tree);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
