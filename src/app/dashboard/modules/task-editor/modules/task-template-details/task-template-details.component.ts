import { UserService } from './../../../../../services/user.service';
import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Subject,
  concatMap,
  filter,
  first,
  map,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import { TaskTemplateService } from './services/task-template.service';
import { TaskTemplateApiService } from './services/task-template-api.service';
import {
  ECalendarEvent,
  EComponentTypes,
  ESelectStepType,
  EStepAction,
  EStepType,
  ETaskTemplateStatus,
  PopUpEnum
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { IHelpDocument } from '@/app/dashboard/modules/task-editor/interfaces/help-document.interface';
import { StepManagementService } from './modules/task-template-details-content/services/step-management.service';
import {
  CALENDAR_EVENTS,
  COMMUNICATION_STEPS,
  PROPERTY_TREE_ACTIONS,
  RENT_MANAGER
} from '@/app/dashboard/modules/task-editor/constants/help-document.constants';
import { EHelpDocumentTitle } from '@/app/dashboard/modules/task-editor/enums/help-document.enum';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { PermissionService } from '@services/permission.service';
import { TemplateTreeService } from './modules/task-template-details-content/services/template-tree.service';
import { CanComponentDeactivate } from './modules/task-template-details-content/guard/save-change.guard';
import { LoadingService } from '@services/loading.service';
import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { LocalStorageService } from '@services/local.storage';
import { SharedService } from '@services/shared.service';
import { UserTypeEnum } from '@shared/enum/user.enum';
import { TaskTemplateHelper } from './helper/task-template.helper';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { TreeNodeOptions } from './modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import { ITaskTemplate } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { CommunicationStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/communication-step-form.service';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'task-template-details',
  templateUrl: './task-template-details.component.html',
  styleUrls: ['./task-template-details.component.scss']
})
export class TaskTemplateDetailsComponent
  implements OnInit, OnDestroy, CanComponentDeactivate
{
  private unsubscribe = new Subject<void>();
  public isShowPopupHelpDocument: PopUpEnum;
  public PopUpEnum = PopUpEnum;
  public helpDocument: IHelpDocument[];
  public helpDocumentTitle: EHelpDocumentTitle;
  public selectedStepType: ESelectStepType | EStepType;
  public selectedHelpDocumentStepType:
    | EStepAction
    | ECalendarEvent
    | EComponentTypes;
  public isDisable: boolean = false;
  public isTreeChanged: boolean = false;
  public isLoading: boolean = false;
  public isError: boolean = false;
  public isInvalidDynamicParam: boolean = false;
  public isErrorShaking: boolean = false;
  public timeOut: NodeJS.Timeout;
  private currentAgencyId: string = null;
  public canEdit: boolean = false;
  public isConsoleUser: boolean = false;
  public userType: string = '';

  get isConsole() {
    return this.taskEditorService.isConsoleSettings;
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private taskTemplateApiService: TaskTemplateApiService,
    private taskEditorService: TaskEditorService,
    private stepManagementService: StepManagementService,
    private agencyDashboardService: AgencyDashboardService,
    public permissionService: PermissionService,
    public loadingService: LoadingService,
    private templateTreeService: TemplateTreeService,
    public injector: Injector,
    private localStorageService: LocalStorageService,
    private taskTemplateService: TaskTemplateService,
    private taskEditorApiService: TaskEditorApiService,
    private userService: UserService,
    public sharedService: SharedService,
    private agencyService: AgencyService,
    private communicationFormService: CommunicationStepFormService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((user) => {
        this.userType = user.type;
      });
    this.isConsoleUser = this.sharedService.isConsoleUsers();
    this.loadingService.onLoading();
    this.getTaskTemplate();
    this.taskEditorService
      .getPopupTaskEditorState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((state) => {
        this.isShowPopupHelpDocument = state;
      });

    this.onSelectedStepChange();

    this.stepManagementService.selectedHelpDocumentStepType$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((helpDocumentStepType) => {
        this.selectedHelpDocumentStepType = helpDocumentStepType;
      });
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs) {
          if (this.isConsoleUser && this.userType === UserTypeEnum.ADMIN) {
            this.isDisable = false;
            this.canEdit = true;
          } else {
            this.isDisable = this.taskEditorService.checkToDisableTaskEditor(
              rs.addOns || []
            );
            this.canEdit = this.permissionService.hasFunction(
              'TASK_EDITOR.TASKS.EDIT'
            );
          }
        }
      });

    this.taskTemplateService.taskTemplate$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((template) => !!template?.crmSystemId)
      )
      .subscribe((template) => {
        this.taskEditorApiService
          .getCalendarEvent(template.crmSystemId)
          .subscribe((res) => {
            this.taskEditorApiService.calendarEventType.next(res);
            const calendarEventType = JSON.parse(
              this.localStorageService.getValue('calendarEventType') || '{}'
            );
            calendarEventType[template.crmSystemId] = res;
            this.localStorageService.setValue(
              'calendarEventType',
              JSON.stringify(calendarEventType)
            );
          });
      });

    this.handleOpenSaveChangePopup();
    this.handleCheckError();
    this.handleNavigateWhenChangeAgency();
  }

  public handleClick() {
    console.log(this.currentAgencyId, 'currenrt');
  }

  private onSelectedStepChange() {
    const firstCreate$ = this.taskTemplateService.taskTemplate$.pipe(
      map((template) => template?.template?.hasCreateFirstCommunicationStep),
      first(Boolean)
    );

    const customData = (
      taskTemplate: ITaskTemplate,
      currentTemplateTree: TreeNodeOptions[]
    ) => {
      const template = TaskTemplateHelper.treeViewToTemplate({
        ...taskTemplate.template,
        data: currentTemplateTree
      });

      let dataUpdate = {
        agencyId: taskTemplate.agencyId,
        template: {
          ...template,
          hasCreateFirstCommunicationStep: true
        },
        status: taskTemplate.status
      };
      return dataUpdate;
    };

    this.stepManagementService.selectedStepTypeValue$
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((stepType) => {
          return this.taskTemplateService.taskTemplate$.pipe(
            tap((taskTemplate) => {
              this.selectedStepType = stepType;
              this.setCurrentHelpDocument(stepType, taskTemplate?.crmSystemKey);
            }),
            filter(
              () =>
                stepType === EStepType.COMMUNICATE &&
                !this.communicationFormService.getSelectedStep()
            ),
            switchMap((taskTemplate) => {
              return this.templateTreeService.currentTemplateTree$.pipe(
                takeUntil(this.unsubscribe),
                takeUntil(firstCreate$),
                take(1),
                map((currentTemplateTree) =>
                  customData(taskTemplate, currentTemplateTree)
                ),
                concatMap((dataUpdate) => {
                  return this.taskTemplateService.updateTaskTemplate(
                    dataUpdate,
                    this.isConsole
                  );
                })
              );
            })
          );
        })
      )
      .subscribe((res) => {
        if (res.status === ETaskTemplateStatus.PUBLISHED) {
          this.agencyService.refreshListTaskData();
        }
        this.taskTemplateService.setTaskTemplate(res);
      });
  }

  handleCheckError(): void {
    this.templateTreeService
      .handleDisabledSaveChangeBtn()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isInvalidDynamicParam = res;
      });
    this.templateTreeService.saveChangeError$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.isError = res.isError;
          if (this.isError) {
            this.isErrorShaking = true;
            if (!!this.timeOut) {
              clearTimeout(this.timeOut);
            }
            this.timeOut = setTimeout(() => {
              this.isErrorShaking = false;
            }, 500);
          }
        }
      });
  }

  handleOpenSaveChangePopup() {
    this.templateTreeService
      .isTreeChanged()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isTreeChanged = res;
      });
  }

  getTaskTemplate() {
    this.activatedRoute.params
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((res) => {
          return this.taskTemplateApiService.getTaskTemplateDetail(
            res['taskTemplateId']
          );
        })
      )
      .subscribe((res) => {
        if (res) {
          this.taskTemplateService.setTaskTemplate(res);
          this.loadingService.stopLoading();
        }
      });
  }

  handleClosePopup() {
    this.taskEditorService.setPopupTaskEditorState(null);
  }

  setCurrentHelpDocument(
    selectedStepType: ESelectStepType | EStepType,
    crmSystemKey: ECRMSystem
  ) {
    let helpDocuments: IHelpDocument[] = [];
    let helpDocumentTitle: EHelpDocumentTitle;
    switch (selectedStepType) {
      case ESelectStepType.COMMUNICATION_STEP:
        helpDocuments = JSON.parse(JSON.stringify(COMMUNICATION_STEPS));
        helpDocumentTitle = EHelpDocumentTitle.COMMUNICATION_STEPS;
        break;
      case ESelectStepType.PROPERTY_TREE_ACTION:
        helpDocuments = JSON.parse(JSON.stringify(PROPERTY_TREE_ACTIONS));
        helpDocumentTitle = EHelpDocumentTitle.PROPERTY_TREE_ACTIONS;
        break;
      case ESelectStepType.CALENDAR_EVENT:
        helpDocuments = JSON.parse(JSON.stringify(CALENDAR_EVENTS));
        helpDocumentTitle = EHelpDocumentTitle.CALENDAR_EVENTS;
        break;
      case ESelectStepType.RENT_MANAGER_ACTION:
        helpDocuments = JSON.parse(JSON.stringify(RENT_MANAGER));
        helpDocumentTitle = EHelpDocumentTitle.RENT_MANAGER;
        break;
      default:
        helpDocuments = JSON.parse(JSON.stringify(COMMUNICATION_STEPS));
        break;
    }

    this.helpDocumentTitle = helpDocumentTitle;
    this.helpDocument = crmSystemKey
      ? this._composeHelpDocument(helpDocuments, crmSystemKey)
      : helpDocuments;
  }

  private _composeHelpDocument(
    helpDocuments: IHelpDocument[],
    crmSystem: ECRMSystem
  ) {
    for (const helpDocument of helpDocuments) {
      helpDocument.steps = helpDocument.steps.filter(
        (step) => !step.crmSystem || step.crmSystem == crmSystem
      );
    }
    return helpDocuments;
  }

  checkDeactivate() {
    if (this.isTreeChanged) {
      this.templateTreeService.setSaveChangeError({
        isError: true
      });
      return false;
    }
    return true;
  }

  handleNavigateWhenChangeAgency() {
    this.activatedRoute.params
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((params) => {
        if (params && params['agencyId']) {
          if (
            this.currentAgencyId !== null &&
            this.currentAgencyId !== params['agencyId']
          ) {
            this.router.navigate([
              `dashboard/${params['agencyId']}/agency-settings/task-editor/list`
            ]);
          }
          this.currentAgencyId = params['agencyId'];
        }
      });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOut);
    this.templateTreeService.setSaveChangeError({ isError: false });
    this.templateTreeService.setIsLoadingSaveData(false);
    this.taskTemplateService.setTaskTemplate(null);
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
