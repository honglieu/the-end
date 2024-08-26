import { CdkDragDrop, CdkDragMove } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { DecisionTreeDataService } from './decision-tree-data.service';
import { DropPosition } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/drop-position.enum';
import { TreeNodeOptions } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';

@Injectable()
export class DecisionTreeDragDropService {
  private dropPosition: DropPosition = DropPosition.INSIDE;
  private dragNode: {
    from: TreeNodeOptions;
    to: TreeNodeOptions;
  };

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private treeDataService: DecisionTreeDataService
  ) {}

  public handleDragMoved(event: CdkDragMove<TreeNodeOptions>) {
    const debounceTime = 25;
    this._debounce(() => {
      const dragPreviewElement = document.querySelector('.cdk-drag-preview');
      const dragPreviewElementRect = dragPreviewElement.getBoundingClientRect();

      const tempElement = this.document.elementFromPoint(
        dragPreviewElementRect.x,
        dragPreviewElementRect.y
      );

      if (!tempElement) {
        this._clearDragInfo();
        this.dragNode = null;
        return;
      }
      const targetElement = tempElement.classList.contains('tree-node')
        ? tempElement
        : tempElement.closest('.tree-node') ||
          tempElement.querySelector('.tree-node');

      if (!targetElement) {
        this._clearDragInfo();
        this.dragNode = null;
        return;
      }

      const targetRect = targetElement.getBoundingClientRect();
      const oneThird = targetRect.height / 3;
      if (dragPreviewElementRect.y < targetRect.top + oneThird) {
        // before
        this.dropPosition = DropPosition.BEFORE;
      } else if (dragPreviewElementRect.y > targetRect.top + 2 * oneThird) {
        // after
        this.dropPosition = DropPosition.AFTER;
      } else {
        // inside
        this.dropPosition = DropPosition.INSIDE;
      }

      this._clearDragInfo();
      const fromNodeKey = dragPreviewElement.getAttribute('data-node-key');
      const toNodeKey = targetElement.getAttribute('data-node-key');
      const [fromNode, toNode] = this.treeDataService.getNodesByKeys(
        fromNodeKey,
        toNodeKey
      );
      this.dragNode = {
        from: fromNode,
        to: toNode
      };
      if (
        this.treeDataService.validateDropNode(
          fromNode,
          toNode,
          this.dropPosition
        )
      ) {
        targetElement.classList.add(`indicator`);
        targetElement.classList.add(`drop-${this.dropPosition}`);
      }
    }, debounceTime)();
  }

  public handleDrop(
    dataSource: Array<TreeNodeOptions>,
    _event: CdkDragDrop<typeof dataSource>
  ) {
    this._clearDragInfo();
    if (this.dragNode) {
      this.treeDataService.moveNode(
        this.dragNode.from,
        this.dragNode.to,
        this.dropPosition
      );
    }
  }

  private _isCollided<T extends Element>(element1: T, element2: T) {
    const box1 = element1.getBoundingClientRect();
    const box2 = element2.getBoundingClientRect();

    return !(
      box1.right < box2.left ||
      box1.left > box2.right ||
      box1.bottom < box2.top ||
      box1.top > box2.bottom
    );
  }

  private _clearDragInfo() {
    for (const className of [
      'drop-before',
      'drop-inside',
      'drop-after',
      'indicator'
    ]) {
      this.document
        .querySelectorAll(`.${className}`)
        .forEach((element) => element.classList.remove(className));
    }
  }

  private _debounce(callBack: () => void, delay: number) {
    let timerId: NodeJS.Timer;

    return (...args: any) => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        callBack.apply(this, args);
      }, delay);
    };
  }
}
