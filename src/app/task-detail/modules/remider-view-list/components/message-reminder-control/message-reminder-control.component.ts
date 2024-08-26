import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import {
  EReminderFilterParam,
  ReminderMessageType
} from '@/app/dashboard/modules/inbox/enum/reminder-message.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { whiteListInMsgDetail } from '@shared/constants/outside-white-list.constant';
import {
  ListReminderDay,
  listSelectRemiderSetting
} from '@shared/types/reminders.interface';
import { ReminderMessageService } from '@/app/task-detail/services/reminder-message.service';

@Component({
  selector: 'message-reminder-control',
  templateUrl: './message-reminder-control.component.html',
  styleUrls: ['./message-reminder-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MessageReminderControlComponent implements OnInit {
  @ViewChild(CdkOverlayOrigin) trigger: CdkOverlayOrigin;
  @Output() toggleIgnore = new EventEmitter();
  @Output() selectedReminderTime = new EventEmitter();
  public listReminderDay: ListReminderDay[] = listSelectRemiderSetting;
  private readonly destroy$ = new Subject<void>();
  public selectedDays = {
    unanswered: '30 minutes',
    followUp: '3 days'
  };
  public isDropdownVisible: boolean = false;
  readonly ReminderMessageType = ReminderMessageType;
  public isIgnore = {
    unanswered: false,
    followUp: false
  };
  public selectedMinutes = {
    unanswered: 30,
    followUp: 4320
  };
  public textHeader: string =
    'You haven’t replied to these emails in your tasks. Reply now?';
  public textToolTip: string =
    'Once you have recieved a reply, they will no longer show on this list.';
  public textReminderPopup: string =
    'Display reminder when a reply has not been received after';
  public queryParam: Params;
  readonly EReminderFilterParam = EReminderFilterParam;
  public readonly whiteListMsgDetail = [
    ...whiteListInMsgDetail,
    '#focusViewSetting'
  ];
  constructor(
    private reminderMessageService: ReminderMessageService,
    public inboxService: InboxService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initMessageReminderSetting();
    this.reminderMessageService.isShowReminderSetting$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isDropdownVisible = res;
        this.cdr.markForCheck();
      });
  }

  initMessageReminderSetting() {
    combineLatest([
      this.activatedRoute.queryParams,
      this.inboxService.getCurrentMailBoxId(),
      this.reminderMessageService.getMessReminderSetting()
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([queryParam, mailboxId, messageReminderSetting]) => {
        if (!mailboxId || !queryParam || !messageReminderSetting) return null;
        this.queryParam = queryParam;
        this.textHeader =
          queryParam[EReminderFilterParam.REMINDER_TYPE] ===
          ReminderMessageType.UNANSWERED
            ? 'You haven’t replied to these emails in your tasks. Reply now?'
            : 'You haven’t received a reply to these emails. Follow up?';
        this.textToolTip =
          queryParam[EReminderFilterParam.REMINDER_TYPE] ===
          ReminderMessageType.UNANSWERED
            ? 'Once you have sent a reply, they will no longer show on this list.'
            : 'Once you have recieved a reply, they will no longer show on this list.';
        this.textReminderPopup =
          queryParam[EReminderFilterParam.REMINDER_TYPE] ===
          ReminderMessageType.UNANSWERED
            ? 'Display reminder when email in task remains unanswered after'
            : 'Display reminder when a reply has not been received after';

        this.isIgnore.unanswered = messageReminderSetting?.unanswered?.isIgnore;
        this.isIgnore.followUp = messageReminderSetting?.follow_up?.isIgnore;
        this.selectedMinutes.unanswered =
          messageReminderSetting?.unanswered?.reminderTime;
        this.selectedMinutes.followUp =
          messageReminderSetting?.follow_up?.reminderTime;
        this.listReminderDay.forEach((remiderTime) => {
          if (remiderTime?.minutes === this.selectedMinutes.unanswered) {
            this.selectedDays.unanswered = remiderTime?.value;
          }
          if (remiderTime?.minutes === this.selectedMinutes.followUp) {
            this.selectedDays.followUp = remiderTime?.value;
          }
        });
        this.cdr.markForCheck();
      });
  }

  handleVisibleChange(isVisible: boolean) {
    this.cdr.markForCheck();
    this.isDropdownVisible = false;
  }

  handleClickOutSide() {
    this.isDropdownVisible = false;
  }

  toggleIgnoreMessage() {
    if (
      this.queryParam[EReminderFilterParam.REMINDER_TYPE] ===
      ReminderMessageType.UNANSWERED
    ) {
      this.isIgnore.unanswered = !this.isIgnore.unanswered;
    } else {
      this.isIgnore.followUp = !this.isIgnore.followUp;
    }
    this.toggleIgnore.emit(this.isIgnore);
  }

  changeReminderTime(selectedValue) {
    if (
      this.queryParam[EReminderFilterParam.REMINDER_TYPE] ===
      ReminderMessageType.UNANSWERED
    ) {
      this.selectedDays.unanswered = selectedValue.value;
    } else {
      this.selectedDays.followUp = selectedValue.value;
    }
    this.selectedReminderTime.emit(this.selectedDays);
  }

  overlayOutsideClick(event: MouseEvent) {
    const buttonElement = this.trigger.elementRef.nativeElement as HTMLElement;
    const targetElement = event.target as HTMLElement;
    if (!buttonElement.contains(targetElement)) {
      this.isDropdownVisible = false;
    }
  }
}
