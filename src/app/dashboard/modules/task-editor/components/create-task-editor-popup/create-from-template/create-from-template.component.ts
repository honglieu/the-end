import {
  Component,
  EventEmitter,
  Injector,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  filter,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { CompanyService } from '@services/company.service';
import { LoadingService } from '@services/loading.service';
import {
  CREATE_FROM_TEMPLATE,
  CREATE_TASK_EDITOR
} from '@services/messages.constants';
import { NavigatorService } from '@services/navigator.service';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import {
  EPropertyTreeContactType,
  ERentManagerContactType,
  ETaskTemplateStatus
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  ICrmSystem,
  ITaskTemplate
} from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { ConsoleTaskEditorApiService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/console/task-editor-api.console.service';
import { PortalTaskEditorApiService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/portal/task-editor-api.portal.service';
import { TaskEditorListViewService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/task-editor-list-view.service';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { DynamicFieldsGroupByCrm } from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'create-from-template',
  templateUrl: './create-from-template.component.html',
  styleUrls: ['./create-from-template.component.scss']
})
export class CreateFromTemplateComponent implements OnInit {
  @Input() visible: boolean;
  @Output() onCancel = new EventEmitter<boolean>();
  @Output() onBack = new EventEmitter<boolean>();

  public template$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public activeTemplate: number = null;
  public isSelectTemplate: boolean = false;
  public searchText: string = '';
  public searchNameTemplate: string = '';
  public isDisabled: boolean = false;
  private unsubscribe = new Subject<void>();
  public isPortalUser: boolean = true;
  public currentStatus: ETaskTemplateStatus = ETaskTemplateStatus.PUBLISHED;
  public pageIndex = 0;
  public pageSize = 10;
  public totalItems = 0;
  public titleModal: string = '';
  public listCrmSystem: ICrmSystem[] = [];
  public taskCrmImg: string = '';
  public crmSystemIdSelected: string = '';
  public crmSystemId: string = '';

  public templates: ITaskTemplate[] = [];
  private companyId: string;

  private createFromTemplateService:
    | PortalTaskEditorApiService
    | ConsoleTaskEditorApiService;

  get isConsole() {
    return this.taskEditorService.isConsoleSettings;
  }

  constructor(
    private navigatorService: NavigatorService,
    private readonly router: Router,
    private toastService: ToastrService,
    private consoleTaskEditorApiService: ConsoleTaskEditorApiService,
    private taskEditorListViewService: TaskEditorListViewService,
    private taskEditorService: TaskEditorService,
    private injector: Injector,
    private taskTemplateService: TaskTemplateService,
    public loadingService: LoadingService,
    private companyService: CompanyService
  ) {
    this.createFromTemplateService = this.isConsole
      ? injector.get(ConsoleTaskEditorApiService)
      : injector.get(PortalTaskEditorApiService);
  }

  ngOnInit(): void {
    this.taskEditorListViewService.crmSystemSelected$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((res) => Boolean(res))
      )
      .subscribe((res) => {
        this.crmSystemIdSelected = res;
      });
    this.loadTemplates();
  }

  loadTemplates() {
    combineLatest([
      this.companyService.getCurrentCompany(),
      this.taskEditorListViewService.crmSystemSelected$,
      this.companyService.getCurrentCompanyId()
    ])
      .pipe(
        switchMap(([company, selectedCrm, companyId]) => {
          this.companyId = this.isConsole ? null : companyId;
          this.crmSystemId = this.isConsole ? selectedCrm : company?.CRM;
          return this.getTemplatesData();
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe();
  }

  handleCancel() {
    this.onCancel.emit();
  }

  handleBack() {
    this.onBack.emit();
  }

  handleNext() {
    if (!this.activeTemplate) {
      this.isSelectTemplate = true;
      return;
    }
    this.isDisabled = true;

    const bodyPortal = {
      templateId: this.activeTemplate
    };

    const bodyConsole = {
      templateId: this.activeTemplate,
      crmSystemId: this.crmSystemIdSelected,
      constants: {
        sendTo: {
          [ECrmSystemId.PROPERTY_TREE]: Object.values(EPropertyTreeContactType),
          [ECrmSystemId.RENT_MANAGER]: Object.values(ERentManagerContactType)
        },
        dynamicFields: {
          [ECrmSystemId.PROPERTY_TREE]:
            DynamicFieldsGroupByCrm[ECrmSystemId.PROPERTY_TREE],
          [ECrmSystemId.RENT_MANAGER]:
            DynamicFieldsGroupByCrm[ECrmSystemId.RENT_MANAGER]
        }
      }
    };

    const body = this.isConsole ? bodyConsole : bodyPortal;

    this.createFromTemplateService.createNewTaskEditor(body).subscribe({
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

  handleSearch(value) {
    this.searchNameTemplate = value;
    this.searchText = value;
    this.refreshTemplateData();
  }

  handleSelectTemplate(id: number) {
    this.activeTemplate = id;
    this.isSelectTemplate = false;
  }

  onScroll() {
    if (this.pageSize < this.totalItems) {
      this.pageSize = this.pageSize * 2;
      this.refreshTemplateData();
    }
  }

  getTemplatesData() {
    this.loadingService.onLoading();
    return this.template$.asObservable().pipe(
      distinctUntilChanged((previous, current) => {
        if (!previous) return false;
        return previous.trim() === current.trim();
      }),
      debounceTime(500),
      switchMap(() => {
        const payload = {
          pageIndex: this.pageIndex,
          pageSize: this.pageSize,
          search: this.searchText,
          status: this.currentStatus,
          crmSystemId: this.crmSystemId,
          companyId: this.companyId
        };
        return this.consoleTaskEditorApiService.getListTaskEditor(payload);
      }),
      tap((res) => {
        this.templates = res.taskTemplates;
        if (!this.isConsole) {
          this.templates = this.templates.filter(
            (item) => item.crmSystemId === this.crmSystemId
          );
        }
        this.totalItems = res.totalItems;
        this.loadingService.stopLoading();
      }),
      takeUntil(this.unsubscribe)
    );
  }

  refreshTemplateData() {
    this.template$.next(this.searchText);
  }
}
