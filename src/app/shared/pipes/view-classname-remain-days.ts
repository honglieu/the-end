import { Pipe, PipeTransform } from '@angular/core';
import { DEFAULT_CALENDAR_WIDGET_EXPIRED_DAYS } from '@services/constants';
import { EEventType } from '@shared/enum/calendar.enum';

@Pipe({ name: 'viewClassNameRemainDays' })
export class ViewClassNameRemainDaysPipe implements PipeTransform {
  transform(event, calendarWidgetExpiredDays) {
    const eventType = event?.eventType;
    const expiredDays =
      calendarWidgetExpiredDays?.[eventType || ''] ||
      DEFAULT_CALENDAR_WIDGET_EXPIRED_DAYS;
    if (
      (eventType === EEventType.CUSTOM_EVENT &&
        event?.expired < calendarWidgetExpiredDays?.[eventType || '']) ||
      (eventType !== EEventType.CUSTOM_EVENT && event?.expired <= expiredDays)
    ) {
      return 'event-expired';
    }

    return 'event-upcoming';
  }
}
