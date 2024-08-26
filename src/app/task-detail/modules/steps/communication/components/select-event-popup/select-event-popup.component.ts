import {
  Component,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  EventEmitter,
  SimpleChanges,
  ElementRef,
  OnChanges
} from '@angular/core';
import { Subject } from 'rxjs';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  ICalendarEvent,
  ICalendarEventResponse
} from '@/app/task-detail/modules/steps/communication/interfaces/calendar-event.interface';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';

@Component({
  selector: 'select-event-popup',
  templateUrl: './select-event-popup.component.html',
  styleUrls: ['./select-event-popup.component.scss']
})
export class SelectEventPopupComponent implements OnChanges, OnDestroy {
  @Input() public listEvents: ICalendarEventResponse[] = [];
  @Input() public isRequired: boolean = false;
  @Output() public onChangeOption = new EventEmitter<{
    isChecked: boolean;
    eventDataRow: ICalendarEvent;
  }>();

  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;
  @ViewChild('calendarWrapper') calendarWrapper!: ElementRef;

  private destroy$ = new Subject<void>();
  public lengthOfList: number;
  public autoScroll: boolean;

  public newLinkEvent: ICalendarEvent[] = [];
  public newUnlinkEvent: ICalendarEvent[] = [];

  constructor(
    private trudiDynamicParameterService: TrudiDynamicParameterService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listEvents']?.currentValue) {
      this.listEvents = changes['listEvents']?.currentValue;
      const listEventsLength = changes['listEvents']?.currentValue?.flatMap(
        (item) => item?.events
      );
      this.lengthOfList = listEventsLength?.length * 60;
      if (listEventsLength?.length > 2) {
        this.autoScroll = true;
      }
    }
  }

  handleOptionChange(event: {
    isChecked: boolean;
    eventDataRow: ICalendarEvent;
  }) {
    this.onChangeOption.emit(event);
  }

  mapAndSetDynamicParameterPTWidget(widget) {
    if (!widget) return;
    const widgetTypes = {
      Routine: PTWidgetDataField.ROUTINE_INSPECTION,
      Ingoing: PTWidgetDataField.INGOING_INSPECTION,
      Outgoing: PTWidgetDataField.OUTGOING_INSPECTION
    };
    this.trudiDynamicParameterService.setDynamicParamaterPTWidget(
      widgetTypes[widget.type] || PTWidgetDataField.COMPLIANCES,
      widget
    );
  }

  ngOnDestroy() {
    this.destroy$.next(null);
  }
}
