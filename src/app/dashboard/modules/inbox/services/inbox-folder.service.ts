import { ElementRef, Injectable } from '@angular/core';
import {
  Tree,
  gmailFolderPosition,
  outlookFolderPosition
} from '@/app/dashboard/modules/inbox/utils/folder';
import { EmailStatusType } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { cloneDeep } from 'lodash-es';
import { IEmailClientFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { TrudiTotalCountPipe } from '@trudi-ui';
import { EmailProvider } from '@shared/enum/inbox.enum';
import { BehaviorSubject } from 'rxjs';
import { ISocketEmailClientFolderChanges } from '@shared/types/socket.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupType, TaskStatusType } from '@shared/enum';
import { InboxFilterService } from './inbox-filter.service';

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  private emailFolders: Tree = null;
  public emailFoldersAll = new Map();
  public createEmailFolder = new BehaviorSubject(null);
  public emailFoldersLoaded: BehaviorSubject<{ [mailBoxId: string]: boolean }> =
    new BehaviorSubject(null);
  private provider: EmailProvider = EmailProvider.OUTLOOK;
  public triggerUpdateEmailFolders: BehaviorSubject<boolean> =
    new BehaviorSubject(false);

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private inboxFilterService: InboxFilterService
  ) {}

  setEmailFolders(emailFolders, folders: IEmailClientFolder[]) {
    emailFolders.tree = folders;
  }

  formatFolder(node) {
    node.internalId = node.id;
    node.id = node.externalId;
    !node.editAble && (node.parentId = null);
    node.title = node.name;
    node.status = EmailStatusType.spam;
    node.icon = 'iconFolder';
    node.unReadMsgCount = Number(node.unReadMsgCount) || 0;
    node.total = null;
    node.children = node.children || [];
    return node;
  }

  buildTree(folders, mailBoxId?: string) {
    if (!folders?.[0]) {
      this.emailFolders = null;
      return;
    }
    this.setProvider(folders[0]);
    const { defaultFolders, customFolders } =
      this.changePostionFolderByProvider(folders);
    this.emailFoldersAll.set(
      mailBoxId,
      new Tree([...customFolders, ...defaultFolders])
    );
    this.emailFolders = new Tree([...customFolders, ...defaultFolders]);
  }

  getEmailFolderByMailBoxId(mailBoxId): Tree {
    if (this.emailFoldersAll.has(mailBoxId)) {
      return this.emailFoldersAll.get(mailBoxId);
    }
    return null;
  }

  setProvider(folder: IEmailClientFolder) {
    if (folder.mailBox.provider === EmailProvider.OUTLOOK) {
      this.provider = EmailProvider.OUTLOOK;
    } else if (folder.mailBox.provider === EmailProvider.GMAIL) {
      this.provider = EmailProvider.GMAIL;
    } else {
      this.provider = EmailProvider.OTHER;
    }
  }

  insertFolder(
    node: IEmailClientFolder,
    newParent: IEmailClientFolder,
    mailBoxId: string
  ) {
    this.formatFolder(node);
    const emailFolders = this.getEmailFolderByMailBoxId(mailBoxId);
    if (!emailFolders) return;
    if (!newParent?.id) {
      emailFolders.insertNodeToRoot(node);
      this.emailFoldersAll.set(mailBoxId, emailFolders);
    } else {
      emailFolders.addChildById(newParent.id, node);
    }
    this.sortFolders(emailFolders);
  }

  updateFolder(node, newParent, oldFolder, mailBoxId?) {
    const emailFolders = this.getEmailFolderByMailBoxId(mailBoxId);
    let currentNode = emailFolders.getNodeById(node.externalId);
    if (!currentNode) {
      // handle imap: update new externalId
      currentNode = emailFolders.getNodeById(oldFolder.id);
      const updateNode = cloneDeep(currentNode);
      updateNode.id = node.externalId;
      updateNode.externalId = node.externalId;
      updateNode.children?.forEach((item) => {
        item.parentId = node.externalId;
      });
      emailFolders.updateNodeById(currentNode.id, updateNode);
      currentNode = updateNode;
    }

    node.children = currentNode.children;
    this.formatFolder(node);
    if (!newParent && emailFolders.getNodeLevel(node.parentId) === false) {
      this.updateFolderToRoot(emailFolders, node, currentNode);
      emailFolders.updateChildNames(node, node.externalName);
      this.sortFolders(emailFolders);
      return;
    }

    node = {
      ...currentNode,
      title: node.name,
      externalName: node.externalName,
      name: node.name
    };

    if (!newParent?.id || currentNode.parentId === newParent.id) {
      emailFolders.updateNodeById(node.id, node);
    } else {
      node.parentId = newParent.id;
      emailFolders.moveNode(currentNode.id, newParent.id);
      if (currentNode.title !== node.title) {
        emailFolders.updateNodeById(currentNode.id, node);
      }
      this.setEmailFolders(emailFolders, [...emailFolders.tree]);
    }
    emailFolders.updateChildNames(node, node.externalName);
    this.sortFolders(emailFolders);
  }

  updateFolderToRoot(emailFolders, node, currentNode) {
    node.title = node.name;
    node.unReadMsgCount = currentNode.unReadMsgCount;
    emailFolders.deleteNodeById(currentNode.id);
    emailFolders.updateNodeById(node.id, node);
    emailFolders.insertNodeToRoot(node);
  }

  deleteFolder(folder: IEmailClientFolder, mailBoxId) {
    const emailFolders = this.getEmailFolderByMailBoxId(mailBoxId);
    const currentNode = emailFolders.getNodeById(folder.externalId);
    let navigateToInbox = false;
    if (currentNode.updatedAt === folder.updatedAt) {
      // ignore handle same action ws action and response api
      return;
    }
    if (currentNode.parentId === folder.parentId) {
      emailFolders.deleteNodeById(currentNode.id);
      navigateToInbox = true;
    } else {
      currentNode.updatedAt = folder.updatedAt;
      emailFolders.moveNode(currentNode.id, folder.parentId);
    }
    this.setEmailFolders(emailFolders, [...emailFolders.tree]);
    if (navigateToInbox) {
      const activeFolderId =
        this.activatedRoute.snapshot.queryParams['externalId'];
      if (currentNode.id !== activeFolderId) return;
      this.handleAfterFolderDeleted();
    }
  }

  flattenTreeEmailFolder(input, skipId?: string, mailBoxId?) {
    return this.emailFoldersAll.get(mailBoxId)?.flattenTree(input, skipId);
  }

  resetTree(mailBoxId) {
    this.emailFoldersAll.set(mailBoxId, null);
  }

  getCurrentFolder(currentExternalId: string, mailBoxId: string) {
    const emailFolders = this.getEmailFolderByMailBoxId(mailBoxId);
    return emailFolders?.getNodeById(currentExternalId);
  }

  transformToTitleCase(value: string) {
    if (!value) return '';
    value = value.toLowerCase().replace('_', ' ');
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  changePostionFolderByProvider(folders: IEmailClientFolder[]) {
    let defaultFolderPosition = [];
    let sortKey = null;
    if (this.provider === EmailProvider.GMAIL) {
      defaultFolderPosition = gmailFolderPosition;
      sortKey = 'name';
    }

    if (this.provider === EmailProvider.OUTLOOK) {
      defaultFolderPosition = outlookFolderPosition;
      sortKey = 'wellKnownName';
    }

    let defaultFolders = [];
    if (this.provider === EmailProvider.OTHER) {
      return {
        customFolders: [],
        defaultFolders: folders
      };
    }
    const customFolders = [];
    defaultFolderPosition.forEach((sortName) => {
      const foundItem = folders.find(
        (item: IEmailClientFolder) => item[sortKey] === sortName
      );
      if (foundItem) {
        customFolders.push(foundItem);
      }
    });
    folders.forEach((item: IEmailClientFolder) => {
      if (!defaultFolderPosition.includes(item[sortKey])) {
        defaultFolders.push(item);
      }
    });
    return {
      customFolders,
      defaultFolders
    };
  }

  sortFolders(emailFolders) {
    if (this.provider === EmailProvider.OTHER) {
      this.setEmailFolders(
        emailFolders,
        [...emailFolders.tree].sort((a, b) => {
          return this.compareByTitle(a?.title, b?.title);
        })
      );
    } else {
      const { defaultFolders, customFolders } =
        this.changePostionFolderByProvider(emailFolders.tree);
      defaultFolders.sort((a, b) => {
        return this.compareByTitle(a?.title, b?.title);
      });
      this.setEmailFolders(emailFolders, [...customFolders, ...defaultFolders]);
    }
  }

  compareByTitle(a, b) {
    return a?.localeCompare(b, undefined, { ignorePunctuation: true });
  }

  validateDuplicateTitle(currentNodeId, parentId, newTitle, mailBoxId: string) {
    const emailFolders = this.getEmailFolderByMailBoxId(mailBoxId);
    newTitle = newTitle.trim().toLowerCase();

    // accept not change
    const currentNode = !currentNodeId
      ? null
      : emailFolders.getNodeById(currentNodeId);
    if (
      currentNode &&
      (!parentId || currentNode.parentId === parentId) &&
      currentNode.title.toLowerCase() === newTitle
    ) {
      return true;
    }

    // check duplicate
    const nodes = parentId
      ? emailFolders.getNodeById(parentId)?.children
      : emailFolders?.tree || [];
    if (!nodes) {
      return false;
    }
    return !nodes.some((node) => node.title.toLowerCase() === newTitle);
  }

  handleInsertFolderWS(folder: IEmailClientFolder, mailBoxId) {
    const emailFolders = this.getEmailFolderByMailBoxId(mailBoxId);
    if (!emailFolders || this.hasFolder(emailFolders, folder?.externalId))
      return;
    const newParentFolder = emailFolders.nodeLookup.get(folder.parentId);
    this.insertFolder(folder, newParentFolder, mailBoxId);
  }

  handleUpdateFolderWS(folder: IEmailClientFolder, mailBoxId?) {
    const emailFolders = this.getEmailFolderByMailBoxId(mailBoxId);
    if (!this.hasFolder(emailFolders, folder?.externalId)) return;
    const oldFolder = emailFolders.nodeLookup.get(folder.externalId);
    // check has update
    if (folder.updatedAt === oldFolder.updatedAt) return;
    const newParentFolder = emailFolders.nodeLookup.get(folder.parentId);
    this.updateFolder(folder, newParentFolder, oldFolder, mailBoxId);
  }

  handleDeleteFolderWS(folder: IEmailClientFolder, mailBoxId) {
    const emailFolders = this.getEmailFolderByMailBoxId(mailBoxId);
    if (!this.hasFolder(emailFolders, folder?.externalId)) return;
    const oldFolder = emailFolders.nodeLookup.get(folder.externalId);
    // check has update
    if (folder.updatedAt === oldFolder.updatedAt) return;
    this.deleteFolder(folder, mailBoxId);
  }

  handleChangeBulkFolderWs(
    changes: ISocketEmailClientFolderChanges,
    mailBoxId
  ) {
    const nodeLookup = this.getEmailFolderByMailBoxId(mailBoxId)?.nodeLookup;
    if (!changes || !nodeLookup) return;
    let navigateToInbox = false;
    const activeFolderId =
      this.activatedRoute.snapshot.queryParams['externalId'];
    let hasChanges = false;
    ['deletes', 'creates', 'updates'].forEach((changeType) => {
      const changeList = changes[changeType];
      if (!changeList?.length) return;
      hasChanges = true;
      if (changeType === 'deletes') {
        changeList.forEach((id: string) => {
          nodeLookup.delete(id);
          if (id === activeFolderId) {
            navigateToInbox = true;
          }
        });
      } else {
        changeList.forEach((folder: IEmailClientFolder) => {
          const oldFolder = nodeLookup.get(folder.externalId);
          if (oldFolder) {
            folder.unReadMsgCount = Number(oldFolder.unReadMsgCount) || 0;
          }
          this.formatFolder(folder);
          nodeLookup.set(folder.id, folder);
        });
      }
    });

    if (hasChanges) {
      this.buildTree(
        Array.from(nodeLookup.values()).sort((a, b) => {
          return this.compareByTitle(a?.title, b?.title);
        }),
        mailBoxId
      );
      if (navigateToInbox) {
        this.handleAfterFolderDeleted();
      }
    }
  }

  hasFolder(emailFolders, id: string): boolean {
    return emailFolders?.hasNode(id);
  }

  get listFolderFlat() {
    return this.emailFolders.nodeLookup;
  }

  setExpandFolders(id: string, mailBoxId: string) {
    const emailFolders = this.getEmailFolderByMailBoxId(mailBoxId);
    if (!emailFolders) return;
    const node = emailFolders.getNodeById(id);
    const parents = emailFolders.getAllParents(node);
    const expandedIds = [];
    for (const parent of parents) {
      expandedIds.push(parent.id);
    }
    emailFolders.expandedIds = [...expandedIds];
  }

  mergeFoldersWithUnread(folders, unreadFolders) {
    const totalCountPipe = new TrudiTotalCountPipe();
    const unreadFoldersMap = new Map(
      unreadFolders.map((folder) => [folder.externalId, folder.totalUnread])
    );
    return folders.map((folder) => {
      this.formatFolder(folder);
      return {
        ...folder,
        unReadMsgCount: totalCountPipe.transform(
          Number(unreadFoldersMap.get(folder.externalId)) || 0
        )
      };
    });
  }

  updateFoldersMsgCount(
    listFolderUnread,
    emailFoldersRef: ElementRef,
    mailBoxId?: string
  ) {
    if (listFolderUnread?.length < 1) return;
    const nodeLookup = this.getEmailFolderByMailBoxId(mailBoxId)?.nodeLookup;
    for (const item of listFolderUnread) {
      const folder = nodeLookup?.get(item.externalId);
      folder && (folder.unReadMsgCount = item.totalUnread);
    }

    const totalCountPipe = new TrudiTotalCountPipe();

    // Optimize performance by directly updating the DOM due to the 'trackBy' issue with the CDK tree:
    // https://github.com/angular/components/issues/18639
    const unreadElements = emailFoldersRef?.nativeElement.querySelectorAll(
      'span[id][mailBoxId]'
    );

    for (const span of unreadElements) {
      if (span.getAttribute('mailBoxId') !== mailBoxId) continue;
      const unreadMsgCount = nodeLookup.get(span.id)?.unReadMsgCount || 0;
      const transformedText = totalCountPipe.transform(unreadMsgCount);

      if (span.innerText !== transformedText) {
        span.innerText = transformedText;
      }

      if (unreadMsgCount > 0) {
        span.classList.remove('d-none');
      } else {
        span.classList.add('d-none');
      }
    }
  }

  handleAfterFolderDeleted() {
    this.router.navigate(['/dashboard', 'inbox', 'messages'], {
      queryParams: {
        inboxType:
          this.inboxFilterService.getSelectedInboxType() || GroupType.TEAM_TASK,
        status: TaskStatusType.inprogress
      }
    });
  }
}
