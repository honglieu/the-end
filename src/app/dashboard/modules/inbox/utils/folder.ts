export class Tree {
  public nodeLookup = new Map();
  public tree = [];
  public expandedIds: string[] = [];
  constructor(input) {
    this.tree = this.buildTree(input);
  }

  buildTree(input) {
    let tree = [];
    this.nodeLookup = new Map();
    for (let o of input) {
      o.children = [];
      this.nodeLookup.set(o.id, o);
    }
    for (let o of input) {
      if (o.parentId === null || !this.nodeLookup.has(o.parentId)) {
        tree.push(o);
      } else {
        this.nodeLookup.get(o.parentId).children.push(o);
      }
    }
    return tree;
  }

  insertNodeToRoot(node) {
    if (this.nodeLookup.has(node.id)) return;
    this.nodeLookup.set(node.id, node);
    this.tree.push(node);
  }

  getNodeById(id: string) {
    return this.nodeLookup.get(id);
  }

  hasNode(id: string): boolean {
    return this.nodeLookup.has(id);
  }

  addChildById(id, child) {
    let parentNode = this.getNodeById(id);
    if (!parentNode) return;
    this.expandedIds.push(parentNode.id);
    if (this.nodeLookup.has(child.id)) return;
    parentNode.children.push(child);
    parentNode.children.sort((a, b) =>
      a?.title?.localeCompare(b.title, undefined, { ignorePunctuation: true })
    );
    this.nodeLookup.set(child.id, child);
    const parents = this.getAllParents(child);
    for (const parent of parents) {
      this.expandedIds.push(parent.id);
    }
  }

  deleteNodeById(id) {
    let node = this.getNodeById(id);
    if (!node) return;
    let parentNode = this.getNodeById(node.parentId);
    if (parentNode) {
      let index = parentNode.children.indexOf(node);
      parentNode.children.splice(index, 1);
    } else {
      let index = this.tree.findIndex((item) => item.id === id);
      this.tree.splice(index, 1);
    }
    this.nodeLookup.delete(id);
  }

  updateNodeById(id, newData) {
    let node = this.getNodeById(id);
    if (node) {
      Object.assign(node, newData);
    }
    if (newData.id && id !== newData.id) {
      // imap update new externalId
      this.nodeLookup.set(newData.id, node);
      this.nodeLookup.delete(id);
      // update all child level 1
      newData.children?.forEach((child) => {
        this.nodeLookup.set(child.id, child);
        this.nodeLookup.delete(id);
      });
    }
  }

  moveNode(sourceId: string, targetId: string) {
    let sourceNode = this.getNodeById(sourceId);
    let targetNode = this.getNodeById(targetId);
    if (sourceNode && targetNode) {
      let sourceParentNode = this.getNodeById(sourceNode.parentId);
      if (sourceParentNode) {
        let index = sourceParentNode.children.indexOf(sourceNode);
        sourceParentNode.children.splice(index, 1);
      } else {
        let index = this.tree.findIndex((item) => item.id === sourceId);
        this.tree.splice(index, 1);
      }
      targetNode.children.push(sourceNode);
      sourceNode.parentId = targetId;
      targetNode.children.sort((a, b) =>
        a?.title?.localeCompare(b.title, undefined, { ignorePunctuation: true })
      );
      const parents = this.getAllParents(sourceNode);
      for (const parent of parents) {
        this.expandedIds.push(parent.id);
      }
    }
  }

  flattenTree(input, skipId) {
    const output = [];
    const flatten = (node, level, hasHidden = false) => {
      const hidden = hasHidden || node.id === skipId;
      output.push({ ...node, hidden, level });
      if (node.id !== skipId) {
        node.children?.forEach((child) => flatten(child, level + 1, hidden));
      }
    };
    input.forEach((node) => flatten(node, 0));
    return output;
  }

  getAllParents(node) {
    let parents = [];
    let current = node;
    while (current?.parentId !== null) {
      let parent = this.getNodeById(current?.parentId);
      if (parent) {
        parents.push(parent);
        current = parent;
      } else {
        break;
      }
    }
    return parents;
  }

  getNodeLevel(id) {
    return this.nodeLookup.get(id)?.level || false;
  }

  updateChildNames(parent, newExternalName) {
    if (!parent || !parent.children || parent.children.length < 1) {
      return;
    }
    const updateExternalName = (node, parentExternalName) => {
      const updatedExternalName = `${parentExternalName}/${node.name}`;
      node.externalName = updatedExternalName;
      this.nodeLookup.set(node.id, node);

      for (const child of node.children) {
        updateExternalName(child, updatedExternalName);
      }
    };
    for (const child of parent.children) {
      updateExternalName(child, newExternalName);
    }
  }
}

export const outlookFolderPosition = [
  'Inbox',
  'Junk Email',
  'Sent Items',
  'Deleted Items',
  'Archive',
  'Conversation History'
];

export const gmailFolderPosition = [
  'Starred',
  'Sent',
  'Important',
  'Spam',
  'Trash',
  'Category Social',
  'Category Updates',
  'Category Forums',
  'Category Promotions'
];
