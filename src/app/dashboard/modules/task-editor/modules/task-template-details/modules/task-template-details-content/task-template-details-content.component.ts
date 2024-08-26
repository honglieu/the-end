import {
  Component,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { TemplateTreeService } from './services/template-tree.service';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { filter, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { TriggerMenuDirective } from '@shared/directives/trigger-menu.directive';
import { POSITION_MAP } from 'ng-zorro-antd/core/overlay';
import { StepManagementService } from './services/step-management.service';
import { TreeNodeOptions } from './components/tree-view/types/tree-node.interface';
import { TaskTemplateHelper } from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';
import { LoadingService } from '@services/loading.service';
import { catchError } from 'rxjs/operators';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { ETaskTemplateStatus } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { IndividualConfig, ToastrService } from 'ngx-toastr';
import { EditPublishedTaskToastComponent } from './components/edit-published-task-toast/edit-published-task-toast.component';
import { isEqual } from 'lodash-es';
import { ITaskTemplateRegion } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { CommunicationStepFormService } from './services/communication-step-form.service';

@Component({
  selector: 'task-template-details-content',
  templateUrl: './task-template-details-content.component.html',
  styleUrls: ['./task-template-details-content.component.scss']
})
export class TaskTemplateDetailsContentComponent implements OnInit, OnDestroy {
  @ViewChild('menu') menu: TriggerMenuDirective;
  @Input() disabled: boolean = false;
  @Input() canEdit: boolean = false;
  createMenuPosition = [POSITION_MAP.rightTop];
  showDrawer = false;
  private currentTemplateHeader: {
    status: ETaskTemplateStatus;
    name: string;
    taskTemplateRegions: ITaskTemplateRegion[];
  };
  private unsubscribe = new Subject<void>();
  public currentCrmLogo: string = '';
  currentTemplateTree: TreeNodeOptions[];

  private toastConfig: Partial<IndividualConfig> = {
    timeOut: 3000,
    toastComponent: EditPublishedTaskToastComponent,
    positionClass: 'toast-bottom-right',
    toastClass: 'edit-published-task-toast'
  };

  get isConsole() {
    return this.taskEditorService.isConsoleSettings;
  }

  constructor(
    private stepManagementService: StepManagementService,
    private templateTreeService: TemplateTreeService,
    public loadingService: LoadingService,
    public injector: Injector,
    private taskEditorService: TaskEditorService,
    private taskTemplateService: TaskTemplateService,
    private toastService: ToastrService,
    private communicationFormService: CommunicationStepFormService
  ) {}

  ngOnInit(): void {
    this.taskTemplateService.taskTemplate$
      .pipe(
        filter((template) => !!template),
        takeUntil(this.unsubscribe)
      )
      .subscribe((template) => {
        this.currentTemplateHeader = this.currentTemplateHeader ?? {
          status: template.status,
          name: template.name,
          taskTemplateRegions: template.taskTemplateRegions
        };
        const needCheckCrmConflict =
          !template.agencyId &&
          !!template?.parentCrmSystemId &&
          template?.status != ETaskTemplateStatus.PUBLISHED &&
          template.crmSystemId != template.parentCrmSystemId;
        this.templateTreeService.setOriginTemplateTree(
          template.template.data,
          needCheckCrmConflict
            ? { needCheckCrmConflict, crmSystemId: template?.crmSystemId }
            : null
        );
        this.templateTreeService.setCurrentTemplateTree(
          template.template.data,
          needCheckCrmConflict
            ? { needCheckCrmConflict, crmSystemId: template?.crmSystemId }
            : null
        );
      });

    this.templateTreeService.currentTemplateTree$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.currentTemplateTree = rs;
      });
    this.taskTemplateService.currentCrmLogoBS
      .asObservable()
      .subscribe((img) => {
        if (img) {
          this.currentCrmLogo = img;
        }
      });

    this.templateTreeService.saveChangeDataTree$
      .pipe(
        filter((isSave) => !!isSave),
        switchMap(() =>
          this.taskTemplateService.taskTemplate$.pipe(
            filter((template) => {
              const templateHeader = {
                status: template.status,
                name: template.name,
                taskTemplateRegions: template.taskTemplateRegions
              };
              const isChangeTemplate =
                !!template &&
                isEqual(this.currentTemplateHeader, templateHeader);
              this.currentTemplateHeader = templateHeader;
              return isChangeTemplate;
            }),
            tap(async (template) => {
              this.templateTreeService.performValidateTemplate(
                template?.crmSystemKey
              );
            }),
            filter(() => {
              const errorNodes = this.templateTreeService.getErrorNode();
              return !errorNodes?.length;
            }),
            map((template) => {
              template.template = TaskTemplateHelper.treeViewToTemplate({
                ...template.template,
                data: this.currentTemplateTree
              });
              return template;
            }),
            switchMap((template) => {
              let inputToUpdate = {
                template: template.template,
                status: template.status
              };
              if (
                template?.crmSystemId !== template?.parentCrmSystemId &&
                template?.parentCrmSystemId
              ) {
                inputToUpdate.template.isTemplateValid = true;
              }

              return this.taskTemplateService
                .updateTaskTemplate(inputToUpdate, this.isConsole)
                .pipe(
                  tap(({ status }) => {
                    if (
                      status === inputToUpdate.status &&
                      status === ETaskTemplateStatus.PUBLISHED
                    ) {
                      this.toastService.show(
                        'Only future tasks will see these changes',
                        '',
                        this.toastConfig
                      );
                    }
                  }),
                  catchError(() => {
                    return [];
                  })
                );
            }),
            catchError((error) => {
              this.templateTreeService.setErrorNode(error);
              return [];
            })
          )
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        const template = TaskTemplateHelper.templateToTreeView(res.template);
        this.templateTreeService.setOriginTemplateTree(template.data);
        this.templateTreeService.setCurrentTemplateTree(template.data);
        this.templateTreeService.setSaveChangeError({ isError: false });
        this.templateTreeService.setIsLoadingSaveData(false);
        this.templateTreeService.setSaveChangeDataTree(false);
        this.communicationFormService.isDisabledAddStep.next(false);
        this.communicationFormService.fileAttach.next([]);
      });
  }

  handleOpenDrawer() {
    this.stepManagementService.handleSelect(true);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.templateTreeService.setCurrentTemplateTree([]);
    this.templateTreeService.setOriginTemplateTree([]);
  }
}
