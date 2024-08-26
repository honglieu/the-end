import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { IAiReply } from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'automated-reply-row',
  templateUrl: './automated-reply-row.component.html',
  styleUrls: ['./automated-reply-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutomatedReplyRowComponent implements OnInit, OnDestroy {
  @Input() aiReply: IAiReply;
  @Input() isLoading: boolean;
  @Input() disabled: boolean;
  @Input() isCurrentQuestion: boolean;
  private destroy$: Subject<void> = new Subject<void>();
  public pipeDateFormat: string;

  constructor(
    private _agencyDateFormatService: AgencyDateFormatService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this._agencyDateFormatService.dateFormat$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        if (res && !this.pipeDateFormat) {
          this.pipeDateFormat = res.DATE_FORMAT_PIPE;
          this._changeDetectorRef.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
