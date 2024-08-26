import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { TaskEditorService } from './services/task-editor.service';
import { CRMRegion } from './modules/task-template-details/interfaces/template-tree.interface';
@Component({
  selector: 'task-editor',
  templateUrl: './task-editor.component.html',
  styleUrls: ['./task-editor.component.scss']
})
export class TaskEditorComponent implements OnInit {
  private unsubscribe = new Subject<void>();

  constructor(
    private taskEditorService: TaskEditorService,
    private dashboardApiService: DashboardApiService
  ) {}
  ngOnInit(): void {
    this.dashboardApiService.getRegions(null).subscribe((res: CRMRegion) => {
      res && this.taskEditorService.setListDefaultRegion(res);
    });
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
