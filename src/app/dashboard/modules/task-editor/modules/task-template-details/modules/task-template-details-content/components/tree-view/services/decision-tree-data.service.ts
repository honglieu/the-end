import { EventEmitter, Injectable, Output } from '@angular/core';
import { ETypeElement } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { DropPosition } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/drop-position.enum';
import { TreeNodeOptions } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import { TaskTemplateHelper } from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';

@Injectable()
export class DecisionTreeDataService {
  @Output() onAddNode = new EventEmitter();
  @Output() onRemoveNode = new EventEmitter();
  @Output() onSetDefaultNode = new EventEmitter();

  private _dataSource: Array<TreeNodeOptions> = [];

  set dataSource(value: Array<TreeNodeOptions>) {
    this._dataSource = value;
  }

  get dataSource() {
    return this._dataSource;
  }

  private _defaultNodeId: string | undefined = undefined;
  get defaultNodeId() {
    return this._defaultNodeId;
  }

  private _defaultNode: TreeNodeOptions | null = null;
  get defaultNode() {
    return this._defaultNode;
  }

  set defaultNode(value: TreeNodeOptions | null) {
    this._defaultNode = value;
    this._defaultNodeId = value?.key;
  }

  constructor() {}

  public addNode(
    parentNode: TreeNodeOptions,
    childNode?: TreeNodeOptions
  ): boolean {
    return false;
  }

  //#region public method

  /**
   * insert a node to a position of targetNode
   * @param dataSource
   * @param fromNode
   * @param toNode
   * @param position
   */
  public moveNode(
    fromNode: TreeNodeOptions,
    toNode: TreeNodeOptions,
    position: DropPosition
  ): boolean {
    if (this.validateDropNode(fromNode, toNode, position)) {
      console.debug(`move "${fromNode?.title}" ${position} "${toNode?.title}"`);

      if (this._shouldInsertChildNode(fromNode, toNode, position)) {
        return this._insertChildNode(fromNode, toNode);
      }

      switch (position) {
        case DropPosition.BEFORE:
          return this._insertNodeBefore(fromNode, toNode);
        case DropPosition.AFTER:
          return this._insertNodeAfter(fromNode, toNode);
        case DropPosition.INSIDE:
          return this._insertChildNode(fromNode, toNode);
        default:
          return this._swapNode(fromNode, toNode);
      }
    }

    return false;
  }

  public validateDropNode(
    fromNode: TreeNodeOptions,
    toNode: TreeNodeOptions,
    position: DropPosition
  ): boolean {
    if (!fromNode || !toNode) {
      return false;
    }

    if (fromNode.key === toNode.key) {
      return false;
    }

    const fromNodeTypeLevel = this._getNodeTypeLevel(fromNode.type);
    const toNodeTypeLevel = this._getNodeTypeLevel(toNode.type);
    const isBothDecision =
      fromNode.type === ETypeElement.DECISION &&
      toNode.type === ETypeElement.DECISION;
    /**
     * INSIDE RULE
     */
    // Cannot move STEP inside STEP, SECTION inside STEP, DECISION inside STEP/SECTION
    if (
      position == DropPosition.INSIDE &&
      (fromNodeTypeLevel == toNodeTypeLevel ||
        fromNodeTypeLevel < toNodeTypeLevel) &&
      !isBothDecision
    ) {
      return false;
    }

    if (
      position === DropPosition.INSIDE &&
      isBothDecision &&
      (!!toNode.parentKey || !!fromNode.childDecisionKey)
    ) {
      return false;
    }

    if (
      [DropPosition.AFTER, DropPosition.BEFORE].includes(position) &&
      toNode.parentKey === fromNode.key
    ) {
      return false;
    }

    /**
     * AFTER RULE
     */
    // can't move STEP, SECTION after DECISION (only move inside)
    if (
      fromNodeTypeLevel > toNodeTypeLevel &&
      toNode.type == ETypeElement.DECISION
    ) {
      if (position == DropPosition.AFTER) return false;
      if (
        position == DropPosition.BEFORE &&
        this._isMoveBetweenDecision(toNode)
      )
        return false;
    }

    // Cannot move DECISION after/before STEP/SECTION
    if (
      fromNode.type == ETypeElement.DECISION &&
      (toNode.type == ETypeElement.SECTION || toNode.type == ETypeElement.STEP)
    ) {
      return false;
    }

    if (fromNodeTypeLevel < toNodeTypeLevel) {
      // can't move decision before section, step
      if (
        fromNode.type == ETypeElement.DECISION &&
        (position == DropPosition.BEFORE || position == DropPosition.INSIDE)
      ) {
        return false;
      }

      // can't move parent type to child type if they aren't root node;
      if (
        !this._isAllRootNodes(fromNode, toNode) &&
        position === DropPosition.INSIDE
      ) {
        return false;
      }

      // can't move section inside child step, decision to child section/step
      if (fromNode.type == ETypeElement.SECTION && toNode.treeNodeLevel >= 2) {
        const parentOfToNode = this._getNode(
          this._dataSource,
          toNode.parentKey
        );
        if (parentOfToNode?.type == ETypeElement.SECTION) {
          return false;
        }
      }
    }

    return true;
  }

