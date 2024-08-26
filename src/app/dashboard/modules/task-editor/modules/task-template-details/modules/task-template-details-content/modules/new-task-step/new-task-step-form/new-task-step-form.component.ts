import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import dayjs from 'dayjs';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  first,
  switchMap,
  takeUntil
} from 'rxjs';
import { ETaskTemplateStatus } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  ITaskTemplate,
  TaskEditorTemplate
} from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { TaskTemplateApiService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template-api.service';
import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';
import { EDirectionSort } from '@shared/enum/trudi';
import { RegionInfo } from '@shared/types/agency.interface';
import { NewTaskStepFormService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/new-task-step-form.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';
import { StepManagementService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/step-management.service';
import { isEmpty, isEqual, values } from 'lodash-es';

export interface INewTaskStepForm {
  stepName?: string;
  newTaskTemplateId?: string;
}

@Component({
  selector: 'new-task-step-form',
  templateUrl: './new-task-step-form.component.html',
  styleUrls: ['./new-task-step-form.component.scss']
})
export class NewTaskStepFormComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() isDisableForm: boolean = false;
  @Input() currentAgencyId: string = '';
  @Input() regions: RegionInfo[] = [];
  @Input() isShowUpgradeMessage: boolean = false;
  public taskNameList = [];
  public taskNameListPrefill = [];
  private unsubscribe$ = new Subject<void>();
  public pageIndex = 0;
  public pageSize: number = 20;
  public searchText: string = '';
  public currentPage: number;
  public totalItems: number;
  itemSkeleton = { disabled: true };
  searchTerms = new Subject<string>();
  selectedTaskName;
  labelSkeleton: boolean = false;
  queryParam;
  preventBlur = false;
  readonly EActionShowMessageTooltip = EActionShowMessageTooltip;

  constructor(
    private newTaskStepFormService: NewTaskStepFormService,
    private taskEditorApiService: TaskEditorApiService,
    private taskTemplateApiService: TaskTemplateApiService,
    private agencyDateFormatService: AgencyDateFormatService,
    private stepManagementService: StepManagementService
  ) {}

  ngOnInit(): void {
    this.queryParam = {
      pageIndex: Number(this.pageIndex),
      pageSize: Number(this.pageSize),
      search: this.searchText,
      orderBy: 'name',
      order: EDirectionSort.ASC,
      status: ETaskTemplateStatus.PUBLISHED
    };

    this.newTaskStepForm?.valueChanges
      .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged(isEqual))
      .subscribe((res) => {
        this.stepManagementService.setIsEditingForm(
          !values(res).every(isEmpty)
        );
        this.selectedTaskName = this.taskNameList?.find(
          (item) => item?.id === res?.newTaskTemplateId
        );
      });

    this.searchTerms
      .asObservable()
      .pipe(
        debounceTime(500),
        takeUntil(this.unsubscribe$),
        switchMap((term) => {
          this.searchText =
            typeof term === 'undefined' && this.selectedTaskName
              ? this.selectedTaskName?.name?.trim()
              : term?.trim();
          return this.taskEditorApiService.getListTaskEditor({
            ...this.queryParam,
            search: this.searchText || ''
          });
        })
      )
      .subscribe({
        next: (taskEditorTemplate: TaskEditorTemplate) => {
          this.currentPage = 0;
          this.formatTaskList(taskEditorTemplate);
        },
        error: (err) => {
          this.taskNameList = [];
        }
      });
    this.getPrefillData();
  }

  getPrefillData() {
    if (this.taskTemplateId) {
      this.labelSkeleton = true;
      this.taskTemplateApiService
        .getTaskTemplateDetail(this.taskTemplateId)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((rs) => {
          if (rs) {
            this.agencyDateFormatService.dateFormatDayJS$
              .pipe(first(Boolean))
              .subscribe((format) => {
                const data = {
                  ...this.initialValue,
                  key: rs.id,
                  name: rs.name,
                  updatedAt: `Updated ${dayjs(rs?.updatedAt).format(format)}`
                };

                const { key, title, type, newTaskTemplateId, name } = data;
                const selectedTaskName = {
                  key,
                  id: key,
                  newTaskTemplateId,
                  name,
                  stepName: title,
                  type: type
                };
                this.selectedTaskName =
                  rs.status === ETaskTemplateStatus.PUBLISHED
                    ? selectedTaskName
                    : this.newTaskStepFormService.resetField(
                        'newTaskTemplateId'
                      );
                this.searchTerms.next(this.selectedTaskName?.name);
              });
          }
        });
    } else this.getTaskNameList(this.pageIndex, this.pageSize);
  }

  getTaskNameList(pageIndex: number, pageSize: number, search?: string) {
    combineLatest([
      this.taskEditorApiService.getListTaskEditor({
        pageIndex: Number(pageIndex),
        pageSize: Number(pageSize),
        search: search || this.searchText,
        agencyId: this.currentAgencyId,
        orderBy: 'name',
        order: EDirectionSort.ASC,
        status: ETaskTemplateStatus.PUBLISHED
      })
    ]).subscribe(([rs]) => {
      this.formatTaskList(rs);
    });
  }

  formatTaskList(rs) {
    if (rs) {
      this.labelSkeleton = false;
      this.currentPage = rs.currentPage;
      this.totalItems = rs.totalItems;
      this.agencyDateFormatService.dateFormatDayJS$
        .pipe(first(Boolean))
        .subscribe((format) => {
          const taskEditorList: ITaskTemplate[] = [
            ...rs?.taskTemplates?.map((item) => {
              return {
                ...item,
                updatedAt: `Updated ${dayjs(item?.updatedAt).format(format)}`
              };
            })
          ];

          this.taskNameList = [...this.taskNameList, ...taskEditorList].filter(
            (x) => !x.disabled
          );
        });
    } else this.taskNameList = [];
  }

  resetTaskList() {
    this.currentPage = 0;
    this.taskNameList = [];
    this.searchText = '';
    this.selectedTaskName = null;
  }

  onScrollToEnd() {
    const isOutOfItems = this.taskNameList.length >= this.totalItems;
    if (!isOutOfItems && !this.checkIsLoading()) {
      this.addSkeletonItems();
      this.currentPage++;
      this.getTaskNameList(this.currentPage, this.pageSize);
    }
  }

  addSkeletonItems() {
    this.taskNameList = [
      ...this.taskNameList,
      this.itemSkeleton,
      this.itemSkeleton
    ];
  }

  checkIsLoading() {
    return (
      this.taskNameList.length === 2 &&
      this.taskNameList[0] === this.itemSkeleton &&
      this.taskNameList[1] === this.itemSkeleton
    );
  }

  handleSearch(event) {
    this.taskNameList = [];
    this.addSkeletonItems();
    this.searchTerms.next(event.term);
  }

  searchFn = (searchText: string, item) => {
    if (Object.entries(item).length === 1) return true;
    return item.name?.toLowerCase().includes(searchText.toLowerCase());
  };

  get taskTemplateId() {
    return this.newTaskStepFormService.initialValue.value
      ? this.newTaskStepFormService.initialValue.value?.newTaskTemplateId
      : null;
  }

  get newTaskStepForm() {
    return this.newTaskStepFormService.newTaskStepForm;
  }
  get initialValue() {
    return this.newTaskStepFormService.initialValue.value;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
