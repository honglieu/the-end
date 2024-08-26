import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Subject, distinctUntilChanged, filter, takeUntil } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { TaskService } from '@services/task.service';
import {
  TrudiButtonEnumStatus,
  TrudiButtonReminderTimeStatus
} from '@shared/enum/trudiButton.enum';
import {
  groupReminderTimesByTime,
  updateTrudiButtonReminderTimeStatus
} from '@shared/feature/function.feature';
import { ReminderTimeDetail } from '@shared/types/routine-inspection.interface';

@Component({
  template: `<div></div>`
})
export class TrudiStepButtonComponent implements OnInit, OnDestroy {
  @Input() model;

  @Output() onProcess = new EventEmitter<boolean>();
  @Output() onRefresh = new EventEmitter<boolean>();
  @Output() onSkip = new EventEmitter<boolean>();

  public unsubscribe = new Subject<void>();
  public reminderTimes: ReminderTimeDetail[];
  public trudiButtonReminderTimeStatus = TrudiButtonReminderTimeStatus;
  public trudiButtonEnum = TrudiButtonEnumStatus;

  constructor(
    public taskService: TaskService,
    public webSocketService: RxWebsocketService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {
    this.webSocketService.onSocketJob
      .pipe(
        filter((res) =>
          Boolean(
            res &&
              res.taskId === this.taskService.currentTask$.value?.id &&
              res.action === this.model.action
          )
        ),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        const { modelReminderTimes, reminderTimes, currentStatus } =
          updateTrudiButtonReminderTimeStatus(this.model, res);
        this.model.reminderTimes = modelReminderTimes;
        this.model.status = currentStatus;
        this.reminderTimes = reminderTimes;
      });
  }

  onChangeModel(changes: SimpleChanges) {
    if (changes['model']?.currentValue) {
      this.reminderTimes = groupReminderTimesByTime(this.model.reminderTimes);
    }
  }

  enableProcess() {
    if (
      [
        TrudiButtonEnumStatus.COMPLETED,
        TrudiButtonEnumStatus.SCHEDULED
      ].includes(this.model.status)
    )
      return;
    this.onProcess.emit(true);
  }

  refresh(event: Event) {
    event.stopPropagation();
    this.onRefresh.emit();
  }

  skip(event: Event) {
    event.stopPropagation();
    this.onSkip.emit();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
