import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import {
  ICalendarEvent,
  PopUpBulkCreateTasks
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { Subject, takeUntil } from 'rxjs';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { TaskCreate } from '@shared/types/task.interface';

@Component({
  selector: 'create-multi-tasks-popup',
  templateUrl: './create-multi-tasks-popup.component.html',
  styleUrls: ['./create-multi-tasks-popup.component.scss']
})
export class CreateMultiTasksPopupComponent implements OnInit, OnDestroy {
  @Input() listEvents: ICalendarEvent[];
  @Input() showBackBtn: boolean = false;
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onBack: EventEmitter<void> = new EventEmitter<void>();
  @Output() onNext: EventEmitter<TaskCreate> = new EventEmitter<TaskCreate>();
  public statePopup: PopUpBulkCreateTasks;
  private destroy$ = new Subject<void>();
  public readonly createTaskFrom = CreateTaskByCateOpenFrom;
  public readonly typePopup = PopUpBulkCreateTasks;
  public configs: IConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      showDropdown: true
    }
  };

  constructor(private _calendarService: CalendarService) {}

  ngOnInit(): void {
    this._calendarService
      .getPopupBulkCreateTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.statePopup = res;
      });
  }

  public handleCancel() {
    this.onCancel.emit();
  }

  public handleBack() {
    this.onBack.emit();
  }

  public handleNext(data: TaskCreate) {
    this.onNext.emit(data);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
