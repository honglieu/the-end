import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {
  ICalendarEvent,
  PopUpBulkCreateTasks
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { EEventType } from '@shared/enum/calendar.enum';

@Component({
  selector: 'checking-duplicates-bulk-create-task',
  templateUrl: './checking-duplicates-bulk-create-task.component.html',
  styleUrls: ['./checking-duplicates-bulk-create-task.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CheckingDuplicatesBulkCreateTaskComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() listEvents: ICalendarEvent[] = [];
  @Input() typeSelected: EEventType;
  @Input() displayBackButton: boolean = false;
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onNext: EventEmitter<void> = new EventEmitter<void>();
  public listCurrentEvents: ICalendarEvent[] = [];
  public listEventHasLinkedTask: ICalendarEvent[] = [];
  private totalEvents: number = 0;
  public subTitle: string = '';
  public warningInfo: string = '';
  public warningRemind: string = '';

  constructor(private _calendarService: CalendarService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listEvents']?.currentValue) {
      this.listCurrentEvents = changes['listEvents']?.currentValue;
      this.refreshDisplayData();
    }
    if (changes['typeSelected']?.currentValue) {
      this.listEventHasLinkedTask.forEach(
        (item) => (item.isDuplicateCreateTask = true)
      );
    }
  }

  private refreshDisplayData() {
    this.listEventHasLinkedTask = this.listCurrentEvents.filter(
      (item) => item.totalLinkedTask > 0
    );
    this.totalEvents =
      this.listCurrentEvents.length -
      this.listEventHasLinkedTask.filter(
        (item) => item.isDuplicateCreateTask === false
      ).length;
    this.subTitle = `${this.totalEvents} event${
      this.totalEvents >= 2 ? 's' : ''
    } selected`;
    this.warningInfo = `The following event${
      this.listEventHasLinkedTask.length >= 2 ? 's are' : ' is'
    } already linked to tasks`;
    this.warningRemind = `To avoid duplicate task${
      this.listEventHasLinkedTask.length >= 2 ? 's' : ''
    }, please unselect events from the list below before continuing`;
  }

  public handleCancel() {
    this.onCancel.emit();
  }

  public handleBack() {
    this._calendarService.setPopupBulkCreateTasks(
      PopUpBulkCreateTasks.CONFIRM_EVENT_TYPE
    );
  }

  public handleNext() {
    this.onNext.emit();
  }
}
