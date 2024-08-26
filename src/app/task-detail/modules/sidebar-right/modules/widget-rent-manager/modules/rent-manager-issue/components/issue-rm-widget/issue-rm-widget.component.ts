import { Component, OnInit } from '@angular/core';
import { RMWidgetDataField } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { Subject, takeUntil } from 'rxjs';
import { IRentManagerIssue } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { ERentManagerIssuePopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/popup-management.service';
import { RentManagerIssueApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-api.service';
import { ToastrService } from 'ngx-toastr';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'issue-rm-widget',
  templateUrl: './issue-rm-widget.component.html',
  styleUrls: ['./issue-rm-widget.component.scss']
})
export class IssueRmWidgetComponent implements OnInit {
  private unsubscribe: Subject<void> = new Subject<void>();
  public rmIssues: IRentManagerIssue[] = [];

  constructor(
    private taskService: TaskService,
    private widgetRMService: WidgetRMService,
    private rentManagerIssueFormService: RentManagerIssueFormService,
    private popupManagementService: PopupManagementService,
    private toastrService: ToastrService,
    private rentManagerIssueApiService: RentManagerIssueApiService
  ) {}

  ngOnInit(): void {
    this.widgetRMService
      .getRMWidgetStateByType(RMWidgetDataField.RM_ISSUES)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.rmIssues = res.sort((a, b) => {
            try {
              const timeA = new Date(a.details.createdAt);
              const timeB = new Date(b.details.createdAt);
              return timeB.getTime() - timeA.getTime();
            } catch {
              return 0;
            }
          }) as IRentManagerIssue[];
        }
      });
  }

  handleClickRmIssue(data: IRentManagerIssue) {
    this.rentManagerIssueFormService.initData(data).buildForm();
    this.popupManagementService.setCurrentPopup(
      ERentManagerIssuePopup.RM_ISSUE_POPUP
    );
  }

  handleRetrySyncRmIssue(data: IRentManagerIssue) {
    const updatedRmIssues = this.widgetRMService.rmIssues.value.map(
      (rmIssue) => {
        if (rmIssue.id === data.id) {
          return {
            ...rmIssue,
            syncStatus: ESyncStatus.INPROGRESS,
            syncDate: new Date()
          };
        }
        return rmIssue;
      }
    );
    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.RM_ISSUES,
      'UPDATE',
      updatedRmIssues
    );

    this.rentManagerIssueApiService
      .retryRmIssue(data.id, this.taskService.currentTaskId$.value)
      .subscribe({
        next: (res) => {
          if (res) {
            const updatedRmIssues = this.widgetRMService.rmIssues.value.map(
              (rmIssue) => {
                return rmIssue.id === res.id ? res : rmIssue;
              }
            );
            this.widgetRMService.setRMWidgetStateByType(
              RMWidgetDataField.RM_ISSUES,
              'UPDATE',
              updatedRmIssues
            );
          }
        },
        error: (error) => {
          const updatedRmIssues = this.widgetRMService.rmIssues.value.map(
            (rmIssue) => {
              if (rmIssue.id === data.id) {
                return {
                  ...rmIssue,
                  syncStatus: ESyncStatus.FAILED,
                  syncDate: new Date()
                };
              }
              return rmIssue;
            }
          );
          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.RM_ISSUES,
            'UPDATE',
            updatedRmIssues
          );
          this.toastrService.error(error?.message);
        }
      });
  }

  handleCancelRmIssue(data: IRentManagerIssue) {
    this.rentManagerIssueApiService
      .removeRmIssue(data.id, this.taskService.currentTaskId$.value)
      .subscribe({
        next: (res) => {
          const updatedRmIssues = this.widgetRMService.rmIssues.value.map(
            (rmIssue) => {
              return res.id === rmIssue.id ? res : rmIssue;
            }
          );
          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.RM_ISSUES,
            'UPDATE',
            updatedRmIssues
          );
        },
        error: (error) => {
          this.toastrService.error(error?.message);
        }
      });
  }

  handleRemoveRmIssue(data: IRentManagerIssue) {
    this.rentManagerIssueApiService
      .removeRmIssue(data.id, this.taskService.currentTaskId$.value)
      .subscribe({
        next: (res) => {
          const updatedRmIssues = this.widgetRMService.rmIssues.value?.filter(
            (rmIssue) => {
              return rmIssue.id !== data.id;
            }
          );
          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.RM_ISSUES,
            'REMOVE',
            updatedRmIssues
          );
        },
        error: (error) => {
          this.toastrService.error(error?.message);
        }
      });
  }
}
