import { TrudiSafeAny } from '@core';

import {
  FlattenNode,
  TrudiTreeNode,
  TrudiTreeNodeKey
} from './trudi-tree-base-node';

export function isCheckDisabled(node: TrudiTreeNode): boolean {
  const { isDisabled, isDisableCheckbox } = node;
  return !!(isDisabled || isDisableCheckbox);
}

export function isInArray(
  needle: TrudiSafeAny,
  haystack: TrudiSafeAny[]
): boolean {
  return haystack.length > 0 && haystack.indexOf(needle) > -1;
}

export function getPosition(level: string | number, index: number): string {
  return `${level}-${index}`;
}

export function getKey(key: TrudiTreeNodeKey, pos: string): TrudiTreeNodeKey {
  if (key !== null && key !== undefined) {
    return key;
  }
  return pos;
}

/**
 * Flat nest tree data into flatten list. This is used for virtual list render.
 *
 * @param treeNodeList Origin data node list
 * @param expandedKeys
 * need expanded keys, provides `true` means all expanded (used in `rc-tree-select`).
 */
export function flattenTreeData(
  treeNodeList: TrudiTreeNode[] = [],
  expandedKeys: TrudiTreeNodeKey[] | true = []
): FlattenNode[] {
  const expandedKeySet = new Set(expandedKeys === true ? [] : expandedKeys);
  const flattenList: FlattenNode[] = [];

  function dig(
    list: TrudiTreeNode[],
    parent: FlattenNode | null = null
  ): FlattenNode[] {
    return list.map((treeNode, index) => {
      const pos: string = getPosition(parent ? parent.pos : '0', index);
      const mergedKey = getKey(treeNode.key, pos);
      treeNode.isStart = [...(parent ? parent.isStart : []), index === 0];
      treeNode.isEnd = [
        ...(parent ? parent.isEnd : []),
        index === list.length - 1
      ];
      // Add FlattenDataNode into list
      // TODO: only need data here.
      const flattenNode: FlattenNode = {
        parent,
        pos,
        children: [],
        data: treeNode,
        isStart: [...(parent ? parent.isStart : []), index === 0],
        isEnd: [...(parent ? parent.isEnd : []), index === list.length - 1]
      };

      flattenList.push(flattenNode);

      // Loop treeNode children
      if (
        expandedKeys === true ||
        expandedKeySet.has(mergedKey) ||
        treeNode.isExpanded
      ) {
        flattenNode.children = dig(treeNode.children || [], flattenNode);
      } else {
        flattenNode.children = [];
      }

      return flattenNode;
    });
  }

  dig(treeNodeList);
  return flattenList;
}
