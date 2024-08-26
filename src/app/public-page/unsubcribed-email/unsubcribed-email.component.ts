import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingService } from '@services/loading.service';
import { Subject, takeUntil } from 'rxjs';
import { EmailNotificationSettingService } from '@/app/public-page/email-notification-settings/email-notification-setting.service';

@Component({
  selector: 'unsubcribed-email',
  templateUrl: './unsubcribed-email.component.html',
  styleUrls: ['./unsubcribed-email.component.scss']
})
export class UnsubcribedEmailComponent implements OnInit {
  private unsubcribe = new Subject<void>();
  private userId: string;
  private agencyId: string;

  constructor(
    private router: Router,
    private emailNotificationSettingService: EmailNotificationSettingService,
    public loadingService: LoadingService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.queryParams['userId'];
    this.agencyId = this.route.snapshot.queryParams['agencyId'];
    this.getEmailNotificationSetting();
  }

  getEmailNotificationSetting() {
    this.loadingService.onLoading();
    this.emailNotificationSettingService
      .getUnsubcribeMonthyInsight(this.userId)
      .pipe(takeUntil(this.unsubcribe))
      .subscribe({
        next: () => {
          this.loadingService.stopLoading();
        },
        error: () => {
          this.loadingService.stopLoading();
        }
      });
  }

  backToEmailNotificationSetting() {
    this.router.navigate(['/email-notification-setting'], {
      queryParamsHandling: 'preserve'
    });
  }

  ngOnDestroy() {
    this.unsubcribe.next();
    this.unsubcribe.complete();
  }
}
