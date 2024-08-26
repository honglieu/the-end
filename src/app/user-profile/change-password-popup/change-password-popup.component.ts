import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ErrorHandler,
  OnDestroy
} from '@angular/core';
import { AuthService } from '@services/auth.service';
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  tap,
  map
} from 'rxjs';
import { UserService } from '@services/user.service';
import { CurrentUser } from '@shared/types/user.interface';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { UserProfileValidators } from '@shared/validators/user-profile-validator';
import { LoadingService } from '@services/loading.service';
import { IRememberStore } from '@shared/types/auth.interface';
import { ElectronService } from '@services/electron.service';
import { ToastrService } from 'ngx-toastr';

enum EPassWordInutType {
  CURRENTPASSWORD = 'CURRENTPASSWORD',
  NEWPASSWORD = 'NEWPASSWORD',
  CONFIRMNEWPASSWORD = 'CONFIRMNEWPASSWORD'
}
@Component({
  selector: 'app-change-password-popup',
  templateUrl: './change-password-popup.component.html',
  styleUrls: ['./change-password-popup.component.scss']
})
export class ChangePasswordPopup implements OnInit, OnDestroy {
  @Output() isCloseModal = new EventEmitter<boolean>();

  changePasswordForm: FormGroup;

  private unsubscribe = new Subject<void>();
  private currentUser: CurrentUser;
  private currentUserInStore: IRememberStore;
  showPassword = {
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false
  };
  passwordType = EPassWordInutType;
  public firstTimeClickSavePassword: boolean = false;

  errorMapping = {
    password: {
      required: 'Required field',
      invalid: 'Incorrect password'
    },
    newPassword: {
      required: 'Required field',
      isInValidPassword:
        'Minimum 8 characters, must include a capital letter and a number or a symbol'
    },
    confirmPassword: {
      required: 'Required field',
      isNotSame: 'Please make sure your passwords match'
    }
  };
  constructor(
    private authService: AuthService,
    public userService: UserService,
    private loadingService: LoadingService,
    private electronService: ElectronService,
    private errorHandler: ErrorHandler,
    private toastService: ToastrService
  ) {}

  ngOnInit() {
    this.changePasswordForm = new FormGroup({
      currentPassword: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [
        UserProfileValidators.validPassword(),
        Validators.required
      ]),
      confirmNewPassword: new FormControl('', [
        UserProfileValidators.confirmPassword(),
        Validators.required
      ])
    });
    this.userService.userInfo$.subscribe((res) => {
      this.currentUser = res;
    });
    this.password.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((passwordValue) => {
          if (!passwordValue) {
            return of(null);
          }
          return this.authService.checkCurrentPassword(
            this.currentUser?.email,
            passwordValue
          );
        })
      )
      .subscribe((res) => {
        if (!res) return;
        if (res?.correct) {
          this.password.setErrors(null);
        } else {
          this.password.setErrors({ invalid: true });
        }
      });

    this.newPassword.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value) => {
        if (value !== this.confirmPassword.value) {
          this.confirmPassword.setErrors({ isNotSame: true });
          this.changePasswordForm.updateValueAndValidity();
        } else {
          this.confirmPassword.setErrors(null);
          this.changePasswordForm.updateValueAndValidity();
        }
      });

    this.authService
      .getRememberStore()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.currentUserInStore = res;
      });
  }

  handleChangePassword() {
    this.firstTimeClickSavePassword = true;
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }
    this.loadingService.onLoading();
    const newPassword = this.newPassword.value;
    this.authService
      .resetPasswordInApp(newPassword)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap(() => {
          if (this.electronService.checkElectronApp()) {
            const newDataToStore = {
              ...this.currentUserInStore.data,
              password: newPassword
            };
            return this.authService.setRememberStore(newDataToStore).pipe(
              takeUntil(this.unsubscribe),
              tap((res) => {
                if (res.error) {
                  const error = new Error(
                    res.error?.message || 'Desktop app save remember failed'
                  );
                  this.errorHandler.handleError(error);
                }
              }),
              map(() => true)
            );
          }
          return of(true);
        })
      )
      .subscribe({
        next: () => {
          this.loadingService.stopLoading();
          this.closeModal();
          this.toastService.success('Your password has been changed');
        },
        error: () => {
          this.loadingService.stopLoading();
        }
      });
  }

  get password() {
    return this.changePasswordForm.get('currentPassword');
  }

  get newPassword() {
    return this.changePasswordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.changePasswordForm.get('confirmNewPassword');
  }

  errorControl(
    control: AbstractControl,
    keyError: string[],
    errorClass: string
  ) {
    let isError: boolean = false;
    keyError.forEach((error) => {
      if (control.touched && control.hasError(error)) {
        isError = true;
      }
    });
    if (isError) {
      return errorClass;
    }
    return '';
  }

  errorMessage(control: AbstractControl, keyError: { [key: string]: string }) {
    let errorMessage: string = '';
    Object.entries(keyError).find((error) => {
      if (control.hasError(error[0])) {
        errorMessage = error[1];
      }
    });
    return errorMessage;
  }

  isError(control: AbstractControl, keyError: string[]) {
    let isError: boolean = false;
    keyError.forEach((error) => {
      if (control.touched && control.hasError(error)) {
        isError = true;
      }
    });
    return isError;
  }
  toggleShowPassword(type: EPassWordInutType) {
    switch (type) {
      case EPassWordInutType.CURRENTPASSWORD:
        this.showPassword = {
          ...this.showPassword,
          currentPassword: !this.showPassword.currentPassword
        };
        break;
      case EPassWordInutType.NEWPASSWORD:
        this.showPassword = {
          ...this.showPassword,
          newPassword: !this.showPassword.newPassword
        };
        break;
      case EPassWordInutType.CONFIRMNEWPASSWORD:
        this.showPassword = {
          ...this.showPassword,
          confirmNewPassword: !this.showPassword.confirmNewPassword
        };
        break;
      default:
        break;
    }
  }

  closeModal() {
    this.isCloseModal.emit(true);
    this.firstTimeClickSavePassword = false;
    this.resetField();
  }

  resetField() {
    this.changePasswordForm.reset();
    this.showPassword = {
      currentPassword: false,
      newPassword: false,
      confirmNewPassword: false
    };
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
