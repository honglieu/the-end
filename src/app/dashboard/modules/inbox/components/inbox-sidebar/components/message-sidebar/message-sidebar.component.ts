import {
  Component,
  Input,
  ViewChild,
  SimpleChanges,
  OnInit,
  Output,
  EventEmitter
} from '@angular/core';
import {
  NzFormatEmitEvent,
  NzTreeComponent,
  NzTreeNode
} from 'ng-zorro-antd/tree';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EFolderType } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { IMessageRoute } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { isEqual } from 'lodash-es';

const MESSAGE_ROUTER = '/inbox/messages';
const APP_MESSAGE_ROUTER = '/inbox/app-messages';
const MESSAGE_ROUTER_RESOLVED = `${MESSAGE_ROUTER}/resolved`;
const MESSAGE_ROUTER_DELETED = `${MESSAGE_ROUTER}/deleted`;
const APP_MESSAGE_ROUTER_RESOLVED = `${APP_MESSAGE_ROUTER}/resolved`;
const APP_MESSAGE_ROUTER_DELETED = `${APP_MESSAGE_ROUTER}/deleted`;

@Component({
  selector: 'message-sidebar',
  templateUrl: './message-sidebar.component.html',
  styleUrls: ['./message-sidebar.component.scss']
})
export class MessageSidebarComponent implements OnInit {
  @ViewChild('treeCom') treeCom: NzTreeComponent;
  @Input() item: IMessageRoute;
  @Input() nestedFolders = [];
  @Output() handleClickEmailFolder = new EventEmitter<void>();
  public nestedFoldersDisplay = [];
  public currentGmailFolder;
  public isCreateNewFolder: boolean = false;
  public isShowGmailFolderPopup: boolean;
  public folderActivedId?: string = null;
  public matchRouterMessage: boolean = false;

  readonly EFolderType = EFolderType;
  private destroy$ = new Subject<boolean>();

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.matchRouterMessage =
      this.router.url.includes(MESSAGE_ROUTER) &&
      !this.router.url.includes(MESSAGE_ROUTER_RESOLVED) &&
      !this.router.url.includes(MESSAGE_ROUTER_DELETED);
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.matchRouterMessage =
          event.url.includes(MESSAGE_ROUTER) &&
          !event.url.includes(MESSAGE_ROUTER_RESOLVED) &&
          !event.url.includes(MESSAGE_ROUTER_DELETED);
      }
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.setFolderActiveId();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['nestedFolders'] &&
        !isEqual(
          changes['nestedFolders'].currentValue,
          changes['nestedFolders'].previousValue
        ) &&
        this.item) ||
      (changes['item'] &&
        !isEqual(changes['item'].currentValue, changes['item'].previousValue) &&
        this.nestedFolders)
    ) {
      this.nestedFoldersDisplay = [
        {
          ...this.item,
          id: this.nestedFolders?.length > 0 ? this.nestedFolders[0].id : null,
          children:
            this.nestedFolders?.length > 0 ? this.nestedFolders[0].children : []
        }
      ];
      this.setActiveItem(this.folderActivedId);
      this.setFolderActiveId();
    }
  }

  setFolderActiveId() {
    const { externalId, status } = this.route.snapshot.queryParams;
    if (status === 'INPROGRESS') {
      this.folderActivedId = externalId;
    } else {
      this.folderActivedId = null;
    }
  }

  handleGmailFolderPopup({ value = null, isCreateNewFolder = false }) {
    this.isShowGmailFolderPopup = true;
    this.currentGmailFolder = value;
    this.isCreateNewFolder = isCreateNewFolder;
  }

  handleClosePopup() {
    this.isShowGmailFolderPopup = this.isCreateNewFolder = false;
  }

  toggleNodeExpansion(data: NzTreeNode | NzFormatEmitEvent): void {
    const node = data instanceof NzTreeNode ? data : data.node;
    if (node) {
      node.isExpanded = !node.isExpanded;
    }
  }

  activeNode(data: NzFormatEmitEvent): void {
    this.folderActivedId = data.node.origin['internalId'];
    this.navigateWithMergedParams(data.node.origin);
    this.handleClickEmailFolder.emit();
  }

  private navigateWithMergedParams(folder) {
    const currentParams = this.route.snapshot.queryParams;
    const newParams = {
      status: 'INPROGRESS',
      externalId: folder.internalId,
      taskTypeID: null,
      taskStatus: null,
      conversationLogId: null,
      taskId: null,
      conversationId: null
    };
    const mergedParams = { ...currentParams, ...newParams };
    this.router.navigate(['messages'], {
      relativeTo: this.route,
      queryParams: mergedParams,
      queryParamsHandling: 'merge'
    });
  }

  private setActiveItem(externalId: string) {
    for (let i = 0; i < this.nestedFoldersDisplay.length; i++) {
      const parents = [this.nestedFoldersDisplay[i]];
      let stack = [...this.nestedFoldersDisplay[i].children];
      while (stack.length > 0) {
        let childNode = stack.pop();
        if (externalId === childNode.internalId) {
          parents.forEach((parent) => {
            parent.expanded = true;
          });
          return;
        }
        parents.push(childNode);
        stack.push(...childNode.children);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
