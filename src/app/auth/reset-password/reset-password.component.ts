import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { LoadingService } from '@services/loading.service';

@Component({
  selector: 'app-auth-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss', '../auth.component.scss']
})
export class ResetPasswordComponent implements OnDestroy {
  private unsubscribe = new Subject<void>();
  @ViewChild('password') private passwordElement: ElementRef;
  @ViewChild('confirmPassword') private confirmPasswordElement: ElementRef;
  inputs = {
    password: {
      value: '',
      error: false,
      change: false
    },
    confirmPassword: {
      value: '',
      error: false,
      change: false
    }
  };

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  errorMessage: string = null;
  passwordFocus: boolean = false;
  confirmPasswordFocus: boolean = false;

  // private PasswordPartern =
  //   /(?=.*[A-Z])((?=.*\d|[A-Za-z\d#$@!%&*?]))((?=.*[#$@!%&*?])|[A-Za-z\d#$@!%&*?]){8,30}/;
  private PasswordPartern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9#$@!%&*?])[^\s]{8,}$/;

  private token = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    public router: Router,
    private loadingService: LoadingService
  ) {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((params) => {
        this.token = params['token'];
      });
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
    if (this.showPassword) {
      this.passwordElement.nativeElement.type = 'text';
    } else {
      this.passwordElement.nativeElement.type = 'password';
    }
  }

  toggleShowConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
    if (this.showConfirmPassword) {
      this.confirmPasswordElement.nativeElement.type = 'text';
    } else {
      this.confirmPasswordElement.nativeElement.type = 'password';
    }
  }

  onchangeInput(event: Event) {
    const element = event.target as HTMLInputElement;
    this.inputs[element.name].value = element.value;
    this.inputs[element.name].change = true;
    if (element.name === 'password') {
      if (
        element.value.length > 7 &&
        this.PasswordPartern.test(element.value)
      ) {
        this.inputs.password.error = false;
      } else {
        this.inputs.password.error = true;
      }

      if (this.inputs.confirmPassword.change) {
        if (this.inputs.confirmPassword.value === element.value) {
          this.inputs.confirmPassword.error = false;
        } else {
          this.inputs.confirmPassword.error = true;
        }
      }
    } else if (element.name === 'confirmPassword') {
      if (this.inputs.password.value === element.value) {
        this.inputs.confirmPassword.error = false;
      } else {
        this.inputs.confirmPassword.error = true;
      }
    }
  }

  checkValid() {
    let onChange = true;
    for (const key in this.inputs) {
      if (!this.inputs[key].change) onChange = false;
    }
    return (
      !onChange ||
      this.inputs.password.error ||
      this.inputs.confirmPassword.error
    );
  }

  resetPassword() {
    this.loadingService.onLoading();
    this.authService
      .resetPassword(this.inputs.password.value, this.token)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.loadingService.stopLoading();
          this.router.navigate(['']);
        },
        error: (res: any) => {
          this.errorMessage = res?.error?.message ?? 'error';
          this.loadingService.stopLoading();
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
