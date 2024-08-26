import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '@services/auth.service';
import { LoadingService } from '@services/loading.service';
import * as Sentry from '@sentry/angular-ivy';

@Component({
  selector: 'app-auth-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss', '../auth.component.scss']
})
export class ForgotComponent implements OnInit {
  private unsubscribe = new Subject<void>();
  public form: FormGroup;
  errorMessage: string;

  constructor(
    public router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private loadingService: LoadingService
  ) {
    this.initForm();
  }

  ngOnInit() {}

  initForm() {
    this.form = this.fb.group({
      email: this.fb.control('', [Validators.required, Validators.email])
    });
  }

  onForgotPassword() {
    this.loadingService.onLoading();
    this.authService
      .forgotPassword(this.getEmail)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.loadingService.stopLoading();
          this.router.navigate(['/auth/forgot-password-success']);
        },
        error: (res: any) => {
          this.errorMessage = res?.error?.message ?? '';
          this.loadingService.stopLoading();

          if (!this.errorMessage || this.errorMessage === '') {
            Sentry.captureMessage('Forgot password error', {
              extra: {
                email: this.getEmail,
                message: res?.message || '',
                status: res?.status,
                error: res
              },
              level: 'debug'
            });
          }
        }
      });
  }

  get getEmail() {
    return this.form.get('email').value;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
