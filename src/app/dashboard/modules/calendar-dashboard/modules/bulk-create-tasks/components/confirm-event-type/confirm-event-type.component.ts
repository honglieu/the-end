import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  CountEventType,
  ICalendarEvent
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { EEventType } from '@shared/enum/calendar.enum';
import { IRadioButton } from '@trudi-ui';
import { EEventTypes, ERMEvents } from '@shared/enum/share.enum';
import { CalendarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendar.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'confirm-event-type',
  templateUrl: './confirm-event-type.component.html',
  styleUrls: ['./confirm-event-type.component.scss']
})
export class ConfirmEventTypeComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() listEvents: ICalendarEvent[];
  @Input() isAgencyRm: boolean;
  @Output() onNext: EventEmitter<EEventType> = new EventEmitter<EEventType>();
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  public listCountEventType: CountEventType[] = [];
  public selectOptionEventType: IRadioButton[] = [];
  public selectedOption: EEventType;
  public subTitle: string = '';
  public disableNextBtn: boolean = true;
  public RMEvents = ERMEvents;
  private destroy$: Subject<void> = new Subject<void>();
  public listRmInspectionTypes: string[] = [];

  constructor(private _calendarService: CalendarService) {}

  ngOnInit(): void {
    this._calendarService
      .getListRmInspectionType()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.listRmInspectionTypes = res;
        this.listEvents.forEach((event) => {
          let label: string;
          if (!this.isAgencyRm) {
            label = EEventTypes[event.eventType];
          } else {
            if (!this.listRmInspectionTypes.includes(event.eventType)) {
              label = ERMEvents[event.eventType];
            } else {
              const check = event.eventType
                .toLowerCase()
                .includes('inspection');
              label = check ? event.eventType : `${event.eventType} inspection`;
            }
          }
          event.label = label;
        });
        this.listEvents.forEach((event) => {
          if (event.eventType) {
            const existTypeIndex = this.listCountEventType.findIndex(
              (item) => item.type === event.eventType
            );
            if (existTypeIndex !== -1) {
              this.listCountEventType[existTypeIndex].quantity++;
            } else {
              this.listCountEventType.push({
                type: event.eventType,
                label: event.label,
                quantity: 1
              });
            }
          }
        });
        this.selectOptionEventType = this.listCountEventType.map((item) => ({
          label: `${item.label} (${item.quantity} ${
            item.quantity > 1 ? 'events' : 'event'
          } selected)`,
          value: item.type
        }));
      });
    const totalEvents = this.listEvents.length;
    this.subTitle = `${totalEvents} event${
      totalEvents >= 2 ? 's' : ''
    } selected`;
  }

  public onSelectRadioOption() {
    this.disableNextBtn = false;
  }

  public handleNext() {
    this.onNext.emit(this.selectedOption);
  }

  public handleCancel() {
    this.onCancel.emit();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
