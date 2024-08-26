import { takeUntil } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Pipe,
  PipeTransform,
  Self,
  ViewChild
} from '@angular/core';
import { DecisionTreeDataService } from './services/decision-tree-data.service';
import { DecisionTreeDragDropService } from './services/decision-tree-drag-drop.service';
import { NzTreeComponent } from 'ng-zorro-antd/tree';
import { ETypeElement } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { TreeNodeOptions } from './types/tree-node.interface';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';

@Pipe({
  name: 'treeViewData',
  pure: true
})
export class TreeViewDataPipe implements PipeTransform {
  transform(value: Array<TreeNodeOptions>) {
    return this.defineNodeLevel(value);
  }

  private defineNodeLevel(nodes: Array<TreeNodeOptions>) {
    const define = (array: Array<TreeNodeOptions>) => {
      //implement node level
      return nodes;
    };

    define(nodes);
    return nodes;
  }
}

@Component({
  selector: 'trudi-decision-tree',
  templateUrl: './trudi-decision-tree.component.html',
  styleUrls: ['./trudi-decision-tree.component.scss'],
  providers: [DecisionTreeDataService, DecisionTreeDragDropService]
})
export class TrudiDecisionTreeComponent implements OnInit, OnDestroy {
  @ViewChild('nzTree') nzTree: NzTreeComponent;
  @Input() currentCrmLogo: string = '';
  @Input() disabled: boolean = false;
  @Input() canEdit: boolean = false;
  private _dataSource: Array<TreeNodeOptions> = [];
  public ETypeElement = ETypeElement;
  public isEditing: boolean;
  public saveChangeDataTree = false;
  readonly EActionShowMessageTooltip = EActionShowMessageTooltip;

  get dataSource() {
    return this._dataSource;
  }

  @Input() set dataSource(value: Array<TreeNodeOptions>) {
    this._dataSource = value;
    this.treeViewService.dataSource = value;
  }

  private unsubscribe = new Subject<void>();
  private _defaultNodeId: number | null = null;
  @Input() set defaultNodeId(value: number | null) {
    this._defaultNodeId = value;
  }

  get defaultNodeId() {
    return this._defaultNodeId;
  }

  @Output() onAddNode = new EventEmitter();
  @Output() onAddChildNode = new EventEmitter();
  @Output() onRemoveNode = new EventEmitter();
  @Output() onSetDefaultNode = new EventEmitter();

  constructor(
    @Self() private treeViewService: DecisionTreeDataService,
    @Self() private treeViewDragDropService: DecisionTreeDragDropService,
    private templateTreeService: TemplateTreeService,
    private taskTemplateService: TaskTemplateService
  ) {}

  ngOnInit(): void {
    if (!this.defaultNodeId && this._dataSource?.length) {
      this.treeViewService.defaultNode = this._dataSource[0];
    }

    this.templateTreeService.saveChangeDataTree$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.saveChangeDataTree = res;
      });

    combineLatest([
      this.templateTreeService.hasCurrentTemplateTreeValueChanged$,
      this.taskTemplateService.taskTemplate$
    ]).subscribe(([hasChanged, template]) => {
      if (hasChanged && template) {
        this.templateTreeService.performValidateTemplate(
          template?.crmSystemKey
        );
      }
    });
  }

  //Todo remove
  addChildNode(parentNode: TreeNodeOptions, childNode: TreeNodeOptions) {
    this.treeViewService.addNode(parentNode, childNode);
    this.onAddNode.emit({
      parentNode,
      childNode
    });
  }

  removeNode(node: TreeNodeOptions) {
    this.treeViewService.removeNode(node);
    this.onSetDefaultNode.emit(node);
  }

  setDefaultNode(node: TreeNodeOptions) {
    this.treeViewService.setDefaultNode(node);
    this.onSetDefaultNode.emit(node);
  }

  drop(event: CdkDragDrop<Array<any>>) {
    this.treeViewDragDropService.handleDrop(this._dataSource, event);
    this.templateTreeService.setCurrentTemplateTree(
      this.treeViewService.dataSource
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
