import { Component, OnInit } from '@angular/core';
import { EventsTabApiService } from '@shared/components/property-profile/components/events-tab/events-tab-service/events-tab-api.service';
import { PayloadCalendarEventType } from '@shared/components/property-profile/interface/property-profile.interface';
import { Subject, filter, takeUntil } from 'rxjs';
import { EFilterTabEventButton } from '@shared/components/property-profile/enums/property-profile.enum';
import { DEFAULT_PAGE_INDEX } from '@shared/components/property-profile/components/events-tab/utils/constans';
import { CompanyService } from '@services/company.service';
import { AgencyService as AgencyServiceDashboard } from '@/app/dashboard/services/agency.service';

@Component({
  selector: 'filter-events',
  templateUrl: './filter-events.component.html',
  styleUrls: ['./filter-events.component.scss']
})
export class FilterEventsComponent implements OnInit {
  public eventFilterButtons = [
    {
      id: EFilterTabEventButton.UPCOMING_EVENTS,
      label: 'Upcoming events',
      selected:
        !this.eventsTabApiService?.payloadCalendarEvent?.value?.isPreviousEvent
    },
    {
      id: EFilterTabEventButton.PREVIOUS_EVENTS,
      label: 'Previous events',
      selected:
        this.eventsTabApiService?.payloadCalendarEvent?.value?.isPreviousEvent
    }
  ];

  public isIncludeCancelAndClosedEvent: boolean =
    this.eventsTabApiService?.payloadCalendarEvent?.value
      ?.isIncludeCancelledAndCloseEvent;
  public currentPayloadEvent: PayloadCalendarEventType;
  private unsubscribe = new Subject<void>();
  public isRmEnvironment: boolean = false;

  constructor(
    private eventsTabApiService: EventsTabApiService,
    private companyService: CompanyService,
    private agencyService: AgencyServiceDashboard
  ) {}

  ngOnInit(): void {
    this.eventsTabApiService.payloadCalendarEvent$
      .pipe(
        takeUntil(this.unsubscribe),
        filter((payload) => !!payload?.propertyId)
      )
      .subscribe((payload) => {
        this.currentPayloadEvent = payload;
        const selectedButton = payload.isPreviousEvent
          ? EFilterTabEventButton.PREVIOUS_EVENTS
          : EFilterTabEventButton.UPCOMING_EVENTS;
        this.isIncludeCancelAndClosedEvent =
          payload.isIncludeCancelledAndCloseEvent;
        this.eventFilterButtons = this.eventFilterButtons.map((item) => {
          return {
            ...item,
            selected: selectedButton === item.id,
            isIncludeCancelAndClosedEvent:
              payload.isIncludeCancelledAndCloseEvent
          };
        });
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
  }

  handleclickFilterButton(id: EFilterTabEventButton) {
    if (this.eventFilterButtons.find((item) => item.id === id)?.selected)
      return;

    this.eventFilterButtons = this.eventFilterButtons.map((item) => {
      if (id === item.id) {
        this.eventsTabApiService.setPayloadCalendarEvent({
          ...this.currentPayloadEvent,
          isPreviousEvent: id === EFilterTabEventButton.PREVIOUS_EVENTS,
          pageIndex: DEFAULT_PAGE_INDEX,
          isIncludeCancelledAndCloseEvent: false
        });
      }
      return {
        ...item,
        selected: id === item.id,
        isIncludeCancelledAndCloseEvent: false
      };
    });
  }

  onCheckboxFilter(event) {
    this.eventsTabApiService.setPayloadCalendarEvent({
      ...this.currentPayloadEvent,
      isIncludeCancelledAndCloseEvent: event,
      pageIndex: DEFAULT_PAGE_INDEX
    });
    this.eventFilterButtons = this.eventFilterButtons.map((item) => {
      return {
        ...item,
        isIncludeCancelAndClosedEvent: event
      };
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
