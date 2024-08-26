import { InboxExpandService } from './../../services/inbox-expand.service';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  ElementRef,
  ViewChild
} from '@angular/core';
import {
  EFolderType,
  FolderNode,
  IExpandFolder,
  ITaskFolderRoute
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { Router, ActivatedRoute } from '@angular/router';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { ToastrService } from 'ngx-toastr';
import {
  Subject,
  combineLatest,
  debounceTime,
  filter,
  switchMap,
  takeUntil
} from 'rxjs';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ArrayDataSource } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import { cloneDeep } from 'lodash-es';
import { UserService } from '@services/user.service';
import { SharedService } from '@services/shared.service';
import { EmailFolderService } from './services/email-folder.service';
import { EEmailFolderPopup } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { LABEL_EXTERNAL_ID_MAIL_BOX } from '@services/constants';
import { Store } from '@ngrx/store';
import { mailFolderActions } from '@core/store/mail-folder/actions/mail-folder.actions';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { IMailBox } from '@shared/types/user.interface';

@Component({
  selector: 'email-folder-sidebar',
  templateUrl: './email-folder-sidebar.component.html',
  styleUrls: ['./email-folder-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailFolderSidebarComponent
  implements OnInit, OnChanges, OnDestroy
{
  @ViewChild('emailFolders') emailFoldersRef: ElementRef;
  @Input() item: ITaskFolderRoute;
  @Input() mailBox: IMailBox;
  @Output() handleClickEmailFolder = new EventEmitter<void>();
  public nestedFolders = [];
  public refreshEmailFolderMailBox: IMailBox;
  public isLoading: boolean = true;
  public mailBoxIdParams: string;
  currentGmailFolder;
  isCreateNewFolder: boolean = false;
  isShowGmailFolderPopup: boolean;
  folderActivedId?: string = null;
  isDisConnectedMailbox: boolean = false;

  readonly EFolderType = EFolderType;
  readonly EMailBoxStatus = EMailBoxStatus;
  private destroy$ = new Subject<boolean>();

  treeControl = new NestedTreeControl<FolderNode>((node) => node.children);
  dataSource = new ArrayDataSource([]);
  public isConsole: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dashboardApiService: DashboardApiService,
    private toastService: ToastrService,
    private folderService: FolderService,
    private rxWebsocketService: RxWebsocketService,
    public inboxService: InboxService,
    public userService: UserService,
    private sharedService: SharedService,
    private emailFolderService: EmailFolderService,
    private cdr: ChangeDetectorRef,
    private inboxExpandService: InboxExpandService,
    private store: Store,
    private inboxSidebarService: InboxSidebarService
  ) {}

  mailFolderE2EData = {
    [LABEL_EXTERNAL_ID_MAIL_BOX.UNREAD]: 'inbox-gmail-folder-unread-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.INBOX]: 'inbox-gmail-folder-inbox-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.CHAT]: 'inbox-gmail-folder-chat-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.IMPORTANT]:
      'inbox-gmail-folder-important-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.TRASH]: 'inbox-gmail-folder-trash-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.DRAFT]: 'inbox-gmail-folder-draft-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.SPAM]: 'inbox-gmail-folder-spam-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.CATEGORY_FORUMS]:
      'inbox-gmail-folder-category-forums-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.CATEGORY_UPDATES]:
      'inbox-gmail-folder-category-updates-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.CATEGORY_PERSONAL]:
      'inbox-gmail-folder-category-personal-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.CATEGORY_PROMOTIONS]:
      'inbox-gmail-folder-category-promotions-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.CATEGORY_SOCIAL]:
      'inbox-gmail-folder-category-social-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.STARRED]: 'inbox-gmail-folder-starred-folder',
    [LABEL_EXTERNAL_ID_MAIL_BOX.SENT]: 'inbox-gmail-folder-sent-folder'
  };

  hasChild = (_: number, node: FolderNode) =>
    !!node.children && node.children.length > 0;

  ngOnInit() {
    this.subscribeUser();
    this.expandDefaultFolder();
    this.subscribeQueryParams();
    this.subscribeWS();
    this.subscribeTreeControl();
    this.subscribeEmailFolder();
    this.subscribeCollapseMenu();
    this.subscribeExpandMenu();
    this.subscribeFreshEmailFolderMailBoxId();
    this.subscribeMailBoxLoaded();
    this.subscribeEventUpdateFoldersMsgCount();
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDisConnect: boolean) => {
        this.isDisConnectedMailbox = isDisConnect;
      });
    this.initDataChangePageSibarItem();
    this.subscribeOpenByBtnViewToast();
  }

  initDataChangePageSibarItem() {
    this.nestedFolders = this.folderService.getEmailFolderByMailBoxId(
      this.mailBox.id
    )?.tree;
    if (this.nestedFolders?.length) {
      this.isLoading = false;
      this.initData();
      this.expandNodes();
      this.cdr.markForCheck();
    }
  }

  private subscribeEventUpdateFoldersMsgCount() {
    this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId
      .pipe(
        takeUntil(this.destroy$),
        filter((mailBoxId) => !this.isConsole && mailBoxId === this.mailBox.id),
        debounceTime(500),
        switchMap(() =>
          this.dashboardApiService.getFolderUnreadMessagesCount(this.mailBox.id)
        )
      )
      .subscribe((res) => {
        this.folderService.updateFoldersMsgCount(
          res,
          this.emailFoldersRef,
          this.mailBox.id
        );
        this.cdr.markForCheck();
      });
  }

  private subscribeUser() {
    this.userService.userInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.isConsole = this.sharedService.isConsoleUsers();
      });
  }

  private subscribeMailBoxLoaded() {
    const [checked, externalId, mailBoxId] = this.checkBeforeFolderLoaded();
    let firstTime = true;
    combineLatest([
      this.folderService.emailFoldersLoaded,
      this.folderService.triggerUpdateEmailFolders
    ])
      .pipe(
        takeUntil(this.destroy$),
        filter(([folder, trigger]) => {
          const mailBoxIds = folder ? Object.keys(folder) : [];
          return mailBoxIds?.[0] === this.mailBox.id; // email folder filter by mailBoxId
        })
      )
      .subscribe(([folder, trigger]) => {
        this.isLoading = false;
        this.inboxService.triggerUpdateFolderClientMailBoxId.next(null);
        if (!folder) return;
        this.nestedFolders = this.folderService.getEmailFolderByMailBoxId(
          this.mailBox.id
        )?.tree;
        if (!this.nestedFolders?.length) {
          this.inboxService.setRefreshEmailFolderMailBox(null);
        }
        this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
          this.mailBox.id
        );
        this.initData();
        if (firstTime && checked && this.nestedFolders?.length) {
          firstTime = false;
          this.handleFirstTimeReloadPage(externalId, mailBoxId);
        }
        this.expandNodes();
        this.cdr.markForCheck();
      });
  }

  initData() {
    const nodes = cloneDeep(this.nestedFolders);
    this.dataSource = new ArrayDataSource(nodes);
    this.treeControl.dataNodes = nodes;
    this.inboxExpandService.setGroupFolder(this.treeControl.dataNodes);
  }

  // handle action reload page when folder email folder still activated
  handleFirstTimeReloadPage(externalId: string, mailBoxId: string) {
    this.item.isOpen = true;
    this.inboxService.setCurrentMailBoxIdEmailFolder(this.mailBox.id);
    this.inboxService.setCurrentMailBoxEmailFolder(this.mailBox);
    this.inboxService.mailboxIdEmailActive.add(this.mailBox.id);
    this.folderService.setExpandFolders(externalId, mailBoxId);
  }

  private subscribeFreshEmailFolderMailBoxId() {
    this.inboxService.refreshEmailFolderMailBox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((refreshEmailFolderMailBox) => {
        if (!refreshEmailFolderMailBox) return;
        this.refreshEmailFolderMailBox = refreshEmailFolderMailBox;
        this.isDisConnectedMailbox = this.mailBox.status === 'DISCONNECT';
      });
  }

  private expandDefaultFolder() {
    this.setFolderActiveId();
  }

  private subscribeOpenByBtnViewToast() {
    this.inboxService.isOpenEmailFolderByBtnViewToast$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mailBoxId) => {
        if (this.mailBox.id !== mailBoxId) return;
        this.item.isOpen = true;
        this.inboxService.setCurrentMailBoxIdEmailFolder(this.mailBox.id);
        this.inboxService.setCurrentMailBoxEmailFolder(this.mailBox);
      });
  }

  private subscribeQueryParams() {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ mailBoxId, externalId }) => {
        this.mailBoxIdParams = mailBoxId;
        if (mailBoxId !== this.mailBox.id || !externalId) {
          this.folderActivedId = null;
        } else {
          this.folderActivedId = externalId;
          this.folderService.setExpandFolders(externalId, mailBoxId);
          this.expandNodes();
        }
        this.cdr.markForCheck();
      });
  }

  private subscribeWS(): void {
    this.rxWebsocketService.onSocketEmailClientFolder
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res.mailBoxId === this.mailBox.id)
      )
      .subscribe(({ folder, action, data, mailBoxId }) => {
        this.inboxService.triggerUpdateFolderClientMailBoxId.next(mailBoxId);
        this.handleFolderAction(folder, action, data?.changes, mailBoxId);
      });
  }

  private subscribeTreeControl() {
    const emailFolder = this.folderService.getEmailFolderByMailBoxId(
      this.mailBox.id
    );
    if (!emailFolder) return;
    this.treeControl.expansionModel.changed
      .pipe(takeUntil(this.destroy$))
      .subscribe((change) => {
        let expandedIds = emailFolder?.expandedIds;
        if (change.removed.length) {
          // Handle node collapse
          const collapsedNode = change.removed[0];
          emailFolder.expandedIds = expandedIds.filter(
            (item) => item !== collapsedNode['id']
          );
        }
      });
  }

  private handleFolderAction(folder, action, changes, mailBoxId): void {
    const actionHandlers = {
      create: () => this.folderService.handleInsertFolderWS(folder, mailBoxId),
      update: () => this.folderService.handleUpdateFolderWS(folder, mailBoxId),
      delete: () => this.folderService.handleDeleteFolderWS(folder, mailBoxId),
      changeBulkFolder: () =>
        this.folderService.handleChangeBulkFolderWs(changes, mailBoxId)
    };

    const handleAction = actionHandlers[action];
    const nodeLookup =
      this.folderService.getEmailFolderByMailBoxId(mailBoxId)?.nodeLookup;
    if (handleAction && nodeLookup) {
      handleAction();

      this.store.dispatch(
        mailFolderActions.setAllMailFolderToCache({
          mailFolders: Array.from(nodeLookup.values()).sort((a, b) => {
            return this.compareByTitle(a?.title, b?.title);
          }),
          payload: { mailBoxId: mailBoxId }
        })
      );
    }
  }

  compareByTitle(a, b) {
    return a?.localeCompare(b, undefined, { ignorePunctuation: true });
  }

  private subscribeEmailFolder() {
    this.emailFolderService.isVisibleCreateEmailFolder$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isVisibleCreateEmailFolder) => {
        if (isVisibleCreateEmailFolder) {
          this.isShowGmailFolderPopup = this.isCreateNewFolder =
            isVisibleCreateEmailFolder;
          this.cdr.markForCheck();
        }
      });
  }

  private subscribeExpandMenu() {
    this.inboxExpandService.expandFolder
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.mailBoxIdParams === this.mailBox.id)
      )
      .subscribe((expandFolder: IExpandFolder) => {
        if (expandFolder.folderMailBoxId !== this.mailBoxIdParams) return;
        if (expandFolder.folderType === this.item.type && !this.item.isOpen) {
          if (!this.nestedFolders?.length) {
            this.inboxService.setRefreshEmailFolderMailBox(this.mailBox);
          }
          this.item.isOpen = expandFolder.isOpen;
          this.cdr.markForCheck();
          this.inboxExpandService.setExpandedFolder(expandFolder);
          return;
        }

        // handle expand sub-folder
        const subNodeToExpand =
          this.inboxExpandService.gmailFolderNodeData.find((folder) => {
            return folder.name === expandFolder.subFolder;
          });
        if (subNodeToExpand) {
          const isSubNodeExpanded =
            this.treeControl.isExpanded(subNodeToExpand);
          if (isSubNodeExpanded) {
            return;
          }
          this.treeControl.expand(subNodeToExpand);
          this.cdr.markForCheck();
          this.inboxExpandService.setExpandedFolder(expandFolder);
        }
      });
  }

  private subscribeCollapseMenu() {
    this.inboxExpandService.collapseFolder
      .pipe(takeUntil(this.destroy$))
      .subscribe((expandFolder: IExpandFolder[]) => {
        expandFolder.forEach((folder) => {
          if (folder.folderType === this.item.type) {
            this.item.isOpen = false;
            this.cdr.markForCheck();
            return;
          }

          // handle collapse sub-folder
          const subNodeToCollapse =
            this.inboxExpandService.gmailFolderNodeData.find((f) => {
              return f.name === folder.subFolder;
            });
          if (subNodeToCollapse) {
            this.treeControl.collapse(subNodeToCollapse);
            this.cdr.markForCheck();
          }
        });
      });
  }

  ngOnChanges(changes: SimpleChanges): void {}

  expandNodes() {
    const emailFolder = this.folderService.getEmailFolderByMailBoxId(
      this.mailBox.id
    );
    const expandedNodeIds = new Set<string>();
    for (const node of this.treeControl.expansionModel.selected) {
      expandedNodeIds.add(node['id']);
    }
    let expandedIds = emailFolder?.expandedIds;
    if (!expandedIds?.length) return;
    for (const nodeId of expandedIds) {
      expandedNodeIds.add(nodeId);
    }
    if (expandedNodeIds.size) {
      this.treeControl.collapseAll();
    }
    const expandAllChildren = (node: FolderNode) => {
      if (expandedNodeIds.has(node['id'])) {
        this.treeControl.expand(node);
      }
      if (node.children?.length) {
        for (const child of node.children) {
          expandAllChildren(child);
        }
      }
    };
    for (const node of this.treeControl.dataNodes) {
      expandAllChildren(node);
    }
  }

  // check email folder actived (`folder acitved` => true)
  checkBeforeFolderLoaded() {
    const { externalId, status, mailBoxId } = this.route.snapshot.queryParams;
    return [
      status === 'MAILFOLDER' &&
        externalId &&
        (this.mailBox?.id === this.refreshEmailFolderMailBox?.id ||
          this.mailBox?.id === mailBoxId),
      externalId,
      mailBoxId
    ];
  }

  setFolderActiveId() {
    const [checked, externalId] = this.checkBeforeFolderLoaded();
    if (checked) {
      // fresh list email folder by mailbox
      this.inboxService.setRefreshEmailFolderMailBox(this.mailBox);
      this.folderActivedId = externalId;
    }
  }

  handleGmailFolderPopup({ isCreateNewFolder = true }) {
    if (isCreateNewFolder) {
      this.inboxService.setRefreshEmailFolderMailBox(this.mailBox);
      this.currentGmailFolder = null;
    }
    this.isShowGmailFolderPopup = true;
    this.isCreateNewFolder = isCreateNewFolder;
  }

  handleDeleteGmailFolder() {
    const handleResponse = (errorMessage) => ({
      next: (res) => {
        this.folderService.deleteFolder({ ...res.folder }, this.mailBox.id);
        this.toastService.success('Folder deleted');
        this.currentGmailFolder = null;
      },
      error: () => this.toastService.error(errorMessage)
    });
    this.dashboardApiService
      .deleteMailBoxFolder({
        folderId: this.currentGmailFolder.internalId,
        mailBoxId: this.mailBox.id
      })
      .subscribe(handleResponse('Delete folder failure'));
  }

  handleClosePopup() {
    this.backToTaskFolder();
    this.emailFolderService.setIsVisibleCreateEmailFolder(false);
    this.isShowGmailFolderPopup = this.isCreateNewFolder = false;
    this.currentGmailFolder = null;
  }

  backToTaskFolder() {
    if (
      this.emailFolderService.emailFolderAction ===
      EEmailFolderPopup.EMAIL_FOLDER_STEP
    ) {
      this.emailFolderService.setEmailFolderAction(
        EEmailFolderPopup.TASK_FOLDER
      );
    }
  }
  activeNode(externalId: string, mailBoxId: string): void {
    this.inboxService.setCurrentMailBoxIdEmailFolder(this.mailBox.id);
    this.inboxService.setCurrentMailBoxEmailFolder(this.mailBox);
    this.navigateWithMergedParams(externalId);
    this.folderActivedId = externalId;
    this.handleClickEmailFolder.emit();
  }

  private navigateWithMergedParams(externalId: string) {
    const newParams = {
      status: 'MAILFOLDER',
      mailBoxId: this.mailBox.id,
      externalId: externalId,
      search: this.route.snapshot.queryParams['search'],
      showMessageInTask: this.route.snapshot.queryParams['showMessageInTask'],
      inboxType: this.route.snapshot.queryParams['inboxType'],
      taskTypeID: null,
      taskStatus: null,
      aiAssistantType: null,
      conversationLogId: null,
      taskId: null,
      conversationId: null,
      sortTaskType: null
    };
    this.router.navigate(['mail'], {
      relativeTo: this.route,
      queryParams: newParams
    });
  }

  ngOnDestroy(): void {
    this.dataSource.disconnect();
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  @HostListener('keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    if (
      !event.target ||
      !(event.target instanceof Element) ||
      event.target.closest('a') ||
      event.target.closest('button')
    ) {
      event.stopPropagation();
    } else if (event.target.id === 'wrapper-node') {
      event.stopPropagation();
    } else if (event.target.closest('li')) {
      this.item.isOpen = !this.item.isOpen;
    }
  }
}