  public removeNode(node: TreeNodeOptions) {
    this._removeNodeByKey(node.key);
  }

  public setDefaultNode(node: TreeNodeOptions): void {
    this.defaultNode = node;
  }

  public getNodesByKeys(...keys: string[]): Array<TreeNodeOptions> {
    const result = [];

    const nodeLookup = this._composeNodeLookup(this._dataSource);

    for (const key of keys) {
      if (nodeLookup[key]) {
        result.push(nodeLookup[key]);
      }
    }

    return result;
  }

  public defineTreeNodeLevel(nodes: Array<TreeNodeOptions>) {
    const define = (nodes: Array<TreeNodeOptions>) => {
      for (const node of nodes) {
        node.typeLevel = this._getNodeTypeLevel(node.type);
        if (Array.isArray(node?.children)) {
          define(node.children);
        }
      }
    };

    define(nodes);

    return nodes;
  }

  //#end region

  //#region private method
  private _isAllRootNodes(...nodes: TreeNodeOptions[]) {
    const keyMap = this._dataSource.reduce<Record<string, boolean>>(
      (map, node: TreeNodeOptions) => {
        map[node.key] = true;
        return map;
      },
      {}
    );

    for (const node of nodes) {
      if (!keyMap[node.key]) {
        return false;
      }
    }
    return true;
  }

  private _getNode(nodes: TreeNodeOptions[], keyToFind: string) {
    if (!keyToFind) return null;

    for (const node of nodes) {
      if (node.key === keyToFind) {
        return node; // Found the node with the specified key
      }

      if (node.children) {
        const foundInChild = this._getNode(node.children, keyToFind);
        if (foundInChild) {
          return foundInChild; // Node found in child's subtree
        }
      }
    }

    return null; // Node with the specified key not found
  }

  private _isMoveBetweenDecision(toNode: TreeNodeOptions) {
    const findIndex = this._dataSource.findIndex(
      (node) => node.key == toNode.key
    );
    const previousNode = this._dataSource[findIndex - 1];
    return previousNode?.type == ETypeElement.DECISION;
  }

  private _getNodeTypeLevel(nodeType: ETypeElement): number {
    const level = {
      [ETypeElement.DECISION]: 1,
      [ETypeElement.SECTION]: 2,
      [ETypeElement.STEP]: 3
    };
    return level[nodeType];
  }

