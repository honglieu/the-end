import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  IRequestItem,
  IResponse
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-linked/widget-linked.interface';
import { EConversationType, EOptionType, ITicketResponse } from '@/app/shared';
import { mapTicketToDisplayItemVoiceMail } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/utils/function';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { mapTicketToDisplayItem } from '@/app/dashboard/modules/inbox/modules/facebook-view/utils/function';

@Component({
  selector: 'widget-linked-content',
  templateUrl: './widget-linked-content.component.html',
  styleUrls: ['./widget-linked-content.component.scss']
})
export class WidgetLinkedContentComponent implements OnChanges {
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}
  @Input() requestItem: IResponse;
  public requestItemToDisplay: IRequestItem;
  public createdFrom: EConversationType = null;
  public readonly EConversationType = EConversationType;
  public readonly EOptionType = EOptionType;
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requestItem']?.currentValue) {
      this.mapRequestItemToDisplay();
    }
  }

  mapRequestItemToDisplay() {
    this.createdFrom = this.requestItem.payload.ticket
      .createdFrom as EConversationType;
    const response = this.requestItem as unknown as ITicketResponse;
    const dateFormat =
      this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS;
    const options = { checkStatus: false };

    this.requestItemToDisplay =
      this.createdFrom === EConversationType.VOICE_MAIL
        ? mapTicketToDisplayItemVoiceMail(response, dateFormat, options)
        : mapTicketToDisplayItem(response, dateFormat, options);
  }
}
