import { Router } from '@angular/router';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  Injector,
  ViewChild
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAX_TITLE_LENGTH } from '@services/constants';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {
  CREATE_FROM_TEMPLATE,
  CREATE_TASK_EDITOR
} from '@services/messages.constants';
import { NavigatorService } from '@services/navigator.service';
import { PortalCreateFromScratchService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/portal/create-from-scratch.portal.service';
import { ConsoleCreateFromScratchService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/console/create-from-scratch.console.service';
import { TaskEditorListViewService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/task-editor-list-view.service';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { CompanyService } from '@services/company.service';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
  selector: 'create-from-scratch',
  templateUrl: './create-from-scratch.component.html',
  styleUrls: ['./create-from-scratch.component.scss']
})
export class CreateFromScratchComponent implements OnInit {
  @ViewChild('ngSelect') ngSelect: NgSelectComponent;
  @Input() visible: boolean;
  @Output() onCancel = new EventEmitter<boolean>();
  @Output() onBack = new EventEmitter<boolean>();

  public myForm: FormGroup;
  private unsubscribe = new Subject<void>();
  public isSelectedAll: boolean = false;
  public checkSubmit: boolean = true;
  public isDisabled: boolean = false;
  public titleModal: string = '';
  public crmSystemId: string = '';
  public isSubmited: boolean = false;
  public currentCompanyName: ECRMSystem;
  skeletonItem = { disabled: true };

  readonly CRMOptionShowLimit: Record<ECRMSystem, number> = {
    PROPERTY_TREE: 6,
    RENT_MANAGER: 7
  };

  maxInputLength = MAX_TITLE_LENGTH;

  private createFromScratchService:
    | PortalCreateFromScratchService
    | ConsoleCreateFromScratchService;

  get isConsole() {
    return this.taskEditorService.isConsoleSettings;
  }

  constructor(
    private toastService: ToastrService,
    private readonly router: Router,
    private navigatorService: NavigatorService,
    private taskEditorListViewService: TaskEditorListViewService,
    private taskEditorService: TaskEditorService,
    private injector: Injector,
    private taskTemplateService: TaskTemplateService,
    private companyService: CompanyService
  ) {
    this.createFromScratchService = this.isConsole
      ? injector.get(ConsoleCreateFromScratchService)
      : injector.get(PortalCreateFromScratchService);
  }

  ngOnInit(): void {
    this.initForm();
    this.titleModal = this.isConsole
      ? 'Create task template'
      : 'Create new task';

    this.companyService.currentCompanyCRMSystemName
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.currentCompanyName = res;
        }
      });
    if (this.isConsole) {
      this.taskEditorListViewService.crmSystemSelected$
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((crmSystemSelected) => {
          if (crmSystemSelected) {
            this.crmSystemId = crmSystemSelected;
          }
        });
    }
  }

  initForm() {
    this.myForm = new FormGroup({
      taskName: new FormControl('', Validators.required)
    });
  }

  handleCancel() {
    this.onCancel.emit();
  }

  handleNext() {
    this.isSubmited = true;
    if (this.myForm.invalid) {
      return;
    }
    this.isDisabled = true;
    const payloadPortal = {
      name: this.taskName.value
    };

    const payLoadConsole = {
      name: this.taskName.value,
      crmSystemId: this.crmSystemId
    };

    const payload = this.isConsole ? payLoadConsole : payloadPortal;

    this.createFromScratchService.createNewTaskEditor(payload).subscribe({
      next: (res) => {
        if (res && res.id) {
          this.taskTemplateService.setTaskTemplate(res);
          this.navigatorService.setReturnUrl(this.router.url);
          const routePrefix = this.isConsole
            ? 'dashboard/console-settings'
            : `dashboard/agency-settings`;
          const route = `${routePrefix}/task-editor/list/task-template/${res.id}`;
          this.router.navigate([route]);
          if (this.isConsole) {
            this.toastService.success(CREATE_FROM_TEMPLATE);
          } else {
            this.toastService.success(CREATE_TASK_EDITOR);
          }
          this.handleCancel();
        }
      },
      error: (err) => {
        this.isDisabled = false;
        this.toastService.error(err.error.message);
      }
    });
  }

  handleBack() {
    this.onBack.emit();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  get taskName() {
    return this.myForm.get('taskName');
  }

  get limitShowOption() {
    return this.CRMOptionShowLimit[this.currentCompanyName];
  }
}
