import { TrudiMultiSelectComponent } from '@trudi-ui';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { CompanyConsoleSettingService } from '@/app/console-setting/agencies/services/company-console-setting.service';
import { CompanyFormService } from '@/app/console-setting/agencies/services/company-form.service';
import { IAllRegionsData } from '@/app/console-setting/agencies/utils/console.type';
import { ETaskTemplateStatus } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  ITaskEditorTemplateRequest,
  ITaskTemplate,
  TaskEditorTemplate
} from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { ConsoleTaskEditorApiService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/console/task-editor-api.console.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';

@Component({
  selector: 'select-task-templates',
  templateUrl: './select-task-templates.component.html',
  styleUrls: ['./select-task-templates.component.scss']
})
export class SelectTaskTemplatesComponent implements OnInit, OnDestroy {
  @ViewChild('selectTaskTemplates', { static: false })
  trudiMultiSelect: TrudiMultiSelectComponent;

  private destroy$ = new Subject<void>();
  private taskTemplatesPayload$ =
    new BehaviorSubject<ITaskEditorTemplateRequest>({
      pageIndex: 0,
      pageSize: 1000,
      search: '',
      crmSystemId: null,
      status: ETaskTemplateStatus.PUBLISHED
    });
  public isLoading = false;
  public taskTemplates: ITaskTemplate[] = [];
  private allRegionsData: IAllRegionsData;

  constructor(
    private agencyService: AgencyService,
    private companyFormService: CompanyFormService,
    private companyConsoleSettingService: CompanyConsoleSettingService,
    private consoleTaskEditorApiService: ConsoleTaskEditorApiService
  ) {}

  ngOnInit(): void {
    this.subscribeAllRegionsData();
    this.subscribeSelectCrmChange();
    this.subscribeTaskTemplatePayload();
  }

  get companyFormGroup() {
    return this.companyFormService.companyForm;
  }

  get crmControl() {
    return this.companyFormGroup.get('CRM');
  }

  get tasksControl() {
    return this.companyFormGroup.get('tasks');
  }

  private subscribeAllRegionsData() {
    this.companyConsoleSettingService.allRegionsData$
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => Boolean(res))
      )
      .subscribe((res) => {
        this.allRegionsData = res;
      });
  }

  private subscribeSelectCrmChange() {
    if (Boolean(this.crmControl.value)) {
      this.tasksControl.enable();
    } else {
      this.tasksControl.disable();
    }

    this.crmControl.valueChanges
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res: string) => {
        this.tasksControl.setValue([]);
        if (res) {
          this.tasksControl.disabled && this.tasksControl.enable();
          this.taskTemplatesPayload$.next({
            ...this.taskTemplatesPayload$.value,
            pageIndex: 0,
            crmSystemId: res
          });
        } else {
          this.tasksControl.enabled && this.tasksControl.disable();
        }
      });
  }

  private subscribeTaskTemplatePayload() {
    this.taskTemplatesPayload$
      .pipe(
        takeUntil(this.destroy$),
        filter((payload) => Boolean(payload && payload.crmSystemId)),
        debounceTime(100),
        switchMap((payload) => {
          this.isLoading = true;
          return this.consoleTaskEditorApiService
            .getListTaskEditor(payload)
            .pipe(catchError(() => of(null)));
        })
      )
      .subscribe((res: TaskEditorTemplate) => {
        if (res) {
          this.isLoading = false;
          this.taskTemplates =
            res.currentPage === 0
              ? res.taskTemplates
              : [...this.taskTemplates, ...res.taskTemplates];
        }
      });
  }

  handleCLickSelectAll() {
    if (this.tasksControl.value.length) {
      this.tasksControl.setValue([]);
    } else {
      this.trudiMultiSelect.select.filter('');
      this.tasksControl.setValue(this.taskTemplates.map((region) => region.id));
    }
  }

  customSearchFn(searchTerm: string, item) {
    const searchTermLowerCase = searchTerm.toLowerCase();
    return (
      item?.name?.toLowerCase().includes(searchTermLowerCase) ||
      item?.taskTemplateRegions?.some(
        (taskTemplateRegion) =>
          taskTemplateRegion.regionFullName
            .toLowerCase()
            .includes(searchTermLowerCase) ||
          taskTemplateRegion.regionName
            .toLowerCase()
            .includes(searchTermLowerCase)
      )
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
