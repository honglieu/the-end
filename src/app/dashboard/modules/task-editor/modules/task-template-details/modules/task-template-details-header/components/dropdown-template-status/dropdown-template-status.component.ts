import { Component, Injector, Input, OnInit } from '@angular/core';
import { Subject, switchMap, takeUntil, tap } from 'rxjs';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { ETaskTemplateStatus } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  TASK_ARCHIVED,
  TASK_MOVE_TO_DRAFT,
  TASK_PUBLISHED,
  TASK_TEMPLATE_ARCHIVED,
  TASK_TEMPLATE_MOVE_TO_DRAFT,
  TASK_TEMPLATE_PUBLISHED
} from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { ToastrService } from 'ngx-toastr';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { TemplateTreeService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/services/template-tree.service';
import { IReferenceTemplates } from '@/app/dashboard/modules/task-editor/shared/components/warning-unpublish-popup/warning-unpublish-popup.component';
import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';

@Component({
  selector: 'dropdown-template-status',
  templateUrl: './dropdown-template-status.component.html',
  styleUrls: ['./dropdown-template-status.component.scss']
})
export class DropdownTemplateStatusComponent implements OnInit {
  @Input() disabled: boolean = true;
  @Input() currentAgencyId: string = null;
  @Input() currentStatus: ETaskTemplateStatus = ETaskTemplateStatus.PUBLISHED;
  @Input() canEdit: boolean = false;
  private unsubscribe = new Subject<void>();
  public status: ETaskTemplateStatus;
  public isShowDropdownStatus: boolean = false;
  public isShowPublishedTaskTemplate: boolean = false;
  public isShowWarningUnpublishedTaskTemplate: boolean = false;
  public taskTemplates = [];
  public taskTemplateStatus = [
    { name: 'Published', value: ETaskTemplateStatus.PUBLISHED },
    { name: 'Draft', value: ETaskTemplateStatus.DRAFT },
    { name: 'Archived', value: ETaskTemplateStatus.ARCHIVED }
  ];
  public referenceTemplates: IReferenceTemplates[] = [];
  public taskState: ETaskTemplateStatus = ETaskTemplateStatus.DRAFT;
  readonly EActionShowMessageTooltip = EActionShowMessageTooltip;

  constructor(
    private toatrService: ToastrService,
    private agencyService: AgencyService,
    public injector: Injector,
    private taskEditorService: TaskEditorService,
    private taskEditorApiService: TaskEditorApiService,
    private templateTreeService: TemplateTreeService,
    private taskTemplateService: TaskTemplateService
  ) {}

  get isConsole() {
    return this.taskEditorService.isConsoleSettings;
  }

  ngOnInit(): void {
    this.taskTemplateService.taskTemplate$
      .pipe(
        takeUntil(this.unsubscribe),
        tap((res) => {
          if (res) {
            this.status = res.status;
            this.taskTemplates = [res];
          }
        }),
        switchMap((res) =>
          this.templateTreeService.handleDisabledSaveChangeBtn()
        )
      )
      .subscribe();
  }

  handlerPublishTask() {
    this.taskTemplateService
      .updateTaskTemplate(
        {
          status: ETaskTemplateStatus.PUBLISHED
        },
        this.isConsole
      )
      .subscribe((res) => {
        if (res) {
          this.agencyService.refreshListTaskData();
          this.isShowPublishedTaskTemplate = false;
          this.taskTemplateService.setTaskTemplate(res);
          this.handleToastByStatus(ETaskTemplateStatus.PUBLISHED);
        }
      });
  }

  handleClose() {
    this.isShowPublishedTaskTemplate = false;
    this.isShowWarningUnpublishedTaskTemplate = false;
  }

  onEditStatus(status: ETaskTemplateStatus, isDisabledItem) {
    if (isDisabledItem) {
      return;
    }
    // Ignore the case of selecting the current status
    if (status === this.status) {
      return;
    }

    if (status === ETaskTemplateStatus.PUBLISHED && !this.isConsole) {
      this.handlerPublishTask();
      this.onClickOutSide();
      return;
    }
    if (
      status === ETaskTemplateStatus.DRAFT ||
      status === ETaskTemplateStatus.ARCHIVED ||
      (status === ETaskTemplateStatus.PUBLISHED && this.isConsole)
    ) {
      this.taskState = status;
      const taskEditorItemsId = this.taskTemplates.map((item) => item.id);
      this.taskEditorApiService
        .referenceTemplates(taskEditorItemsId)
        .subscribe((res) => {
          this.referenceTemplates = res;
          const isHaveReferenceTemplates = res.some(
            (x) => x.referenceTemplates.length
          );
          if (
            isHaveReferenceTemplates &&
            this.currentStatus === ETaskTemplateStatus.PUBLISHED
          ) {
            this.isShowWarningUnpublishedTaskTemplate = true;
            return;
          } else {
            this.handleAction(status);
          }
        });
    }
    this.onClickOutSide();
  }

  handleAction(status) {
    this.taskTemplateService
      .updateTaskTemplate({ status }, this.isConsole)
      .subscribe((res) => {
        if (res) {
          this.handleToastByStatus(status);
          this.taskTemplateService.setTaskTemplate(res);
          this.isShowWarningUnpublishedTaskTemplate = false;
          this.agencyService.refreshListTopicData();
        }
      });
  }

  handleShowDropdownStatus() {
    if (this.disabled) return;
    this.isShowDropdownStatus = true;
  }

  onClickOutSide() {
    this.isShowDropdownStatus = false;
  }

  private handleToastByStatus(status: ETaskTemplateStatus) {
    switch (status) {
      case ETaskTemplateStatus.PUBLISHED:
        this.toatrService.success(
          this.isConsole ? TASK_TEMPLATE_PUBLISHED : TASK_PUBLISHED
        );
        break;
      case ETaskTemplateStatus.ARCHIVED:
        this.toatrService.success(
          this.isConsole ? TASK_TEMPLATE_ARCHIVED : TASK_ARCHIVED
        );
        break;
      default:
        this.toatrService.success(
          this.isConsole ? TASK_TEMPLATE_MOVE_TO_DRAFT : TASK_MOVE_TO_DRAFT
        );
        break;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
