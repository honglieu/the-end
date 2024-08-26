import { Component, OnInit } from '@angular/core';
import {
  ETaskTemplateStatus,
  PopUpEnum
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { Subject, takeUntil } from 'rxjs';
import { TrudiTab } from '@trudi-ui';
import { PermissionService } from '@services/permission.service';
import { TaskEditorListViewService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/task-editor-list-view.service';
import { UPGRADE_YOUR_ACCOUNT } from '@services/constants';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';
import { SharedService } from '@services/shared.service';
import { UserService } from '@services/user.service';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { CompanyService } from '@services/company.service';
import { SharedMessageViewService } from '@/app/services';

interface Permission {
  tab: string;
  create: string;
  edit: string;
}

const DEFAULT_CREATE_BTN_TEXT = {
  TASK_TEMPLATE: 'Task template',
  TASKS: 'Task'
};

const DEFAULT_PERMISSION = {
  [DEFAULT_CREATE_BTN_TEXT.TASK_TEMPLATE]: {
    tab: 'TASK_EDITOR.TASK_TEMPLATES.TABS',
    edit: 'TASK_EDITOR.TASK_TEMPLATES.EDIT',
    create: 'TASK_EDITOR.TASK_TEMPLATES.CREATE'
  },
  [DEFAULT_CREATE_BTN_TEXT.TASKS]: {
    tab: 'TASK_EDITOR.TASKS.TABS',
    edit: 'TASK_EDITOR.TASKS.EDIT',
    create: 'TASK_EDITOR.TASKS.CREATE'
  }
};

@Component({
  selector: 'task-editor-header',
  templateUrl: './task-editor-header.component.html',
  styleUrls: ['./task-editor-header.component.scss']
})
export class TaskEditorHeaderComponent implements OnInit {
  private unsubscribe = new Subject<void>();
  public readonly UPGRADE_YOUR_ACCOUNT = UPGRADE_YOUR_ACCOUNT;
  public isShowPopupCreateTask: PopUpEnum;
  public popupEnum = PopUpEnum;
  public isDisable: boolean = false;
  public inboxTabs: TrudiTab<unknown>[] = [
    {
      title: 'Published',
      link: '.',
      queryParam: {
        status: ETaskTemplateStatus.PUBLISHED
      }
    },
    {
      title: 'Draft',
      link: '.',
      queryParam: {
        status: ETaskTemplateStatus.DRAFT
      }
    },
    {
      title: 'Archived',
      link: '.',
      queryParam: {
        status: ETaskTemplateStatus.ARCHIVED
      }
    }
  ];
  public titleCreateTask: string = '';
  public permission: Permission;
  public actionShowMessageTooltip = EActionShowMessageTooltip;
  public isConsoleUser: boolean = false;
  public userType: string = '';

  constructor(
    public taskEditorListViewService: TaskEditorListViewService,
    public agencyDashboardService: AgencyDashboardService,
    public permissionService: PermissionService,
    private taskEditorService: TaskEditorService,
    private sharedService: SharedService,
    public userService: UserService,
    private companyService: CompanyService,
    private sharedMessageViewService: SharedMessageViewService
  ) {}

  get isConsole() {
    return this.taskEditorService.isConsoleSettings;
  }

  ngOnInit(): void {
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((user) => {
        this.userType = user.type;
      });
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    this.setDefaultValue(this.isConsole);
    this.taskEditorService
      .getPopupTaskEditorState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((state) => {
        this.isShowPopupCreateTask = state;
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs) {
          if (this.isConsoleUser && this.userType === UserTypeEnum.ADMIN) {
            this.isDisable = false;
          } else {
            this.isDisable = this.taskEditorService.checkToDisableTaskEditor(
              rs.addOns || []
            );
          }
        }
      });
  }

  handleChangeTab() {
    this.sharedMessageViewService.setIsSelectingMode(false);
  }
  setDefaultValue(isConsole: boolean) {
    this.titleCreateTask = isConsole
      ? DEFAULT_CREATE_BTN_TEXT.TASK_TEMPLATE
      : DEFAULT_CREATE_BTN_TEXT.TASKS;
    this.permission = DEFAULT_PERMISSION[this.titleCreateTask];
  }

  handleCreateNewTaskEditor() {
    this.taskEditorService.setPopupTaskEditorState(
      this.isConsole ? PopUpEnum.PopupSelectCRM : PopUpEnum.PopupCreateTask
    );
  }

  handleBack() {
    this.taskEditorService.setPopupTaskEditorState(PopUpEnum.PopupSelectCRM);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
