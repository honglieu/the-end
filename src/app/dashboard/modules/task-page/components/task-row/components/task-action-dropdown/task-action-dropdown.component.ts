import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { TaskStatusType } from '@shared/enum/task.enum';
import { SharedService } from '@services/shared.service';
import { POSITION_MAP } from '@services/constants';
import { ETaskMenuOption } from '@/app/dashboard/modules/task-page/enum/task.enum';
import {
  ITaskFolder,
  ITaskGroup
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import {
  NzContextMenuService,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import { EDataE2EConversation } from '@shared/enum/E2E.enum';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { SyncTaskActivityService } from '@services/sync-task-activity.service';

@Component({
  selector: 'task-action-dropdown',
  templateUrl: './task-action-dropdown.component.html',
  styleUrls: ['./task-action-dropdown.component.scss']
})
export class TaskActionDropdownComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('menu') dropdownMenu: NzDropdownMenuComponent;
  @Input() taskItem: ITaskRow;
  @Input() event: MouseEvent;
  @Output() menuChange = new EventEmitter<{
    task: ITaskRow;
    option: ETaskMenuOption | string;
    taskFolder?: ITaskFolder;
    taskGroup?: ITaskGroup;
  }>();

  private destroy$ = new Subject<void>();
  public menuDropDown = {
    createNewTask: true,
    moveToTask: true,
    forward: true,
    unread: false,
    resolve: true,
    reOpen: true,
    reportSpam: true,
    delete: true,
    urgent: true,
    saveToRentManager: false,
    exportTaskActivity: true
  };
  public readonly ETaskMenuOption = ETaskMenuOption;
  public menuPosition = [POSITION_MAP.right];
  public TaskStatusType = TaskStatusType;
  public taskFolders: ITaskFolder[];
  public isConsole: boolean = false;

  readonly EDataE2EConversation = EDataE2EConversation;
  private isRmEnvironment: boolean;
  public disableExportButton: boolean = false;
  constructor(
    private sharedService: SharedService,
    private nzContextMenuService: NzContextMenuService,
    private inboxSidebarService: InboxSidebarService,
    private syncTaskActivityService: SyncTaskActivityService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();

    this.menuDropDown.exportTaskActivity = !this.isRmEnvironment;

    this.inboxSidebarService.taskFolders$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((rs) => {
        this.taskFolders = rs;
      });
    this.syncTaskActivityService.exportingPDFFileTaskIds$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (taskIds) =>
          (this.disableExportButton = taskIds.includes(this.taskItem.id))
      });
  }

  ngAfterViewInit() {
    if (this.event && this.dropdownMenu) {
      this.nzContextMenuService.create(this.event, this.dropdownMenu);
    } else {
      this.menuChange.emit(null);
    }
  }

  handleMenu(
    option: ETaskMenuOption | string,
    taskFolder?: ITaskFolder,
    taskGroup?: ITaskGroup
  ) {
    this.menuChange.emit({
      task: this.taskItem,
      option,
      taskFolder,
      taskGroup
    });
    this.nzContextMenuService.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
