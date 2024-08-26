import { Component, OnInit } from '@angular/core';
import { LoadingService } from '@services/loading.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'verify-email-response',
  templateUrl: './verify-email-response.component.html',
  styleUrls: ['./verify-email-response.component.scss']
})
export class VerifyEmailResponseComponent implements OnInit {
  private email: string;

  constructor(
    public loadingService: LoadingService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.email = this.activatedRoute.snapshot.queryParams['email'];
  }

  backToEmailNotificationSetting() {
    this.router.navigate(['/email-notification-setting'], {
      relativeTo: this.activatedRoute,
      queryParams: { email: this.email }
    });
  }
}
