import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import {
  ICalendarEvent,
  IInputToUpdateStatusCalendarEvent
} from '@/app/task-detail/modules/steps/calendar-event/utils/calendar-event.interface';

@Injectable({
  providedIn: 'root'
})
export class CalendarEventApiService {
  constructor(private apiService: ApiService) {}

  saveCalendarEvent(payload: ICalendarEvent) {
    return this.apiService.postAPI(
      conversations,
      'calendar-event/create-or-update-calendar-event',
      payload
    );
  }

  updateStatusCalendarEvent(payload: IInputToUpdateStatusCalendarEvent) {
    return this.apiService.postAPI(
      conversations,
      'calendar-event/update-status-calendar-event',
      payload
    );
  }
}
