import { VoicemailApiService } from '@/app/dashboard/modules/agency-settings/components/voicemail/voicemail-api.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'sms',
  templateUrl: './sms.component.html',
  styleUrl: './sms.component.scss'
})
export class SmsComponent implements OnInit, OnDestroy {
  phoneNumber = '';
  isLoading = false;
  destroy$ = new Subject<void>();

  constructor(
    private toastService: ToastrService,
    private voicemailApiService: VoicemailApiService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.voicemailApiService
      .getVoicemailSetting()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((setting) => {
        const areaCode = setting?.company?.areaCode;
        this.phoneNumber =
          (areaCode || '') + setting.company.voiceMailPhoneNumber;
      });
  }

  copyToClipboard() {
    if (!this.phoneNumber) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(this.phoneNumber).then(() => {
        this.toastService.success('SMS number copied');
      });
    } else {
      this.toastService.error('Browser does not support copy to clipboard');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
