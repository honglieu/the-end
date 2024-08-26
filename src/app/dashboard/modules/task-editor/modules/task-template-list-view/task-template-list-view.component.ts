import {
  Component,
  ComponentRef,
  OnInit,
  ViewChild,
  Injector,
  OnDestroy
} from '@angular/core';
import { Subject, filter, take, takeUntil, tap } from 'rxjs';
import { LoadingService } from '@services/loading.service';
import {
  ActivatedRoute,
  NavigationStart,
  Params,
  Router
} from '@angular/router';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import {
  EInboxFilterSelected,
  EMessageQueryType
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { isEqual } from 'lodash-es';
import { UPGRADE_YOUR_ACCOUNT } from '@services/constants';

import {
  ETaskTemplateStatus,
  EToolbarConfig,
  ETypeToolbar,
  PopUpEnum
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { IPaginationData } from '@trudi-ui';
import { ToastrService } from 'ngx-toastr';
import { TaskEditorToolbarComponent } from '@/app/dashboard/modules/task-editor/components/task-editor-toolbar/task-editor-toolbar.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  TASK_ARCHIVED,
  TASK_MOVE_TO_DRAFT,
  TASK_PUBLISHED,
  TASK_TEMPLATE_ARCHIVED,
  TASK_TEMPLATE_MOVE_TO_DRAFT,
  TASK_TEMPLATE_PUBLISHED
} from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { ITaskTemplate } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { PermissionService } from '@services/permission.service';
import { TrudiTableComponent } from '@trudi-ui';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { PortalTaskEditorApiService } from './services/portal/task-editor-api.portal.service';
import { TaskEditorListViewService } from './services/task-editor-list-view.service';
import { ConsoleTaskEditorApiService } from './services/console/task-editor-api.console.service';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { IReferenceTemplates } from '@/app/dashboard/modules/task-editor/shared/components/warning-unpublish-popup/warning-unpublish-popup.component';
import { CRMRegion } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { UserService } from '@services/user.service';
import { SharedService } from '@services/shared.service';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'task-template-list-view',
  templateUrl: './task-template-list-view.component.html',
  styleUrls: ['./task-template-list-view.component.scss']
})
@DestroyDecorator
export class TaskTemplateListViewComponent implements OnInit, OnDestroy {
  @ViewChild('trudiTable') trudiTable: TrudiTableComponent;
  private unsubscribe = new Subject<void>();
  public readonly UPGRADE_YOUR_ACCOUNT = UPGRADE_YOUR_ACCOUNT;
  public templates: ITaskTemplate[] | any = [];
  public totalItems: number;
  public totalPages: number;
  public currentPage: number;
  public pageIndex = 0;
  public taskEditorPaginationData: IPaginationData = {
    totalItems: 0,
    totalPages: 0,
    currentPage: 0
  };
  public pageSize: number = 100;
  public searchValue: string = '';
  public searchText: string = '';
  public currentStatus: ETaskTemplateStatus = ETaskTemplateStatus.PUBLISHED;
  private queryParams = {};
  private componentRef: ComponentRef<TaskEditorToolbarComponent>;
  private overlayRef: OverlayRef;
  public isLoadingAction = false;
  public isShowPopup: PopUpEnum;
  public PopUpEnum = PopUpEnum;
  public canDeactive: boolean = true;
  public isDisable: boolean = false;
  public isShowPopupPublishedTask: PopUpEnum;
  public tableColumns = [
    {
      key: 'name',
      label: 'Task name',
      width: '600px'
    },
    {
      key: 'crmSystem',
      label: 'CRM',
      width: '180px'
    },
    {
      key: 'updatedAt',
      label: 'Last updated',
      width: '180px'
    }
  ];
  public toolbarConfig = [
    {
      icon: 'iconMoveV2',
      label: EToolbarConfig.MoveToDraft,
      type: ETypeToolbar.MoveToDraft,
      action: () => {
        this.handleShowPopup(ETaskTemplateStatus.DRAFT);
        this.taskState = ETaskTemplateStatus.DRAFT;
      }
    },
    {
      icon: 'iconUploadV2',
      label: EToolbarConfig.Published,
      type: ETypeToolbar.Published,
      action: () => {
        this.isConsole
          ? this.handlePublishTemplateConsoleFlow()
          : this.handleConfirm();
      }
    },
    {
      icon: 'archive',
      label: EToolbarConfig.Archive,
      type: ETypeToolbar.Archive,
      action: () => {
        this.handleShowPopup(ETaskTemplateStatus.ARCHIVED);
        this.taskState = ETaskTemplateStatus.ARCHIVED;
      }
    },
    {
      icon: 'iconCloseV2',
      type: ETypeToolbar.Close,
      action: () => {
        this.handleClearSelected();
      }
    }
  ];
  public selectedIds: string[] = [];
  public selectedTemplates: ITaskTemplate[] = [];
  public isLoading: boolean = true;
  private taskEditorApiService:
    | PortalTaskEditorApiService
    | ConsoleTaskEditorApiService;
  get isConsole() {
    return this.taskEditorService.isConsoleSettings;
  }
  public taskState: ETaskTemplateStatus = ETaskTemplateStatus.DRAFT;
  public referenceTemplates: IReferenceTemplates[] = [];
  public listDefaultRegion: CRMRegion;
  public widthBrowser;
  public isConsoleUser: boolean = false;
  public userType: string = '';

