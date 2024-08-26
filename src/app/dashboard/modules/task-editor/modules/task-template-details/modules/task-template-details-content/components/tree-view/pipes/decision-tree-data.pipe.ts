import { Pipe, PipeTransform } from '@angular/core';
import { TreeNodeOptions } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import { DecisionTreeDataService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/services/decision-tree-data.service';

@Pipe({
  name: 'treeViewData',
  pure: true
})
export class TreeViewDataPipe implements PipeTransform {
  constructor(private treeDataService: DecisionTreeDataService) {}

  transform(value: Array<TreeNodeOptions>) {
    return this.defineNodeLevel(value);
  }

  private defineNodeLevel(nodes: Array<TreeNodeOptions>) {
    return this.treeDataService.defineTreeNodeLevel(nodes);
  }
}
