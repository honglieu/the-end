import { Component, Input, OnInit } from '@angular/core';
import { CalendarFilterService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-filter/services/calendar-filter.service';

@Component({
  selector: 'event-name',
  templateUrl: './event-name.component.html',
  styleUrls: ['./event-name.component.scss']
})
export class EventNameComponent implements OnInit {
  @Input() isOverDeal = false;
  @Input() isEventCancelled: boolean = false;
  @Input() isEventClosed: boolean = false;
  @Input() currentRowData;

  constructor(private calendarFilterService: CalendarFilterService) {}

  ngOnInit(): void {}

  get searchText() {
    return this.calendarFilterService.searchText?.trim();
  }
}
