import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import {
  EFolderType,
  IExpandFolder,
  ITaskFolder,
  ITaskFolderRoute
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EInboxQueryParams } from '@shared/enum/inbox.enum';
import { InboxExpandService } from '@/app/dashboard/modules/inbox/services/inbox-expand.service';

export enum EFolderAction {
  DELETE = 'DELETE',
  EDIT = 'EDIT',
  ADD_FOLDER = 'ADD_FOLDER'
}

export interface IDropdownAction {
  value: ITaskFolder;
  type: EFolderAction;
}

@Component({
  selector: 'inbox-sidebar-item',
  templateUrl: './inbox-sidebar-item.component.html',
  styleUrls: ['./inbox-sidebar-item.component.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class InboxSidebarItemComponent implements OnInit, OnDestroy {
  @Input() item: ITaskFolderRoute;
  @Output() onClickDropdown = new EventEmitter<IDropdownAction>();
  @Output() clickFolderIcon = new EventEmitter();
  @Output() dropInboxSidebarItem = new EventEmitter<ITaskFolder[]>();
  public currentTaskFolderId: string;
  public readonly EFolderAction = EFolderAction;
  public readonly EFolderType = EFolderType;
  public hasRedDot = false;
  public currentQueryParam: Params;
  public destroy$ = new Subject<void>();

  constructor(
    public inboxFilterService: InboxFilterService,
    @Inject(DOCUMENT) private document: Document,
    private activeRouter: ActivatedRoute,
    private inboxExpandService: InboxExpandService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.activeRouter.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentQueryParam = res;
        this.handleExpandFolder();
      });
    this.subscribeExpandMenu();
    this.subscribeCollapseMenu();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['item']?.currentValue) {
      this.hasRedDot =
        [EFolderType.MORE, EFolderType.TASKS].includes(this.item.type) &&
        this.item.children.some(
          (it) => it.unReadTaskCount > 0 || it.unreadInternalNoteCount > 0
        );
    }
  }

  subscribeCollapseMenu() {
    this.inboxExpandService.collapseFolder
      .pipe(takeUntil(this.destroy$))
      .subscribe((expandFolder: IExpandFolder[]) => {
        expandFolder.forEach((folder) => {
          if (folder.folderType === this.item.type) {
            this.item.isOpen = false;
            this.cdr.markForCheck();
          }
        });
      });
  }

  subscribeExpandMenu() {
    this.inboxExpandService.expandFolder
      .pipe(takeUntil(this.destroy$))
      .subscribe((expandFolder: IExpandFolder) => {
        if (expandFolder.folderType === this.item.type && !this.item.isOpen) {
          this.inboxExpandService.setExpandedFolder(expandFolder);
          this.item.isOpen = expandFolder.isOpen;
          this.cdr.markForCheck();
        }
      });
  }

  private handleExpandFolder() {
    const isExistAiAssistant = this.item.children?.findIndex(
      (it) => it.routerLink === EInboxQueryParams.AI_ASSISTANT
    );
    const isMatchesRoute = this.activeRouter.snapshot[
      '_routerState'
    ]?.url?.includes(EInboxQueryParams.AI_ASSISTANT);

    if (isExistAiAssistant >= 0 && isMatchesRoute) {
      this.item.isOpen = this.item.isOpen || isMatchesRoute;
    }
  }

  trackByItems(index, child) {
    return child.id;
  }

  public folderMenu(event: boolean, id: string = null) {
    if (!event && this.currentTaskFolderId === id) {
      this.currentTaskFolderId = null;
    }
  }

  public handleFolderAction(item: ITaskFolder, type: EFolderAction) {
    this.onClickDropdown.emit({
      value: item,
      type
    });
  }

  public clickFolderRightIcon() {
    this.clickFolderIcon.emit({
      value: null,
      type: EFolderAction.ADD_FOLDER
    });
  }
  handleStartDragFolder() {
    this.document.body.click();
  }
  getMergedQueryParams(param) {
    return {
      ...param,
      externalId: null,
      reminderType: null,
      status: param.taskTypeID ? null : param.status
    };
  }

  public dropped(event: CdkDragDrop<ITaskFolder[]>) {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    const newTaskFolders = event.container.data.map((it, index) => ({
      ...it,
      order: index + 1
    }));
    this.dropInboxSidebarItem.emit(newTaskFolders);
  }

  ngOnDestroy() {
    this.destroy$.next();
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
    } else if (event.target.closest('li')) {
      this.item.isOpen = !this.item.isOpen;
    }
  }
}
