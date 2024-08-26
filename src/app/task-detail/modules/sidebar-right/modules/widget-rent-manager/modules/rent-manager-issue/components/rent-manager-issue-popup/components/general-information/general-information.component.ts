import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { Component, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { RentManagerIssueService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue.service';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import { IRentManagerIssueStatus } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue.interface';
import { POSITION_MAP } from '@services/constants';
import { AISummaryFacadeService } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary-facade.service';

@Component({
  selector: 'general-information',
  templateUrl: './general-information.component.html',
  styleUrls: ['./general-information.component.scss']
})
export class GeneralInformationComponent implements OnInit {
  constructor(
    private rentManagerIssueService: RentManagerIssueService,
    private rentManagerIssueFormService: RentManagerIssueFormService,
    private aiSummaryFacadeService: AISummaryFacadeService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}
  private destroy$ = new Subject<void>();
  public statusItems: IRentManagerIssueStatus[] = [];
  public POSITION_MAP = POSITION_MAP;
  public openTime: number;
  public closeTime: number;

  ngOnInit(): void {
    this.rentManagerIssueService.rmIssueData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && res.status) {
          this.statusItems = res.status;
        }
      });
    this.prefillTimePicker();
  }

  prefillTimePicker() {
    this.openTime = this.convertTimeToSeconds(this.openTimeControl?.value);
    this.closeTime = this.convertTimeToSeconds(this.closeTimeControl?.value);
  }

  get generalInformationForm() {
    return this.rentManagerIssueFormService.form.get('general');
  }

  get openDateControl() {
    return this.generalInformationForm?.get('openDate');
  }

  get closeDateControl() {
    return this.generalInformationForm?.get('closeDate');
  }

  get openTimeControl() {
    return this.generalInformationForm?.get('openTime');
  }

  get closeTimeControl() {
    return this.generalInformationForm?.get('closeTime');
  }

  get isSubmittedRentIssueForm() {
    return this.rentManagerIssueFormService.isSubmittedRentIssueForm;
  }

  handleChangeHour(event: number, controlName: 'closeTime' | 'openTime') {
    if (typeof event === 'number') {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setSeconds(date.getSeconds() + event);

      const timeString = date
        .toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
        .toLowerCase();
      this.generalInformationForm?.get(controlName).setValue(timeString);
    }
  }

  /**
   * @param timeStr string with format hh:mm a
   * @returns total seconds or null
   */
  convertTimeToSeconds(timeStr: string): number | null {
    try {
      if (!timeStr) return null;
      const [time, modifier] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');

      if (!hours || !minutes || !modifier) {
        return null;
      }

      let parsedHours = parseInt(hours, 10);
      if (hours === '12') {
        parsedHours = 0;
      }
      if (modifier === 'pm') {
        parsedHours += 12;
      }

      return parsedHours * 60 * 60 + parseInt(minutes, 10) * 60;
    } catch {
      return null;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
