import { Component, Input, OnInit } from '@angular/core';
import { ReminderTimeDetail } from '@shared/types/routine-inspection.interface';
import { TrudiButtonReminderTimeStatus } from '@shared/enum/trudiButton.enum';

@Component({
  selector: 'reminder-time',
  templateUrl: './reminder-time.component.html',
  styleUrls: ['./reminder-time.component.scss']
})
export class ReminderTimeComponent implements OnInit {
  @Input() reminderTimes: ReminderTimeDetail[] = [];
  public reminderTimeStatus = TrudiButtonReminderTimeStatus;

  constructor() {}

  ngOnInit() {}
}
