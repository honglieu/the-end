import {
  Component,
  OnInit,
  Input,
  TemplateRef,
  Output,
  EventEmitter,
  SimpleChanges
} from '@angular/core';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { groupReminderTimesByTime } from '@shared/feature/function.feature';
import { ReminderTimeDetail } from '@shared/types/routine-inspection.interface';
import { TrudiButton } from '@shared/types/trudi.interface';

@Component({
  selector: 'trudi-suggested-step',
  templateUrl: './trudi-suggested-step.component.html',
  styleUrls: ['./trudi-suggested-step.component.scss'],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'trudi-suggested-step',
    '[class.hide-process-line]': 'hideProcessLine',
    '[class.trudi-suggested-step-disabled]': 'disabled',
    '[class.trudi-suggested-step-finished]': 'model.isCompleted'
  }
})
export class TrudiSuggestedStepComponent implements OnInit {
  @Input() model: TrudiButton;
  @Input() reiFormDetail: string;
  @Input() disabled: boolean = false;
  @Input() showIconTitle: boolean = false;
  @Input() hideProcessLine: boolean = false;
  @Input() propertyTreeStep: boolean = false;
  @Input() isStepRequired: boolean = false;
  @Input() description: string | TemplateRef<void>;
  @Output() onProcess = new EventEmitter<boolean>();

  public reminderTimes: ReminderTimeDetail[];
  public TrudiButtonEnumStatus = TrudiButtonEnumStatus;

  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['model']?.currentValue) {
      this.model.isCompleted =
        this.model.status === TrudiButtonEnumStatus.COMPLETED ||
        this.model.status === TrudiButtonEnumStatus.SCHEDULED;
      this.reminderTimes = groupReminderTimesByTime(this.model.reminderTimes);
    }
  }

  enableProcess() {
    if (this.disabled) return;
    this.onProcess.emit(true);
  }
}
