import {
  AfterViewInit,
  Component,
  ElementRef,
  ErrorHandler,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth0Service } from '@services/auth0.service';
import { AuthService } from '@services/auth.service';
import { AgencyService } from '@services/agency.service';
import { LocalStorageService } from '@services/local.storage';
import { uuidv4Regex } from '@services/constants';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, of, retry, takeUntil } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { LoadingService } from '@services/loading.service';
import { ElectronService } from '@services/electron.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { emailRegex } from '@shared/feature/function.feature';
import * as Sentry from '@sentry/angular-ivy';
interface IPreLoginData {
  title: string;
  downloadLink: string;
}

interface IResponse {
  message: string;
  status: number;
}

enum ERegion {
  portalAU = 'au',
  portalUS = 'us'
}

/**
 * 0: network error
 * 504: gateway timeout
 */
const HTTP_RETRY_CODES = [0, 504];
const MAX_RETRY_LOGIN_COUNT = 2;

const preLoginData = {
  mac: {
    au: {
      title: 'Download Trudi® for Mac',
      downloadLink: 'https://apps.apple.com/au/app/trudi/id1670886527',
      storeImg: 'downloadMac'
    },
    us: {
      title: 'Download Trudi® for Mac',
      downloadLink: 'https://apps.apple.com/us/app/trudi/id6468665490',
      storeImg: 'downloadMac'
    }
  },
  windows: {
    au: {
      title: 'Download Trudi® for Windows',
      downloadLink:
        'https://apps.microsoft.com/detail/trudi-portal/9P3DQ8CR6WGD',
      storeImg: 'downloadWin'
    },
    us: {
      title: 'Download Trudi® for Windows',
      downloadLink: 'https://apps.microsoft.com/detail/trudi®/9NRX5K8BHNSN',
      storeImg: 'downloadWin'
    }
  }
};