  private _swapNode(firstNode: TreeNodeOptions, secondNode: TreeNodeOptions) {
    const tempFirstNode = firstNode;
    const tempSecondNode = secondNode;
    let swapCount = 0;
    const swap = (nodes: Array<TreeNodeOptions>) => {
      for (const [index, node] of nodes.entries()) {
        if (node.key == firstNode.key) {
          nodes[index] = tempSecondNode;
          swapCount++;
        } else if (node.key == secondNode.key) {
          nodes[index] = tempFirstNode;
          swapCount++;
        }

        if (swapCount == 2) {
          return true;
        }

        if (Array.isArray(node.children)) {
          swap(node.children);
        }
      }
      return false;
    };

    return swap(this._dataSource);
  }

  private _insertChildNode(fromNode: TreeNodeOptions, toNode: TreeNodeOptions) {
    const insert = (nodes: Array<TreeNodeOptions>) => {
      for (const node of nodes) {
        if (node.key === toNode.key) {
          this._removeNodeByKey(fromNode.key);
          if (!node.children) node.children = [];
          if (node.type === ETypeElement.DECISION) {
            node.children.push(fromNode);
          } else {
            node.children.unshift(fromNode);
          }
          fromNode.parentKey = node.key;
          return true;
        }

        if (Array.isArray(node.children)) {
          insert(node.children);
        }
      }
      return false;
    };

    return insert(this._dataSource);
  }

  private _insertNodeBefore(
    fromNode: TreeNodeOptions,
    toNode: TreeNodeOptions
  ): boolean {
    this._removeNodeByKey(fromNode.key);
    const insertNode = (nodes: Array<TreeNodeOptions>) => {
      for (const [index, node] of nodes.entries()) {
        if (node.key == toNode.key) {
          nodes.splice(index, 0, fromNode);
          return true;
        }

        if (Array.isArray(node.children)) {
          insertNode(node.children);
        }
      }
      return false;
    };

    return insertNode(this._dataSource);
  }

  private _insertNodeAfter(fromNode: TreeNodeOptions, toNode: TreeNodeOptions) {
    this._removeNodeByKey(fromNode.key);
    const insertNode = (nodes: Array<TreeNodeOptions>) => {
      for (const [index, node] of nodes.entries()) {
        if (node.key == toNode.key) {
          const indexInsert = index + 1;
          nodes.splice(indexInsert, 0, fromNode);
          return true;
        }

        if (Array.isArray(node.children)) {
          insertNode(node.children);
        }
      }
      return false;
    };

    return insertNode(this._dataSource);
  }

  private _removeNodeByKey(key: string): boolean {
    const remove = (nodes: Array<TreeNodeOptions>) => {
      for (const [index, node] of nodes.entries()) {
        if (node.key == key) {
          const deleteCount = 1;
          nodes.splice(index, deleteCount);
          return true;
        }

        if (Array.isArray(node.children)) {
          remove(node.children);
        }
      }
      return false;
    };

    return remove(this._dataSource);
  }

  private _composeNodeLookup(nodes: Array<TreeNodeOptions>) {
    const nodeMapping: Record<string, TreeNodeOptions> = {};

    const buildNodeMapping = (nodes: Array<TreeNodeOptions>) => {
      for (const node of nodes) {
        nodeMapping[node.key] = node;
        if (node.children) {
          buildNodeMapping(node.children);
        }
      }
    };

    buildNodeMapping(nodes);
    return nodeMapping;
  }

  private _shouldInsertChildNode(
    fromNode: TreeNodeOptions,
    toNode: TreeNodeOptions,
    position: DropPosition
  ) {
    const fromNodeTypeLevel = this._getNodeTypeLevel(fromNode.type);
    const toNodeTypeLevel = this._getNodeTypeLevel(toNode.type);
    if (fromNodeTypeLevel > toNodeTypeLevel) {
      const isUnderDecision =
        position == DropPosition.AFTER && toNode.type == ETypeElement.DECISION;

      if (isUnderDecision) {
        return true;
      }
    }

    //Check condition for decision insert as child node here

    return false;
  }
  //#endregion
}
