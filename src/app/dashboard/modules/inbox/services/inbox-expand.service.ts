import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  EFolderType,
  FolderNode,
  IExpandFolder
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';

const groupFolder = [
  {
    className: 'task-folder-group-collapse-title',
    folderType: EFolderType.TASKS,
    subFolder: ''
  },
  {
    className: 'more-folder-group-collapse-title',
    folderType: EFolderType.MORE,
    subFolder: ''
  },
  {
    className: 'gmail-folder-group-collapse-title',
    folderType: EFolderType.GMAIL,
    subFolder: ''
  },
  {
    className: 'mail-folder-group-collapse-title',
    folderType: EFolderType.MAIL,
    subFolder: ''
  }
];

@Injectable({
  providedIn: 'root'
})
export class InboxExpandService {
  public expandFolder: Subject<IExpandFolder> = new Subject();
  public collapseFolder: Subject<IExpandFolder[]> = new Subject();
  public listOfClassNameExpandedFromCollapse: string[] = [];

  private gmailFolderNodeDataBS = new BehaviorSubject<FolderNode[]>([]);
  private folderGroupClassName = 'drop_task--folder';
  private groupFolderClass: IExpandFolder[] = [...groupFolder];
  private listOfClassNameToExpand = groupFolder.map(
    (folder) => folder.className
  );

  constructor(@Inject(DOCUMENT) private document: Document) {}

  get gmailFolderNodeData() {
    return this.gmailFolderNodeDataBS.getValue();
  }

  public setGroupFolder(nodeData: FolderNode[]) {
    const flattedNodeData = this.flattenNodes(nodeData);
    this.gmailFolderNodeDataBS.next(flattedNodeData);
    const subGroupFolderIncludesChildren = flattedNodeData.filter(
      (subFolder) => subFolder.children.length
    );
    const subExpandFolder = subGroupFolderIncludesChildren.reduce(
      (acc, subFolder) => {
        const subFolderName = (subFolder.name as any)?.replaceAll('.', '');
        const expandFolder = {
          className:
            'sub-' +
            subFolderName.toLowerCase().split(' ').join('-') +
            '-collapse-title',
          subFolder: subFolder.name
        };
        return [...acc, expandFolder];
      },
      []
    );
    this.groupFolderClass = [...groupFolder, ...subExpandFolder];
    this.listOfClassNameToExpand = this.groupFolderClass.map(
      (folder) => folder.className
    );
  }

  getFolderNameWhenDragging(dragPosition) {
    const draggedToElement = this.getRootElement(
      dragPosition,
      this.folderGroupClassName
    );

    if (draggedToElement) {
      const folderNameElement =
        draggedToElement.querySelector('.item-name') ||
        draggedToElement.querySelector('.folder-name');

      if (folderNameElement) {
        return folderNameElement?.textContent;
      }
    }
    return '';
  }

  setExpandedFolder(folder: IExpandFolder) {
    const expandedFolder = this.groupFolderClass.find((f) => {
      if (f.folderType) {
        return f.folderType === folder.folderType;
      }
      return f.subFolder === folder.subFolder;
    });
    this.listOfClassNameExpandedFromCollapse = [
      ...this.listOfClassNameExpandedFromCollapse,
      expandedFolder.className
    ];
  }

  expandSubMenu(dragPosition) {
    for (const folder of this.groupFolderClass) {
      const draggedToElement = this.getRootElement(
        dragPosition,
        folder?.className
      );
      const folderMailBoxId =
        draggedToElement?.getAttribute('folder-mailbox-id');
      if (draggedToElement) {
        const targetClassName = Array.from(draggedToElement.classList).find(
          (className) => className.endsWith('collapse-title')
        );
        const isExpanded =
          this.listOfClassNameExpandedFromCollapse.includes(targetClassName);
        if (!isExpanded) {
          this.expandFolder.next({
            folderType: folder.folderType,
            isOpen: true,
            subFolder: folder.subFolder,
            folderMailBoxId
          });
        }
      }
    }
  }

  public handleCollapseFolder() {
    const folderToCollapse = this.groupFolderClass.filter((folder) =>
      this.listOfClassNameExpandedFromCollapse.includes(folder.className)
    );
    this.collapseFolder.next(folderToCollapse);
    this.listOfClassNameExpandedFromCollapse = [];
  }

  private getRootElement(
    pointerPosition: { x: number; y: number },
    rootClassName: string
  ) {
    const element = this.document.elementFromPoint(
      pointerPosition.x,
      pointerPosition.y
    );
    const rootElement =
      element?.closest(`.${rootClassName}`) ||
      element?.querySelector(`${rootClassName}`);
    return rootElement;
  }

  private flattenNodes(nodes: FolderNode[]): FolderNode[] {
    const flattenedNodes: FolderNode[] = [];
    nodes.forEach((node) => {
      flattenedNodes.push(node);
      if (node.children) {
        flattenedNodes.push(...this.flattenNodes(node.children));
      }
    });
    return flattenedNodes;
  }
}
