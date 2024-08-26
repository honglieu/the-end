import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'filter-by-task-type',
  templateUrl: './filter-by-task-type.component.html',
  styleUrls: ['./filter-by-task-type.component.scss']
})
export class FilterByTaskTypeComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private inboxFilterService: InboxFilterService
  ) {}
  @Input() listTaskEditor;
  @Input() disabled: boolean;
  @Input() popoverPlacement: string;
  @Input() prefixIcon: string;

  selectedTaskEditorId: string[];
  private _destroy$ = new Subject<void>();

  ngOnInit() {
    this.inboxFilterService
      .getCurrentSelectedTaskEditorId()
      .pipe(takeUntil(this._destroy$))
      .subscribe((selectedTask) => {
        this.inboxFilterService.patchValueSelectedItem(
          'taskType',
          selectedTask.length
        );
      });

    this.selectedTaskEditorId = this.inboxFilterService
      .getCurrentSelectedTaskEditorId()
      .getValue();
  }

  handleValueChange($event) {
    this.inboxFilterService.setSelectedTaskEditorId($event);
    this.router.navigate([], {
      queryParams: { taskEditorId: $event, taskId: null },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
