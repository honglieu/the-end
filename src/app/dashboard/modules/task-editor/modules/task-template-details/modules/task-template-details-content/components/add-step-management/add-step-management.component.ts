import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskTemplateService } from '@/app/dashboard/modules/task-editor/modules/task-template-details/services/task-template.service';
import { Subject, filter, takeUntil, Subscription } from 'rxjs';
import { ECRMId } from '@shared/enum/share.enum';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'add-step-management',
  templateUrl: './add-step-management.component.html',
  styleUrls: ['./add-step-management.component.scss']
})
export class AddStepManagementComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject<void>();
  private subscription: Subscription;
  public CRMSystemName = ECRMSystem;
  public currentCompanyCRMSystemName: ECRMSystem;
  constructor(
    private taskTemplateService: TaskTemplateService,
    private taskEditorService: TaskEditorService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.subscription = this.getSubscription(
      this.taskEditorService.isConsoleSettings
    );
  }

  getSubscription(isConsole: boolean) {
    if (isConsole) {
      return this.taskTemplateService.taskTemplate$
        .pipe(
          takeUntil(this.unsubscribe),
          filter((res) => res && !!res.crmSystemId)
        )
        .subscribe((res) => {
          switch (res.crmSystemId) {
            case ECRMId.PROPERTY_TREE:
              this.currentCompanyCRMSystemName = ECRMSystem.PROPERTY_TREE;
              break;
            case ECRMId.RENT_MANAGER:
              this.currentCompanyCRMSystemName = ECRMSystem.RENT_MANAGER;
              break;
            default:
              break;
          }
        });
    } else {
      return this.companyService.currentCompanyCRMSystemName
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          this.currentCompanyCRMSystemName = res;
        });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }
}
