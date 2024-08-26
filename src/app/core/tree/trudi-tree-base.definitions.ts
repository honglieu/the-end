import { TrudiTreeNode } from './trudi-tree-base-node';

export interface TrudiFormatEmitEvent {
  eventName: string;
  node?: TrudiTreeNode | null;
  event?: MouseEvent | DragEvent | null;
  dragNode?: TrudiTreeNode;
  selectedKeys?: TrudiTreeNode[];
  checkedKeys?: TrudiTreeNode[];
  matchedKeys?: TrudiTreeNode[];
  nodes?: TrudiTreeNode[];
  keys?: string[];
}

export interface TrudiFormatBeforeDropEvent {
  dragNode: TrudiTreeNode;
  node: TrudiTreeNode;
  pos: number;
}

export interface TrudiTreeNodeBaseComponent {
  markForCheck(): void;
}