@Component({
  selector: 'app-auth-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss', '../auth.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  private unsubscribe = new Subject<void>();
  @ViewChild('password') private passwordElement: ElementRef;
  timeInterval1: NodeJS.Timer;
  showPassword: boolean = false;
  loginError: boolean = false;
  loginErrorMessage: string = null;
  showBanner: boolean = false;
  passwordFocus: boolean = false;
  isPreLoginScreen: boolean = true;
  showLoading: boolean = false;
  preLoginData: IPreLoginData = preLoginData.windows.au;
  public form: FormGroup;
  public loginGooleButton: HTMLElement;
  public showLoginGoogle: boolean = window.location.href.includes('localhost');
  public emailFocus: boolean = false;

  private isPMOnboard: boolean = false;
  private sso: string = '';
  public emailForm: FormGroup;
  public visible: boolean = false;
  public disabledBtn: boolean = false;
  public isSubmit: boolean = false;
  private apiUrl =
    'https://www.staging21.trudi.ai/wp-json/custom-api/v1/send-email';
  public regionList = [
    {
      value: ERegion.portalAU,
      label: 'Australia',
      icon: 'logoAU'
    },
    {
      value: ERegion.portalUS,
      label: 'United States',
      icon: 'logoUS'
    }
  ];

  public portalAU = 'https://portal.trudi.ai';
  public portalUS = 'https://us.portal.trudi.ai';
  private retryLoginCount: number;
  constructor(
    public router: Router,
    private fb: FormBuilder,
    private auth0Service: Auth0Service,
    private authService: AuthService,
    private agc: AgencyService,
    private localStorageService: LocalStorageService,
    private titleService: Title,
    private loadingService: LoadingService,
    private electronService: ElectronService,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private metaService: Meta,
    private errorHandler: ErrorHandler
  ) {
    this.initForm();
    this.checkOS();

    this.emailForm = fb.group({
      emailMobile: [
        '',
        [
          Validators.required,
          Validators.compose([Validators.email, Validators.pattern(emailRegex)])
        ]
      ]
    });
  }

  ngAfterViewInit(): void {
    var loginGoogleBox = document.querySelector(
      '#auth0-lock-container-1'
    ) as HTMLElement;
    loginGoogleBox.style.setProperty('display', 'none', 'important');
    this.timeInterval1 = setInterval(() => {
      this.loginGooleButton = document.querySelector(
        '.auth0-lock-social-button'
      );
      if (this.loginGooleButton) {
        clearInterval(this.timeInterval1);
      }
    }, 200);
  }

  ngOnInit() {
    const isPortal = window.location.href.includes('portal');
    this.titleService.setTitle(isPortal ? 'Trudi®' : 'Console');
    const token = this.activatedRoute.snapshot.queryParams?.['token'];
    this.sso = this.activatedRoute.snapshot.queryParams?.['sso'];
    const autoLogin = this.activatedRoute.snapshot.queryParams?.['autologin'];
    const navigatePath =
      this.activatedRoute.snapshot.queryParams?.['navigatePath'];
    if (window.location.href.includes(this.portalUS)) {
      this.form.get('region')?.setValue(ERegion.portalUS);
      this.titleService.setTitle(
        'Trudi® Portal | Download the desktop app - USA'
      );
      this.metaService.updateTag({
        name: 'description',
        content: 'Download Trudi’s desktop app for the optimum user experience'
      });
    } else {
      this.form.get('region')?.setValue(ERegion.portalAU);
      this.titleService.setTitle(
        'Trudi® Portal | Download the Desktop App - Australia'
      );
      this.metaService.updateTag({
        name: 'description',
        content:
          'Trudi’s desktop app is designed to facilitate the optimum user experience'
      });
    }
    if (this.sso) {
      this.isPreLoginScreen = false;
    }

    if (token && !autoLogin) {
      this.showLoading = true;
      this.localStorageService.setValue('_idToken', token);

      this.isPMOnboard = true;
      window.location.href = '/';
    }
    // this.auth0Service.login();
    this.onResizeLogin();
    if (this.electronService.checkElectronApp()) {
      this.authService
        .getRememberStore()
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res.error) {
            const error = new Error(
              res.error?.message || 'Desktop app get remember failed'
            );
            this.errorHandler.handleError(error);
            return;
          }
          if (!res.data) return;
          const { email, password, rememberMe } = res.data || {};
          if (rememberMe) {
            // auto login in electron app if 403 error
            if (autoLogin && email && password) {
              this.onLogin(null, email, password, navigatePath);
              return;
            }
            this.form.get('email')?.setValue(email);
            this.form.get('password')?.setValue(password);
          } else {
            this.authService.deleteRememberStore();
          }
        });
    }
  }

  @HostListener('window:resize', ['$event'])
  onResizeLogin(event?) {
    if (window.innerWidth >= 480) {
      this.auth0Service.login();
    }
  }

  sendEmail(data) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(this.apiUrl, data, { headers });
  }

  handleClose() {
    this.visible = false;
    this.emailForm.reset();
    this.disabledBtn = false;
  }

  get getEmailMB() {
    return this.emailForm.get('emailMobile').value;
  }

  submitEmail() {
    this.isSubmit = true;
    if (this.emailForm.valid) {
      this.isSubmit = false;
      const email = {
        to_email: this.getEmailMB
      };
      this.disabledBtn = true;

      this.sendEmail(email).subscribe({
        next: (res: IResponse) => {
          this.disabledBtn = false;
          if (res?.status === 200) {
            this.visible = true;
          }
        },
        error: (error) => {
          console.error('Email sending failed', error);
        }
      });
    }
  }

  handleOnloadBanner() {
    this.showBanner = true;
  }

  initForm() {
    this.form = this.fb.group({
      email: this.fb.control('', [Validators.required]),
      password: this.fb.control('', [Validators.required]),
      rememberMe: this.fb.control(true),
      region: this.fb.control(ERegion.portalAU)
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

  onLogin(
    apiHost?: string,
    email?: string,
    password?: string,
    navigatePath?: string
  ) {
    if (!apiHost) {
      const isLoading = this.loadingService.isLoading.value;
      if (isLoading) return;
    }
    const url = apiHost ? `${apiHost}/auth/` : '';
    this.loadingService.onLoading();
    this.retryLoginCount = 0;
    this.authService
      .login(
        {
          email: email || this.getEmail,
          password: password || this.getPassword,
          sso: this.sso
        },
        url
      )
      .pipe(
        takeUntil(this.unsubscribe),
        catchError((error) => {
          if (
            HTTP_RETRY_CODES.includes(error?.status) &&
            this.retryLoginCount < MAX_RETRY_LOGIN_COUNT
          ) {
            this.retryLoginCount++;
            Sentry.captureMessage('Retry Login', {
              extra: {
                email: email || this.getEmail,
                message: error?.message || '',
                status: error?.status,
                error: error
              },
              level: 'debug'
            });
            throw error;
          }
          this.handleLoginError(error, email);
          return of(null);
        }),
        retry({
          count: MAX_RETRY_LOGIN_COUNT,
          delay: 1000
        })
      )
      .subscribe({
        next: (res) => {
          if (res && res.id_token) {
            this.saveDataLocalStore(res);
            if (this.sso) {
              window.location.href = res.returnUrl;
              return;
            }
            const propId = localStorage.getItem('propId');
            const companyId = localStorage.getItem('companyId');
            const legitIds =
              uuidv4Regex.test(propId) && uuidv4Regex.test(companyId);
            if (navigatePath) {
              window.location.href = navigatePath;
            } else if (legitIds) {
              this.router.navigate([`/dashboard/messages/${propId}`]);
              localStorage.setItem('propId', '');
            } else {
              this.router.navigate(['dashboard', 'inbox']);
            }
          }
          this.loadingService.stopLoading();
        }
      });
  }

  private handleLoginError(error, email: string) {
    this.loginError = true;
    this.loginErrorMessage = error?.error?.message || '';
    if (!this.loginErrorMessage || this.loginErrorMessage === '') {
      Sentry.captureMessage('Login error', {
        extra: {
          email: email || this.getEmail,
          message: error?.message || '',
          status: error?.status,
          error: error
        },
        level: 'debug'
      });
    }
  }

  handleChangeRegion() {
    if (this.region === ERegion.portalAU) {
      window.location.href = this.portalAU + `/?sso=${this.sso}`;
    } else {
      window.location.href = this.portalUS + `/?sso=${this.sso}`;
    }
  }

  onLoginGoogle() {
    this.loginGooleButton.click();
  }

  get getEmail() {
    return this.form.get('email').value;
  }

  get getPassword() {
    return this.form.get('password').value;
  }

  saveDataLocalStore(res) {
    this.localStorageService.setValue('_idToken', res.id_token);
    this.localStorageService.setValue('companyId', res.companyIds[0]);
    if (this.rememberMe) {
      this.localStorageService.setValue('refresh_token', res.refresh_token);
      this.localStorageService.setValue('rememberme', this.rememberMe);
    }
    if (!!this.electronService.checkElectronApp()) {
      const obj = {
        email: this.getEmail,
        password: this.getPassword,
        rememberMe: this.rememberMe
      };
      this.authService
        .setRememberStore(obj)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res.error) {
            const error = new Error(
              res.error?.message || 'Desktop app save remember failed'
            );
            this.errorHandler.handleError(error);
          }
        });
    }
  }

  get rememberMe() {
    return this.form.get('rememberMe').value;
  }

  get region() {
    return this.form.get('region').value;
  }

  checkOS() {
    this.isPreLoginScreen = !this.electronService.checkElectronApp();
    if (navigator.platform.indexOf('Win') != -1) {
      if (window.location.href.includes(this.portalUS)) {
        this.preLoginData = preLoginData.windows.us;
      } else {
        this.preLoginData = preLoginData.windows.au;
      }
    } else if (navigator.appVersion.indexOf('Mac') != -1) {
      if (window.location.href.includes(this.portalUS)) {
        this.preLoginData = preLoginData.mac.us;
      } else {
        this.preLoginData = preLoginData.mac.au;
      }
    } else {
      // User is not on Windows or Mac, possibly on mobile
    }
  }

  openDownloadLink(link: string) {
    window.open(link, '_blank');
  }

  continueWeb() {
    if (this.isPMOnboard) {
      this.isPMOnboard = false;
      window.location.href = '/';
    } else {
      this.isPreLoginScreen = false;
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timeInterval1);
  }
}
