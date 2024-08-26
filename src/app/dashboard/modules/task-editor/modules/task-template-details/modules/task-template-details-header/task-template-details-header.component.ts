import {
  Component,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subject, takeUntil, filter } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { TrudiTextFieldComponent } from '@trudi-ui';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { FormControl, Validators } from '@angular/forms';
import { LoadingService } from '@/app/services/loading.service';
import {
  ETaskTemplateStatus,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { ConsoleTaskEditorApiService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/console/task-editor-api.console.service';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';
import { transition, trigger, useAnimation } from '@angular/animations';
import {
  closeMenu,
  openMenu
} from '@/app/dashboard/animation/triggerMenuAnimation';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import uuid4 from 'uuid4';
import { ETreeNodeState } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import { POSITION_MAP } from 'ng-zorro-antd/core/overlay';
import { TriggerMenuDirective } from '@/app/shared/directives/trigger-menu.directive';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { Router } from '@angular/router';

@Component({
  selector: 'task-template-details-header',
  templateUrl: './task-template-details-header.component.html',
  styleUrls: ['./task-template-details-header.component.scss'],
  animations: [
    trigger('menuAnimation', [
      transition(':enter', [useAnimation(openMenu)]),
      transition(':leave', [useAnimation(closeMenu)])
    ])
  ]
})
export class TaskTemplateDetailsHeaderComponent implements OnInit, OnDestroy {
  @ViewChild('trudiTextField') taskNameInputEl: TrudiTextFieldComponent;
  @Input() disabled: boolean = false;
  @Input() canEdit: boolean = false;

  @ViewChild('menu') menu: TriggerMenuDirective;
  private unsubscribe = new Subject<void>();
  public isEditingTplName = false;
  public isAddingTplTree = false;
  public ETypeElement = ETypeElement;
  public taskName = new FormControl('', [
    Validators.required,
    Validators.maxLength(75)
  ]);
  public originTaskName: string = '';
  public taskStatus = '';
  public paragraph = { rows: 1 };
  public taskCrmImg: string = '';
  readonly EActionShowMessageTooltip = EActionShowMessageTooltip;
  public createMenuPosition = [POSITION_MAP.bottomRight];

  constructor(
    private agencyService: AgencyService,
    private router: Router,
    public loadingService: LoadingService,
    private consoleTaskEditorApiService: ConsoleTaskEditorApiService,
    public injector: Injector,
    private taskEditorService: TaskEditorService,
    private taskTemplateService: TaskTemplateService,
    private templateTreeService: TemplateTreeService,
    private stepManagementService: StepManagementService
  ) {}

  get isConsole() {
    return this.taskEditorService.isConsoleSettings;
  }

  ngOnInit(): void {
    this.subscribeData();
    this.templateTreeService.isEditing$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isAddingTplTree = res;
      });
  }

  subscribeData() {
    this.taskTemplateService.taskTemplate$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((taskTemplate) => {
          return Boolean(taskTemplate);
        })
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((taskTemplate) => {
        this.assignCrmImageList(taskTemplate.crmSystemId);
        this.taskName.setValue(taskTemplate.name);
        this.originTaskName = this.taskName.value;
        this.taskStatus = taskTemplate.status;
      });
  }

  assignCrmImageList(crmSystemId) {
    this.consoleTaskEditorApiService
      .getCrmSystem()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((imgList) => {
        if (imgList?.length) {
          this.taskCrmImg = imgList.find((img) => {
            return img?.id === crmSystemId;
          })?.mediaLink;
          this.taskTemplateService.currentCrmLogoBS.next(this.taskCrmImg);
        }
      });
  }

  handleEditTaskName() {
    if (this.taskNameInputEl) {
      this.taskNameInputEl.inputElem.nativeElement.focus();
    }
    this.isEditingTplName = true;
  }

  handleOpenDrawer() {
    if (this.isAddingTplTree || this.disabled) return;
    this.stepManagementService.setTargetedNode(null);
    this.stepManagementService.handleSelect(true);
  }

  addNode(type: ETypeElement) {
    if (this.isAddingTplTree || this.disabled) return;
    const bottom = type === ETypeElement.DECISION;
    this.templateTreeService.addNode(
      type,
      {
        key: uuid4(),
        title: '',
        children: [],
        isLeaf: false,
        checked: false,
        disableCheckbox: true,
        disabled: false,
        expanded: true,
        icon: null,
        selectable: false,
        selected: false,
        edit: true,
        type,
        state: ETreeNodeState.DRAFT
      },
      bottom
    );
  }

  handleSaveTaskName() {
    if (this.taskName.invalid) {
      return;
    }
    this.isEditingTplName = false;
    this.isAddingTplTree = false;
    this.taskTemplateService
      .updateTaskTemplate(
        {
          name: this.taskName.value
        },
        this.isConsole
      )
      .subscribe((res) => {
        if (res) {
          this.taskTemplateService.setTaskTemplate(res);
          if (res.status === ETaskTemplateStatus.PUBLISHED) {
            this.agencyService.refreshListTaskData();
          }
        }
      });
  }

  handleCancelEditTaskName() {
    this.isEditingTplName = false;
    this.taskName.setValue(this.originTaskName);
  }

  handleBack() {
    const taskParam = this.isConsole ? `console-settings` : `agency-settings`;
    this.router.navigate([`dashboard/${taskParam}/task-editor/list`], {
      queryParams: { status: this.taskStatus }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
