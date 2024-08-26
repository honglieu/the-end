import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LoadingService } from '@services/loading.service';
import { LoaderService } from '@services/loader.service';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-confirm-delete-taskname',
  templateUrl: './confirm-delete-taskname.component.html',
  styleUrls: ['./confirm-delete-taskname.component.scss']
})
export class ConfirmDeleteTaskNameComponent implements OnInit {
  @Input() taskId: string;
  @Output() isCloseModal = new EventEmitter<boolean>();

  private unsubscribe = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private loaderService: LoaderService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {}

  public isOpenModal(status: boolean) {
    this.isCloseModal.next(status);
  }

  onDelete() {
    if (!this.taskId) {
      return;
    }
    this.loadingService.onLoading();
    this.taskService
      .deleteTaskName(this.taskId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.isOpenModal(true);
          this.loadingService.stopLoading();
          this.unsubscribe.next();
          this.unsubscribe.complete();
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