  constructor(
    public loadingService: LoadingService,
    public taskEditorListViewService: TaskEditorListViewService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private agencyDashboardService: AgencyDashboardService,
    private toatrService: ToastrService,
    private overlay: Overlay,
    public permissionService: PermissionService,
    private dashboardApiService: DashboardApiService,
    public injector: Injector,
    private taskEditorService: TaskEditorService,
    private agencyDateFormatService: AgencyDateFormatService,
    private userService: UserService,
    private sharedService: SharedService,
    private companyService: CompanyService
  ) {
    this.taskEditorApiService = this.isConsole
      ? injector.get(ConsoleTaskEditorApiService)
      : injector.get(PortalTaskEditorApiService);
  }

  ngOnInit(): void {
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((user) => {
        this.userType = user.type;
      });
    if (this.isConsole) {
      this.tableColumns[0].label = 'Task template name';
    }
    this.loadingService.onLoading();
    this.taskEditorService.getPopupTaskEditorState().subscribe((state) => {
      this.isShowPopupPublishedTask = state;
    });
    this.taskEditorService.getPopupTaskEditorState().subscribe((state) => {
      this.isShowPopup = state;
    });

    this.router.events.pipe(takeUntil(this.unsubscribe)).subscribe((rs) => {
      if (rs instanceof NavigationStart) {
        this.taskEditorListViewService.setListToolbarConfig([]);
      }
    });

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((queryParams) => {
        const { status, search } = queryParams;
        this.searchValue = search;
        this.currentStatus = status;
        if (!queryParams[EMessageQueryType.MESSAGE_STATUS]) {
          this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: {
              ...queryParams,
              status: ETaskTemplateStatus.PUBLISHED
            }
          });
        }

        //reset page when changing status/inboxType
        if (Object.keys(queryParams).length > 0) {
          this.isLoading = true;
          this.searchText = queryParams[EInboxFilterSelected.SEARCH];
          if (this.checkQueryParam(queryParams)) {
            this.resetSelection();
            this.pageIndex = 0;
          }
          this.queryParams = queryParams;
          this.getDataTable(this.pageIndex, 100);
        }
      });

    this.taskEditorListViewService
      .getTaskEditorTemplate()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((templates) => {
        if (templates) {
          this.templates = [
            ...templates?.map((template) => {
              if (this.selectedIds.includes(template.id)) {
                template.checked = true;
              } else {
                template.checked = false;
              }

              return {
                ...template
              };
            })
          ];
          this.isLoading = false;
        }
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
          this.checkDisabledToolbarTaskEditor();
        }

        // TODO: Fix bug getRegions
        this.taskEditorListViewService
          .getTaskEditorTemplate()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((templates) => {
            if (templates) {
              this.templates = [
                ...templates?.map((template) => {
                  if (this.selectedIds.includes(template.id)) {
                    template.checked = true;
                  } else {
                    template.checked = false;
                  }

                  return {
                    ...template
                  };
                })
              ];
              this.isLoading = false;
            }
          });
      });
    this.taskEditorService
      .getListDefaultRegion()
      .pipe(
        takeUntil(this.unsubscribe),
        filter((res) => Boolean(res))
      )
      .subscribe((res) => {
        this.listDefaultRegion = res;
      });
    this.getBrowserWidth();

    window.addEventListener('resize', () => {
      this.getBrowserWidth();
    });
  }

  resetSelection() {
    this.selectedIds = [];
    this.selectedTemplates = [];
    this.trudiTable?.onAllChecked(false);
    this.handleClose();
  }

  getBrowserWidth() {
    this.widthBrowser =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;
    const find = this.tableColumns?.find((col) => col?.key === 'name');
    if (find) {
      find.width = this.widthBrowser <= 1390 ? '180px' : '600px';
      this.tableColumns = [
        find,
        ...this.tableColumns?.filter((col) => col.key !== 'name')
      ];
    }
  }

  handleClickTaskTemplate(data) {
    const routePrefix = this.isConsole
      ? 'dashboard/console-settings'
      : `dashboard/agency-settings`;
    const route = `${routePrefix}/task-editor/list/task-template/${data.id}`;
    this.router.navigate([route]);
  }

  checkQueryParam(newQueryParams: Params) {
    return !isEqual(this.queryParams, newQueryParams);
  }

  getDataTable(pageIndex: number, pageSize: number) {
    this.taskEditorApiService
      .getListTaskEditor({
        pageIndex: Number(pageIndex),
        pageSize: Number(pageSize),
        search: this.searchValue,
        status: this.currentStatus
      })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.agencyDateFormatService.dateFormatDayJS$
          .pipe(take(1))
          .subscribe((format) => {
            if (rs) {
              this.totalItems = rs.totalItems;
              this.totalPages = rs.totalPages;
              this.currentPage = rs.currentPage;
              const taskEditorList: ITaskTemplate[] = [
                ...rs?.taskTemplates.map((item) => {
                  return {
                    ...item,
                    updatedAt: `Updated ${this.agencyDateFormatService.formatTimezoneDate(
                      item?.updatedAt,
                      format
                    )}`
                  };
                })
              ];
              this.taskEditorListViewService.setTaskEditorTemplate(
                taskEditorList
              );
              this.checkPermission();

              this.taskEditorPaginationData = {
                totalItems: rs?.totalItems,
                totalPages: rs?.totalPages,
                currentPage: rs?.currentPage
              };
            }
          });
      });
  }

  checkPermission() {
    this.canDeactive = this.permissionService.hasFunction(
      this.isConsole
        ? 'TASK_EDITOR.TASK_TEMPLATES.TABS'
        : 'TASK_EDITOR.TASKS.TABS'
    );
  }

  handleCheckRow(value) {
    this.selectedIds = Array.from(value);
    this.selectedTemplates = this.templates
      .filter(
        (template) =>
          this.selectedIds.includes(template.id) &&
          !this.selectedTemplates.some(
            (existTemplate) => existTemplate.id === template.id
          )
      )
      .concat(
        ...this.selectedTemplates.filter((template) =>
          this.selectedIds.includes(template.id)
        )
      );
    this.templates = this.templates.map((template) => {
      if (this.selectedIds.includes(template.id)) {
        template.checked = true;
      } else {
        template.checked = false;
      }
      return template;
    });

    if (this.selectedIds.length) {
      this.taskEditorListViewService.getListToolbarTaskEditor(
        this.toolbarConfig,
        this.selectedIds
      );
      this.handleOpen();
    } else {
      this.handleClose();
    }
  }

  checkDisabledToolbarTaskEditor() {
    this.toolbarConfig = this.toolbarConfig.map((item) => ({
      ...item,
      disabled:
        ![ETypeToolbar.Close, ETypeToolbar.TaskSelected].includes(item.type) &&
        this.isDisable
    }));
  }

  handleChangePagination(data) {
    if (this.pageSize !== data.pageSize) {
      this.resetSelection();
      this.pageSize = data.pageSize;
    }
    this.pageIndex = data.pageIndex;
    this.getDataTable(data.pageIndex, data.pageSize);
  }

  isEmpty() {
    return this.templates?.length === 0 && !this.loadingService.isLoading.value;
  }

  private handlePublishTemplateConsoleFlow() {
    this.handleAction(ETaskTemplateStatus.PUBLISHED);
    this.isLoadingAction = true;
  }

  private handleShowPopup(status: ETaskTemplateStatus) {
    this.taskState = status;
    if (
      status === ETaskTemplateStatus.ARCHIVED ||
      status === ETaskTemplateStatus.DRAFT
    ) {
      this.taskEditorApiService
        .referenceTemplates(this.selectedIds)
        .subscribe((res) => {
          this.referenceTemplates = res;
          const isHaveReferenceTemplates = res.some(
            (x) => x.referenceTemplates.length
          );
          if (
            this.currentStatus === ETaskTemplateStatus.PUBLISHED &&
            isHaveReferenceTemplates
          ) {
            this.taskEditorService.setPopupTaskEditorState(
              PopUpEnum.PopupWarningUnpublish
            );
            return;
          } else {
            this.handleAction(status);
            this.isLoadingAction = true;
          }
        });
    } else
      this.taskEditorService.setPopupTaskEditorState(PopUpEnum.PopupPublished);
  }

  handleClosePopup() {
    this.taskEditorService.setPopupTaskEditorState(null);
  }

  handleConfirm() {
    const taskTemplates = this.selectedTemplates.map((item) => ({
      id: item.id,
      isAIDynamicParamValid: item.template?.isAIDynamicParamValid ?? true
    }));
    this.taskEditorApiService
      .changeTaskStatusMultipleTemplate(
        taskTemplates,
        ETaskTemplateStatus.PUBLISHED
      )
      .pipe(
        tap(() => {
          this.agencyDashboardService.refreshListTaskData();
          this.handleToastByStatus(ETaskTemplateStatus.PUBLISHED);
        })
      )
      .subscribe({
        next: () => {
          this.isLoading = true;
          this.resetSelection();
          this.taskEditorService.setPopupTaskEditorState(null);
          this.getDataTable(0, this.pageSize);
        },
        error: (res) => {
          this.handleClosePopup();
          this.toatrService.error(res?.error?.message);
        }
      });
  }
  private handleAction(status: ETaskTemplateStatus) {
    if (this.isLoadingAction) return;
    const taskTemplates = this.selectedTemplates.map((item) => ({
      id: item.id,
      isAIDynamicParamValid: item.template?.isAIDynamicParamValid ?? true
    }));
    this.taskEditorApiService
      .changeTaskStatusMultipleTemplate(taskTemplates, status)
      .pipe(
        tap(() => {
          if (
            this.selectedTemplates[0] &&
            this.selectedTemplates[0].status === ETaskTemplateStatus.PUBLISHED
          ) {
            this.agencyDashboardService.refreshListTaskData();
          }
          this.handleToastByStatus(status);
        })
      )
      .subscribe({
        next: () => {
          this.isLoading = true;
          this.resetSelection();
          this.taskEditorService.setPopupTaskEditorState(null);
          this.isLoadingAction = false;
          this.getDataTable(0, this.pageSize);
        },
        error: (res) => {
          this.handleClosePopup();
          this.toatrService.error(res?.error?.message);
        }
      });
  }

  toastByStatus(text: string) {
    const isMultiTasks = this.selectedIds.length > 1;
    const toastText = isMultiTasks
      ? this.isConsole
        ? text.replace('template', 'templates')
        : text.replace('Task', 'Tasks')
      : text;
    return this.toatrService.success(toastText);
  }

  private handleToastByStatus(status: ETaskTemplateStatus) {
    switch (status) {
      case ETaskTemplateStatus.PUBLISHED:
        this.toastByStatus(
          this.isConsole ? TASK_TEMPLATE_PUBLISHED : TASK_PUBLISHED
        );
        break;
      case ETaskTemplateStatus.ARCHIVED:
        this.toastByStatus(
          this.isConsole ? TASK_TEMPLATE_ARCHIVED : TASK_ARCHIVED
        );
        break;
      default:
        this.toastByStatus(
          this.isConsole ? TASK_TEMPLATE_MOVE_TO_DRAFT : TASK_MOVE_TO_DRAFT
        );
        break;
    }
  }

  private destroyToolbarInbox(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
    }
  }

  private attachToolbarTaskEditor(): void {
    this.destroyToolbarInbox();
    this.overlayRef = this.overlay.create();
    const componentPortal = new ComponentPortal(TaskEditorToolbarComponent);
    this.componentRef = this.overlayRef.attach(componentPortal);
  }

  private handleOpen(): void {
    if (!this.componentRef) {
      this.attachToolbarTaskEditor();
    }
  }

  private handleClose(): void {
    if (this.componentRef) {
      this.componentRef.instance.visible = false;
    }
  }
  private handleClearSelected() {
    this.selectedIds.splice(this.pageIndex * this.pageSize, this.pageSize);
    this.selectedTemplates.splice(
      this.pageIndex * this.pageSize,
      this.pageSize
    );
    this.trudiTable.onAllChecked(false);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.componentRef = null;
    this.destroyToolbarInbox();
  }
}
