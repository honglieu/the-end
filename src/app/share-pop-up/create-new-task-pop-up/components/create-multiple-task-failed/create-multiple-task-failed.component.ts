import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { getSummaryMessage } from '@shared/feature/function.feature';
import { IListConversationConfirmProperties } from '@shared/types/conversation.interface';

@Component({
  selector: 'create-multiple-task-failed',
  templateUrl: './create-multiple-task-failed.component.html',
  styleUrls: ['./create-multiple-task-failed.component.scss']
})
export class CreateMultipleTaskFailedComponent implements OnChanges {
  @Input() isShowTaskFailed: boolean;
  @Input() conversationFaileds: IListConversationConfirmProperties[];
  @Output() onSkip = new EventEmitter<boolean>();
  @Output() onTryAgain = new EventEmitter<boolean>();

  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['conversationFaileds'] &&
      changes['conversationFaileds'].currentValue
    ) {
      this.conversationFaileds.forEach((item) => {
        item.textContent = getSummaryMessage(
          item,
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
        );
      });
    }
  }

  trackByItems(index: number, item) {
    return item.id;
  }

  handleSkip() {
    this.onSkip.emit(false);
  }

  handleTryAgain() {
    this.onTryAgain.emit(false);
  }
}
