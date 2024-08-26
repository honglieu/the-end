import { TrudiMultiSelectComponent } from '@trudi-ui';
import { Component, Injector, Input, OnInit, ViewChild } from '@angular/core';
import { RegionInfo } from '@shared/types/agency.interface';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ETaskTemplateStatus } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { EActionShowMessageTooltip } from '@shared/enum/share.enum';

@Component({
  selector: 'task-template-settings',
  templateUrl: './task-template-settings.component.html',
  styleUrls: ['./task-template-settings.component.scss']
})
export class TaskTemplateSettingsComponent implements OnInit {
  private unsubscribe = new Subject<void>();
  @ViewChild('regionsMultipleSelect', { static: false })
  trudiMultiSelectComponent: TrudiMultiSelectComponent;
  @Input() disabled: boolean = false;
  public regions: RegionInfo[] = [];
  public selectedValues = [];
  public selectedRegions = new FormControl([], [Validators.required]);
  public originSelectedRegions: string[] = [];
  public isShowSettingsModal: boolean = false;
  public isSaving: boolean = false;

  get isConsole() {
    return this.taskEditorService.isConsoleSettings;
  }
  public limitShowOption;
  readonly EActionShowMessageTooltip = EActionShowMessageTooltip;
  readonly CRMOptionShowLimit: Record<ECRMSystem, number> = {
    PROPERTY_TREE: 6,
    RENT_MANAGER: 7
  };

  constructor(
    private agencyService: AgencyService,
    public injector: Injector,
    private taskEditorService: TaskEditorService,
    private taskTemplateService: TaskTemplateService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.taskTemplateService.taskTemplate$,
      this.taskTemplateService.regions$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([taskTemplate, regions]) => {
        if (taskTemplate && taskTemplate.taskTemplateRegions && regions) {
          this.regions = regions;
          this.selectedRegions.setValue(
            taskTemplate.taskTemplateRegions
              .sort((a, b) => a.regionFullName.localeCompare(b.regionFullName))
              .map((region) => region.regionId)
          );
          this.limitShowOption =
            this.CRMOptionShowLimit[taskTemplate.crmSystemKey];
          this.originSelectedRegions = this.selectedRegions.value;
        }
      });

    this.selectedRegions.valueChanges.subscribe((value) => {
      this.selectedValues = this.regions.filter((rs) => value.includes(rs.id));
    });
  }

  handleCLickAllRegions() {
    if (this.selectedRegions.value.length) {
      this.selectedRegions.setValue([]);
    } else {
      this.trudiMultiSelectComponent.select.filter('');
      this.selectedRegions.setValue(this.regions.map((region) => region.id));
    }
  }

  handleClickSettings() {
    this.isShowSettingsModal = true;
  }

  handleSaveSettings() {
    if (this.selectedRegions.invalid) {
      this.selectedRegions.markAsTouched();
      return;
    }
    this.isSaving = true;
    this.selectedRegions.markAsUntouched();
    this.taskTemplateService
      .updateTaskTemplate(
        {
          regions: this.selectedRegions.value
        },
        this.isConsole
      )
      .subscribe((res) => {
        if (res) {
          this.isSaving = false;
          this.isShowSettingsModal = false;
          if (res.status === ETaskTemplateStatus.PUBLISHED) {
            this.agencyService.refreshListTaskData();
          }
          this.taskTemplateService.setTaskTemplate(res);
        }
      });
  }

  handleClose() {
    this.selectedRegions.markAsUntouched();
    this.selectedRegions.setValue(this.originSelectedRegions);
  }

  handleAfterClose() {
    this.isShowSettingsModal = false;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
