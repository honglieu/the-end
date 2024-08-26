import { TrudiSafeAny } from '@core';

import { TrudiTreeNode } from './trudi-tree-base-node';
import { TrudiTreeBaseService } from './trudi-tree-base.service';

export class TrudiTreeBase {
  constructor(public trudiTreeService: TrudiTreeBaseService) {}

  /**
   * Coerces a value({@link any[]}) to a TreeNodes({@link TrudiTreeNode[]})
   */
  coerceTreeNodes(value: TrudiSafeAny[]): TrudiTreeNode[] {
    let nodes: TrudiTreeNode[] = [];
    if (!this.trudiTreeService.isArrayOfTrudiTreeNode(value)) {
      // has not been new TrudiTreeNode
      nodes = value.map(
        (item) => new TrudiTreeNode(item, null, this.trudiTreeService)
      );
    } else {
      nodes = value.map((item: TrudiTreeNode) => {
        item.service = this.trudiTreeService;
        return item;
      });
    }
    return nodes;
  }

  /**
   * Get all nodes({@link TrudiTreeNode})
   */
  getTreeNodes(): TrudiTreeNode[] {
    return this.trudiTreeService.rootNodes;
  }

  /**
   * Get {@link TrudiTreeNode} with key
   */
  getTreeNodeByKey(key: string): TrudiTreeNode | null {
    // flat tree nodes
    const nodes: TrudiTreeNode[] = [];
    const getNode = (node: TrudiTreeNode): void => {
      nodes.push(node);
      node.getChildren().forEach((n) => {
        getNode(n);
      });
    };
    this.getTreeNodes().forEach((n) => {
      getNode(n);
    });
    return nodes.find((n) => n.key === key) || null;
  }

  /**
   * Get checked nodes(merged)
   */
  getCheckedNodeList(): TrudiTreeNode[] {
    return this.trudiTreeService.getCheckedNodeList();
  }

  /**
   * Get selected nodes
   */
  getSelectedNodeList(): TrudiTreeNode[] {
    return this.trudiTreeService.getSelectedNodeList();
  }

  /**
   * Get half checked nodes
   */
  getHalfCheckedNodeList(): TrudiTreeNode[] {
    return this.trudiTreeService.getHalfCheckedNodeList();
  }

  /**
   * Get expanded nodes
   */
  getExpandedNodeList(): TrudiTreeNode[] {
    return this.trudiTreeService.getExpandedNodeList();
  }

  /**
   * Get matched nodes(if trudiSearchValue is not null)
   */
  getMatchedNodeList(): TrudiTreeNode[] {
    return this.trudiTreeService.getMatchedNodeList();
  }
}
